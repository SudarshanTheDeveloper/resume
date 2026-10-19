import * as THREE from '../assets/vendor/three.module.min.js';
import { createProjectWorlds } from './journey-worlds.js';
import { stations } from './game-navigation.js';
import { racePaddock } from './game-navigation.js';

export function createLabWorld(renderer) {
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x0d211e);scene.fog=new THREE.FogExp2(0x0d211e,.018);
  const textures=[],signs=[],pickables=[],beacons=[];
  const material=(color,roughness=.8,metalness=.05)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const groundMaterial=material(0x25483b),stone=material(0x18392f),pathMaterial=material(0x53695a),trim=material(0x8cae8f,.5,.3);
  const leaf=material(0x42654d),leafLight=material(0x71825a),trunk=material(0x574c39),darkMetal=material(0x1e342d,.5,.6);
  const warm=new THREE.MeshBasicMaterial({color:0xf3d59c});
  function mesh(geometry,mat,parent=scene,position=[0,0,0],shadows=true){const m=new THREE.Mesh(geometry,mat);m.position.set(...position);m.castShadow=shadows;m.receiveShadow=true;parent.add(m);return m;}
  scene.add(new THREE.HemisphereLight(0xb5dacd,0x334a37,2.7));
  const sun=new THREE.DirectionalLight(0xffead0,3.1);sun.position.set(-10,22,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-27;sun.shadow.camera.right=27;sun.shadow.camera.top=27;sun.shadow.camera.bottom=-27;sun.shadow.normalBias=.05;sun.shadow.bias=-.0002;scene.add(sun);
  const rim=new THREE.DirectionalLight(0x97c8db,1.5);rim.position.set(8,9,-14);scene.add(rim);
  const studio=new THREE.Scene();studio.background=new THREE.Color(0x586d60);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshBasicMaterial({color:0xd4e8d0,side:THREE.DoubleSide}));panel.position.set(-4,5,3);panel.lookAt(0,0,0);studio.add(panel);
  const generator=new THREE.PMREMGenerator(renderer),environment=generator.fromScene(studio,.15);scene.environment=environment.texture;generator.dispose();panel.geometry.dispose();panel.material.dispose();

  mesh(new THREE.CylinderGeometry(24,23,1.3,100),stone,scene,[0,-.72,0]);
  const ground=mesh(new THREE.CylinderGeometry(24,24,.12,100),groundMaterial,scene,[0,-.06,0],false);ground.name='walkable ground';
  mesh(new THREE.CylinderGeometry(5.5,5.5,.025,64),pathMaterial,scene,[0,.013,5.5],false);
  mesh(new THREE.BoxGeometry(3.3,.025,34),pathMaterial,scene,[0,.016,0],false);
  for(const station of stations){
    mesh(new THREE.BoxGeometry(Math.abs(station.x)+.6,.026,2),pathMaterial,scene,[station.x/2,.018,station.z+3.8],false);
    for(const dx of [-.8,.8])mesh(new THREE.BoxGeometry(Math.abs(station.x),.03,.02),trim,scene,[station.x/2,.034,station.z+3.8+dx],false);
  }
  // A quiet inlaid route through the campus.
  mesh(new THREE.BoxGeometry(.024,.028,33),trim,scene,[-1.25,.033,0],false);
  mesh(new THREE.BoxGeometry(.024,.028,33),trim,scene,[1.25,.033,0],false);
  const projectWorlds=createProjectWorlds();
  for(const [index,station]of stations.entries()){
    const color=new THREE.Color(station.color);
    mesh(new THREE.CylinderGeometry(3.4,3.55,.25,64),darkMetal,scene,[station.x,.12,station.z]);
    const ring=mesh(new THREE.TorusGeometry(3.36,.025,6,100),new THREE.MeshBasicMaterial({color}),scene,[station.x,.26,station.z],false);ring.rotation.x=Math.PI/2;
    const group=projectWorlds.groups[index];group.visible=true;group.scale.setScalar(1.65);group.position.set(station.x,.25,station.z);scene.add(group);
    group.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;object.userData.station=station.id;pickables.push(object);}});
    const beacon=mesh(new THREE.CylinderGeometry(.035,.035,3,8),darkMetal,scene,[station.x+3.1,1.5,station.z+.8]);
    mesh(new THREE.SphereGeometry(.11,12,8),new THREE.MeshBasicMaterial({color}),scene,[station.x+3.1,3.05,station.z+.8],false);
    beacons.push(beacon);
    const sign=label(`${station.number}  /  ${station.title.toUpperCase()}`,station.subtitle,station.color,5.6,.95);sign.position.set(station.x,4.65,station.z);sign.userData.station=station.id;scene.add(sign);signs.push(sign);pickables.push(sign);
    // Clear floor markers make the interaction point legible.
    const marker=mesh(new THREE.RingGeometry(.38,.42,48),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}),scene,[station.x,.035,station.z+4.2],false);marker.rotation.x=-Math.PI/2;
  }
  // A fifth destination leads to the dedicated racing scene, separate from work.
  const paddock=new THREE.Group();paddock.position.set(racePaddock.x,0,racePaddock.z);scene.add(paddock);
  mesh(new THREE.CylinderGeometry(2.35,2.45,.18,48),darkMetal,paddock,[0,.09,0]);
  const gateMaterial=material(0xe6bc7b,.4,.35);
  for(const x of [-1.9,1.9])mesh(new THREE.BoxGeometry(.25,3.4,.4),gateMaterial,paddock,[x,1.7,0]);
  mesh(new THREE.BoxGeometry(4.1,.5,.5),darkMetal,paddock,[0,3.4,0]);
  for(let i=0;i<8;i++)for(let row=0;row<2;row++)mesh(new THREE.BoxGeometry(.46,.19,.02),new THREE.MeshBasicMaterial({color:(row+i)%2?0xdce8ce:0x192f26}),paddock,[-1.62+i*.46,3.3+row*.2,.27],false);
  const raceSign=label('05  /  RACE PADDOCK','APEX CIRCUIT · LIGHTS OUT.','#f3d19c',6.1,.95);raceSign.position.set(0,4.65,-16);raceSign.userData.station='race';scene.add(raceSign);pickables.push(raceSign);
  const raceMarker=mesh(new THREE.RingGeometry(.4,.45,48),new THREE.MeshBasicMaterial({color:0xf3d19c,side:THREE.DoubleSide}),scene,[0,.035,-11.8],false);raceMarker.rotation.x=-Math.PI/2;
  // Welcome sculpture and an engraved identity wall in the central plaza.
  const welcome=new THREE.Group();welcome.position.set(0,0,-1);scene.add(welcome);
  mesh(new THREE.CylinderGeometry(1.35,1.45,.18,48),darkMetal,welcome,[0,.09,0]);
  const sculpture=mesh(new THREE.TorusKnotGeometry(.64,.13,80,10,2,3),material(0xbedcc0,.24,.72),welcome,[0,1.2,0]);
  const identity=label('M G SUDARSHAN','C++ / UNREAL ENGINE DEVELOPER','#b9f4cb',5,.9);identity.position.set(0,3.3,-1);scene.add(identity);signs.push(identity);
  const groundWord=groundLabel('START WITH CURIOSITY',4.6,.55);groundWord.position.set(0,.043,10.1);scene.add(groundWord);

  const wood=material(0x87775a),lampGeometry=new THREE.CylinderGeometry(.035,.035,2.5,8);
  for(const [x,z]of [[-3,5],[3,5],[-3,-11],[3,-11],[-16,-2],[16,-2],[-16,13],[16,13]]){
    mesh(lampGeometry,darkMetal,scene,[x,1.25,z]);mesh(new THREE.BoxGeometry(.24,.12,.24),warm,scene,[x,2.53,z],false);
    const halo=mesh(new THREE.CircleGeometry(.55,32),new THREE.MeshBasicMaterial({color:0xe9ca8f,transparent:true,opacity:.09,depthWrite:false}),scene,[x,.031,z],false);halo.rotation.x=-Math.PI/2;
  }
  for(const [x,z,rotation]of [[-4.3,5.5,Math.PI/2],[4.3,5.5,Math.PI/2],[-5,-10,0],[5,12,0]]){
    const bench=new THREE.Group();bench.position.set(x,0,z);bench.rotation.y=rotation;scene.add(bench);
    mesh(new THREE.BoxGeometry(1.5,.12,.48),wood,bench,[0,.5,0]);mesh(new THREE.BoxGeometry(1.5,.5,.09),wood,bench,[0,.8,-.23]);
    for(const legX of [-.55,.55])mesh(new THREE.BoxGeometry(.09,.47,.36),darkMetal,bench,[legX,.24,0]);
  }
  // Shared geometry and deterministic placement keep the scenery lightweight.
  const trunkGeometry=new THREE.CylinderGeometry(.10,.16,1.8,7),leafGeometry=new THREE.DodecahedronGeometry(.9,0);
  for(let i=0;i<30;i++){
    const angle=i/30*Math.PI*2,radius=19.5+(i%3)*.65,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius;
    const tree=new THREE.Group();tree.position.set(x,0,z);tree.scale.setScalar(.8+(i%4)*.17);scene.add(tree);
    mesh(trunkGeometry,trunk,tree,[0,.9,0]);mesh(leafGeometry,i%2?leaf:leafLight,tree,[0,2,0]);mesh(leafGeometry,leaf,tree,[.35,2.5,-.12]);
  }
  const rockGeometry=new THREE.DodecahedronGeometry(.45,0);
  for(let i=0;i<30;i++){const a=i*2.399,r=17+(i%3)*1.3;const rock=mesh(rockGeometry,stone,scene,[Math.cos(a)*r,.1,Math.sin(a)*r]);rock.scale.set(1+(i%3)*.4,.5,.8);rock.rotation.y=a;}
  const water=mesh(new THREE.PlaneGeometry(400,400),material(0x0f2824,.24,.35),scene,[0,-1.45,0],false);water.rotation.x=-Math.PI/2;
  const destination=mesh(new THREE.RingGeometry(.3,.35,40),new THREE.MeshBasicMaterial({color:0xd7ffe0,side:THREE.DoubleSide,transparent:true,opacity:.9}),scene,[0,.05,0],false);destination.rotation.x=-Math.PI/2;destination.visible=false;

  function label(title,subtitle,color,width,height){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=180;const ctx=canvas.getContext('2d');
    ctx.fillStyle='rgba(10,29,23,.88)';ctx.beginPath();ctx.roundRect(1,1,1022,178,12);ctx.fill();ctx.strokeStyle=color;ctx.globalAlpha=.5;ctx.lineWidth=2;ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=color;ctx.font='600 37px Arial';ctx.textAlign='center';ctx.fillText(title,512,76);ctx.fillStyle='#d6e3d7';ctx.font='23px Arial';ctx.fillText(subtitle,512,125);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false,transparent:true}));sprite.scale.set(width,height,1);return sprite;
  }
  function groundLabel(text,width,height){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=128;const ctx=canvas.getContext('2d');ctx.font='500 42px Arial';ctx.textAlign='center';ctx.fillStyle='#c9d9b1';ctx.fillText(text,512,82);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));plane.rotation.x=-Math.PI/2;return plane;
  }
  return{scene,ground,pickables,destination,sun,signs,textures,environment,animated:[...projectWorlds.animated,{object:sculpture,axis:'y',speed:.18}]};
}
