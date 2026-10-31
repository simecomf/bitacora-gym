const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Model = require('../session-model.js');
const copy = value => JSON.parse(JSON.stringify(value));
const entry = (id, done = false) => ({ exId: id, name: id, unit: 'kg', target: { sets: 1, repMin: 8, repMax: 12 }, sets: [{ w: 20, r: done ? 8 : null, done }] });
const session = () => ({ id: 'test', kind: 'pesas', dayId: 'day', dayName: 'Torso', date: '2026-10-31', startedAt: 1000, entries: [entry('a'), entry('b'), entry('c')] });

test('a removed exercise stays removed when a stale tab or recovery backup has completed sets', () => {
  const stale = session(), current = session(); stale.entries[1].sets[0].done = true;
  current.entries.splice(1, 1); current.removedEntries = { 'legacy:b': true };
  for (const preferLocal of [true, false]) {
    const merged = Model.merge(current, stale, preferLocal);
    assert.deepEqual(merged.entries.map(e => e.exId), ['a', 'c']);
    assert.equal(stale.entries.length, 3);
  }
});

test('newest daily order wins while concurrent completed series and added exercises are retained', () => {
  const current = session(), stale = session();
  current.entries.reverse(); current.entryOrder = { at: 20, by: 'a', ids: current.entries.map(Model.key) };
  stale.entryOrder = { at: 10, by: 'b', ids: stale.entries.map(Model.key) };
  stale.entries[0].sets[0] = { w: 25, r: 10, done: true }; stale.entries.push(entry('d'));
  for (const prefer of [true, false]) {
    const merged = Model.merge(current, stale, prefer);
    assert.deepEqual(merged.entries.map(e => e.exId), ['c', 'b', 'a', 'd']);
    assert.equal(merged.entries[2].sets[0].w, 25);
  }
});

test('a newly added copy of the same exercise is independent of its removed entry', () => {
  const current = session(); current.entries[0].entryId = 'replacement'; current.removedEntries = { 'legacy:a': true };
  assert.equal(Model.merge(current, session(), false).entries.filter(e => e.exId === 'a').length, 1);
});

test('mixed cardio merges edits, deliberate cleared fields, additions and removals without resurrection', () => {
  const current = session(), stale = session();
  stale.cardioBlocks = [{ id: 'warmup', min: 10, speed: 5, _rev: { at: 1 } }, { id: 'removed', min: 30 }];
  current.cardioBlocks = [{ id: 'warmup', min: 15, speed: null, _rev: { at: 2 } }, { id: 'finish', type: 'bike', min: 20 }];
  current.removedCardio = { removed: true };
  for (const prefer of [true, false]) {
    const merged = Model.merge(current, stale, prefer);
    assert.equal(Model.cardioTotal(merged), 35);
    assert.equal(merged.cardioBlocks.find(c => c.id === 'warmup').speed, null);
    assert.equal(merged.cardioBlocks.some(c => c.id === 'removed'), false);
  }
});

test('legacy cardio counts once; old empty cardio objects in strength sessions do not create blocks', () => {
  assert.equal(Model.cardioTotal({ kind: 'cardio', cardio: { min: '12,5' } }), 12.5);
  assert.equal(Model.cardioTotal({ kind: 'pesas', cardio: { min: 50 } }), 0);
  assert.equal(Model.cardioTotal({ kind: 'pesas', cardioBlocks: [{ min: 10 }, { min: 15 }] }), 25);
});

test('cardio requires positive minutes and rejects malformed or negative optional values', () => {
  assert.equal(Model.validCardio({ min: '12,5', incline: 0, distance: 2 }), true);
  for (const block of [{ min: 0 }, { min: -1 }, { min: 5, speed: -2 }, { min: 5, distance: '2oops' }, { min: Infinity }]) assert.equal(Model.validCardio(block), false);
});

// Execute the real application with an isolated DOM/storage adapter, without booting
// or opening the user's database. Event handlers and rendered HTML remain unchanged.
function app() {
  const nodes = new Map(), writes = new Map(), storage = new Map();
  function node(selector) {
    if (!nodes.has(selector)) nodes.set(selector, { hidden: true, value: '', innerHTML: '', textContent: '', style: {}, listeners: {},
      addEventListener(type, cb) { this.listeners[type] = cb; }, querySelectorAll() { return []; }, querySelector() { return null; },
      setAttribute() {}, focus() {}, contains() { return false; } });
    return nodes.get(selector);
  }
  const context = { console, SessionModel: Model, structuredClone, crypto: require('node:crypto').webcrypto,
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
    navigator: {}, location: { protocol: 'http:' },
    document: { querySelector: node, querySelectorAll: () => [], addEventListener() {}, hidden: false },
    window: { scrollTo() {}, matchMedia: () => ({ matches: true }) },
  };
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  const hooks = 'globalThis.app = { S, startSession, viewSession, viewBody, viewProgEx, viewHistList, summaryHTML, sessTotals, finishSession, flushSave, saveEntryOrder, removeSessionExercise, buildWorkbook, importBackup, backupText };';
  vm.runInNewContext(source.replace('\nboot();', '\n' + hooks), context, { filename: 'index.html' });
  const api = context.app;
  api.S.loaded = { routines: true, sessions: true }; api.S.dbEmpty = false;
  api.S.db = { doc: key => ({ set: async v => writes.set(key, copy(v)), get: async () => ({ exists: false }) }), exportAll: async () => Object.fromEntries(writes) };
  api.S.routines = { days: [{ id: 'day', name: 'Torso', kind: 'pesas', withCardio: true, exercises: [entry('a'), entry('b')].map(e => ({ id: e.exId, name: e.name, sets: 1, repMin: 8, repMax: 12 })) }] };
  return { ...api, node, writes, context };
}

test('daily changes persist after saving while the routine template stays intact', async () => {
  const a = app(); a.startSession('day');
  const original = copy(a.S.routines);
  assert.equal(a.S.active.cardioBlocks.length, 1);
  a.S.active.entries.reverse(); a.saveEntryOrder(); await a.flushSave();
  a.S.active.entries[0].sets[0].w = null;
  await a.removeSessionExercise(0); await a.flushSave();
  const saved = a.writes.get('sessions/' + a.S.active.id);
  assert.equal(saved.entries.length, 1);
  assert.equal(Object.keys(saved.removedEntries).length, 1);
  assert.deepEqual(a.S.routines, original);
  assert.match(a.viewSession(), /Quitar de hoy/);
  assert.match(a.viewSession(), /Agregar cardio a esta sesión/);
});

test('left/right body records, old unsided records and Excel export keep separate values', async () => {
  const a = app(); a.S.bodyDate = '2026-10-31';
  a.S.body = [{ date: '2026-10-31', arm: 33, armLeft: 34, armRight: 35, calfLeft: 37, calfRight: 38 }];
  const html = a.viewBody();
  assert.match(html, /Brazo izquierdo/); assert.match(html, /Brazo derecho/); assert.match(html, /Brazo \(sin lado\)/);
  assert.match(html, /id="b-armLeft"[^>]*value="34"/);
  for (const [field, value] of Object.entries(a.S.body[0])) if (field !== 'date') a.node('#b-' + field).value = String(value);
  a.node('#b-date').value = '2026-10-31';
  const button = { dataset: { act: 'bsave' } };
  await a.node('#view').listeners.click({ target: { closest: () => button } });
  assert.equal(a.writes.get('body/2026-10-31').armLeft, 34);
  assert.equal(a.writes.get('body/2026-10-31').armRight, 35);
  assert.equal(a.writes.get('body/2026-10-31').arm, 33);
  const sheets = {};
  a.buildWorkbook({ utils: { book_new: () => ({}), aoa_to_sheet: rows => ({ rows }), encode_range: () => 'A1:B2', book_append_sheet: (_, sheet, name) => { sheets[name] = sheet.rows; } }, write: () => [] });
  assert.equal(sheets.Cuerpo[1][sheets.Cuerpo[0].indexOf('Brazo izquierdo (cm)')], 34);
  assert.equal(sheets.Cuerpo[1][sheets.Cuerpo[0].indexOf('Brazo (sin lado) (cm)')], 33);
});

test('mixed workout finishes with cardio in summary, history, progress, backup and Excel', async () => {
  const a = app(); a.startSession('day');
  a.S.active.entries.forEach(e => { e.sets = [{ w: 20, r: 8, done: true }]; });
  Object.assign(a.S.active.cardioBlocks[0], { min: 15, type: 'bike', distance: 5 });
  await a.finishSession();
  const saved = [...a.writes.values()].find(s => s.status === 'done');
  assert.equal(saved.cardioBlocks[0].min, 15); assert.equal(saved.entries.length, 2);
  assert.equal(a.sessTotals(saved).cardio, 15);
  assert.match(a.summaryHTML(saved), /min cardio/); assert.match(a.summaryHTML(saved), /Bicicleta/);
  a.S.histOpen = saved.id;
  assert.match(a.viewHistList(), /15 min cardio/); assert.match(a.viewHistList(), /Bicicleta/);
  a.S.progEx = 'cardio'; assert.match(a.viewProgEx(), /Bicicleta/);
  assert.equal(JSON.parse(await a.backupText()).docs['sessions/' + saved.id].cardioBlocks[0].distance, 5);
  const sheets = {};
  a.buildWorkbook({ utils: { book_new: () => ({}), aoa_to_sheet: rows => ({ rows }), encode_range: () => 'A1:B2', book_append_sheet: (_, sheet, name) => { sheets[name] = sheet.rows; } }, write: () => [] });
  assert.equal(sheets.Sesiones[1][8], 15); assert.equal(sheets.Cardio[1][2], 'Bicicleta');
});

test('a strength day can save cardio alone and refuses an incomplete added cardio block', async () => {
  const a = app(); a.startSession('day');
  while (a.S.active.entries.length) await a.removeSessionExercise(0);
  await a.finishSession(); assert.ok(a.S.active); assert.match(a.node('#toast').textContent, /minutos mayores/);
  a.S.active.cardioBlocks[0].min = 20; await a.finishSession();
  assert.equal(a.S.active, null);
  assert.equal(a.S.sessions[0].entries.length, 0); assert.equal(a.sessTotals(a.S.sessions[0]).cardio, 20);
});

test('failed storage write keeps the active workout and cardio available to retry', async () => {
  const a = app(); a.startSession('day');
  a.S.active.entries.forEach(e => { e.sets = [{ w: 20, r: 8, done: true }]; });
  a.S.active.cardioBlocks[0].min = 15;
  a.S.db.doc = () => ({ set: async () => { throw new Error('disk full'); }, get: async () => ({ exists: false }) });
  await a.finishSession();
  assert.equal(a.S.active.status, 'active'); assert.equal(a.S.active.cardioBlocks[0].min, 15);
  assert.equal(a.S.active.entries.length, 2); assert.equal(a.S.sessions.length, 0);
});
