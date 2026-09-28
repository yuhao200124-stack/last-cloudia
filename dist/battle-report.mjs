// The reader's BattleEntryReport.json for the calculator: format checks and the v0.35 MP unit fix, then handed to
// the game-script engine as it is (the engine reads the units, stats, gear, passives and bosses itself; the old
// calculator's decoding of the reader's bonus records is gone with it).
const STAT_KEYS = ['hp', 'mp', 'attack', 'defense', 'intelligence', 'mind'];
const num = x => typeof x === 'number' && Number.isFinite(x) ? x : null;
export function validateBattleEntry(input) {
  if (input?.kind !== 'last-cloudia-battle-entry' || input.schemaVersion !== 1 || !Array.isArray(input.units) || input.units.length > 64) throw new Error('请选择v0.35或更新版生成的 BattleEntryReport.json，文件格式不匹配。');
  for (const unit of input.units) {
    if (!unit || !unit.stats || !Array.isArray(unit.bonuses) || unit.bonuses.length > 20000) throw new Error('角色或加成记录格式不完整。');
    for (const key of STAT_KEYS) if (unit.stats[key] != null && (num(unit.stats[key]) === null || unit.stats[key] < 0)) throw new Error('读取报告包含无效面板数值。');
    if (unit.panelSnapshots != null && (!Array.isArray(unit.panelSnapshots) || unit.panelSnapshots.length > 512)) throw new Error('读取报告的面板快照清单格式不正确。');
    for (const b of unit.bonuses) if (!b || typeof b.id !== 'string' || (b.value != null && typeof b.value !== 'string' && typeof b.value !== 'boolean' && num(b.value) === null)) throw new Error('读取报告包含无效加成记录。');
  }
  // v0.35 exported the game's MP thousandths. BattleUiUnit.ApplyMp divides both GetMp and GetMaxStatus(MP) by
  // 1000 before showing the values. Restrict the migration to that real-reader schema, never guess by magnitude.
  if (input.readerVersion === '0.35' && input.statsBasis === 'battle-final-at-observation' && input.collection?.method === 'read_only_process_memory' && !input.testFixture && !input.normalization?.mpThousandths) {
    const migrated = JSON.parse(JSON.stringify(input));
    for (const unit of [...migrated.units, ...(migrated.bosses || [])]) {
      const original = { maximum: unit.stats?.mp ?? null, current: unit.current?.mp ?? null };
      if (num(unit.stats?.mp) !== null) unit.stats.mp = Math.trunc(unit.stats.mp / 1000);
      if (num(unit.current?.mp) !== null) unit.current.mp = Math.trunc(unit.current.mp / 1000);
      unit.mpRawThousandths = original;
    }
    migrated.normalization = { ...migrated.normalization, mpThousandths: true, reason: 'v0.35 MP原始值按游戏界面规则除1000取整；原值保留在mpRawThousandths。' };
    return migrated;
  }
  return input;
}
