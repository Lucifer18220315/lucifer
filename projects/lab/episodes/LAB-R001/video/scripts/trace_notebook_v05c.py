"""Recover ink-only graphics and paper-edge camera constraints from reference.
No photographed paper, skin, room pixels or full video frames become assets.
"""
from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter,gaussian_filter1d,label,grey_opening,grey_closing
from scipy.optimize import least_squares
ROOT=Path(__file__).resolve().parents[1];REF=ROOT/'out/v04-audit/reference-native';DEST=ROOT/'public/v05c-assets';DEST.mkdir(exist_ok=True)
frames=[];masks=[]
for i in range(31):
 f=200+i;a=np.array(Image.open(REF/f'{f:04}.jpg').convert('RGB')).astype(float);r,g,b=a.transpose(2,0,1)
 paper=(b>r+5)&(r>90)&(g>r-10);xs=np.arange(30,690,5);ys=np.array([next(iter(np.flatnonzero(paper[:350,x])),np.nan) for x in xs]);keep=np.isfinite(ys)
 for _ in range(4):
  coef=np.polyfit(xs[keep],ys[keep],1);err=ys-np.polyval(coef,xs);keep=np.isfinite(ys)&(np.abs(err)<max(8,np.nanmedian(np.abs(err))*2.5))
 row=np.median(r*.2126+g*.7152+b*.0722,axis=1);grad=np.gradient(gaussian_filter1d(row,6));fold=int(np.argmax(grad[980:1170])+980)
 skin=(r>150)&(r>g*1.13)&(r>b*1.13)&(g>90)&(b>65);xx=np.arange(720);yy=np.arange(1280)[:,None];edge=np.polyval(coef,xx);near=(yy>=edge-28)&(yy<=edge+6);sy,sx=np.nonzero(skin&near);grip=float(np.median(sx)) if len(sx)>12 else 450.
 frames.append({'frame':f,'top_y_x0_x720':np.polyval(coef,[0,720]).tolist(),'fold_candidate_y':fold,'fold_gradient':float(grad[fold]),'grip_native_x':grip})
 blue=b-(r+g)/2;base=grey_opening(gaussian_filter(blue,.6),size=(15,15));signal=np.maximum(0,blue-base-2);delta=gaussian_filter(r,3)-r
 alpha=np.clip(signal/25,0,1)*np.clip(delta/3,0,1)*((b>r+12)&(b>g+3));red_ink=np.clip((grey_closing(gaussian_filter(r,.25),size=(17,17))-r-1.2)/65,0,.65)*((b>r+8)&(b>g+2));alpha=np.maximum(alpha,red_ink);alpha=grey_closing(gaussian_filter(alpha,.15),size=(2,2))
 lab,n=label(alpha>.025);counts=np.bincount(lab.ravel());valid=(counts>=3);valid[0]=False;alpha*=valid[lab]
 dark=(r<125)&(g<150);level=np.clip(np.ceil(alpha*16),0,16).astype(np.uint8);idx=np.where(level>0,level+dark.astype(np.uint8)*16,0).astype(np.uint8)
 image=Image.fromarray(idx,'P');palette=[0,0,0]+[145,185,225]*16+[55,75,155]*16;palette += [0]*(768-len(palette));image.putpalette(palette)
 transparency=bytes([0]+[round(i/16*255) for i in range(1,17)]*2);p=DEST/f'ink-{i:02}.png';image.save(p,optimize=True,transparency=transparency)
 masks.append({'native_reference_frame':f,'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'ink_pixels':int(np.sum(alpha>.025)),'source_jpeg_sha256':hashlib.sha256((REF/f'{f:04}.jpg').read_bytes()).hexdigest()})
trusted=np.array([v['fold_gradient']>.60 for v in frames]);ids=np.arange(31);folds=np.interp(ids,ids[trusted],[v['fold_candidate_y'] for v,t in zip(frames,trusted) if t]);folds=gaussian_filter1d(folds,.65)
h=.14435602578911075

def project(points,p):
 eye=np.array([.008,.145,p[0]]);back=eye-np.array([0,p[1],0]);back/=np.linalg.norm(back);right=np.cross([np.sin(p[2]),np.cos(p[2]),0],back);right/=np.linalg.norm(right);up=np.cross(back,right);q=np.array(points)-eye;z=-(q@back);factor=640/np.tan(np.deg2rad(46)/2);return np.column_stack((360+q@right/z*factor,640-q@up/z*factor))
def line_y(points,p,x):
 q=project(points,p);return q[0,1]+(q[1,1]-q[0,1])*(x-q[0,0])/(q[1,0]-q[0,0])
top=[[-.1025,.018+h,.055],[.1025,.018+h,.055]];hinge=[[-.1025,.018,.055],[.1025,.018,.055]];poses=[]
for i,d in enumerate(frames):
 target=[*d['top_y_x0_x720'],float(folds[i])]
 def loss(p):return np.array([line_y(top,p,0),line_y(top,p,720),line_y(hinge,p,360)])-target
 fit=least_squares(loss,[.288,.07,-.015],bounds=([.18,-.05,-.25],[.45,.20,.25]),max_nfev=100)
 q=fit.x;goal=d['grip_native_x'];worldx=least_squares(lambda x:project([[x[0],.018+h,.055]],q)[0,0]-goal,[.012]).x[0]
 poses.append([float(q[0]),float(q[1]),float(q[2]),float(worldx)])
 d.update({'fold_used_y':float(folds[i]),'fold_imputed':not bool(trusted[i]),'camera_z_look_y_roll_grip_x':poses[-1],'residual_px':loss(q).tolist()})
(ROOT/'src/v05c/poses.ts').write_text('// Fitted to native paper-edge and binding constraints, not metric camera recovery.\nexport const BOOK_POSES='+json.dumps(poses)+';\n')
manifest={'source':'https://www.instagram.com/austen_paul/reel/DcjNPkZB_KF/','author':'Austen Paul','frames':[200,230],'method':'Ink-only chromatic highpass; alpha component cleanup and palette quantization. Stored colors are synthetic blue; no original photographic RGB is copied. Pose fit from paper top line and binding brightness transition.','camera_constraints':frames,'fold_uncertainty_px':15,'top_uncertainty_px':8,'geometry_note':'3D paper camera fitting, not registration of the comparison output. Printed ink is source-derived compositing; matching ink does not establish independent room-geometry recovery.','masks':masks}
(DEST/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(ROOT.parent/'v05/notebook-ink-report.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'assets':len(masks),'bytes':sum(m['bytes'] for m in masks),'max_pose_residual_px':max(abs(n) for f in frames for n in f['residual_px']),'imputed_fold_frames':[f['frame'] for f in frames if f['fold_imputed']]},indent=2))
