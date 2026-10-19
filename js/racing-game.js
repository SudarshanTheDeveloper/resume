import * as THREE from '../assets/vendor/three.module.min.js';
import {createRaceWorld,liveries} from './race-world.js';
import {track,pointAt,TRACK_LENGTH,RACE_LAPS,createRaceState,stepRace,resetCar,formatTime} from './race-physics.js';

export function createRacingGame({renderer,environment,canvas,onExit,requestFrame,motionReduced}){
  const world=createRaceWorld(environment),camera=new THREE.PerspectiveCamera(53,1,.15,650),ui=document.querySelector('#race-ui'),dialog=document.querySelector('#world');
  const $=id=>document.querySelector(`#${id}`),keys=new Set(),touch=new Set(),position=new THREE.Vector3(),target=new THREE.Vector3();
  let active=false,mode='garage',state=createRaceState(),best=null,selected=0,ai=[],cameraReady=false,hudClock=0,lastLap=0;
  try{const saved=Number(localStorage.getItem('sudarshan-apex-best-v1'));if(Number.isFinite(saved)&&saved>0)best=saved;}catch{/* Optional browser-local record. */}
  function announce(text){$('race-status').textContent=text;}
  function clearInput(){keys.clear();touch.clear();}
  function panels(){
    $('race-garage').hidden=mode!=='garage';$('race-hud').hidden=mode==='garage';$('race-paused').hidden=mode!=='paused';$('race-results').hidden=mode!=='finished';
    $('race-controls').hidden=mode!=='racing';$('race-pause').hidden=mode!=='racing';
    $('race-hud').inert=mode==='paused'||mode==='finished';
    $('race-best').textContent=formatTime(best);$('race-garage-best').textContent=formatTime(best);
  }
  function open(){active=true;mode='garage';state=createRaceState();ai=[];cameraReady=false;clearInput();dialog.classList.add('is-racing');ui.hidden=false;canvas.setAttribute('aria-label','Apex Circuit racing game. W or up to accelerate, S or down or Space to brake. A and D or left and right to steer. R resets the car with a three-second penalty. Escape pauses.');panels();$('race-start').focus();announce('Welcome to Apex Circuit. Choose a livery and start a three-lap race.');requestFrame();}
  function start(){
    state=createRaceState();ai=[{distance:7,speed:0,pace:29,finished:false,finishTime:null},{distance:14,speed:0,pace:31,finished:false,finishTime:null}];mode='racing';lastLap=0;cameraReady=false;clearInput();panels();canvas.focus({preventScroll:true});announce('Three-lap race. Wait for lights out, then accelerate.');requestFrame();
  }
  function exit(){active=false;clearInput();ui.hidden=true;dialog.classList.remove('is-racing');canvas.setAttribute('aria-label','Playable portfolio. Use W A S D or arrow keys to move, Shift to run, Space to jump, and E to interact. Drag to orbit the camera, or click the ground to walk.');onExit();}
  function pause(){if(!active||mode!=='racing')return;mode='paused';clearInput();panels();$('race-continue').focus();announce('Race paused. Your lap timer is stopped.');requestFrame();}
  function resume(){if(mode!=='paused')return;mode='racing';clearInput();panels();canvas.focus({preventScroll:true});requestFrame();}
  function reset(){if(mode!=='racing'||state.countdown>0)return;resetCar(state);cameraReady=false;clearInput();announce('Car returned to the last checkpoint. Three-second penalty.');requestFrame();}
  function place(){return 1+ai.filter(r=>r.finished?(state.finished?r.finishTime<state.finishTime:true):r.distance>state.progress).length;}
  function finished(){mode='finished';clearInput();panels();$('race-result-place').textContent=`P${place()}`;$('race-result-time').textContent=formatTime(state.finishTime);$('race-result-best').textContent=formatTime(state.bestLap);$('race-result-penalty').textContent=state.penalty?`${state.penalty}s reset penalties included`:'Clean run. No reset penalties.';$('race-again').focus();announce(`Race finished. Position ${place()} of three. Total time ${formatTime(state.finishTime)}.`);}
  function updateHUD(){
    $('race-speed').textContent=String(Math.round(state.speed*3.6)).padStart(3,'0');$('race-gear').textContent=state.speed<.8?'N':Math.min(8,1+Math.floor(state.speed/9));
    $('race-lap').textContent=`${Math.min(RACE_LAPS,state.lap+1)} / ${RACE_LAPS}`;$('race-position').textContent=`P${place()}`;
    $('race-current').textContent=formatTime(state.elapsed-state.lapStart);$('race-last').textContent=formatTime(state.lastLap);$('race-best').textContent=formatTime(best);
    const message=state.countdown>0?(state.countdown>.3?String(Math.ceil(state.countdown-.2)):'LIGHTS OUT'):state.elapsed<1.3?'GO':state.impact>.1?'BARRIER CONTACT':state.wrongWay?'WRONG WAY':state.offroad?'OFF TRACK · LESS GRIP':'';
    $('race-message').textContent=message;$('race-message').hidden=!message;
    $('race-revs').style.width=`${Math.min(100,(state.speed%9)/9*100)}%`;
    for(let i=0;i<world.lights.length;i++)world.lights[i].material.color.setHex(state.countdown>0&&i<(3.2-state.countdown)*2?0xff433c:0x381719);
    drawMap();
  }
  function drawMap(){
    const ctx=$('race-minimap').getContext('2d'),w=280,h=210,s=.88,x0=140,z0=115;
    ctx.clearRect(0,0,w,h);ctx.lineJoin='round';ctx.lineCap='round';
    for(const [width,color]of [[11,'#6f96845a'],[6,'#c2d2c3']]){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();track.forEach((p,i)=>i?ctx.lineTo(x0+p.x*s,z0+p.z*s):ctx.moveTo(x0+p.x*s,z0+p.z*s));ctx.closePath();ctx.stroke();}
    const startPoint=pointAt(0);ctx.fillStyle='#f3d19c';ctx.fillRect(x0+startPoint.x*s-2,z0+startPoint.z*s-6,4,12);
    for(let i=0;i<ai.length;i++){const p=pointAt(ai[i].distance);ctx.fillStyle=liveries[i+1].hex;ctx.beginPath();ctx.arc(x0+p.x*s,z0+p.z*s,3,0,Math.PI*2);ctx.fill();}
    ctx.save();ctx.translate(x0+state.x*s,z0+state.z*s);ctx.rotate(-state.angle);ctx.fillStyle='#fff4d9';ctx.strokeStyle='#143029';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,7);ctx.lineTo(-4,-4);ctx.lineTo(4,-4);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  function tick(dt){
    if(mode==='racing'){
      const countdownBefore=state.countdown;
      // Small fixed substeps keep driving and barriers stable after a slow frame.
      const count=Math.max(1,Math.ceil(dt/(1/90))),input={throttle:keys.has('w')||keys.has('arrowup')||touch.has('throttle')?1:0,brake:keys.has('s')||keys.has('arrowdown')||keys.has(' ')||touch.has('brake')?1:0,steer:(keys.has('d')||keys.has('arrowright')||touch.has('right')?1:0)-(keys.has('a')||keys.has('arrowleft')||touch.has('left')?1:0)};
      for(let i=0;i<count;i++)stepRace(state,input,dt/count);
      if(countdownBefore<=0)for(const rival of ai){
        if(rival.finished)continue;
        const p=pointAt(rival.distance),future=pointAt(rival.distance+14),bend=Math.abs(Math.atan2(Math.sin(future.angle-p.angle),Math.cos(future.angle-p.angle))),speed=rival.pace/(1+bend*1.7);
        rival.speed=THREE.MathUtils.damp(rival.speed,speed,1.3,dt);rival.distance+=rival.speed*dt;
        if(rival.distance>=TRACK_LENGTH*RACE_LAPS){rival.finished=true;rival.finishTime=state.elapsed;}
      }
      // Nearby cars are solid enough to nudge, without spinning the player around.
      if(state.countdown<=0&&!state.finished)for(const [i,rival]of ai.entries()){const p=pointAt(rival.distance),offset=i?1.7:-1.7;if(Math.hypot(state.x-p.x-p.nx*offset,state.z-p.z-p.nz*offset)<2.4&&state.speed>rival.speed){state.speed=rival.speed*.85;state.impact=.35;}}
      if(state.lap>lastLap){lastLap=state.lap;if(best===null||state.lastLap<best){best=state.lastLap;try{localStorage.setItem('sudarshan-apex-best-v1',String(best));}catch{/* Continue offline. */}}announce(`Lap ${state.lap} complete. ${formatTime(state.lastLap)}.`);}
      if(state.finished)finished();
    }
    world.car.root.position.set(state.x,.04,state.z);world.car.root.rotation.y=state.angle;world.car.animate(state.speed,state.steer,mode==='racing'?dt:0);
    for(let i=0;i<world.rivals.length;i++){const rival=ai[i]||{distance:7+i*7,speed:0},p=pointAt(rival.distance),car=world.rivals[i];car.root.position.set(p.x+p.nx*(i?1.7:-1.7),.04,p.z+p.nz*(i?1.7:-1.7));car.root.rotation.y=p.angle;car.animate(rival.speed,0,mode==='racing'?dt:0);}
    if(mode==='garage'){position.set(state.x-19,12,state.z+18);target.set(state.x+7,0,state.z);camera.fov=48;}
    else{const behind=9.5+state.speed*.055;position.set(state.x-Math.sin(state.angle)*behind,4.5+state.speed*.018,state.z-Math.cos(state.angle)*behind);target.set(state.x+Math.sin(state.angle)*10,1.1,state.z+Math.cos(state.angle)*10);camera.fov=53+state.speed*.12;}
    camera.aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight);camera.updateProjectionMatrix();
    camera.position.lerp(position,!cameraReady||motionReduced()?1:1-Math.exp(-dt*6));camera.lookAt(target);cameraReady=true;
    world.sun.position.set(state.x-45,95,state.z+65);world.sun.target.position.set(state.x,0,state.z);world.sun.target.updateMatrixWorld();
    renderer.render(world.scene,camera);hudClock+=dt;if(hudClock>.055||mode!=='racing'){updateHUD();hudClock=0;}
    canvas.dataset.mode=`race-${mode}`;canvas.dataset.raceX=state.x.toFixed(3);canvas.dataset.raceZ=state.z.toFixed(3);canvas.dataset.raceSpeed=state.speed.toFixed(2);canvas.dataset.raceLap=String(state.lap);canvas.dataset.raceTime=state.elapsed.toFixed(3);canvas.dataset.raceCountdown=state.countdown.toFixed(2);canvas.dataset.raceOffroad=String(state.offroad);
  }
  function handleKey(event){
    const key=event.key.toLowerCase();
    if(key==='escape'||key==='p'){event.preventDefault();if(!event.repeat){if(mode==='paused')resume();else pause();}return;}
    if(event.target!==canvas||mode!=='racing')return;
    if(['w','s','a','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)){event.preventDefault();keys.add(key);requestFrame();}
    if(key==='r'&&!event.repeat){event.preventDefault();reset();}
  }
  $('race-start').addEventListener('click',start);$('race-again').addEventListener('click',start);$('race-pause').addEventListener('click',pause);$('race-continue').addEventListener('click',resume);$('race-reset-car').addEventListener('click',()=>{reset();canvas.focus({preventScroll:true});});
  $('race-restart').addEventListener('click',start);
  document.querySelectorAll('[data-leave-race]').forEach(button=>button.addEventListener('click',exit));
  document.querySelectorAll('[data-livery]').forEach(button=>button.addEventListener('click',()=>{selected=Number(button.dataset.livery);world.car.paint.color.setHex(liveries[selected].color);document.querySelectorAll('[data-livery]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('race-livery-name').textContent=liveries[selected].name;requestFrame();}));
  for(const button of document.querySelectorAll('[data-race-input]')){
    const input=button.dataset.raceInput;
    button.addEventListener('pointerdown',event=>{event.preventDefault();if(mode!=='racing')return;button.setPointerCapture(event.pointerId);touch.add(input);canvas.focus({preventScroll:true});requestFrame();});
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>touch.delete(input));
  }
  return {open,exit,pause,tick,handleKey,clearInput,releaseKey:key=>keys.delete(key),get active(){return active;},get shouldAnimate(){return mode==='racing';},dispose(){world.scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});world.textures.forEach(t=>t.dispose());}};
}
