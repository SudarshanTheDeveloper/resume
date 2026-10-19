import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8' };
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const segments = pathname.split(/[\\/]/);
    if (segments.some(segment => segment.startsWith('.') || segment === 'node_modules')) { response.writeHead(403).end('Forbidden'); return; }
    let file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(403).end('Forbidden'); return; }
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const data = await readFile(file);
    const headers = { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache', 'Content-Length': data.length };
    const range = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      const start = Number(range[1]); const end = Math.min(Number(range[2] || data.length - 1), data.length - 1);
      if (start > end || start >= data.length) { response.writeHead(416, { 'Content-Range': `bytes */${data.length}` }).end(); return; }
      response.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes' });
      response.end(request.method === 'HEAD' ? undefined : data.subarray(start, end + 1)); return;
    }
    response.writeHead(200, { ...headers, 'Accept-Ranges': 'bytes' }); response.end(request.method === 'HEAD' ? undefined : data);
  } catch (error) { response.writeHead(error.code === 'ENOENT' ? 404 : 400).end('File not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${port}`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
