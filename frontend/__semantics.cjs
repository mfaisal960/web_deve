const { JSDOM } = require('jsdom');
process.env.NODE_ENV = 'development';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
global.IS_REACT_ACT_ENVIRONMENT = true;

const React = require('react');
const { jsx, jsxs, Fragment } = require('react/jsx-runtime');
const { createRoot } = require('react-dom/client');
const { act } = React;

console.log('NODE_ENV           =', process.env.NODE_ENV);
console.log('react-dom builds   =', Object.keys(require.cache).filter((k) => k.includes('react-dom-client')));
console.log('react-jsx builds   =', Object.keys(require.cache).filter((k) => k.includes('react-jsx-runtime')));

const errors = [];
const orig = console.error;
console.error = (...a) => errors.push(a.map(String).join(' '));

const Item = (p) => jsx('div', { children: p.id }, p.key);
const Filler = (p) => jsx('div', { className: 'f' });

// Mirrors MUI's ORIGINAL getFillers(): <>{a}{children}{b}{c}</>  -- no keys on a, b, c
function OriginalGetFillers() {
  const children = [jsx(Item, { id: 1 }, 'c1'), jsx(Item, { id: 2 }, 'c2')];
  return jsxs(Fragment, {
    children: [
      jsx('div', { role: 'none' }),
      children,
      jsx('div', { role: 'none', className: 'filler' }),
      jsx(Filler, { pinnedRight: false }),
    ],
  });
}

// Mirrors MUI's PATCHED getFillers(): keys added
function PatchedGetFillers() {
  const children = [jsx(Item, { id: 1 }, 'c1'), jsx(Item, { id: 2 }, 'c2')];
  return jsxs(Fragment, {
    children: [
      jsx('div', { role: 'none' }, 'center__leftSpacer'),
      children,
      jsx('div', { role: 'none', className: 'filler' }, 'center__horizontalFiller'),
      jsx(Filler, { pinnedRight: false }, 'center__scrollbarFiller'),
    ],
  });
}

const container = document.getElementById('root');
const root = createRoot(container);

// Inspect element internals as MUI's getFillers creates them
const probe = jsx('div', { role: 'none' });
console.error = orig;
console.log('element._store =', probe._store);
console.log('element.key    =', probe.key);
console.log('element._owner =', probe._owner && (probe._owner.displayName || probe._owner.name));
console.error = (...a) => errors.push(a.map(String).join(' '));

function run(label, Comp) {
  // 1) mount
  act(() => { root.render(jsx(Comp, { tag: 1 })); });
  const mountErrs = errors.splice(0);
  // 2) UPDATE with new props -> reconciliation path
  act(() => { root.render(jsx(Comp, { tag: 2 })); });
  const updateErrs = errors.splice(0);
  console.error = orig;
  const isKey = (e) => e.includes('unique "key" prop');
  console.log(`\n### ${label}`);
  console.log('  MOUNT  key warnings:', mountErrs.filter(isKey).length, '| raw console.error:', mountErrs.length);
  console.log('  UPDATE key warnings:', updateErrs.filter(isKey).length, '| raw console.error:', updateErrs.length);
  for (const e of [...mountErrs, ...updateErrs]) {
    console.log('    >', e.split('\n').filter(Boolean).slice(0, 4).join(' / '));
  }
  console.error = (...a) => errors.push(a.map(String).join(' '));
}

run('ORIGINAL getFillers (no keys)', OriginalGetFillers);
run('PATCHED  getFillers (keys added)', PatchedGetFillers);

// POSITIVE CONTROL: classic unkeyed .map() list -- this MUST warn
function BadMap() {
  const arr = [1, 2, 3];
  return jsxs(Fragment, { children: arr.map((n) => jsx(Item, { id: n })) });
}
run('POSITIVE CONTROL (unkeyed .map)', BadMap);

console.error = orig;
