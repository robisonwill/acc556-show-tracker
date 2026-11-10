import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const url = process.env.SUPABASE_URL?.trim() ?? '';
const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
const validUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url);
const configured = validUrl && /^sb_publishable_[\w-]+$/.test(key) && !key.includes('REPLACE_ME');
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/catalog.js', ['catalog.js', 'text/javascript; charset=utf-8']],
  ['/supabase.js', ['supabase.js', 'text/javascript; charset=utf-8']],
]);

const port = Number(process.env.PORT ?? 4173);
createServer(async (request, response) => {
  const host = request.headers.host;
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
    response.writeHead(403).end();
    return;
  }
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Security-Policy',
    `default-src 'self'; connect-src 'self'${configured ? ` ${url}` : ''}; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`);

  if (request.method !== 'GET') {
    response.writeHead(405, { Allow: 'GET' }).end();
    return;
  }
  if (request.url === '/config.json') {
    response.writeHead(200, { 'Content-Type': 'application/json' })
      .end(JSON.stringify(configured ? { url, key } : {}));
    return;
  }
  const asset = assets.get(request.url);
  if (!asset) {
    response.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(new URL(`./public/${asset[0]}`, import.meta.url));
    response.writeHead(200, { 'Content-Type': asset[1] }).end(body);
  } catch {
    response.writeHead(500).end('Unable to load app asset.');
  }
}).listen(port, '127.0.0.1', () => console.log(`ACC 556 Show Tracker · http://127.0.0.1:${port}`));
