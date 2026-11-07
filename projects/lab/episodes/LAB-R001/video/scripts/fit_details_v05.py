from pathlib import Path
import json
import numpy as np
from scipy.optimize import least_squares
p=Path('src/v05/camera-fits.ts');value=json.loads(p.read_text().split('export const CAMERA_FITS=')[1].split(';')[0]);sx,sz=value['cupScale'];clock=value['clock'];raw=np.array(json.loads((Path(__file__).resolve().parents[2]/'v05/calibration/cup-points.json').read_text())['points']);points=raw*np.array([.043*sx,.043,.043*sz])+np.array([0,-.00046,0])
def project(v,p,fov,roll=0):
 eye=np.array(p[:3]);back=eye-np.array([p[3],p[4],p[5]]);back/=np.linalg.norm(back);right=np.cross([np.sin(roll),np.cos(roll),0],back);right/=np.linalg.norm(right);up=np.cross(back,right);rel=v-eye;z=-(rel@back);f=640/np.tan(np.deg2rad(fov)/2);return np.column_stack((360+rel@right/z*f,640-rel@up/z*f))
clockTL=np.array([clock['x']-clock['width']/2,clock['height']+.001,clock['z']+.0165]);clockBL=clockTL.copy();clockBL[1]=.001
# Final return frame: one camera fits cup bounds and the visible clock corner.
def residual(x):
 pose=[*x[:3],x[3],x[4],0];q=project(points,pose,31);b=np.r_[q.min(axis=0),q.max(axis=0)];c=project(np.array([clockTL,clockBL]),pose,31);return np.r_[b-[249,521,478,986],.7*(c[0]-[521,716]),.7*(c[1]-[521,924])]
fit=least_squares(residual,[.02,.11,.60,0,.085],bounds=([-.3,.03,.3,-.08,.02],[.3,.4,1,.08,.17]),x_scale='jac',max_nfev=300);value['returnEnd']=fit.x.tolist();return_error=residual(fit.x).tolist()
# Macro clock: match the centres of :47 and the top edge, keeping a real 3D view.
wscale=clock['width']/.126;cy=clock['height']/2+.001;z=clock['z']+.0172
markers=np.array([[clock['x']+.017*wscale,cy,z],[clock['x']+.043*wscale,cy,z],clockTL,clockBL])
def clock_res(x):
 pose=[*x[:3],x[3],x[4],clock['z']+.015];q=project(markers,pose,32,.031);return np.r_[q[0]-[430,545],q[1]-[660,545],.5*(q[2,1]-(188-.032*q[2,0])),.5*(q[3,1]-(900-.015*q[3,0]))]
f=least_squares(clock_res,[clock['x']-.044,.042,clock['z']+.195,clock['x']+.01,.027],bounds=([clock['x']-.2,.005,clock['z']+.06,clock['x']-.1,-.03],[clock['x']+.2,.15,clock['z']+.5,clock['x']+.1,.1]),x_scale='jac',max_nfev=350);value['clockCamera']=[*f.x.tolist(),clock['z']+.015]
p.write_text('// Joint screen projection fits; not unique physical camera recovery.\nexport const CAMERA_FITS='+json.dumps(value)+';\n');Path('../v05/detail-fits.json').write_text(json.dumps({'return_residuals_px':return_error,'clock_residuals_px':clock_res(f.x).tolist(),'clock_camera':value['clockCamera'],'return_end':value['returnEnd']},indent=2)+'\n');print('Return residuals',np.round(return_error,1).tolist());print('Clock residuals',np.round(clock_res(f.x),1).tolist())
