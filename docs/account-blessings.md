# Account blessings control, 2026-09-23

This is the user's account profile, not a universal game default for other accounts.
The authoritative control is the corrected Lucia report captured at 2026-09-23T22:47:59Z,
battle 1790203679286-3, unit 101320. Discard the earlier equipped Lucia report.

Max-growth source: https://altema.jp/lastcloudia/chara/256 (Lv120 + ability board + awakening8).

| Stat | Original | Blessing | Game display |
|---|---:|---:|---:|
| HP | 11252 | 7% | 12039 |
| MP | 486 | 3% | 500 |
| STR | 1232 | 4% | 1281 |
| DEF | 1733 | 3% | 1784 |
| INT | 1574 | 3% | 1621 |
| MND | 2056 | 5% | 2158 |

The 46 shared entries match the user's Roxy report by localId, process,
raw values and conditions. Assignment to account blessings follows this control
and the user's confirmation. It is NOT established by a 6000 ID range or by
Affiliation=4 (which means AutoSkill). The actual native origin marker is the
UnitDressInfo.BlessingPassiveSkillIds list (+0x888), used in UnitUtil.CalcUnitStatus
(RVA 0x1165A5E onward), with set_isBlessing(true) near 0x1165BA5.
That marker is not exported in reader v0.35. Character-specific personality entries
are deliberately excluded from this shared profile.

Raw script parameters establish configuration semantics, not per-hit application.
Damage percentages stay distinct from stat percentages, fixed cap additions, and
incoming damage reductions. Conditions remain declarative and edits are reviewable.
Do not interpret buffActive=0 as absence, or operationActive=1 as proof of a hit.

## MP normalization

Reader v0.35 stores GetMp/GetMaxStatus(MP) internal thousandths. In the supplied
native image, BattleUiUnit.ApplyMp at RVA 0x1690AE0 divides both by 1000 before
CacheValue(now,max): signed division uses magic constant 0x10624dd3 and shift 6
following the calls near 0x1690B0C and 0x1690B53. Thus 500580 is 500.58 internally,
shown as 500; it is not a panel of 500580 MP. The website migration is bounded by
version, real process-memory collection and stats basis; fixtures are excluded.
Original values survive in mpRawThousandths. An explicit migration marker prevents
repeat division. Future reader versions must declare their MP unit independently.

## Calculation boundaries

The character page displays original six stats. The base bonus calculator's account
switch defaults off; only the damage calculator's independent switch defaults on.
Both retain later user choices. A group-level off state is inactive, distinct from
an explicitly disabled source/rule, so the damage page cannot revive user-disabled
effects. readCharacterProfile always reads raw base. The entry workflow can choose
base plus adopted blessings, raw base, manual final stats, or reader final stats.
Stat effects remain provenance/reference after a final panel is chosen, and are
never passed as additional damage multipliers. All damage and cap choices remain
separate, with per-source conditions.
