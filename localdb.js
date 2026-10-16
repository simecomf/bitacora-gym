/* Capa de datos local (IndexedDB) con la misma forma que window.claude.use('db'):
   db.doc('col/id').get/set/delete/onSnapshot y db.collection('col').orderBy().limit().onSnapshot.
   Los cambios se avisan a las demás pestañas abiertas con BroadcastChannel. */
(() => {
const DB_NAME = 'bitacora-gym', STORE = 'docs';
const copy = v => v === undefined ? undefined : (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));

let dbp = null;
function open() {
  if (!dbp) dbp = new Promise((res, rej) => {
    const rq = indexedDB.open(DB_NAME, 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore(STORE);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => { dbp = null; rej(rq.error); };
  });
  return dbp;
}
async function tx(mode, fn) {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction(STORE, mode); const st = t.objectStore(STORE); let out;
    Promise.resolve(fn(st)).then(v => { out = v; });
    t.oncomplete = () => res(out);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error || new Error('abort'));
  });
}
const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const errOf = e => { const x = new Error(e && e.message || 'write failed'); x.code = e && e.name === 'QuotaExceededError' ? 'quota_exceeded' : 'unavailable'; return x; };

const getDoc = path => tx('readonly', st => req(st.get(path)));
const listCol = col => tx('readonly', async st => {
  const range = IDBKeyRange.bound(col + '/', col + '/￿');
  const [keys, vals] = await Promise.all([req(st.getAllKeys(range)), req(st.getAll(range))]);
  return keys.map((k, i) => ({ path: k, data: vals[i] }));
});

/* listeners */
const listeners = new Set();
const bc = typeof BroadcastChannel === 'function' ? new BroadcastChannel('bitacora-gym-db') : null;
function notify(paths, local) {
  for (const l of [...listeners]) if (paths === '*' || paths.some(p => l.match(p))) l.run();
  if (local && bc) bc.postMessage(paths);
}
if (bc) bc.onmessage = e => notify(e.data, false);

const snapDoc = (path, data) => ({ id: path.split('/').pop(), exists: data !== undefined, data: () => copy(data) });
const meta = { fromCache: false, hasPendingWrites: false };

function doc(path) {
  return {
    id: path.split('/').pop(),
    async get() { return snapDoc(path, await getDoc(path)); },
    async set(data) { try { await tx('readwrite', st => req(st.put(copy(data), path))); } catch (e) { throw errOf(e); } notify([path], true); },
    async delete() { try { await tx('readwrite', st => req(st.delete(path))); } catch (e) { throw errOf(e); } notify([path], true); },
    onSnapshot(cb, onErr) {
      let alive = true, seq = 0;
      const l = { match: p => p === path, run: () => { const n = ++seq; getDoc(path).then(d => { if (alive && n === seq) cb(snapDoc(path, d)); }, e => onErr && onErr(e)); } };
      listeners.add(l); l.run();
      return () => { alive = false; listeners.delete(l); };
    }
  };
}

function query(col, order, lim) {
  return {
    orderBy: (field, dir) => query(col, { field, desc: dir === 'desc' }, lim),
    limit: n => query(col, order, n),
    async get() { return snapCol(await listCol(col)); },
    onSnapshot(cb, onErr) {
      let alive = true, seq = 0;
      const l = { match: p => p.startsWith(col + '/'), run: () => { const n = ++seq; listCol(col).then(r => { if (alive && n === seq) cb(snapCol(r)); }, e => onErr && onErr(e)); } };
      listeners.add(l); l.run();
      return () => { alive = false; listeners.delete(l); };
    }
  };
  function snapCol(rows) {
    if (order) rows.sort((a, b) => { const x = a.data && a.data[order.field], y = b.data && b.data[order.field]; const c = x === y ? 0 : x === undefined ? 1 : y === undefined ? -1 : x < y ? -1 : 1; return order.desc ? -c : c; });
    if (lim) rows = rows.slice(0, lim);
    return { docs: rows.map(r => snapDoc(r.path, r.data)), size: rows.length, empty: !rows.length, metadata: meta };
  }
}

/* respaldo: { docs: { "col/id": datos } } */
async function exportAll() {
  const docs = {};
  await tx('readonly', async st => { const [keys, vals] = await Promise.all([req(st.getAllKeys()), req(st.getAll())]); keys.forEach((k, i) => { docs[k] = vals[i]; }); });
  return docs;
}
async function replaceAll(docs) {
  try { await tx('readwrite', st => { st.clear(); for (const [k, v] of Object.entries(docs)) st.put(copy(v), k); }); } catch (e) { throw errOf(e); }
  notify('*', true);
}
const count = () => tx('readonly', st => req(st.count()));

window.localDB = { doc, collection: col => query(col), exportAll, replaceAll, count };
})();
