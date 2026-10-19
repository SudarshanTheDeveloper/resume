import assert from 'node:assert/strict';
import {track,TRACK_LENGTH,ROAD_WIDTH,RACE_LAPS,pointAt,nearestTrack,createRaceState,stepRace,updateProgress,resetCar,formatTime} from '../js/race-physics.js';
import {racePaddock,spawn,stationEntry,findPath,isWalkable} from '../js/game-navigation.js';

assert(TRACK_LENGTH>600&&TRACK_LENGTH<1300,'Circuit has a useful racing length');
for(const p of track){const near=nearestTrack(p.x,p.z);assert(Math.abs(near.offset)<.01);assert(Number.isFinite(p.angle??p.dx));}
assert(Math.hypot(pointAt(0).x-pointAt(TRACK_LENGTH).x,pointAt(0).z-pointAt(TRACK_LENGTH).z)<.001,'Circuit must close');
const countdown=createRaceState();for(let i=0;i<100;i++)stepRace(countdown,{throttle:1},1/90);
assert.equal(countdown.speed,0,'Car cannot leave before lights out');assert.equal(countdown.elapsed,0,'Countdown is excluded from lap time');
const driving=createRaceState();driving.countdown=0;for(let i=0;i<120;i++)stepRace(driving,{throttle:1},1/90);
assert(driving.speed>14&&driving.x>8,'Throttle must propel the car');const speed=driving.speed;for(let i=0;i<90;i++)stepRace(driving,{brake:1},1/90);assert(driving.speed<speed*.2,'Brakes must slow the car');
const steering=createRaceState();steering.countdown=0;steering.speed=20;const originalAngle=steering.angle;for(let i=0;i<30;i++)stepRace(steering,{steer:1},1/90);assert(steering.angle<originalAngle,'Right steering turns right');
const road=createRaceState(),grass=createRaceState();road.countdown=grass.countdown=0;road.speed=grass.speed=20;const p=pointAt(0);grass.x+=p.nx*8;grass.z+=p.nz*8;stepRace(road,{},.04);stepRace(grass,{},.04);assert(grass.offroad&&grass.speed<road.speed,'Grass imposes grip/speed loss');
const barrier=createRaceState();barrier.countdown=0;barrier.x+=p.nx*14;barrier.z+=p.nz*14;stepRace(barrier,{},.01);assert(Math.abs(nearestTrack(barrier.x,barrier.z).offset)<ROAD_WIDTH/2+4.3,'Car cannot escape barriers');
const backwards=createRaceState();backwards.countdown=0;for(let d=0;d>-TRACK_LENGTH;d-=1){const q=pointAt(d);updateProgress(backwards,nearestTrack(q.x,q.z));}assert.equal(backwards.lap,0,'Reverse driving cannot award a lap');
const shortcut=createRaceState();shortcut.countdown=0;const q=pointAt(TRACK_LENGTH*.6);updateProgress(shortcut,nearestTrack(q.x,q.z));assert.equal(shortcut.nextGate,1,'Skipping sectors cannot award progress');
// Follow the entire circuit through the same nearest-point/checkpoint path used in play.
const race=createRaceState();race.countdown=0;
for(let d=0;d<TRACK_LENGTH*RACE_LAPS+3&&!race.finished;d+=.8){const q=pointAt(d);race.elapsed+=.8/30;updateProgress(race,nearestTrack(q.x,q.z));}
assert.equal(race.lap,RACE_LAPS,'Ordered sectors complete all three laps');assert(race.finished&&race.finishTime>0&&race.bestLap>20,'Race produces a valid finish and lap record');
const reset=createRaceState();reset.countdown=0;reset.nextGate=4;reset.elapsed=10;resetCar(reset);assert.equal(reset.elapsed,13);assert.equal(reset.penalty,3);assert.equal(reset.speed,0);assert(isWalkable(stationEntry(racePaddock).x,stationEntry(racePaddock).z));assert(findPath(spawn,stationEntry(racePaddock)).length>0,'Race paddock reachable on foot');
assert.equal(formatTime(65.4321),'1:05.432');assert.equal(formatTime(null),'—:——.———');
// An independent look-ahead driver must be able to finish with actual steering,
// throttle and braking, rather than moving the car directly between checkpoints.
const drivenRace=createRaceState();drivenRace.countdown=0;
for(let i=0;i<90*180&&!drivenRace.finished;i++){
  const near=nearestTrack(drivenRace.x,drivenRace.z),aim=pointAt(near.distance+7+drivenRace.speed*.16),ahead=pointAt(near.distance+18);
  const wanted=Math.atan2(aim.x-drivenRace.x,aim.z-drivenRace.z),error=Math.atan2(Math.sin(wanted-drivenRace.angle),Math.cos(wanted-drivenRace.angle));
  const bend=Math.abs(Math.atan2(Math.sin(ahead.angle-near.angle),Math.cos(ahead.angle-near.angle))),desired=Math.max(10,34/(1+bend*3+Math.abs(error)*.6));
  stepRace(drivenRace,{throttle:drivenRace.speed<desired?1:0,brake:drivenRace.speed>desired+1?.65:0,steer:Math.max(-1,Math.min(1,-error*3.4))},1/90);
}
assert(drivenRace.finished,'The circuit must be drivable for a full race using normal inputs');
console.log('Passed: closed circuit, countdown, acceleration, braking, steering, off-road drag, barriers, reverse/shortcut rejection, ordered three-lap finish, reset penalties, timing, and paddock navigation.');
console.log(`Full driving simulation finished three laps in ${formatTime(drivenRace.finishTime)}.`);
