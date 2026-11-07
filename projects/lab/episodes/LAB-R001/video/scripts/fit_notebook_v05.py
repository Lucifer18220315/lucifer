from pathlib import Path
import numpy as np,json
from scipy.optimize import least_squares
# Centre of upper paper edge and binding at source frame215, +/-15px.
def project(points,look):
 eye=np.array([.008,.145,.288]);back=eye-np.array([0,look,0]);back/=np.linalg.norm(back);right=np.cross([np.sin(-.015),np.cos(-.015),0],back);right/=np.linalg.norm(right);up=np.cross(back,right);q=np.array(points)-eye;z=-(q@back);f=640/np.tan(np.deg2rad(46)/2);return np.column_stack((360+q@right/z*f,640-q@up/z*f))
def loss(x):return project([[0,.018+x[1],.055],[0,.018,.055]],x[0])[:,1]-[130,1020]
f=least_squares(loss,[.065,.135]);v={'camera_look_y':float(f.x[0]),'upper_page_height':float(f.x[1]),'upper_page_angle':float(np.pi/2),'grip':[.012,float(.018+f.x[1]),.055],'manual_target_y_px':[130,1020],'predicted_px':project([[0,.018+f.x[1],.055],[0,.018,.055]],f.x[0]).tolist(),'uncertainty_px':15};print(json.dumps(v));Path('../v05/notebook-fit.json').write_text(json.dumps(v,indent=2)+'\n')
