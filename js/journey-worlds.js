import * as THREE from '../assets/vendor/three.module.min.js';

export function createProjectWorlds() {
  const root=new THREE.Group(), groups=[], animated=[];
  const mint=new THREE.MeshStandardMaterial({color:0x9ccca9,roughness:.3,metalness:.6});
  const dark=new THREE.MeshStandardMaterial({color:0x203b30,roughness:.4,metalness:.7});
  const amber=new THREE.MeshStandardMaterial({color:0xb5a077,roughness:.65,metalness:.15});
  const blue=new THREE.MeshStandardMaterial({color:0x569cbd,roughness:.3,metalness:.55});
  const glow=(color,opacity=.8)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false});
  function mesh(geo,mat,parent,pos=[0,0,0]){const m=new THREE.Mesh(geo,mat);m.position.set(...pos);parent.add(m);return m;}
  function edge(object,color=0xa5e3bd){const e=new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:.5}));object.add(e);return e;}
  for(let i=0;i<4;i++){const group=new THREE.Group();group.visible=i===0;root.add(group);groups.push(group);}
  const capture=groups[0];
  const cube=edge(mesh(new THREE.BoxGeometry(1.1,1.1,1.1),mint,capture,[0,1.15,0])).parent;
  cube.rotation.y=.4;animated.push({object:cube,axis:'y',speed:.15});
  for(let i=0;i<3;i++){
    const ring=mesh(new THREE.TorusGeometry(1.5+i*.07,.009,4,100),glow(0x9fe7b1,.45),capture,[0,1.15,0]);
    ring.rotation.set(i===0?Math.PI/2:.25,i===1?Math.PI/2:0,i===2?Math.PI/3:0);
  }
  for(let i=0;i<6;i++){
    const angle=i*Math.PI/3;
    const panel=edge(mesh(new THREE.BoxGeometry(.48,.38,.035),dark,capture,[Math.cos(angle)*1.75,1.15+Math.sin(angle*2)*.25,Math.sin(angle)*1.75])).parent;
    panel.lookAt(0,1.15,0);
  }
  const pavilion=groups[1];
  mesh(new THREE.BoxGeometry(2.7,.1,2),amber,pavilion,[0,.03,0]);
  for(const x of [-1.15,1.15])for(const z of [-.8,.8])mesh(new THREE.BoxGeometry(.12,1.65,.12),amber,pavilion,[x,.9,z]);
  edge(mesh(new THREE.BoxGeometry(2.75,.15,2.1),amber,pavilion,[0,1.78,0]),0xefd7a4);
  mesh(new THREE.BoxGeometry(.9,.32,.65),amber,pavilion,[0,.23,0]);
  const sun=mesh(new THREE.SphereGeometry(.2,20,12),glow(0xffdf94,1),pavilion,[2,2.65,-1.3]);
  const sunHalo=mesh(new THREE.TorusGeometry(.34,.008,4,64),glow(0xf4d295,.6),pavilion,[2,2.65,-1.3]);sunHalo.rotation.y=.2;
  const sunArc=mesh(new THREE.TorusGeometry(2.5,.006,4,96,Math.PI),glow(0xc9aa72,.5),pavilion,[0,.08,-1.3]);
  const beam=mesh(new THREE.ConeGeometry(.85,3.6,24,1,true),glow(0xf4d59c,.06),pavilion,[1.05,1.35,-.5]);beam.rotation.z=-.65;
  const xr=groups[2];
  for(let i=0;i<3;i++){
    const frame=new THREE.Group();frame.position.z=(i-1)*.7;frame.rotation.z=(i-1)*.1;xr.add(frame);
    for(const x of [-1.1,1.1])mesh(new THREE.BoxGeometry(.06,2.2,.06),blue,frame,[x,1.2,0]);
    for(const y of [.1,2.3])mesh(new THREE.BoxGeometry(2.26,.06,.06),blue,frame,[0,y,0]);
  }
  const asset=edge(mesh(new THREE.IcosahedronGeometry(.65,0),new THREE.MeshStandardMaterial({color:0x80bed6,metalness:.5,roughness:.25}),xr,[0,1.18,0]),0xd1f1ff).parent;
  animated.push({object:asset,axis:'y',speed:.3});
  for(let i=0;i<3;i++){const r=mesh(new THREE.TorusGeometry(1.6,.007,4,80),glow(0x8fcce5,.35),xr,[0,.1+i*.06,0]);r.rotation.x=Math.PI/2;}
  const diagnostics=groups[3];
  for(let i=0;i<3;i++){
    const height=1.1+i*.32;
    edge(mesh(new THREE.BoxGeometry(.58,height,.65),dark,diagnostics,[(i-1)*.85,height/2+.08,0]),0x7ec9b2);
    for(let j=0;j<4;j++){
      mesh(new THREE.BoxGeometry(.4,.035,.015),mint,diagnostics,[(i-1)*.85,.25+j*.21,.337]);
      mesh(new THREE.SphereGeometry(.017,6,4),glow(0xa9f6c2,1),diagnostics,[(i-1)*.85+.19,.32+j*.21,.35]);
    }
  }
  const tracePoints=[];
  for(let i=0;i<=60;i++){const x=-1.6+i*.055;tracePoints.push(new THREE.Vector3(x,1.1+Math.sin(i*.65)*.2+(i%13===0?.4:0),.8));}
  const trace=new THREE.Line(new THREE.BufferGeometry().setFromPoints(tracePoints),new THREE.LineBasicMaterial({color:0xa8f0ce}));diagnostics.add(trace);
  // A shared floating island ties the different environments into one journey.
  const island=new THREE.Group();root.add(island);
  mesh(new THREE.CylinderGeometry(3.05,2.8,.17,96),new THREE.MeshStandardMaterial({color:0x172c24,roughness:.5,metalness:.65}),island,[0,-.11,0]);
  const track=mesh(new THREE.TorusGeometry(2.6,.012,5,128),glow(0xb9f4cb,.65),island,[0,-.012,0]);track.rotation.x=Math.PI/2;
  const track2=mesh(new THREE.TorusGeometry(2.84,.003,4,128),glow(0x6d9c80,.5),island,[0,-.012,0]);track2.rotation.x=Math.PI/2;
  const points=[];for(let i=0;i<100;i++){const a=i*Math.PI/50;points.push(new THREE.Vector3(Math.cos(a)*2.76,.0,Math.sin(a)*2.76),new THREE.Vector3(Math.cos(a)*(i%10===0?2.88:2.8),0,Math.sin(a)*(i%10===0?2.88:2.8)));}
  island.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x78aa88,transparent:true,opacity:.5})));
  return {root,groups,animated,track,sun};
}
