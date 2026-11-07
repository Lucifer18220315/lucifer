"""Audit this H.264 MP4 release and copy it without optional metadata.

No provenance is invented. No claim is made about pixel/audio watermarks or
platform classifiers. Existing source and release reports are preserved.
"""
import argparse
import collections
import hashlib
import json
import shutil
import struct
import subprocess
from pathlib import Path


def run(*args):
    return subprocess.check_output([str(a) for a in args])


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inventory(path):
    data = path.read_bytes()
    boxes = []
    nal_length = None

    def walk(start, end, parent=''):
        nonlocal nal_length
        at = start
        while at < end:
            if end - at < 8:
                assert not any(data[at:end]), ('Trailing bytes', at, end)
                break
            size, kind = struct.unpack_from('>I4s', data, at)
            header = 8
            if size == 1:
                size = struct.unpack_from('>Q', data, at + 8)[0]
                header = 16
            if size == 0:
                size = end - at
            assert header <= size <= end - at, ('Invalid MP4 box', at, size, kind)
            name = kind.decode('latin1')
            location = parent + '/' + name
            payload = data[at + header:at + size]
            row = {'path': location, 'offset': at, 'size': size, 'header': header,
                   'type': name}
            if kind == b'uuid':
                row['uuid_hex'] = payload[:16].hex()
            if kind == b'free':
                row['payload_is_zero'] = not any(payload)
            boxes.append(row)
            if kind == b'avcC':
                assert payload[0] == 1
                nal_length = (payload[4] & 3) + 1
            if kind in (b'moov', b'trak', b'mdia', b'minf', b'stbl', b'dinf',
                        b'edts', b'mvex', b'moof', b'traf', b'udta'):
                walk(at + header, at + size, location)
            elif kind == b'meta':
                walk(at + header + 4, at + size, location)
            elif kind == b'stsd':
                walk(at + header + 8, at + size, location)
            elif kind in (b'avc1', b'avc3'):
                walk(at + header + 78, at + size, location)
            elif kind == b'mp4a':
                assert struct.unpack_from('>H', data, at + header + 8)[0] == 0
                walk(at + header + 28, at + size, location)
            at += size

    walk(0, len(data))
    info = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format',
                          '-show_packets', '-of', 'json', path))
    video = next(s for s in info['streams'] if s['codec_type'] == 'video')
    assert video['codec_name'] == 'h264' and nal_length in (1, 2, 4)
    counts = collections.Counter()
    packet_count = 0
    for packet in info['packets']:
        if packet['stream_index'] != video['index']:
            continue
        packet_count += 1
        at = int(packet['pos'])
        end = at + int(packet['size'])
        while at < end:
            assert at + nal_length <= end
            n = int.from_bytes(data[at:at + nal_length], 'big')
            at += nal_length
            assert n > 0 and at + n <= end
            counts[str(data[at] & 31)] += 1
            at += n
        assert at == end
    markers = [b'c2pa', b'jumb', b'http://ns.adobe.com/xap', b'<x:xmpmeta',
               b'iptc', b'digitalSourceType', b'trainedAlgorithmicMedia',
               b'ChatGPT', b'OpenAI', b'Remotion', b'After Effects', b'CapCut']
    optional = []
    signatures = []
    for row in boxes:
        kind = row['type']
        payload = data[row['offset'] + row['header']:row['offset'] + row['size']]
        if kind in ('uuid', 'meta', 'udta', 'jumb', 'c2pa', 'XMP_'):
            optional.append(row)
        if kind == 'free' and any(payload):
            optional.append(row)
        # Search leaf metadata/configuration, never compressed media samples.
        if kind not in ('mdat', 'moov', 'trak', 'mdia', 'minf', 'stbl', 'dinf',
                        'edts', 'stsd', 'avc1', 'avc3', 'mp4a'):
            found = [m.decode('ascii') for m in markers if m.lower() in payload.lower()]
            if found:
                signatures.append({'path': row['path'], 'strings': found})
    return {'sha256': digest(path), 'bytes': len(data), 'boxes': boxes,
            'optional_metadata_boxes': optional, 'metadata_signature_hits': signatures,
            'video_packets_checked': packet_count, 'avcc_nal_length_bytes': nal_length,
            'h264_nal_type_counts': dict(sorted(counts.items(), key=lambda x: int(x[0]))),
            'h264_sei_units': counts['6'], 'format_tags': info['format'].get('tags', {}),
            'streams': [{k: s[k] for k in ('index', 'codec_name', 'codec_type', 'width',
                        'height', 'r_frame_rate', 'nb_frames', 'tags', 'side_data_list')
                        if k in s} for s in info['streams']]}


def erase_optional(path, rows):
    data = bytearray(path.read_bytes())
    removed = []
    covered_until = -1
    for row in rows:
        at, size, header = row['offset'], row['size'], row['header']
        if at < covered_until:
            continue
        data[at + 4:at + 8] = b'free'
        data[at + header:at + size] = bytes(size - header)
        removed.append(row['path'])
        covered_until = at + size
    path.write_bytes(data)
    return removed


def video_frames(path):
    raw = run('ffmpeg', '-v', 'error', '-i', path, '-map', '0:v:0', '-f', 'framemd5', '-')
    return [line for line in raw.decode().splitlines() if not line.startswith('#')]


def audio_packets(path):
    info = json.loads(run('ffprobe', '-v', 'error', '-select_streams', 'a:0',
                         '-show_packets', '-show_data_hash', 'sha256',
                         '-show_entries', 'packet=pts,dts,duration,data_hash',
                         '-of', 'json', path))
    return info['packets']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('report', type=Path)
    args = parser.parse_args()
    assert args.input.resolve() != args.output.resolve()
    assert not args.output.exists(), 'Use a new output filename; source releases are preserved'
    before = inventory(args.input)
    if before['h264_sei_units']:
        run('ffmpeg', '-v', 'error', '-fflags', '+bitexact', '-i', args.input,
            '-map', '0:v:0', '-map', '0:a:0', '-c', 'copy', '-map_metadata', '-1',
            '-map_chapters', '-1', '-bsf:v', 'filter_units=remove_types=6',
            '-metadata', 'encoder=', '-metadata:s:v:0', 'encoder=',
            '-metadata:s:a:0', 'encoder=', '-movflags', '+faststart', args.output)
        mode = 'lossless remux; H.264 SEI removed'
    else:
        shutil.copyfile(args.input, args.output)
        mode = 'copy; original already has no H.264 SEI'
    intermediate = inventory(args.output)
    removed = erase_optional(args.output, intermediate['optional_metadata_boxes'])
    after = inventory(args.output)
    assert not after['optional_metadata_boxes'] and not after['h264_sei_units']
    assert not after['metadata_signature_hits'], after['metadata_signature_hits']
    run('ffmpeg', '-v', 'error', '-i', args.output, '-f', 'null', '-')
    first, second = video_frames(args.input), video_frames(args.output)
    assert first == second and len(first) == 423
    a, b = audio_packets(args.input), audio_packets(args.output)
    assert a == b and len(a) == 382
    assert digest(args.input) == before['sha256'], 'Source changed'
    result = {'input': str(args.input), 'output': str(args.output), 'before': before,
              'after': after, 'operation': mode, 'removed_box_paths': removed,
              'byte_identical_to_input': before['sha256'] == after['sha256'],
              'decoded_video_frames_equal_including_timestamps': True,
              'decoded_video_frames': len(first), 'aac_packets_equal_including_timestamps': True,
              'aac_packets': len(a), 'full_decode': 'passed', 'transcoded': False,
              'fake_application_metadata_added': False,
              'invisible_pixel_audio_watermark_detection': 'not performed; no universal detector',
              'instagram_label_prediction': 'not established',
              'visual_review': 'Prior v05 review covers all423control frames and94hook frames; '
                               'same source SHA. No AI label observed; not a watermark detector.'}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ('output', 'operation', 'removed_box_paths',
                     'byte_identical_to_input', 'decoded_video_frames', 'aac_packets',
                     'full_decode')}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
