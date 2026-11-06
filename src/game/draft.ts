import type { Rules } from '@/api/types';

/** The word a player is building on their turn. `origin` is the index in the current word; null = inserted. */
export type Cell = { ch: string; origin: number | null };
export type Draft = { base: string; cells: Cell[]; selected: number | null };

export type DraftContext = { rules: Rules; locked: number[]; powerLeft: number };

export function allowedChanges(rules: Rules, word: string): number {
  if (!rules.scale_with_length) return rules.max_changes ?? 1;
  return word.length <= 5 ? 1 : word.length <= 7 ? 2 : 3;
}

export function newDraft(base: string): Draft {
  return { base, cells: [...base].map((ch, origin) => ({ ch, origin })), selected: null };
}

export const draftWord = (d: Draft) => d.cells.map((c) => c.ch).join('');

export const isChanged = (d: Draft, i: number) => {
  const c = d.cells[i];
  return c.origin === null || d.base[c.origin] !== c.ch;
};

const isLocked = (d: Draft, i: number, ctx: DraftContext) => {
  const origin = d.cells[i]?.origin;
  return origin !== null && origin !== undefined && !!ctx.rules.lock_last_changed && ctx.locked.includes(origin);
};

export const cellLocked = isLocked;

export const structureChanged = (d: Draft) =>
  d.cells.length !== d.base.length || d.cells.some((c) => c.origin === null);

export function select(d: Draft, i: number, ctx: DraftContext): Draft {
  return isLocked(d, i, ctx) ? d : { ...d, selected: i };
}

function firstEditable(d: Draft, ctx: DraftContext, from = 0): number | null {
  for (let i = from; i < d.cells.length; i++) if (!isLocked(d, i, ctx)) return i;
  return null;
}

/** Type a letter into the selected tile. When several changes are allowed, moves on to the next tile. */
export function typeLetter(d: Draft, letter: string, ctx: DraftContext): Draft {
  const at = d.selected ?? firstEditable(d, ctx);
  if (at === null) return d;
  const cells = d.cells.map((c, i) => (i === at ? { ...c, ch: letter.toLowerCase() } : c));
  const next = { ...d, cells };
  const moveOn = allowedChanges(ctx.rules, d.base) + (ctx.powerLeft > 0 ? 1 : 0) > 1;
  return { ...next, selected: moveOn ? (firstEditable(next, ctx, at + 1) ?? at) : at };
}

/** Backspace: undoes the selected tile. In add/remove modes an unchanged tile is removed instead. */
export function erase(d: Draft, ctx: DraftContext): Draft {
  const at = d.selected;
  if (at === null) return d;
  const cell = d.cells[at];
  if (cell.origin === null) {
    const cells = d.cells.filter((_, i) => i !== at);
    return { ...d, cells, selected: cells.length ? Math.min(at, cells.length - 1) : null };
  }
  if (isChanged(d, at)) {
    return { ...d, cells: d.cells.map((c, i) => (i === at ? { ...c, ch: d.base[cell.origin!] } : c)) };
  }
  if (ctx.rules.add_remove && !structureChanged(d) && d.cells.length > 2) {
    const cells = d.cells.filter((_, i) => i !== at);
    return { ...d, cells, selected: Math.min(at, cells.length - 1) };
  }
  return d;
}

/** Add/remove modes: open an empty tile at gap `i` (0 = before the first tile). */
export function insertAt(d: Draft, i: number, ctx: DraftContext): Draft {
  if (!ctx.rules.add_remove) return d;
  const base = newDraft(d.base);
  const cells = [...base.cells.slice(0, i), { ch: '', origin: null }, ...base.cells.slice(i)];
  return { ...d, cells, selected: i };
}

export type DraftCheck = { ok: boolean; power: boolean; reason?: string };

/** Quick local check so obvious mistakes never cost a server round trip. The server still decides. */
export function checkDraft(d: Draft, ctx: DraftContext): DraftCheck {
  const word = draftWord(d);
  if (d.cells.some((c) => !c.ch)) return { ok: false, power: false, reason: 'Fill in the new tile.' };
  if (word === d.base) return { ok: false, power: false };
  if (structureChanged(d)) {
    const edited = d.cells.some((c) => c.origin !== null && d.base[c.origin] !== c.ch);
    return edited
      ? { ok: false, power: false, reason: 'Add or remove a letter, or change letters. Not both.' }
      : { ok: true, power: false };
  }
  const changes = d.cells.filter((_, i) => isChanged(d, i)).length;
  const allowed = allowedChanges(ctx.rules, d.base);
  if (changes <= allowed) return { ok: true, power: false };
  if (changes === allowed + 1 && ctx.rules.power_moves) {
    return ctx.powerLeft > 0
      ? { ok: true, power: true }
      : { ok: false, power: false, reason: 'You have no power moves left.' };
  }
  return { ok: false, power: false, reason: `Change at most ${allowed} letter${allowed > 1 ? 's' : ''}.` };
}

/** Which letters of `after` differ from `before`, for highlighting the word chain. */
export function changedIndexes(before: string, after: string): number[] {
  if (before.length !== after.length) {
    let i = 0;
    while (i < after.length && before[i] === after[i]) i++;
    return after.length > before.length ? [i] : [];
  }
  return [...after].flatMap((ch, i) => (before[i] !== ch ? [i] : []));
}
