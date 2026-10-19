// Deterministic, renderer-independent arcade driving and ordered lap checkpoints.
export const ROAD_WIDTH = 12;
export const RACE_LAPS = 3;
const controlPoints = [[0,55],[60,55],[100,45],[114,10],[95,-16],[115,-50],[85,-80],[30,-78],[4,-55],[-38,-80],[-93,-65],[-112,-28],[-80,-5],[-95,35],[-60,55]];
const mix = (a,b,c,d,t) => .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
const points = Array.from({length:480},(_,i)=>{
  const u=i/480*controlPoints.length,k=Math.floor(u),t=u-k,n=controlPoints.length;
  return {x:mix(controlPoints[(k+n-1)%n][0],controlPoints[k][0],controlPoints[(k+1)%n][0],controlPoints[(k+2)%n][0],t),z:mix(controlPoints[(k+n-1)%n][1],controlPoints[k][1],controlPoints[(k+1)%n][1],controlPoints[(k+2)%n][1],t)};
});
let length=0;
export const track = points.map((p,i)=>{
  const next=points[(i+1)%points.length],dx=next.x-p.x,dz=next.z-p.z,segment=Math.hypot(dx,dz),distance=length;
  length+=segment;return {...p,dx:dx/segment,dz:dz/segment,nx:-dz/segment,nz:dx/segment,segment,distance};
});
export const TRACK_LENGTH=length;
export function pointAt(distance){
  const d=((distance%length)+length)%length;
  let lo=0,hi=track.length-1;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(track[mid].distance<=d)lo=mid;else hi=mid-1;}
  const p=track[lo],along=d-p.distance;
  return {...p,x:p.x+p.dx*along,z:p.z+p.dz*along,angle:Math.atan2(p.dx,p.dz)};
}
export function nearestTrack(x,z){
  let best=null,min=Infinity;
  for(const p of track){const along=Math.max(0,Math.min(p.segment,(x-p.x)*p.dx+(z-p.z)*p.dz)),px=p.x+p.dx*along,pz=p.z+p.dz*along,dist=(x-px)**2+(z-pz)**2;
    if(dist<min){min=dist;best={x:px,z:pz,distance:p.distance+along,offset:(x-px)*p.nx+(z-pz)*p.nz,nx:p.nx,nz:p.nz,angle:Math.atan2(p.dx,p.dz)};}}
  return best;
}
export function createRaceState(){
  const p=pointAt(0);
  return {x:p.x,z:p.z,angle:p.angle,speed:0,steer:0,elapsed:0,countdown:3.2,lap:0,lapStart:0,lastLap:null,bestLap:null,progress:0,previousDistance:0,nextGate:1,offroad:false,wrongWay:false,finished:false,finishTime:null,penalty:0,impact:0};
}
export function updateProgress(state,near){
  let delta=near.distance-state.previousDistance;
  if(delta>length/2)delta-=length;if(delta<-length/2)delta+=length;
  state.previousDistance=near.distance;
  // Reject jumps between separated parts of the circuit and off-course shortcuts.
  if(Math.abs(delta)>18)return;
  state.progress+=delta;
  const gateDistance=length/12;
  if(Math.abs(near.offset)>ROAD_WIDTH/2+2)return;
  if(state.progress>=state.nextGate*gateDistance){
    // A missed gate must be recovered; crossing a later sector cannot award it.
    if(state.progress-state.nextGate*gateDistance>18)return;
    state.nextGate++;
    if((state.nextGate-1)%12===0){
      const lapTime=state.elapsed-state.lapStart;state.lastLap=lapTime;state.bestLap=state.bestLap===null?lapTime:Math.min(state.bestLap,lapTime);state.lapStart=state.elapsed;state.lap++;
      if(state.lap>=RACE_LAPS){state.finished=true;state.finishTime=state.elapsed;}
    }
  }
}
export function resetCar(state){
  const gate=(state.nextGate-1)*length/12,p=pointAt(gate);
  Object.assign(state,{x:p.x,z:p.z,angle:p.angle,speed:0,steer:0,progress:gate,previousDistance:gate%length,elapsed:state.elapsed+3,penalty:state.penalty+3,impact:0});
}
export function stepRace(state,input,delta){
  if(state.finished)return;
  const dt=Math.max(0,Math.min(delta,.05));
  if(state.countdown>0){state.countdown=Math.max(0,state.countdown-dt);return;}
  state.elapsed+=dt;state.impact=Math.max(0,state.impact-dt*3);
  let near=nearestTrack(state.x,state.z);state.offroad=Math.abs(near.offset)>ROAD_WIDTH/2+.5;
  const throttle=Math.max(0,Math.min(1,input.throttle||0)),brake=Math.max(0,Math.min(1,input.brake||0));
  state.speed+=((throttle*17*(1-state.speed/76))-(brake*32)-(.25+state.speed*.018+state.speed*state.speed*.0011)-(state.offroad?state.speed*1.35:0))*dt;
  state.speed=Math.max(0,Math.min(69,state.speed));
  const targetSteer=Math.max(-1,Math.min(1,input.steer||0));state.steer+=(targetSteer-state.steer)*(1-Math.exp(-dt*9));
  // Left input turns toward the left side of the car; steering eases at speed.
  state.angle-=state.steer*(state.speed/(state.speed+7))*1.65/(1+state.speed*.022)*dt;
  state.x+=Math.sin(state.angle)*state.speed*dt;state.z+=Math.cos(state.angle)*state.speed*dt;
  near=nearestTrack(state.x,state.z);
  const barrier=ROAD_WIDTH/2+4.3;
  if(Math.abs(near.offset)>barrier){const side=Math.sign(near.offset);state.x=near.x+near.nx*side*(barrier-.12);state.z=near.z+near.nz*side*(barrier-.12);state.speed*=.42;state.impact=1;}
  state.wrongWay=state.speed>3&&Math.cos(state.angle-near.angle)<-.3;
  updateProgress(state,near);
}
export function formatTime(seconds){if(seconds===null||!Number.isFinite(seconds))return '—:——.———';const ms=Math.floor(Math.max(0,seconds)*1000);return `${Math.floor(ms/60000)}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`;}
