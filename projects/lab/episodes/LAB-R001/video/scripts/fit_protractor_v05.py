from pathlib import Path
import json,numpy as np
from scipy.optimize import least_squares
v=json.loads(Path('src/v05/camera-fits.ts').read_text().split('export const CAMERA_FITS=')[1].split(';')[0])
goals=np.array([[[271,895],[282,1024],[381,956]],[[267,915],[212,1050],[360,989]],[[198,948],[123,1080],[292,1022]]])
def predict(x):
 cx,cz,r,a=x;points=np.array([[-r,0,0],[r,0,0],[0,0,-r]]);rot=np.array([[np.cos(a),0,np.sin(a)],[0,1,0],[-np.sin(a),0,np.cos(a)]]);points=points@rot.T+np.array([cx,.0001,cz]);result=[]
 for p in v['tabletop']:
  eye=np.array(p[:3]);back=eye-np.array(p[3:6]);back/=np.linalg.norm(back);right=np.cross([0,1.,0],back);right/=np.linalg.norm(right);up=np.cross(back,right);rel=points-eye;z=-(rel@back);f=640/np.tan(np.deg2rad(p[6])/2);result.append(np.column_stack((360+rel@right/z*f,640-rel@up/z*f)))
 return np.array(result)
runs=[]
for a in [-2.,-1.,1.,2.]:
 fit=least_squares(lambda x:(predict(x)-goals).ravel(),[0,.1,.03,a],bounds=([-.2,-.1,.01,-4],[.2,.3,.08,4]));runs.append(fit)
best=min(runs,key=lambda f:f.cost);print(best.x.tolist(),'cost',best.cost);print(np.round(predict(best.x)).tolist());print(np.round(predict(best.x)-goals).tolist())
Path('../v05/protractor-fit.json').write_text(json.dumps({'params':best.x.tolist(),'manual_landmarks_px':goals.tolist(),'predicted_px':predict(best.x).tolist(),'rms_px':float(np.sqrt(np.mean((predict(best.x)-goals)**2))),'uncertainty_px':10},indent=2)+'\n')
