import * as THREE from '../assets/vendor/three.module.min.js';
import {track,pointAt,ROAD_WIDTH,TRACK_LENGTH} from './race-physics.js';

export const liveries=[{name:'Papaya / 01',color:0xff853e,hex:'#ff853e'},{name:'Glacier / 02',color:0x81cddd,hex:'#81cddd'},{name:'Crimson / 03',color:0xd93643,hex:'#d93643'}];
export function createFormulaCar(color=0xff853e){
  const root=new THREE.Group(),wheels=[],frontWheels=[];
  const paint=new THREE.MeshStandardMaterial({color,roughness:.28,metalness:.5}),carbon=new THREE.MeshStandardMaterial({color:0x111a20,roughness:.63,metalness:.2}),rubber=new THREE.MeshStandardMaterial({color:0x141719,roughness:.93}),rim=new THREE.MeshStandardMaterial({color:0xa2acb3,metalness:.8,roughness:.3}),accent=new THREE.MeshStandardMaterial({color:0xe6eddf,roughness:.45});
  const add=(geo,mat,pos,parent=root)=>{const m=new THREE.Mesh(geo,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  add(new THREE.BoxGeometry(1.35,.16,3.9),carbon,[0,.25,0]);
  add(new THREE.BoxGeometry(.8,.48,2.05),paint,[0,.55,-.55]);
  const nose=add(new THREE.CylinderGeometry(.17,.43,2.3,4),paint,[0,.45,1.05]);nose.rotation.x=Math.PI/2;nose.rotation.z=Math.PI/4;
  for(const x of [-.66,.66]){const pod=add(new THREE.BoxGeometry(.46,.43,1.65),paint,[x,.52,-.55]);pod.rotation.y=x*.12;add(new THREE.BoxGeometry(.32,.1,1.1),carbon,[x,.75,-.45]);}
  for(const z of [1.35,-1.25])for(const x of [-1.05,1.05]){
    const assembly=new THREE.Group();assembly.position.set(x,.43,z);root.add(assembly);if(z>0)frontWheels.push(assembly);
    const roll=new THREE.Group();assembly.add(roll);wheels.push(roll);
    const tire=add(new THREE.CylinderGeometry(.43,.43,.38,20),rubber,[0,0,0],roll);tire.rotation.z=Math.PI/2;
    const hub=add(new THREE.CylinderGeometry(.22,.22,.39,10),rim,[0,0,0],roll);hub.rotation.z=Math.PI/2;
    const stripe=add(new THREE.TorusGeometry(.36,.018,4,24),new THREE.MeshBasicMaterial({color:0xe9c74e}),[Math.sign(x)*.2,0,0],roll);stripe.rotation.y=Math.PI/2;
    const arm=add(new THREE.BoxGeometry(.75,.04,.09),carbon,[x/2,.4,z]);arm.rotation.z=-x*.18;
  }
  for(const z of [2.05,2.25])add(new THREE.BoxGeometry(2.6,.07,.2),paint,[0,.29,z]);
  for(const x of [-1.23,1.23])add(new THREE.BoxGeometry(.06,.26,.65),carbon,[x,.36,2.1]);
  for(const x of [-.7,.7])add(new THREE.BoxGeometry(.08,.6,.14),carbon,[x,.81,-1.65]);
  add(new THREE.BoxGeometry(1.9,.11,.52),paint,[0,1.14,-1.7]);
  for(const x of [-.93,.93])add(new THREE.BoxGeometry(.05,.42,.65),carbon,[x,1.12,-1.7]);
  add(new THREE.BoxGeometry(.37,.27,.55),carbon,[0,.83,-.27]);
  add(new THREE.SphereGeometry(.24,16,10),accent,[0,1.03,-.2]);
  const visor=add(new THREE.SphereGeometry(.245,16,8,0,Math.PI),carbon,[0,1.055,-.17]);visor.scale.y=.35;
  const haloCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.4,.9,-.65),new THREE.Vector3(-.42,1.2,-.15),new THREE.Vector3(0,1.23,.35),new THREE.Vector3(.42,1.2,-.15),new THREE.Vector3(.4,.9,-.65)]);
  add(new THREE.TubeGeometry(haloCurve,20,.035,5,false),carbon,[0,0,0]);
  add(new THREE.BoxGeometry(.045,.38,.045),carbon,[0,1.04,.35]);
  add(new THREE.BoxGeometry(.16,.025,1.25),accent,[0,.82,-.8]);
  return {root,paint,animate(speed,steer,dt){for(const wheel of wheels)wheel.rotation.x+=speed*dt/.43;for(const wheel of frontWheels)wheel.rotation.y=-steer*.28;}};
}

export function createRaceWorld(environment){
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xb5c8c5);scene.fog=new THREE.Fog(0xb5c8c5,180,530);scene.environment=environment;
  const textures=[];
  const mat=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const asphalt=mat(0x30383b),grass=mat(0x597364),cream=mat(0xdedbd0),red=mat(0xd84b49),dark=mat(0x1f3535),glass=mat(0x59858d,.25,.55),white=mat(0xf1ede0),gold=mat(0xeec783,.4,.3);
  const mesh=(geo,material,pos=[0,0,0],parent=scene)=>{const m=new THREE.Mesh(geo,material);m.position.set(...pos);m.receiveShadow=true;parent.add(m);return m;};
  scene.add(new THREE.HemisphereLight(0xe3eeeb,0x4e6242,2.6));
  const sun=new THREE.DirectionalLight(0xffd8a6,3.6);sun.position.set(-45,95,65);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-45;sun.shadow.camera.right=45;sun.shadow.camera.top=45;sun.shadow.camera.bottom=-45;sun.shadow.camera.far=240;sun.shadow.normalBias=.06;scene.add(sun);scene.add(sun.target);
  mesh(new THREE.PlaneGeometry(1400,1400),grass,[0,-.06,0]).rotation.x=-Math.PI/2;
  function ribbon(from,to,material,y){
    const positions=[],indices=[];
    for(let i=0;i<=track.length;i++){const p=track[i%track.length];for(const offset of [from,to])positions.push(p.x+p.nx*offset,y,p.z+p.nz*offset);if(i<track.length){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();material.side=THREE.DoubleSide;return mesh(geometry,material);
  }
  ribbon(-10,10,mat(0xa99f80),-.015);ribbon(-ROAD_WIDTH/2,ROAD_WIDTH/2,asphalt,.015);
  for(const side of [-1,1]){
    ribbon(side*5.83,side*5.96,white,.026);
    const kerbGeometry=new THREE.BufferGeometry(),positions=[],colors=[],indices=[],redColor=new THREE.Color(0xd65950),lightColor=new THREE.Color(0xe8e5d7);
    for(let i=0;i<track.length;i++){const a=track[i],b=track[(i+1)%track.length],base=positions.length/3;for(const [p,o]of [[a,6],[a,6.75],[b,6],[b,6.75]]){positions.push(p.x+p.nx*o*side,.035,p.z+p.nz*o*side);const c=Math.floor(a.distance/3)%2?redColor:lightColor;colors.push(c.r,c.g,c.b);}indices.push(base,base+2,base+1,base+1,base+2,base+3);}
    kerbGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));kerbGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));kerbGeometry.setIndex(indices);kerbGeometry.computeVertexNormals();mesh(kerbGeometry,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.9}));
  }
  // Shared barriers follow the same curve used by the driving collision boundary.
  const barriers=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.65,.28),cream,track.length*2),dummy=new THREE.Object3D();
  for(let i=0;i<track.length;i++){const p=track[i];for(let s=0;s<2;s++){const side=s?1:-1;dummy.position.set(p.x+p.nx*side*10.5,.32,p.z+p.nz*side*10.5);dummy.rotation.set(0,Math.atan2(-p.dz,p.dx),0);dummy.scale.set(p.segment+ .08,1,1);dummy.updateMatrix();barriers.setMatrixAt(i*2+s,dummy.matrix);}}
  barriers.receiveShadow=true;scene.add(barriers);
  // Pit straight, pit building, striped grid and a start-light gantry.
  mesh(new THREE.BoxGeometry(80,.025,6),asphalt,[18,.015,72]);
  for(let i=0;i<14;i++)mesh(new THREE.BoxGeometry(2,.027,.13),white,[-20+i*5.6,.035,69]);
  const pit=new THREE.Group();pit.position.set(18,0,83);scene.add(pit);
  mesh(new THREE.BoxGeometry(70,4.6,10),cream,[0,2.3,0],pit).castShadow=true;
  mesh(new THREE.BoxGeometry(72,.35,13),dark,[0,4.85,-.7],pit);
  mesh(new THREE.BoxGeometry(66,1.8,.1),glass,[0,3.15,-5.05],pit);
  for(let i=0;i<10;i++){mesh(new THREE.BoxGeometry(5,2.2,.12),dark,[-29+i*6.4,1.15,-5.1],pit);mesh(new THREE.BoxGeometry(5,.15,.15),gold,[-29+i*6.4,2.35,-5.2],pit);}
  const pitSign=label('SUDARSHAN MOTORSPORT','APEX CIRCUIT  /  PIT LANE',24,2);pitSign.position.set(18,6.6,82);scene.add(pitSign);
  const start=pointAt(0),startGroup=new THREE.Group();startGroup.position.set(start.x,0,start.z);startGroup.rotation.y=start.angle;scene.add(startGroup);
  for(let row=0;row<2;row++)for(let col=0;col<12;col++)mesh(new THREE.BoxGeometry(1,.012,.55),(row+col)%2?dark:white,[-5.5+col,.042,row*.55],startGroup);
  for(const x of [-8,8])mesh(new THREE.BoxGeometry(.45,7,.5),dark,[x,3.5,2],startGroup);
  mesh(new THREE.BoxGeometry(17,1.35,.65),dark,[0,6.6,2],startGroup);
  const gantry=label('APEX CIRCUIT','CHASE THE NEXT APEX.',12,1.5);gantry.position.set(0,7.9,2);startGroup.add(gantry);
  const lights=[];for(let i=0;i<5;i++){const light=mesh(new THREE.SphereGeometry(.19,12,8),new THREE.MeshBasicMaterial({color:0x441515}),[-1.8+i*.9,6.6,2.37],startGroup);lights.push(light);}
  for(let i=0;i<6;i++){const p=pointAt(8+i*7);const grid=new THREE.Group();grid.position.set(p.x,p.y||.046,p.z);grid.rotation.y=p.angle;scene.add(grid);for(const side of [-1,1])mesh(new THREE.BoxGeometry(.08,.015,1.5),white,[side*.95+(i%2?2:-2),0,0],grid);mesh(new THREE.BoxGeometry(2,.015,.08),white,[i%2?2:-2,0,.75],grid);}
  for(const [x,z,angle]of [[37,27,0],[-70,-98,Math.PI],[138,-10,Math.PI/2]]){
    const stand=new THREE.Group();stand.position.set(x,0,z);stand.rotation.y=angle;scene.add(stand);
    for(let row=0;row<5;row++){mesh(new THREE.BoxGeometry(42,.7,2.2),row%2?cream:dark,[0,.5+row*.65,-row*2],stand);for(let col=0;col<28;col++){const seat=mesh(new THREE.BoxGeometry(.6,.5,.65),[red,gold,glass][(col+row)%3],[-19+col*1.4,1+row*.65,-row*2],stand);seat.castShadow=false;}}
    for(const side of [-1,1])mesh(new THREE.BoxGeometry(.3,8,.3),dark,[side*20,4,-6],stand);
    mesh(new THREE.BoxGeometry(45,.25,14),cream,[0,8.1,-5],stand).castShadow=true;
  }
  // Trees, distant ridges, braking boards and trackside banners establish scale.
  const treeGeometry=new THREE.ConeGeometry(2.6,8,6),treeMaterial=mat(0x345848),trees=new THREE.InstancedMesh(treeGeometry,treeMaterial,110);
  for(let i=0;i<110;i++){const a=i*2.399,r=155+(i%7)*6;dummy.position.set(Math.cos(a)*r,3.5,Math.sin(a)*r);dummy.rotation.set(0,a,0);const size=.7+(i%4)*.16;dummy.scale.set(size,size,size);dummy.updateMatrix();trees.setMatrixAt(i,dummy.matrix);}scene.add(trees);
  for(let i=0;i<20;i++){const a=i/20*Math.PI*2;const mountain=mesh(new THREE.ConeGeometry(65+(i%4)*12,40+(i%3)*22,5),mat(i%2?0x81988b:0x6f897c),[Math.cos(a)*350,12,Math.sin(a)*350]);mountain.rotation.y=a;}
  for(let i=0;i<12;i++){const p=pointAt(i*TRACK_LENGTH/12+15),board=label(i%3===0?'BRAKE':i%3===1?'FIND THE APEX':'S. MOTORSPORT',i%3===0?'100':'APEX CIRCUIT',7,1.15);board.position.set(p.x+p.nx*12,2.5,p.z+p.nz*12);scene.add(board);}
  const car=createFormulaCar();scene.add(car.root);
  const rivals=[createFormulaCar(0x81cddd),createFormulaCar(0xd93643)];rivals.forEach(c=>scene.add(c.root));
  function label(title,subtitle,width,height){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=180;const ctx=canvas.getContext('2d');ctx.fillStyle='#142b2b';ctx.fillRect(0,0,1024,180);ctx.fillStyle='#f0d5a5';ctx.textAlign='center';ctx.font='bold 52px Arial';ctx.fillText(title,512,80);ctx.fillStyle='#d4e6dd';ctx.font='23px Arial';ctx.fillText(subtitle,512,135);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture}));sprite.scale.set(width,height,1);return sprite;}
  return {scene,car,rivals,lights,sun,textures};
}
