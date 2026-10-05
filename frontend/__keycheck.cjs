process.env.NODE_ENV = 'development';
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body><div id="root" style="width:1200px;height:800px"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/',
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.Event = dom.window.Event;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.getComputedStyle = dom.window.getComputedStyle;
global.IS_REACT_ACT_ENVIRONMENT = true;
global.window.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom has no layout engine -> fake element geometry so MUI virtualization produces a render context
const SIZE = { clientWidth: 1200, clientHeight: 800, offsetWidth: 1200, offsetHeight: 800, scrollWidth: 1200 };
for (const [prop, val] of Object.entries(SIZE)) {
  Object.defineProperty(dom.window.HTMLElement.prototype, prop, { get: () => val, configurable: true });
}
Object.defineProperty(dom.window.HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value() { return { x: 0, y: 0, top: 0, left: 0, bottom: 800, right: 1200, width: 1200, height: 800 }; },
});

global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
dom.window.ResizeObserver = global.ResizeObserver;
dom.window.IntersectionObserver = global.IntersectionObserver;
dom.window.requestAnimationFrame = global.requestAnimationFrame;

const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = React;
const { DataGrid } = require('@mui/x-data-grid');

const errors = [];
const orig = console.error;
console.error = (...a) => errors.push(a.map(String).join(' '));

const columns = [{ field: 'a' }, { field: 'b' }, { field: 'c' }];
const mkRows = (n, salt) => Array.from({ length: n }, (_, i) => ({ id: i, a: `a${i}${salt}`, b: `b${i}`, c: `c${i}` }));

const container = document.getElementById('root');
const root = createRoot(container);

const render = (rows) =>
  act(() => {
    root.render(
      React.createElement(DataGrid, {
        rows,
        columns,
        disableRowSelectionOnClick: true,
        initialState: { pagination: { paginationModel: { pageSize: 10, page: 0 } } },
      }),
    );
  });

render(mkRows(12, 'x'));
const afterMount = errors.splice(0);
render(mkRows(12, 'y')); // UPDATE -> reconciliation path where key checks run
const afterUpdate1 = errors.splice(0);
render(mkRows(13, 'z')); // second update, different row count
const afterUpdate2 = errors.splice(0);

console.error = orig;

const isKey = (e) => e.includes('unique "key" prop');
const label = process.argv[2] || 'run';
const keyWarnings = [...afterMount, ...afterUpdate1, ...afterUpdate2].filter(isKey);

console.log(`===== ${label} =====`);
console.log('column headers in DOM :', container.querySelectorAll('[role="columnheader"]').length);
console.log('rows in DOM            :', container.querySelectorAll('[role="row"]').length);
console.log('KEY WARNINGS           :', keyWarnings.length);
for (const w of keyWarnings) console.log('  >', w.split('\n').filter(Boolean).join('\n    '));
const others = [...afterMount, ...afterUpdate1, ...afterUpdate2].filter((e) => !isKey(e));
if (others.length) {
  console.log('other console.error   :');
  for (const o of [...new Set(others.map((e) => e.split('\n')[0]))]) console.log('  *', o);
}
