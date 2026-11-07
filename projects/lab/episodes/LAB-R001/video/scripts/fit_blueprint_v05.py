from pathlib import Path
import json
import numpy as np
from scipy.optimize import least_squares
width,height=.21,.1485;center=np.array([0,.0015,.0675]);yaw=.12

def world(uv):
 p=np.column_stack(((uv[:,0]-.5)*width,np.zeros(len(uv)),(uv[:,1]-.5)*height));r=np.array([[np.cos(yaw),0,np.sin(yaw)],[0,1,0],[-np.sin(yaw),0,np.cos(yaw)]]);return p@r.T+center

def project(v,p):
 eye=np.array(p[:3]);target=np.array([p[3],.0015,p[4]]);back=eye-target;back/=np.linalg.norm(back);right=np.cross([np.sin(p[5]),0,-np.cos(p[5])],back);right/=np.linalg.norm(right);up=np.cross(back,right);rel=v-eye;z=-(rel@back);f=640/np.tan(np.deg2rad(42)/2);return np.column_stack((360+rel@right/z*f,640-rel@up/z*f))
uv0=np.array([[0,0],[1,0],[1,1],[0,1]])
uv1=np.array([[(1536+75)/4608,1660/2048],[(1536+1460)/4608,1660/2048],[(1536+1460)/4608,1970/2048],[(1536+75)/4608,1970/2048]])
cases=[(154,uv0,[[159,339],[678,538],[566,828],[46,623]],[.05,.52,.28,0,.0675,-.4]),(165,uv1,[[125,777],[548,938],[487,1072],[77,914]],[.01,.25,.17,0,.0675,-.4])]
fits=[]
for frame,uv,target,init in cases:
 ps=world(uv);goal=np.array(target);fn=lambda p:(project(ps,p)-goal).ravel();fit=least_squares(fn,init,bounds=([-.7,.025,-.4,-.4,-.4,-.8],[.7,1.3,.8,.4,.5,.8]),max_nfev=400,x_scale='jac');fits.append({'frame':frame,'pose':fit.x.tolist(),'target':target,'predicted':project(ps,fit.x).tolist(),'residual_px':fn(fit.x).tolist()})
Path('src/v05/blueprint-camera.ts').write_text('// Fit to outer sheet corners and the central panel stamp, measured from reference.\nexport const BLUEPRINT_FITS='+json.dumps({'width':width,'height':height,'cameras':[x['pose'] for x in fits]})+';\n');Path('../v05/blueprint-fit.json').write_text(json.dumps({'method':'Planar camera reconstruction from manual source page/stamp corners; no image registration applied to audit output.','frames':fits},indent=2)+'\n');print(json.dumps(fits))
