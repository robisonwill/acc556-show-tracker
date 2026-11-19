import { mkdir, readFile, writeFile } from 'node:fs/promises';

const read = name => readFile(new URL(name, import.meta.url), 'utf8');
const [html, css, catalog, app, database] = await Promise.all([
  read('public/index.html'), read('public/style.css'), read('public/catalog.js'),
  read('public/app.js'), read('public/database.js'),
]);
const config = {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_PUBLISHABLE_KEY,
};
if (config.url !== 'https://xayntuwdftxxacchihxb.supabase.co' || !/^sb_publishable_[\w-]+$/.test(config.key ?? '')) {
  throw new Error('Set the Final Project URL and publishable key before building.');
}
const script = catalog.replace(/^export /gm, '') + database.replace(/^export /gm, '')
  + app.replace(/^import [^\r\n]*\r?\n/gm, '');
const document = html
  .replace('  <link rel="stylesheet" href="/style.css">', () => `  <style>\n${css}  </style>`)
  .replace('</body>', () => `  <script id="connection-config" type="application/json">${JSON.stringify(config).replace(/</g, '\\u003c')}</script>\n  <script>\n${script.replace(/<\/script/gi, '<\\/script')}  </script>\n</body>`);
await writeFile(new URL('Show Tracker.html', import.meta.url), document);
await mkdir(new URL('docs/', import.meta.url), { recursive: true });
await writeFile(new URL('docs/index.html', import.meta.url), document);
await writeFile(new URL('docs/.nojekyll', import.meta.url), '');
