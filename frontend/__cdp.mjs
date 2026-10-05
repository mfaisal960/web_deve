// Drives headless Chrome over CDP to collect real browser console output.
// Usage: node __cdp.mjs <url> <waitMs>
const [, , url, waitMsArg] = process.argv;
const waitMs = Number(waitMsArg || 6000);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const { spawn } = await import('node:child_process');
const fs = await import('node:fs');
const os = await import('node:os');
const path = await import('node:path');

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
const port = 9333 + Math.floor(Math.random() * 300);

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--no-first-run',
  '--disable-extensions',
  '--window-size=1400,1000',
  `--user-data-dir=${userDataDir}`,
  `--remote-debugging-port=${port}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page;
    } catch {}
    await sleep(250);
  }
  throw new Error('Chrome did not expose a CDP target');
}

const target = await getTarget();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

let id = 0;
const pending = new Map();
const consoleMessages = [];

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === 'Runtime.consoleAPICalled') {
    const p = msg.params;
    consoleMessages.push({
      level: p.type,
      text: p.args.map((a) => a.value ?? a.description ?? JSON.stringify(a.preview ?? '')).join(' '),
    });
  }
  if (msg.method === 'Log.entryAdded') {
    consoleMessages.push({ level: msg.params.entry.level, text: msg.params.entry.text });
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    consoleMessages.push({ level: 'exception', text: msg.params.exceptionDetails.text + ' ' + (msg.params.exceptionDetails.exception?.description ?? '') });
  }
};

const send = (method, params = {}) =>
  new Promise((res) => {
    const msgId = ++id;
    pending.set(msgId, res);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Page.navigate', { url });
await sleep(waitMs);

// Pull the page's own captured console.error log too (page-side hook)
const evalRes = await send('Runtime.evaluate', {
  expression: 'JSON.stringify((window.__log||[]).filter(s => s.includes(\'unique "key" prop\')).map(s => s.split("\\n").filter(Boolean).join(" | ")))',
  returnByValue: true,
});
const domRes = await send('Runtime.evaluate', {
  expression: 'document.querySelectorAll(\'[role="columnheader"]\').length',
  returnByValue: true,
});

const pageKeyWarnings = JSON.parse(evalRes.result?.result?.value || '[]');
const allText = consoleMessages.map((m) => m.text);
const cdpKeyWarnings = allText.filter((t) => t.includes('unique "key" prop'));

console.log('CDP console key warnings :', cdpKeyWarnings.length);
for (const w of new Set(cdpKeyWarnings)) console.log('  >', w.split('\n').filter(Boolean).slice(0, 4).join('\n    '));
console.log('page-side (__log) key warnings:', pageKeyWarnings.length);
for (const w of new Set(pageKeyWarnings)) console.log('  >', w);
console.log('column headers rendered :', domRes.result?.result?.value);
const other = [...new Set(allText.filter((t) => !t.includes('unique "key" prop')))];
if (other.length) {
  console.log('--- other console messages (first 12) ---');
  for (const o of other.slice(0, 12)) console.log('  *', o.split('\n')[0].slice(0, 220));
}

ws.close();
chrome.kill();
fs.rmSync(userDataDir, { recursive: true, force: true });
process.exit(0);