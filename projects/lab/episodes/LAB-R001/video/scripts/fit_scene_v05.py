"""Joint screen-space reconstruction from cup bounds and clock edges.
Manual landmarks are approximate. This is not a physical camera recovery.
"""
from pathlib import Path
import json
import numpy as np
from scipy.optimize import least_squares
points=np.array(json.loads((Path(__file__).resolve().parents[2]/'v05/calibration/cup-points.json').read_text())['points'])
targets=[(85,[284,421,466,770],[494,565],[494,733],None,-.025),(94,[265,513,417,825],[355,450],[355,611],[600,455],None),(123,[252,477,452,864],[465,406],[465,597],None,.04),(153,[240,454,480,886],[615,390],[615,595],None,.06)]
def project(v,pose,fov,tz):
 eye=np.array(pose[:3]);target=np.array([pose[3],pose[4],tz]);back=eye-target;back/=np.linalg.norm(back);right=np.cross([0.,1.,0.],back);right/=np.linalg.norm(right);up=np.cross(back,right);rel=v-eye;z=-(rel@back);factor=1/np.tan(np.deg2rad(fov)/2);return np.column_stack((360+rel@right/z*factor*640,640-rel@up/z*factor*640))
def predictions(x):
 sx,sz,cx,cz,ch,cw=x[:6];ps=points*np.array([.043*sx,.043,.043*sz])+np.array([0,-.00046,0]);result=[]
 for i,item in enumerate(targets):
  pose=x[6+i*5:11+i*5];fov=31 if i==0 else x[-1];tz=0 if i==0 else .008;p=project(ps,pose,fov,tz);b=np.r_[p.min(axis=0),p.max(axis=0)];a=project(np.array([[cx-cw/2,ch+.001,cz+.0165],[cx-cw/2,.001,cz+.0165],[cx+cw/2,ch+.001,cz+.0165]]),pose,fov,tz);result.append((b,a))
 return result
def residual(x):
 r=[]
 for (b,a),(_,box,cl,cb,tr,slope) in zip(predictions(x),targets):
  r.extend(b-np.array(box));r.extend(a[0]-cl);r.extend(a[1]-cb)
  if tr:r.extend(a[2]-tr)
  else:r.append((a[2,1]-cl[1])-slope*(a[2,0]-cl[0]))
 r.extend([(x[0]-.8)*8,(x[1]-.8)*8])
 return np.array(r)
lo=[.5,.5,.06,-.16,.03,.09]+[-.08,.06,.5,-.03,.02]+[-.6,.1,.15,-.2,-.02]*3+[25]
hi=[1.1,1.1,.2,.01,.12,.22]+[.08,.35,1.1,.03,.10]+[.6,.65,1.1,.2,.2]*3+[65]
runs=[]
for z in [-.035,-.09]:
 init=[.78,.78,.105,z,.06,.126,.018,.18,.8,-.005,.04,-.3,.3,.6,0,.07,-.1,.3,.45,0,.07,.2,.3,.3,0,.07,44]
 fit=least_squares(residual,init,bounds=(lo,hi),x_scale='jac',max_nfev=600,ftol=1e-8,xtol=1e-8,gtol=1e-8)
 runs.append(fit);print('Fit',z,'cost',fit.cost,'evals',fit.nfev,flush=True)
best=min(runs,key=lambda f:f.cost);x=best.x;old=json.loads(Path('../v05/camera-fit.json').read_text());fold=[r['params'] for r in old['fold']]
value={'cupScale':[float(x[0]),float(x[1])],'clock':{'x':float(x[2]),'z':float(x[3]),'height':float(x[4]),'width':float(x[5])},'opening':[float(n) for n in x[6:11]],'tabletop':[[*[float(n) for n in x[11+5*i:16+5*i]],.008,float(x[-1])] for i in range(3)],'fold':fold}
report={'method':'Joint fit of cup section, one clock layout and four poses. Manual cup bounds and clock edges ~+/-8 to10px. No unique physical calibration claim.','parameters':value,'cost':float(best.cost),'frames':[]}
for (b,a),(frame,box,cl,cb,tr,slope) in zip(predictions(x),targets):report['frames'].append({'frame':frame,'target_cup':box,'predicted_cup':b.tolist(),'target_clock_top_left':cl,'predicted_clock_top_left':a[0].tolist(),'target_clock_bottom_left':cb,'predicted_clock_bottom_left':a[1].tolist(),'predicted_clock_top_right':a[2].tolist()})
Path('src/v05/camera-fits.ts').write_text('// Joint screen projection fit; not unique physical camera recovery.\nexport const CAMERA_FITS='+json.dumps(value)+';\n');Path('../v05/joint-scene-fit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
