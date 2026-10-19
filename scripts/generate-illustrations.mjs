// Deterministic vector studies, deliberately distinct from actual project media.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const destination = fileURLToPath(new URL('../assets/media/', import.meta.url));
await mkdir(destination, { recursive: true });
const fmt = value => Number(value.toFixed(2));
const point = (x, y, z) => [fmt(400 + (x - z) * .866), fmt(310 + (x + z) * .5 - y)];
const path = points => points.map(p => p.join(',')).join(' ');
const line = (a, b, color = '#a6c5aa', opacity = .3, width = 1) => `<path d="M${a}L${b}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${width}"/>`;
const polygon = (points, fill, stroke = '#a5c3a2', opacity = .5) => `<polygon points="${path(points)}" fill="${fill}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/>`;
function box(x, z, w, d, h, colors = ['#3e6044', '#263d2b', '#66816a']) {
  return polygon([point(x, 0, z), point(x+w, 0, z), point(x+w, h, z), point(x, h, z)], colors[0]) + polygon([point(x+w, 0, z), point(x+w, 0, z+d), point(x+w, h, z+d), point(x+w, h, z)], colors[1]) + polygon([point(x, h, z), point(x+w, h, z), point(x+w, h, z+d), point(x, h, z+d)], colors[2]);
}
function grid(color = '#a4c8a9') {
  let result = '<g opacity=".16">';
  for (let i=-300; i<=300; i+=30) result += line(point(i, -10, -300), point(i, -10, 300), color, .8) + line(point(-300, -10, i), point(300, -10, i), color, .8);
  return result + '</g>';
}
function svg(body, { bg = '#13251b', glow = '#4c7650' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><defs><radialGradient id="bg"><stop stop-color="${glow}" stop-opacity=".43"/><stop offset="1" stop-color="${bg}"/></radialGradient><linearGradient id="light" x2="1" y2="1"><stop stop-color="#e4bd7c" stop-opacity=".45"/><stop offset="1" stop-color="#e4bd7c" stop-opacity="0"/></linearGradient><linearGradient id="metal" x2="1" y2="1"><stop stop-color="#def6d8"/><stop offset=".35" stop-color="#82a784"/><stop offset="1" stop-color="#294b33"/></linearGradient></defs><path fill="${bg}" d="M0 0h800v520H0z"/><path fill="url(#bg)" d="M0 0h800v520H0z"/>${body}</svg>`;
}
let panorama = grid();
panorama += '<g fill="none" stroke="#adc7a5"><ellipse cx="400" cy="290" rx="288" ry="112" opacity=".27"/><ellipse cx="400" cy="290" rx="288" ry="58" opacity=".2"/><ellipse cx="400" cy="290" rx="288" ry="155" opacity=".15" stroke-dasharray="3 8"/><path d="M112 290c0-150 576-150 576 0M400 135v310" opacity=".2"/></g>';
panorama += box(-85, -30, 115, 105, 145) + box(45, -55, 40, 130, 75) + box(-90, -105, 90, 55, 70);
for (let j=1;j<7;j++) panorama += line(point(-85, j*20, -30),point(30,j*20,-30),'#c9edbf',.35) + line(point(30,j*20,-30),point(30,j*20,75),'#c9edbf',.2);
panorama += '<g fill="none" stroke="#c2efb9" stroke-width="1.2"><path d="M163 228l-18-7m18 7l-6 18M637 350l18 7m-18-7l7-17"/><path d="M112 290h-25M688 290h25"/></g><g font-family="monospace" font-size="9" fill="#a9c8a7"><text x="105" y="154">+Z</text><text x="665" y="407">+X</text><text x="361" y="111">SCENE CAPTURE</text><text x="537" y="215">PX / READBACK</text></g><path d="M530 223h-40l-30 30" stroke="#a9c8a7" stroke-opacity=".5" fill="none"/>';
await writeFile(destination+'panorama-study.svg', svg(panorama));

let lighting = grid('#dbc393');
lighting += polygon([point(-165,0,-95),point(155,0,-95),point(155,0,110),point(-165,0,110)], '#403b2b','#d0b889',.4);
lighting += box(-165,-95,18,205,160,['#5f5741','#39382b','#938467']) + box(-147,-95,285,15,160,['#8b7b5c','#504a36','#b09b73']);
lighting += polygon([point(-147,160,-80),point(138,160,-80),point(138,160,110),point(-147,160,110)], '#9b8c64','#e8cf95',.25);
lighting += box(-60,-25,130,85,32,['#968764','#5a553f','#c1ac7c']);
lighting += '<path d="M562 110L256 360L466 425L610 169Z" fill="url(#light)"/><g fill="none" stroke="#ead5a3"><path d="M136 330C143 18 650 5 693 333" stroke-opacity=".3" stroke-dasharray="3 7"/><circle cx="584" cy="118" r="23" fill="#e6c88a" fill-opacity=".2" stroke-opacity=".7"/><circle cx="584" cy="118" r="9" fill="#e6c88a" stroke="none"/><path d="M584 82v-13m0 86v13m36-50h13m-85 0h-13M609 93l10-10m-60 60l-10 10M609 143l10 10m-60-60l-10-10" stroke-opacity=".55"/><path d="M584 118L365 347M570 132L293 352M598 130L441 372" stroke-opacity=".32"/><circle cx="365" cy="347" r="15" stroke-opacity=".6"/><path d="M343 347h44m-22-22v44" stroke-opacity=".8"/></g><g font-family="monospace" font-size="9" fill="#d3bf95"><text x="620" y="110">SUN PATH</text><text x="472" y="393">MEASUREMENT PLANE</text></g>';
await writeFile(destination+'lighting-study.svg', svg(lighting, {bg:'#28271f',glow:'#9d8451'}));

let runtime = grid('#9bbfcd');
runtime += '<g fill="none" stroke="#8fb7c7" opacity=".3"><ellipse cx="400" cy="335" rx="255" ry="88"/><ellipse cx="400" cy="335" rx="225" ry="65" stroke-dasharray="4 7"/></g>';
runtime += box(-75,-75,150,150,150,['#3d6272','#253e4c','#7397a2']);
for (let y=30;y<150;y+=30) runtime += line(point(-75,y,-75),point(75,y,-75),'#bbdbe7',.25)+line(point(75,y,-75),point(75,y,75),'#bbdbe7',.25);
const corners = [[-115,0,-115],[115,0,-115],[115,0,115],[-115,0,115],[-115,205,-115],[115,205,-115],[115,205,115],[-115,205,115]];
for (let i=0;i<4;i++) runtime += line(point(...corners[i]),point(...corners[(i+1)%4]),'#a2d9e6',.45) + line(point(...corners[i+4]),point(...corners[(i+1)%4+4]),'#a2d9e6',.45) + line(point(...corners[i]),point(...corners[i+4]),'#a2d9e6',.45);
runtime += '<g fill="none" stroke="#b9dce8"><path d="M400 150v-45m-8 10l8-10 8 10M530 382l52 30m-15-1l15 1-7-13M273 382l-52 30m14-1l-14 1 7-13" stroke-opacity=".7"/><circle cx="400" cy="335" r="6" fill="#bcdeed"/><path d="M400 335L183 295M400 335L620 295" stroke-dasharray="3 6" stroke-opacity=".4"/></g><g font-family="monospace" font-size="9" fill="#aacbd7"><text x="392" y="87">Y</text><text x="594" y="429">X</text><text x="197" y="429">Z</text><text x="132" y="280">TRACKING SPACE</text></g>';
await writeFile(destination+'runtime-study.svg', svg(runtime, {bg:'#15232a',glow:'#446e82'}));

let systems = '<g stroke="#648e7c" stroke-opacity=".1">';
for(let x=40;x<800;x+=40) systems+=`<path d="M${x} 0v520"/>`;
for(let y=40;y<520;y+=40) systems+=`<path d="M0 ${y}h800"/>`;
systems += '</g><rect x="130" y="105" width="540" height="305" rx="8" fill="#0c1917" stroke="#647e6b" stroke-opacity=".5"/><path d="M130 142h540" stroke="#647e6b" stroke-opacity=".3"/><circle cx="151" cy="124" r="3" fill="#8eb09a"/><circle cx="166" cy="124" r="3" fill="#8eb09a" opacity=".5"/><circle cx="181" cy="124" r="3" fill="#8eb09a" opacity=".3"/><g font-family="monospace" font-size="10" fill="#91b8a0"><text x="211" y="128" font-size="8">runtime / diagnostics</text><text x="159" y="177">$ trace process → inspect → resolve</text><text x="159" y="207" opacity=".5">CPU / APPLICATION / SERVICES</text><text x="159" y="372" opacity=".6">&gt; following the evidence_</text></g><path d="M158 325h480M158 247h480M158 286h480" stroke="#739c83" stroke-opacity=".17"/><path d="M158 314l30-3 18 6 27-30 18 5 20-36 22 58 19-19 21 10 22-63 21 67 23-5 21 6 21-23 17 13 21-7 22 11 20-54 21 40 21-6 19 11 20-19 18 27 22-5" stroke="#b9e6be" stroke-width="1.5" fill="none"/><path d="M158 330l35-3 25 3 20-12 23 9 33-3 22 4 20-1 22-14 21 16 20-3 24 3 20-6 19 4 20-2 24 1 22-9 19 12 22-4 21 4 24-5 20 5 20-4" stroke="#6aaba2" stroke-opacity=".55" fill="none"/>';
await writeFile(destination+'systems-study.svg', svg(systems,{bg:'#14231f',glow:'#35584b'}));

const fallback = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700" viewBox="0 0 700 700"><defs><radialGradient id="g"><stop stop-color="#699b702c"/><stop offset="1" stop-color="#0b101000"/></radialGradient><linearGradient id="m"><stop stop-color="#dff4d5"/><stop offset=".45" stop-color="#729c76"/><stop offset="1" stop-color="#273e2c"/></linearGradient></defs><path fill="url(#g)" d="M0 0h700v700H0z"/><g fill="none" stroke="#7caa83" stroke-opacity=".35"><ellipse cx="350" cy="520" rx="238" ry="83"/><ellipse cx="350" cy="520" rx="214" ry="72"/><ellipse cx="350" cy="520" rx="188" ry="59"/></g><ellipse cx="350" cy="520" rx="170" ry="54" fill="#17261c" stroke="#94bd96" stroke-opacity=".3"/><g fill="none" stroke="url(#m)" stroke-width="30" stroke-linejoin="round"><path d="M350 155l156 91v184L350 520l-156-90V246Z"/><path d="M194 246l156 89 156-89M350 335v185"/><path d="M270 202l156 90v182M194 338l156 91 156-91"/></g><path d="M350 284l55 32v64l-55 32-55-32v-64Z" fill="#597d59" stroke="#c6edbe" stroke-opacity=".7"/><path d="M295 316l55 31 55-31M350 347v65" fill="none" stroke="#bce7b4" stroke-opacity=".5"/></svg>`;
await writeFile(destination+'render-study.svg',fallback);
await writeFile(destination+'favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="13" fill="#101815"/><path d="M41 19H28c-12 0-12 13 0 13h6c12 0 12 13 0 13H20" fill="none" stroke="#eef1e9" stroke-width="7"/><circle cx="49" cy="46" r="4" fill="#b9f4cb"/></svg>');
console.log('Generated four conceptual project illustrations, the 3D fallback, and favicon.');
