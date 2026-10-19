import * as THREE from '../assets/vendor/three.module.min.js';

// An articulated, procedural interpretation of the approved portrait and concept.
// The generated concept is an appearance reference, not a scan or a mesh asset.
export function createAvatar() {
  const root = new THREE.Group(); root.name = 'Sudarshan — stylized avatar';
  const body = new THREE.Group(); root.add(body);
  const material = (color, roughness = .75) => new THREE.MeshStandardMaterial({ color, roughness, metalness: .05 });
  const plaidCanvas=document.createElement('canvas');plaidCanvas.width=plaidCanvas.height=256;
  const plaid=plaidCanvas.getContext('2d');plaid.fillStyle='#b86532';plaid.fillRect(0,0,256,256);
  for(let i=0;i<256;i+=64){plaid.fillStyle='#263246';plaid.fillRect(i+14,0,13,256);plaid.fillRect(0,i+14,256,13);plaid.fillStyle='#ece1c9';plaid.fillRect(i+10,0,3,256);plaid.fillRect(i+28,0,3,256);plaid.fillRect(0,i+10,256,3);plaid.fillRect(0,i+28,256,3);plaid.fillStyle='#e7b28b';plaid.fillRect(i+47,0,2,256);plaid.fillRect(0,i+47,256,2);}
  const plaidTexture=new THREE.CanvasTexture(plaidCanvas);plaidTexture.colorSpace=THREE.SRGBColorSpace;plaidTexture.wrapS=plaidTexture.wrapT=THREE.RepeatWrapping;
  const skin = material(0xb77b54), hair = material(0x1a1718), shirt = new THREE.MeshStandardMaterial({map:plaidTexture,roughness:.9}), shirtDark = material(0x865035);
  const pants = material(0x35383e), shoes = material(0xe0e4d8), sole = material(0x7f8983), eyeWhite = material(0xf7eee2), dark = material(0x171b20);
  function mesh(geometry, mat, parent, position = [0,0,0], scale = [1,1,1]) {
    const object = new THREE.Mesh(geometry, mat); object.position.set(...position); object.scale.set(...scale); parent.add(object); return object;
  }
  const sphere = new THREE.SphereGeometry(1, 16, 12);
  const capsule = (radius, length) => new THREE.CapsuleGeometry(radius, length, 4, 10);
  const torso = mesh(new THREE.LatheGeometry([new THREE.Vector2(.205,-.27),new THREE.Vector2(.23,-.22),new THREE.Vector2(.25,.18),new THREE.Vector2(.225,.29),new THREE.Vector2(.11,.34)],24), shirt, body, [0,1.21,0], [1,1,.7]);
  torso.rotation.z = -.025;
  mesh(new THREE.BoxGeometry(.4,.16,.27), shirtDark, body,[0,.91,0]);
  mesh(capsule(.09,.08), skin, body,[0,1.6,0]);
  const head = new THREE.Group(); head.position.set(0,1.81,.025);head.scale.setScalar(.84);body.add(head);
  mesh(sphere,skin,head,[0,0,0],[.235,.28,.225]);
  mesh(sphere,skin,head,[-.232,-.005,0],[.044,.07,.042]); mesh(sphere,skin,head,[.232,-.005,0],[.044,.07,.042]);
  mesh(sphere,skin,head,[0,-.025,.215],[.055,.07,.07]);
  // Hair cap and a restrained, deterministic set of wavy tufts.
  const cap = mesh(new THREE.SphereGeometry(1,16,10,0,Math.PI*2,0,Math.PI*.58),hair,head,[0,.08,-.025],[.247,.235,.236]);
  for(let i=0;i<13;i++) {
    const angle=i*2.39996, radius=.08+(i%3)*.035;
    mesh(sphere,hair,head,[Math.cos(angle)*radius,.26+(i%3)*.012,Math.sin(angle)*radius+.015],[.09,.065,.085]);
  }
  // Short beard follows the lower jaw; eyes and eyebrows face local +Z.
  mesh(new THREE.SphereGeometry(1,16,10,0,Math.PI*2,Math.PI*.6,Math.PI*.37),hair,head,[0,0,.008],[.229,.284,.223]);
  for (const side of [-1,1]) {
    mesh(sphere,eyeWhite,head,[side*.093,.025,.202],[.038,.024,.022]);
    mesh(sphere,dark,head,[side*.093,.025,.222],[.017,.02,.009]);
    const brow=mesh(capsule(.012,.064),hair,head,[side*.092,.081,.209]); brow.rotation.z=Math.PI/2+side*.08;
    const moustache=mesh(capsule(.014,.064),hair,head,[side*.038,-.093,.221]); moustache.rotation.z=Math.PI/2-side*.12;
  }
  mesh(sphere,skin,head,[0,-.11,.216],[.043,.015,.018]);
  // Thin rectangular frames and the forehead marking match the supplied portrait.
  for(const side of [-1,1]){
    const frameShape=new THREE.Shape();frameShape.moveTo(-.087,-.054);frameShape.lineTo(.087,-.054);frameShape.lineTo(.087,.054);frameShape.lineTo(-.087,.054);frameShape.closePath();
    const lens=new THREE.Path();lens.moveTo(-.073,-.041);lens.lineTo(-.073,.041);lens.lineTo(.073,.041);lens.lineTo(.073,-.041);lens.closePath();frameShape.holes.push(lens);
    mesh(new THREE.ExtrudeGeometry(frameShape,{depth:.014,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:2,steps:1}),dark,head,[side*.098,.027,.226]);
    mesh(new THREE.BoxGeometry(.012,.014,.19),dark,head,[side*.185,.052,.14]);
  }
  mesh(new THREE.BoxGeometry(.037,.012,.015),dark,head,[0,.044,.235]);
  const markPoints=[[-.057,.21,.163],[-.048,.11,.222],[-.028,.095,.231],[.028,.095,.231],[.048,.11,.222],[.057,.21,.163]].map(point=>new THREE.Vector3(...point));
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(markPoints),24,.007,5,false),material(0xf7f0df),head);
  const centerMark=mesh(capsule(.004,.087),material(0xe4bd5c),head,[0,.157,.216]);centerMark.rotation.x=-.4;
  // Collar, placket, buttons, and rolled sleeves finish the plaid shirt.
  for (const side of [-1,1]) {
    const collar=mesh(new THREE.BoxGeometry(.1,.12,.027),shirtDark,body,[side*.075,1.48,.16]); collar.rotation.z=side*.4;
  }
  mesh(new THREE.BoxGeometry(.014,.42,.012),shirtDark,body,[0,1.2,.171]);
  for(let i=0;i<4;i++) mesh(sphere,shoes,body,[0,1.06+i*.105,.182],[.009,.009,.006]);
  const limbs=[];
  for(const side of [-1,1]) {
    const hip=new THREE.Group();hip.position.set(side*.135,.89,0);body.add(hip);
    mesh(capsule(.09,.28),pants,hip,[0,-.18,0]);
    const knee=new THREE.Group();knee.position.y=-.4;hip.add(knee);
    mesh(capsule(.077,.27),pants,knee,[0,-.16,0]);
    mesh(capsule(.078,.14),shoes,knee,[0,-.35,.065],[1,.65,1.3]);
    mesh(new THREE.BoxGeometry(.165,.035,.29),sole,knee,[0,-.4,.06]);
    const shoulder=new THREE.Group();shoulder.position.set(side*.285,1.45,0);body.add(shoulder);
    shoulder.rotation.z=side*.08;
    mesh(capsule(.079,.19),shirt,shoulder,[0,-.14,0]);
    mesh(new THREE.CylinderGeometry(.084,.084,.06,12),shirt,shoulder,[0,-.265,0]);
    const elbow=new THREE.Group();elbow.position.y=-.29;shoulder.add(elbow);
    mesh(capsule(.058,.17),skin,elbow,[0,-.115,0]);
    mesh(sphere,skin,elbow,[0,-.255,.012],[.065,.075,.055]);
    limbs.push({side,hip,knee,shoulder,elbow});
  }
  root.scale.setScalar(1.08);
  function pose(phase, amount = 0, wave = 0, time = phase) {
    body.position.y = amount * (.055 + Math.abs(Math.sin(phase*2))*.055);
    body.rotation.x = amount * .12;
    body.rotation.z = Math.sin(phase)*amount*.035;
    for(const limb of limbs) {
      const gait=Math.sin(phase+(limb.side===1?Math.PI:0));
      limb.hip.rotation.x=gait*amount*.72;
      limb.knee.rotation.x=Math.max(0,-gait)*amount*1.05+.04;
      limb.shoulder.rotation.x=-gait*amount*.62;
      limb.elbow.rotation.x=-.14-amount*.8;
    }
    const right=limbs[1];
    right.shoulder.rotation.z=.08+wave*1.65;
    right.elbow.rotation.z=wave*(.1+Math.sin(time*2.6)*.25);
    head.rotation.y=Math.sin(phase*.15)*amount*.1;
  }
  pose(0,0);
  return { root, pose, head, body };
}
