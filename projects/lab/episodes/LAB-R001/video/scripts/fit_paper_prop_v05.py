from pathlib import Path
import numpy as np,json
from scipy.optimize import least_squares
v=json.loads(Path('src/v05/camera-fits.ts').read_text().split('export const CAMERA_FITS=')[1].split(';')[0]);goal=np.array([[[230,1000],[548,1127]],[[150,1048],[450,1270]],[[50,1080],[0,0]]])
def project(pts):
 out=[]
 for p in v['tabletop']:
  eye=np.array(p[:3]);back=eye-np.array(p[3:6]);back/=np.linalg.norm(back);right=np.cross([0,1.,0],back);right/=np.linalg.norm(right);up=np.cross(back,right);q=pts-eye;z=-(q@back);f=640/np.tan(np.deg2rad(p[6])/2);out.append(np.column_stack((360+q@right/z*f,640-q@up/z*f)))
 return np.array(out)
def predict(x):
 cx,cz,w,a=x;pts=np.array([[-w/2,.0007,-.095],[w/2,.0007,-.095]]);r=np.array([[np.cos(a),0,np.sin(a)],[0,1,0],[-np.sin(a),0,np.cos(a)]]);return project(pts@r.T+np.array([cx,0,cz]))
def loss(x):return (predict(x)-goal).reshape(-1)[:10]
f=least_squares(loss,[-.085,.225,.14,-.22],bounds=([-.3,.05,.05,-2],[.3,.4,.3,2]));print('Paper',f.x.tolist(),'residual',loss(f.x).round(1).tolist())
goalP=np.array([[549,773],[650,834],[690,890]])
def pencil(x):return project(np.array([[x[0],.0032,x[1]]]))[:,0,:]
p=least_squares(lambda x:(pencil(x)-goalP).ravel(),[.075,.049]);print('Pencil',p.x.tolist(),'residual',(pencil(p.x)-goalP).round(1).tolist())
Path('../v05/paper-prop-fit.json').write_text(json.dumps({'paper_params':f.x.tolist(),'paper_manual_px':goal.tolist(),'paper_predicted_px':predict(f.x).tolist(),'paper_residual_px':loss(f.x).tolist(),'pencil_tip_xz':p.x.tolist(),'pencil_manual_px':goalP.tolist(),'pencil_predicted_px':pencil(p.x).tolist(),'uncertainty_px':10},indent=2)+'\n')
