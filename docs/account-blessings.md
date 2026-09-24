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

## Reader v0.36 compatibility and review display (2026-09-24)

The 46 shared configurations contain six stat entries, 15 outgoing damage entries,
14 outgoing cap entries, and 11 incoming damage reductions. A fresh comparison of
the two control reports found no additional shared entries outside this catalog.

v0.36's `battle_entry_report.h::bonusRows` names 19 of these existing scalar
configurations through the damage-function fallback. Their `raw.component` changes
from `unmapped_operation` to `mapped_configured_parameter`: seven equipment physical
damage bonuses, one ultimate damage bonus, and 11 incoming reductions. Accept only
this known wrapper change for processes 1050253, 1050463, 1050415, 1050200 and 1050513.
The origin category, function, trigger, operation flag, full condition arrays, scope
parameters, zero tail slots, and secondary parameters must still match. Decode the
value from the imported raw slot; never substitute the saved account value. Six-stat
components and variable/missing parameter wrappers remain strict.
An identified control ID with a rejected signature is retained as unresolved; the
generic process decoder cannot bypass that rejection. Account source matching also
requires the validated blessing identity, not just equal IDs and condition labels.

Confirmed records now carry the explicit account-blessing name and a description
using their imported value. The reader inventory displays them in a separate,
collapsed account-blessing list without adding another calculation source. Incoming
reductions stay outside outgoing damage and six-stat panels. An inactive fire or
ultimate effect is recognized but does not qualify for an ice magic attack. Matching,
adoption and activation remain separate; deleted/excluded website effects stay out.

The screenshot's four records are 60002070 (robe, incoming physical -1%), 60003340
(ultimate damage +2.01%), 60002800 (incoming ice -1.99%), and 60001500 (fire cap +200).
The fire cap's exporter label did not change; its previous unmatched status was due
to the currently selected ice element, not a missing record.

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
