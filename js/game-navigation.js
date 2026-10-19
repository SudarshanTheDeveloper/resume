export const stations = [
  { id: 'panorama', title: 'Capture Studio', subtitle: 'Rendering & panoramas', x: -10, z: -7, color: '#b9f4cb', number: '01' },
  { id: 'lighting', title: 'Light Pavilion', subtitle: 'Lighting & measurement', x: 10, z: -7, color: '#efd094', number: '02' },
  { id: 'runtime', title: 'XR Portal', subtitle: 'Runtime assets & OpenXR', x: -10, z: 8, color: '#a3d8ed', number: '03' },
  { id: 'diagnostics', title: 'Systems Lab', subtitle: 'Linux & production', x: 10, z: 8, color: '#a9dfcc', number: '04' }
];
export const spawn = { x: 0, z: 8 };
export const racePaddock={id:'race',title:'Race Paddock',subtitle:'Apex Circuit · three-lap sprint',x:0,z:-16,color:'#f3d19c',number:'05'};
export const obstacles = [
  {x:racePaddock.x,z:racePaddock.z,radius:2.4},
  ...stations.map(station => ({ x: station.x, z: station.z, radius: 3.45 })),
  { x: 0, z: -1, radius: 1.5 },
  ...[[-4.3,5.5],[4.3,5.5],[-5,-10],[5,12]].map(([x,z])=>({x,z,radius:.85})),
  ...[[-3,5],[3,5],[-3,-11],[3,-11],[-16,-2],[16,-2],[-16,13],[16,13]].map(([x,z])=>({x,z,radius:.18})),
  ...Array.from({length:30},(_,i)=>{const angle=i/30*Math.PI*2,radius=19.5+(i%3)*.65;return{x:Math.cos(angle)*radius,z:Math.sin(angle)*radius,radius:.2};})
];
export function isWalkable(x, z, radius = .32) {
  return Math.hypot(x, z) < 22.2 - radius && !obstacles.some(obstacle => Math.hypot(x - obstacle.x, z - obstacle.z) < obstacle.radius + radius);
}
export function stationEntry(station) { return { x: station.x, z: station.z + 4.2 }; }
export function moveWithCollisions(position, dx, dz) {
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .18));
  for (let i = 0; i < count; i++) {
    if (isWalkable(position.x + dx / count, position.z)) position.x += dx / count;
    if (isWalkable(position.x, position.z + dz / count)) position.z += dz / count;
  }
  return position;
}

// A small ground grid makes click-to-walk route around the exhibits.
export function findPath(start, destination) {
  if (!isWalkable(destination.x, destination.z)) return [];
  const step = .7, key = (x, z) => `${x},${z}`;
  const startCell = { x: Math.round(start.x / step), z: Math.round(start.z / step) };
  const goal = { x: Math.round(destination.x / step), z: Math.round(destination.z / step) };
  if (!isWalkable(goal.x * step, goal.z * step)) return [];
  const open = [{ ...startCell, score: 0 }], parents = new Map(), costs = new Map([[key(startCell.x, startCell.z), 0]]), closed = new Set();
  const directions = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];
  let iterations = 0;
  while (open.length && iterations++ < 5000) {
    open.sort((a,b) => a.score - b.score);
    const current = open.shift(), currentKey = key(current.x,current.z);
    if (closed.has(currentKey)) continue;
    if (current.x === goal.x && current.z === goal.z) {
      const points = [destination]; let cursor = currentKey;
      while (parents.has(cursor)) { const [x,z] = cursor.split(',').map(Number); points.push({ x:x*step,z:z*step }); cursor = parents.get(cursor); }
      return points.reverse();
    }
    closed.add(currentKey);
    for (const [dx,dz] of directions) {
      const x=current.x+dx,z=current.z+dz,nextKey=key(x,z);
      if(closed.has(nextKey)||!isWalkable(x*step,z*step))continue;
      if(dx&&dz&&(!isWalkable((current.x+dx)*step,current.z*step)||!isWalkable(current.x*step,(current.z+dz)*step)))continue;
      const cost=costs.get(currentKey)+Math.hypot(dx,dz);
      if(cost>=(costs.get(nextKey)??Infinity))continue;
      costs.set(nextKey,cost);parents.set(nextKey,currentKey);
      open.push({x,z,score:cost+Math.hypot(goal.x-x,goal.z-z)});
    }
  }
  return [];
}
