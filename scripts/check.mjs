import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { projects } from '../js/projects.js';
const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const css = await readFile(new URL('css/portfolio.css', root), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'HTML IDs must be unique');
for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(anchor), `Missing anchor: ${anchor}`);
for (const [, reference] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (reference && !/^(https?:|mailto:|data:)/.test(reference)) await access(new URL(reference, root));
}
for (const [, reference] of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) {
  if (/^\.\.?\//.test(reference)) await access(new URL(reference, new URL('css/', root)));
}
for (const [id, project] of Object.entries(projects)) {
  assert(html.includes(`data-project="${id}"`), `Missing project trigger: ${id}`);
  await access(new URL(project.illustration, root));
  if (project.media) { assert(['image', 'video'].includes(project.media.type)); await access(new URL(project.media.src, root)); }
  assert(project.contributions.length > 0 && project.title && project.context, `Incomplete project: ${id}`);
}
assert((await readFile(new URL('resume.pdf', root))).subarray(0, 4).toString() === '%PDF', 'Resume must be a valid PDF file');
const socialImage = html.match(/property="og:image" content="([^"]+)"/)[1];
if (!socialImage.startsWith('http')) await access(new URL(socialImage, root));
// Resolve the full local module graph, including dynamic imports and vendored Three.js.
const checkedModules=new Set();
async function checkModule(url){
  if(checkedModules.has(url.href))return;checkedModules.add(url.href);
  const source=await readFile(url,'utf8');
  for(const [,reference]of source.matchAll(/(?:from\s*|import\(\s*)['"]((?:\.\.?\/)[^'"]+\.js)['"]/g))await checkModule(new URL(reference,url));
}
await checkModule(new URL('js/portfolio.js',root));
console.log(`Validated ${ids.length} unique IDs, navigation anchors, local resources, ${Object.keys(projects).length} project records, and resume PDF in ${fileURLToPath(root)}`);
console.log(`Resolved ${checkedModules.size} local JavaScript modules.`);
