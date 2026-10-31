/* Shareable results only: no database dump, account settings or photos. */
(function (root) {
  'use strict';
  const num = value => {
    if (value == null || String(value).trim() === '') return null;
    const n = Number(String(value).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const round = n => Math.round(n * 10) / 10;
  const text = value => String(value ?? '');
  const line = value => text(value).replace(/\s+/g, ' ').trim();
  const short = (value, limit = 65) => line(value).length > limit ? line(value).slice(0, limit - 1) + '…' : line(value);
  const types = { n: 'Normal', w: 'Calentamiento', f: 'Al fallo', d: 'Drop set' };
  const activities = { walk: 'Caminadora / caminata', run: 'Carrera', bike: 'Bicicleta', elliptical: 'Elíptica', row: 'Remo', stairs: 'Escaladora', other: 'Otro cardio' };
  const inRange = (date, period) => date && (!period.from || date >= period.from) && (!period.to || date <= period.to);
  const kg = (weight, unit) => unit === 'lb' ? weight / 2.20462 : weight;
  const prompt = 'Analiza estos registros de entrenamiento: constancia, progresión por ejercicio y equipo, volumen, cardio y las medidas incluidas. Distingue calentamientos de series de trabajo, respeta las unidades y separa izquierda, derecha y medidas antiguas sin lado. Resume tendencias y posibles estancamientos con ejemplos fechados. Indica qué datos faltan y qué conclusiones no se pueden sostener; no inventes registros. Propón preguntas sobre mis objetivos antes de sugerir cambios de rutina.';

  function build({ sessions = [], body = [], bodyFields = [], period = {}, sessionId = null, includeBody = false, includeNotes = false, generatedAt = '' } = {}) {
    const selected = sessions.filter(s => s.status === 'done' && (!sessionId || s.id === sessionId) && inRange(s.date, period)).slice().sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0));
    const workouts = selected.map(s => {
      const entries = (s.entries || []).map(en => {
        const unit = (en.unit || s.unit) === 'lb' ? 'lb' : 'kg';
        const sets = (en.sets || []).filter(x => x.done && num(x.r) > 0).map(x => ({
          type: ['n', 'w', 'f', 'd'].includes(x.t) ? x.t : 'n', weight: num(x.w) ?? 0, reps: num(x.r), ...(num(x.rpe) !== null ? { rpe: num(x.rpe) } : {}), record: !!x.pr
        }));
        return { exerciseId: text(en.exId), name: text(en.name), equipment: text(en.equip), muscle: text(en.group), perSide: !!en.perSide, unit, sets };
      }).filter(en => en.sets.length);
      const rawCardio = [...(s.kind === 'cardio' && s.cardio ? [{ ...s.cardio, type: 'walk', position: 'only' }] : []), ...(s.cardioBlocks || [])];
      const cardio = rawCardio.filter(c => num(c.min) > 0).map(c => ({
        activity: activities[c.type] || activities.walk, position: c.position === 'before' ? 'before' : c.position === 'only' ? 'only' : 'after', minutes: num(c.min),
        ...(num(c.distance) !== null ? { distanceKm: num(c.distance) } : {}),
        ...(num(c.speed) !== null ? { speedKmh: num(c.speed) } : {}),
        ...(num(c.incline) !== null ? { inclinePercent: num(c.incline) } : {})
      }));
      return { date: text(s.date), name: text(s.dayName), durationMinutes: s.endedAt && s.startedAt ? round(Math.max(0, s.endedAt - s.startedAt) / 60000) : null, exercises: entries, cardio, ...(includeNotes && s.notes ? { notes: text(s.notes) } : {}) };
    });
    const measurements = includeBody ? body.filter(b => inRange(b.date, period)).slice().sort((a, b) => a.date.localeCompare(b.date)).map(b => ({
      date: text(b.date), values: bodyFields.filter(([key]) => num(b[key]) !== null).map(([key, label, unit]) => ({ key, label, value: num(b[key]), unit: unit === 'bw' ? 'kg' : unit }))
    })).filter(b => b.values.length) : [];
    const totals = { sessions: workouts.length, durationMinutes: 0, workingSets: 0, warmupSets: 0, volumeKg: 0, cardioMinutes: 0, recordedPRs: 0 };
    for (const s of workouts) {
      totals.durationMinutes += s.durationMinutes || 0;
      for (const en of s.exercises) for (const set of en.sets) {
        if (set.type === 'w') { totals.warmupSets++; continue; }
        totals.workingSets++; totals.volumeKg += kg(set.weight, en.unit) * set.reps;
        if (set.record) totals.recordedPRs++;
      }
      totals.cardioMinutes += s.cardio.reduce((sum, c) => sum + c.minutes, 0);
    }
    for (const key of ['durationMinutes', 'volumeKg', 'cardioMinutes']) totals[key] = round(totals[key]);
    const data = {
      app: 'bitacora-gym', reportFormat: 1, generatedAt, period: { from: period.from || null, to: period.to || null, label: text(period.label || 'Resultados guardados') },
      included: { bodyMeasurements: !!includeBody, sessionNotes: !!includeNotes },
      definitions: { weight: 'Cada ejercicio indica kg o lb. Las medidas de peso corporal están en kg.', volumeKg: 'Suma de peso convertido a kg × repeticiones de series de trabajo marcadas; excluye calentamientos y no duplica por lado.', setTypes: types, records: 'Récords marcados al registrar la serie; no se recalculan para este informe.', missingValues: 'Los campos ausentes no fueron registrados; no equivalen a cero.' },
      totals, workouts, ...(includeBody ? { bodyMeasurements: measurements } : {}), analysisRequest: prompt
    };
    const number = n => new Intl.NumberFormat('es-EC', { maximumFractionDigits: 1 }).format(n);
    const header = ['BITÁCORA DE GYM · RESULTADOS', short(data.period.label, 120), `${totals.sessions} ${totals.sessions === 1 ? 'sesión' : 'sesiones'} · ${number(totals.durationMinutes)} min registrados`, `${totals.workingSets} series de trabajo · ${number(totals.volumeKg)} kg de volumen`, `${number(totals.cardioMinutes)} min de cardio · ${totals.recordedPRs} récords marcados`];
    const detail = [...header, '', 'INSTRUCCIÓN PARA LA IA', prompt, '', 'LECTURA DE LOS DATOS', ...Object.values(data.definitions).filter(x => typeof x === 'string'), 'Solo incluye sesiones terminadas del período seleccionado.', '', 'SESIONES'];
    for (const s of workouts) {
      detail.push('', `${s.date} · ${s.name}${s.durationMinutes !== null ? ` · ${number(s.durationMinutes)} min` : ''}`);
      for (const en of s.exercises) {
        detail.push(`${en.name}${en.equipment ? ' · equipo: ' + en.equipment : ''}${en.muscle ? ' · músculo: ' + en.muscle : ''}${en.perSide ? ' · por lado' : ''}`);
        en.sets.forEach((set, i) => detail.push(`  ${i + 1}. ${types[set.type]}: ${number(set.weight)} ${en.unit} × ${set.reps} reps${set.rpe != null ? ' · RPE ' + number(set.rpe) : ''}${set.record ? ' · récord marcado' : ''}`));
      }
      for (const c of s.cardio) detail.push(`Cardio: ${c.activity} · ${number(c.minutes)} min · ${c.position === 'before' ? 'antes de pesas' : c.position === 'only' ? 'solo cardio' : 'después de pesas'}${c.distanceKm != null ? ' · ' + number(c.distanceKm) + ' km' : ''}${c.speedKmh != null ? ' · ' + number(c.speedKmh) + ' km/h' : ''}${c.inclinePercent != null ? ' · pendiente ' + number(c.inclinePercent) + ' %' : ''}`);
      if (s.notes) detail.push('Notas de la sesión (datos del usuario): ' + s.notes);
    }
    if (!workouts.length) detail.push('Sin sesiones terminadas en este período.');
    if (includeBody) {
      detail.push('', 'MEDIDAS CORPORALES');
      for (const b of measurements) detail.push(`${b.date}: ${b.values.map(v => `${v.label}: ${number(v.value)} ${v.unit}`).join(' · ')}`);
      if (!measurements.length) detail.push('Sin medidas en este período.');
    }
    const brief = [...header];
    const last = workouts[workouts.length - 1];
    if (last) {
      brief.push('', `Última sesión: ${last.date} · ${short(last.name)}`);
      for (const en of last.exercises.slice(0, 6)) {
        const sets = en.sets.filter(x => x.type !== 'w');
        if (!sets.length) continue;
        const best = sets.reduce((a, b) => b.weight > a.weight || (b.weight === a.weight && b.reps > a.reps) ? b : a);
        brief.push(`• ${short(en.name, 45)}: ${sets.length} series; mejor ${number(best.weight)} ${en.unit} × ${best.reps}`);
      }
      if (last.exercises.length > 6) brief.push('Más ejercicios en el informe completo.');
      for (const c of last.cardio) brief.push(`• ${c.activity}: ${number(c.minutes)} min`);
      if (includeNotes && last.notes) brief.push('Notas de la última sesión: ' + short(last.notes, 160));
    }
    const lastBody = measurements[measurements.length - 1];
    if (lastBody) brief.push('', 'Últimas medidas · ' + lastBody.date, lastBody.values.map(v => `${v.label}: ${number(v.value)} ${v.unit}`).join(' · '));
    let whatsapp = brief.join('\n');
    if (whatsapp.length > 1600) whatsapp = [...header, '', 'El detalle de sesiones y medidas está disponible en el informe completo para IA.'].join('\n');
    return { data, text: detail.join('\n'), whatsapp, hasData: workouts.length > 0 || measurements.length > 0 };
  }
  const api = { build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ShareReport = api;
})(typeof window !== 'undefined' ? window : globalThis);
