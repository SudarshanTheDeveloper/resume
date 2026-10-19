import * as THREE from '../assets/vendor/three.module.min.js';
import { createAvatar } from './avatar.js';
import { createLabWorld } from './lab-world.js';
import { stations, spawn, stationEntry, findPath, moveWithCollisions } from './game-navigation.js';
import {racePaddock} from './game-navigation.js';
import {createRacingGame} from './racing-game.js';

export function createPlayableLab({onProjectOpen,onActiveChange}) {
  const dialog=document.querySelector('#world'),canvas=document.querySelector('#game-canvas');
  const welcome=document.querySelector('#game-welcome'),playUI=document.querySelector('#game-play-ui');
  const status=document.querySelector('#game-status'),mini=document.querySelector('#game-minimap'),mapContext=mini.getContext('2d');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  let manualReducedMotion=null;
  const motionReduced=()=>manualReducedMotion??reduce.matches;
  const player={x:spawn.x,z:spawn.z,y:0,verticalVelocity:0,angle:.45};
  const keys=new Set(),pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster(),desiredCamera=new THREE.Vector3(),lookAt=new THREE.Vector3();
  let renderer,lab,avatar,camera,racer,frame=0,lastTime=0,time=0,phase=0,runAmount=0;
  const destinations=[...stations,racePaddock];
  let started=false,panel=null,suspended=false,contextLost=false,lowQuality=false,nearest=null,path=[],toastTimer=0;
  let orbit=.45,distance=9.6,stickX=0,stickY=0,touchRun=false,dragging=false,pointerStart=null,dragDistance=0,frameCount=0;
  const visited=new Set();
  try{for(const id of JSON.parse(localStorage.getItem('sudarshan-lab-visited')||'[]'))if(stations.some(s=>s.id===id))visited.add(id);}catch{/* Storage is optional. */}

  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    lab=createLabWorld(renderer);avatar=createAvatar();avatar.root.traverse(object=>{if(object.isMesh)object.castShadow=true;});lab.scene.add(avatar.root);
    camera=new THREE.PerspectiveCamera(42,1,.1,180);camera.position.set(25,23,30);camera.lookAt(0,0,1);
    dialog.dataset.renderer='webgl';document.querySelector('#game-loading').textContent='The lab is ready. Come on in.';
  }catch(error){
    dialog.classList.add('game-no-webgl');document.querySelector('#game-loading').textContent='This browser cannot open the 3D lab. Your full portfolio is available below.';
    document.querySelector('#game-start').disabled=true;
    document.querySelectorAll('#game-map-toggle,#game-help-toggle').forEach(button=>button.hidden=true);
    if(renderer)renderer.dispose();renderer=null;
  }

  function showToast(text){clearTimeout(toastTimer);const node=document.querySelector('#game-toast');node.textContent=text;node.hidden=false;toastTimer=setTimeout(()=>node.hidden=true,3200);status.textContent=text;}
  function clearMovement(){keys.clear();stickX=stickY=0;path=[];lab?.destination&&(lab.destination.visible=false);document.querySelector('#game-joystick-knob').style.transform='';}
  function setPanel(name){
    panel=name;clearMovement();
    for(const [id,value]of [['game-map','map'],['game-help','help'],['game-paused','pause']])document.querySelector(`#${id}`).hidden=name!==value;
    document.querySelector('#game-map-toggle').setAttribute('aria-expanded',String(name==='map'));
    document.querySelector('#game-help-toggle').setAttribute('aria-expanded',String(name==='help'));
    if(name){const node=document.querySelector(name==='map'?'#game-map':name==='help'?'#game-help':'#game-paused');(node.querySelector('button')||node).focus();}
    else if(started)canvas.focus({preventScroll:true});
    else document.querySelector('#game-start').focus({preventScroll:true});
    requestFrame();
  }
  function begin(){
    if(!renderer)return;
    started=true;welcome.hidden=true;playUI.hidden=false;setPanel(null);dialog.classList.add('is-playing');
    status.textContent='Exploration started. Move with W A S D or arrow keys. Use the map to visit any project.';
    resize();requestFrame();
  }
  function open(){
    if(dialog.open){canvas.focus({preventScroll:true});return;}
    dialog.showModal();document.body.classList.add('game-open');onActiveChange(true);suspended=false;
    resize();updateNearby();requestFrame();
    if(started){setPanel(null);canvas.focus({preventScroll:true});}else document.querySelector(renderer?'#game-start':'.game-skip').focus();
  }
  function exit(){
    if(!dialog.open)return;
    if(racer?.active)racer.exit();
    clearMovement();stop();dialog.close();
    document.body.classList.remove('game-open');onActiveChange(false);
    history.replaceState(null,'',`${location.pathname}${location.search}#work`);
    document.querySelector('#work').scrollIntoView({behavior:'instant'});
  }
  function home(){
    Object.assign(player,{x:spawn.x,z:spawn.z,y:0,verticalVelocity:0,angle:.45});orbit=.45;distance=9.6;clearMovement();setPanel(null);updateNearby();requestFrame();showToast('Back at the central plaza. Where to next?');
  }
  function travel(id){
    const station=destinations.find(s=>s.id===id);if(!station||!renderer)return;
    if(!started)begin();
    const entry=stationEntry(station);Object.assign(player,{...entry,y:0,verticalVelocity:0,angle:Math.PI});orbit=.25;
    clearMovement();setPanel(null);updateNearby();requestFrame();status.textContent=`Arrived at ${station.title}. Press E or choose Explore project.`;
  }
  function interact(){
    if(!started||panel||suspended)return;
    if(!nearest){showToast('Walk up to an exhibit, or choose one from the map.');return;}
    if(nearest.id==='race'){enterRace();return;}
    visited.add(nearest.id);try{localStorage.setItem('sudarshan-lab-visited',JSON.stringify([...visited]));}catch{/* Continue without persistence. */}
    document.querySelector('#game-visited').textContent=`${String(visited.size).padStart(2,'0')} / 04 EXPLORED`;
    clearMovement();suspended=true;stop();onProjectOpen(nearest.id,document.querySelector('#game-interact'));
  }
  function updateNearby(){
    const next=destinations.find(station=>Math.hypot(player.x-station.x,player.z-station.z)<5.8)||null;
    if(next?.id===nearest?.id)return;
    nearest=next;
    const prompt=document.querySelector('#game-interaction');prompt.hidden=!nearest;
    document.querySelector('#game-area').textContent=nearest?nearest.title:'The central plaza';
    document.querySelector('#game-area-note').textContent=nearest?nearest.subtitle:'Follow your curiosity. The exhibits are yours to explore.';
    if(nearest){
      document.querySelector('#game-interact').innerHTML=nearest.id==='race'?'Enter race <kbd>E</kbd>':'Explore project <kbd>E</kbd>';
      document.querySelector('#game-interact-number').textContent=nearest.number;
      document.querySelector('#game-interact-category').textContent=nearest.subtitle.toUpperCase();
      document.querySelector('#game-interact-title').textContent=nearest.title;
      prompt.style.borderColor=`${nearest.color}99`;status.textContent=`Near ${nearest.title}. Press E to explore the project.`;
    }
  }
  function enterRace(){
    if(!renderer)return;
    if(!started)begin();clearMovement();setPanel(null);
    if(!racer)racer=createRacingGame({renderer,environment:lab.environment.texture,canvas,requestFrame,motionReduced,onExit:()=>{lastTime=0;clearMovement();setPanel(null);updateNearby();requestFrame();}});
    racer.open();lastTime=0;requestFrame();
  }
  function jump(){if(started&&!panel&&!suspended&&player.y===0){player.verticalVelocity=5;requestFrame();}}
  function resize(){
    if(!renderer)return;const width=dialog.clientWidth||innerWidth,height=dialog.clientHeight||innerHeight;
    renderer.setPixelRatio(lowQuality?Math.min(devicePixelRatio||1,.85):Math.min(devicePixelRatio||1,width<751?1.2:1.5));
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.fov=width/height<.8?51:42;camera.updateProjectionMatrix();
    dialog.classList.toggle('game-compact',width<850);requestFrame();
  }
  function tick(delta){
    if(racer?.active){racer.tick(delta);return;}
    const playing=started&&!panel&&!suspended;
    let movementX=0,movementZ=0,speed=3.1,moving=false;
    if(playing){
      let forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-stickY;
      let right=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+stickX;
      const magnitude=Math.hypot(forward,right);
      if(magnitude>.04){
        path=[];lab.destination.visible=false;
        if(magnitude>1){forward/=magnitude;right/=magnitude;}
        movementX=-Math.sin(orbit)*forward+Math.cos(orbit)*right;movementZ=-Math.cos(orbit)*forward-Math.sin(orbit)*right;
      }else if(path.length){
        const point=path[0],dx=point.x-player.x,dz=point.z-player.z,length=Math.hypot(dx,dz);
        if(length<.18)path.shift();else{movementX=dx/length;movementZ=dz/length;}
        if(!path.length)lab.destination.visible=false;
      }
      speed=keys.has('shift')||touchRun?5.5:3.1;
      const beforeX=player.x,beforeZ=player.z;
      moveWithCollisions(player,movementX*speed*delta,movementZ*speed*delta);
      moving=Math.hypot(player.x-beforeX,player.z-beforeZ)>.0001;
      if(moving){const target=Math.atan2(movementX,movementZ);player.angle+=Math.atan2(Math.sin(target-player.angle),Math.cos(target-player.angle))*(motionReduced()?1:1-Math.exp(-delta*15));}
      if(player.verticalVelocity||player.y>0){player.verticalVelocity-=12*delta;player.y=Math.max(0,player.y+player.verticalVelocity*delta);if(player.y===0)player.verticalVelocity=0;}
      updateNearby();
    }
    if(!panel&&!suspended)time+=delta;
    const targetRun=moving?(speed>4?1:.58):0;
    runAmount=motionReduced()?targetRun:THREE.MathUtils.damp(runAmount,targetRun,12,delta);
    if(moving)phase+=delta*(speed>4?12:8);
    avatar.root.position.set(player.x,player.y-.082,player.z);avatar.root.rotation.y=player.angle;
    avatar.pose(phase,motionReduced()?0:runAmount,!started?.65:0,motionReduced()?0:time);
    if(started){desiredCamera.set(player.x+Math.sin(orbit)*distance,6.4+player.y*.35,player.z+Math.cos(orbit)*distance);lookAt.set(player.x,.85+player.y*.3,player.z);}
    else{desiredCamera.set(25,23,30);lookAt.set(0,0,1);}
    camera.position.lerp(desiredCamera,motionReduced()?1:1-Math.exp(-delta*5));camera.lookAt(lookAt);
    if(!panel&&!motionReduced())for(const item of lab.animated)item.object.rotation[item.axis]+=delta*item.speed;
    if(frameCount++%5===0||panel)drawMap();
    renderer.render(lab.scene,camera);
    canvas.dataset.playerX=player.x.toFixed(3);canvas.dataset.playerZ=player.z.toFixed(3);canvas.dataset.playerY=player.y.toFixed(3);
    canvas.dataset.moving=String(moving);canvas.dataset.mode=suspended?'suspended':panel?'paused':started?'playing':'intro';canvas.dataset.nearby=nearest?.id||'';
    canvas.dataset.reducedMotion=String(motionReduced());
  }
  function drawMap(){
    const ctx=mapContext,w=mini.width,h=mini.height,scale=5.6,cx=w/2,cy=h/2;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#0c231c';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#74967f44';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,cy,125,116,0,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#7a9e8766';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(cx,cy-95);ctx.lineTo(cx,cy+95);ctx.stroke();
    for(const station of stations){const x=cx+station.x*scale,y=cy+station.z*scale;ctx.beginPath();ctx.moveTo(cx,y+21);ctx.lineTo(x,y+21);ctx.stroke();ctx.fillStyle=station.color;ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#123021';ctx.font='bold 10px Arial';ctx.textAlign='center';ctx.fillText(station.number,x,y+3);if(visited.has(station.id)){ctx.strokeStyle=station.color;ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,14,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#7a9e8766';ctx.lineWidth=7;}}
    ctx.save();ctx.translate(cx+player.x*scale,cy+player.z*scale);ctx.rotate(-player.angle);ctx.fillStyle='#f8fff0';ctx.shadowColor='#cfffd0';ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(-5,-5);ctx.lineTo(5,-5);ctx.closePath();ctx.fill();ctx.restore();
    ctx.fillStyle='#f3d19c';ctx.fillRect(cx-8,cy-16*scale-6,16,12);ctx.fillStyle='#163127';ctx.font='bold 9px Arial';ctx.textAlign='center';ctx.fillText('05',cx,cy-16*scale+3);
  }
  function animate(now){
    frame=0;if(!dialog.open||suspended||contextLost||document.hidden)return;
    const delta=lastTime?Math.min((now-lastTime)/1000,.1):1/60;lastTime=now;tick(delta);
    if(racer?.active?racer.shouldAnimate:!panel&&(started||!motionReduced()))requestFrame();
  }
  function requestFrame(){if(renderer&&dialog.open&&!suspended&&!contextLost&&!document.hidden&&!frame)frame=requestAnimationFrame(animate);}
  function stop(){cancelAnimationFrame(frame);frame=0;lastTime=0;}

  document.querySelector('#game-start').addEventListener('click',begin);
  document.querySelectorAll('[data-enter-race]').forEach(button=>button.addEventListener('click',enterRace));
  document.querySelectorAll('[data-game-exit]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();exit();}));
  document.querySelector('#game-map-toggle').addEventListener('click',()=>setPanel(panel==='map'?null:'map'));
  document.querySelector('#game-help-toggle').addEventListener('click',()=>setPanel(panel==='help'?null:'help'));
  document.querySelectorAll('[data-close-game-panel]').forEach(button=>button.addEventListener('click',()=>setPanel(null)));
  document.querySelectorAll('[data-travel]').forEach(button=>button.addEventListener('click',()=>travel(button.dataset.travel)));
  document.querySelector('#game-pause').addEventListener('click',()=>setPanel('pause'));
  document.querySelector('#game-resume').addEventListener('click',()=>setPanel(null));
  document.querySelector('#game-home').addEventListener('click',home);document.querySelector('#game-map-home').addEventListener('click',()=>{if(!started)begin();home();});
  document.querySelector('#game-reset-visited').addEventListener('click',()=>{visited.clear();try{localStorage.removeItem('sudarshan-lab-visited');}catch{/* Storage is optional. */}document.querySelector('#game-visited').textContent='00 / 04 EXPLORED';drawMap();showToast('Explored markers reset.');});
  document.querySelector('#game-interact').addEventListener('click',interact);
  document.querySelector('#game-quality').addEventListener('click',event=>{lowQuality=!lowQuality;renderer.shadowMap.enabled=!lowQuality;event.currentTarget.textContent=`Quality: ${lowQuality?'low':'high'}`;event.currentTarget.setAttribute('aria-pressed',String(lowQuality));resize();});
  function updateMotion(){const value=motionReduced();document.querySelector('#game-motion').setAttribute('aria-pressed',String(value));requestFrame();}
  document.querySelector('#game-motion').addEventListener('click',()=>{manualReducedMotion=!motionReduced();updateMotion();});
  reduce.addEventListener('change',updateMotion);updateMotion();
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(racer?.active){racer.pause();return;}if(!started)exit();else setPanel(panel?null:'pause');});
  dialog.addEventListener('keydown',event=>{
    if(racer?.active){racer.handleKey(event);return;}
    if(suspended)return;
    const key=event.key.toLowerCase();
    if(key==='m'&&!event.repeat){event.preventDefault();setPanel(panel==='map'?null:'map');return;}
    if(key==='p'&&!event.repeat&&started){event.preventDefault();setPanel(panel?null:'pause');return;}
    if(event.target.closest('#game-map,#game-help,#game-paused'))return;
    if((key==='e'||key==='enter')&&event.target===canvas&&!event.repeat){event.preventDefault();interact();return;}
    if(!started||panel||event.target!==canvas)return;
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift',' '].includes(key)){event.preventDefault();keys.add(key);if(key===' '&&!event.repeat)jump();requestFrame();}
  });
  window.addEventListener('keyup',event=>{keys.delete(event.key.toLowerCase());racer?.releaseKey(event.key.toLowerCase());});
  window.addEventListener('blur',()=>{clearMovement();if(racer?.active){racer.clearInput();racer.pause();return;}if(dialog.open&&started&&!suspended)setPanel('pause');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearMovement();stop();if(racer?.active){racer.clearInput();racer.pause();return;}if(started&&dialog.open&&!suspended)setPanel('pause');}else requestFrame();});
  canvas.addEventListener('pointerdown',event=>{if(racer?.active){canvas.focus({preventScroll:true});return;}if(!started||panel||suspended||!event.isPrimary)return;canvas.focus({preventScroll:true});pointerStart={x:event.clientX,y:event.clientY};dragging=true;dragDistance=0;canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!dragging||!pointerStart)return;const dx=event.clientX-pointerStart.x,dy=event.clientY-pointerStart.y;dragDistance+=Math.hypot(dx,dy);if(dragDistance>6)orbit-=dx*.006;pointerStart={x:event.clientX,y:event.clientY};requestFrame();});
  canvas.addEventListener('pointerup',event=>{
    if(!dragging)return;dragging=false;if(dragDistance>6||panel||suspended)return;
    const bounds=canvas.getBoundingClientRect();pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);raycaster.setFromCamera(pointer,camera);
    const exhibit=raycaster.intersectObjects(lab.pickables,false)[0];
    const station=exhibit&&destinations.find(s=>s.id===exhibit.object.userData.station);
    const groundHit=raycaster.intersectObject(lab.ground,false)[0];
    const destination=station?stationEntry(station):groundHit?{x:groundHit.point.x,z:groundHit.point.z}:null;
    if(!destination)return;const route=findPath(player,destination);
    if(route.length){path=route;lab.destination.position.set(destination.x,.045,destination.z);lab.destination.visible=true;}else showToast('Choose a point on the paths, or use the map to visit an exhibit.');requestFrame();
  });
  for(const event of ['pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{dragging=false;pointerStart=null;});
  canvas.addEventListener('wheel',event=>{if(racer?.active||!started||panel)return;event.preventDefault();distance=THREE.MathUtils.clamp(distance+event.deltaY*.012,6.5,18);requestFrame();},{passive:false});
  const joystick=document.querySelector('#game-joystick'),knob=document.querySelector('#game-joystick-knob');let stickPointer=null;
  function updateStick(event){const bounds=joystick.getBoundingClientRect(),x=(event.clientX-bounds.left-bounds.width/2)/(bounds.width*.36),y=(event.clientY-bounds.top-bounds.height/2)/(bounds.height*.36),length=Math.max(1,Math.hypot(x,y));stickX=x/length;stickY=y/length;knob.style.transform=`translate(${stickX*bounds.width*.27}px,${stickY*bounds.height*.27}px)`;requestFrame();}
  joystick.addEventListener('pointerdown',event=>{event.preventDefault();stickPointer=event.pointerId;joystick.setPointerCapture(stickPointer);canvas.focus({preventScroll:true});updateStick(event);});
  joystick.addEventListener('pointermove',event=>{if(event.pointerId===stickPointer)updateStick(event);});
  function releaseStick(){stickPointer=null;stickX=stickY=0;knob.style.transform='';}
  for(const event of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(event,releaseStick);
  document.querySelector('#game-touch-run').addEventListener('click',event=>{touchRun=!touchRun;event.currentTarget.setAttribute('aria-pressed',String(touchRun));canvas.focus({preventScroll:true});});
  document.querySelector('#game-touch-jump').addEventListener('click',()=>{jump();canvas.focus({preventScroll:true});});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;stop();clearMovement();racer?.clearInput();if(racer?.active)racer.pause();showToast('The 3D view was interrupted. You can still open the quick portfolio.');});
  canvas.addEventListener('webglcontextrestored',()=>{contextLost=false;resize();if(racer?.active)racer.pause();else if(started)setPanel('pause');requestFrame();});
  window.addEventListener('resize',resize,{passive:true});
  document.querySelector('#game-visited').textContent=`${String(visited.size).padStart(2,'0')} / 04 EXPLORED`;
  return{
    open,exit,enterRace,
    setProjectOpen(value){suspended=value;clearMovement();if(value)stop();else if(dialog.open){canvas.focus({preventScroll:true});requestFrame();}},
    get isOpen(){return dialog.open;},
    dispose(){racer?.dispose();stop();clearTimeout(toastTimer);window.removeEventListener('resize',resize);if(!lab)return;const geometries=new Set(),materials=new Set(),textures=new Set(lab.textures);lab.scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material){for(const material of Array.isArray(object.material)?object.material:[object.material]){materials.add(material);if(material.map)textures.add(material.map);}}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());lab.environment.dispose();renderer.dispose();}
  };
}
