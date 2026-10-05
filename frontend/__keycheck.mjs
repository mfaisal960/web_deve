import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { DataGrid } from '@mui/x-data-grid';

const errors = [];
const orig = console.error;
console.error = (...args) => { errors.push(args.join(' ')); };

const columns = [{ field: 'a' }, { field: 'b' }, { field: 'c' }];
const rows = Array.from({ length: 12 }, (_, i) => ({ id: i, a: `a${i}`, b: `b${i}`, c: `c${i}` }));

const html = renderToString(
  createElement(DataGrid, {
    rows,
    columns,
    disableRowSelectionOnClick: true,
    initialState: { pagination: { paginationModel: { pageSize: 10, page: 0 } } },
  }),
);

console.error = orig;

const keyWarnings = errors.filter((e) => e.includes('unique "key" prop'));
console.log('rendered html length:', html.length);
console.log('total console.error calls:', errors.length);
console.log('KEY WARNINGS:', keyWarnings.length);
for (const w of keyWarnings) console.log(' -', w.split('\n')[0]);
if (errors.length) {
  console.log('--- other errors ---');
  for (const e of errors) console.log(' *', e.split('\n').slice(0, 2).join(' | '));
}
