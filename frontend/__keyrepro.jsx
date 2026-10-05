import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DataGrid } from '@mui/x-data-grid';

window.__log = [];

const baseColumns = [{ field: 'a' }, { field: 'b' }, { field: 'c' }];
const mkRows = (n, salt) =>
  Array.from({ length: n }, (_, i) => ({ id: i, a: `a${i}${salt}`, b: `b${i}`, c: `c${i}` }));

// Each grid re-renders on an interval so React takes the reconciliation path,
// which is where key warnings are actually checked.
function Grid({ id, count, salt, extra = {} }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 50);
    return () => clearInterval(t);
  }, []);
  const rows = useMemo(() => mkRows(count, salt), [count, salt, tick % 2 === 0]);
  return (
    <div style={{ height: 300, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={baseColumns}
        disableRowSelectionOnClick
        autoHeight
        pageSizeOptions={[5, 10, 25, 50, 100]}
        initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        {...extra}
      />
    </div>
  );
}

function App() {
  return (
    <>
      <Grid id="plain" count={40} salt="p" />
      <Grid
        id="grouped"
        count={40}
        salt="g"
        extra={{
          columnGroupingModel: [{ groupId: 'grp', children: ['a', 'b'] }, { groupId: 'solo', children: ['c'] }],
        }}
      />
      <Grid
        id="pinned"
        count={40}
        salt="n"
        extra={{
          pinnedColumns: { left: ['a'], right: ['c'] },
          initialState: {
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
            pinning: { pinnedColumns: { left: ['a'], right: ['c'] } },
          },
        }}
      />
    </>
  );
}

const origError = console.error;
console.error = (...args) => {
  window.__log.push(args.map((a) => (typeof a === 'string' ? a : String(a))).join(' '));
  origError(...args);
};

createRoot(document.getElementById('root')).render(<App />);