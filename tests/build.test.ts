import { beforeAll, expect, test } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';
import { parsePost } from '../scripts/content';

beforeAll(async () => {
  const result = Bun.spawn(['bun', 'scripts/build.ts'], { stdout: 'pipe', stderr: 'pipe' });
  expect(await result.exited).toBe(0);
});

test('build contains every article body, metadata and resolvable local links', async () => {
  const filenames = (await readdir('_posts')).filter(name => name.endsWith('.md'));
  const pages = ['/', '/about.html', '/archive.html', '/404.html'];
  for (const filename of filenames) {
    const post = parsePost(filename, await readFile(`_posts/${filename}`, 'utf8'));
    const html = await readFile(`_site${decodeURIComponent(post.url)}`, 'utf8');
    expect(html).toContain(post.html);
    expect(html).toContain(`https://yulu.zgc.io${post.url}`);
    expect(html).toContain('lang="zh-CN"');
    pages.push(post.url);
  }
  for (const page of pages) {
    const html = await readFile(`_site${decodeURIComponent(page === '/' ? '/index.html' : page)}`, 'utf8');
    for (const match of html.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
      const path = decodeURIComponent(match[1]);
      expect(await Bun.file(`_site${path}${path.endsWith('/') ? 'index.html' : ''}`).exists()).toBe(true);
    }
  }
  const home = await readFile('_site/index.html', 'utf8');
  expect(home.match(/class="entry"/g)).toHaveLength(filenames.length);
  expect(await readFile('_site/CNAME', 'utf8')).toBe(await readFile('CNAME', 'utf8'));
  expect(await Bun.file('_site/.nojekyll').exists()).toBe(true);
});

test('feed and sitemap include all articles, not only the homepage selection', async () => {
  const feed = await readFile('_site/feed.xml', 'utf8');
  const sitemap = await readFile('_site/sitemap.xml', 'utf8');
  const total = (await readdir('_posts')).filter(name => name.endsWith('.md')).length;
  expect(feed.match(/<entry>/g)).toHaveLength(total);
  expect(sitemap.match(/<url>/g)).toHaveLength(total + 3);
  expect(feed).toContain('&lt;');
  for (const page of [2, 3, 4, 5]) expect(await Bun.file(`_site/page${page}/index.html`).exists()).toBe(true);
});

test('about page quotes the lyric with its original wording', async () => {
  const about = await readFile('_site/about.html', 'utf8');
  expect(about).toContain('<blockquote>生活不止眼前的苟且，还有诗和远方的田野。</blockquote>');
  expect(about).not.toContain('诗与远方的田野');
});

test('static pagination works without JavaScript and covers every article once', async () => {
  const total = (await readdir('_posts')).filter(name => name.endsWith('.md')).length;
  const visibleUrls: string[] = [];
  for (let page = 1; page <= Math.ceil(total / 6); page++) {
    const html = await readFile(page === 1 ? '_site/index.html' : `_site/page${page}/index.html`, 'utf8');
    const visibleCards = [...html.matchAll(/<article class="entry" data-collection=[\s\S]*?<\/article>/g)];
    expect(visibleCards.length).toBe(Math.min(6, total - (page - 1) * 6));
    expect(html).toContain(`aria-current="page" aria-label="第 ${page} 页"`);
    expect(html).not.toContain('A COMMONPLACE BOOK');
    for (const card of visibleCards) visibleUrls.push(card[0].match(/<h3><a href="([^"]+)"/)![1]);
    for (const link of html.matchAll(/href="(\/page\d+\/)"/g)) expect(await Bun.file(`_site${link[1]}index.html`).exists()).toBe(true);
  }
  expect(visibleUrls).toHaveLength(total);
  expect(new Set(visibleUrls).size).toBe(total);
});

test('browse pages show bounded excerpts while detail pages keep full articles', async () => {
  const home = await readFile('_site/index.html', 'utf8');
  expect(home).not.toContain('class="intro"');
  expect(home).not.toContain('class="seal"');
  for (const filename of (await readdir('_posts')).filter(name => name.endsWith('.md'))) {
    const post = parsePost(filename, await readFile(`_posts/${filename}`, 'utf8'));
    const entry = [...home.matchAll(/<article class="entry"[\s\S]*?<\/article>/g)].find(match => match[0].includes(`href="${post.url}"`))![0];
    expect(entry).toContain('阅读全文');
    expect(entry).not.toContain('class="prose');
    const preview = entry.match(/<p class="excerpt">([\s\S]*?)<\/p>/)![1];
    expect(preview.split('\n').length).toBeLessThanOrEqual(4);
    expect(preview.length).toBeLessThanOrEqual(780); // HTML entities may expand a character to six bytes.
    const detail = await readFile(`_site${decodeURIComponent(post.url)}`, 'utf8');
    expect(detail).toContain(post.html);
  }
});
