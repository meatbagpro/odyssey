import { test, expect } from 'bun:test';
import { readdir, readFile } from 'node:fs/promises';
import { parsePost, renderMarkdown } from '../scripts/content';

test('every existing article keeps its published Jekyll URL', async () => {
  const sitemap = await readFile('tests/legacy-sitemap.xml', 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decodeURIComponent(new URL(match[1], 'https://yulu.zgc.io').pathname));
  const files = await readdir('_posts');
  const originals = await Bun.file('tests/original-articles.json').json();
  expect(files.length).toBeGreaterThanOrEqual(29);
  for (const filename of Object.keys(originals)) {
    expect(files).toContain(filename);
  }
  for (const file of files) {
    const post = parsePost(file, await readFile(`_posts/${file}`, 'utf8'));
    // 历史站点地图仅涵盖原有文章；新摘抄的链接由构建测试验证。
    if (Object.hasOwn(originals, file)) {
      expect(urls).toContain(decodeURIComponent(post.url));
    }
    expect(post.title.length).toBeGreaterThan(0);
    expect(post.text.length).toBeGreaterThan(0);
  }
});

test('poem soft line breaks survive without breaking Markdown lists and headings', () => {
  const html = renderMarkdown('第一行\n第二行\n\n### 标题\n\n- 摘录一\n- 摘录二');
  expect(html).toContain('第一行<br />第二行');
  expect(html).toContain('<h3>标题</h3>');
  expect(html.match(/<li>/g)).toHaveLength(2);
});

test('untrusted Markdown cannot inject executable markup', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n[危险](javascript:alert(1))');
  expect(html).not.toContain('<script');
  expect(html).not.toContain('javascript:');
});

test('the original article files are preserved byte for byte', async () => {
  const originals = await Bun.file('tests/original-articles.json').json();
  for (const [filename, hash] of Object.entries(originals)) {
    const source = await readFile(`_posts/${filename}`);
    expect(new Bun.CryptoHasher('sha256').update(source).digest('hex')).toBe(hash);
  }
});
