import assert from 'node:assert/strict';
import { stations, spawn, stationEntry, isWalkable, findPath, moveWithCollisions } from '../js/game-navigation.js';

for(const station of stations){
  const entry=stationEntry(station),route=findPath(spawn,entry);
  assert(route.length>0,`No route to ${station.id}`);
  for(const point of route)assert(isWalkable(point.x,point.z),`Route crosses an obstacle for ${station.id}`);
  let player={...spawn};
  for(const point of route){let steps=0;while(Math.hypot(point.x-player.x,point.z-player.z)>.12&&steps++<150){const dx=point.x-player.x,dz=point.z-player.z,length=Math.hypot(dx,dz),distance=Math.min(.08,length);moveWithCollisions(player,dx/length*distance,dz/length*distance);}}
  assert(Math.hypot(player.x-entry.x,player.z-entry.z)<.2,`Cannot follow the path to ${station.id}`);
  assert(Math.hypot(player.x-station.x,player.z-station.z)<5.8,`No interaction range at ${station.id}`);
  for(const other of stations){const between=findPath(entry,stationEntry(other));assert(between.length>0,`No route from ${station.id} to ${other.id}`);}
}
const blocked={x:-16,z:-7};moveWithCollisions(blocked,14,0);
assert(blocked.x<-13,'High-speed movement tunnels through an exhibit');
assert(!isWalkable(30,0),'The island boundary must be solid');
assert.equal(findPath(spawn,{x:-10,z:-7}).length,0,'Cannot walk inside exhibit geometry');
const edge={x:21,z:0};moveWithCollisions(edge,10,0);assert(edge.x<22,'Cannot leave the island');
console.log('Passed: four navigable exhibits, sixteen inter-exhibit routes, route following, interaction range, collision tunneling, and island boundary.');
