import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('./Show Tracker.html', import.meta.url));
const port = Number(process.env.PORT ?? 4173);
createServer((request, response) => {
  if (![ `127.0.0.1:${port}`, `localhost:${port}` ].includes(request.headers.host)) {
    response.writeHead(403).end();
    return;
  }
  if (request.method !== 'GET' || request.url !== '/') {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }).end(app);
}).listen(port, '127.0.0.1', () => console.log(`Show Tracker · http://127.0.0.1:${port}`));
