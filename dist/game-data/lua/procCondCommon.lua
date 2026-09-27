require 'luaCommon'

----------------------------------------------------------------------------------
-- 									定数定義部									--
-- 				ControlTypesとTriggerTypesはBattleConstantsからコピペ			--
----------------------------------------------------------------------------------
-- ログレベル
-- 基本はluaCommonから引き継ぎ
LOG_LEVEL = LOG_LEVEL

-- 属性演出TLのsegment情報
-- 共通ではなくなる可能性もあるが、一旦共通定義
-- !!互換性のために残しているが、今後は2を使用すること!!
EFFECT_TIMELINE_SEGMENT_ELEMENT = {
[ELEMENT_FIRE] = 5,
[ELEMENT_ICE] = 6,
[ELEMENT_TREE] = 7,
[ELEMENT_THUNDER] = 8,
[ELEMENT_LIGHT] = 9,
[ELEMENT_DARK] = 10,
[ELEMENT_ALL] = 17
}

-- デバフも考慮した属性演出TLのsegment情報
-- functionアクセスに対応(EFFECT_TIMELINE_SEGMENT_ELEMENT2(ELEMENT_XXX, _isDeBuff))
EFFECT_TIMELINE_SEGMENT_ELEMENT2 = {
[ELEMENT_NONE] = {19, 20},
[ELEMENT_FIRE] = {5, 11},
[ELEMENT_ICE] = {6, 12},
[ELEMENT_TREE] = {7, 13},
[ELEMENT_THUNDER] = {8, 14},
[ELEMENT_LIGHT] = {9, 15},
[ELEMENT_DARK] = {10, 16},
[ELEMENT_ALL] = {17, 18},
}
setmetatable(EFFECT_TIMELINE_SEGMENT_ELEMENT2, {__call = function(_table, _elem, _isDebuff) return _table[_elem][_isDebuff and 2 or 1] end})

-- DisableSkillのモード
SKILL_DISABLE_MODE_GRAYOUT = 0		-- グレーアウト
SKILL_DISABLE_MODE_REDUI = 1		-- UI（赤枠）

-- ダメージタイプ
DAMAGE_TYPE_PHYSICAL = 100
DAMAGE_TYPE_MAGICAL = 101

-- ミスタイプ
MISS_TYPE_NONE = 0
MISS_TYPE_DAMAGE = 1
MISS_TYPE_HEAL_HP = 10
MISS_TYPE_HEAL_MP = 11
MISS_TYPE_BUFF = 20
MISS_TYPE_DEBUFF = 21
MISS_TYPE_AILMENT = 30
MISS_TYPE_AILMENT_REMOVE = 31
MISS_TYPE_STEAL = 40

-- タイムライン情報
TIMELINE_PROPERTY_OWNER = 1
TIMELINE_PROPERTY_SKILL_TARGET = 2
TIMELINE_PROPERTY_TARGET = 3
TIMELINE_PROPERTY_SKILL_PUID = 10
TIMELINE_PROPERTY_PUID = 11
TIMELINE_PROPERTY_NUM_FAMILIES = 12
TIMELINE_PROPERTY_IS_MAIN = 13
TIMELINE_PROPERTY_SKILL_ID = 20
TIMELINE_PROPERTY_SKILL_TYPE = 21
TIMELINE_PROPERTY_SKILL_INDEX = 22
TIMELINE_PROPERTY_SKILL_SLOT = 23
TIMELINE_PROPERTY_IS_COUNTER = 30
TIMELINE_PROPERTY_CANCELLED = 50
TIMELINE_PROPERTY_RANDOM = 100

-- バレット情報
BULLET_PROPERTY_ISVALID = 0
BULLET_PROPERTY_UID = 1
BULLET_PROPERTY_BUFF_UID = 2
BULLET_PROPERTY_SKILL_ID = 3
BULLET_PROPERTY_ID = 4
BULLET_PROPERTY_LOCAL_ID = 5
BULLET_PROPERTY_ISBULLET = 6
BULLET_PROPERTY_SKILL_TYPE = 100
BULLET_PROPERTY_SKILL_TARGET_SIDE = 101
BULLET_PROPERTY_SKILL_TARGET_RANGE = 102
BULLET_PROPERTY_SKILL_ROLE = 103
BULLET_PROPERTY_SKILL_ROLE_DETAIL = 104
BULLET_PROPERTY_SKILL_KILLER_VALUE = 105
BULLET_PROPERTY_SKILL_ELEMENT_FROM_WEAPON = 106
BULLET_PROPERTY_SKILL_ELEMENT = 107
BULLET_PROPERTY_SKILL_KIND = 108
BULLET_PROPERTY_TARGET_SIDE = 111
BULLET_PROPERTY_HIT_SIDE = 200
BULLET_PROPERTY_KNOCKBACK_X = 201
BULLET_PROPERTY_KNOCKBACK_Y = 202
BULLET_PROPERTY_KNOCKBACK_TYPE = 203
BULLET_PROPERTY_KNOCKBACK_Z = 204
BULLET_PROPERTY_HIT_SE = 205
BULLET_PROPERTY_SUPER_ARMOR = 300
BULLET_PROPERTY_VIT_DAMAGE = 302
BULLET_PROPERTY_GUARD = 303
BULLET_PROPERTY_POP_DELAY = 304
BULLET_PROPERTY_HIT_STOP = 305
BULLET_PROPERTY_DAMAGE_TIME = 306
BULLET_PROPERTY_ETHER_DROP = 307
BULLET_PROPERTY_WEAPON_INDEX = 400
BULLET_PROPERTY_DAMAGE_RATIO_READ_ONLY = 401 -- 二刀流や多段魔法用なので10000か6000固定
BULLET_PROPERTY_HIT_INDEX = 402
BULLET_PROPERTY_DAMAGE_LIMIT = 410
BULLET_PROPERTY_HEAL_LIMIT = 411
BULLET_PROPERTY_FATAL_BLOW_INCIDENCE = 433
BULLET_PROPERTY_FATAL_BLOW_ATK_RATIO = 434
BULLET_PROPERTY_OWNER_UID = 520
BULLET_PROPERTY_TARGET_UID = 521
BULLET_PROPERTY_OWNER_PARTY_TYPE = 522
BULLET_PROPERTY_TARGET_PARTY_TYPE = 523
BULLET_PROPERTY_TARGET_PARTY_SIDE = 524

-- 操作寿命タイプ
LIFETYPE_NORMAL = 0			-- 永続
LIFETYPE_TRANSIENT = 2		-- 親の寿命まで
LIFETYPE_CONTINUOUS = 3		-- 次回トリガーが呼ばれるまで

-- 変数寿命タイプ
VAR_LIFETYPE_WAVE = 0		-- WAVE中
VAR_LIFETYPE_QUEST = 1		-- WAVEを跨いでクエスト中
VAR_LIFETYPE_GVG = 2		-- クエストを跨いでGvGバトル中

-- ステータス対象
TARGET_STATUS_SUBJECT_WORK = 1			-- 発動者ワーク(トリガーや発生元に応じて暗黙ロードされる)
TARGET_STATUS_UNIT_WORK = 2				-- ターゲットワーク(idを渡すことで辞書的に作られるワーク)
TARGET_STATUS_BULLET_WORK = 3			-- バレットワーク(バレットサンプル値を用いて作られるワーク)
TARGET_STATUS_BUFF_WORK = 4				-- バフ発動者ワーク(バフ発動者サンプル値を用いて作られるワーク)
TARGET_STATUS_BUFF_OWNER_WORK = 5		-- バフ所有者ワーク(バフ所有者サンプル値を用いて作られるワーク)
TARGET_STATUS_SUBJECT_REAL = 9			-- 発動者リアルタイムステータス
TARGET_STATUS_UNIT_REAL = 10			-- ターゲットリアルタイムステータス(idを渡すことで辞書的に参照可能)
TARGET_STATUS_BULLET_SAMPLE = 11		-- バレットサンプル(参照することはあっても対象にすることはないはず)
TARGET_STATUS_BUFF_SAMPLE = 12			-- バフ発動者サンプル(参照することはあっても対象にすることはないはず)
TARGET_STATUS_BUFF_OWNER_SAMPLE = 13	-- バフ所有者サンプル(参照することはあっても対象にすることはないはず)
TARGET_STATUS_SUBJECT_LOCAL_WORK = 17	-- 発動者ワーク(他のプロセスに影響を与えない)
TARGET_STATUS_UNIT_LOCAL_WORK = 18		-- ターゲットワーク(他のプロセスに影響を与えない)
TARGET_STATUS_BULLET_LOCAL_WORK = 19	-- バレットワーク(他のプロセスに影響を与えない)
TARGET_STATUS_BUFF_LOCAL_WORK = 20		-- バフ発動者ワーク(他のプロセスに影響を与えない)
TARGET_STATUS_BUFF_OWNER_LOCAL_WORK = 21-- バフ所有者ワーク(他のプロセスに影響を与えない)

-- ステータス対象(分解)
TARGTYPE_SUBJECT = 1		-- 発動者の持つステータス(ワークは状況に応じて発動者以外の情報が暗黙ロードされていることがある)
TARGTYPE_UNIT = 2			-- ユニットの持つステータス
TARGTYPE_BULLET = 3			-- バレットの持つステータス
TARGTYPE_BUFF = 4			-- バフの持つステータス(発動者)
TARGTYPE_BUFF_OWNER = 5			-- バフの持つステータス(所有者)

TARGSTAT_REAL = 8			-- リアルタイム値(ユニットならリアル値、バレットやバフならサンプル値)
TARGSTAT_WORK = 0			-- ワーク値(プロセス毎に生成されるワーク値)
TARGSTAT_WORK_LOCAL = 16	-- ローカルワーク値(Lua専用 LoadToWorkで生成して使用する 他のプロセスに影響を与えない)

-- プロセスカテゴリ
PROCESS_CATEGORY_DAMAGE = 1
PROCESS_CATEGORY_HEAL = 2
PROCESS_CATEGORY_BUFF = 3
PROCESS_CATEGORY_DEBUFF = 4
PROCESS_CATEGORY_AILMENT_REMOVE = 5
PROCESS_CATEGORY_DRAIN = 6
PROCESS_CATEGORY_RESURRECT = 7
PROCESS_CATEGORY_AILMENT = 8
PROCESS_CATEGORY_DEBUFF_ELEMENT = 9
PROCESS_CATEGORY_SKILL = 10
PROCESS_CATEGORY_PASSIVE = 11
PROCESS_CATEGORY_JUNK_BOMB = 12
PROCESS_CATEGORY_AILMENT_RESEARCH = 13
PROCESS_CATEGORY_ADD_DAMAGE = 14
PROCESS_CATEGORY_VIT_ZERO = 15
PROCESS_CATEGORY_AVOID = 16
PROCESS_CATEGORY_CHARISMA = 17
PROCESS_CATEGORY_PENETRATE_DEF = 18
PROCESS_CATEGORY_PENETRATE_MND = 19
PROCESS_CATEGORY_SULFURIC_ACID = 20
PROCESS_CATEGORY_GIVE_NAME = 21
PROCESS_CATEGORY_RE_ZERO = 22
PROCESS_CATEGORY_STEAL_STATUS = 23
PROCESS_CATEGORY_STEAL_SCT = 24
PROCESS_CATEGORY_ALCHEMY = 26
PROCESS_CATEGORY_ITEM_IN_STOCK = 27
PROCESS_CATEGORY_GUARDIAN = 28
PROCESS_CATEGORY_SNAP_BLADE = 29
PROCESS_CATEGORY_GAS = 30
PROCESS_CATEGORY_PRESENT_STOCK = 35
PROCESS_CATEGORY_NEAR_DEATH_SKILL = 36

-- プロセス所属
PROCESS_AFFILIATION_NONE = 0
PROCESS_AFFILIATION_BUFF = 2
PROCESS_AFFILIATION_AUTO_SKILL = 4
PROCESS_AFFILIATION_ARK = 5
PROCESS_AFFILIATION_WEAPON = 6
PROCESS_AFFILIATION_ARMOR = 7
PROCESS_AFFILIATION_ACCESSORY = 8
PROCESS_AFFILIATION_TERRAIN = 9
PROCESS_AFFILIATION_FORMATION = 12

PROCESS_SUB_AFFILIATION_BUFF = 64

-- プロセス/バフパラメータビヘイビア
PARAM_BEHAV_NONE = 0			-- ビヘイビアなし
PARAM_BEHAV_FLAME = 1			-- 継続時間
PARAM_BEHAV_COUNT = 2			-- 発動可能回数
PARAM_BEHAV_PROB = 3			-- 発動確率
PARAM_BEHAV_VAL = 4				-- ステータス加算値
PARAM_BEHAV_PER = 5				-- ステータス乗算値
PARAM_BEHAV_ADD = 6				-- ステータス追加値
PARAM_BEHAV_RESULT_ADD = 7		-- 効果加算値
PARAM_BEHAV_RESULT_PER = 8		-- 効果万分率
PARAM_BEHAV_RESULT_MIN = 9		-- 効果最小値
PARAM_BEHAV_RESULT_MAX = 10		-- 効果最大値
PARAM_BEHAV_COND_KIND_1 = 11	-- 条件_種別1
PARAM_BEHAV_COND_KIND_2 = 12	-- 条件_種別2
PARAM_BEHAV_COND_KIND_3 = 13	-- 条件_種別3
PARAM_BEHAV_COND_DIR = 14		-- 条件_跨ぎ方向
PARAM_BEHAV_COND_NUM_1 = 15		-- 条件_数値1
PARAM_BEHAV_COND_NUM_2 = 16		-- 条件_数値2
PARAM_BEHAV_COND_NUM_3 = 17		-- 条件_数値3
PARAM_BEHAV_EFFECT_START = 18	-- 演出開始
PARAM_BEHAV_EFFECT_END = 19		-- 演出終了
PARAM_BEHAV_PROCESS_1 = 20		-- 外部プロセス専用1
PARAM_BEHAV_PROCESS_2 = 21		-- 外部プロセス専用2
PARAM_BEHAV_PROCESS_3 = 22		-- 外部プロセス専用3
PARAM_BEHAV_PROCESS_4 = 23		-- 外部プロセス専用4
PARAM_BEHAV_PROCESS_5 = 24		-- 外部プロセス専用5
PARAM_BEHAV_SKILL_1 = 25		-- 特定スキル専用1
PARAM_BEHAV_SKILL_2 = 26		-- 特定スキル専用2
PARAM_BEHAV_SKILL_3 = 27		-- 特定スキル専用3
PARAM_BEHAV_SKILL_4 = 28		-- 特定スキル専用4
PARAM_BEHAV_SKILL_5 = 29		-- 特定スキル専用5
PARAM_BEHAV_RESULT_ADD_2 = 30	-- 効果加算値2
PARAM_BEHAV_RESULT_ADD_3 = 31	-- 効果加算値3
PARAM_BEHAV_RESULT_PER_2 = 32	-- 効果万分率2
PARAM_BEHAV_RESULT_PER_3 = 33	-- 効果万分率3
PARAM_BEHAV_VAL_2 = 34			-- ステータス加算値2
PARAM_BEHAV_VAL_3 = 35			-- ステータス加算値3
PARAM_BEHAV_PER_2 = 36			-- ステータス乗算値2
PARAM_BEHAV_PER_3 = 37			-- ステータス乗算値3
PARAM_BEHAV_ADD_2 = 38			-- ステータス追加値2
PARAM_BEHAV_ADD_3 = 39			-- ステータス追加値3

-- プロセスワークフラグのインデックス
PROC_FLAG_AILMENT_SUCCEEDED = 1		-- 状態異常の付与判定で成功したか？(状態異常付与前トリガのみ)
PROC_FLAG_AILMENT_RESISTED = 2		-- 状態異常の付与判定で無効化されたか？(状態異常付与前トリガのみ)(参照のみ)
PROC_FLAG_NO_DAMAGE = 3				-- ダメージを0にするか？(ダメージ計算後トリガのみ)

-- ProcGetProcessID() のモード
PROC_INFO_GET_MODE_CURRENT = 0		-- 現在
PROC_INFO_GET_MODE_RELATED = 1		-- 呼び出し元　バフ：バフ発生元　GenerateBullet()内プロセス：GenerateBullet()呼び出し元　ExecSubProcess()プロセス：ExecSubProcess()呼び出し元
PROC_INFO_GET_MODE_PARENT = 2		-- プロセス階層構造上の親
PROC_INFO_GET_MODE_PROCTARGET = 3	-- 「抽選前・効果発揮前・効果発揮後・バフを付ける前」の各プロセスのターゲットプロセス

-- EditElemResist() のモード
EDIT_ELEMRESIST_TYPE_NORMAL = 0
EDIT_ELEMRESIST_TYPE_IF_STRONG = 1
EDIT_ELEMRESIST_TYPE_IF_WEAK = 2
EDIT_ELEMRESIST_TYPE_TO_ZERO = 4
EDIT_ELEMRESIST_TYPE_TO_ZERO_IF_STRONG = 5
EDIT_ELEMRESIST_TYPE_TO_ZERO_IF_WEAK = 6

-- バトルの勝敗判定を保留する際の挙動
PEND_JUDGE_TYPE_OWNER = 0
PEND_JUDGE_TYPE_TARGET = 1
PEND_JUDGE_TYPE_ALL = 2

PEND_JUDGE_MODE_OVERWRITE = 0
PEND_JUDGE_MODE_FIRST = 1

-- 状態異常デフォルト寿命
AilmentLifeTimes = {}
AilmentLifeTimes[AILMENT_POISON] = 1800
AilmentLifeTimes[AILMENT_PARALYSYS] = 900
AilmentLifeTimes[AILMENT_SICK] = 1800
AilmentLifeTimes[AILMENT_BLIND] = 1800
AilmentLifeTimes[AILMENT_CURSE] = 1800
AilmentLifeTimes[AILMENT_SILENCE] = 1800
AilmentLifeTimes[AILMENT_SEAL] = 1800
AilmentLifeTimes[AILMENT_FREEZE] = 1200
AilmentLifeTimes[AILMENT_RAGE] = 1800
AilmentLifeTimes[AILMENT_CORRUPTION] = 1800
AilmentLifeTimes[AILMENT_DEADLYPOISON] = 1800
AilmentLifeTimes[AILMENT_HINDERCHANT] = 1800
AilmentLifeTimes[AILMENT_GLOOM] = 1800
AilmentLifeTimes[AILMENT_DISEASE] = 600
AilmentLifeTimes[AILMENT_BOUND] = 300

-- 盗んだアイテムのレアリティ
STOLEN_ITEM_NONE = 0
STOLEN_ITEM_RARE = 1
STOLEN_ITEM_NORMAL = 2

-- 操作リスト
ControlTypes = {
-- ダメージ系
PhysDmg = 100,		-- P-/C- 物理ダメージ 0:割合 1:攻撃ステ+1(省略可能) 2:防御ステ+1(省略可能)
MagDmg = 101,		-- P-/C- 魔法ダメージ 0:割合 1:攻撃ステ+1(省略可能) 2:防御ステ+1(省略可能)
FixDmg = 102,       -- P-/C- 固定ダメージ 0:min 1:max
PctDmg = 103,		-- P-/C- 割合ダメージ 0:現在HP割合 1:最大HP割合
SuddenDeath = 104,  -- P-/C- 即死	0:ダメージ表示(1:する 0:しない)
GuardBreak = 105,   -- P-/C- ガードブレイク	対象がガード時ブレイク

-- 追々ReflectDmg = 106,	-- P-/CP	被ダメ反射 ダメの一部を反射	0:反射率MIN 1:反射率MAX
PhysMPDmg = 107,	-- P-/C- 物理MP攻撃 物理攻撃の計算式を使用し、対象のMPを減少させる	0:ダメージ割合
MagMPDmg = 108,		-- P-/C- 魔法MP攻撃 魔法攻撃の計算式を使用し、対象のMPを減少させる	0:ダメージ割合
FixMPDmg = 109,		-- P-/C- 固定MPダメージ 対象のMPを固定値減少させる	0:ダメージMIN 1:ダメージMAX
PctMPDmg = 110,		-- P-/C- 割合MPダメージ 対象のMPを指定割合減少させる	0:現在MP割合 1:最大MP割合
SimpleDmg = 111,	-- P-/CP シンプルダメージ    指定したシンプルダメージを与える	0:ダメージ 1:このダメージによって死亡するか(0なら死亡しない)
MpDec = 112,		-- PB/CP FALSE MP消費  MPを指定した値減少させる	0:即値 1:最大MP割合

VitZeroDmg = 120,	-- PB/CP VIT強制0
VitIncDec = 121,	-- P-C- FALSE 固定VIT増減 0:増減値 1:減少させる場合、この効果によりブレイクするか(0:する 1:しない)

SimplePctDmg = 180,	-- 180 P-/CP TRUE  シンプル割合ダメージ	 0:現在HP割合 1:最大HP割合

-- 回復系
Recover = 200,		-- P-/CP HP回復 0:回復MIN
PctRecover = 201,	-- P-/CP HP割合回復  最大HPの(万分率)％に(値)を加算した分のHPを回復する	0:値 1:万分率
EditSct = 202,		-- P-/CP SCT増減	0:増減値 1:万分率 2:特技INDEX(省略可能)
EditEther = 203,	-- P-/CP 超必ゲージ増減 0:増減値  1:万分率
Resurrect = 204,    -- P-/C- 蘇生 MaxHPのn% で回復 なし  0:回復量  1:フェード開始delay 2:フェード完了delay
Reraise = 205,		-- P-/CP リレイズ 死亡時に確率でHPがn%で蘇生 0:回復量 1:有効回数 2:フェード開始delay 3:フェード完了delay
Endure = 206,		-- P-/CP 根性 指定以上のHPが残っている場合、致死ダメージを受けても確率で指定回数HP1で耐え、その後HPをn%回復する効果を付与 0:残りHP 1:回復量 2:有効回数
Drain = 207,		-- PB/CP HP吸収	0:吸収率
Regene = 208,       -- P-/C- リジェネ 指定の回復間隔で、HPを継続的に回復	0:回復MIN 1:回復間隔
-- 追々RecoverDmg = 209,		-- P-/CP	被ダメージ回復 被ダメージの一部を回復する

SctRecovVal = 210,		-- PB/CP SCT自動回復量増減	0:値 1:倍率 2:特技INDEX(省略可能)
SctRecovInterval = 211,	-- PB/CP SCT自動回復間隔増減	0:倍率 1:特技INDEX(省略可能)
MpRecover = 212,		-- P-/CP MP回復	0:値
HpRecovPower = 213,		-- PB/CP HP回復量増減 HPの回復量を増減する	0:倍率
MpRecovPower = 214,		-- PB/CP MP回復量増減 MPの回復量を増減する	0:倍率
EtherRecovPower = 215,	-- P-/CP 超必殺ゲージ増加量増減 超必殺ゲージが増加する際、増加量を増減する	0:値 1:倍率
SummonRecovPower = 216,	-- P-/-P 召喚ゲージ増加量増減  召喚ゲージが増加する際、増加量を増減する(パーティ内の誰に掛かっていても効果を発揮する)	0:倍率
DisableHeal = 217,		-- P-/CP HP回復操作不可	HP回復操作不可（病気と同等の効果を付与する）

--  ステータス系
StrEdit = 300,		-- PB/CP STR増減	0:値 1:倍率 2:倍率計算後加算値 3:オプション（1:即時反映）
DefEdit = 301,		-- PB/CP DEF増減	0:値 1:倍率 2:倍率計算後加算値 3:オプション（1:即時反映）
IntEdit = 302,		-- PB/CP INT増減	0:値 1:倍率 2:倍率計算後加算値 3:オプション（1:即時反映）
MndEdit = 303,		-- PB/CP MND増減	0:値 1:倍率 2:倍率計算後加算値 3:オプション（1:即時反映）
CrtEdit = 304,		-- P-/CP CRT増減	0:値 3:オプション（1:即時反映）
MaxHpEdit = 305,	-- P-/C- HP上限増減 増加時現在HPも同量増加、効果切れ時は最大HPのみが減少 0:値 1:倍率
StatusResist = 306, -- P-/CP 異常耐性増減 指定の状態異常耐性を増減する	0:タイプ 1:段階値(-2～+2)
ElemResist = 307,   -- P-/CP	属性耐性増減 指定の属性耐性を増減する	0:タイプ 1:値
Killer = 308,       -- PB/CP	キラー 指定タイプへのキラーを持つ	0:タイプ

-- 追々 追々  309 /CP	防御貫通 敵の総合防御力を一部無視する

SpdEdit = 310,		-- P-/CP	移動速度増減 移動速度を増減する	0:値 1:倍率
SpdFix = 311,       -- P-/-P	移動速度指定 移動速度を指定値にする 0:値
ShorteningCast = 312,	-- P-/-P 詠唱速度軽減 詠唱速度が上がる	0:割合

-- 追々	-	313	/C-	ステータス変換 特定のステータスを特定のステータスに加算、又は変換する
VitDmgPower = 314,	-- P-/CP VITダメージ増減 与えるVITダメージが増減する
-- 追々	-	315	/CP	VIT被ダメージ軽減 VIT被ダメージを軽減する
-- 追々	-	316	/-P	CRT耐性増減 CRT耐性を増減する

SuperArmor = 317,		-- P-/CP スーパーアーマー    特定の値にする（基本のSAと被ったら大きいほう）	0:SA値
MaxMpEdit = 318,		-- P-/CP MP上限増減 MP上限値を増減　増加時現在MPも同量増加、効果切れ時は最大MPのみが減少 0:値 1:倍率
EquipParam = 319,		-- P-/-P	装備パラメータ増減	装備のパラメータを増減する	0:装備タイプ 1:対象ステータス 2:倍率
Targetability = 320,	-- P-/CP 狙われやすさ増減 狙われやすさを増減する	0:値
AddBuffTime = 321,		-- P-/CP バフ/デバフ時間延長	対象に既に掛かっているバフ/デバフの時間を延長する(バフIDを指定することで特定のバフ/デバフだけを対象にもできる)	0:バフ/デバフ/ALL 1:延長時間(フレーム) 2:バフID(省略可能)
CastSuperArmor = 322,	-- P-/CP 詠唱スーパーアーマー    特定の値にする（基本のSAと被ったら大きいほう）	0:SA値
MaxSpEdit = 323,		-- P-/-P FALSE 特技ストック最大値増減	指定特技（または全特技）のストック最大値を増減	0:増減値 1:特技INDEX(0:全ての特技)
CastMinClamp = 324,		-- P-/CP 詠唱速度下限 詠唱速度の最大短縮量を指定	0:下限値(0:-10000と同じ -1000:90%まで -5000:50%まで -10000:0%(無詠唱)まで） 1:トランジェント操作を行うか（0:永続/1:トランジェント(スキル詠唱前トリガのみ)）
CastEdit = 325,			-- P-/CP 詠唱速度補正 詠唱速度の短縮量を補正 0:加算 1:倍率 2:追加 3:トランジェント操作を行うか（0:永続/1:トランジェント(スキル詠唱前トリガのみ)）
FixSpStock = 326,		-- P-/CP FALSE 特技ストック数固定	指定特技（または全特技）のストック最大値を指定数に固定（MaxSpEditよりも上位）	0:ストック最大値 1:特技INDEX(0:全ての特技)
MaxVitEdit = 327,		-- -B/-P FALSE VIT上限増減 VIT上限値を増減　0:値 1:倍率 2:追加 3:現在VITも増加するか（0:しない 1:する）
FatalBlowEdit = 329,	-- P-/CP 致命の一撃発生率増減 0:値 1:倍率 2:倍率計算後加算値

--  異常系
AddStat = 400,			-- P-/CP 状態異常付与 状態異常を掛ける 0:種類 1:時間（フレーム数）
RemoveStat = 401,		-- P-/CP 状態異常回復	0:種類
BadStatusTime = 402,	-- P-/-P 状態異常回復速度増減 指定の状態異常の回復速度が増減する
-- 追々	-	403	○	○	挑発 対象を挑発状態にする
BreakTime = 406,		-- P-/-P 気絶/ブレイク時間増減 気絶やブレイクになった後、解けるまでの時間を短縮する	0:倍率
AddBadStatusTime = 407,	-- P-/CP 状態異常時間延長    対象に既に掛かっている状態異常の時間を延長する	0:タイプ/ALL 1:延長時間(フレーム)

						-- 追々	-	500	○	○	指定属性ダメージ強化 指定属性のスキルを使用した時のダメージが上がる
						-- 追々	-	501	○	○	状態異常与ダメージ強化 指定の状態異常にかかっている敵に対するダメージが増減する

--  ダメージ増減
ReductionPhysDmg = 502,	-- P-/CP 物理被ダメージ軽減 物理被ダメージを軽減する
ReductionMagDmg = 503,	-- P-/CP 魔法被ダメージ軽減 魔法被ダメージを軽減する
DmgPower = 504,			-- P-/CP 被ダメ軽減	0:軽減率
InvalidDmg = 505,		-- PB/CP ダメージ0 被ダメージが0となる
HitRate = 506,			-- PB/CP	命中率増減   バレットの命中率を増減する	0:倍率
OverrideElement = 507,	-- PB/CP 属性指定	ダメージを指定した属性に変化させる	0:属性
KBBarrier = 508,        -- P-/C- バリア この効果が掛かっている間の累計ダメージが指定値を超えるまで、ダメージとノックバックを無効化する 0:シンプルダメージが貫通するか（0:貫通しない/1:貫通する）
KillerPower = 509,      -- PB/C- キラー倍率増減 キラー発生時に掛けられるダメージ倍率を増減	0:値
InvalidForceMove = 510,	-- PB/CP 強制移動フラグ無視
HealLimitOff = 511,		-- PB/CP FALSE 回復限界突破	バレットの回復上限を指定値に変更	0:上限値
HealLimitUp = 512,		-- PB/CP FALSE 回復上限アップ	バレットの回復上限を指定値に変更	0:増減値 1:増減倍率 2:増減値(倍率計算後)
DmgLimitUpNoBullet = 513,-- PB/CP FALSE バレットなしダメージ上限増減 バレットがない時のダメージ上限を指定値に変更。バレットがある場合は無効 0:増減値 1:増減倍率 2:増減値(倍率計算後)
HealLimitUpNoBullet = 515,-- PB/CP FALSE バレットなし回復上限増減 バレットがない時の回復上限を指定値に変更。バレットがある場合は無効 0:増減値 1:増減倍率 2:増減値(倍率計算後)

--  オートガード系
AutoGuard = 600,	-- P-/-P 自動ガード物理攻撃を自動ガード	0:確率 1:軽減率
GuardRate = 601,	-- P-/-P ガード確率増減	自動ガードのガード率を増減する	0:増減値 1:増減倍率 2:増減値(倍率計算後)
GuardValue = 602,	-- P-/-P ガード性能増減	自動ガード発生時のダメージ軽減率を増減する	0:増減値 1:増減倍率 2:増減値(倍率計算後)
MagicGuardable = 603,	-- P-/-P 魔法ガード可	自動ガードで魔法ガードが可能になる
GuardEndure = 604,      -- P-CP ガード耐久値増減	自動ガードの耐久値が増減する	0:増減値 1:増減倍率 2:増減値(倍率計算後)

--  カウンター系
Counter = 700,          -- P-/-P カウンター 物理攻撃を受けた際にスパーアーマー状態で反撃する	0:確率 1:威力 2:オプション（1:空中発動/2:適正位置ワープ） 3:SA破壊値 4:詠唱SA破壊値
CounterRate = 701,      -- P-/-P カウンター確率増減	カウンター発生率を増減する	0:確率
CounterValue = 702,		-- P-/-P カウンター性能増減	カウンター発生時の威力を増減	0:威力
MagicCounterable = 703,	-- P-/-P 魔法カウンター【カウンターとセット】魔法カウンターが可能になる

--  特殊系
MagicCritical = 800,	-- P-/-P 魔法クリティカル CRT率で魔法クリティカルが発生するようになる
AdditionalDmg = 801,    -- -B/CP 追加ダメージ スキル使用時、追加ダメージが発生する	0:属性 1:回数 2:倍率min 3:倍率max
ReductionMpCost = 802,  -- P-/-P 消費MP増減	0:魔法タイプ 1:値 2:倍率
-- 803	追々	-	○		装備破壊    装備破壊を発生させる  破壊タイプ			
RemoveBuff = 804,		-- P-/C- バフ消し    指定したカテゴリのバフを、残り時間に関わらず消去する(ALLも選択可能にする)	カテゴリ			
Invincible = 805,		-- P-/CP 無敵化 受けたバレットの効果を消失させる(当たらなかった扱いとする)				
ScaleCollision = 806,	-- PB/CP コリジョンスケール バレットのコリジョンの大きさに倍率をかける	0:倍率
Steal = 807,            -- PB/CP 盗む バレットが当たった敵から、ドロップ抽選と同じ抽選を行ってアイテムを取得する
InvertDmgHeal = 809,    -- PB/-P 攻撃と回復の転換 バレットに乗っている与ダメージは回復値に、回復値はダメージに、数値を維持したまま効果を変更する
ProcProbability = 810,	-- 810 -B/-P FALSE プロセス確率変更    プロセスの発生率を操作する	0:確率増減値 1:確率増減率 2:確率増減値(率計算後)
ProcEditParam = 811,	-- 811 -B/-P FALSE プロセスパラメータ変更 プロセスのパラメータを操作する	0:パラメータタイプ 1:効果増減値 2:効果増減倍率 3:効果増減値(率計算後)
ProcReplaceParam = 812,	-- 812 -B/-P FALSE プロセスパラメータ指定 プロセスのパラメータを指定する(指定した値になる)	0:パラメータタイプ 1:パラメータ値
Uncontrol = 813,		-- 813 P-/CP FALSE 指定操作不可  指定した操作を不可能にする（沈黙/呪いと同等の効果を付与する）	0:特技/魔法/両方
AddCharType = 814,		-- 814 P-/CP FALSE キャラタイプ追加    指定したキャラタイプが追加される	0:キャラタイプ
ChgBulletTarg = 815,	-- 815 PB/CP FALSE ターゲット変更 バレットのヒット対象とターゲットを変更する(ほぼバレット生成前トリガー専用)	0:ヒット対象(省略で変更なし)	1:UID(省略で変更なし)
ChgBulletDelOnHit = 816,-- 816 PB/CP FALSE ヒット時消去フラグ変更 バレットのヒット時消去フラグを変更する	0:TRUE/FALSE
ZelControl = 817,		-- 817 P-/CP FALSE ゼル増減	バトル中に入手したゼルを増減させる(上限は操作前に実際にバトルで入手したゼルの数)	0:値 1:倍率
MpCostElem = 818,		-- 818 P-/-P FALSE 属性別消費MP増減   特定の属性の魔法の消費MPが増減する	0:属性/ALL 1:値 2:倍率
MpCostID = 819,			-- 819 P-/-P FALSE 特定魔法消費MP増減   特定のスキルIDの魔法の消費MPが増減する	0:スキルID 1:値 2:倍率
UnitDrift = 820,		-- 820 P-/CP FALSE 常時指定方向移動	  指定した方向に、指定した速度で常に移動し続ける	0:方向 1:速度(万分率)
PreCast = 821,			-- 821 P-/CP FALSE 魔法陣展開   指定した絶対LV以下の魔法が使用可能になる	0:絶対LV
PreCastSpeed = 822,		-- 822 P-/CP FALSE 魔法陣展開速度増減   魔法陣展開の展開速度を増減する	0:中級/上級/ALL 1:値(フレーム) 2:倍率
ChgSkillTarg = 823,		-- 823 P-/CP FALSE スキルターゲット変更 スキルのターゲットタイプとターゲットを変更する(ほぼスキル発動前トリガー専用)	0:ヒット対象(省略で変更なし)	1:UID(省略で変更なし)
DmgLimitOff = 824,		-- 824 PB/C- ダメージ限界突破	バレットのダメージ上限を指定値に変更	0:上限値
MultiBullet = 825,		-- 825 PB/C- FALSE 多段魔法	バレットヒット時に二刀流のように複数回バレットプロセスを呼び出す	0:ダメージ倍率
DmgLimitUp = 826,		-- 826 PB/CP FALSE ダメージ上限アップ	バレットのダメージ上限を指定値に変更	0:増減値 1:増減倍率 2:増減値(倍率計算後)
DisableSkill = 827,		-- 827 P-/CP FALSE 特定スキル使用不可 指定のスキルのみを使用不可にする	0:指定方法（0:スキルID/1:スキルタイプ＋インデックス/2:スキルスロット） 1:値1 2:値2 3:表示(0:グレーアウト/1:UI)
ClampHP = 828,			-- 828 PB/CP FALSE HP上限下限ロック HPが増加・減少する際のクリップ値を指定する 0:即値 1:最大HP割合 2:ロック方向(1:減少 2:増加 3:両方)
SpecialCritical = 829,	-- 829 P-/-P 超必殺クリティカル CRT率で超必殺技クリティカルが発生するようになる
FixTarget = 831,		-- 831 P-/-P FALSE ターゲット固定 指定のターゲット以外を攻撃対象にできなくする 0:対象識別子（0=発動者）
ActivateSkill = 832,	-- 832 P-/CP FALSE 特技発動可	指定の特技がコスト不足でも発動可能にする	0:特技INDEX(0=全て)
BreakSetting = 833,		-- 833 -B/CP FALSE ブレイク設定	これが付与されているボスのブレイク演出の内容を設定する	0:ブレイク種類 1:ブレイクテキストID 2:テキストカラー 3:エフェクトカラー1 4:エフェクトカラー2 5:ブレイク背景エフェクトID 6:ブレイク背景カラー
SplitHp = 834,			-- 834 P-/CP FALSE HP分割 対象のHPを分割し、HPバーの表示を調整する 0:表示上の最大値（0の時分割解除）
ItemDrop = 835,			-- 835 PB/CP FALSE アイテム入手 サーバから送られたアイテムドロップテーブルのうち、指定のものをドロップ 0:アイテムテーブル内のインデックス（1～）
CancelBullet = 836,		-- 836 PB/C- FALSE バレット無効	バレット処理を中断する（「バレットを当てた時・当たった時」トリガでの使用前提）
SkillElement = 837,		-- 837 -B/-P FALSE スキル属性変更	スキルの属性を変更する（スキルのオーナーのみに作用）	0:指定方法（0:スキルID/1:スキルタイプ＋インデックス/2:スキルスロット） 1:値1 2:値2 3:属性
ForceOpeFail = 838,		-- 838 PB/CP FALSE   特定操作失敗    ターゲットユニットの指定の操作を失敗させる  [1] 操作ID
ActivateSpecial = 839,	-- 839 -B/-P FALSE 超必殺発動可	指定の超必殺がコスト不足でも発動可能にする	0:超必殺INDEX(0=全て)

--  リザルト系
ExpUp = 900,	-- P-/-P 経験値増加	リザルトで貰える経験値が増える(同一効果が被った場合は、大きい方になる)	0:倍率
ApUp = 901,		-- P-/-P AP増加		リザルトで貰えるAPが増える(同一効果が被った場合は、大きい方になる)		0:倍率
ZelUp = 902,	-- P-/-P お金増加	リザルトで貰えるお金が増える(同一効果が被った場合は、大きい方になる)	0:倍率
DropUp = 903,	-- P-/-P ドロップ率増加 アイテムのドロップ率が増える	0:倍率?

--  装備時系
EquipPropriety = 1000,	-- P-/-P 特定装備種装備可否変更 特定の装備種の装備可否を変更する	0:装備種 1:可否
}

-- トリガーリスト
TriggerTypes = {
	Undefined = 0,
	Status = 1,					-- ステータス計算時
	WaveStart = 10,				-- Wave開始時
	WaveEnd = 11,				-- Wave終了時
	WaveEvery = 12,				-- Wave中毎フレーム
	BeforeStandby = 16,			-- スキル詠唱前
	FinishTimeline = 17,		-- スキルタイムライン終了時
	BeforeSkill = 18,			-- スキル発動前
	BeforeCreateBullet = 19,	-- バレット生成前
	BulletProcess = 20,			-- バレットプロセス
	BulletHit = 21,				-- バレットを当てた時
	BulletWasHit = 22,			-- バレットを受けた時
	OnCalcAttack = 23,			-- ダメージ計算時
	OnCalcDamage = 24,			-- 被ダメージ計算時
	AfterAttack = 25,			-- バレットを当てた後
	AfterDamage = 26,			-- バレットを受けた後
	AfterCalcAttack = 27,		-- ダメージ計算後
	AfterCalcDamage = 28,		-- 被ダメージ計算後
	PreAfterAttack = 29,		-- バレットを当てた後の前
	PreAfterDamage = 30,		-- バレットを受けた後の前
	SplitHpIs0 = 35,			-- 分割HP0時
	GivingLethalDamage = 36,	-- 致死ダメージを与えた時
	ReceiveLethalDamage = 37,	-- 致死ダメージを受けた時
	AfterSimpleAttack = 38,		-- シンプルダメージ計算時
	AfterSimpleDamage = 39,		-- シンプル被ダメージ計算時
	ChangeHP = 40,				-- HP増減時
	ChangeSCT = 41,				-- SCT増減時
	ChangeMP = 42,				-- MP増減時
	ChangeStr = 43,				-- STR増減時
	ChangeDef = 44,				-- DEF増減時
	ChangeInt = 45,				-- INT増減時
	ChangeMnd = 46,				-- MND増減時
	AddedStatus = 50,			-- 状態異常になった時、治った時
	ChangeCharType = 51,		-- キャラタイプが変わった時
	EnterBreak = 52,			-- ブレイク状態になった時、治った時
	ChangeCastLv = 53,			-- 詠唱レベルが変化した時
	ChangeBuff = 54,			-- （バフマスタを持つ）バフが付いた時、除去された時
	ChangeEther = 55,			-- 超必殺ゲージ増減時
	ChangeUnitStatus = 59,		-- ユニットステート変更時
	OnAddedBuff = 60,			-- 当該バフがかかった時
	OnOfcBuffControl = 61,		-- BuffControl()でバフを付与する直前（プロセス系トリガ（操作810,811,812）のみを想定）
	OnDefBuffControl = 62,		-- BuffControl()でバフを付与される直前（プロセス系トリガ（操作810,811,812）のみを想定）
	ChangeSurvivors = 65,		-- 生存人数変動時
	ChangeTerrainEffect = 66,	-- 地形効果が変わった時
	ChangeScore = 67,			-- スコア変化時
	ChangeBossBreak = 68,		-- ボスブレイク状態変化時
	ChangeSurvivors2 = 69,		-- 生存人数変動時2（ギルドバトルでラウンドを跨いだ時もキック）
	ByInterval = 70,			-- 条件に応じた間隔（バフのように継続的に存在するプロセスが前提）
	OnOfcProcLot = 72,			-- 指定タイプのプロセスの確率抽選時（発動者）
	BeforeOfcProcInvoke = 73,	-- 指定タイプのプロセスの効果発揮前（発動者）
	AfterOfcProcInvoke = 74,	-- 指定タイプのプロセスの効果発揮後（発動者）
	OnDefProcLot = 75,			-- 指定タイプのプロセスの確率抽選時（ターゲット）
	BeforeDefProcInvoke = 76,	-- 指定タイプのプロセスの効果発揮前（ターゲット）
	AfterDefProcInvoke = 77,	-- 指定タイプのプロセスの効果発揮後（ターゲット）
	BeforeOfsAddStatus = 78,	-- 状態異常付与前（発動者）
	BeforeDefAddStatus = 79,	-- 状態異常付与前（ターゲット）
	AtGetZel = 80,				-- ゼル入手時
	AtGetItem = 81,				-- 宝箱入手時
	ProcessEvent = 92,			-- プロセス内発火
	ProcessEvent_param = 93,	-- プロセス内発火(パラメータ参照)
	ChangeBg = 94,				-- バトル背景変化時
	TimelineCond = 95,			-- タイムラインでの条件評価
	Respawn = 96,				-- アリーナ：リスポーンした時（本人）
	RespawnAtk = 97,			-- アリーナ：リスポーンされた時（対象を倒したアタッカー）
	CollisionInOut = 98,		-- 領域の出入りが変化した時
}

-- マルチでローカル端末で発火しない可能性があるトリガ
NonLocalTriggers = {
	[TriggerTypes.BulletProcess] = true,			-- バレットプロセス
	[TriggerTypes.BulletHit] = true,				-- バレットを当てた時
	[TriggerTypes.BulletWasHit] = true,			-- バレットを受けた時
	[TriggerTypes.OnCalcAttack] = true,			-- ダメージ計算時
	[TriggerTypes.OnCalcDamage] = true,			-- 被ダメージ計算時
	[TriggerTypes.AfterAttack] = true,			-- バレットを当てた後
	[TriggerTypes.AfterDamage] = true,			-- バレットを受けた後
	[TriggerTypes.AfterCalcAttack] = true,		-- ダメージ計算後
	[TriggerTypes.AfterCalcDamage] = true,		-- 被ダメージ計算後
	[TriggerTypes.PreAfterAttack] = true,		-- バレットを当てた後の前
	[TriggerTypes.PreAfterDamage] = true,		-- バレットを受けた後の前
	[TriggerTypes.SplitHpIs0] = true,			-- 分割HP0時
	[TriggerTypes.GivingLethalDamage] = true,	-- 致死ダメージを与えた時
	[TriggerTypes.ReceiveLethalDamage] = true,	-- 致死ダメージを受けた時
	[TriggerTypes.AfterSimpleAttack] = true,		-- シンプルダメージ計算時
	[TriggerTypes.AfterSimpleDamage] = true,		-- シンプル被ダメージ計算時
	[TriggerTypes.OnOfcBuffControl] = true,		-- BuffControl()でバフを付与する直前（プロセス系トリガ（操作810,811,812）のみを想定）
	[TriggerTypes.OnDefBuffControl] = true,		-- BuffControl()でバフを付与される直前（プロセス系トリガ（操作810,811,812）のみを想定）
	[TriggerTypes.OnOfcProcLot] = true,			-- 指定タイプのプロセスの確率抽選時（発動者）
	[TriggerTypes.BeforeOfcProcInvoke] = true,	-- 指定タイプのプロセスの効果発揮前（発動者）
	[TriggerTypes.AfterOfcProcInvoke] = true,	-- 指定タイプのプロセスの効果発揮後（発動者）
	[TriggerTypes.OnDefProcLot] = true,			-- 指定タイプのプロセスの確率抽選時（ターゲット）
	[TriggerTypes.BeforeDefProcInvoke] = true,	-- 指定タイプのプロセスの効果発揮前（ターゲット）
	[TriggerTypes.AfterDefProcInvoke] = true,	-- 指定タイプのプロセスの効果発揮後（ターゲット）
	[TriggerTypes.BeforeOfsAddStatus] = true,	-- 状態異常付与前（発動者）
	[TriggerTypes.BeforeDefAddStatus] = true,	-- 状態異常付与前（ターゲット）
	[TriggerTypes.ProcessEvent] = true,			-- プロセス内発火
	[TriggerTypes.ProcessEvent_param] = true,	-- プロセス内発火(パラメータ参照)
}

-- procTriggerはグローバル変数だが、念のため定数化
myTrigger = procTrigger

-- GetUnitTriggersの戻り値
TRIGGERS_INFO_PREV_STATUS = 'PrevUnitStatus'
TRIGGERS_INFO_NEW_STATUS = 'NewUnitStatus'

-- プロセス内発火トリガ
PROC_TRIGGER_DEVIL_BREAKER_1 = 1
PROC_TRIGGER_DEVIL_BREAKER_2 = 2
PROC_TRIGGER_DEVIL_BREAKER_3 = 3
PROC_TRIGGER_DEVIL_BREAKER_4 = 4
PROC_TRIGGER_RESURRECT_CALLBACK = 10
PROC_TRIGGER_BREAK_CALLBACK = 11
PROC_TRIGGER_CHARA_COUNT_CHANGE = 20
PROC_TRIGGER_SNAP_BLADE_REVIVAL = 30
PROC_TRIGGER_DETERIORATE_RECOVER = 40
PROC_TRIGGER_HP_BREAK = 50
PROC_TRIGGER_CHARGED = 60
PROC_TRIGGER_GENERAL = 70
PROC_TRIGGER_COLLISION_CREATE_BEFORE = 80
PROC_TRIGGER_COLLISION_CREATE_AFTER = 81
PROC_TRIGGER_COLLISION_REMOVE_BEFORE = 82
PROC_TRIGGER_COLLISION_REMOVE_AFTER = 83
PROC_TRIGGER_LACERATION_ATK = 90
PROC_TRIGGER_LACERATION_DEF = 91
PROC_TRIGGER_CHANGE_SUPPORT_PASSIVE = 100

-- RaiseProcTriggerのオプション
RAISE_TRIGGER_OPTION_VIA_SERVER = 1
RAISE_TRIGGER_OPTION_NOT_REMOTE = 2
RAISE_TRIGGER_OPTION_FORCE_EXECUTE = 4

-- クライアントキャッシュキー
CACHE_KEY_PARAM = 1101
CACHE_KEY_COND_PARAM = {101, 102, 103, 104, 105}
CACHE_KEY_PROC_PARAM = {201, 202, 203, 204, 205, 206, 207, 208, 209, 210}
CACHE_KEY_COND_FUNC_NAME = 1400
CACHE_KEY_BLT_SKILL_TYPE = {1300, 100}
CACHE_KEY_BLT_SKILL_ROLE = {1300, BULLET_PROPERTY_SKILL_ROLE}
CACHE_KEY_BLT_SKILL_ELEMENT = {1300, 110}
CACHE_KEY_BLT_TARGET_PARTY_SIDE = {1300, BULLET_PROPERTY_TARGET_PARTY_SIDE}

-- 味カテゴリ
CHARA_TASTE_ALL = -1
CHARA_TASTE_DELICIOUS = 0
CHARA_TASTE_IFFY = 1
CHARA_TASTE_TERRIBLE = 2
CHARA_TASTE_DUMMY = 3

-- 味カテゴリ定義
CharaTaste = {}
CharaTaste[CHARA_TYPE_DUMMY] = CHARA_TASTE_DUMMY
CharaTaste[CHARA_TYPE_SOLDIER] = CHARA_TASTE_TERRIBLE
CharaTaste[CHARA_TYPE_SNIPER] = CHARA_TASTE_TERRIBLE
CharaTaste[CHARA_TYPE_KNIGHT] = CHARA_TASTE_TERRIBLE
CharaTaste[CHARA_TYPE_SORCERER] = CHARA_TASTE_TERRIBLE
CharaTaste[CHARA_TYPE_BEAST] = CHARA_TASTE_DELICIOUS
CharaTaste[CHARA_TYPE_PLANT] = CHARA_TASTE_IFFY
CharaTaste[CHARA_TYPE_INSECT] = CHARA_TASTE_IFFY
CharaTaste[CHARA_TYPE_BIRD] = CHARA_TASTE_DELICIOUS
CharaTaste[CHARA_TYPE_MAGICAL] = CHARA_TASTE_TERRIBLE
CharaTaste[CHARA_TYPE_UNDEAD] = CHARA_TASTE_TERRIBLE
CharaTaste[CHARA_TYPE_STONE] = CHARA_TASTE_TERRIBLE
CharaTaste[CHARA_TYPE_MACHINE] = CHARA_TASTE_TERRIBLE
CharaTaste[CHARA_TYPE_SPIRIT] = CHARA_TASTE_TERRIBLE
CharaTaste[CHARA_TYPE_DRAGON] = CHARA_TASTE_IFFY
CharaTaste[CHARA_TYPE_GOD] = CHARA_TASTE_TERRIBLE
CharaTaste[CHARA_TYPE_FISH] = CHARA_TASTE_DELICIOUS

-- TODO：エグいのでマスタからビヘイビアを渡してもらうようにする
BuffParamBehavior = {
[BuffIds.AutoSkillControl] = {},
[BuffIds.AutoSkillControl2] = {},
[BuffIds.P_MpDecDmgPerFlag1] = {},
[BuffIds.P_MpDecDmgPerFlag2] = {},
[BuffIds.P_MpDecDmgPerFlag3] = {},
[BuffIds.P_MpDecDmgPerJudge1] = {},
[BuffIds.P_MpDecDmgPerJudge2] = {},
[BuffIds.P_MpDecDmgPerJudge3] = {},
[BuffIds.P_MpDecDmgPer1] = {},
[BuffIds.P_MpDecDmgPer2] = {},
[BuffIds.P_MpDecDmgPer3] = {},
[BuffIds.NearAttackAutoCounter] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_DIR, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_PROCESS_1},
[BuffIds.NearAttackAutoCounterFire] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_DIR, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_PROCESS_1},
[BuffIds.NearAttackAutoCounterIce] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_DIR, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_PROCESS_1},
[BuffIds.NearAttackAutoCounterTree] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_DIR, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_PROCESS_1},
[BuffIds.NearAttackAutoCounterThunder] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_DIR, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_PROCESS_1},
[BuffIds.NearAttackAutoCounterLight] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_DIR, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_PROCESS_1},
[BuffIds.NearAttackAutoCounterDarkness] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_DIR, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_PROCESS_1},
[BuffIds.Regene] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.YggRegene] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.E_Regene] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_RatioRegene] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_Regene] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.StyleGreen] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Regene2] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.MeatDinner] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[BuffIds.HpRecoverFuture] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.DevilMode] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[BuffIds.Gen_SctRecover] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_IntervalSctRecover] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_ADD},
[BuffIds.Reraise] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_COUNT, PARAM_BEHAV_EFFECT_START, PARAM_BEHAV_EFFECT_END},
[BuffIds.Endure] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT},
[BuffIds.NextPhysicalSkillEndure] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COUNT},
[BuffIds.NormalDrain] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextSkillDrain] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_PROB, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[BuffIds.P_TargetSkillPUIDDrain] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PROB, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[BuffIds.SctRcvVal] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.E_SctRcvVal] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_SctRcvVal] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SctRcvValSkill1] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SctRcvValSkill2] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SctRcvValSkill3] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.ModeCleanUp] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX, PARAM_BEHAV_RESULT_PER},
[BuffIds.MpRegene] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_MpRegene] = {},
[BuffIds.P_TargetSkillConvMP] = {},
[BuffIds.E_MpRegene] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.AfterTimeMpRecover] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_TargetSkillPUIDHealPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_PER},
[BuffIds.HealPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.EtherRcv] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.StrEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.FireEquipStatus] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.E_StrEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.WP_StrEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_StatusEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_StrEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.HumanStrEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.OtherStrEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.E_StatusEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.StyleRed] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_Dragonoid] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_DIR, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_COND_NUM_3, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.GiveName] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_EFFECT_START},
[BuffIds.AllStatusEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_EFFECT_START},
[BuffIds.P_TargetStatusEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.WP_StatusEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.PD_StrEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DefEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.E_DefEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_DefEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.FA_DefEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.WP_DefEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.PD_DefEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.IntEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.IntUpMndDown] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.E_IntEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Zekus_Attack] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_IntEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.WP_IntEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.MndEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.E_MndEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Zekus_Defense] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_MndEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.WP_MndEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.CrtEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.E_CrtEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.P_ResistCrt] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PROB},
[BuffIds.MaxHpEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Demonization] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_MaxHpEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.WP_MaxHpEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.E_MaxHpEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.PoisonResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.ParalysysResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.SickResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.DarknessResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.CurseResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.SlienceResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.YggAilmentResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.ElementResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.FireResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.IceResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.TreeResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.ThunderResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.LightResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.DarknessResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_PenetrateElemResistPUID] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.KillerResist[CHARA_TYPE_SOLDIER]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_SNIPER]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_KNIGHT]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_SORCERER]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_BEAST]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_PLANT]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_INSECT]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_BIRD]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_MAGICAL]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_UNDEAD]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_STONE]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_MACHINE]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_SPIRIT]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_DRAGON]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_GOD]] = {PARAM_BEHAV_FLAME},
[BuffIds.KillerResist[CHARA_TYPE_FISH]] = {PARAM_BEHAV_FLAME},
[BuffIds.SpdEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.OverLoad] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SpdEdit2] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_SpdEdit] = {},
[BuffIds.HungryAngry] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_PER_2},
[BuffIds.SuperSonic] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.ShorteningCast] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PER},
[BuffIds.StunEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.BreakEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.ResistStun] = {PARAM_BEHAV_FLAME},
[BuffIds.MeredyCharge] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferBreakEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferStunEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SuperArmor] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.P_SuperArmor] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.P_SuperArmorPUID] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_VAL},
[BuffIds.SuperArmor_SkillType[SKILL_PHYSIC]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.SuperArmor_SkillType[SKILL_MAGIC]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.SuperArmor_SkillType[SKILL_SKILL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.SuperArmor_SkillType[SKILL_SPECIAL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.SuperArmor_SkillType[SKILL_ATTACK]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.MaxMpEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.WP_MaxMpEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.GoldenPrestige] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.HateUp] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.Gen_Voluble] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER},
[BuffIds.HateEffect] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.HateDown] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.P_CsstSuperArmorPUID] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_VAL},
[BuffIds.Trance] = {PARAM_BEHAV_FLAME},
[BuffIds.P_MaxVitEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.WP_MaxVitEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_CntBreakTime] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.PhysicalShield] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.StyleBlue] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.Extinction] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.ChristmasCarol] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferSkillDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferSpecialDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_BEAST]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_PLANT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_INSECT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_BIRD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_MAGICAL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_UNDEAD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_STONE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_MACHINE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_FISH]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_SPIRIT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_DRAGON]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_GOD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_SOLDIER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_KNIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_SNIPER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TypeShield[CHARA_TYPE_SORCERER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_ElementMagicDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER},
[BuffIds.WaterShield] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER},
[BuffIds.MagicalShield] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.MagicDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.AS_LilyMatter] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER},
[BuffIds.DrivingHigh] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.AS_Lilahamur] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER_2},
[BuffIds.NextHitSufferDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferCriticalDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferWeakElemDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_DistanceCondSkillPUIDDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_COND_NUM_3, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferPhysDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferMagDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferMagDmgPer2] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_TargetSkillPUIDDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_PER},
[BuffIds.Mana_Purim] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.Mana_Popoie] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SkillDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SpecialDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TargetBreakDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.PhysicalDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_TargetSkillDmgPerTrig] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER},
[BuffIds.SuperSufferPhysDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.FireEquipDamage] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.ElementSkillDmgPer[ELEMENT_FIRE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.ElementSkillDmgPer[ELEMENT_ICE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.ElementSkillDmgPer[ELEMENT_TREE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.ElementSkillDmgPer[ELEMENT_THUNDER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.ElementSkillDmgPer[ELEMENT_LIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.ElementSkillDmgPer[ELEMENT_DARK]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.ElementSkillDmgPer[ELEMENT_ALL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.EmperorSong] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.AS_Eldravahna] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferBossDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferNotBossDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TechConst[ELEMENT_FIRE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TechConst[ELEMENT_ICE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TechConst[ELEMENT_TREE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TechConst[ELEMENT_THUNDER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TechConst[ELEMENT_LIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.TechConst[ELEMENT_DARK]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.OilCoating] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextSkill1_2DamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextSkill1_3DamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextSkill2_3DamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.AllDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextElementSkillDamagePer[ELEMENT_NONE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextElementSkillDamagePer[ELEMENT_FIRE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextElementSkillDamagePer[ELEMENT_ICE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextElementSkillDamagePer[ELEMENT_TREE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextElementSkillDamagePer[ELEMENT_THUNDER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextElementSkillDamagePer[ELEMENT_LIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextElementSkillDamagePer[ELEMENT_DARK]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_TargetSkillIDDmgPer] = {},
[BuffIds.SufferHumanDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferBeastPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER},
[BuffIds.E_SufferPhysDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.E_SufferMagDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_SkillFirstDmgPer] = {},
[BuffIds.NextSkillDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferNonElementDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferFireDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferIceDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferTreeDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferThunderDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferLightDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferDarkDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SufferElementDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_SufferTargetSkillPUIDDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_SufferTargetSkillPUIDDmgHitPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_COND_NUM_3, PARAM_BEHAV_RESULT_PER},
[BuffIds.GameMaster[ELEMENT_NONE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.GameMaster[ELEMENT_FIRE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.GameMaster[ELEMENT_ICE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.GameMaster[ELEMENT_TREE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.GameMaster[ELEMENT_THUNDER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.GameMaster[ELEMENT_LIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.GameMaster[ELEMENT_DARK]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.NextSpecialDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.FightingSpirit[1]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.FightingSpirit[2]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.FightingSpirit[3]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_TargetSkillNextHitDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER},
[BuffIds.RunnersHigh] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[BuffIds.YggShutoutPhysDmg] = {PARAM_BEHAV_FLAME},
[BuffIds.YggShutoutMagDmg] = {PARAM_BEHAV_FLAME},
[BuffIds.ShutoutPhysDmgHp] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1},
[BuffIds.ShutoutPhysDmgCnt] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1},
[BuffIds.MagicShield] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.KingOfKnight] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD},
[BuffIds.EtherShield] = {PARAM_BEHAV_FLAME},
[BuffIds.ShutoutDmgHp] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD},
[BuffIds.HitRate] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.PhysicalAvoid] = {PARAM_BEHAV_FLAME},
[BuffIds.PhysicalAvoidCnt] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1},
[BuffIds.PhysicalAvoidRate] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PROB},
[BuffIds.MagicAvoid] = {PARAM_BEHAV_FLAME},
[BuffIds.MagicAvoidCnt] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1},
[BuffIds.Barrier] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD},
[BuffIds.Shield] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD},
[BuffIds.KillerPower] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_Counter] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PROB, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL},
[BuffIds.P_SkillStockCondGroundCounter] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_DIR, PARAM_BEHAV_COND_KIND_3, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_PROB, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL},
[BuffIds.AdditionalDmg] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgFire] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgIce] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgTree] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgThunder] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgLight] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgDarkness] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgNormal] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgNormalFire] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgNormalIce] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgNormalTree] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgNormalThunder] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgNormalLight] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.AdditionalDmgNormalDarkness] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.P_TargetSkillPUIDAdditionalDmg] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.ReductionMpCost] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.YggShutoutDebuff] = {PARAM_BEHAV_FLAME},
[BuffIds.GrimReaperBarrier] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT},
[BuffIds.InvalidGrimReaper] = {PARAM_BEHAV_FLAME},
[BuffIds.AdditionalDmgNonElementPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.AdditionalDmgFirePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.AdditionalDmgIcePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.AdditionalDmgTreePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.AdditionalDmgThunderPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.AdditionalDmgLightPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.AdditionalDmgDarknessPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.PF_AddCharaType] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzeFire] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzeIce] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzeTree] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzeThunder] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzeLight] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzeDark] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzePoison] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzeParalysys] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzeSick] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzeDarkness] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzeCurse] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzeSlience] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[BuffIds.P_AnalyzePain] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_AnalyzePain] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD},
[BuffIds.A2_BerserkMode] = {PARAM_BEHAV_FLAME},
[BuffIds.Ardine_Power] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.Ardine_Fire] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Ardine_Tree] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Ardine_Thunder] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Ardine_Poison] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_PROB},
[BuffIds.Ardine_Break] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Ardine_Dragon] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_RESULT_MAX, PARAM_BEHAV_RESULT_PER},
[BuffIds.AT_Gus] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.AT_SnapBlade] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2},
[BuffIds.LimiterRemoval] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PER, PARAM_BEHAV_PER, PARAM_BEHAV_PER, PARAM_BEHAV_PER, PARAM_BEHAV_PER},
[BuffIds.StyleImmovable] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Charged[1]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Charged[2]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Charged[3]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.Wave] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.BigWave] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Veneration] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.TrueDemon] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1},
[BuffIds.Doppelganger] = {PARAM_BEHAV_FLAME},
[BuffIds.Demon] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.SpiritualBarrier] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.GodSword] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SandSword] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SandShield] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.FieldOfFonons[ELEMENT_FIRE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.FieldOfFonons[ELEMENT_ICE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.FieldOfFonons[ELEMENT_TREE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.FieldOfFonons[ELEMENT_THUNDER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.FieldOfFonons[ELEMENT_LIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.FieldOfFonons[ELEMENT_DARK]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.OverLimits] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.OverLimitsGauge[1]] = {PARAM_BEHAV_FLAME},
[BuffIds.OverLimitsGauge[2]] = {PARAM_BEHAV_FLAME},
[BuffIds.OverLimitsGauge[3]] = {PARAM_BEHAV_FLAME},
[BuffIds.OverLimitsGauge[4]] = {PARAM_BEHAV_FLAME},
[BuffIds.PresentStockRed] = {PARAM_BEHAV_FLAME},
[BuffIds.PresentStockGreen] = {PARAM_BEHAV_FLAME},
[BuffIds.PresentStockPurple] = {PARAM_BEHAV_FLAME},
[BuffIds.PresentRed] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.PresentGreen] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.PresentPurple] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_RESULT_PER},
[BuffIds.SpiritualFist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_COND_NUM_3},
[BuffIds.ShorteningDistances] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[BuffIds.Zero_Attack] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Zero_Defense] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.EngagementRing] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.Thruster] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL_2},
[BuffIds.GodGuardian] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_ADD},
[BuffIds.ReCharge] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[BuffIds.CaptainMission] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[BuffIds.TS_Magicules] = {PARAM_BEHAV_FLAME},
[BuffIds.TS_DragonGuidance] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.TS_Fear] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.TrainedElectro] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_COND_NUM_1},
[BuffIds.LBOOST] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL_2, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.ThunderGod] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL_2, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER},
[BuffIds.AckermannsBlood] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL_2, PARAM_BEHAV_PER_2, PARAM_BEHAV_VAL_3},
[BuffIds.SoulBlade] = {PARAM_BEHAV_FLAME},
[BuffIds.LiberationMaiden] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PER, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_COND_DIR, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.SN_Ring[1]] = {PARAM_BEHAV_FLAME},
[BuffIds.SN_Ring[2]] = {PARAM_BEHAV_FLAME},
[BuffIds.SN_Ring[3]] = {PARAM_BEHAV_FLAME},
[BuffIds.SN_Ring[4]] = {PARAM_BEHAV_FLAME},
[BuffIds.SN_Ring[5]] = {PARAM_BEHAV_FLAME},
[BuffIds.DragonFactor] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.VeilOfSeiran] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.FreezingAura] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PROCESS_1},
[BuffIds.OV_Love] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_RESULT_PER},
[BuffIds.OV_OverLord] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.OV_DeadlyHeroesSoul] = {PARAM_BEHAV_FLAME},
[BuffIds.SacrificeOfPower] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL_2, PARAM_BEHAV_PER_2},
[BuffIds.DemonDevourer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX, PARAM_BEHAV_EFFECT_START, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.GeneralUnitBuff] = {PARAM_BEHAV_FLAME},
[BuffIds.CoagulationEther[1]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_ADD},
[BuffIds.CoagulationEther[2]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_ADD},
[BuffIds.CoagulationEther[3]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_ADD},
[BuffIds.CoagulationEther[4]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_ADD},
[BuffIds.SufferLacDefBonus] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.BF_OverDrive] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL_2, PARAM_BEHAV_PER_2},
[BuffIds.PreCastMiddle] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.PreCastHigh] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.P_NearDeathSkill] = {},
[BuffIds.CounterMagic] = {PARAM_BEHAV_FLAME},
[BuffIds.P_DamageEditCnt] = {},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_SOLDIER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_SNIPER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_KNIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_SORCERER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_BEAST]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_PLANT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_INSECT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_BIRD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_MAGICAL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_UNDEAD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_STONE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_MACHINE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_SPIRIT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_DRAGON]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_GOD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_FISH]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_Element[ELEMENT_FIRE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_Element[ELEMENT_ICE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_Element[ELEMENT_TREE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_Element[ELEMENT_THUNDER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_Element[ELEMENT_LIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_Element[ELEMENT_DARK]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_Element[ELEMENT_ALL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_SkillType[SKILL_PHYSIC]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_SkillType[SKILL_MAGIC]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_SkillType[SKILL_SKILL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_SkillType[SKILL_SPECIAL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_SkillType[SKILL_ATTACK]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_SkillType[0]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_TargetSkillDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.WP_TargetSkillDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_TargetSkillNextHitDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.KillerDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.NextSkillDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_Element[ELEMENT_NONE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_Element[ELEMENT_FIRE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_Element[ELEMENT_ICE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_Element[ELEMENT_TREE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_Element[ELEMENT_THUNDER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_Element[ELEMENT_LIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_Element[ELEMENT_DARK]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferDamageLimit_Element[ELEMENT_ALL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.WeakElemDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.NextSpecialDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.NextMagicDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_SOLDIER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_SNIPER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_KNIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_SORCERER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_BEAST]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_PLANT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_INSECT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_BIRD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_MAGICAL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_UNDEAD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_STONE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_MACHINE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_SPIRIT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_DRAGON]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_GOD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_CharaType[CHARA_TYPE_FISH]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_EnemyType[ENEMY_TYPE_BOSS]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.DamageLimit_EnemyType[ENEMY_TYPE_NORMAL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.NextNormalAttackDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.TargetBreakDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.SufferWeakElemDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.P_ClampHp] = {},
[BuffIds.S_StyleBlueControl] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[BuffIds.S_HaveBuffUidIntervalMPSpend] = {},
[BuffIds.S_TargetElementSkillParentHeal] = {},
[BuffIds.S_HpCondSharingHp_Ally] = {},
[BuffIds.S_BossBreakSctEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_ADD},
[BuffIds.S_Endure] = {},
[BuffIds.S_DefeatReset] = {},
[BuffIds.S_DemonizationAlly] = {},
[BuffIds.S_GoldenPrestigeAlly] = {},
[BuffIds.S_HaveBuffUidSetCastSuperArmor] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_VAL},
[BuffIds.S_DetectBulletSufferPhysDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[BuffIds.S_FatalityReservSufferPhysDmgPer] = {},
[BuffIds.S_DetectBulletSufferMagDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[BuffIds.S_FatalityReservSufferMagDmgPer] = {},
[BuffIds.S_BuffControl_1050360] = {},
[BuffIds.S_Rimuru_Sword_1] = {},
[BuffIds.S_Rimuru_Sword_2] = {},
[BuffIds.S_Rimuru_Sword_3] = {},
[BuffIds.S_Rimuru_Sword_4] = {},
[BuffIds.S_Rimuru_Sword_5] = {},
[BuffIds.S_Rimuru_Sword_6] = {},
[BuffIds.S_Rimuru_Sword_7] = {},
[BuffIds.S_Rimuru_Sword_8] = {},
[BuffIds.S_Rimuru_Sword_9] = {},
[BuffIds.S_Rimuru_Sword_10] = {},
[BuffIds.S_HpCondSufferDmgPer_Ally] = {},
[BuffIds.S_Companionship_Ally] = {},
[BuffIds.S_NoDamage] = {},
[BuffIds.S_SkillPuidShowPassive] = {},
[BuffIds.S_SkillEndBuffControl] = {},
[BuffIds.S_HpCondBuffControl] = {},
[BuffIds.S_NotSkillPuidBuffControl] = {},
[BuffIds.S_DyingMessage] = {},
[BuffIds.S_HaveBuffUidIntervalTargetBuffIdSubProc] = {PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_KIND_3, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_ADD},
[BuffIds.S_LimiterRemoval_ProbEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.S_PlayerAiUseSkill] = {},
[BuffIds.S_HaveBuffUidDmgLimitBreak] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_Control] = {},
[BuffIds.C_AppendControl] = {},
[BuffIds.C_DevilMegius] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_MaidenSera] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Roland] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_Degrogue] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_Rimuru] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_Murren] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_Adel] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_Bradley] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Soleil] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START, PARAM_BEHAV_EFFECT_END},
[BuffIds.C_Leodore] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Granadas] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_Kyle] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Ainz] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Maja] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Vayne] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Veldora] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_GodLily] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Lougseus] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_GodBeyland] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_SageLagrobos] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_KingRoland] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER_2},
[BuffIds.C_SummerLeona] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Graphel] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_RESULT_PER_2},
[BuffIds.C_Megius] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL_2, PARAM_BEHAV_PER_2},
[BuffIds.C_GodThouzer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL_2, PARAM_BEHAV_PER_2},
[BuffIds.C_MageZekus] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL_2, PARAM_BEHAV_PER_2},
[BuffIds.C_Kynei] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_RESULT_PER_2},
[BuffIds.C_Gilbert] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_RESULT_PER_2},
[BuffIds.C_GodKyle] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER_2},
[BuffIds.C_Lilaha] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_Arkh] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER_2},
[BuffIds.C_Balezar] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER_2},
[BuffIds.C_Aernewisse] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_GodLougseus] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_SamuraiKyle] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_Judecca] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_KarmaNoug] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[BuffIds.C_RadaDour] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER_2, PARAM_BEHAV_RESULT_PER_2},
[BuffIds.C_Beyland] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Lagrobos] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Zekus] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_Mauna] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[BuffIds.C_KingArkh] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL_2, PARAM_BEHAV_PER_2},

[DebuffIds.ElementEdgeFire] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[DebuffIds.ElementEdgeIce] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[DebuffIds.ElementEdgeTree] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[DebuffIds.ElementEdgeThunder] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[DebuffIds.ElementEdgeLight] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[DebuffIds.ElementEdgeDarkness] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[DebuffIds.ElementEdgeFour] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[DebuffIds.WeaknessPoison] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_COND_KIND_2, PARAM_BEHAV_COND_KIND_3, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_RESULT_PER},
[DebuffIds.DotDamage] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[DebuffIds.AttackDecHpNone] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[DebuffIds.AttackDecHpFire] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[DebuffIds.AttackDecHpIce] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[DebuffIds.AttackDecHpTree] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[DebuffIds.AttackDecHpThunder] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[DebuffIds.AttackDecHpLight] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[DebuffIds.AttackDecHpDarkness] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[DebuffIds.Bleed] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_EFFECT_START},
[DebuffIds.SctRcvVal] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SctRcvValSkill1] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SctRcvValSkill2] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SctRcvValSkill3] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.EvilSpirit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_MIN, PARAM_BEHAV_RESULT_MAX},
[DebuffIds.HealPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.EtherRcv] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.StrEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.StatusEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.E_StrEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.StatusEdit2] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.HumanStrEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.OtherStrEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.AllStatusEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_EFFECT_START},
[DebuffIds.DefEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.E_DefEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.IntEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.E_IntEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.MndEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.E_MndEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.CrtEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[DebuffIds.E_CrtEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[DebuffIds.MaxHpEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.E_MaxHpEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.AilmentResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.PoisonResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.ParalysysResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.SickResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.DarknessResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.CurseResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.SlienceResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.ElementResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.FireResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.IceResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.TreeResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.ThunderResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.LightResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.DarknessResist] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL},
[DebuffIds.SpdEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SpdEdit2] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.ShorteningCast] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PER},
[DebuffIds.StunEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.BreakEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferStunEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferBreakEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.MaxMpEdit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.HateEffect] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[DebuffIds.PhysicalDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferSkillDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferSpecialDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferBossDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferNotBossDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SkillDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_SOLDIER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_SNIPER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_KNIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_SORCERER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_BEAST]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_PLANT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_INSECT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_BIRD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_MAGICAL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_UNDEAD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_STONE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_MACHINE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_SPIRIT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_DRAGON]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_GOD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDamagePer_CharaType[CHARA_TYPE_FISH]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.MagicDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.NextHitSufferDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COUNT, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferCriticalDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferWeakElemDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferPhysDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferMagDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferNonElementDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferFireDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferIceDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferTreeDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferThunderDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferLightDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferDarkDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SufferElementDmgPer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.AllDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.SpecialDamagePer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.HitRate] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.KillerPower] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.ReductionMpCost] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.P_ForbidMagOrSkill] = {},
[DebuffIds.ForbidSkill] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD},
[DebuffIds.ForbidMagic] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD},
[DebuffIds.AddCharaType[CHARA_TYPE_SOLDIER]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_SNIPER]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_KNIGHT]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_SORCERER]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_BEAST]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_PLANT]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_INSECT]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_BIRD]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_MAGICAL]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_UNDEAD]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_STONE]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_MACHINE]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_SPIRIT]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_DRAGON]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_GOD]] = {PARAM_BEHAV_FLAME},
[DebuffIds.AddCharaType[CHARA_TYPE_FISH]] = {PARAM_BEHAV_FLAME},
[DebuffIds.NoticeLetter] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PER, PARAM_BEHAV_PER},
[DebuffIds.Reform] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_PER},
[DebuffIds.LightningNeedle] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.Prison] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_MAX, PARAM_BEHAV_RESULT_MAX},
[DebuffIds.GodAdmonition] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL},
[DebuffIds.PresentRed] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.PresentGreen] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.PresentPurple] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_RESULT_PER},
[DebuffIds.Atrophy] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.WaterPoison] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_KIND_1, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_PER, PARAM_BEHAV_VAL},
[DebuffIds.Corrosion] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL_2, PARAM_BEHAV_PER_2},
[DebuffIds.AT_Revenge] = {PARAM_BEHAV_FLAME},
[DebuffIds.TheoryOfMagicSystem] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL_2},
[DebuffIds.LougseusSealed] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_COND_NUM_2, PARAM_BEHAV_RESULT_PER},
[DebuffIds.FaithCollection] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_COND_NUM_1, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
[DebuffIds.CG_Geass] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferLacDefBonus] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.Condemnation] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_RESULT_PER_2},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_SOLDIER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_SNIPER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_KNIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_SORCERER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_BEAST]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_PLANT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_INSECT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_BIRD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_MAGICAL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_UNDEAD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_STONE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_MACHINE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_SPIRIT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_DRAGON]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_GOD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_CharaType[CHARA_TYPE_FISH]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_Element[ELEMENT_NONE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_Element[ELEMENT_FIRE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_Element[ELEMENT_ICE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_Element[ELEMENT_TREE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_Element[ELEMENT_THUNDER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_Element[ELEMENT_LIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_Element[ELEMENT_DARK]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferDamageLimit_Element[ELEMENT_ALL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.WeakElemDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_SOLDIER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_SNIPER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_KNIGHT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_SORCERER]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_BEAST]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_PLANT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_INSECT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_BIRD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_MAGICAL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_UNDEAD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_STONE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_MACHINE]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_SPIRIT]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_DRAGON]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_GOD]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_CharaType[CHARA_TYPE_FISH]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_EnemyType[ENEMY_TYPE_BOSS]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.DamageLimit_EnemyType[ENEMY_TYPE_NORMAL]] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.TargetBreakDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.SufferWeakElemDamageLimit] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.P_DisableSkill] = {},
[DebuffIds.TargetLock] = {PARAM_BEHAV_FLAME},
[DebuffIds.S_DotDamage] = {},
[DebuffIds.S_DotDamage2] = {},
[DebuffIds.S_MpSpend] = {},
[DebuffIds.S_ForceVit0] = {},
[DebuffIds.S_SctRcvVal] = {},
[DebuffIds.S_SctRcvTrigBreak] = {},
[DebuffIds.S_SpdEditInSea] = {},
[DebuffIds.S_MaxMpEdit] = {},
[DebuffIds.S_InvalidationKillerAvoid] = {},
[DebuffIds.S_DisableSkill] = {},
[DebuffIds.C_Shida] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.C_Ryvern] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[DebuffIds.C_GodRei] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL_2, PARAM_BEHAV_VAL_2},
[DebuffIds.C_Zero] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL_2, PARAM_BEHAV_RESULT_PER},
[DebuffIds.C_GodLougseus] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.C_Lucia] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL_2},
[DebuffIds.C_Ardine] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.C_Mauna] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER},
[DebuffIds.C_Lougseus] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.C_Labyreth] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_RESULT_PER},
[DebuffIds.C_Kyna] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL_2, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.C_Eliza] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL},
[DebuffIds.C_Lagreign] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL},
[DebuffIds.C_Mayly] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.C_Lilaha] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[DebuffIds.C_GodLenius] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL},
[DebuffIds.C_Lenius] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.C_GodMia] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL, PARAM_BEHAV_RESULT_PER},
[DebuffIds.C_SummerSera] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL},
[DebuffIds.C_DevilMayly] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_VAL},
[DebuffIds.C_Garland] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.C_Nael] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.C_SummerNael] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.C_Lonardo] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL_2, PARAM_BEHAV_PER_2},
[DebuffIds.C_SummerLabyreth] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER, PARAM_BEHAV_VAL_2, PARAM_BEHAV_PER_2},
[DebuffIds.C_EmperorLonardo] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.C_Yuda] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER, PARAM_BEHAV_VAL, PARAM_BEHAV_PER},
[DebuffIds.C_DevilLabyreth] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_PER},
[DebuffIds.C_Thouzer] = {PARAM_BEHAV_FLAME, PARAM_BEHAV_RESULT_ADD, PARAM_BEHAV_RESULT_PER},
}
setmetatable(BuffParamBehavior,{__index = function() return {} end}) -- 未定義対応

-- 可変名称、説明文を使用しているバフ
IsVariableTextBuff = {
[BuffIds.RunnersHigh] = 1,
[BuffIds.DrivingHigh] = 1,
[BuffIds.ChristmasCarol] = 1,
}

-- ガスバフのアイコンID
BUFF_ICON_ID_AT_GUS = {
[1] = 421,
[2] = 422,
[3] = 423,
[4] = 424,
[5] = 425,
[6] = 426,
[7] = 447,
[8] = 448,
[9] = 449,
[10] = 450,
[11] = 451,
[12] = 452,
[13] = 453,
[14] = 454,
[15] = 455,
[16] = 456,
[17] = 457,
[18] = 458,
[19] = 459,
[20] = 460,
}

-- 凍気バフのアイコンID
BUFF_ICON_ID_FREEZING_AURA = {
[1] = 748,
[2] = 749,
[3] = 750,
[4] = 751,
[5] = 752,
}

-- TS_魔素バフのアイコンID
BUFF_ICON_ID_TS_MAGICULES = {
[1] = 662,
[2] = 663,
[3] = 664,
[4] = 665,
[5] = 666,
}

-- キャラタイプ追加バフのアイコンID
BUFF_ICON_ID_PF_ADD_CHARA = {
[1] = 466,
[2] = 467,
[3] = 468,
[4] = 469,
[5] = 470,
[6] = 471,
[7] = 472,
[8] = 473,
[9] = 474,
[10] = 475,
[11] = 476,
[12] = 477,
[13] = 478,
[14] = 479,
[15] = 480,
[16] = 481,
}

-- if LOG_LEVEL >= LOG_LEVEL_WARNING then
-- 	for i,j in pairs(BuffIds) do
-- 		if not BuffParamBehavior[j] then print('<color=yellow>BuffParamBehavior Not Found : ID=>', i, '(', j, ')</color>') end
-- 	end
-- 	for i,j in pairs(DebuffIds) do
-- 		if not BuffParamBehavior[j] then print('<color=yellow>BuffParamBehavior Not Found : ID=>', i, '(', j, ')</color>') end
-- 	end
-- end

----------------------------------------------------------------------------------
-- 									汎用関数									--
----------------------------------------------------------------------------------
-- マルチ用に端末間で同期された乱数を生成する
-- 参照可能なタイムラインのインスタンスがあるタイミングのみ有効
function SyncedRandom(_min, _max) local n = c.GetTimelineProperty(TIMELINE_PROPERTY_RANDOM) if isNumber(_min) and isNumber(_max) then return (n % (_max - _min + 1)) + _min else return n end end


----------------------------------------------------------------------------------
-- 								C#関数のラッパー								--
-- 			C#側に変更があっても、ここの修正だけで吸収できるようにする			--
----------------------------------------------------------------------------------
-- ユニットのステータスを返す(プロセスカスタム)
-- TODO:定義の上書きは事故の元なのでなんとかしたい
function c.GetUnitStatus(t, _statType, _isReal) return UnitGetValue(t, _statType, toBoolean(_isReal)) end

-- ユニットの属性耐性を返す(プロセスカスタム)
-- TODO:定義の上書きは事故の元なのでなんとかしたい
-- @return
-- 　ELEMENT_XXXをキーとしたテーブル
-- 　-999(999%増加) ～ 50(50%低減) ～ 100(無効)
function c.GetUnitElemResists(t, _isFinal) return UnitGetElemResists(t, _isFinal==nil or _isFinal, _isFinal==nil or _isFinal, false) end

-- プロセスのトリガ情報を返す
function c.GetUnitTriggers(t) return UnitGetTriggers(t) end

-- プロセスのユニットワークのユニット識別子とサブユニットIDを返す
-- @return uid, subUnitId
function c.GetUnitUID(targetStatus) return ProcGetUnitUID(targetStatus) end

-- プロセス、またはバレットの発動者の識別子を返す
function c.GetOwner() return ProcGetOwner() end

-- プロセス、またはバレットの対象者の識別子を返す
function c.GetTarget() return ProcGetTarget() end

-- バフプロセスの場合、バフの発動者とバフ所有者の識別子を返す
-- @return 発動者 uid
-- @return 所有者 uid
function c.GetBuffUnit() return ProcGetBuffUnit() end

-- バレット発動者の識別子を返す
function c.GetBulletOwner() return BulletGetOwner() end

-- バレットがヒットした対象の識別子を返す
function c.GetBulletTarget() return BulletGetTarget() end

-- 現在のプロセス、または指定したuidのプロセスの所属とローカルIDを返す
-- @param _mode PROC_INFO_GET_MODE_XXX
-- @return PROCESS_AFFILIATION_XXX
-- @return localID
function c.GetProcAffiliation(_uid, _mode) return ProcGetAffiliation(_uid or 0, _mode) end

-- プロセスオーナーが現在発生させているスキルを返す
function c.GetOwnerActiveSkill() return ProcGetOwnerActiveSkill() end

-- このバレットを含むスキルのPUIDを返す
-- @return PUID:発動毎にスキルのタイムラインに与えられた識別子
function c.GetBulletSkillPUID() return BulletGetSkillPUID() end

-- このバレットを含むスキルのIDを返す
function c.GetBulletSkillID() return BulletGetSkillID() end

-- このバレットを含むスキルのタイプを返す
-- _comp を指定した場合は、このバレットを含むスキルのタイプが _comp と一致しているかを返す
-- @param _mode CS_COMPARE_XXX
-- @param _comp SKILL_TYPE_XXX
-- @param _exp 拡張パラメータ定義配列 {[SKILL_TYPE_EXP1] = {SKILL_TYPE_1, SKILL_TYPE_2}}
function c.GetBulletSkillType(_mode, _comp, _exp) if _comp ~= nil then return BulletGetSkillType(_mode or CS_COMPARE_DIRECT, _comp, _exp or {}) else return BulletGetSkillType() end end

-- このバレットを含むスキルのロールを返す
-- _comp を指定した場合は、このバレットを含むスキルのロールが _comp と一致しているかを返す
-- @param _mode CS_COMPARE_XXX
-- @param _comp SKILL_ROLE_XXX
-- @param _exp 拡張パラメータ定義配列 {[SKILL_ROLE_EXP1] = {SKILL_ROLE_1, SKILL_ROLE_2}}
function c.GetBulletSkillRole(_mode, _comp, _exp) if _comp ~= nil then return BulletGetSkillRole(_mode or CS_COMPARE_DIRECT, _comp, _exp or {}) else return BulletGetSkillRole() end end

-- このバレットを含むスキルのスキル種別を返す
function c.GetBulletSkillKind() return BulletGetSkillKind() end

-- このバレットを含むスキルの対象規模を返す
function c.GetBulletSkillRange() return BulletGetSkillRange() end

-- このバレットを含むスキルの対象情報を返す
function c.GetBulletSkillTarget() return BulletGetSkillTarget() end

-- このバレットのヒット対象を返す
function c.GetBulletHitTarget() return BulletGetSkillTarget(1) end

-- このバレットの編集前の仮確定したダメージ値を返す
-- ダメージ・被ダメージ計算後トリガーでのみ使用可能
function c.GetOrgDamage() return ProcGetOrgProcDamage() end

-- このバレットの仮確定したダメージ値を返す
-- ダメージ・被ダメージ計算後トリガーでのみ使用可能
function c.GetDamage() return ProcGetProcDamage() end

-- このバレットの仮確定したダメージ値を編集する
-- ダメージ・被ダメージ計算後トリガーでのみ使用可能
function c.EditDamage(_val) return ProcEditProcDamage(_val) end

-- このバレットの編集前の仮確定した回復値を返す
-- ダメージ・被ダメージ計算後トリガーでのみ使用可能
function c.GetOrgHeal() return ProcGetOrgProcHeal() end

-- このバレットの仮確定した回復値を返す
-- ダメージ・被ダメージ計算後トリガーでのみ使用可能
function c.GetHeal() return ProcGetProcHeal() end

-- このバレットの仮確定した回復値を編集する
-- ダメージ・被ダメージ計算後トリガーでのみ使用可能
function c.EditHeal(_val) return ProcEditProcHeal(_val) end

-- このバレットで確定した最終ダメージ値を返す
-- 当てた・受けた後トリガーでのみ使用可能
function c.GetLastDamage() return ProcGetLastDamage() end

-- このバレットで確定した最終回復値を返す
-- 当てた・受けた後トリガーでのみ使用可能
function c.GetLastHeal() return ProcGetLastHeal() end

-- このプロセスのプロセスIDとUIDを返す
-- @param _mode PROC_INFO_GET_MODE_XXX
-- @return ProcessID
-- @return UID
function c.GetProcessID(_mode) return ProcGetProcessID(_mode) end

-- このプロセスのプロセスINDEX(マスタ設定箇所)を返す
-- @param _mode PROC_INFO_GET_MODE_XXX
function c.GetProcessIndex(_mode) return ProcGetProcessIndex(_mode) end

-- このプロセスのパラメータを返す
-- print('Call ProcParam;', _index, '=>', ProcGetParam(_index))
function c.GetProcParam(_index) return ProcGetParam(_index) end

-- このバレット、またはパッシブで実行済みのプロセス情報を返す
-- @return 操作タイプIDをキーとした、bool値のテーブル
function c.GetFinishedProc() return ProcGetSucceeded() end

-- プロセスが「生存状態変化」トリガから発火している場合、トリガを発火させたユニットの配列を返す
-- @return アクター識別子配列(削除・追加されたユニットも含む)
function c.GetChangedAlives() return UnitGetChangedAlives(ownUnit) end

-- プロセスが「自身のバフ付与状態増減時」トリガから発火している場合、トリガを発火させたバフの配列を返す
function c.GetChangedBuffs(t, isRemoved) return UnitGetChangedBuffs(t, isRemoved) or {} end

-- プロセスが「状態異常付与前」トリガから発火している場合、トリガを発火させた状態異常IDを返す
function c.GetAddBadStatus() return ProcGetAddBadStatus() end

-- 指定のユニットに対して操作タイプに応じた操作を行う
-- @param t アクター識別子
-- @param opeType 操作タイプID
-- @param param 操作に渡すパラメータテーブル
-- @param lifeType 操作の寿命タイプ
-- @param forceShowPassive クライアントでパッシブカットインを表示するかどうか
-- print('ProcControl : srcType=>', srcType, ' srcUnit=>', srcUnit, ' dstType=>', dstType, ' operation=>', operation, ' param=>', table.unpack(param), ' lifeType=>', lifeType)
function c.ProcControl(srcType, srcUnit, dstType, dstUnit, operation, param, lifeType, forceShowPassive) return ProcControl2(srcType or TARGET_STATUS_SUBJECT_WORK, srcUnit or 0, dstType or TARGET_STATUS_UNIT_WORK, dstUnit or target:ID(), operation, param, lifeType or LIFETYPE_NORMAL, forceShowPassive or false) end

-- 指定のユニットのバレットが保持するステータスを操作する
-- @param t アクター識別子
-- @param opeType 操作タイプID
-- @param param 操作に渡すパラメータテーブル
-- function c.BulletControl(t, opeType, param) BulletControl(t, opeType, param) end

-- プロセスの持つステータスをバフから取得し、プロセス外に影響を与えなくする
-- function c.Buff2Bullet() Buff2Bullet() end

-- 指定のユニットにバフまたはデバフを付与する
-- @param t アクター識別子
-- @param buffID バフID
-- @param param バフに渡すパラメータテーブル [1]は効果時間(フレーム)
-- @param contTrig バフをステータス系トリガの更新で削除したい場合、対象となるトリガ
-- @param behaviours バフのパラメータビヘイビア情報
-- @param options バフ情報上書きオプション（テーブル。変更したい項目のみ指定）
-- 　name ... バフ名（数値の場合UiMsg ID）
-- 　description ... 説明（数値の場合UiMsg ID）
-- 　iconID ... アイコンID
-- TODO:targetに0が渡ってくる場合があるため一次対応したが、クライアント側で修正してもらう
-- function c.BuffControl(t, buffID, param, contTrig, behaviours) return BuffControl(t, buffID, param, contTrig or 0, behaviours or {}) end
function c.BuffControl(t, buffID, param, contTrig, behaviours, options) return BuffControl(t~=0 and t or ownUnit, buffID, param, contTrig or 0, behaviours or {}, options or {}) end

-- 「プロセス内発火」トリガのキック
-- @param option
-- 　1 : targがリモートの場合はサーバを経由してローカル端末で発火
-- 　2 : targがリモートの場合は発火しない
function c.RaiseProcTrigger(targ, trigger, delayFrame, option) RaiseProcTrigger(targ, trigger, delayFrame or 0, option or 0) end

-- プロセスを子階層として実行
-- 対象のプロセスは処理マスタの「参照プロセス」カラムで予め指定されたもの
-- @param _index ... 参照プロセスの何番目に登録されたプロセスかを指定（1～）
-- @param _subj ... 発動者ユニット識別子（0の時は現在のプロセスの発動者）
-- @param _targ ... ターゲットユニット識別子
-- @param _prob ... 抽選確率（万分率）
-- @param _params ... パラメータを配列で指定
-- @param _optionParams ... サブプロセスパラメータを配列で指定
function c.ExecSubProcess(_index, _subj, _targ, _prob, _params, _optionParams) return ExecSubProcess(_index, _subj, _targ, _prob, _params, _optionParams) end

-- トリガ元タイムラインの情報を返す
-- @param propID BULLET_PROPERTY_XXX
function c.GetTimelineProperty(propID, _puid) return GetTimelineParameter(propID, _puid) end

-- 指定スキルのスキルロール詳細を永続的に書き換える
function c.SetSkillRoleDetail(t, skillType, skillIndex, _val) return UnitSkillControl(t, false, skillType, skillIndex, 1063, _val) end

-- バレットを直接生成する
-- @param bulletID バレットID
-- @param owner バレットオーナーのアクター識別子
-- @param targets ヒット対象のアクター識別子（単一のID、またはIDの配列）
-- @param delayFrame バレットがヒットするまでの遅延フレーム
-- @param [igniteBulletGenerate] trueの時「バレット生成前」トリガを発火 省略時はfalse
-- @param [ignoreOwnerDead] trueの時バレットのオーナー（GenerateBulletを呼び出したプロセスのオーナー）が死んでも有効 省略時はfalse
-- @param [targgetStatus] TARGET_STATUS_XXX
-- @return バレットユニーク識別子（BUID）
function c.GenerateBullet(bulletID, owner, targets, delayFrame, igniteBulletGenerate, ignoreOwnerDead, targetStatus) if targetStatus == nil then return GenerateBullet(bulletID, owner, targets, delayFrame, igniteBulletGenerate, ignoreOwnerDead) else return GenerateBullet(bulletID, owner, targets, delayFrame, igniteBulletGenerate, ignoreOwnerDead, targetStatus) end end

-- このバレットのユニーク識別子（BUID）を返す
function c.GetBulletUID() return GetCurrentBulletUID() end

-- 指定したバレットユニーク識別子（BUID）のバレットの情報を取得する
-- @param BUID バレットユニーク識別子
-- @param propID BULLET_PROPERTY_XXX
function c.GetBulletProperty(BUID, propID, ...) return BulletGetProperty(BUID, propID, ...) end

-- 指定したバレットユニーク識別子（BUID）のバレットの情報を変更する
-- @param BUID バレットユニーク識別子
-- @param propID BULLET_PROPERTY_XXX
-- @param val 変更後の値
function c.SetBulletProperty(BUID, propID, val) return BulletSetProperty(BUID, propID, val) end

-- 指定したバレットユニーク識別子（BUID）のバレットに付与したLuaValueを取得する
-- @param BUID バレットユニーク識別子
-- @param key 参照するLuaValueのハッシュ(ハッシュの配列を渡すことで子要素への直アクセスが可能)
function c.GetBulletLuaValue(BUID, key) return BulletGetProperty(BUID, 500, key) end

-- 指定したバレットユニーク識別子（BUID）のバレットにLuaValueを付与する
-- @param BUID バレットユニーク識別子
-- @param propID BULLET_PROPERTY_XXX
-- @param key 設定するLuaValueのハッシュ(ハッシュの配列を渡すことで子要素への直接付与が可能)
-- @param val 設定する値
-- @param isLifeTypeHit Trueならヒット処理終了時に消去
function c.SetBulletLuaValue(BUID, key, val, isLifeTypeHit) return BulletSetProperty(BUID, 500, key, val, isLifeTypeHit) end

-- 指定したバレットユニーク識別子（BUID）のバレットに付与されたLuaValueを演算する
-- @param BUID バレットユニーク識別子
-- @param propID BULLET_PROPERTY_XXX
-- @param key 設定するLuaValueのハッシュ(ハッシュの配列を渡すことで子要素への直接付与が可能)
-- @param val 設定する値
-- @param calc 演算モード
-- @param isLifeTypeHit Trueならヒット処理終了時に消去
function c.CalcBulletLuaValue(BUID, key, val, calc, isLifeTypeHit) calc = calc or 0 if calc == 0 then return BulletSetProperty(BUID, 500, key, val, isLifeTypeHit) else return BulletSetProperty(BUID, 502, key, calc, val, isLifeTypeHit) end end

-- このバレットでクリティカルが発生したかを返す
function c.WasBulletCritical() return BulletWasCritical() end

-- このバレットをターゲットがガードしたかを返す
function c.WasBulletGuarded() return BulletWasGuarded() end

-- このバレットをターゲットがカウンターしたかを返す
function c.WasBulletCountered() return BulletTargetUseCounter() end

-- このバレットでトドメを刺したかを返す
function c.WasBulletLastAttack() return BulletWasLastAttack() end

-- このバレットで指定ユニットが「根性」を発動したかを返す
function c.WasBulletEndured(_t) return UnitSavedLife(_t, 0) end

-- このバレットのダメージを受けても指定ユニットが死亡しないかを返す
function c.BulletNotFatal(_t) return UnitSavedLife(_t, 1) end

-- このバレットを対象にヒットさせた際、ノックバック・浮かしを発生させることができるかを返す
function c.BulletCanKnockBack(_target) return _target and BulletCanKB(_target) or BulletCanKB() end

-- このバレットでノックバック・浮かしが発生した場合、その情報を返す
function c.BulletMadeKnockBack() return BulletGetKnockBack() end

-- このバレットでターゲットにブレイクを発生させたかを返す
function c.BulletMadeBreak() return BulletMadeBreak() end

-- このバレットのSTR値を返す
-- function c.GetBulletStr() return BulletGetAtk() end

-- このバレットのDEF値を返す
-- function c.GetBulletDef() return BulletGetDef() end

-- このバレットのINT値を返す
-- function c.GetBulletInt() return BulletGetMag() end

-- このバレットのMND値を返す
-- function c.GetBulletMnd() return BulletGetMnd() end

-- このバレットのCRT値を返す
-- function c.GetBulletCrt() return BulletGetCrt() end

-- このバレットのステータスを返す
function c.GetBulletStatus(_statType, _isSample, _isFinal) return BulletGetValue(_statType, toBoolean(_isSample), _isFinal==nil or _isFinal) end

-- このバレットを含むスキルの属性を返す
-- _comp を指定した場合は、このバレットを含むスキルの属性が _comp と一致しているかを返す
-- @param _mode CS_COMPARE_XXX
-- @param _comp ELEMENT_XXX
-- @param _exp 拡張パラメータ定義配列 {[ELEMENT_EXP1] = {ELEMENT_1, ELEMENT_2}}
function c.GetBulletElement(_mode, _comp, _exp) if _comp ~= nil then return BulletGetElement(_mode or CS_COMPARE_DIRECT, _comp, _exp or {}) else return BulletGetElement() end end

-- このバレットを含むスキルの対象規模を返す
-- @return
-- 　SKILL_SCALE_XXX
function c.GetBulletScale() return BulletGetSkillRange() end

-- このバレットを含むスキルが発動された時のコスト状況を返す
-- @return cur, aft
-- cur 発動前のコスト(特技の時は 1.0 = 1ストック、魔法の時はMP値、超必の時は 1.0 = フル状態、通常攻撃は 1.0)
-- aft 発動後のコスト(同上)
function c.GetBulletCostInfo() return BulletGetSp() end

-- このバレットを含むスキルが発生から現在までに与えたダメージの合計を返す
function c.GetSkillTotalDamage() return BulletGetSkillTotalDamage() end

-- このバレットのキラー情報を返す
function c.GetBulletKiller() local res = BulletGetKiller() if not isTableOrClass(res) then res = {res} end return res end

-- バレットのヒット時消去フラグを返す
function c.GetBulletDeleteOnHit() return BulletGetDeleteOnHit() end

-- 操作「盗む」が成功した時のアイテムのレアリティを返す
function c.GetRarityOfStolenItem() return GetRarityOfStolenItem() end

-- 指定したUIDのバフの所有者の識別子を返す
function c.GetBuffOwnerByUID(buffUID) return ProcessControl(4700, buffUID) end

-- 指定したIDのバフの所有者の中で最初に見つかった者の識別子を返す
-- _isList = true の場合はすべての所有者の識別子のリストを返す
function c.GetBuffOwnerByID(buffID, _isList) return ProcessControl(4701, buffID, _isList and 1 or 0) end

-- 呼び出し元バフのステータスを返す
function c.GetBuffStatus(_statType, _isSample) return BuffGetValue(Buff:Parent():ID(), _statType, toBoolean(_isSample)) end

-- 呼び出し元バフのUIDを返す
function c.GetBuffUID() return GetCurrentBuffUID() end

-- 指定したUIDのバフの残り時間を変更する
function c.SetBuffLife(buffUID, remain) return ProcessControl(3000, buffUID, remain, remain<0) end

-- 指定したUIDのバフを消去する
function c.RemoveBuff(_t, buffUID) return UnitRemoveBuff(_t, buffUID) end

-- 現在のプロセスの条件および抽選が成功しているかどうかを返す
function c.IsSucceeded() return IsSucceeded() end

-- 現在のプロセスがシミュレーション実行されているかどうかを返す
function c.IsSimulating() return GetScriptStatus(1) end

-- 現在のプロセスの処理が成功したかどうかを返す
function c.IsProcSucceeded() return ProcessControl(4000) end

-- 現在のプロセスの成否判定書き換え
function c.SetProcSucceeded(_bool) ProcessControl(4001, _bool) end

-- ExecSubProcess() の第６引数でセットされたプロセス任意パラメータを参照する
function c.GetSubProcOptionParameter() return ProcessControl(4601) end

-- サブプロセスから親プロセスに渡す任意パラメータをセットする
function c.SetSubProcResult(...) ProcessControl(4611, ...) end

-- SetSubProcResultでセットした任意パラメータを参照する
function c.GetSubProcResult() return ProcessControl(4612) end

-- トリガ対象プロセスの処理が成功したかどうかを返す
function c.IsTrigProcSucceeded() return ProcessControl(24000) end

-- トリガ対象プロセスの成否判定書き換え
function c.SetTrigProcSucceeded(_bool) ProcessControl(24001, _bool) end

-- トリガ対象操作のパラメータ値を返す
function c.GetProcParameter(_index) return ProcGetParameter(_index, 1) end

-- トリガ対象操作のパラメータ値を変更する
function c.SetProcParameter(_index, _val) return ProcSetParameter(_index, _val, 1) end

-- トリガ対象操作のワーク値を返す
function c.GetProcFlag(_index) return ProcGetFlag(_index) end

-- トリガ対象操作のワーク値を変更する
function c.SetProcFlag(_index, _val) return ProcSetFlag(_index, _val) end

-- トリガ対象プロセスの成功確率を返す
function c.GetTrigProcProbability() return GetTargProcProbability() end

-- トリガ対象プロセスのパラメータを返す
function c.GetTrigProcParameters() return GetTargProcParameters() end

-- トリガ対象プロセスのパラメータビヘイビアを返す
function c.GetTrigProcBehaviours() return GetTargProcBehaviours() end

-- トリガ対象プロセスのプロセスカテゴリの配列を返す
function c.GetTrigProcCategories() return GetTargProcCategories() end

-- 仮にトリガー対象プロセスが成立した時に発生するバフ情報を返す
-- ※非常に重い処理なので、多用は禁物！
function c.GetTrigProcBuffs() return GetTargProcBuffs() or {} end

-- トリガ対象プロセスの所属とローカルIDを返す
-- @return PROCESS_AFFILIATION_XXX
-- @return localID
function c.GetTargProcAffiliation() return GetTargProcAffiliation() end

-- バフ別に保持できる値を取得する
function c.GetKeptBuffParam(_index) return GetBuffWork(_index) end

-- バフ別に保持できる値を設定する
function c.KeepBuffParam(_index, _val, _calc) return calculateCS(_calc or 0, _val, SetBuffWork, {_index, _val, _calc}, 3, 2, c.GetKeptBuffParam, {_index}) end

-- WAVE/バトルを通じて保持できる値を取得する
-- _everがtrueならクエストを通じて保持できる
function c.GetKeptParam(_index, _ever) return GetBulletWork(_index, _ever or false) end

-- WAVE/バトルを通じて保持できる値を設定する
-- _everがtrueならクエストを通じて保持できる
-- _isGvgFix が true の場合はラウンドを跨ぐとクリアされてしまう不具合が修正される
function c.KeepParam(_index, _val, _calc, _ever, _isGvgFix) return calculateCS(_calc or 0, _val, SetBulletWork, {_index, _val, _ever or false, _calc, _isGvgFix or false}, 4, 2, c.GetKeptParam, {_index, _ever}) end

-- バトルの勝敗判定を一定時間保留する
-- @param _behaviour 挙動 PEND_JUDGE_TYPE_XXX
-- @param _judge ラストアタッカー決定とデフォルトの勝敗判定の方法 PEND_JUDGE_MODE_XXX
function c.SetPendingJudge(_target, _frame, _type, _mode) SetPendingJudge(_target:ID(), _frame, _type, _mode) end

-- プロセスに設定された演出タイムラインを、セグメント(INDEX)を指定して再生する
-- print('PlayProcTimeline : this=>', this:ID(), ' target=>', target:ID())
function c.PlayTimeline(_index, _owner, _target) return PlayProcTimeline(_index, _owner and _owner:ID() or this:ID(), _target and _target:ID() or target:ID()) end

-- パッシブの発動を通知する
function c.PlayPassiveLine(_t) return PlayPassiveLine(_t) end

-- パッシブの発動を任意の文字列で強制的に通知する
function c.PlayPassiveLineMsg(_t, _uiMsgID) return PlayPassiveLine2(_t, _uiMsgID) end

-- MISSを表示、または抑制する
function c.SetMissTypeMode(_owner, _missType, _mode, _t)
	-- print('<color=yellow>SetMissType owner=>', log:format(_owner), 'target=>', log:format(_t), ' missType=>', _missType, ' mode=>', _mode, '</color>')
	UnitSetMissTypeMode(_owner, _missType, _mode, _t)
end

-- 指定したステータスを指定したワークにロードする
-- @param _srcType 読み込み元のステータスタイプ TARGET_STATUS_XXX
-- @param _srcUnit 読み込み元のアクター識別子
-- @param _dstType ロード先のステータスタイプ TARGET_STATUS_XXX ※ワークのみ指定可能
-- @param _dstUnit ロード先のアクター識別子
function c.LoadToWork(_srcType, _srcUnit, _dstType, _dstUnit) return LoadStat2Work(_srcType, _srcUnit, _dstType, _dstUnit) end

-- 指定したクライアントキャッシュの情報を登録する
-- @param ... _cacheId, _Paramの繰り返しで幾つでも指定可能
function c.SetCacheInfo(_cacheId, _Param, ...) return SetCacheInfo(_cacheId, _Param, ...) end

----------------------------------------------------------------------------------
-- 								ログ機能の定義									--
--			ライブラリ上部で指定したログレベル以下のログしか表示しない			--
----------------------------------------------------------------------------------
function log:write(_level, ...)
local str = ''
	if _level <= LOG_LEVEL then
		for i,j in pairs({...})do
			if isTableOrClass(j, ARG_TYPE_TABLE) then j=self:ObjName(j) end
			str = str .. tostring(j)
		end
		if _level == LOG_LEVEL_INFO then
			print('LuaProcess Info : ', self.name, '(', self.id, ')\n', str)
		elseif  _level == LOG_LEVEL_ACT_INFO then
			print('LuaProcess ActInfo : ', self.name, '(', self.id, ')\n', str)
		elseif  _level == LOG_LEVEL_WARNING then
			print('<color=orange>LuaProcess Warning : ', self.name, '(', self.id, ')</color>\n', str)
		elseif  _level == LOG_LEVEL_ERROR then
			print('<b><color=red>LuaProcess Error : ', self.name, '(', self.id, ')</color>\n', str, '</b>')
		end
	end
end

----------------------------------------------------------------------------------
-- 								スキルの拡張									--
-- 						スキル系の操作はここにまとめる							--
----------------------------------------------------------------------------------
function Skill:EditMagicCost(_val, _per, _lifeType) if self:Type(SKILL_MAGIC) then return c.ProcControl(TARGET_STATUS_UNIT_REAL, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.parent:ID(), ControlTypes.MpCostID, {self:ID(), _val, _per}, _lifeType) else return false end end
function Skill:SetElement(_elem) return c.ProcControl(TARGET_STATUS_UNIT_REAL, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.parent:ID(), ControlTypes.SkillElement, {1, self:Type(), self:Index(), _elem}) end
function Skill:SetRoleDtl(_roleDtl) self.parent:SetValue(UNIT_VALUE_AI_SKILL_ROLE_DETAIL_CHANGE, true) return c.SetSkillRoleDetail(self.parent:ID(), self:Type(), self:Index(), _roleDtl) end
function Skill:Disable(_mode, _lifeType) return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_REAL, self.parent:ID(), ControlTypes.DisableSkill, {1, self:Type(), self:Index(), _mode}, _lifeType) end

----------------------------------------------------------------------------------
-- 								ユニットの拡張									--
-- 						ユニット系の操作はここにまとめる						--
----------------------------------------------------------------------------------
-- function Unit:FixDamage(_target, _min, _max) c.ProcControl(TARGET_STATUS_UNIT_WORK, self.id, TARGET_STATUS_UNIT_REAL, _target.id, ControlTypes.FixDmg, {_min, _max}) end
-- function Unit:PerDamage(_target, NowHP_Per, MaxHP_Per) c.ProcControl(TARGET_STATUS_UNIT_WORK, self.id, TARGET_STATUS_UNIT_REAL, _target.id, ControlTypes.PctDmg, {NowHP_Per, MaxHP_Per}) end
function Unit:EditLevel(_val, _per) self.cache = {} _val = self:Level() + math.floor(_val + (self:Level() * _per * Per2Num)) return c.SetUnitLevel(self.id, _val) end
function Unit:TasteCategory(_comp)
local tbl = {}
	if _comp == nil then
		if self.cache.TasteCategory == nil then
			for i,j in pairs(self:Type()) do
				tbl[CharaTaste[j]] = 0
			end
			self.cache.TasteCategory = {}
			for i,j in pairs(tbl) do
				table.insert(self.cache.TasteCategory, i)
			end
		end
		return self.cache.TasteCategory
	else
		if _comp == CHARA_TASTE_ALL then return true end
		for i,j in pairs(self:TasteCategory()) do
			if _comp == j then return true end
		end
		return false
	end
end
function Unit:UnitPureStatResist(_ailment) if self.cache.UnitPureStatResist == nil then self.cache.UnitPureStatResist = c.GetUnitStatResists(self.id, false, true) end return _ailment==nil and self.cache.UnitPureStatResist or self.cache.UnitPureStatResist[_ailment] end
function Unit:RealStatus(_statusType) if self.cache.RealStatus == nil then self.cache.RealStatus = {} end if self.cache.RealStatus[_statusType] == nil then self.cache.RealStatus[_statusType] = c.GetUnitStatus(self.id, _statusType, true) end return self.cache.RealStatus[_statusType] end
function Unit:RealHP() if self.cache.RealHP == nil then self.cache.RealHP = c.GetUnitStatus(self.id, STATUS_TYPE_HP, true) end return self.cache.RealHP end
function Unit:RealMaxHP() if self.cache.RealMaxHP == nil then self.cache.RealMaxHP = c.GetUnitStatus(self.id, STATUS_TYPE_MAX_HP, true) end return self.cache.RealMaxHP end
function Unit:RealTotalMaxHP() if self.cache.RealTotalMaxHP == nil then self.cache.RealTotalMaxHP = c.GetUnitStatus(self.id, STATUS_TYPE_TOTAL_MAX_HP, true) end return self.cache.RealTotalMaxHP end
function Unit:RealPerHP() if self.cache.RealPerHP == nil then self.cache.RealPerHP = round(self:RealHP() / self:RealMaxHP() * Pct100) end return self.cache.RealPerHP end
function Unit:RealMP() if self.cache.RealMP == nil then self.cache.RealMP = c.GetUnitStatus(self.id, STATUS_TYPE_MP, true) end return self.cache.RealMP end
function Unit:RealMaxMP() if self.cache.RealMaxMP == nil then self.cache.RealMaxMP = c.GetUnitStatus(self.id, STATUS_TYPE_MAX_MP, true) end return self.cache.RealMaxMP end
function Unit:RealPerMP() if self.cache.RealPerMP == nil then self.cache.RealPerMP = round(self:RealMP() / self:RealMaxMP() * Pct100) end return self.cache.RealPerMP end
function Unit:RealVIT() if self.cache.RealVIT == nil then self.cache.RealVIT = c.GetUnitStatus(self.id, STATUS_TYPE_VIT, true) end return self.cache.RealVIT end
function Unit:RealMaxVIT() if self.cache.RealMaxVIT == nil then self.cache.RealMaxVIT = c.GetUnitStatus(self.id, STATUS_TYPE_MAX_VIT, true) end return self.cache.RealMaxVIT end
function Unit:RealPerVIT() if self.cache.RealPerVIT == nil then self.cache.RealPerVIT = round(self:RealVIT() / self:RealMaxVIT() * Pct100) end return self.cache.RealPerVIT end
function Unit:RealSTR() if self.cache.RealSTR == nil then self.cache.RealSTR = c.GetUnitStatus(self.id, STATUS_TYPE_STR, true) end return self.cache.RealSTR end
function Unit:RealDEF() if self.cache.RealDEF == nil then self.cache.RealDEF = c.GetUnitStatus(self.id, STATUS_TYPE_DEF, true) end return self.cache.RealDEF end
function Unit:RealINT() if self.cache.RealINT == nil then self.cache.RealINT = c.GetUnitStatus(self.id, STATUS_TYPE_INT, true) end return self.cache.RealINT end
function Unit:RealMND() if self.cache.RealMND == nil then self.cache.RealMND = c.GetUnitStatus(self.id, STATUS_TYPE_MND, true) end return self.cache.RealMND end
function Unit:RealCRT() if self.cache.RealCRT == nil then self.cache.RealCRT = c.GetUnitStatus(self.id, STATUS_TYPE_CRT, true) end return self.cache.RealCRT end
function Unit:RealSpeed() if self.cache.RealSpeed == nil then self.cache.RealSpeed = c.GetUnitStatus(self.id, STATUS_TYPE_SPD, true) end return self.cache.RealSpeed end
-- 一番近い壁までの距離のみを返す
function Unit:DistanceWall()
	if self.cache.DistanceWall == nil then
		self.cache.DistanceWall = math.min(self:DistWallTop(), self:DistWallLeft(), self:DistWallRight(), self:DistWallDown())
	end
	return self.cache.DistanceWall
end
function Unit:DistWallTop() return math.abs(self:PosZ() - Field:Top()) end
function Unit:DistWallLeft() return math.abs(self:PosX() - Field:Left()) end
function Unit:DistWallRight() return math.abs(self:PosX() - Field:Right()) end
function Unit:DistWallDown() return math.abs(self:PosZ() - Field:Down()) end
function Unit:AddType(_targStat, _type, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.AddCharType, {_type}, _lifeType) end
function Unit:EditStatus(_statusType, _targStat, _val, _per, _add, _lifeType)
	if _statusType == STATUS_TYPE_HP or _statusType == STATUS_TYPE_MAX_HP then
		return self:EditMaxHP(_targStat, _val, _per, _add, _lifeType)
	elseif _statusType == STATUS_TYPE_MP or _statusType == STATUS_TYPE_MAX_MP then
		return self:EditMaxMP(_targStat, _val, _per, _add, _lifeType)
	elseif _statusType == STATUS_TYPE_STR then
		return self:EditSTR(_targStat, _val, _per, _add, _lifeType)
	elseif _statusType == STATUS_TYPE_DEF then
		return self:EditDEF(_targStat, _val, _per, _add, _lifeType)
	elseif _statusType == STATUS_TYPE_INT then
		return self:EditINT(_targStat, _val, _per, _add, _lifeType)
	elseif _statusType == STATUS_TYPE_MND then
		return self:EditMND(_targStat, _val, _per, _add, _lifeType)
	elseif _statusType == STATUS_TYPE_SPD then
		return self:EditSpeed(_val, _per, _lifeType)
	elseif _statusType == STATUS_TYPE_CRT then
		return self:EditCRT(_targStat, _val, _lifeType)
	elseif _statusType == STATUS_TYPE_SUPER_ARMOR then
		return self:SetSuperArmor(_targStat, _val, _lifeType)
	else
		return false
	end
end
function Unit:EditMaxHP(_targStat, _val, _per, _add, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.MaxHpEdit, {_val, _per, _add or 0}, _lifeType) end
function Unit:UpdateSplitHp(_val) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.SplitHp, {_val}) end
function Unit:EditMaxMP(_targStat, _val, _per, _add, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.MaxMpEdit, {_val, _per, _add or 0}, _lifeType) end
function Unit:EditMaxVIT(_targStat, _val, _per, _add, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.MaxVitEdit, {_val, _per, _add or 0}, _lifeType) end
function Unit:EditVIT(_val, _per, _isBreak) _val = math.floor(_val + (self:MaxVIT() * _per * Per2Num)) if _val == 0 then return false else if _isBreak == nil then  _isBreak = true end return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.VitIncDec, {-(_val), _isBreak and 0 or 1}) end end
function Unit:EditDecLacAtkBonus(_val, _per, _add) self.cache = {} if _val ~= 0 then self:CalcValue(LACERATION_INFO_ATK_DEC_BONUS_VAL, _val, CALCULATE_ADD) end if _per ~= nil and _per ~= 0 then self:CalcValue(LACERATION_INFO_ATK_DEC_BONUS_PER, _per, CALCULATE_ADD) end if _add ~= nil and _add ~= 0 then self:CalcValue(LACERATION_INFO_ATK_DEC_BONUS_ADD, _add, CALCULATE_ADD) end end
function Unit:EditDecLacDefBonus(_val, _per, _add) self.cache = {} if _val ~= 0 then self:CalcValue(LACERATION_INFO_DEF_DEC_BONUS_VAL, _val, CALCULATE_ADD) end if _per ~= nil and _per ~= 0 then self:CalcValue(LACERATION_INFO_DEF_DEC_BONUS_PER, _per, CALCULATE_ADD) end if _add ~= nil and _add ~= 0 then self:CalcValue(LACERATION_INFO_DEF_DEC_BONUS_ADD, _add, CALCULATE_ADD) end end
function Unit:GetLacerationAttackDamagePer() return self:GetValue(LACERATION_INFO_ATK_PER) or 0 end
function Unit:AddLacerationAttackDamagePer(_val) if _val ~= 0 then self:CalcValue(LACERATION_INFO_ATK_PER, _val, CALCULATE_ADD) end end
function Unit:GetLacerationAttackDamageLimit() return self:GetValue(LACERATION_INFO_ATK_LIMIT) or 0 end
function Unit:AddLacerationAttackDamageLimit(_val) if _val ~= 0 then self:CalcValue(LACERATION_INFO_ATK_LIMIT, _val, CALCULATE_ADD) end end
function Unit:GetLacerationDefenseDamagePer() return self:GetValue(LACERATION_INFO_DEF_TOTAL_PER) or 0 end
function Unit:AddLacerationDefenseDamagePer(_val) if _val ~= 0 then self:CalcValue(LACERATION_INFO_DEF_TOTAL_PER, _val, CALCULATE_ADD) end end
function Unit:GetLacerationDefenseDamageLimit() return self:GetValue(LACERATION_INFO_DEF_TOTAL_LIMIT) or 0 end
function Unit:AddLacerationDefenseDamageLimit(_val) if _val ~= 0 then self:CalcValue(LACERATION_INFO_DEF_TOTAL_LIMIT, _val, CALCULATE_ADD) end end
function Unit:EditMaxLAC(_val, _per, _add) self.cache = {} if _val ~= 0 then self:CalcValue(LACERATION_INFO_DEF_MAX_VAL, _val, CALCULATE_ADD) end if _per ~= nil and _per ~= 0 then self:CalcValue(LACERATION_INFO_DEF_MAX_PER, _per, CALCULATE_ADD) end if _add ~= nil and _add ~= 0 then self:CalcValue(LACERATION_INFO_DEF_MAX_ADD, _add, CALCULATE_ADD) end end
-- 蓄積量増減の効果を加味しないので、蓄積させる場合は必ず DecLAC() を使用する
function Unit:EditLAC(_val, _isLaceration)
local lac
	if _val ~= 0 then
		lac = self:LAC()
		self.cache = {}
		if -_val >= lac then
			if _isLaceration or _isLaceration==nil then
				this:SwitchSource(TARGSTAT_WORK_LOCAL, TARGTYPE_SUBJECT)
				Process:EditDamageLimit(0, 0, LACERATION_DEFAULT_LIMIT + self:GetLacerationDefenseDamageLimit(), true)
				this:DotDamage2(self, math.ceil(self:MaxHP() * (LACERATION_DEFAULT_PER + self:GetLacerationDefenseDamagePer()) * Per2Num), true)
				self:CalcValue(LACERATION_INFO_DEF_ACT_COUNT, 1, CALCULATE_ADD)
				self:CalcValue(LACERATION_INFO_DEF_NOW, _val, CALCULATE_ADD)
				Process:SetProcEventValue(PROC_TRIGGER_LACERATION_ATK, self:ID())
				this:RaiseTrigger(PROC_TRIGGER_LACERATION_ATK)
				self:RaiseTrigger(PROC_TRIGGER_LACERATION_DEF)
				self:CalcValue(LACERATION_INFO_DEF_NOW, self:MaxLAC(), CALCULATE_ADD)
				return true
			else
				self:CalcValue(LACERATION_INFO_DEF_NOW, _val, CALCULATE_ADD)
				self:CalcValue(LACERATION_INFO_DEF_NOW, self:MaxLAC(), CALCULATE_MIN)
			end
		else
			self:CalcValue(LACERATION_INFO_DEF_NOW, _val, CALCULATE_ADD)
			self:CalcValue(LACERATION_INFO_DEF_NOW, self:MaxLAC(), CALCULATE_MIN)
		end
	end
	return false
end
function Unit:DecLAC(_val)
local b4, af, key, val, res
	val = this:CalcDecLac(self, _val)
	if val > 0 then
		key = copyTable(LACERATION_INFO_DEF_TOTAL_PER_DETAIL)
		table.insert(key, this:ID())
		b4 = self:GetValue(key) or 0
		af = this:GetLacerationAttackDamagePer()
		if af > b4 then self:AddLacerationDefenseDamagePer(af - b4) self:CalcValue(key, af - b4, CALCULATE_ADD) end
		key = copyTable(LACERATION_INFO_DEF_TOTAL_LIMIT_DETAIL)
		table.insert(key, this:ID())
		b4 = self:GetValue(key) or 0
		af = this:GetLacerationAttackDamageLimit()
		if af > b4 then self:AddLacerationDefenseDamageLimit(af - b4) self:CalcValue(key, af - b4, CALCULATE_ADD) end
		res = self:EditLAC(-val, true)
		return true, res
	end
	return false
end
function Unit:EditSCT(_targStat, _val, _per, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.EditSct, {_val, _per}, _lifeType) end
function Unit:EditSkillStock(_val, _index, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.MaxSpEdit, _index and {_val, _index} or {_val}, _lifeType) end
function Unit:SetSkillStock(_val, _index, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.FixSpStock, _index and {_val, _index} or {_val}, _lifeType) end
function Unit:EditSingleSCT(_targStat, _val, _per, _index, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.EditSct, {_val, _per, _index}, _lifeType) end
function Unit:EditSingleSCT2(_targStat, _indexUi, _val, _per, _stock, _toStock, _lifeType) local skl local add = 0 local res = false  _val, _per, _stock, _toStock = _val or 0, _per or 0, _stock or 0, _toStock or 0 if _indexUi == 0 then if _stock == 0 and _toStock == 0 then return self:EditSCT(_targStat, _val, _per, _lifeType) else for i = 1, self:SkillCount(SKILL_SKILL) do add = math.ceil((_stock / Pct100) * (self:SKL_Cost(SKILL_SKILL, i) / 1000) + math.max((_toStock - (self:SKL_Charge(SKILL_SKILL, i) * 1000) / self:SKL_Cost(SKILL_SKILL, i)) * (self:SKL_Cost(SKILL_SKILL, i) / 1000), 0)) res = self:EditSingleSCT(_targStat, _val + add, _per, i) or res end return res end else if _indexUi > 0 then skl = self:GetSkillFromIndexUI(_indexUi) elseif _indexUi == -1 then skl = self:GetSkill(SKILL_SKILL, math.random(1, self:SkillCount(SKILL_SKILL))) end if skl~= nil then add = math.ceil((_stock / Pct100) * (skl:Cost() / 1000) + math.max((_toStock - (skl:Charge() * 1000) / skl:Cost()) * (skl:Cost() / 1000), 0)) return self:EditSingleSCT(_targStat, _val + add, _per, skl:Index()) end end return false end
function Unit:EditEther(_targStat, _val, _per, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.EditEther, {_val, _per}, _lifeType) end
function Unit:EditRecoverEther(_val, _per, _lifeType) return c.ProcControl(TARGET_STATUS_UNIT_REAL, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.EtherRecovPower, {_val, _per}, _lifeType) end
function Unit:EditSTR(_targStat, _val, _per, _add, _lifeType, _instantly) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.StrEdit, {_val, _per, _add or 0, _instantly and 1 or 0}, _lifeType) end
function Unit:EditDEF(_targStat, _val, _per, _add, _lifeType, _instantly) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.DefEdit, {_val, _per, _add or 0, _instantly and 1 or 0}, _lifeType) end
function Unit:EditINT(_targStat, _val, _per, _add, _lifeType, _instantly) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.IntEdit, {_val, _per, _add or 0, _instantly and 1 or 0}, _lifeType) end
function Unit:EditMND(_targStat, _val, _per, _add, _lifeType, _instantly) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.MndEdit, {_val, _per, _add or 0, _instantly and 1 or 0}, _lifeType) end
function Unit:EditCRT(_targStat, _val, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.CrtEdit, {_val}, _lifeType) end
function Unit:EditFatalBlow(_targStat, _val, _per, _add, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.FatalBlowEdit, { _val, _per, _add or 0}, _lifeType) end
function Unit:EditSpeed( _val, _per, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.SpdEdit, {_val, _per}, _lifeType) end
function Unit:FixSpeed(_val, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.SpdFix, {_val}, _lifeType) end
function Unit:EditCastSpeed(_per, _lifeType) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.ShorteningCast, {_per}, _lifeType) end
function Unit:EditCastSpeedEdit(_val, _per, _add) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.CastEdit, {_val, _per, _add or 0, 0}) end
function Unit:SetCastSpeedLimit(_per) if self:CastSpeedLimit() >= _per then return false else return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.CastMinClamp, {_per, 0}) end end
function Unit:EditStatusResist(_targStat, _type, _val, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.StatusResist, {_type, _val}, _lifeType) end
function Unit:EditElemResist(_targStat, _elem, _val, _lifeType, _editElemresistType) local res = false local judgeType = function(_type, _elemResist) if ((_type & EDIT_ELEMRESIST_TYPE_IF_WEAK == EDIT_ELEMRESIST_TYPE_IF_WEAK) and _elemResist >= 0) or ((_type & EDIT_ELEMRESIST_TYPE_IF_STRONG == EDIT_ELEMRESIST_TYPE_IF_STRONG) and _elemResist <= 0) then return false end return true end local calcVal = function (_type, _val, _elemResist) local val = _val if _type & EDIT_ELEMRESIST_TYPE_TO_ZERO == EDIT_ELEMRESIST_TYPE_TO_ZERO then val = val - _elemResist end return val end _editElemresistType = _editElemresistType or EDIT_ELEMRESIST_TYPE_NORMAL if _elem ~= ELEMENT_NONE then if _elem == ELEMENT_ALL then for i = ELEMENT_FIRE, ELEMENT_DARK do if judgeType(_editElemresistType, self:ElemResist(i)) then res = c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.ElemResist, {i, calcVal(_editElemresistType, _val, self:ElemResist(i))}, _lifeType) or res end end return res else if judgeType(_editElemresistType, self:ElemResist(_elem)) then return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.ElemResist, {_elem, calcVal(_editElemresistType, _val, self:ElemResist(_elem))}, _lifeType) end end self.cache = {} end return false end
function Unit:EditEquipStatus(_targStat, _equipType, _statusType, _per, _lifeType) self.cache = {} return c.ProcControl(TARGET_STATUS_UNIT_REAL, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.EquipParam, {_equipType, _statusType, _per}, _lifeType) end
function Unit:SetEquipPermission(_equipType, _bool) return c.ProcControl(TARGET_STATUS_UNIT_REAL, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.EquipPropriety, {_equipType, _bool and 1 or 0}) end
-- 2022/3/14更新にて暗黙的に詠唱SAも操作するように変更(マスタ設定は使用不可)
function Unit:SetSuperArmor(_targStat, _val, _lifeType) self.cache = {} c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.CastSuperArmor, {_val}, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.SuperArmor, {_val}, _lifeType) end
function Unit:SetCastSuperArmor(_targStat, _val, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.CastSuperArmor, {_val}, _lifeType) end
function Unit:SetDamagePer(_targStat, _per, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.DmgPower, {_per}, _lifeType) end
function Unit:SetHealPer(_targStat, _per, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.HpRecovPower, {_per}, _lifeType) end
function Unit:DisableHeal(_targStat, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.DisableHeal, {}, _lifeType) end
function Unit:SetGuard(_targStat, _prob, _per, _lifeType, _showPassive) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.AutoGuard, {_prob, _per}, _lifeType, _showPassive) end
function Unit:SetMagicGuard(_targStat, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.MagicGuardable, {}, _lifeType) end
function Unit:EditGuardProb(_targStat, _val, _per, _add, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.GuardRate, {_val, _per, _add}, _lifeType) end
function Unit:EditGuardPer(_targStat, _val, _per, _add, _lifeType, _showPassive) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.GuardValue, {_val, _per, _add}, _lifeType, _showPassive) end
function Unit:EditGuardHp(_targStat, _val, _per, _add, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.GuardEndure, {_val, _per, _add}, _lifeType) end
-- function Unit:GuardBreak() return c.ProcControl(TARGET_STATUS_UNIT_WORK, self.id, TARGET_STATUS_UNIT_WORK, self.id, ControlTypes.GuardBreak) end
function Unit:SetCounter(_targStat, _prob, _per, _skyCounter, _warpCounter, _bulletSA, _bulletCastSA, _skillId, _lifeType, _showPassive) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.Counter, {_prob, _per, (_skyCounter and 1 or 0) + (_warpCounter and 2 or 0), _bulletSA or 0, _bulletCastSA or 0, _skillId or 0}, _lifeType, _showPassive) end
function Unit:SetMagicCounter(_targStat, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.MagicCounterable, {}, _lifeType) end
function Unit:EditCounterProb(_targStat, _val, _per, _add, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.CounterRate, {_val, _per, _add}, _lifeType) end
function Unit:EditCounterPer(_targStat, _val, _per, _add, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.CounterValue, {_val, _per, _add}, _lifeType) end
function Unit:SetMagicCritical(_targStat, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.MagicCritical, {}, _lifeType) end
function Unit:SetMultiMagic(_dmgPer) return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.MultiBullet, {_dmgPer or Pct100}) end
function Unit:EditHate(_val, _lifeType) self.cache = {} return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.Targetability, {_val}, _lifeType) end
function Unit:EditRecoverMp(_targStat, _per, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.MpRecovPower, {_per}, _lifeType) end
function Unit:EditRecoverSCT(_targStat, _val, _per, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.SctRecovVal, {_val, _per}, _lifeType) end
function Unit:EditRecoverSingleSCT(_targStat, _val, _per, _index, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.SctRecovVal, {_val, _per, _index}, _lifeType) end
function Unit:SetEndure(_targStat, _hpPer, _amount, _lifeType) if Bullet:IsEndure() then return false end return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.Endure, {_hpPer, _amount}, _lifeType) end
function Unit:Barrier(_targStat, _hp, _mode, _lifeType) return c.ProcControl(self.source, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.KBBarrier, {_hp, _mode}, _lifeType) end
function Unit:Revive(_per, _start, _end) return c.ProcControl(TARGET_STATUS_UNIT_WORK, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.Resurrect, {_per, _start or 10, _end or 30}) end
function Unit:SetReraise(_targStat, _per, _cnt, _start, _end, _lifeType) return c.ProcControl(TARGET_STATUS_UNIT_WORK, self.id, TARGTYPE_UNIT+_targStat, self.id, ControlTypes.Reraise, {_per, _cnt, _start or 10, _end or 30}, _lifeType) end
-- function Unit:Drain(_per) end
function Unit:Break() return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.VitZeroDmg, {}) end
function Unit:EditBreakTime(_per, _lifeType) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.BreakTime, {_per}, _lifeType) end
function Unit:BreakSetting(_id, _txtId, _txtColor, _effColor1, _effColor2, _bgEffId, _bgEffColor, _lifeType) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.BreakSetting, {_id or 0, _txtId or 0, _txtColor or 0, _effColor1 or 0, _effColor2 or 0, _bgEffId or 0, _bgEffColor or 0}, _lifeType) end
function Unit:SetAilment(_type, _lifeTime, _showMiss) local res self.cache = {} res = c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.AddStat, {_type, (_lifeTime or 0)>0 and _lifeTime or AilmentLifeTimes[_type]}) if _showMiss then if res then Process:HideMiss(self, MISS_TYPE_AILMENT) else Process:ShowMiss(self, MISS_TYPE_AILMENT) end end return res end
function Unit:RemoveAilment(_type, _showMiss) local res self.cache = {} res = c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.RemoveStat, {_type}) if _showMiss then if res then Process:HideMiss(self, MISS_TYPE_AILMENT_REMOVE) else Process:ShowMiss(self, MISS_TYPE_AILMENT_REMOVE) end end return res end
function Unit:EditAilmentTime(_type, _per, _lifeType) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.BadStatusTime, {_type, _per}, _lifeType) end
-- function Unit:SetBuff(_id, _param, _lifeType, _missType, _behavior, _options) local res = c.BuffControl(self.id, _id, _param, _lifeType==LIFETYPE_CONTINUOUS and myTrigger or _lifeType, _behavior or BuffParamBehavior[_id], _options) if _missType ~= nil then if res then Process:HideMiss(self, _missType) else Process:ShowMiss(self, _missType) end end return res end
function Unit:SetBuff(_id, _param, _lifeType, _missType, _behavior, _quote, _overrideIconId, _overrideNameId, _overrideDescriptionId) local tbl, quote, buffMst, res if not _id or _id == 0 then log:write(LOG_LEVEL_ERROR, 'SetBuff Failed : _id is not valid') return false end if not Buff:Enable() or not this:IsRemote() then if IsVariableTextBuff[_id] then if not isTableOrClass(_quote) then _quote = {} for i = 1, IsVariableTextBuff[_id] do table.insert(_quote, 0) end end quote = {} for i,j in ipairs(_quote) do table.insert(quote, '1:1:-:[1]:+:' .. j) end buffMst = Field:GetBuffMstInfo(_id) tbl = {[BUFF_INFO_QUOTE] = quote, [BUFF_INFO_NAME] = buffMst[BUFF_INFO_NAME], [BUFF_INFO_DESCRIPTION] = buffMst[BUFF_INFO_DESCRIPTION]} end if _overrideIconId then if not isTableOrClass(tbl) then tbl = {} end tbl[BUFF_INFO_ICON_ID] = _overrideIconId end if _overrideNameId then if not isTableOrClass(tbl) then tbl = {} end tbl[BUFF_INFO_NAME] = _overrideNameId end if _overrideDescriptionId then if not isTableOrClass(tbl) then tbl = {} end tbl[BUFF_INFO_DESCRIPTION] = _overrideDescriptionId end res = c.BuffControl(self.id, _id, _param, _lifeType==LIFETYPE_CONTINUOUS and myTrigger or _lifeType, _behavior or BuffParamBehavior[_id], tbl) if _missType ~= nil then if res then Process:HideMiss(self, _missType) else Process:ShowMiss(self, _missType) end end return res else return false end end
function Unit:RemoveBuff(_buffGroup, _buffType) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.RemoveBuff, {_buffType or 2, _buffGroup}) end
function Unit:ExpireBuff(_buffUID) return c.RemoveBuff(self.id, _buffUID) end
function Unit:ExpireBuffCategory(_buffCate) for i,bff in pairs(self:GetBuffCategoryBuffs(_buffCate)) do self:ExpireBuff(bff[BUFF_INFO_UID]) end end
function Unit:PreCast(_lv, _lifeType) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.PreCast, {_lv}, _lifeType) end
function Unit:EditPreCastSpeed(_type, _val, _per, _lifeType) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.PreCastSpeed, {_type, _val, _per}, _lifeType) end
function Unit:Kill(_dmgPop) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.SuddenDeath, {_dmgPop or 0}) end
function Unit:Damage(_t, _type, _per) if _type==DAMAGE_TYPE_PHYSICAL or _type==DAMAGE_TYPE_MAGICAL then return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, _t:ID(), _type, {_per}) end return false end
function Unit:DotDamage(_val, _isFatal) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.SimpleDmg, {_val, _isFatal and 1 or 0}) end
function Unit:DotDamage2(_t, _val, _isFatal) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, _t:ID(), ControlTypes.SimpleDmg, {_val, _isFatal and 1 or 0}) end
function Unit:Heal(_t, _val, _per) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, _t:ID(), ControlTypes.Recover, {_val, _per, true}) end
function Unit:HealPct(_t, _val, _per) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, _t:ID(), ControlTypes.PctRecover, {_val, _per}) end
function Unit:HealMp(_t, _val, _per) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, _t:ID(), ControlTypes.MpRecover, {_val, _per}) end
function Unit:FixMpDamage(_min, _max) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.FixMPDmg, {_min, _max}) end
function Unit:PctMpDamage(NowMP_Per, MaxMP_Per) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.PctMPDmg, {NowMP_Per, MaxMP_Per}) end
function Unit:DecMp(_val, _per) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.MpDec, {_val, _per}) end
function Unit:EditMagicCost(_val, _per, _type, _elem, _lv, _kind)
local skl
local res
	if _lv==nil and _kind==nil then
		if _elem==nil then
			return c.ProcControl(TARGET_STATUS_UNIT_REAL, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.ReductionMpCost, {_type or 0, _val, _per})
		elseif _type==nil then
			return c.ProcControl(TARGET_STATUS_UNIT_REAL, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.MpCostElem, {_elem, _val, _per})
		end
	end
	for i = 1, self:SkillCount(SKILL_MAGIC) do
		skl = self:GetSkill(SKILL_MAGIC, i)
		if _type==nil or _type==skl:Role() then
			if _elem==nil or _elem==skl:Element() then
				if _lv==nil or _lv==skl:CastLevel() then
					if _kind==nil or _kind==skl:Kind() then
						res = c.ProcControl(TARGET_STATUS_UNIT_REAL, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.MpCostID, {skl:ID(), _val, _per})
					end
				end
			end
		end
	end
	return res
end
-- _condFunc にはskillオブジェクトを引数にそのスキルが対象かどうかbool値を返すような関数を指定
-- スキルロールまたはスキル属性のみを条件とする場合は _condFunc に{スキルロール, スキル属性}となるような配列を指定する(どちらか片方のみ指定可能)
function Unit:EditMagicCost2(_val, _per, _condFunc, _lifeType)
local skl, res, tbl
	if isTableOrClass(_condFunc) then
		if _condFunc[2] == nil then
			return c.ProcControl(TARGET_STATUS_UNIT_REAL, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.ReductionMpCost, {_condFunc[1] or 0, _val, _per}, _lifeType)
		elseif _condFunc[1] == nil then
			return c.ProcControl(TARGET_STATUS_UNIT_REAL, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.MpCostElem, {_condFunc[2], _val, _per}, _lifeType)
		else
			tbl = {_condFunc[1],_condFunc[2]}
			_condFunc = function(skl) return (skl:Role(tbl[1]) and skl:Element(tbl[2])) end
		end
	end
	for i = 1, self:SkillCount(SKILL_MAGIC) do
		skl = self:GetSkill(SKILL_MAGIC, i)
		if _condFunc(skl) then
			res = c.ProcControl(TARGET_STATUS_UNIT_REAL, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.MpCostID, {skl:ID(), _val, _per}, _lifeType) or res
		end
	end
	return res
end
function Unit:Steal() return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.Steal, {}) end
function Unit:RaiseTrigger(_trigger, _delay, _option) local t = self:GetValue(UNIT_VALUE_PROCESS_EVENT_INFO) or {} if self.cache.SetProcEventValue ~= nil then t[_trigger] = self.cache.SetProcEventValue[_trigger] else t[_trigger] = nil end self:SetValue(UNIT_VALUE_PROCESS_EVENT_INFO, t, false) c.RaiseProcTrigger(self:ID(), _trigger, _delay, _option) end
function Unit:SubProc(_index, _targ, _prob, _params, _optionParams) return c.ExecSubProcess(_index, self:ID(), _targ:ID(), _prob, _params, _optionParams) end
function Unit:SKL_SetElement(skillType, skillIndex, _elem) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:SetElement(_elem) else return false end end
function Unit:SKL_SetRoleDtl(skillType, skillIndex, _roleDtl) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:SetRoleDtl(_roleDtl) else return false end end
function Unit:ActivateSkill(_index, _lifeType) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.ActivateSkill, {_index or 0}, _lifeType) end
function Unit:ActivateSpecial(_index, _lifeType) return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.ActivateSpecial, {_index or 0}, _lifeType) end
function Unit:ItemDrop(_index) local res = c.ProcControl(TARGET_STATUS_UNIT_REAL, units:GetOperationUnit():ID(), TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.ItemDrop, {_index}) if res then c.DropItemPopUI(self.id, _index) end return res end
function Unit:ForbidSkill() return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.Uncontrol, {0}) end
function Unit:ForbidMagic() return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.Uncontrol, {1}) end
function Unit:ForbidSkillAndMagic() return c.ProcControl(self.source, self.id, TARGET_STATUS_UNIT_REAL, self.id, ControlTypes.Uncontrol, {2}) end
function Unit:SetSkillGroupLimit(_skillGroup, _cnt, _calcType, _lifeType)
local buid
local cnt = _cnt
local tbl = self:GetValue({_lifeType == 2 and UNIT_VALUE_SKILL_GROUP_LIMIT_INFO_EVER or UNIT_VALUE_SKILL_GROUP_LIMIT_INFO, _skillGroup}) or {}
	if _calcType == 0 then
		if _cnt == 0 then return end
		cnt = (tbl.Count or 0) + _cnt
		if _lifeType == 0 and cnt < 0 then
			self:SetSkillGroupLimit(_skillGroup, cnt, _calcType, 2)
			_lifeType = 1
		end
		if tbl.Count == nil and _cnt < 0 then return end
		cnt = math.max(cnt, 0)
	end
	if _calcType <= 1 then
		tbl.Count = math.min(cnt, tbl.Limit or math.maxinteger)
		if cnt ~= 0 then
			for i,bi in pairs(tbl.BuffInfo or {}) do
				for j,bff in pairs(bi or {}) do
					self:ExpireBuff(bff)
				end
			end
			tbl.BuffInfo = {}
		else
			for i,skl in pairs(self:GetSkillsFromSkillGroup(_skillGroup)) do
				if tableGetValue(tbl, {'BuffInfo', skl:Type(), skl:Index()}) == nil then
					buid = self:SetBuff(_lifeType == 2 and DebuffIds.S_DisableSkill or DebuffIds.S_DisableSkill_WAVE, {-1, skl:Type(), skl:Index()})
					if buid then tableSetValue(tbl, {'BuffInfo', skl:Type(), skl:Index()}, buid) end
				end
			end
		end
	elseif _calcType == 2 then
		if _cnt < 0 then
			tbl.Limit = nil
		else
			tbl.Limit = _cnt
			if _cnt == 0 then
				self:SetSkillGroupLimit(_skillGroup, 0, 1, _lifeType)
			else
				tbl.Count = math.min(tbl.Count, _cnt)
			end
		end
	end
	self:SetValue({_lifeType == 2 and UNIT_VALUE_SKILL_GROUP_LIMIT_INFO_EVER or UNIT_VALUE_SKILL_GROUP_LIMIT_INFO, _skillGroup}, tbl, (_lifeType == 2))
end
function Unit:GetSupportPassiveInfo(id)
local res = {}
local tbl = Field:GetValue({FIELD_VALUE_SUPPORT_PASSIVE_INFO, self:Side(), id}) or {}
local spl
	for i,sp in pairs(tbl) do
		if isTableOrClass(sp) and sp['CurrentLv'] ~= nil then
			spl = tableGetValue(sp, {'Info', sp['CurrentLv']})
			if isTableOrClass(spl) then
				for u,b in pairs(spl['ParentUID'] or {}) do
					if u ~= self:ID() then
						table.insert(res, {sp['Category'], sp['CurrentLv'], spl['BuffInfo']})
						break
					end
				end
			end
		end
	end
	return res
end
function Unit:SwitchSource(_targStat, _targType) _targType = _targType or TARGTYPE_UNIT if not self.cache.usedlocal and _targStat==TARGSTAT_WORK_LOCAL then c.LoadToWork(_targType+TARGSTAT_WORK, self.id, _targType+TARGSTAT_WORK_LOCAL, self.id) self.cache.usedlocal = true end self.source = _targType+_targStat end
Unit.AddGeneralCountP = Unit.AddGeneralCount
function Unit:AddGeneralCount(_index, _cnt, _option, _prm, _force) if _force or NonLocalTriggers[myTrigger] or not self:IsRemote() then return self:AddGeneralCountP(_index, _cnt, _option, _prm) else return false, 0 end end
function Unit:SetSkillValue(_index, _puid, _val, _option)
local CalcOptionAdd, CalcOptionOverwrite, CalcOptionMul = 0, 1, 2
local t = self:GetValue(UNIT_VALUE_SKILL_INFO) or {}
local pt = t[_puid]
	if pt == nil then pt = {} self:SetBuff(BuffIds.S_SkillInfoControl, {-1, _puid}) end
	if _index == nil then
		pt = isTableOrClass(_val) and _val or {}
	elseif _option == nil or _option == CalcOptionOverwrite then
		pt[_index] = _val
	else
		if not isNumber(_val) then _val = _val and 1 or 0 end
		if _option == CalcOptionAdd then
			if (_val or 0)==0 then return false end
			pt[_index] = (pt[_index] or 0) + (_val or 0)
		elseif _option == CalcOptionMul then
			pt[_index] = (pt[_index] or 0) * (_val or 0)
		end
	end
	t[_puid] = pt
	self:SetValue(UNIT_VALUE_SKILL_INFO, t, false)
	return true
end
function Unit:AddBulletValue(_buid, _index, _cnt, _calc, _isLifeTypeHit)
	if not isNumber(_cnt) then
		log:write(LOG_LEVEL_ERROR, 'AddGeneralCount Failed : cnt is not number')
		return false
	end
	_calc = (_calc~=0 and _calc or CALCULATE_ADD)
	return calculateCS(_calc, _cnt, c.CalcBulletLuaValue, {_buid, _index, _cnt, _calc, _isLifeTypeHit}, 4, 3, c.GetBulletLuaValue, {_buid, _index})
end
function Unit:GetBulletValue(_buid, _index) return c.GetBulletLuaValue(_buid, _index) or 0 end
function Unit:SetProcValueOld(_val, _ever, _affiliation, _localID, _index)
local pindex, aff, lid = _index or Process:Index() or 0, _affiliation or Process:Affiliation(), _localID or Process:localID()
local t = self:GetValue(UNIT_VALUE_PROCESS_INFO) or {}
local at = t[aff] or {}
local lt = at[lid] or {}
	lt[pindex] = _val
	at[lid] = lt
	t[aff] = at
	self:SetValue(UNIT_VALUE_PROCESS_INFO, t, false)
	if _ever then
		t = self:GetValue(UNIT_VALUE_PROCESS_INFO_EVER) or {}
		at = t[aff] or {}
		lt = at[lid] or {}
		lt[pindex] = _val
		at[lid] = lt
		t[aff] = at
		self:SetValue(UNIT_VALUE_PROCESS_INFO_EVER, t, true)
	end
end
function Unit:GetProcValueOld(_affiliation, _localID, _index)
local pindex, aff, lid = _index or Process:Index() or 0, _affiliation or Process:Affiliation(), _localID or Process:localID()
local te, ate, lte
local t = self:GetValue(UNIT_VALUE_PROCESS_INFO) or {}
local at = t[aff] or {}
local lt = at[lid] or {}
	if lt[pindex] == nil then
		te = self:GetValue(UNIT_VALUE_PROCESS_INFO_EVER)
		if te == nil then return nil end
		ate = te[aff]
		if ate == nil then return nil end
		lte = ate[lid]
		if lte == nil or lte[pindex] == nil then return nil end
		self:SetProcValue(lte[pindex])
		return lte[pindex]
	else
		return lt[pindex]
	end
end
function Unit:SetProcValue(_val, _ever, _affiliation, _localID, _index)
local pindex, aff, lid = _index or Process:Index() or 0, _affiliation or Process:Affiliation(), _localID or Process:localID()
local id = self:ID()
	c.UnitSetProcValue(id, aff, lid, pindex, UNIT_VALUE_PROCESS_INFO, _val, false)
	if _ever then
		c.UnitSetProcValue(id, aff, lid, pindex, UNIT_VALUE_PROCESS_INFO_EVER, _val, true)
	end
end
function Unit:GetProcValue(_affiliation, _localID, _index)
local pindex, aff, lid = _index or Process:Index() or 0, _affiliation or Process:Affiliation(), _localID or Process:localID()
local id = self:ID()
local val = c.UnitGetProcValue(id, aff, lid, pindex, UNIT_VALUE_PROCESS_INFO)
	if val == nil then
		val = c.UnitGetProcValue(id, aff, lid, pindex, UNIT_VALUE_PROCESS_INFO_EVER)
		if val ~=nil then
			c.UnitSetProcValue(id, aff, lid, pindex, UNIT_VALUE_PROCESS_INFO, val)
		end
	end
	return val
end
function Unit:CalcProcValue(_key, _val, _calc, _ever, _affiliation, _localID, _index)
local pindex, aff, lid = _index or Process:Index() or 0, _affiliation or Process:Affiliation(), _localID or Process:localID()
local id = self:ID()
	if not isTableOrClass(_key) then _key = {_key} end
	_key = {UNIT_VALUE_PROCESS_INFO, aff, lid, pindex, table.unpack(_key)}
	self:CalcValue(_key, _val, _calc, false)
	if _ever then
		_key[1] = UNIT_VALUE_PROCESS_INFO_EVER
		self:CalcValue(_key, _val, _calc, true)
	end
end
function Unit:SetProcCondValue(_val, _ever, _affiliation, _localID, _index)
local pindex, aff, lid = _index or Process:Index() or 0, _affiliation or Process:Affiliation(), _localID or Process:localID()
local id = self:ID()
	c.UnitSetProcValue(id, aff, lid, pindex, UNIT_VALUE_PROCESS_COND_INFO, _val, false)
	if _ever then
		c.UnitSetProcValue(id, aff, lid, pindex, UNIT_VALUE_PROCESS_COND_INFO_EVER, _val, true)
	end
end
function Unit:GetProcCondValue(_affiliation, _localID, _index)
local pindex, aff, lid = _index or Process:Index() or 0, _affiliation or Process:Affiliation(), _localID or Process:localID()
local id = self:ID()
local val = c.UnitGetProcValue(id, aff, lid, pindex, UNIT_VALUE_PROCESS_COND_INFO)
	if val == nil then
		val = c.UnitGetProcValue(id, aff, lid, pindex, UNIT_VALUE_PROCESS_COND_INFO_EVER)
		if val ~=nil then
			c.UnitSetProcValue(id, aff, lid, pindex, UNIT_VALUE_PROCESS_COND_INFO, val)
		end
	end
	return val
end

function Unit:FrameUpdate()
	self.cache = {}
	return true
end
Unit.new = function(_id)
local obj = {}
	obj.super = Unit
	obj.type = C_TYPE_UNIT
	obj.id = _id
	obj.name = c.GetUnitName(_id)
	obj.method = {}
	obj.method.parent = obj
	obj.cache = {}
	obj.skill = 0
	obj.scnt = 0
	obj.side = c.GetUnitSide(obj.id)
	
	obj.source = TARGET_STATUS_UNIT_WORK
	obj.cache.usedlocal = false
	
	setmetatable(obj.method,{__index = LoggingMethod})
	setmetatable(obj,{__index = obj.method, __newindex = AddLoggingMethod})

	return obj
end

----------------------------------------------------------------------------------
-- 							ユニットリストの拡張								--
----------------------------------------------------------------------------------
UnitList.ProcTargetCond[200] = function(self, _side, _option) if Process:Affiliation(nil, false, PROC_AFFILIATION_AUTOSKILL) then local condFunc, res local ulist = self:GetCondUnitList(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_NONE + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) if #ulist >= 1 then condFunc = newCompare(function(_unit) return _unit:HavePassive(Process:localID()), COMPARE_EQUAL, true end) res = {} for i, j in pairs(ulist) do res = (condFunc(j)) end if #res >= 2 then return self:PickUnitFromUlist(res) else return res[1] end end end end


----------------------------------------------------------------------------------
-- 								バレットの定義									--
-- 						バレット系の関数はここにまとめる						--
-- 		※1フレーム内で複数回GETしても、C#側の関数が呼ばれるのは1度だけ			--
----------------------------------------------------------------------------------
-- バレットのメソッドを先に定義
BulletFunc = {}
function BulletFunc:Parent() return self.parent end
function BulletFunc:Target() return self.target end
function BulletFunc:TargetSide(_comp)
	if _comp == nil then
		if self.cache.TargetSide == nil then
			self.cache.TargetSide = self:MST_Info(BULLET_PROPERTY_TARGET_SIDE)
			if self.cache.TargetSide == nil then
				self.cache.TargetSide = self:Parent():RelativeSide(self:Target())
			end
		end
		return self.cache.TargetSide
	else
		if _comp == TARGET_SIDE_ALL then return true end
		res = c.GetBulletProperty(self:UID(), BULLET_PROPERTY_TARGET_SIDE, _comp)
		if res == nil then
			res = self:Parent():RelativeSide(self:Target(), _comp)
		end
		return res
	end
end
function BulletFunc:UID() if self.cache.UID == nil then self.cache.UID = c.GetBulletUID() end return self.cache.UID end
function BulletFunc:MST_Info(bulletProperty) if self.cache.MST_Info == nil then self.cache.MST_Info = {} end if self.cache.MST_Info[bulletProperty] == nil then self.cache.MST_Info[bulletProperty] = c.GetBulletProperty(self:UID(), bulletProperty) end return self.cache.MST_Info[bulletProperty] end
function BulletFunc:MST_Set(bulletProperty, _val) c.SetBulletProperty(self:UID(), bulletProperty, _val) self.cache.MST_Info = {}  end
function BulletFunc:Status(_statusType) if self.cache.Status == nil then self.cache.Status = {} end if self.cache.Status[_statusType] == nil then self.cache.Status[_statusType] = c.GetBulletStatus(_statusType) end return self.cache.Status[_statusType] end
function BulletFunc:HitIndex() return self:MST_Info(BULLET_PROPERTY_HIT_INDEX) end
function BulletFunc:HP() if self.cache.HP == nil then self.cache.HP = c.GetBulletStatus(STATUS_TYPE_HP) end return self.cache.HP end
function BulletFunc:MaxHP() if self.cache.MaxHP == nil then self.cache.MaxHP = c.GetBulletStatus(STATUS_TYPE_MAX_HP) end return self.cache.MaxHP end
function BulletFunc:PerHP() if self.cache.PerHP == nil then self.cache.PerHP = round(self:HP() / self:MaxHP() * Pct100) end return self.cache.PerHP end
function BulletFunc:MP() if self.cache.MP == nil then self.cache.MP = c.GetBulletStatus(STATUS_TYPE_MP) end return self.cache.MP end
function BulletFunc:MaxMP() if self.cache.MaxMP == nil then self.cache.MaxMP = c.GetBulletStatus(STATUS_TYPE_MAX_MP) end return self.cache.MaxMP end
function BulletFunc:PerMP() if self.cache.PerMP == nil then self.cache.PerMP = round(self:MP() / self:MaxMP() * Pct100) end return self.cache.PerMP end
function BulletFunc:VIT() if self.cache.VIT == nil then self.cache.VIT = c.GetBulletStatus(STATUS_TYPE_VIT) end return self.cache.VIT end
function BulletFunc:MaxVIT() if self.cache.MaxVIT == nil then self.cache.MaxVIT = c.GetBulletStatus(STATUS_TYPE_MAX_VIT) end return self.cache.MaxVIT end
function BulletFunc:PerVIT() if self.cache.PerVIT == nil then self.cache.PerVIT = round(self:VIT() / self:MaxVIT() * Pct100) end return self.cache.PerVIT end
function BulletFunc:STR() if self.cache.STR == nil then self.cache.STR = c.GetBulletStatus(STATUS_TYPE_STR) end return self.cache.STR end
function BulletFunc:DEF() if self.cache.DEF == nil then self.cache.DEF = c.GetBulletStatus(STATUS_TYPE_DEF) end return self.cache.DEF end
function BulletFunc:INT() if self.cache.INT == nil then self.cache.INT = c.GetBulletStatus(STATUS_TYPE_INT) end return self.cache.INT end
function BulletFunc:MND() if self.cache.MND == nil then self.cache.MND = c.GetBulletStatus(STATUS_TYPE_MND) end return self.cache.MND end
function BulletFunc:CRT() if self.cache.CRT == nil then self.cache.CRT = c.GetBulletStatus(STATUS_TYPE_CRT) end return self.cache.CRT end
function BulletFunc:Speed() if self.cache.Speed == nil then self.cache.Speed = c.GetBulletStatus(STATUS_TYPE_SPD) end return self.cache.Speed end
function BulletFunc:SampleStatus(_statusType) if self.cache.SampleStatus == nil then self.cache.SampleStatus = {} end if self.cache.SampleStatus[_statusType] == nil then self.cache.SampleStatus[_statusType] = c.GetBulletStatus(_statusType, true) end return self.cache.SampleStatus[_statusType] end
function BulletFunc:SampleHP() if self.cache.SampleHP == nil then self.cache.SampleHP = c.GetBulletStatus(STATUS_TYPE_HP, true) end return self.cache.SampleHP end
function BulletFunc:SampleMaxHP() if self.cache.SampleMaxHP == nil then self.cache.SampleMaxHP = c.GetBulletStatus(STATUS_TYPE_MAX_HP, true) end return self.cache.SampleMaxHP end
function BulletFunc:SamplePerHP() if self.cache.SamplePerHP == nil then self.cache.SamplePerHP = round(self:SampleHP() / self:SampleMaxHP() * Pct100) end return self.cache.SamplePerHP end
function BulletFunc:SampleMP() if self.cache.SampleMP == nil then self.cache.SampleMP = c.GetBulletStatus(STATUS_TYPE_MP, true) end return self.cache.SampleMP end
function BulletFunc:SampleMaxMP() if self.cache.SampleMaxMP == nil then self.cache.SampleMaxMP = c.GetBulletStatus(STATUS_TYPE_MAX_MP, true) end return self.cache.SampleMaxMP end
function BulletFunc:SamplePerMP() if self.cache.SamplePerMP == nil then self.cache.SamplePerMP = round(self:SampleMP() / self:SampleMaxMP() * Pct100) end return self.cache.SamplePerMP end
function BulletFunc:SampleVIT() if self.cache.SampleVIT == nil then self.cache.SampleVIT = c.GetBulletStatus(STATUS_TYPE_VIT, true) end return self.cache.SampleVIT end
function BulletFunc:SampleMaxVIT() if self.cache.SampleMaxVIT == nil then self.cache.SampleMaxVIT = c.GetBulletStatus(STATUS_TYPE_MAX_VIT, true) end return self.cache.SampleMaxVIT end
function BulletFunc:SamplePerVIT() if self.cache.SamplePerVIT == nil then self.cache.SamplePerVIT = round(self:SampleVIT() / self:SampleMaxVIT() * Pct100) end return self.cache.SamplePerVIT end
function BulletFunc:SampleSTR() if self.cache.SampleSTR == nil then self.cache.SampleSTR = c.GetBulletStatus(STATUS_TYPE_STR, true) end return self.cache.SampleSTR end
function BulletFunc:SampleDEF() if self.cache.SampleDEF == nil then self.cache.SampleDEF = c.GetBulletStatus(STATUS_TYPE_DEF, true) end return self.cache.SampleDEF end
function BulletFunc:SampleINT() if self.cache.SampleINT == nil then self.cache.SampleINT = c.GetBulletStatus(STATUS_TYPE_INT, true) end return self.cache.SampleINT end
function BulletFunc:SampleMND() if self.cache.SampleMND == nil then self.cache.SampleMND = c.GetBulletStatus(STATUS_TYPE_MND, true) end return self.cache.SampleMND end
function BulletFunc:SampleCRT() if self.cache.SampleCRT == nil then self.cache.SampleCRT = c.GetBulletStatus(STATUS_TYPE_CRT, true) end return self.cache.SampleCRT end
function BulletFunc:SampleSpeed() if self.cache.SampleSpeed == nil then self.cache.SampleSpeed = c.GetBulletStatus(STATUS_TYPE_SPD, true) end return self.cache.SampleSpeed end
function BulletFunc:PureStatus(_statusType) if self.cache.PureStatus == nil then self.cache.PureStatus = {} end if self.cache.PureStatus[_statusType] == nil then self.cache.PureStatus[_statusType] = c.GetBulletStatus(_statusType, true, false) end return self.cache.PureStatus[_statusType] end
function BulletFunc:PureHP() if self.cache.PureHP == nil then self.cache.PureHP = c.GetBulletStatus(STATUS_TYPE_HP, true, false) end return self.cache.PureHP end
function BulletFunc:PureMaxHP() if self.cache.PureMaxHP == nil then self.cache.PureMaxHP = c.GetBulletStatus(STATUS_TYPE_MAX_HP, true, false) end return self.cache.PureMaxHP end
function BulletFunc:PurePerHP() if self.cache.PurePerHP == nil then self.cache.PurePerHP = round(self:PureHP() / self:PureMaxHP() * Pct100) end return self.cache.PurePerHP end
function BulletFunc:PureMP() if self.cache.PureMP == nil then self.cache.PureMP = c.GetBulletStatus(STATUS_TYPE_MP, true, false) end return self.cache.PureMP end
function BulletFunc:PureMaxMP() if self.cache.PureMaxMP == nil then self.cache.PureMaxMP = c.GetBulletStatus(STATUS_TYPE_MAX_MP, true, false) end return self.cache.PureMaxMP end
function BulletFunc:PurePerMP() if self.cache.PurePerMP == nil then self.cache.PurePerMP = round(self:PureMP() / self:PureMaxMP() * Pct100) end return self.cache.PurePerMP end
function BulletFunc:PureVIT() if self.cache.PureVIT == nil then self.cache.PureVIT = c.GetBulletStatus(STATUS_TYPE_VIT, true, false) end return self.cache.PureVIT end
function BulletFunc:PureMaxVIT() if self.cache.PureMaxVIT == nil then self.cache.PureMaxVIT = c.GetBulletStatus(STATUS_TYPE_MAX_VIT, true, false) end return self.cache.PureMaxVIT end
function BulletFunc:PurePerVIT() if self.cache.PurePerVIT == nil then self.cache.PurePerVIT = round(self:PureVIT() / self:PureMaxVIT() * Pct100) end return self.cache.PurePerVIT end
function BulletFunc:PureSTR() if self.cache.PureSTR == nil then self.cache.PureSTR = c.GetBulletStatus(STATUS_TYPE_STR, true, false) end return self.cache.PureSTR end
function BulletFunc:PureDEF() if self.cache.PureDEF == nil then self.cache.PureDEF = c.GetBulletStatus(STATUS_TYPE_DEF, true, false) end return self.cache.PureDEF end
function BulletFunc:PureINT() if self.cache.PureINT == nil then self.cache.PureINT = c.GetBulletStatus(STATUS_TYPE_INT, true, false) end return self.cache.PureINT end
function BulletFunc:PureMND() if self.cache.PureMND == nil then self.cache.PureMND = c.GetBulletStatus(STATUS_TYPE_MND, true, false) end return self.cache.PureMND end
function BulletFunc:PureCRT() if self.cache.PureCRT == nil then self.cache.PureCRT = c.GetBulletStatus(STATUS_TYPE_CRT, true, false) end return self.cache.PureCRT end
function BulletFunc:PureSpeed() if self.cache.PureSpeed == nil then self.cache.PureSpeed = c.GetBulletStatus(STATUS_TYPE_SPD, true, false) end return self.cache.PureSpeed end
-- 現時点では _mode = CS_COMPARE_PARAM には未対応
function BulletFunc:Element(_comp, _mode)
local expElem, val1, val2, tbl
	if _comp == nil then
		if self.cache.Element == nil then
			self.cache.Element = c.GetBulletElement()
		end
		self.cache.Element = self.cache.Element or ELEMENT_NONE
		return self.cache.Element
	else
		if _mode == nil or _mode == CS_COMPARE_NONE then
	 		if _comp == ELEMENT_UNMENTIONED then return true end
	 		if _comp == ELEMENT_ALL then return self:Element()~=ELEMENT_NONE end
	 		if _comp >= ELEMENT_NONE then return _comp==self:Element() end
	 		if _comp == ELEMENT_NOT_FIRE then return self:Element()~=ELEMENT_FIRE end
	 		if _comp == ELEMENT_NOT_ICE then return self:Element()~=ELEMENT_ICE end
	 		if _comp == ELEMENT_NOT_TREE then return self:Element()~=ELEMENT_TREE end
	 		if _comp == ELEMENT_NOT_THUNDER then return self:Element()~=ELEMENT_THUNDER end
	 		if _comp == ELEMENT_NOT_LIGHT then return self:Element()~=ELEMENT_LIGHT end
	 		if _comp == ELEMENT_NOT_DARK then return self:Element()~=ELEMENT_DARK end
	 		if _comp <= ELEMENT_SAME_WEAPON_NOT_NONE and _comp >= ELEMENT_WEAPON_2_NOT_NONE then
	 			if self:Element()==ELEMENT_NONE then return false end
	 			_comp = _comp + 4
	 		end
	 		if _comp == ELEMENT_ANY_WEAPON then return (this:WeaponElem(self:Element()) or this:SubWeaponElem(self:Element())) end
	 		if _comp == ELEMENT_WEAPON_1 then return this:WeaponElem(self:Element()) end
	 		if _comp == ELEMENT_WEAPON_2 then return this:SubWeaponElem(self:Element()) end
	 		if _comp == ELEMENT_SAME_WEAPON then return (this:WeaponElem(self:Element()) and this:SubWeaponElem(self:Element())) end
		else
			if not isTableOrClass(_comp) then _comp = {_comp} end
			if _comp[1] == nil then return true end
			for i,j in pairs(_comp) do
				if j == ELEMENT_UNMENTIONED then return true end
				if j < ELEMENT_UNMENTIONED then
					if expElem == nil then expElem = copyTable(ELEMENT_EXPANSION) end
					if val1 == nil and j~=ELEMENT_WEAPON_2_NOT_NONE and j~=ELEMENT_WEAPON_2 then val1 = this:WeaponElem() or false end
					if val2 == nil and j~=ELEMENT_WEAPON_1_NOT_NONE and j~=ELEMENT_WEAPON_1 then val2 = this:SubWeaponElem() or false end
					if j == ELEMENT_ANY_WEAPON_NOT_NONE then tbl = {} if val1 and val1 ~= ELEMENT_NONE then table.insert(tbl, val1) end if val2 and val2 ~= ELEMENT_NONE then table.insert(tbl, val2) end if tbl[1] ~= nil then expElem[ELEMENT_ANY_WEAPON_NOT_NONE] = tbl end end
					if j == ELEMENT_WEAPON_1_NOT_NONE then if val1 and val1 ~= ELEMENT_NONE then expElem[ELEMENT_WEAPON_1_NOT_NONE] = {val1} end end
					if j == ELEMENT_WEAPON_2_NOT_NONE then if val2 and val2 ~= ELEMENT_NONE then expElem[ELEMENT_WEAPON_2_NOT_NONE] = {val2} end end
					if j == ELEMENT_SAME_WEAPON_NOT_NONE then if val1 and val1==val2 and val1 ~= ELEMENT_NONE then expElem[ELEMENT_SAME_WEAPON_NOT_NONE] = {val1} end end
					if j == ELEMENT_ANY_WEAPON then if val1 or val2 then expElem[ELEMENT_ANY_WEAPON] = {val1 or val2, val1 and val2 or nil} end end
					if j == ELEMENT_WEAPON_1 then if val1 then expElem[ELEMENT_WEAPON_1] = {val1} end end
					if j == ELEMENT_WEAPON_2 then if val2 then expElem[ELEMENT_WEAPON_2] = {val2} end end
					if j == ELEMENT_SAME_WEAPON then if val1 and val1==val2 then expElem[ELEMENT_SAME_WEAPON] = {val1} end end
				end
			end
			if expElem == nil then expElem = ELEMENT_EXPANSION end
			return c.GetBulletElement(_mode, _comp, expElem)
		end
	end
end
function BulletFunc:Scale() if self.cache.Scale == nil then self.cache.Scale = c.GetBulletScale() end return self.cache.Scale end
-- 常時背面攻撃を加味した被弾方向判定 現状では物理攻撃時(ALWAYS_BEHIND_ATTACK_PHYSICAL)のみ
function BulletFunc:TargetToDir() local tbl if self.cache.TargetToDir == nil then tbl = self:Parent():GetValue(UNIT_VALUE_ALWAYS_BEHIND_ATTACK) if isTableOrClass(tbl) and tbl[ALWAYS_BEHIND_ATTACK_PHYSICAL] and self:SKL_Type(SKILL_PHYSIC) then self.cache.TargetToDir = DIR_TO_BACK else self.cache.TargetToDir = self:Target():ToDir(self:Parent()) end end return self.cache.TargetToDir end
function BulletFunc:AddValue(_index, _cnt, _calc, _isLifeTypeHit) return self:Parent():AddBulletValue(self:UID(), _index, _cnt, _calc, _isLifeTypeHit) end
function BulletFunc:GetValue(_index) return self:Parent():GetBulletValue(self:UID(), _index) end
function BulletFunc:GetParentSkill() if self.cache.GetParentSkill == nil then self.cache.GetParentSkill = self:Parent():GetSkillFromID(self:SKL_ID()) end return self.cache.GetParentSkill end
function BulletFunc:SKL_PUID() if self.cache.SKL_PUID == nil then self.cache.SKL_PUID = c.GetBulletSkillPUID() end return self.cache.SKL_PUID end
function BulletFunc:SKL_ID() if self.cache.SKL_ID == nil then self.cache.SKL_ID = c.GetBulletSkillID() end return self.cache.SKL_ID end
function BulletFunc:SKL_Target() if self.cache.SKL_Target == nil then self.cache.SKL_Target = c.GetBulletSkillTarget() end return self.cache.SKL_Target end
function BulletFunc:SKL_Scale(_comp) if _comp == nil then if self.cache.SKL_Scale == nil then self.cache.SKL_Scale = c.GetBulletSkillRange() end return self.cache.SKL_Scale else if _comp == 0 then return true end return _comp==self:SKL_Scale() end end
function BulletFunc:SKL_Type(_comp, _mode)
local res
	if _comp == nil then
		if self.cache.SKL_Type == nil then
			self.cache.SKL_Type = self:MST_Info(BULLET_PROPERTY_SKILL_TYPE)
			if self.cache.SKL_Type == nil then
				self.cache.SKL_Type = c.GetBulletSkillType()
			end
		end
		return self.cache.SKL_Type
	else
		if _mode == nil or _mode == CS_COMPARE_NONE then
			if _comp == 0 then return true end
	 		if _comp > SKILL_COUNTER then
	 			_comp = bitBooleanList(_comp, 4)
	 			for i,j in pairs(_comp) do
	 				if j and self:SKL_Type(i) then
	 					return true
	 				end
	 			end
	 			return false
	 		else
	 			return (_comp==self:SKL_Type() or (_comp==SKILL_PHYSIC and SKILL_CATEGORY_PHYSIC[self:SKL_Type()]))
	 		end
		else
			if not isTableOrClass(_comp) then _comp = {_comp} end
			if _comp[1] == nil or _comp[1] == 0 then return true end
			res = c.GetBulletSkillType(_mode, _comp, SKILL_CATEGORY_EXPANSION)
			if res == nil then
				res = c.GetBulletProperty(self:UID(), BULLET_PROPERTY_SKILL_TYPE, _mode, _comp, SKILL_CATEGORY_EXPANSION)
			end
			return res
		end
	end
end
function BulletFunc:SKL_Role(_comp, _mode)
local res
	if _comp == nil then
		if self.cache.SKL_Role == nil then
			self.cache.SKL_Role = c.GetBulletSkillRole()
			if self.cache.SKL_Role == nil then
				self.cache.SKL_Role = self:MST_Info(BULLET_PROPERTY_SKILL_ROLE)
			end
		end
		return self.cache.SKL_Role
	else
		if _mode == nil or _mode == CS_COMPARE_NONE then
			if _comp == 0 then return true end
	 		if isTableOrClass(self:SKL_Role()) then
	 			for i,j in pairs(self:SKL_Role()) do
	 				if _comp == j then return true end
	 			end
	 			return false
	 		else
	 			return _comp==self:SKL_Role()
	 		end
	 	else
			if not isTableOrClass(_comp) then _comp = {_comp} end
			if _comp[1] == nil or _comp[1] == 0 then return true end
			res = c.GetBulletSkillRole(_mode, _comp)
			if res == nil then
				res = c.GetBulletProperty(self:UID(), BULLET_PROPERTY_SKILL_ROLE, _mode, _comp)
			end
			return res
		end
	end
end
function BulletFunc:SKL_Kind(_comp) if _comp == nil then if self.cache.SKL_Kind == nil then self.cache.SKL_Kind = c.GetBulletSkillKind() if self.cache.SKL_Kind == nil then self.cache.SKL_Kind = self:MST_Info(BULLET_PROPERTY_SKILL_KIND) end end return self.cache.SKL_Kind else return _comp==self:SKL_Kind() end end
function BulletFunc:SKL_BeforeCost(_float) if self.cache.SKL_CostInfo == nil then self.cache.SKL_CostInfo = {} self.cache.SKL_CostInfo.Before, self.cache.SKL_CostInfo.After = c.GetBulletCostInfo() if self.cache.SKL_CostInfo.Before == nil then self.cache.SKL_CostInfo.Before = 0 end if self.cache.SKL_CostInfo.After == nil then self.cache.SKL_CostInfo.After = 0 end end return _float and self.cache.SKL_CostInfo.Before or math.floor(self.cache.SKL_CostInfo.Before) end
function BulletFunc:SKL_AfterCost(_float) if self.cache.SKL_CostInfo == nil then self.cache.SKL_CostInfo = {} self.cache.SKL_CostInfo.Before, self.cache.SKL_CostInfo.After = c.GetBulletCostInfo() if self.cache.SKL_CostInfo.Before == nil then self.cache.SKL_CostInfo.Before = 0 end if self.cache.SKL_CostInfo.After == nil then self.cache.SKL_CostInfo.After = 0 end end return _float and self.cache.SKL_CostInfo.After or math.floor(self.cache.SKL_CostInfo.After) end
function BulletFunc:SKL_Damage() if self.cache.SKL_Damage == nil then self.cache.SKL_Damage = c.GetSkillTotalDamage() end return self.cache.SKL_Damage end
function BulletFunc:SKL_SetValue(_index, _val, _option) return self:Parent():SetSkillValue(_index, self:SKL_PUID(), _val, _option) end
function BulletFunc:SKL_GetValue(_index) return self:Parent():GetSkillValue(_index, self:SKL_PUID()) end
function BulletFunc:HitTarget() if self.cache.HitTarget == nil then self.cache.HitTarget = c.GetBulletHitTarget() end return self.cache.HitTarget end
function BulletFunc:IsPenetration() if self.cache.IsPenetration == nil then self.cache.IsPenetration = not c.GetBulletDeleteOnHit() end return self.cache.IsPenetration end
function BulletFunc:CanKB(_target) if self.cache.CanKB == nil then self.cache.CanKB = c.BulletCanKnockBack(_target and _target:ID()) end return self.cache.CanKB end
function BulletFunc:Steal()
	-- 同じ敵に盗むが発動しないようにLua側で対処した際の残骸
	-- if self.target:GetValue(UNIT_VALUE_STEAL_LOG) then return false end
	if c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.Steal, {}, LIFETYPE_TRANSIENT) then
		-- self.target:SetValue(UNIT_VALUE_STEAL_LOG, true)
		return true
	else
		return false
	end
end
-- 「挑発」だったら発動しない TODO:挑発問題は根本的に解決が必要
function BulletFunc:GrimReaperCond(_cond) if _cond == nil then if self.cache.GrimReaperCond == nil then if not (self:SKL_ID()~=3000204 and self:SKL_Role(SKILL_ROLE_ATTACK) and self:Parent():RelativeSide(self:Target(), TARGET_SIDE_OPPONENT)) then self.cache.GrimReaperCond = -1 else self.cache.GrimReaperCond = ((Field:IsPvP() or Field:IsBoss()) and 2 or 1) end end return self.cache.GrimReaperCond else if _cond==0 then return true end return _cond==self:GrimReaperCond() end end
function BulletFunc:IsNormalHit() if self.cache.IsNormalHit == nil then self.cache.IsNormalHit = not (self:IsCRT() or self:IsKiller() or self:IsFatalBlow() or (self:Target():ElemResist(self:Element()) or 0) < 0) end return self.cache.IsNormalHit end
function BulletFunc:IsCRT() if self.cache.IsCRT == nil then self.cache.IsCRT = c.WasBulletCritical() end return self.cache.IsCRT end
function BulletFunc:FatalBlowProbability() if self.cache.FatalBlowProbability == nil then self.cache.FatalBlowProbability = c.GetBulletProperty(self:UID(), BULLET_PROPERTY_FATAL_BLOW_INCIDENCE) end return self.cache.FatalBlowProbability end
function BulletFunc:SetFatalBlowProbability(_val) self.cache.FatalBlowProbability = nil return c.SetBulletProperty(self:UID(), BULLET_PROPERTY_FATAL_BLOW_INCIDENCE, _val) end
function BulletFunc:IsFatalBlow() if self.cache.FatalBlowAtkRatio == nil then self.cache.FatalBlowAtkRatio = c.GetBulletProperty(self:UID(), BULLET_PROPERTY_FATAL_BLOW_ATK_RATIO) end return self.cache.FatalBlowAtkRatio ~= 0 end
function BulletFunc:IsKill() if self.cache.IsKill == nil then self.cache.IsKill = c.WasBulletLastAttack() end return self.cache.IsKill end
function BulletFunc:IsBreak() if self.cache.IsBreak == nil then self.cache.IsBreak = c.BulletMadeBreak() end return self.cache.IsBreak end
function BulletFunc:IsGuard() if self.cache.IsGuard == nil then self.cache.IsGuard = c.WasBulletGuarded() end return self.cache.IsGuard end
function BulletFunc:IsCounter() if self.cache.IsCounter == nil then self.cache.IsCounter = c.WasBulletCountered() end return self.cache.IsCounter end
function BulletFunc:IsEndure() if self.cache.IsEndure == nil then self.cache.IsEndure = c.WasBulletEndured(self.target:ID()) end return self.cache.IsEndure end
function BulletFunc:IsFatal() if self.cache.IsFatal == nil then self.cache.IsFatal = not c.BulletNotFatal(self.target:ID()) end return self.cache.IsFatal end
function BulletFunc:EditTarget(_side, _tid) return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.ChgBulletTarg, {_side, _tid}) end
function BulletFunc:EditSTR(_val, _per, _add) self.cache.STR = nil return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.StrEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditDEF(_val, _per, _add) self.cache.DEF = nil return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.DefEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditINT(_val, _per, _add) self.cache.INT = nil return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.IntEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditMND(_val, _per, _add) self.cache.MND = nil return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.MndEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditCRT(_val) self.cache.CRT = nil return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.CrtEdit, {_val}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditFatalBlow(_val, _per, _add) self.cache.FatalBlowProbability = nil return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.FatalBlowEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditFatalBlow2(_normalVal, _normalPer, _normalAdd, _bossVal, _bossPer, _bossAdd) if self.target:IsBoss() then return self:EditFatalBlow(_bossVal, _bossPer, _bossAdd) else return self:EditFatalBlow(_normalVal, _normalPer, _normalAdd) end end
function BulletFunc:EditHitRate(_val) return c.ProcControl(TARGET_STATUS_BULLET_WORK, self.parent:ID(), TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.HitRate, {_val}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditDamage(_val) return c.EditDamage(math.max(_val, 1)) end
function BulletFunc:EditDamagePer(_per) if myTrigger==TriggerTypes.AfterCalcAttack or myTrigger==TriggerTypes.AfterCalcDamage then return c.EditDamage(math.max(round(self:Damage() * (1 + _per * Per2Num)), 1)) else log:write(LOG_LEVEL_WARNING, 'Bullet EditDamagePer Failed : Parent=>', self.parent:Name(), '(', self.parent.id, ')', ' Trigger=>', myTrigger) return false end end
function BulletFunc:NoDamage() return c.ProcControl(TARGET_STATUS_BULLET_WORK, self.parent:ID(), TARGET_STATUS_UNIT_WORK, self.target:ID(), ControlTypes.InvalidDmg, {}, LIFETYPE_TRANSIENT) end
function BulletFunc:Erase() return c.ProcControl(TARGET_STATUS_BULLET_WORK, self.parent:ID(), TARGET_STATUS_UNIT_WORK, self.target:ID(), ControlTypes.Invincible, {}, LIFETYPE_TRANSIENT) end
function BulletFunc:Cancel() return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.CancelBullet, {}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditHealPer(_per)  if myTrigger==TriggerTypes.AfterCalcAttack or myTrigger==TriggerTypes.AfterCalcDamage then return c.EditHeal(round(self:Heal() * (1 + _per * Per2Num))) else log:write(LOG_LEVEL_WARNING, 'Bullet EditHealPer Failed : Parent=>', self.parent:Name(), '(', self.parent.id, ')', ' Trigger=>', myTrigger) return false end end
function BulletFunc:EditVitDamage(_val, _per) return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_WORK, this:ID(), ControlTypes.VitDmgPower, {_val, _per}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditTargetSTR(_val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_WORK, self.target:ID(), ControlTypes.StrEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditTargetDEF(_val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_WORK, self.target:ID(), ControlTypes.DefEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditTargetINT(_val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_WORK, self.target:ID(), ControlTypes.IntEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditTargetMND(_val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_WORK, self.target:ID(), ControlTypes.MndEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditTargetCRT(_val) return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_WORK, self.target:ID(), ControlTypes.CrtEdit, {_val}, LIFETYPE_TRANSIENT) end
function BulletFunc:EditElement(_elem) return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.OverrideElement, {_elem}, LIFETYPE_TRANSIENT) end
function BulletFunc:SetKiller(_type, _enable, _showPassive) local res if _enable==nil then _enable = true end if _type == nil or _type == 0 then _type = self:Target():Type() elseif _type == -1 then _type = self:Parent():Type() else _type = {_type} end for i,j in pairs(_type) do res = c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.Killer, {j, not _enable}, LIFETYPE_TRANSIENT, _showPassive) or res end return res end
function BulletFunc:IsKiller(_type)
local tgt
	if self.cache.Killer == nil then
		self.cache.Killer = {}
		if self.cache.KillerList == nil then self.cache.KillerList = c.GetBulletKiller() end
		for i,j in pairs(self.cache.KillerList) do
			self.cache.Killer[j] = true
		end
	end
	if _type and _type ~= 0 then
		if not isTableOrClass(_type) then
			_type = int32ToUnitTypeArray(_type)
		end
		tgt = self:Target()
		for i,j in pairs(_type) do
			if self.cache.Killer[j] and tgt:Type(j) then return true end
		end
		return false
	else
		for i,j in pairs(self:Target():Type()) do
			if toBoolean(self.cache.Killer[j]) then
				return true
			end
		end
		return false
	end
end
function BulletFunc:KillerList() if self.cache.KillerList == nil then self.cache.KillerList = c.GetBulletKiller() end return self.cache.KillerList end
function BulletFunc:EditKillerPer(_per, _showPassive) return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.KillerPower, {_per}, LIFETYPE_TRANSIENT, _showPassive) end
function BulletFunc:EditCounterProb(_val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_WORK, self.target:ID(), ControlTypes.CounterRate, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function BulletFunc:DamageLimit() return self:MST_Info(BULLET_PROPERTY_DAMAGE_LIMIT) end
function BulletFunc:EditDamageLimit(_val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.DmgLimitUp, {_val, _per, _add}, LIFETYPE_TRANSIENT) end
function BulletFunc:SetDamageLimit(_val) return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.DmgLimitOff, {_val}, LIFETYPE_TRANSIENT) end
function BulletFunc:HealLimit() return self:MST_Info(BULLET_PROPERTY_HEAL_LIMIT) end
function BulletFunc:EditHealLimit(_val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.HealLimitUp, {_val, _per, _add}, LIFETYPE_TRANSIENT) end
function BulletFunc:SetHealLimit(_val) return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.HealLimitOff, {_val}, LIFETYPE_TRANSIENT) end
function BulletFunc:Damage(_type, _per, _atkStat, _defStat)
local res,pow
	-- 必須パラメータのうち1つでも欠けてたらGETと見做す
	if _type and _per then
		if _type==DAMAGE_TYPE_PHYSICAL or _type==DAMAGE_TYPE_MAGICAL then
			if Field:IsPvP() then
				if _atkStat then
					pow = self:Status(_atkStat)
				elseif _type==DAMAGE_TYPE_PHYSICAL then
					pow = self:STR()
				elseif _type==DAMAGE_TYPE_MAGICAL then
					pow = self:INT()
				end
				_per = round(_per / math.min(math.max(pow * 0.004, 1), 20))
			end
			-- 既存プロセスへの影響を最小限に抑えるため、ifで切り分ける
			if _atkStat == nil and _defStat == nil then
				res = c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.target:ID(), _type, {_per})
			else
				res = c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.target:ID(), _type, {_per, _atkStat and _atkStat + 1 or 0, _defStat and _defStat + 1 or 0})
			end
			if res then
				self:HideMiss(MISS_TYPE_DAMAGE)
			else
				self:ShowMiss(MISS_TYPE_DAMAGE)
			end
			return res
		else
			log:write(LOG_LEVEL_WARNING, 'Bullet Damage Failed : Parent=>', self.parent:Name(), '(', self.parent.id, ')', ' Trigger=>', myTrigger)
			return false
		end
	else
		if self.cache.Damage == nil then
			if myTrigger==TriggerTypes.AfterCalcAttack or myTrigger==TriggerTypes.AfterCalcDamage then
				self.cache.Damage = c.GetDamage()
			-- elseif myTrigger==TriggerTypes.AfterAttack or myTrigger==TriggerTypes.AfterDamage then
			else
				self.cache.Damage = c.GetLastDamage()
				-- log:write(LOG_LEVEL_WARNING, 'Bullet Damage Failed : Parent=>', self.parent:Name(), '(', self.parent.id, ')', ' Trigger=>', myTrigger)
				-- return 0
			end
		end
		return self.cache.Damage
	end
end
function BulletFunc:Heal(_val, _per, _noRand)
local res
	-- パラメータのうち1つでも欠けてたらGETと見做す
	if _val and _per then
		if self:MST_Info(BULLET_PROPERTY_WEAPON_INDEX)==1 then
			_noRand = _noRand and 0 or 1
			res = c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.target:ID(), ControlTypes.Recover, {_val, _per, _noRand})
			if res then
				self:HideMiss(MISS_TYPE_HEAL_HP)
			else
				self:ShowMiss(MISS_TYPE_HEAL_HP)
			end
			return res
		else
			return false
		end
	else
		if self.cache.Heal == nil then
			if myTrigger==TriggerTypes.AfterCalcAttack or myTrigger==TriggerTypes.AfterCalcDamage then
				self.cache.Heal = c.GetHeal()
			elseif myTrigger==TriggerTypes.AfterAttack or myTrigger==TriggerTypes.AfterDamage then
				self.cache.Heal = c.GetLastHeal()
			else
				log:write(LOG_LEVEL_WARNING, 'Bullet Heal Failed : Parent=>', self.parent:Name(), '(', self.parent.id, ')', ' Trigger=>', myTrigger)
				return 0
			end
		end
		return self.cache.Heal
	end
end
function BulletFunc:AddDamage(_elem, _cnt, _min, _max) return c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.AdditionalDmg, {_elem, _cnt, _min, _max}, LIFETYPE_TRANSIENT) end
function BulletFunc:FixDamage(_min, _max) return c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.target:ID(), ControlTypes.FixDmg, {_min, _max}) end
function BulletFunc:PerDamage(NowHP_Per, MaxHP_Per) return c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.target:ID(), ControlTypes.PctDmg, {NowHP_Per, MaxHP_Per}) end
function BulletFunc:Kill() return c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.target:ID(), ControlTypes.SuddenDeath, {0}) end
function BulletFunc:Break() return c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.target:ID(), ControlTypes.VitZeroDmg, {}) end
function BulletFunc:GuardBreak() return c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_UNIT_WORK, self.target:ID(), ControlTypes.GuardBreak) end
function BulletFunc:HealMP(_val, _per) local res = c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.target:ID(), ControlTypes.MpRecover, {_val, _per}) if res then self:HideMiss(MISS_TYPE_HEAL_HP) else self:ShowMiss(MISS_TYPE_HEAL_HP) end return res end
function BulletFunc:Drain(_per) return c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.parent:ID(), ControlTypes.Drain, {_per}) end
function BulletFunc:ShowMiss(_missType) c.SetMissTypeMode(self.parent:ID(), _missType, 1, self.target:ID()) end
function BulletFunc:HideMiss(_missType) c.SetMissTypeMode(self.parent:ID(), _missType, 2, self.target:ID()) end
function BulletFunc:SwitchSource(_targStat) if not self.cache.usedlocal and _targStat==TARGSTAT_WORK_LOCAL then c.LoadToWork(TARGET_STATUS_BULLET_WORK, self.parent:ID(), TARGET_STATUS_BULLET_LOCAL_WORK, self.parent:ID()) self.cache.usedlocal = true end self.source = TARGTYPE_BULLET+_targStat end

-- バレット本体を定義
-- メタメソッドにより、バレットが使用不可能なトリガーで呼ばれた場合はメソッドを呼ばずnilを返す
Bullet = {}
Bullet.type = C_TYPE_BULLET
Bullet.super = BulletFunc
Bullet.id = 0
Bullet.name = 'Bullet'
Bullet.parent = {}
Bullet.target = {}
Bullet.cache = {}
Bullet.method = {}
Bullet.method.parent = Bullet
Bullet.source = TARGET_STATUS_BULLET_WORK
Bullet.cache.usedlocal = false

Bullet.enableTrigger = {}
Bullet.enableTrigger[TriggerTypes.BeforeCreateBullet] = true
Bullet.enableTrigger[TriggerTypes.BulletProcess] = true
Bullet.enableTrigger[TriggerTypes.BulletHit] = true
Bullet.enableTrigger[TriggerTypes.BulletWasHit] = true
Bullet.enableTrigger[TriggerTypes.OnCalcAttack] = true
Bullet.enableTrigger[TriggerTypes.OnCalcDamage] = true
Bullet.enableTrigger[TriggerTypes.AfterAttack] = true
Bullet.enableTrigger[TriggerTypes.AfterDamage] = true
Bullet.enableTrigger[TriggerTypes.AfterCalcAttack] = true
Bullet.enableTrigger[TriggerTypes.AfterCalcDamage] = true
Bullet.enableTrigger[TriggerTypes.PreAfterAttack] = true
Bullet.enableTrigger[TriggerTypes.PreAfterDamage] = true
Bullet.enableTrigger[TriggerTypes.GivingLethalDamage] = true
Bullet.enableTrigger[TriggerTypes.ReceiveLethalDamage] = true

Bullet.enableTrigger[TriggerTypes.OnOfcProcLot] = true
Bullet.enableTrigger[TriggerTypes.BeforeOfcProcInvoke] = true
Bullet.enableTrigger[TriggerTypes.AfterOfcProcInvoke] = true
Bullet.enableTrigger[TriggerTypes.OnDefProcLot] = true
Bullet.enableTrigger[TriggerTypes.BeforeDefProcInvoke] = true
Bullet.enableTrigger[TriggerTypes.AfterDefProcInvoke] = true
Bullet.enableTrigger[TriggerTypes.OnOfcBuffControl] = true
Bullet.enableTrigger[TriggerTypes.OnDefBuffControl] = true

Bullet.enableTrigger[TriggerTypes.TimelineCond] = true

function Bullet:Enable() return isTableOrClass(self.parent, C_TYPE_UNIT) and not self.parent:IsDummy() end
function Bullet:FrameUpdate() self.parent = units:GetUnit(c.GetBulletOwner()) self.target = units:GetUnit(c.GetBulletTarget()) self.source = TARGET_STATUS_BULLET_WORK self.cache = {} end
setmetatable(Bullet.method,{__index = LoggingMethod})
setmetatable(Bullet,{__index = function(_table, _key) if _table.enableTrigger[myTrigger] then return _table.method[_key] else return function() log:write(LOG_LEVEL_WARNING, 'Bullet Not Exist : Func=>', _key, ' Trigger=>', myTrigger) return nil end end end, __newindex = AddLoggingMethodSuper})

----------------------------------------------------------------------------------
-- 									バフの定義									--
-- 						バフが発生させる効果はここにまとめる					--
-- 		※1フレーム内で複数回GETしても、C#側の関数が呼ばれるのは1度だけ			--
----------------------------------------------------------------------------------
Buff = {}
Buff.type = C_TYPE_BUFF
Buff.id = 0
Buff.name = 'Buff'
Buff.parent = {}
Buff.target = {}
Buff.enable = false
Buff.cache = {}
Buff.method = {}
Buff.method.parent = Buff
Buff.source = TARGET_STATUS_BUFF_WORK
Buff.cache.usedlocal_s = false
Buff.cache.usedlocal_o = false
setmetatable(Buff,{__index = Buff.method, __newindex = AddLoggingMethod})

function Buff:Parent() return self.parent end
function Buff:Target() return self.target end
function Buff:Enable() return self.enable end
function Buff:UID() if self.cache.UID == nil then self.cache.UID = c.GetBuffUID() end return self.cache.UID end
function Buff:ID() if self.cache.BuffInfo == nil then self.cache.BuffInfo = Field:GetBuffInfo(self:UID()) end return self.cache.BuffInfo[BUFF_INFO_ID] end
function Buff:Name() if self.cache.BuffInfo == nil then self.cache.BuffInfo = Field:GetBuffInfo(self:UID()) end return self.cache.BuffInfo[BUFF_INFO_NAME] end
function Buff:Category() if self.cache.BuffInfo == nil then self.cache.BuffInfo = Field:GetBuffInfo(self:UID()) end return self.cache.BuffInfo[BUFF_INFO_CATEGORY] end
function Buff:Group() if self.cache.BuffInfo == nil then self.cache.BuffInfo = Field:GetBuffInfo(self:UID()) end return self.cache.BuffInfo[BUFF_INFO_GROUP] end
function Buff:Remain() if self.cache.BuffInfo == nil then self.cache.BuffInfo = Field:GetBuffInfo(self:UID()) end return self.cache.BuffInfo[BUFF_INFO_REMAIN] end
function Buff:IconID() if self.cache.BuffInfo == nil then self.cache.BuffInfo = Field:GetBuffInfo(self:UID()) end return self.cache.BuffInfo[BUFF_INFO_ICON_ID] end
function Buff:Description() if self.cache.BuffInfo == nil then self.cache.BuffInfo = Field:GetBuffInfo(self:UID()) end return self.cache.BuffInfo[BUFF_INFO_DESCRIPTION] end
function Buff:Status(_statusType) if self.cache.Status == nil then self.cache.Status = {} end if self.cache.Status[_statusType] == nil then self.cache.Status[_statusType] = c.GetBuffStatus(_statusType) end return self.cache.Status[_statusType] end
function Buff:HP() if self.cache.HP == nil then self.cache.HP = c.GetBuffStatus(STATUS_TYPE_HP) end return self.cache.HP end
function Buff:MaxHP() if self.cache.MaxHP == nil then self.cache.MaxHP = c.GetBuffStatus(STATUS_TYPE_TOTAL_MAX_HP) end return self.cache.MaxHP end
function Buff:PerHP() if self.cache.PerHP == nil then self.cache.PerHP = round(self:HP() / self:MaxHP() * Pct100) end return self.cache.PerHP end
function Buff:MP() if self.cache.MP == nil then self.cache.MP = c.GetBuffStatus(STATUS_TYPE_MP) end return self.cache.MP end
function Buff:MaxMP() if self.cache.MaxMP == nil then self.cache.MaxMP = c.GetBuffStatus(STATUS_TYPE_MAX_MP) end return self.cache.MaxMP end
function Buff:PerMP() if self.cache.PerMP == nil then self.cache.PerMP = round(self:MP() / self:MaxMP() * Pct100) end return self.cache.PerMP end
function Buff:VIT() if self.cache.VIT == nil then self.cache.VIT = c.GetBuffStatus(STATUS_TYPE_VIT) end return self.cache.VIT end
function Buff:MaxVIT() if self.cache.MaxVIT == nil then self.cache.MaxVIT = c.GetBuffStatus(STATUS_TYPE_MAX_VIT) end return self.cache.MaxVIT end
function Buff:PerVIT() if self.cache.PerVIT == nil then self.cache.PerVIT = round(self:VIT() / self:MaxVIT() * Pct100) end return self.cache.PerVIT end
function Buff:STR() if self.cache.STR == nil then self.cache.STR = c.GetBuffStatus(STATUS_TYPE_STR) end return self.cache.STR end
function Buff:DEF() if self.cache.DEF == nil then self.cache.DEF = c.GetBuffStatus(STATUS_TYPE_DEF) end return self.cache.DEF end
function Buff:INT() if self.cache.INT == nil then self.cache.INT = c.GetBuffStatus(STATUS_TYPE_INT) end return self.cache.INT end
function Buff:MND() if self.cache.MND == nil then self.cache.MND = c.GetBuffStatus(STATUS_TYPE_MND) end return self.cache.MND end
function Buff:CRT() if self.cache.CRT == nil then self.cache.CRT = c.GetBuffStatus(STATUS_TYPE_CRT) end return self.cache.CRT end
function Buff:Speed() if self.cache.Speed == nil then self.cache.Speed = c.GetBuffStatus(STATUS_TYPE_SPD) end return self.cache.Speed end
function Buff:SampleStatus(_statusType) if self.cache.SampleStatus == nil then self.cache.SampleStatus = {} end if self.cache.SampleStatus[_statusType] == nil then self.cache.SampleStatus[_statusType] = c.GetBuffStatus(_statusType, true) end return self.cache.SampleStatus[_statusType] end
function Buff:SampleHP() if self.cache.PureHP == nil then self.cache.PureHP = c.GetBuffStatus(STATUS_TYPE_HP, true) end return self.cache.PureHP end
function Buff:SampleMaxHP() if self.cache.PureMaxHP == nil then self.cache.PureMaxHP = c.GetBuffStatus(STATUS_TYPE_MAX_HP, true) end return self.cache.PureMaxHP end
function Buff:SamplePerHP() if self.cache.PurePerHP == nil then self.cache.PurePerHP = round(self:SampleHP() / self:SampleMaxHP() * Pct100) end return self.cache.PurePerHP end
function Buff:SampleMP() if self.cache.PureMP == nil then self.cache.PureMP = c.GetBuffStatus(STATUS_TYPE_MP, true) end return self.cache.PureMP end
function Buff:SampleMaxMP() if self.cache.PureMaxMP == nil then self.cache.PureMaxMP = c.GetBuffStatus(STATUS_TYPE_MAX_MP, true) end return self.cache.PureMaxMP end
function Buff:SamplePerMP() if self.cache.PurePerMP == nil then self.cache.PurePerMP = round(self:SampleMP() / self:SampleMaxMP() * Pct100) end return self.cache.PurePerMP end
function Buff:SampleVIT() if self.cache.PureVIT == nil then self.cache.PureVIT = c.GetBuffStatus(STATUS_TYPE_VIT, true) end return self.cache.PureVIT end
function Buff:SampleMaxVIT() if self.cache.PureMaxVIT == nil then self.cache.PureMaxVIT = c.GetBuffStatus(STATUS_TYPE_MAX_VIT, true) end return self.cache.PureMaxVIT end
function Buff:SamplePerVIT() if self.cache.PurePerVIT == nil then self.cache.PurePerVIT = round(self:SampleVIT() / self:SampleMaxVIT() * Pct100) end return self.cache.PurePerVIT end
function Buff:SampleSTR() if self.cache.PureSTR == nil then self.cache.PureSTR = c.GetBuffStatus(STATUS_TYPE_STR, true) end return self.cache.PureSTR end
function Buff:SampleDEF() if self.cache.PureDEF == nil then self.cache.PureDEF = c.GetBuffStatus(STATUS_TYPE_DEF, true) end return self.cache.PureDEF end
function Buff:SampleINT() if self.cache.PureINT == nil then self.cache.PureINT = c.GetBuffStatus(STATUS_TYPE_INT, true) end return self.cache.PureINT end
function Buff:SampleMND() if self.cache.PureMND == nil then self.cache.PureMND = c.GetBuffStatus(STATUS_TYPE_MND, true) end return self.cache.PureMND end
function Buff:SampleCRT() if self.cache.PureCRT == nil then self.cache.PureCRT = c.GetBuffStatus(STATUS_TYPE_CRT, true) end return self.cache.PureCRT end
function Buff:SampleSpeed() if self.cache.PureSpeed == nil then self.cache.PureSpeed = c.GetBuffStatus(STATUS_TYPE_SPD, true) end return self.cache.PureSpeed end
function Buff:EditSTR(_t, _val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_BUFF_WORK, _t and _t:ID() or self.target:ID(), ControlTypes.StrEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function Buff:EditDEF(_t, _val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_BUFF_WORK, _t and _t:ID() or self.target:ID(), ControlTypes.DefEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function Buff:EditINT(_t, _val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_BUFF_WORK, _t and _t:ID() or self.target:ID(), ControlTypes.IntEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function Buff:EditMND(_t, _val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_BUFF_WORK, _t and _t:ID() or self.target:ID(), ControlTypes.MndEdit, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function Buff:EditCRT(_t, _val) return c.ProcControl(nil, nil, TARGET_STATUS_BUFF_WORK, _t and _t:ID() or self.target:ID(), ControlTypes.CrtEdit, {_val}, LIFETYPE_TRANSIENT) end
function Buff:Damage(_type, _per) if _type and _per then if _type==DAMAGE_TYPE_PHYSICAL or _type==DAMAGE_TYPE_MAGICAL then return c.ProcControl(self.source, self.parent:ID(), TARGET_STATUS_UNIT_REAL, self.target:ID(), _type, {_per}) end end end
function Buff:Heal(_t, _val, _per) if _val and _per then return c.ProcControl(self.source, nil, TARGET_STATUS_UNIT_REAL, _t and _t:ID() or self.target:ID(), ControlTypes.Recover, {_val, _per, true}) end end
function Buff:FixDamage(_t, _min, _max) return c.ProcControl(self.source, nil, TARGET_STATUS_UNIT_REAL, _t and _t:ID() or self.target:ID(), ControlTypes.FixDmg, {_min, _max}) end
function Buff:PerDamage(_t, NowHP_Per, MaxHP_Per) return c.ProcControl(self.source, nil, TARGET_STATUS_UNIT_REAL, _t and _t:ID() or self.target:ID(), ControlTypes.PctDmg, {NowHP_Per, MaxHP_Per}) end
function Buff:DotDamage(_t, _val) return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_REAL, _t and _t:ID() or self.target:ID(), ControlTypes.SimpleDmg, {_val}) end
function Buff:Kill(_t) return c.ProcControl(self.source, nil, TARGET_STATUS_UNIT_REAL, _t and _t:ID() or self.target:ID(), ControlTypes.SuddenDeath, {0}) end
function Buff:GuardBreak(_t) return c.ProcControl(self.source, nil, TARGET_STATUS_UNIT_WORK, _t and _t:ID() or self.target:ID(), ControlTypes.GuardBreak) end
function Buff:FixMpDamage(_t, _min, _max) return c.ProcControl(self.source, nil, TARGET_STATUS_UNIT_REAL, _t and _t:ID() or self.target:ID(), ControlTypes.FixMPDmg, {_min, _max}) end
function Buff:PerMpDamage(_t, NowMP_Per, MaxMP_Per) return c.ProcControl(self.source, nil, TARGET_STATUS_UNIT_REAL, _t and _t:ID() or self.target:ID(), ControlTypes.PctMPDmg, {NowMP_Per, MaxMP_Per}) end
function Buff:HealMP(_t, _val, _per) return c.ProcControl(self.source, nil, TARGET_STATUS_UNIT_REAL, _t and _t:ID() or self.target:ID(), ControlTypes.MpRecover, {_val, _per}) end
function Buff:EditElement(_elem) return c.ProcControl(nil, nil, TARGET_STATUS_BUFF_WORK, self.parent:ID(), ControlTypes.OverrideElement, {_elem}, LIFETYPE_TRANSIENT) end
function Buff:DisableSkill(_skl, _mode) if _skl:ParentUnit():ID() == self.target:ID() then c.ProcControl(nil, nil, TARGET_STATUS_UNIT_REAL, self.target:ID(), ControlTypes.DisableSkill, {1, _skl:Type(), _skl:Index(), _mode}) else log:write(LOG_LEVEL_WARNING, 'DisableSkill Failed... : SkillParent=>', _skl:ParentUnit(), ' BuffParent=>', self.target) end end
function Buff:GenerateBullet(bulletID, delayFrame) return c.GenerateBullet(bulletID, self.parent:ID(), {self.target:ID()}, delayFrame, true, true) end
function Buff:GetKeptParam(_index) return c.GetKeptBuffParam(_index) end
function Buff:KeepParam(_index, _val, _calc) if _force or NonLocalTriggers[myTrigger] or not this:IsRemote() then return c.KeepBuffParam(_index, _val, _calc) end end
function Buff:SetProcValue(_val, _ever, _uid)
local u, buff
	if _uid then
		if Field:IsBuffExists(_uid) then
			buff = Field:GetBuffInfo(_uid)
			u = units:GetUnit(buff[BUFF_INFO_OWNER])
			u:SetProcValue(_val, _ever, AFFILIATION_BUFF, _uid, buff[BUFF_INFO_ID])
		end
	else
		Buff:Target():SetProcValue(_val, _ever, AFFILIATION_BUFF, self:UID(), self:ID())
	end
end
function Buff:GetProcValue(_uid)
local u, buff
	if _uid then
		if Field:IsBuffExists(_uid) then
			buff = Field:GetBuffInfo(_uid)
			u = units:GetUnit(buff[BUFF_INFO_OWNER])
			u:GetProcValue(AFFILIATION_BUFF, _uid, buff[BUFF_INFO_ID])
			return u:GetProcValue(AFFILIATION_BUFF, _uid, buff[BUFF_INFO_ID])
		end
	else
		return Buff:Target():GetProcValue(AFFILIATION_BUFF, self:UID(), self:ID())
	end
end
function Buff:CalcProcValue(_key, _val, _calc, _ever, _uid)
local u, buff
	if _uid then
		if Field:IsBuffExists(_uid) then
			buff = Field:GetBuffInfo(_uid)
			u = units:GetUnit(buff[BUFF_INFO_OWNER])
			u:CalcProcValue(_key, _val, _calc, _ever, AFFILIATION_BUFF, _uid, buff[BUFF_INFO_ID])
		end
	else
		Buff:Target():CalcProcValue(_key, _val, _calc, _ever, AFFILIATION_BUFF, self:UID(), self:ID())
	end
end
function Buff:SetProcCondValue(_val, _ever, _uid)
local u, buff
	if _uid then
		if Field:IsBuffExists(_uid) then
			buff = Field:GetBuffInfo(_uid)
			u = units:GetUnit(buff[BUFF_INFO_OWNER])
			u:SetProcCondValue(_val, _ever, AFFILIATION_BUFF, _uid, buff[BUFF_INFO_ID])
		end
	else
		Buff:Target():SetProcCondValue(_val, _ever, AFFILIATION_BUFF, self:UID(), self:ID())
	end
end
function Buff:GetProcCondValue(_uid)
local u, buff
	if _uid then
		if Field:IsBuffExists(_uid) then
			buff = Field:GetBuffInfo(_uid)
			u = units:GetUnit(buff[BUFF_INFO_OWNER])
			u:GetProcCondValue(AFFILIATION_BUFF, _uid, buff[BUFF_INFO_ID])
			return u:GetProcCondValue(AFFILIATION_BUFF, _uid, buff[BUFF_INFO_ID])
		end
	else
		return Buff:Target():GetProcCondValue(AFFILIATION_BUFF, self:UID(), self:ID())
	end
end
function Buff:Expire() return c.RemoveBuff(self.target:ID(), self:UID()) end
function Buff:SwitchSource(_targStat, _isOwner)
	if _targStat==TARGSTAT_WORK_LOCAL then
		if _isOwner and not self.cache.usedlocal_s then
			c.LoadToWork(TARGET_STATUS_BUFF_WORK, nil, TARGET_STATUS_BUFF_LOCAL_WORK, nil)
			self.cache.usedlocal_s = true
		elseif not _isOwner and not self.cache.usedlocal_o then
			c.LoadToWork(TARGET_STATUS_BUFF_OWNER_WORK, nil, TARGET_STATUS_BUFF_OWNER_LOCAL_WORK, nil)
			self.cache.usedlocal_o = true
		end
	end
	self.source = (_isOwner and TARGTYPE_BUFF_OWNER or TARGTYPE_BUFF) + _targStat
end		
function Buff:FrameUpdate() local p,t = c.GetBuffUnit() self.parent, self.target, self.enable = p and units:GetUnit(p) or {}, t and units:GetUnit(t) or {}, t and true or false self.source = TARGET_STATUS_BUFF_WORK self.cache = {} end

----------------------------------------------------------------------------------
-- 								プロセスの定義									--
-- 						プロセス系の関数はここにまとめる						--
----------------------------------------------------------------------------------
Process = {}
Process.type = C_TYPE_PROCESS
Process.id = 0
Process.name = 'Process'
Process.parent = {}
Process.target = {}
Process.cache = {}
Process.method = {}
Process.method.parent = Process
Process.param = {}
Process.paramFunc = function(_table, _key) if rawget(_table, _key) == nil then _table[_key] = c.GetProcParam(_key) end log:write(LOG_LEVEL_INFO, 'ProcParam : Index=>', _key, ' Value=>', _table[_key]) return _table[_key] end
setmetatable(Process.param,{__index = Process.paramFunc})
setmetatable(Process,{__index = Process.method, __newindex = AddLoggingMethod})

-- 処理内では参照できないという報告があるので現状処理条件内限定
function Process:Target() return units:GetUnit(c.GetTarget()) end
function Process:Triggers() if self.cache.Triggers == nil then self.cache.Triggers = c.GetUnitTriggers(self.parent:ID()) end return self.cache.Triggers end
function Process:UID(_isParent) if _isParent then if self.cache.puid == nil then self.cache.ppid, self.cache.puid = c.GetProcessID(PROC_INFO_GET_MODE_RELATED) end return self.cache.puid else if self.cache.uid == nil then self.cache.pid, self.cache.uid = c.GetProcessID(PROC_INFO_GET_MODE_CURRENT) end return self.cache.uid end end
function Process:ID(_isParent) if _isParent then if self.cache.ppid == nil then self.cache.ppid, self.cache.puid = c.GetProcessID(PROC_INFO_GET_MODE_RELATED) end return self.cache.ppid else if self.cache.pid == nil then self.cache.pid, self.cache.uid = c.GetProcessID(PROC_INFO_GET_MODE_CURRENT) end return self.cache.pid end end
function Process:SetID(_pid) self.cache.pid = _pid end
function Process:Index(_isParent) if _isParent then if self.cache.pindex == nil then self.cache.pindex = c.GetProcessIndex(PROC_INFO_GET_MODE_RELATED) end return self.cache.pindex else if self.cache.index == nil then self.cache.index = c.GetProcessIndex(PROC_INFO_GET_MODE_CURRENT) end return self.cache.index end end
function Process:Param(_index) return self.param[_index] end
function Process:OptionParam(_index) if self.cache.OptionParam == nil then self.cache.OptionParam = c.GetSubProcOptionParameter() end if not isTableOrClass(self.cache.OptionParam) then self.cache.OptionParam = {self.cache.OptionParam} end if _index == nil then return self.cache.OptionParam else return self.cache.OptionParam[_index] end end
function Process:SetSubProcResult(...) c.SetSubProcResult(...) end
function Process:GetSubProcResult() return c.GetSubProcResult() end
function Process:Affiliation(_uid, _isParent, _comp)
local aff, lid
	_isParent = _isParent or false
	if _comp == nil then
		if _uid and _uid ~= 0 then
			aff = tableGetValue(self.cache, {'AffiliationList', _isParent, _uid})
			if aff == nil then
				aff, lid = c.GetProcAffiliation(_uid, _isParent and PROC_INFO_GET_MODE_RELATED or PROC_INFO_GET_MODE_CURRENT)
				tableSetValue(self.cache, {'AffiliationList', _isParent, _uid}, aff)
				tableSetValue(self.cache, {'localIDList', _isParent, _uid}, lid)
			end
		else
			aff = tableGetValue(self.cache, {'Affiliation', _isParent})
			if aff == nil then
				aff, lid = c.GetProcAffiliation(nil, _isParent and PROC_INFO_GET_MODE_RELATED or PROC_INFO_GET_MODE_CURRENT)
				tableSetValue(self.cache, {'Affiliation', _isParent}, aff)
				tableSetValue(self.cache, {'localID', _isParent}, lid)
			end
		end
		return aff
	else
		if _comp >= PROCESS_SUB_AFFILIATION_BUFF then
			return _comp==self:Affiliation(_uid, _isParent)
		else
			return _comp==(self:Affiliation(_uid, _isParent)&(PROCESS_SUB_AFFILIATION_BUFF-1))
		end
	end
end
function Process:localID(_uid, _isParent)
local aff, lid
	_isParent = _isParent or false
	if _uid and _uid ~= 0 then
		lid = tableGetValue(self.cache, {'localIDList', _isParent, _uid})
		if lid == nil then
			aff, lid = c.GetProcAffiliation(_uid, _isParent and PROC_INFO_GET_MODE_RELATED or PROC_INFO_GET_MODE_CURRENT)
			tableSetValue(self.cache, {'AffiliationList', _isParent, _uid}, aff)
			tableSetValue(self.cache, {'localIDList', _isParent, _uid}, lid)
		end
	else
		lid = tableGetValue(self.cache, {'localID', _isParent})
		if lid == nil then
			aff, lid = c.GetProcAffiliation(nil, _isParent and PROC_INFO_GET_MODE_RELATED or PROC_INFO_GET_MODE_CURRENT)
			tableSetValue(self.cache, {'Affiliation', _isParent}, aff)
			tableSetValue(self.cache, {'localID', _isParent}, lid)
		end
	end
	return lid
end
function Process:IsSucceededControl(_controlId) if self.cache.IsSucceededControl == nil then self.cache.IsSucceededControl = {} end if self.cache.IsSucceededControls == nil then self.cache.IsSucceededControls = c.GetFinishedProc() or {} for i,j in pairs(self.cache.IsSucceededControls) do if j[2] then self.cache.IsSucceededControl[j[1]] = true elseif self.cache.IsSucceededControl[j[1]] == nil then self.cache.IsSucceededControl[j[1]] = false end end end return toBoolean(self.cache.IsSucceededControl[_controlId]) end
function Process:Succeeded() if self.cache.Succeeded == nil then self.cache.Succeeded = c.IsProcSucceeded() end return self.cache.Succeeded end
function Process:SetFailed() self.cache = {} c.SetProcSucceeded(false) end
function Process:SetSucceeded() self.cache = {} c.SetProcSucceeded(true) end
function Process:IsSucceeded() if self.cache.IsSucceeded == nil then self.cache.IsSucceeded = c.IsSucceeded() end return self.cache.IsSucceeded end
function Process:IsSimulating() if self.cache.IsSimulating == nil then self.cache.IsSimulating = c.IsSimulating() end return self.cache.IsSimulating end
-- 現状「生存人数変動時」と「領域内人数変動時」トリガ限定
function Process:TrigUnits(_filterFunc)
local res
	if self.cache.TrigUnits == nil then
		self.cache.TrigUnits = {}
		if myTrigger == TriggerTypes.CollisionInOut then
			self.cache.TrigCollisionIds = {}
			for i,j in pairs(self:Triggers().AreaIn) do self.cache.TrigCollisionIds[i] = true for k,l in pairs(j) do self.cache.TrigUnits[l] = units:GetUnit(l) end end
			for i,j in pairs(self:Triggers().AreaOut) do self.cache.TrigCollisionIds[i] = true for k,l in pairs(j) do self.cache.TrigUnits[l] = units:GetUnit(l) end end
			self.cache.TrigCollisionIds = tableKeys(self.cache.TrigCollisionIds)
			self.cache.TrigUnits = tableToArray(self.cache.TrigUnits)
		else
			for i,j in ipairs(c.GetChangedAlives()) do
				self.cache.TrigUnits[i] = units:GetUnit(j)
			end
		end
	end
	if isFunction(_filterFunc) then
		for i,u in ipairs(self.cache.TrigUnits) do
			res = _filterFunc(u)
		end
	else
		res = self.cache.TrigUnits
	end
	return res
end
-- 「領域内人数変動時」トリガ限定
function Process:TrigCollisions()
	if self.cache.TrigCollisions == nil then
		self.cache.TrigCollisions = {}
		if self.cache.TrigCollisionIds == nil then Process:TrigUnits() end
		for i,j in ipairs(self.cache.TrigCollisionIds or {}) do table.insert(self.cache.TrigCollisions, Field:GetCollisionInstance(j)) end
	end
	return self.cache.TrigCollisions
end
-- 現状「自身のバフ付与状態増減時」トリガ限定
function Process:TrigBuffs()
	if self.cache.TrigBuffs == nil then
		if self.cache.TrigAddBuffs == nil then self.cache.TrigAddBuffs = c.GetChangedBuffs(target:ID(), false) end
		if self.cache.TrigRemoveBuffs == nil then self.cache.TrigRemoveBuffs = c.GetChangedBuffs(target:ID(), true) end
		self.cache.TrigBuffs = copyTable(self.cache.TrigAddBuffs)
		for i,j in pairs(self.cache.TrigRemoveBuffs) do
			table.insert(self.cache.TrigBuffs, j)
		end
	end
	return self.cache.TrigBuffs
end
function Process:TrigAddBuffs()
	if self.cache.TrigAddBuffs == nil then
		self.cache.TrigAddBuffs = c.GetChangedBuffs(target:ID(), false)
	end
	return self.cache.TrigAddBuffs
end
function Process:TrigRemoveBuffs()
	if self.cache.TrigRemoveBuffs == nil then
		self.cache.TrigRemoveBuffs = c.GetChangedBuffs(target:ID(), true)
	end
	return self.cache.TrigRemoveBuffs
end
-- 現状「状態異常付与前」トリガ限定
function Process:TrigAilment(_comp) if _comp == nil then if self.cache.TrigAilment == nil then self.cache.TrigAilment = c.GetAddBadStatus() end return self.cache.TrigAilment else if _comp == AILMENT_ALL then return true end if _comp == AILMENT_BASIC then _comp = IS_AILMENT_COMMON else _comp = {[_comp] = true} end for i,j in pairs(self:TrigAilment()) do if _comp[j] then return true end end return false end end
function Process:GetKeptParam(_index, _vLifeType) local res = c.GetKeptParam(_index, _vLifeType) return res end
function Process:KeepParam(_index, _val, _calc, _vLifeType, _force, _isGvgFix) if _force or NonLocalTriggers[myTrigger] or not this:IsRemote() then c.KeepParam(_index, _val, _calc, _vLifeType, _isGvgFix) end end
function Process:GetCurrentSubUnitID(_targetStatus) if self.cache.GetCurrentSubUnitID == nil then self.cache.GetCurrentSubUnitID = {} end if self.cache.GetCurrentSubUnitID[_targetStatus] == nil then self.cache.GetCurrentSubUnitID[_targetStatus] = select(2, c.GetUnitUID(_targetStatus)) end return self.cache.GetCurrentSubUnitID[_targetStatus] end
function Process:StolenRarity() if self.cache.StolenRarity == nil then self.cache.StolenRarity = c.GetRarityOfStolenItem() end return self.cache.StolenRarity end
function Process:SubProc(_index, _targ, _prob, _params, _optionParams) return c.ExecSubProcess(_index, 0, _targ:ID(), _prob, _params, _optionParams) end
function Process:GenerateBullet(bulletID, targets, delayFrame, igniteBulletGenerate, ignoreOwnerDead, targetStatus)
	if isTableOrClass(targets) and not isTableOrClass(targets, C_TYPE_UNIT) and not isTableOrClass(targets, C_TYPE_MYUNIT) then
		for i,u in pairs(targets) do
			targets[i] = u:ID()
		end
	end
	return c.GenerateBullet(bulletID, self.parent:ID(), targets, delayFrame, igniteBulletGenerate, ignoreOwnerDead, targetStatus)
end
function Process:GetBulletInfo(BUID, bulletProperty)
	if self.cache.GetBulletInfo == nil then self.cache.GetBulletInfo = {} end
	if self.cache.GetBulletInfo[BUID] == nil then self.cache.GetBulletInfo[BUID] = {} end
	if self.cache.GetBulletInfo[BUID][bulletProperty] == nil then self.cache.GetBulletInfo[BUID][bulletProperty] = c.GetBulletProperty(BUID, bulletProperty) end
	return self.cache.GetBulletInfo[BUID][bulletProperty]
end
function Process:SetBulletInfo(BUID, bulletProperty, _val) c.SetBulletProperty(BUID, bulletProperty, _val) self.cache.GetBulletInfo = {}  end
function Process:EditDamageLimit(_val, _per, _add, _noBulletOnly) if Process:GetBulletInfo(-1, BULLET_PROPERTY_ISVALID) then if not _noBulletOnly then return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.DmgLimitUp, {_val, _per, _add}, LIFETYPE_TRANSIENT) else return false end else return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_WORK, self.parent:ID(), ControlTypes.DmgLimitUpNoBullet, {_val, _per, _add}, LIFETYPE_TRANSIENT) end end
function Process:EditHealLimit(_val, _per, _add, _noBulletOnly) if Process:GetBulletInfo(-1, BULLET_PROPERTY_ISVALID) then if not _noBulletOnly then return c.ProcControl(nil, nil, TARGET_STATUS_BULLET_WORK, self.parent:ID(), ControlTypes.HealLimitUp, {_val, _per, _add}, LIFETYPE_TRANSIENT) else return false end else return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_WORK, self.parent:ID(), ControlTypes.HealLimitUpNoBullet, {_val, _per, _add}, LIFETYPE_TRANSIENT) end end
function Process:EditTrigSkillTarget(_targetSide, _target) return c.ProcControl(nil, nil, nil, nil, ControlTypes.ChgSkillTarg, {_targetSide, _target:ID()})  end
function Process:ProcFlag(_index) if self.cache.ProcFlag == nil then self.cache.ProcFlag = {} end if self.cache.ProcFlag[_index] == nil then self.cache.ProcFlag[_index] = c.GetProcFlag(_index) end return self.cache.ProcFlag[_index] end
function Process:EditProcFlag(_index, _val) if self:IsSucceeded() then c.SetProcFlag(_index, _val) end end
-- 呼び出し時はステージされるだけで、RaiseTrigger時に反映される
function Process:SetProcEventValue(_procTrigger, ...) if self.parent.cache.SetProcEventValue == nil then self.parent.cache.SetProcEventValue = {} end self.parent.cache.SetProcEventValue[_procTrigger] = {...} end
function Process:GetProcEventValue(_procTrigger) local t = self.parent:GetValue(UNIT_VALUE_PROCESS_EVENT_INFO) or {} return table.unpack(t[_procTrigger] or {}) end
function Process:PlayTimeline(_index, _owner, _target) c.PlayTimeline(_index, _owner, _target) end
function Process:PlayTimelineLv(_lv, _isDebuff, _owner, _target) if _lv > 0 then c.PlayTimeline((_isDebuff and 6 or 5) + ((_lv - 1) * 2), _owner, _target) end end
function Process:ShowPassive(_t) c.PlayPassiveLine(_t and _t:ID() or this:ID()) end
function Process:ShowPassiveForGeneralCount(_index, _t) _t = _t or this if _t:GetValue({UNIT_VALUE_GENERAL_COUNT_CUT_IN, _index}) then c.PlayPassiveLine(_t:ID()) end end
function Process:ShowMsg(_t, _uiMsgID) c.PlayPassiveLineMsg(_t and _t:ID() or this:ID(), _uiMsgID) end
function Process:ShowMiss(_t, _missType) c.SetMissTypeMode(this:ID(), _missType, 1, _t:ID()) end
function Process:HideMiss(_t, _missType) c.SetMissTypeMode(this:ID(), _missType, 2, _t:ID()) end
function Process:CalcDamage(_atk, _def, _per, _isRandom)
	local v = (_atk > 0 and _atk * (0.9 ^ (_def / _atk * 10)) or 0) / (Field:IsPvP() and math.min(math.max(_atk * 0.004, 1), 20) or 1)
	v = v * _per
	v = v * (_isRandom and 0.9 + (math.random() * 0.1) or 1)
	return math.max(math.floor(v), 1)
end

function Process:FrameUpdate() self.parent = this self.target = target self.cache = {} self.param = {} setmetatable(self.param,{__index = self.paramFunc}) end

----------------------------------------------------------------------------------
-- 							トリガ元プロセスの定義								--
-- 				トリガ元プロセスに対する操作はここにまとめる					--
----------------------------------------------------------------------------------
-- トリガ元プロセスのメソッドを先に定義
TrigProcFunc = {}
function TrigProcFunc:Succeeded() if self.cache.Succeeded == nil then self.cache.Succeeded = c.IsTrigProcSucceeded() end return self.cache.Succeeded end
function TrigProcFunc:SetFailed() self.cache = {} c.SetTrigProcSucceeded(false) end
function TrigProcFunc:UID() if self.cache.uid == nil then self.cache.pid, self.cache.uid = c.GetProcessID(PROC_INFO_GET_MODE_PROCTARGET) end return self.cache.uid end
function TrigProcFunc:ID() if self.cache.pid == nil then self.cache.pid, self.cache.uid = c.GetProcessID(PROC_INFO_GET_MODE_PROCTARGET) end return self.cache.pid end
function TrigProcFunc:Prob() if self.cache.Prob == nil then self.cache.Prob = c.GetTrigProcProbability() end return self.cache.Prob end
function TrigProcFunc:Param(_index) if self.cache.Param == nil then self.cache.Param = c.GetTrigProcParameters() end return _index and self.cache.Param[_index] or self.cache.Param end
function TrigProcFunc:Affiliation() if self.cache.Affiliation == nil then self.cache.Affiliation, self.cache.localID = c.GetTargProcAffiliation() end return (self.cache.Affiliation & 63) end
function TrigProcFunc:localID() if self.cache.localID == nil then self.cache.Affiliation, self.cache.localID = c.GetTargProcAffiliation() end return self.cache.localID end
function TrigProcFunc:EditProb(_val, _per, _add) return c.ProcControl(nil, nil, nil, nil, ControlTypes.ProcProbability, {_val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function TrigProcFunc:EditParam(_behav, _val, _per, _add) return c.ProcControl(nil, nil, nil, nil, ControlTypes.ProcEditParam, {_behav, _val, _per, _add or 0}, LIFETYPE_TRANSIENT) end
function TrigProcFunc:Behav(_index) if self.cache.Behav == nil then self.cache.Behav = c.GetTrigProcBehaviours() end return _index and self.cache.Behav[_index] or self.cache.Behav end
function TrigProcFunc:Category() if self.cache.Category == nil then self.cache.Category = c.GetTrigProcCategories() end return self.cache.Category end
function TrigProcFunc:Buffs() if self.cache.Buffs == nil then self.cache.Buffs = c.GetTrigProcBuffs() end return self.cache.Buffs end
function TrigProcFunc:ProcParam(_index) if self.cache.ProcParam == nil then self.cache.ProcParam = {} end if self.cache.ProcParam[_index] == nil then self.cache.ProcParam[_index] = c.GetProcParameter(_index) end return self.cache.ProcParam[_index] end
function TrigProcFunc:EditProcParam(_index, _val) c.SetProcParameter(_index, _val) end
function TrigProcFunc:ProcFlag(_index) if self.cache.ProcFlag == nil then self.cache.ProcFlag = {} end if self.cache.ProcFlag[_index] == nil then self.cache.ProcFlag[_index] = c.GetProcFlag(_index) end return self.cache.ProcFlag[_index] end
function TrigProcFunc:EditProcFlag(_index, _val) c.SetProcFlag(_index, _val) end


-- プロセス本体を定義
-- メタメソッドにより、トリガ元プロセスが使用不可能なトリガーで呼ばれた場合はメソッドを呼ばずnilを返す
TrigProc = {}
TrigProc.type = C_TYPE_TRIGGER_PROCESS
TrigProc.super = TrigProcFunc
TrigProc.id = 0
TrigProc.name = 'TrigProc'
-- TrigProc.parent = {}
-- TrigProc.target = {}
TrigProc.cache = {}
TrigProc.method = {}
TrigProc.method.parent = TrigProc

TrigProc.enableTrigger = {}
TrigProc.enableTrigger[TriggerTypes.OnOfcProcLot] = true
TrigProc.enableTrigger[TriggerTypes.BeforeOfcProcInvoke] = true
TrigProc.enableTrigger[TriggerTypes.AfterOfcProcInvoke] = true
TrigProc.enableTrigger[TriggerTypes.OnDefProcLot] = true
TrigProc.enableTrigger[TriggerTypes.BeforeDefProcInvoke] = true
TrigProc.enableTrigger[TriggerTypes.AfterDefProcInvoke] = true
TrigProc.enableTrigger[TriggerTypes.OnOfcBuffControl] = true
TrigProc.enableTrigger[TriggerTypes.OnDefBuffControl] = true
TrigProc.enableTrigger[TriggerTypes.BeforeOfsAddStatus] = true
TrigProc.enableTrigger[TriggerTypes.BeforeDefAddStatus] = true

function TrigProc:FrameUpdate() self.cache = {} end
setmetatable(TrigProc.method,{__index = LoggingMethod})
setmetatable(TrigProc,{__index = function(_table, _key) if _table.enableTrigger[myTrigger] then return _table.method[_key] else return function() log:write(LOG_LEVEL_ERROR, 'TrigProc Not Exist : Func=>', _key, ' Trigger=>', myTrigger) return nil end end end, __newindex = AddLoggingMethodSuper})

----------------------------------------------------------------------------------
-- 						クライアントキャッシュの定義							--
----------------------------------------------------------------------------------
ClientCache = {}
ClientCache.type = C_TYPE_CLIENT_CACHE
ClientCache.id = 0
ClientCache.name = 'ClientCache'
ClientCache.cache = {}
ClientCache.method = {}
ClientCache.method.parent = ClientCache
setmetatable(ClientCache,{__index = ClientCache.method, __newindex = AddLoggingMethod})

function ClientCache:SetParamsInfo(_params) self.cache.params = copyTable(_params) end
function ClientCache:SetParamSettings(_paramSettings, _settingsOffset)
	if isNumber(_paramSettings) then self.cache.ParamSettings = bitBooleanList(self.cache.params[_paramSettings]) self.cache.ExcludeParam = _paramSettings elseif isTableOrClass(_paramSettings) then self.cache.ParamSettings = _paramSettings end
	self.cache.SettingsOffset = _settingsOffset or 0
end
function ClientCache:SetKey(_keys)
	if not isTableOrClass(_keys) then
		return false
	elseif not isTableOrClass(_keys[1]) then
		_keys = {_keys}
	end
	if self.cache.Key == nil then self.cache.Key = {} end
	for i,key in pairs(_keys) do
		if isTableOrClass(self.cache.Key[key[1]]) then
			table.insert(self.cache.Key[key[1]], key[2])
		else
			self.cache.Key[key[1]] = {key[2]}
		end
	end
	return true
end
function ClientCache:Regist()
local res
local prm, ps, so, ep = self.cache.params, isTableOrClass(self.cache.ParamSettings) and self.cache.ParamSettings or {}, self.cache.SettingsOffset, self.cache.ExcludeParam
local ck = self.cache.Key
	if isTableOrClass(prm) then
		res = {}
		for i,v in ipairs(prm) do
			if i ~= ep then
				if not ps[i - so] or v <= 0 then
					table.insert(res, CACHE_KEY_COND_PARAM[i])
				elseif v > 15 then
					if isFunction(GetProcParamIndex) then
						for j,pi in ipairs(GetProcParamIndex(v)) do
							table.insert(res, CACHE_KEY_PROC_PARAM[pi])
						end
					else
						return false
					end
				else
					table.insert(res, CACHE_KEY_PROC_PARAM[v])
				end
			end
		end
		res = {CACHE_KEY_PARAM, res}
		for i,v in pairs(ck) do
			table.insert(res, i)
			table.insert(res, v)
		end
		table.insert(res, CACHE_KEY_COND_FUNC_NAME)
		log:write(LOG_LEVEL_INFO, 'ClientCache Regist : Cache Key Params =>', res)
		c.SetCacheInfo(table.unpack(res))
		return true
	else
		return false
	end
end
function ClientCache:FrameUpdate(_params) self.cache = {} self.cache.SettingsOffset = 0 if isTableOrClass(_params) then self.cache.params = copyTable(_params) end end

----------------------------------------------------------------------------------
-- 							タイムラインの定義									--
-- 				タイムラインに対する操作はここにまとめる						--
----------------------------------------------------------------------------------
-- トリガ元プロセスのメソッドを先に定義
TimeLineFunc = {}
function TimeLineFunc:Parent() if self.cache.Parent == nil then self.cache.Parent = units:GetUnit(c.GetTimelineProperty(TIMELINE_PROPERTY_OWNER, self.id)) end return self.cache.Parent end
function TimeLineFunc:Target() if self.cache.Target == nil then self.cache.Target = units:GetUnit(c.GetTimelineProperty(TIMELINE_PROPERTY_SKILL_TARGET, self.id)) end return self.cache.Target end
function TimeLineFunc:IsMain() if self.cache.IsMain == nil then self.cache.IsMain = (c.GetTimelineProperty(TIMELINE_PROPERTY_IS_MAIN, self.id)>=1) end return self.cache.IsMain end
function TimeLineFunc:IsLast() if self.cache.IsLast == nil then self.cache.IsLast = (self.id~=0 and self:SKL_PUID()~=self.id) or (c.GetTimelineProperty(TIMELINE_PROPERTY_NUM_FAMILIES, self.id)<=0) end return self.cache.IsLast end
function TimeLineFunc:SKL_ID() if self.cache.SKL_ID == nil then self.cache.SKL_ID = c.GetTimelineProperty(TIMELINE_PROPERTY_SKILL_ID, self.id) end return self.cache.SKL_ID end
function TimeLineFunc:SKL_PUID() if self.cache.SKL_PUID == nil then self.cache.SKL_PUID = c.GetTimelineProperty(TIMELINE_PROPERTY_SKILL_PUID, self.id) end return self.cache.SKL_PUID end
function TimeLineFunc:SKL_Type(_comp) if _comp == nil then if self.cache.SKL_Type == nil then self.cache.SKL_Type = c.GetTimelineProperty(TIMELINE_PROPERTY_SKILL_TYPE, self.id) end return self.cache.SKL_Type else if _comp == 0 then return true end if _comp > SKILL_COUNTER then _comp = bitBooleanList(_comp, 4) for i,j in pairs(_comp) do if j and self:SKL_Type(i) then return true end end return false else return (_comp==self:SKL_Type() or (_comp==SKILL_PHYSIC and SKILL_CATEGORY_PHYSIC[self:SKL_Type()])) end end end
function TimeLineFunc:IsCounter() if self.cache.IsCounter == nil then self.cache.IsCounter = c.GetTimelineProperty(TIMELINE_PROPERTY_IS_COUNTER, self.id) end return self.cache.IsCounter end
function TimeLineFunc:ParentSkill() if self.cache.ParentSkill == nil then self.cache.ParentSkill = self:Parent():GetSkill(c.GetTimelineProperty(TIMELINE_PROPERTY_SKILL_TYPE, self.id), c.GetTimelineProperty(TIMELINE_PROPERTY_SKILL_INDEX, self.id)) end return self.cache.ParentSkill end
function TimeLineFunc:SKL_SetValue(_index, _val, _option) return self:Parent():SetSkillValue(_index, self:SKL_PUID(), _val, _option) end
function TimeLineFunc:SKL_GetValue(_index) return self:Parent():GetSkillValue(_index, self:SKL_PUID()) end
function TimeLineFunc:EditCastSpeedEdit(_val, _per, _add) return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_REAL, self:Parent():ID(), ControlTypes.CastEdit, {_val, _per, _add or 0, 1}, LIFETYPE_TRANSIENT) end
function TimeLineFunc:SetCastSpeedLimit(_per) if self:Parent():CastSpeedLimit() >= _per then return false else return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_REAL, self:Parent():ID(), ControlTypes.CastMinClamp, {_per, 1}, LIFETYPE_TRANSIENT) end end
-- _add はデフォルトよりも割増で削りたい場合に使用(負ではなく正の値)
function TimeLineFunc:DecLAC(_add)
local b4, af, key, tgt, comp, res
local val = LACERATION_ATK_DEFAULT_SKILL[self:SKL_Type()] + (_add or 0)
	if this:ID() == self:Parent():ID() then
		tgt = self:Target()
		val = this:CalcDecLac(tgt, val)
		if val > 0 then
			if tgt:GetValue(LACERATION_INFO_DEF_BEFORE_SKILL) == self:SKL_PUID() then
				b4 = tgt:GetValue(LACERATION_INFO_DEF_BEFORE_VALUE) or 0
				if val > b4 then
					tgt:SetValue(LACERATION_INFO_DEF_BEFORE_VALUE, val)
					val = val - b4
				else
					return false
				end
				comp = COMPARE_OVER
			else
				tgt:SetValue(LACERATION_INFO_DEF_BEFORE_SKILL, self:SKL_PUID())
				tgt:SetValue(LACERATION_INFO_DEF_BEFORE_VALUE, val)
				comp = COMPARE_NOT_EQUAL
			end
			key = copyTable(LACERATION_INFO_DEF_TOTAL_PER_DETAIL)
			table.insert(key, this:ID())
			b4 = tgt:GetValue(key) or 0
			af = this:GetLacerationAttackDamagePer()
			if luaCompare(comp, af, b4) then tgt:AddLacerationDefenseDamagePer(af - b4) tgt:CalcValue(key, af - b4, CALCULATE_ADD) end
			key = copyTable(LACERATION_INFO_DEF_TOTAL_LIMIT_DETAIL)
			table.insert(key, this:ID())
			b4 = tgt:GetValue(key) or 0
			af = this:GetLacerationAttackDamageLimit()
			if luaCompare(comp, af, b4) then tgt:AddLacerationDefenseDamageLimit(af - b4) tgt:CalcValue(key, af - b4, CALCULATE_ADD) end
			res = tgt:EditLAC(-val, true)
			return true, res
		end
	end
	return false
end
-- タイムライン本体を定義
-- メタメソッドにより、タイムラインが参照不可能なトリガーで呼ばれた場合はメソッドを呼ばずnilを返す
-- 自前で new した場合は参照不可能なトリガーでも使用可能(2023/6/9改修)
TimeLine = {}
TimeLine.type = C_TYPE_TIMELINE
TimeLine.super = TimeLineFunc
TimeLine.id = 0
TimeLine.name = 'TimeLine'
-- TimeLine.parent = {}
-- TimeLine.target = {}
TimeLine.cache = {}
TimeLine.method = {}
TimeLine.method.parent = TimeLine

TimeLine.enableTrigger = {}
TimeLine.enableTrigger[TriggerTypes.BeforeStandby] = true
TimeLine.enableTrigger[TriggerTypes.BeforeSkill] = true
TimeLine.enableTrigger[TriggerTypes.FinishTimeline] = true
TimeLine.enableTrigger[TriggerTypes.TimelineCond] = true

function TimeLine:FrameUpdate() self.cache = {} end
TimeLine.new = function(_id)
local obj = {}
	obj.super = TimeLineFunc
	obj.type = C_TYPE_TIMELINE
	obj.id = _id
	obj.name = 'TimeLine'
	obj.method = {}
	obj.method.parent = obj
	obj.cache = {}
	
	setmetatable(obj.method,{__index = LoggingMethod})
	setmetatable(obj,{__index = obj.method, __newindex = AddLoggingMethod})

	return obj
end

setmetatable(TimeLine.method,{__index = LoggingMethod})
setmetatable(TimeLine,{__index = function(_table, _key) if _table.enableTrigger[myTrigger] then return _table.method[_key] else return function() log:write(LOG_LEVEL_ERROR, 'TimeLine Not Exist : Func=>', _key, ' Trigger=>', myTrigger) return nil end end end, __newindex = AddLoggingMethodSuper})

----------------------------------------------------------------------------------
-- 									領域の拡張									--
----------------------------------------------------------------------------------
function Collision:TrigUnits()
	if self.cache.TrigUnits == nil then
		self.cache.TrigUnits = {}
		if myTrigger == TriggerTypes.CollisionInOut then
			for i,j in pairs(Process:Triggers().AreaIn[self:ID()] or {}) do self.cache.TrigUnits[j] = units:GetUnit(j) end
			for i,j in pairs(Process:Triggers().AreaOut[self:ID()] or {}) do self.cache.TrigUnits[j] = units:GetUnit(j) end
			self.cache.TrigUnits = tableToArray(self.cache.TrigUnits)
		end
	end
	return self.cache.TrigUnits
end
function Collision:Expire() local u = self:Parent() c.RemoveCollision(self.id) if u:IsValid() then Process:SetProcEventValue(PROC_TRIGGER_COLLISION_REMOVE_AFTER, self:ID(), table.unpack(self:GroupIds())) u:RaiseTrigger(PROC_TRIGGER_COLLISION_REMOVE_AFTER) end self.cache = {} end

----------------------------------------------------------------------------------
-- 								領域グループの拡張								--
----------------------------------------------------------------------------------
function CollisionGroup:TrigUnits()
	if self.cache.TrigUnits == nil then
		self.cache.TrigUnits = {}
		if myTrigger == TriggerTypes.CollisionInOut then
			for i,coll in pairs(self.list) do
				for j,u in pairs(coll:TrigUnits()) do
					self.cache.TrigUnits[j] = u
				end
			end
			self.cache.TrigUnits = tableToArray(self.cache.TrigUnits)
		end
	end
	return self.cache.TrigUnits
end

----------------------------------------------------------------------------------
-- 								フィールドの拡張								--
-- 				プロセス側ではほぼFrameUpdateを一本化するためだけにある			--
----------------------------------------------------------------------------------
function Field:GetTimeLine(_puid) if self.cache.GetTimeLine == nil then self.cache.GetTimeLine = {} end if self.cache.GetTimeLine[_puid] == nil then self.cache.GetTimeLine[_puid] = TimeLine.new(_puid) end return self.cache.GetTimeLine[_puid] end
function Field:IsBuffExists(_buffUID) if self.cache.IsBuffExists == nil then self.cache.IsBuffExists = {} end if self.cache.IsBuffExists[_buffUID] == nil then self.cache.IsBuffExists[_buffUID] = (c.GetBuffOwnerByUID(_buffUID)~=0) end return self.cache.IsBuffExists[_buffUID] end
function Field:ExpireBuff(_buffUID) local buff = self:GetBuffInfo(_buffUID) if buff ~= nil then return c.RemoveBuff(buff[BUFF_INFO_OWNER], _buffUID) else return false end end
function Field:EditZel(_val, _per) self.cache={} return c.ProcControl(nil, nil, TARGET_STATUS_UNIT_REAL, this:ID(), ControlTypes.ZelControl, {_val, _per}) end
function Field:PendJudge(_frame, _type, _mode) c.SetPendingJudge(this, _frame, _type, _mode) end
-- ProcessにはInitializeがないため、位置関係把握メソッドの実装はAIと異なる
function Field:MakeAreaCache()
local t,l,r,d = c.GetDistanceWall()
	self.cache.width_mm = math.floor(math.abs(l) + math.abs(r))
	self.cache.depth_mm = math.floor(math.abs(t) + math.abs(d))
	self.cache.top = t + this:PosZ()
	self.cache.down = -(d) + this:PosZ()
	self.cache.left = -(l) + this:PosX()
	self.cache.right = r + this:PosX()
end
function Field:Area()
	return self.Top(), self.Left(), self.Right(), self.Down()
end
function Field:Top()
	if self.cache.top == nil then self:MakeAreaCache() end
	return self.cache.top
end
function Field:Down()
	if self.cache.down == nil then self:MakeAreaCache() end
	return self.cache.down
end
function Field:Left()
	if self.cache.left == nil then self:MakeAreaCache() end
	return self.cache.left
end
function Field:Right()
	if self.cache.right == nil then self:MakeAreaCache() end
	return self.cache.right
end
function Field:Width()
	if self.cache.width_mm == nil then self:MakeAreaCache() end
	return self.cache.width_mm
end
function Field:Depth()
	if self.cache.depth_mm == nil then self:MakeAreaCache() end
	return self.cache.depth_mm
end
function Field:GetRandomPos(_deadX, _deadZ, _deadNegX, _deadNegZ)
	if self.cache.GetRandomPos == nil then self:MakeAreaCache() end
	_deadX, _deadZ = math.max(_deadX or 0, 0), math.max(_deadZ or 0, 0)
	_deadNegX, _deadNegZ = math.min(_deadNegX or -_deadX, 0), math.min(_deadNegZ or -_deadZ, 0)
	return math.random(0, math.abs(self.cache.left) + math.abs(self.cache.right) - _deadX + _deadNegX) + self.cache.left + _deadX, math.random(0, math.abs(self.cache.top) + math.abs(self.cache.down) - _deadZ + _deadNegZ) + self.cache.down + _deadZ
end
function Field:CalcProcValue(_key, _val, _calc, _ever, _processID) _processID = _processID or Process:ID() if not isTableOrClass(_key) then _key = {_key} end _key = {UNIT_VALUE_FIELD_PROCESS_INFO, _processID, table.unpack(_key)} self:CalcValue(_key, _val, _calc, false) if _ever then _key[1] = UNIT_VALUE_FIELD_PROCESS_INFO_EVER self:CalcValue(_key, _val, _calc, true) end end
function Field:GetProcValue(_key, _processID) local pv _processID = _processID or Process:ID() if not isTableOrClass(_key) then _key = {_key} end pv = self:GetValue({UNIT_VALUE_FIELD_PROCESS_INFO, _processID, table.unpack(_key)}) if pv == nil then pv = self:GetValue({UNIT_VALUE_FIELD_PROCESS_INFO_EVER, _processID, table.unpack(_key)}) if pv == nil then return nil end self:SetProcValue(_processID, pv, {UNIT_VALUE_FIELD_PROCESS_INFO, _processID, table.unpack(_key)}) end return pv end
function Field:CreateCollision(targets, listeners, x, y, z, collisionId, groupId, actionType, actionParams)
	local collId = c.CreateCollision(this, targets, listeners, x, y, z, collisionId, actionType, actionParams)
	local coll, collG
	if isTableOrClass(self.cache.CollisionList) then self.cache.CollisionList[collId] = nil end
	coll = self:GetCollisionInstance(collId)
	if groupId ~= nil and groupId ~= 0 then
		if not isTableOrClass(groupId) then groupId = {groupId} end
		for i,j in pairs(groupId) do
			if j ~= 0 then
				collG = self:GetCollisionGroupInstance(j)
				collG:AddCollision(coll)
			end
		end
	end
	Process:SetProcEventValue(PROC_TRIGGER_COLLISION_CREATE_AFTER, collId, isTableOrClass(groupId) and table.unpack(groupId) or nil)
	this:RaiseTrigger(PROC_TRIGGER_COLLISION_CREATE_AFTER)
	return coll
end
function Field:RemoveCollision(collId) local coll = self:GetCollisionInstance(collId) return coll:Expire() end
function Field:AddSupportPassive(id, category, lv, bid, params, noTrigger)
local clv, val
local tbl = self:GetValue({FIELD_VALUE_SUPPORT_PASSIVE_INFO, this:Side()}) or {}
	if not isTableOrClass(tbl[id]) or tbl[id][category] == nil then
		Field:SetValue({FIELD_VALUE_SUPPORT_PASSIVE_INFO, this:Side(), id, category}, {Category = category, CurrentLv = lv, Info = {[lv] = {ParentUID = {[this:ID()] = true}, BuffInfo = {{ID = bid, Params = params}}}}})
	elseif isTableOrClass(tableGetValue(tbl, {id, category, 'Info', lv})) then
		val = tableGetValue(tbl, {id, category, 'Info', lv, 'ParentUID'})
		if not isTableOrClass(val) or not val[this:ID()] then
			val = val or {}
			val[this:ID()] = true
			Field:SetValue({FIELD_VALUE_SUPPORT_PASSIVE_INFO, this:Side(), id, category, 'Info', lv, 'ParentUID'}, val)
		end
	else
		Field:SetValue({FIELD_VALUE_SUPPORT_PASSIVE_INFO, this:Side(), id, category, 'Info', lv}, {ParentUID = {[this:ID()] = true}, BuffInfo = {{ID = bid, Params = params}}})
		clv = tableGetValue(tbl, {id, category, 'CurrentLv'}) or 0
		if lv > clv then Field:SetValue({FIELD_VALUE_SUPPORT_PASSIVE_INFO, this:Side(), id, category, 'CurrentLv'}, lv) end
	end
	for i,u in pairs(units:GetCondUnitList(TARGET_SIDE_ALLY, TARGET_COND_ALL, UNIT_COND_NONE)) do
		if u:IsRemote() then
			u:RaiseTrigger(101, nil, RAISE_TRIGGER_OPTION_VIA_SERVER)
		elseif not noTrigger then
			u:RaiseTrigger(PROC_TRIGGER_CHANGE_SUPPORT_PASSIVE)
		end
	end
end
function Field:RemoveSupportPassive(id, category, lv, noTrigger)
local tbl = self:GetValue({FIELD_VALUE_SUPPORT_PASSIVE_INFO, this:Side(), id, category}) or {}
local val = tableGetValue(tbl, {'Info', lv, 'ParentUID'})
	if isTableOrClass(val) then
		val[this:ID()] = nil
		if not tableFind(val, true) then
			Field:SetValue({FIELD_VALUE_SUPPORT_PASSIVE_INFO, this:Side(), id, category, 'Info', lv}, nil)
			if tbl.CurrentLv == lv then
				tbl.Info[lv] = nil
				val = tableKeys(tbl.Info)
				if #val >= 1 then
					Field:SetValue({FIELD_VALUE_SUPPORT_PASSIVE_INFO, this:Side(), id, category, 'CurrentLv'}, math.max(table.unpack(val)))
				else
					Field:SetValue({FIELD_VALUE_SUPPORT_PASSIVE_INFO, this:Side(), id, category, 'CurrentLv'}, nil)
				end
			end
		else
			Field:SetValue({FIELD_VALUE_SUPPORT_PASSIVE_INFO, this:Side(), id, category, 'Info', lv, 'ParentUID', this:ID()}, nil)
		end
		for i,u in pairs(units:GetCondUnitList(TARGET_SIDE_ALLY, TARGET_COND_ALL, UNIT_COND_NONE)) do
			if u:IsRemote() then
				u:RaiseTrigger(101, nil, RAISE_TRIGGER_OPTION_VIA_SERVER)
			elseif not noTrigger then
				u:RaiseTrigger(PROC_TRIGGER_CHANGE_SUPPORT_PASSIVE)
			end
		end
	end
end

-- thisの拡張は先に定義しておき、毎回FrameUpdate内でunitから拡張する
-- 数が少ないうちは一旦このまま
-- Unit:ActSkill()と比べて明確な優位性がないため削除 2023/8/17
-- function thisActSkill(self) if self.cache.ActSkill == nil then self.cache.ActSkill = self:GetSkill(select(3, c.GetOwnerActiveSkill())) end return self.cache.ActSkill end
function Field:FrameUpdate(_target, _params)
local loglv = LOG_LEVEL
	LOG_LEVEL = math.min(LOG_LEVEL, LOG_LEVEL_WARNING)
	self.cache = {}
	log:FrameUpdate()
	myTrigger = procTrigger
	units = UnitList.new()
	this = units:GetUnit(ownUnit)
	this.type = C_TYPE_MYUNIT
	-- this.ActSkill = thisActSkill
	target = units:GetUnit(_target)
	-- self:RankFrameUpdate() 20240827パフォーマンス改善№5によりコメントアウト(再使用時は解除予定)
	if Bullet.enableTrigger[myTrigger] then Bullet:FrameUpdate() end
	Buff:FrameUpdate()
	Process:FrameUpdate()
	TrigProc:FrameUpdate()
	-- ClientCache:FrameUpdate(_params)
	TimeLine:FrameUpdate()
	LOG_LEVEL = loglv
end
-- print('<color=yellow>GetUnitList count', #c.GetUnitList(TARGET_SIDE_ME, TARGET_COND_BOTH), '</color>')
-- for i,j in pairs(c.GetUnitList(TARGET_SIDE_ME, TARGET_COND_BOTH)) do
-- 	print('<color=yellow>GetUnitList ', i, '=>', j, '</color>')
-- end
