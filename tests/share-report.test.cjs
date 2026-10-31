const test = require('node:test');
const assert = require('node:assert/strict');
const Report = require('../share-report.js');

const bodyFields = [['weight', 'Peso', 'bw'], ['arm', 'Brazo (sin lado)', 'cm'], ['armLeft', 'Brazo izquierdo', 'cm'], ['armRight', 'Brazo derecho', 'cm']];
const period = { from: '2026-10-01', to: '2026-10-31', label: 'Octubre de 2026' };
const workout = (id, date) => ({ id, date, status: 'done', startedAt: Date.parse(date + 'T12:00:00Z'), endedAt: Date.parse(date + 'T13:00:00Z'), dayName: 'Torso', unit: 'kg', notes: 'NOTA PRIVADA', photos: 'FOTO PRIVADA', _by: 'CLIENTE PRIVADO', settings: { drive: 'CONEXIÓN PRIVADA' }, entries: [
  { exId: 'press', name: 'Press & banca', equip: 'barra', unit: 'kg', sets: [{ w: 5, r: 10, done: true, t: 'w', pr: true }, { w: 10, r: 10, done: true, rpe: 8, pr: true }, { w: 100, r: 5, done: false }] },
  { exId: 'curl', name: 'Curl unilateral', equip: 'mancuerna', unit: 'lb', perSide: true, sets: [{ w: 22.0462, r: 5, done: true }] }
], cardioBlocks: [{ type: 'bike', min: 15, distance: 5, position: 'before' }] });

test('reports include only completed sessions inside inclusive date bounds, or one selected session', () => {
  const sessions = [workout('old', '2026-09-30'), workout('first', '2026-10-01'), workout('last', '2026-10-31'), workout('future', '2026-11-01'), { ...workout('active', '2026-10-31'), status: 'active' }];
  const result = Report.build({ sessions, period });
  assert.equal(result.data.totals.sessions, 2);
  assert.deepEqual(result.data.workouts.map(s => s.date), ['2026-10-01', '2026-10-31']);
  assert.equal(Report.build({ sessions, period, sessionId: 'last' }).data.totals.sessions, 1);
  assert.equal(Report.build({ sessions, period, sessionId: 'active' }).hasData, false);
});

test('totals normalize kg and lb, exclude warmups and unfinished sets, and preserve cardio and sides', () => {
  const report = Report.build({ sessions: [workout('one', '2026-10-15')], period });
  assert.equal(report.data.totals.volumeKg, 150);
  assert.equal(report.data.totals.workingSets, 2);
  assert.equal(report.data.totals.warmupSets, 1);
  assert.equal(report.data.totals.recordedPRs, 1);
  assert.equal(report.data.totals.cardioMinutes, 15);
  assert.equal(report.data.totals.durationMinutes, 60);
  assert.equal(report.data.workouts[0].exercises[1].perSide, true);
  assert.equal(report.data.workouts[0].exercises[1].unit, 'lb');
  assert.match(report.text, /RPE 8/); assert.match(report.text, /antes de pesas/); assert.match(report.text, /5 km/);
});

test('body measurements and notes are opt-in; photos and connection settings never enter the report', () => {
  const options = { sessions: [workout('one', '2026-10-15')], body: [{ date: '2026-10-15', weight: 80, armLeft: 32, armRight: 33 }], bodyFields, period };
  const result = Report.build(options);
  for (const secret of ['NOTA PRIVADA', 'FOTO PRIVADA', 'CLIENTE PRIVADO', 'CONEXIÓN PRIVADA', 'armLeft']) {
    assert.equal(JSON.stringify(result).includes(secret), false);
  }
  assert.equal(Object.hasOwn(result.data, 'bodyMeasurements'), false);
  const allowed = Report.build({ ...options, includeBody: true, includeNotes: true });
  assert.equal(allowed.data.bodyMeasurements[0].values[0].unit, 'kg');
  assert.match(allowed.text, /NOTA PRIVADA/);
  assert.equal(JSON.stringify(allowed).includes('FOTO PRIVADA'), false);
});

test('left, right and historical unsided measurements stay separate, filtered and shareable without workouts', () => {
  const result = Report.build({ bodyFields, period, includeBody: true, body: [
    { date: '2026-09-30', weight: 82 },
    { date: '2026-10-15', weight: 80, arm: 30, armLeft: 32, armRight: 33, photo: 'private' }
  ] });
  assert.equal(result.hasData, true);
  assert.equal(result.data.bodyMeasurements.length, 1);
  assert.deepEqual(result.data.bodyMeasurements[0].values.map(v => v.value), [80, 30, 32, 33]);
  assert.match(result.text, /Brazo \(sin lado\): 30 cm/);
  assert.match(result.whatsapp, /Brazo izquierdo: 32 cm/);
  assert.match(result.whatsapp, /Brazo derecho: 33 cm/);
});

test('legacy standalone cardio and mixed cardio both appear; no empty old cardio object is counted', () => {
  const mixed = workout('mixed', '2026-10-15'); mixed.cardio = { min: 200 };
  const legacy = { ...workout('legacy', '2026-10-16'), kind: 'cardio', entries: [], cardioBlocks: [], cardio: { min: 30, speed: 5, incline: 0 } };
  const result = Report.build({ sessions: [mixed, legacy], period });
  assert.equal(result.data.totals.cardioMinutes, 45);
  assert.match(result.text, /solo cardio/);
  assert.match(result.text, /pendiente 0 %/);
});

test('WhatsApp text is bounded even with unusually long records; full export retains every series', () => {
  const sessions = Array.from({ length: 60 }, (_, i) => {
    const s = workout('s' + i, '2026-10-15'); s.dayName = 'Sesión '.repeat(300); s.notes = 'Nota '.repeat(1000);
    s.entries[0].name = 'Ejercicio '.repeat(300); s.cardioBlocks = Array.from({ length: 50 }, () => ({ type: 'bike', min: 1 }));
    return s;
  });
  const before = JSON.stringify(sessions);
  const result = Report.build({ sessions, period: { ...period, label: 'Período '.repeat(1000) }, includeNotes: true });
  assert.ok(result.whatsapp.length <= 1600);
  assert.equal(result.data.workouts.length, 60);
  assert.equal(result.data.workouts[0].cardio.length, 50);
  assert.ok(result.text.length > result.whatsapp.length);
  assert.equal(JSON.stringify(sessions), before);
});

test('an empty range has no data and does not expose pending workout values', () => {
  const result = Report.build({ sessions: [{ ...workout('pending', '2026-10-15'), status: 'active' }], period });
  assert.equal(result.hasData, false); assert.equal(result.data.workouts.length, 0);
  assert.equal(result.text.includes('Press & banca'), false);
});
