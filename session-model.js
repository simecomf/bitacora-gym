/* Shared session rules. No storage or DOM: old backups remain readable. */
(function (root) {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const number = value => value === '' || value == null ? null : Number(String(value).replace(',', '.'));
  const key = entry => entry.entryId || 'legacy:' + entry.exId;
  const done = entry => (entry.sets || []).filter(set => set.done).length;
  const compare = (a, b) => (a?.at || 0) - (b?.at || 0) || String(a?.by || '').localeCompare(String(b?.by || ''));
  const cardioBlocks = session => [
    ...(session.kind === 'cardio' && session.cardio ? [{ ...session.cardio, id: 'legacy', type: 'walk' }] : []),
    ...(session.cardioBlocks || [])
  ];
  const cardioTotal = session => cardioBlocks(session).reduce((sum, block) => sum + Math.max(0, number(block.min) || 0), 0);
  const validCardio = block => number(block.min) > 0 && ['min', 'speed', 'incline', 'distance'].every(field => {
    const value = block[field];
    return value === '' || value == null || (Number.isFinite(number(value)) && number(value) >= 0);
  });
  function merge(local, remote, preferLocal) {
    const out = copy(preferLocal ? local : remote), other = preferLocal ? remote : local;
    // Tombstones prevent a stale tab or the recovery backup from restoring removals.
    out.removedEntries = { ...local.removedEntries, ...remote.removedEntries };
    const entries = new Map();
    for (const entry of [...(out.entries || []), ...(other.entries || [])]) {
      const id = key(entry); if (out.removedEntries[id]) continue;
      const mine = entries.get(id);
      if (!mine || done(entry) > done(mine)) entries.set(id, { ...copy(entry), entryId: id });
    }
    out.entryOrder = copy(compare(local.entryOrder, remote.entryOrder) >= 0 ? local.entryOrder || null : remote.entryOrder || null);
    const order = out.entryOrder?.ids || [];
    out.entries = [...entries.values()].sort((a, b) => {
      const ai = order.indexOf(key(a)), bi = order.indexOf(key(b));
      return (ai < 0 ? Infinity : ai) - (bi < 0 ? Infinity : bi);
    });
    out.removedCardio = { ...local.removedCardio, ...remote.removedCardio };
    const blocks = new Map();
    for (const block of [...(out.cardioBlocks || []), ...(other.cardioBlocks || [])]) {
      if (out.removedCardio[block.id]) continue;
      const mine = blocks.get(block.id);
      if (!mine || compare(block._rev, mine._rev) > 0) blocks.set(block.id, copy(block));
    }
    out.cardioBlocks = [...blocks.values()];
    if (!out.notes && other.notes) out.notes = other.notes;
    const oc = out.cardio || (out.cardio = {}), xc = other.cardio || {};
    for (const field of ['min', 'speed', 'incline']) if (number(oc[field]) === null && number(xc[field]) !== null) oc[field] = xc[field];
    out.startedAt = Math.min(local.startedAt || Infinity, remote.startedAt || Infinity);
    return out;
  }
  const api = { key, compare, cardioBlocks, cardioTotal, validCardio, merge };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SessionModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
