import { readFile, writeFile } from 'node:fs/promises';

const read = name => readFile(new URL(name, import.meta.url), 'utf8');
const [html, css, catalog, app, seed] = await Promise.all([
  read('public/index.html'), read('public/style.css'), read('public/catalog.js'),
  read('public/app.js'), read('.local-catalog.json'),
]);
const script = catalog.replace(/^export /gm, '') + app.replace(/^import [^\r\n]*\r?\n/m, '');
const document = html
  .replace('  <link rel="stylesheet" href="/style.css">', () => `  <style>\n${css}  </style>`)
  .replace('</body>', () => `  <script id="sample-catalog" type="application/json">${seed.replace(/</g, '\\u003c')}</script>\n  <script>\n${script.replace(/<\/script/gi, '<\\/script')}  </script>\n</body>`);
await writeFile(new URL('Show Tracker.html', import.meta.url), document);
