import { paginateEntries } from './pagination.js';
const entries = [...document.querySelectorAll('.entry')].map(element => ({ element, collection: element.dataset.collection, search: element.dataset.search }));
const search = document.querySelector('input[type="search"]');
const filters = [...document.querySelectorAll('[data-filter]')];
let collection = '全部';
let currentPage = 1;
const pagePath = page => page === 1 ? '/' : `/page${page}/`;
function pageUrl(page) {
  const url = new URL(pagePath(page), location.origin);
  if (collection !== '全部') url.searchParams.set('collection', collection);
  if (search.value.trim()) url.searchParams.set('q', search.value.trim());
  return url.pathname + url.search;
}
function renderEntries() {
  const result = paginateEntries(entries, collection, search.value, currentPage);
  currentPage = result.page;
  const visible = new Set(result.visible);
  for (const entry of entries) entry.element.hidden = !visible.has(entry);
  for (const filter of filters) filter.setAttribute('aria-pressed', String(filter.dataset.filter === collection));
  document.querySelector('.empty').hidden = result.matches.length !== 0;
  document.querySelector('.result-count').textContent = `共 ${result.matches.length} 篇`;
  const pagination = document.querySelector('.pagination');
  pagination.replaceChildren();
  pagination.hidden = result.matches.length === 0;
  function addLink(label, page, disabled = false, current = false) {
    const link = document.createElement(disabled ? 'span' : 'a');
    link.textContent = label;
    if (disabled) link.setAttribute('aria-disabled', 'true');
    else {
      link.href = pageUrl(page);
      link.setAttribute('aria-label', /^\d+$/.test(label) ? `第 ${page} 页` : label);
      if (current) link.setAttribute('aria-current', 'page');
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        currentPage = page;
        renderEntries();
        history.pushState(null, '', pageUrl(currentPage));
        const heading = document.querySelector('#collection-title');
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
        heading.scrollIntoView({ block: 'start' });
      });
    }
    pagination.append(link);
  }
  addLink('上一页', currentPage - 1, currentPage === 1);
  for (let page = 1; page <= result.totalPages; page++) addLink(String(page), page, false, page === currentPage);
  addLink('下一页', currentPage + 1, currentPage === result.totalPages);
  const summary = document.createElement('span');
  summary.className = 'page-summary';
  summary.textContent = `第 ${currentPage} / ${result.totalPages} 页`;
  pagination.append(summary);
}
function restoreLocation() {
  const params = new URLSearchParams(location.search);
  collection = ['小诗', '影视', '随记'].includes(params.get('collection')) ? params.get('collection') : '全部';
  search.value = params.get('q') ?? '';
  currentPage = Number(location.pathname.match(/^\/page(\d+)\//)?.[1] ?? 1);
  renderEntries();
}
if (search) {
  document.querySelector('.search').hidden = false;
  document.querySelector('.filter-bar').hidden = false;
  restoreLocation();
  window.addEventListener('popstate', restoreLocation);
  search.addEventListener('input', () => {
    currentPage = 1;
    renderEntries();
    history.replaceState(null, '', pageUrl(currentPage));
  });
  for (const button of filters) button.addEventListener('click', () => {
    collection = button.dataset.filter;
    currentPage = 1;
    renderEntries();
    history.pushState(null, '', pageUrl(currentPage));
  });
}
const copy = document.querySelector('.copy');
if (copy && navigator.clipboard) {
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    const status = document.querySelector('.copy-status');
    try {
      await navigator.clipboard.writeText(document.querySelector('#original-text').value);
      status.textContent = '已复制';
    } catch { status.textContent = '未能复制，请直接选择正文复制。'; }
  });
}
