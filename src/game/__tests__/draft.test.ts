import {
  allowedChanges,
  changedIndexes,
  checkDraft,
  draftWord,
  erase,
  insertAt,
  newDraft,
  select,
  typeLetter,
  type DraftContext,
} from '../draft';

const plain: DraftContext = { rules: {}, locked: [], powerLeft: 0 };

describe('allowedChanges', () => {
  it('follows the backend: scales 1/2/3 by length, otherwise max_changes', () => {
    const scale = { scale_with_length: true };
    expect(allowedChanges(scale, 'fives')).toBe(1);
    expect(allowedChanges(scale, 'sevenxx')).toBe(2);
    expect(allowedChanges(scale, 'eightxxx')).toBe(3);
    expect(allowedChanges({}, 'fall')).toBe(1);
    expect(allowedChanges({ max_changes: 2 }, 'fall')).toBe(2);
  });
});

describe('typing', () => {
  it('replaces the selected tile, and typing again replaces the same tile in a one-change mode', () => {
    let d = select(newDraft('fall'), 0, plain);
    d = typeLetter(d, 'c', plain);
    expect(draftWord(d)).toBe('call');
    d = typeLetter(d, 'b', plain);
    expect(draftWord(d)).toBe('ball');
    expect(checkDraft(d, plain)).toEqual({ ok: true, power: false });
  });

  it('starts at the first tile when nothing is selected', () => {
    expect(draftWord(typeLetter(newDraft('fall'), 'c', plain))).toBe('call');
  });

  it('skips and refuses locked tiles', () => {
    const ctx: DraftContext = { rules: { lock_last_changed: true }, locked: [0], powerLeft: 0 };
    expect(select(newDraft('fall'), 0, ctx).selected).toBeNull();
    expect(draftWord(typeLetter(newDraft('fall'), 'b', ctx))).toBe('fbll');
  });

  it('moves to the next tile when several changes are allowed', () => {
    const ctx: DraftContext = { rules: { max_changes: 2 }, locked: [], powerLeft: 0 };
    const d = typeLetter(select(newDraft('fall'), 0, ctx), 'b', ctx);
    expect(d.selected).toBe(1);
  });
});

describe('erase', () => {
  it('puts back the original letter', () => {
    const d = erase(typeLetter(select(newDraft('fall'), 0, plain), 'c', plain), plain);
    expect(draftWord(d)).toBe('fall');
  });

  it('leaves unchanged tiles alone outside add/remove modes', () => {
    expect(draftWord(erase(select(newDraft('fall'), 0, plain), plain))).toBe('fall');
  });

  it('removes an unchanged tile in add/remove modes', () => {
    const ctx: DraftContext = { rules: { add_remove: true }, locked: [], powerLeft: 0 };
    const d = erase(select(newDraft('fall'), 3, ctx), ctx);
    expect(draftWord(d)).toBe('fal');
    expect(checkDraft(d, ctx).ok).toBe(true);
  });
});

describe('add/remove modes', () => {
  const ctx: DraftContext = { rules: { add_remove: true }, locked: [], powerLeft: 0 };

  it('needs the new tile filled, then accepts the longer word', () => {
    let d = insertAt(newDraft('fall'), 0, ctx);
    expect(checkDraft(d, ctx).ok).toBe(false);
    d = typeLetter(d, 's', ctx);
    expect(draftWord(d)).toBe('sfall');
    expect(checkDraft(d, ctx).ok).toBe(true);
  });

  it('removing the new tile returns to the original word', () => {
    expect(draftWord(erase(insertAt(newDraft('fall'), 2, ctx), ctx))).toBe('fall');
  });

  it('refuses inserting outside add/remove modes', () => {
    expect(draftWord(insertAt(newDraft('fall'), 0, plain))).toBe('fall');
  });
});

describe('checkDraft', () => {
  it('rejects no change without nagging', () => {
    expect(checkDraft(newDraft('fall'), plain)).toEqual({ ok: false, power: false });
  });

  it('rejects too many changes', () => {
    const d = { ...newDraft('fall'), cells: [...'bell'].map((ch, origin) => ({ ch, origin })) };
    expect(checkDraft(d, plain).ok).toBe(false);
  });

  it('allows one extra change as a power move only with power left', () => {
    const d = { ...newDraft('fall'), cells: [...'bell'].map((ch, origin) => ({ ch, origin })) };
    expect(checkDraft(d, { rules: { power_moves: 1 }, locked: [], powerLeft: 1 })).toEqual({ ok: true, power: true });
    expect(checkDraft(d, { rules: { power_moves: 1 }, locked: [], powerLeft: 0 }).ok).toBe(false);
  });
});

describe('changedIndexes', () => {
  it('finds substituted letters and an inserted letter', () => {
    expect(changedIndexes('fall', 'call')).toEqual([0]);
    expect(changedIndexes('fall', 'falls')).toEqual([4]);
    expect(changedIndexes('falls', 'fall')).toEqual([]);
  });
});
