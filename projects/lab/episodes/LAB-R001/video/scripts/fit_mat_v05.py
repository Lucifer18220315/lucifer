from pathlib import Path
import numpy as np,json
from scipy.optimize import least_squares
v=json.loads(Path('src/v05/camera-fits.ts').read_text().split('export const CAMERA_FITS=')[1].split(';')[0]);corners=np.array([[535,787],[595,833],[637,876]]);edge=np.array([[260,1000],[135,1070],[105,1080]])
def predict(x):
 cx,cz,a=x;pts=np.array([[.105,.00035,.085],[-.105,.00035,.085]]);r=np.array([[np.cos(a),0,np.sin(a)],[0,1,0],[-np.sin(a),0,np.cos(a)]]);pts=pts@r.T+np.array([cx,0,cz]);result=[]
 for p in v['tabletop']:
  eye=np.array(p[:3]);back=eye-np.array(p[3:6]);back/=np.linalg.norm(back);right=np.cross([0,1.,0],back);right/=np.linalg.norm(right);up=np.cross(back,right);q=pts-eye;z=-(q@back);f=640/np.tan(np.deg2rad(p[6])/2);result.append(np.column_stack((360+q@right/z*f,640-q@up/z*f)))
 return np.array(result)
def loss(x):
 q=predict(x);d=edge-corners;n=np.column_stack((-d[:,1],d[:,0])).astype(float);n/=np.linalg.norm(n,axis=1)[:,None];return np.r_[(q[:,0]-corners).ravel(),np.sum((q[:,1]-corners)*n,axis=1)]
b=least_squares(loss,[-.04,.035,.9]);print(b.x.tolist(),'residual',loss(b.x).round(1).tolist());print(predict(b.x).round().tolist())
Path('../v05/mat-fit.json').write_text(json.dumps({'params':b.x.tolist(),'manual_corner_px':corners.tolist(),'manual_edge_px':edge.tolist(),'predicted_px':predict(b.x).tolist(),'residual_px':loss(b.x).tolist(),'uncertainty_px':10},indent=2)+'\n')
