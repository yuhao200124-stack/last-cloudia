# Pre-guidance runtime/skill INT layer investigation

Read-only native investigation against `recovered/native-reader-fields/GameAssembly.dll`, image base `0x180000000`. Addresses below are RVAs. This note records source evidence separately from the measured CSV validation. It does not establish an all-skills universal formula.

## Direct canonical input path

`BattleUnitStatus` embeds `ProcStatus` at `+0x730`:

| Field | Relative to ProcStatus | Relative to BattleUnitStatus |
| --- | --- | --- |
| Status (pre-runtime base) | +0x10 | +0x740 |
| FinalStatus | +0x94 | +0x7C4 |
| AddMuls list | +0x118 | +0x848 |

`ProcStatus.GetMaxStatus` RVA `0x1834040` reads Status when finalStatus=false and calls CalcFinalStatus before reading FinalStatus when true. This base must not be confused with the current reader's `naked` snapshot at BattleUnitStatus+0x6A0.

The six integer stats inside StatusParam start at +0x04: HP, MP, STR, DEF, INT, MND. They use the existing reader's CryptedInt XOR `0x7EB809EC`. The direct pre-runtime INT field is BattleUnitStatus+0x754. Preserve raw MP units (thousandths) and missing/read-failure state.

## Construction, copying, and finalization evidence

1. `BattleUnitStatus.CalcBattleStatus`, RVA `0x17C0AA0`:
   - `0x17C0E48` invokes ProcStatus initialization `0x1834570` on status+0x730 with a supplied StatusParam snapshot.
   - `0x17C0EB5` collects runtime changes with base status+0x740, lists +0x860/+0x868, bank flag 2.
   - `0x17C0EE9` prepares/clears AddMuls via `0x1832F40`.
   - Calls `0x18258D0` at `0x17C0F26`, `0x17C0F4C`, and `0x17C0F72` merge lists +0x728, +0x860, and +0x868 into +0x848, always using +0x740 as the baseline and `R9b=1`.

2. Anonymous ProcStatus copying routine `0x1832FF0`:
   - Copies source Status+0x10 to destination+0x10 (`0x183316E`).
   - Copies source FinalStatus+0x94 to destination+0x94 (`0x183323C`).
   - Copies final-status dirty flag at +0x12E (`0x1833314`).
   - Clones source AddMuls list+0x118 using List copy constructor `0x3508720` at `0x18334A6`, then stores clone at destination+0x118 at `0x18334B5`.
   - The working copy preserves original base and current modification list separately; it does not replace the base with FinalStatus.

3. Anonymous ProcUnit constructors `0x1835E30` / `0x1835F80` retain sourceUnit at +0x18 and copy a supplied full ProcStatus into +0x20 via the routine above (`0x1835EF9` / `0x1836049`). ProcUnit copy routine `0x1834F70` does likewise at `0x1835033`.

4. Work-target resolver `0x1864BB0` obtains a full 0x130-byte ProcStatus through interface slot 32, helper `0x565F0`, at `0x1864D05` / `0x1864EC7`. It supplies that status to ProcUnit construction at `0x1864D97` / `0x1864F57`; existing ProcUnits are copied at `0x1864E73`.

5. A concrete status getter exists at `0x17C7CF0`: it copies exactly 0x130 bytes from its source object's +0x730 to the returned structure. No direct call references were found, consistent with a virtual getter, but the exact interface-slot-32-to-concrete-getter mapping is not proven without metadata. Do not assert that specific link as fully recovered.

6. `ProcStatus.CalcFinalStatus`, `0x1832B60`, copies Status to FinalStatus and invokes `EvaluateAddMuls` (`0x1833650`). The latter calls `LogEditParam.CombineAddMuls` (`0x1824EF0`) at `0x18336D2`, then applies combined add/mul/postAdd through `BuffAddMul.Calc` (`0x18237F0`). Prior verified source documentation records integer addition of each component in CombineAddMuls at `0x1825308–0x1825319`.

## Actual modification-list layout and selection

Generic List getter `0x32EC610` proves:

```text
list +0x10 = backing array pointer
list +0x18 = count
array +0x20 + index*0x44 = LogEditParam
```

LogEditParam fields verified in selection routine `0x1825A30` and evaluation:

| Offset | Meaning |
| --- | --- |
| +0x18 | direction/debuff byte used by stronger-selection comparison |
| +0x2C | selection-key field copied into predicate context; exact semantic label requires metadata |
| +0x30 | flags; low 12 bits are statType |
| +0x34 | add |
| +0x38 | mul raw (percentage/10000 scale in Calc) |
| +0x3C | postAdd |
| +0x40 | computed candidate result cached for stronger-selection comparison |

`0x18258D0` iterates source List, gets each 0x44 record through `0x32EC610`, and calls selection routine `0x1825A30`. Selection computes the entire candidate with the baseline getter and `BuffAddMul.Calc` at `0x1825BBC`, stores it at +0x40, and compares against the existing candidate. Direction byte changes greater-than to less-than. Do not implement independent per-field maxima. Existing documented group semantics are same-stat/same-nonzero-group/same-direction competition, group0 not exclusive; the fresh disassembly here does not independently recover the anonymous predicate's complete group conditions.

## Skill source and independent validation

Recovered Lua `evidence/skill_processes_10001_10103.lua.txt` process10101 calls:

```lua
Bullet:EditINT(params[1], params[2])
if Field:IsPvP() and params[4] ~= 0 then
    Bullet:Damage(MAGICAL, params[4])
else
    Bullet:Damage(MAGICAL, params[3])
end
```

For skill270090 raw `[0,6700,5200,868,...]`, this gives INT add0/mul6700, magical coefficient5200; 868 is only the PvP branch. No heavy-magic-specific scaling is present in this process.

The independent website panel derivation yields base6741. Its known runtime EX+50% state gives final panel floor(6741*1.50)=10111. With the skill's +67% in the preserved working modification pool, predicted settlement INT is floor(6741*(1+0.50+0.67))=14627. This is a base-and-known-effects prediction, not reverse division of the final panel and not use of measured settlement A as an input.

CSV validation only: `upload/a6f14f8d-33ea-4d78-9baf-ae778f3c0bad.csv`, session1790218789141 battle1 has 35 HP events sum2410222. Its 8 LOG rows show panelINT10111. Its 32 strict source1/target101 CACHE samples report settlement_atk14627, def8000, base_ratio0.311999977, final_ratio0.350999981. These match the predicted attack input. This numerical agreement validates this tested state; it must not be described as proof of every damage stage or every skill.

## Bounded implementation implication

The current website may use independently computed `beforeBuff + crossAdd` plus only known supported runtime families, compare the resulting panel against observed panel to select a unique supported state, and calculate the temporary skill edit in the same pool. Unknown families or multiple matches should block automatic inference. CSV settlement_atk remains an independent check.

A future reader can avoid state inference by exporting the direct canonical Status snapshot and the actual selected AddMuls list together with FinalStatus. Use a stable read/check, preserve every 0x44 raw record and missing state, and verify recomposed FinalStatus against the independently read FinalStatus. Do not call the direct base a naked character panel, and do not sum all Buff inventory candidates as if selected.
