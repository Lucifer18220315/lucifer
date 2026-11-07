"""Finish an already running render; do not commit or publish anything."""
from pathlib import Path
import argparse,subprocess,time,json,os
p=argparse.ArgumentParser();p.add_argument('--after-pid',type=int,required=True);args=p.parse_args()
ROOT=Path(__file__).resolve().parents[1];os.chdir(ROOT)
while Path(f'/proc/{args.after_pid}').exists(): time.sleep(15)
report=json.loads((ROOT/'out/v05-clip-report.json').read_text())
assert len(report)==15 and len({r['sourceSha'] for r in report.values()})==1,'Render incomplete or mixed revision; cannot finish'
for script in ['package_v05.py','audit_overlay_v05.py','check_v05_browser.py']:
 print('Running',script,flush=True);subprocess.run(['python',str(ROOT/'scripts'/script)],check=True)
print('V05 exported, overlays generated, browser checks passed. Manual visual acceptance still required.',flush=True)
