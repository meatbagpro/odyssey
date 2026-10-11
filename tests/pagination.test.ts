import { expect, test } from 'bun:test';
import { paginateEntries } from '../site/pagination.js';
const entries = Array.from({ length: 29 }, (_, index) => ({ id: index, collection: index < 10 ? '小诗' : '影视', search: `摘抄 ${index} ${index === 28 ? '远方' : ''}` }));
test('six entries per page with no duplicates or omissions', () => {
  const pages = [1, 2, 3, 4, 5].map(page => paginateEntries(entries, '全部', '', page));
  expect(pages.map(page => page.visible.length)).toEqual([6, 6, 6, 6, 5]);
  expect(pages.flatMap(page => page.visible.map(entry => entry.id))).toEqual(entries.map(entry => entry.id));
});
test('search and categories paginate the whole collection, not the visible page', () => {
  const search = paginateEntries(entries, '全部', '远方', 4);
  expect(search.page).toBe(1);
  expect(search.visible.map(entry => entry.id)).toEqual([28]);
  const poems = paginateEntries(entries, '小诗', '', 2);
  expect(poems.matches.length).toBe(10);
  expect(poems.visible.map(entry => entry.id)).toEqual([6, 7, 8, 9]);
  expect(paginateEntries(entries, '小诗', '远方', 1).visible).toEqual([]);
});
test('empty, invalid and out-of-range pages remain valid', () => {
  expect(paginateEntries(entries, '全部', '', -2).page).toBe(1);
  expect(paginateEntries(entries, '全部', '', 'invalid').page).toBe(1);
  expect(paginateEntries(entries, '全部', '', 99).page).toBe(5);
  expect(paginateEntries(entries, '全部', '无结果', 4)).toMatchObject({ page: 1, totalPages: 1, visible: [] });
});
