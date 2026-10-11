import { mkdir, readdir, readFile, rm, copyFile } from 'node:fs/promises';
import { PAGE_SIZE } from '../site/pagination.js';
import { dirname } from 'node:path';
import { parsePost, escapeHtml as e, type Post } from './content';

const origin = 'https://yulu.zgc.io';
const posts = await Promise.all((await readdir('_posts')).filter(name => name.endsWith('.md')).map(async name => parsePost(name, await readFile(`_posts/${name}`, 'utf8'))));
posts.sort((a, b) => b.date.localeCompare(a.date) || a.filename.localeCompare(b.filename, 'zh'));
await rm('_site', { recursive: true, force: true });
await mkdir('_site/assets', { recursive: true });
async function write(path: string, body: string) { const file = `_site${decodeURIComponent(path)}`; await mkdir(dirname(file), { recursive: true }); await Bun.write(file, body); }
function layout(title: string, path: string, content: string, description = '记下偶然遇见的好句子。小诗、影视金句，和一些不必归类的念头。') {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)} · 诗和远方</title><meta name="description" content="${e(description)}"><meta name="theme-color" content="#f6f3ec"><link rel="canonical" href="${origin}${path}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="${path.includes('/20') ? 'article' : 'website'}"><meta property="og:url" content="${origin}${path}"><link rel="icon" href="/assets/mark.svg" type="image/svg+xml"><link rel="alternate" type="application/atom+xml" title="诗和远方" href="/feed.xml"><link rel="stylesheet" href="/assets/book.css"><script src="/assets/book.js" type="module"></script></head><body><a class="skip" href="#main">跳到正文</a><div class="shell"><header class="site-header"><a class="brand" href="/">诗和远方</a><nav aria-label="主导航"><a href="/archive.html" ${path === '/archive.html' ? 'aria-current="page"' : ''}>目录</a><a href="/about.html" ${path === '/about.html' ? 'aria-current="page"' : ''}>关于</a></nav></header><main id="main">${content}</main><footer><span>诗和远方</span><a href="/feed.xml">RSS</a></footer></div></body></html>`;
}
function card(post: Post, index: number, page: number) {
  // Keep browsing pages bounded; full Markdown belongs on the reading page.
  const lines = post.text.split('\n').map(line => line.trim()).filter(Boolean);
  const preview = lines.slice(0, 4).join('\n').slice(0, 130);
  return `<article class="entry"${Math.floor(index / PAGE_SIZE) + 1 === page ? '' : ' hidden'} data-collection="${post.collection}" data-search="${e([post.title, post.text, post.author, ...post.categories, ...post.tags].join(' ').toLowerCase())}"><div class="entry-label">${post.collection}</div><h3><a href="${post.url}">${e(post.title)}</a></h3><p class="excerpt">${e(preview)}</p><div class="entry-bottom"><time datetime="${post.date}">${post.date.replaceAll('-', '.')}</time><a class="read-more" href="${post.url}" aria-label="阅读全文：${e(post.title)}">阅读全文 <span aria-hidden="true">→</span></a></div></article>`;
}

const totalPages = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
const pagePath = (page: number) => page === 1 ? '/' : `/page${page}/`;
for (let page = 1; page <= totalPages; page++) {
await write(page === 1 ? '/index.html' : `/page${page}/index.html`, layout('摘抄', pagePath(page), `<section class="collection" aria-labelledby="collection-title"><div class="collection-heading"><h1 id="collection-title">摘抄 <small>${posts.length} 篇</small></h1><label class="search" hidden><input type="search" placeholder="搜索" aria-label="搜索全文、标题或来源"></label></div><div class="filter-bar" hidden><div class="filters" role="group" aria-label="按分类筛选">${['全部', '小诗', '影视', '随记'].map((label, index) => `<button data-filter="${label}" aria-pressed="${index === 0}">${label}<small>${label === '全部' ? posts.length : posts.filter(post => post.collection === label).length}</small></button>`).join('')}</div><span class="result-count" aria-live="polite">按收藏时间排列</span></div><div class="entries">${posts.map((post, index) => card(post, index, page)).join('')}</div><nav class="pagination" aria-label="摘抄分页">${page > 1 ? `<a href="${pagePath(page - 1)}" aria-label="上一页">上一页</a>` : '<span aria-disabled="true">上一页</span>'}${Array.from({ length: totalPages }, (_, index) => `<a href="${pagePath(index + 1)}" ${page === index + 1 ? 'aria-current="page"' : ''} aria-label="第 ${index + 1} 页">${index + 1}</a>`).join('')}${page < totalPages ? `<a href="${pagePath(page + 1)}" aria-label="下一页">下一页</a>` : '<span aria-disabled="true">下一页</span>'}<span class="page-summary">第 ${page} / ${totalPages} 页</span></nav><p class="empty" hidden>没有找到相关内容。</p></section>`));
}
for (const [index, post] of posts.entries()) {
  const adjacent = [posts[index - 1], posts[index + 1]].filter(Boolean);
  await write(post.url, layout(post.title, post.url, `<article class="reading" data-collection="${post.collection}"><a class="back" href="/">← 返回首页</a><header class="reading-header"><p class="eyebrow">${post.collection} / ${post.date.replaceAll('-', '.')}</p><h1>${e(post.title)}</h1><p class="source">${e([post.author, ...post.categories, ...post.tags].filter(Boolean).join(' · ')) || ''}</p></header><div class="prose">${post.html}</div><div class="reading-end"><button class="copy" hidden>复制</button><span class="copy-status" aria-live="polite"></span></div><textarea id="original-text" hidden>${e(post.text)}</textarea><nav class="adjacent" aria-label="继续阅读">${adjacent.map(item => `<a href="${item.url}"><small>${item === posts[index - 1] ? '上一篇' : '下一篇'}</small>${e(item.title)}</a>`).join('')}</nav></article>`, post.text.slice(0, 150)));
}
await write('/archive.html', layout('目录', '/archive.html', `<section class="archive"><h1>目录</h1><p class="source">共 ${posts.length} 篇</p>${[...new Set(posts.map(post => post.date.slice(0, 4)))].map(year => `<section class="archive-year"><h2>${year}</h2><ul>${posts.filter(post => post.date.startsWith(year)).map(post => `<li><time>${post.date.slice(5).replace('-', '.')}</time><a href="${post.url}">${e(post.title)}</a><span>${post.collection}</span></li>`).join('')}</ul></section>`).join('')}</section>`));
// Preserve the lyric's original wording: 诗和远方, not 诗与远方.
await write('/about.html', layout('关于', '/about.html', `<article class="reading"><h1>关于</h1><div class="prose"><p>记录一些抖机灵的小诗、影视解说金句和随记。</p><blockquote>生活不止眼前的苟且，还有诗和远方的田野。</blockquote><p>—— 高晓松创作，许巍演唱《生活不止眼前的苟且》</p><p>这里的摘录不代表原创；已知的作者和来源保留在标题、标签或正文中，作品版权归原作者所有。</p></div><a class="back" href="/">← 返回首页</a></article>`));
await write('/404.html', layout('页面不存在', '/404.html', '<section class="reading"><h1>页面不存在</h1><p>链接可能有误，或页面已被移除。</p><a class="back" href="/">← 返回首页</a></section>'));
await write('/sitemap.xml', `<?xml version="1.0" encoding="utf-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', '/archive.html', '/about.html', ...posts.map(post => post.url)].map(url => `<url><loc>${e(origin + url)}</loc></url>`).join('')}</urlset>`);
await write('/feed.xml', `<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom"><title>诗和远方</title><id>${origin}/</id><link href="${origin}/"/><link href="${origin}/feed.xml" rel="self"/><updated>${posts[0].date}T00:00:00Z</updated><author><name>方远</name></author>${posts.map(post => `<entry><title>${e(post.title)}</title><id>${origin}${post.url}</id><link href="${origin}${post.url}"/><updated>${post.date}T00:00:00Z</updated><content type="html">${e(post.html)}</content></entry>`).join('')}</feed>`);
await write('/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
await write('/.nojekyll', '');
await copyFile('CNAME', '_site/CNAME');
for (const file of ['book.css', 'book.js', 'pagination.js', 'mark.svg']) await copyFile(`site/${file}`, `_site/assets/${file}`);
console.log(`Built ${posts.length} entries with original article URLs.`);
