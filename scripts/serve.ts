import { resolve, sep } from 'node:path';
const root = resolve('_site');
const server = Bun.serve({ hostname: '0.0.0.0', port: Number(process.env.PORT ?? 4173), async fetch(request) {
  let path: string;
  try { path = decodeURIComponent(new URL(request.url).pathname); } catch { return new Response('Bad request', { status: 400 }); }
  const filename = resolve(root, '.' + path + (path.endsWith('/') ? 'index.html' : ''));
  if (!filename.startsWith(root + sep)) return new Response('Forbidden', { status: 403 });
  const file = Bun.file(filename);
  return await file.exists() ? new Response(file) : new Response(Bun.file(root + '/404.html'), { status: 404 });
}});
console.log(`Preview: ${server.url}`);
