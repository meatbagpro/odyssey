import { parse } from 'yaml';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
export function renderMarkdown(body: string) {
  // These entries use both Markdown hard breaks and ordinary newlines for verse.
  return sanitizeHtml(marked.parse(body, { breaks: true, async: false }), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img'],
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'title'] },
  });
}
export function parsePost(filename: string, source: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`Missing front matter: ${filename}`);
  const metadata = parse(match[1]);
  const date = filename.slice(0, 10);
  const categories: string[] = metadata.categories ?? [];
  // Jekyll's default slug preserves @; replacing it would break the published wdctll URL.
  const slug = filename.slice(11).replace(/\.md$/, '').toLowerCase().replace(/[^\p{L}\p{N}@._-]+/gu, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const url = '/' + [...categories.map(category => category.toLowerCase()), ...date.split('-'), slug + '.html'].map(encodeURIComponent).join('/');
  const body = match[2];
  const html = renderMarkdown(body);
  const text = sanitizeHtml(html.replace(/<br\s*\/?>/g, '\n').replace(/<\/(p|h[1-6]|li|blockquote)>/g, '\n'), { allowedTags: [], allowedAttributes: {} }).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
  const inferredCollection = categories.some(category => category.startsWith('影视')) || ['纸钞屋', '玛卡巴卡之歌'].some(title => filename.includes(title)) ? '影视' : categories.includes('甫子寸作品集') || /《我希望》|《船》|无衣|论懵逼|量子力学|通识课|水深火热|冬至/.test(filename) ? '小诗' : '随记';
  const collection = ['小诗', '影视', '随记'].includes(metadata.collection) ? metadata.collection : inferredCollection;
  return { filename, title: String(metadata.title), date, categories, tags: metadata.tags ?? [], author: metadata.author ?? '', body, html, text, url, collection };
}
export type Post = ReturnType<typeof parsePost>;
