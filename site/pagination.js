export const PAGE_SIZE = 6;
export function paginateEntries(entries, collection, query, requestedPage) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = entries.filter(entry => (collection === '全部' || entry.collection === collection) && entry.search.includes(normalizedQuery));
  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Math.floor(Number(requestedPage)) || 1));
  return { matches, totalPages, page, visible: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) };
}
