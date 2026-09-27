-- AI/プロセス/条件で共通に参照する定数等を記述
----------------------------------------------------------------------------------
-- 									定数定義部									--
----------------------------------------------------------------------------------
-- ログレベル
LOG_LEVEL_NONE = 0
LOG_LEVEL_ERROR = 1
LOG_LEVEL_WARNING = 2
LOG_LEVEL_ACT_INFO = 3
LOG_LEVEL_INFO = 4

LOG_LEVEL = LOG_LEVEL_NONE

--変数タイプ
ARG_TYPE_NIL = 'nil'
ARG_TYPE_NUM = 'number'
ARG_TYPE_STR = 'string'
ARG_TYPE_BOOL = 'boolean'
ARG_TYPE_TABLE = 'table'
ARG_TYPE_FUNC = 'function'
ARG_TYPE_THREAD = 'thread'
ARG_TYPE_USER = 'userdata'

-- 万分率を実数値に変換する定数
Per2Num = 0.0001

-- 万分率を％に変換する定数
Pml2Pct = 0.01

-- 100%
Pct100 = 10000

-- 1秒
OneSec = 60

-- スキルスロットテーブルのキー
SKILL_SLOT_KEY_TYPE = 'type'
SKILL_SLOT_KEY_INDEX = 'index'

--クラスタイプ
C_TYPE_UNIT = 'Unit'
C_TYPE_MYUNIT = 'This'
C_TYPE_UNIT_LIST = 'UnitList'
C_TYPE_SKILL = 'Skill'
C_TYPE_FIELD = 'Field'
C_TYPE_BULLET = 'Bullet'
C_TYPE_PROCESS = 'Process'
C_TYPE_TRIGGER_PROCESS = 'TrigProc'
C_TYPE_CLIENT_CACHE = 'ClientCache'
C_TYPE_TIMELINE = 'TimeLine'
C_TYPE_BUFF = 'Buff'
C_TYPE_SCORE = 'Score'
C_TYPE_RANK = 'Rank'
C_TYPE_COLLISION = 'Collision'
C_TYPE_COLLISION_GROUP = 'CollisionGroup'

-- マスタータイプ
MASTER_UNIT_DRESS = 10
MASTER_MONSTER = 20
MASTER_MONSTER_DICT = 21
MASTER_ITEM_EQUIP = 40
MASTER_SKILL = 50
MASTER_BUFF = 53
MASTER_WORLD = 60
MASTER_LAND = 61
MASTER_AREA = 62
MASTER_DUNGEON = 63
MASTER_QUEST = 70
MASTER_ORNAMENT_MANAGE = 80
MASTER_ORNAMENT = 81
MASTER_ORNAMENT_POS_LOTTERY = 82
MASTER_BATTLE_POS = 83

-- ユニットドレスマスタ情報
UNIT_DRESS_MST_INFO_CHARA_ID = 2
UNIT_DRESS_MST_INFO_SUB_UNIT_CHARA_ID = 3
UNIT_DRESS_MST_INFO_CHARA_AND_SUB_UNIT_CHARA_ID = 4
UNIT_DRESS_MST_INFO_PERSONAL_SKILL_ID = 120
UNIT_DRESS_MST_INFO_GROUP_INFO = 130

-- スキルマスタ情報
SKILL_MST_INFO_SKILL_ID = 'skillId'
SKILL_MST_INFO_NAME = 'name'
SKILL_MST_INFO_SKILL_TYPE = 'skillType'
SKILL_MST_INFO_SKILL_ROLE = 'skillRole'
SKILL_MST_INFO_SKILL_ROLE_DETAIL = 'skillRoleDetail'
SKILL_MST_INFO_ELEM = 'elem'
SKILL_MST_INFO_WEAPON_ELEM = 'weaponElem'
SKILL_MST_INFO_KILLER = 'killer'
SKILL_MST_INFO_KILLER_VALUE = 'killerValue'
SKILL_MST_INFO_NEED_AP = 'needAp'
SKILL_MST_INFO_USE_CNT = 'useCnt'
SKILL_MST_INFO_INVOKE_COST = 'invokeCost'
SKILL_MST_INFO_ABSOLUTE_LV = 'absoluteLv'
SKILL_MST_INFO_MULTI_CAST = 'multiCast'
SKILL_MST_INFO_TARGET_SIDE = 'targetSide'
SKILL_MST_INFO_TARGET_TYPE = 'targetType'
SKILL_MST_INFO_ACCESS_TYPE = 'accessType'
SKILL_MST_INFO_ACCESS_RANGE = 'accessRange'
SKILL_MST_INFO_ACCESS_RANGE_MIN = 'accessRangeMin'
SKILL_MST_INFO_ACCESS_RANGE_MAX = 'accessRangeMax'
SKILL_MST_INFO_ACCESS_RANGE_Z = 'accessRangeZ'
SKILL_MST_INFO_ACCESS_WARP_FRAME = 'accessWarpFrame'
SKILL_MST_INFO_COST = 'cost'
SKILL_MST_INFO_STANDBY_SA = 'standbySA'
SKILL_MST_INFO_MAIN_SA = 'mainSA'
SKILL_MST_INFO_KIND = 'kind'

-- クエストマスタ情報
QUEST_MST_INFO_QUEST_ID = 'questId'
QUEST_MST_INFO_NAME = 'name'
QUEST_MST_INFO_DUNGEON_ID = 'dungeonId'
QUEST_MST_INFO_CATEGORY = 'category'
QUEST_MST_INFO_QUEST_TYPE = 'questType'
QUEST_MST_INFO_SUB_TYPE = 'subType'
QUEST_MST_INFO_DIFFICULTY = 'difficulty'
QUEST_MST_INFO_DIFFICULTY_LV = 'difficultyLv'
QUEST_MST_INFO_BATTLE_TIME = 'battleTime'
QUEST_MST_INFO_CONTINUABLE = 'continuable'
QUEST_MST_INFO_SCRIPT_ID = 'scriptId'
QUEST_MST_INFO_ORBS = 'orbs'
QUEST_MST_INFO_SWITCH_NEED = 'switchNeed'
QUEST_MST_INFO_SWITCH_COMP = 'switchComp'

-- 配置物管理マスタ情報
ORNAMENT_MNG_MST_INFO_ID = 'ID'
ORNAMENT_MNG_MST_INFO_ORNAMENT_ID = 'ORNAMENT_ID'
ORNAMENT_MNG_MST_INFO_SKILL_ID = 'SKILL_ID'
ORNAMENT_MNG_MST_INFO_POP_MAX = 'POP_MAX'
ORNAMENT_MNG_MST_INFO_FIRST_POP_TRY_MIN = 'FIRST_POP_TRY_MIN'
ORNAMENT_MNG_MST_INFO_FIRST_POP_TRY_MAX = 'FIRST_POP_TRY_MAX'
ORNAMENT_MNG_MST_INFO_REPOP_FRAME = 'REPOP_FRAME'
ORNAMENT_MNG_MST_INFO_REPOP_RATE10000 = 'REPOP_RATE10000'
ORNAMENT_MNG_MST_INFO_REPOP_TRY_MIN = 'REPOP_TRY_MIN'
ORNAMENT_MNG_MST_INFO_REPOP_TRY_MAX = 'REPOP_TRY_MAX'
ORNAMENT_MNG_MST_INFO_ORNAMENT_POS_LOTTERY_ID = 'ORNAMENT_POS_LOTTERY_ID'

-- 配置座標抽選マスタ情報
ORNAMENT_POS_LOTTERY_MST_INFO_ID = 'ID'
ORNAMENT_POS_LOTTERY_MST_INFO_RATE_INFO = 'POSITION_RATE_INFO'
ORNAMENT_POS_LOTTERY_MST_INFO_RATE_INFO_RATE = 'RATE'
ORNAMENT_POS_LOTTERY_MST_INFO_RATE_INFO_RATE_SUM = 'RATE_SUM'
ORNAMENT_POS_LOTTERY_MST_INFO_RATE_INFO_POS_ID = 'POSITION_ID'

-- 配置座標マスタ情報
BATTLE_POS_MST_INFO_ID = 'ID'
BATTLE_POS_MST_INFO_POSITION_LIST = 'POSITION_LIST'

-- ユーザー情報
USER_INFO_SWITCH = 300
USER_INFO_ITEM_MATERIAL = 350
USER_INFO_OPTION = 900

-- ゲームオプションサブID(USER_INFO_OPTION のサブID)
OPTION_INFO_AUTO_NORMAL_ATTACK = 1002
OPTION_INFO_USE_SPECIAL_BY_AI = 1003
OPTION_INFO_MOVE_CONTROL = 1021
OPTION_INFO_AUTO_CONTROL = 1022
OPTION_INFO_BGM_VOL = 3001
OPTION_INFO_SE_VOL = 3002
OPTION_INFO_VOICE_VOL = 3003

-- アリーナ情報
ARENA_INFO_ACTRISE_ID = 1

-- ステータスタイプ
STATUS_TYPE_HP = 64			-- 現在HP
STATUS_TYPE_MP = 1			-- 現在MP
STATUS_TYPE_STR = 2			-- STR
STATUS_TYPE_DEF = 3			-- DEF
STATUS_TYPE_INT = 4			-- MAG
STATUS_TYPE_MND = 5			-- MND
STATUS_TYPE_SPD = 6			-- SPD
STATUS_TYPE_VIT = 7			-- 現在VIT
STATUS_TYPE_CRT = 8			-- CRT
STATUS_TYPE_SUPER_ARMOR = 9	-- SuperArmor
STATUS_TYPE_MAX_HP = 96		-- 最大HP
STATUS_TYPE_TOTAL_MAX_HP = 32-- 分割前最大HP
STATUS_TYPE_MAX_MP = 33		-- 最大MP
STATUS_TYPE_MAX_VIT = 39	-- 最大VIT

-- スキルの種類
-- なし(スキルスロット)
SKILL_SLOT = 0
-- 通常攻撃
SKILL_ATTACK = 9
-- 特技
SKILL_SKILL = 1
-- 魔法
SKILL_MAGIC = 2
-- 魔法陣展開
SKILL_PRECAST = 3
-- 召喚
SKILL_SUMMON = 4
-- 超必
SKILL_SPECIAL = 5
-- パッシブ
SKILL_PASSIVE = 6
-- アークスキル
SKILL_ARK = 7

-- 物理
SKILL_PHYSIC = 10
-- カウンター
SKILL_COUNTER = 15

-- スキルカテゴリまとめ(for用)
SKILL_CATEGORY_LIST = {SKILL_ATTACK, SKILL_SKILL, SKILL_MAGIC, SKILL_PRECAST, SKILL_SUMMON, SKILL_SPECIAL, SKILL_ARK}

-- そのスキルタイプが物理かどうか(比較用)
SKILL_CATEGORY_PHYSIC = {}
SKILL_CATEGORY_PHYSIC[SKILL_ATTACK] = true
SKILL_CATEGORY_PHYSIC[SKILL_SKILL] = true
SKILL_CATEGORY_PHYSIC[SKILL_MAGIC] = false
SKILL_CATEGORY_PHYSIC[SKILL_PRECAST] = false
SKILL_CATEGORY_PHYSIC[SKILL_SUMMON] = false
SKILL_CATEGORY_PHYSIC[SKILL_SPECIAL] = false
SKILL_CATEGORY_PHYSIC[SKILL_ARK] = false

-- スキルタイプをクライアント判定にする際の拡張情報
-- awDefineで定義しているものをそのまま定義する
SKILL_CATEGORY_EXPANSION = {
[SKILL_PHYSIC] = {SKILL_ATTACK, SKILL_SKILL},
[48] = {SKILL_SKILL, SKILL_MAGIC},
[262160] = {SKILL_SKILL, SKILL_COUNTER},
[8224] = {SKILL_ATTACK, SKILL_SKILL, SKILL_MAGIC},
[270336] = {SKILL_ATTACK, SKILL_SKILL, SKILL_COUNTER},
[4352] = {SKILL_ATTACK, SKILL_SPECIAL},
[272] = {SKILL_SKILL, SKILL_SPECIAL},
[288] = {SKILL_MAGIC, SKILL_SPECIAL},
[8448] = {SKILL_ATTACK, SKILL_SKILL, SKILL_SPECIAL},
[304] = {SKILL_SKILL, SKILL_MAGIC, SKILL_SPECIAL},
[8480] = {SKILL_ATTACK, SKILL_SKILL, SKILL_MAGIC, SKILL_SPECIAL},
[270368] = {SKILL_ATTACK, SKILL_SKILL, SKILL_MAGIC, SKILL_COUNTER},
[262416] = {SKILL_SKILL, SKILL_SPECIAL, SKILL_COUNTER},
[270592] = {SKILL_ATTACK, SKILL_SKILL, SKILL_SPECIAL, SKILL_COUNTER},
[267696] = {SKILL_ATTACK, SKILL_SKILL, SKILL_MAGIC, SKILL_SUMMON, SKILL_SPECIAL, SKILL_ARK, SKILL_COUNTER}
}

-- スキル種別
SKILL_KIND_NORMAL = 0
SKILL_KIND_SEIKEN = 1
SKILL_KIND_DR_STONE = 2
SKILL_KIND_SACRED = 3
SKILL_KIND_CREST = 4
SKILL_KIND_TIER = 5
SKILL_KIND_DIVINE_JUDGMENT = 1000

-- スキルロール
-- 攻撃
SKILL_ROLE_ATTACK = 1
-- 回復
SKILL_ROLE_HEAL = 2
-- 補助
SKILL_ROLE_BUFF = 3
-- なくなったので使わない
SKILL_ROLE_DEBUFF = 8
-- 魔法陣展開
SKILL_ROLE_CAST = 16
-- 蘇生
SKILL_ROLE_RESURRECT = 32

-- スキルロール詳細
SKILL_ROLE_DETAIL_ATTACK_PHYSIC = 10
SKILL_ROLE_DETAIL_ATTACK_PHYSIC_AROUND = 11
SKILL_ROLE_DETAIL_ATTACK_MAGIC = 20
SKILL_ROLE_DETAIL_NONE_ELEMENT_MAGIC = 21
SKILL_ROLE_DETAIL_ATTACK_MAGIC_AROUND = 22
SKILL_ROLE_DETAIL_HEAL_HP = 100
SKILL_ROLE_DETAIL_HEAL_MP = 110
SKILL_ROLE_DETAIL_REGENE_HP = 120
SKILL_ROLE_DETAIL_REGENE_MP = 130
SKILL_ROLE_DETAIL_RESURRECT = 200
SKILL_ROLE_DETAIL_REMOVE_ALIMENT_ALL = 300
SKILL_ROLE_DETAIL_REMOVE_ALIMENT_ALL_AND_HEAL_HP = 301
SKILL_ROLE_DETAIL_REMOVE_ALIMENT_POISON = 310
SKILL_ROLE_DETAIL_REMOVE_ALIMENT_PARALYSYS = 320
SKILL_ROLE_DETAIL_REMOVE_ALIMENT_SICK = 330
SKILL_ROLE_DETAIL_REMOVE_ALIMENT_BLIND = 340
SKILL_ROLE_DETAIL_REMOVE_ALIMENT_CURSE = 350
SKILL_ROLE_DETAIL_REMOVE_ALIMENT_SILENCE = 360
SKILL_ROLE_DETAIL_ALIMENT_RANDOM = 400
SKILL_ROLE_DETAIL_ALIMENT_POISON = 410
SKILL_ROLE_DETAIL_TAKING_POISON = 411
SKILL_ROLE_DETAIL_ALIMENT_PARALYSYS = 420
SKILL_ROLE_DETAIL_ALIMENT_SICK = 430
SKILL_ROLE_DETAIL_ALIMENT_BLIND = 440
SKILL_ROLE_DETAIL_ALIMENT_CURSE = 450
SKILL_ROLE_DETAIL_ALIMENT_SILENCE = 460
SKILL_ROLE_DETAIL_ALIMENT_RAGE = 470
SKILL_ROLE_DETAIL_BUFF_ESSENTIAL = 500
SKILL_ROLE_DETAIL_BUFF_ESSENTIAL_ARENA = 501
SKILL_ROLE_DETAIL_BUFF_PRIORITY = 510
SKILL_ROLE_DETAIL_BUFF_PRIORITY_ARENA = 511
SKILL_ROLE_DETAIL_BUFF_NORMAL = 520
SKILL_ROLE_DETAIL_BUFF_NORMAL_ARENA = 521
SKILL_ROLE_DETAIL_BUFF_ELEMENT_NONE = 530
SKILL_ROLE_DETAIL_BUFF_ELEMENT_FIRE = 531
SKILL_ROLE_DETAIL_BUFF_ELEMENT_ICE = 532
SKILL_ROLE_DETAIL_BUFF_ELEMENT_TREE = 533
SKILL_ROLE_DETAIL_BUFF_ELEMENT_THUNDER = 534
SKILL_ROLE_DETAIL_BUFF_ELEMENT_LIGHT = 535
SKILL_ROLE_DETAIL_BUFF_ELEMENT_DARK = 536
SKILL_ROLE_DETAIL_BUFF_SABER = 540
SKILL_ROLE_DETAIL_DEBUFF_ESSENTIAL = 600
SKILL_ROLE_DETAIL_DEBUFF_ESSENTIAL_ARENA = 601
SKILL_ROLE_DETAIL_DEBUFF_TOP_PRIORITY = 602
SKILL_ROLE_DETAIL_DEBUFF_PRIORITY = 610
SKILL_ROLE_DETAIL_DEBUFF_PRIORITY_ARENA = 611
SKILL_ROLE_DETAIL_DEBUFF_NORMAL = 620
SKILL_ROLE_DETAIL_DEBUFF_NORMAL_ARENA = 621
SKILL_ROLE_DETAIL_PRECAST_MIDDLE = 700
SKILL_ROLE_DETAIL_PRECAST_HIGH = 710
SKILL_ROLE_DETAIL_CHARISMA = 720
SKILL_ROLE_DETAIL_ANIMA = 721
SKILL_ROLE_DETAIL_ERASE_DEBUFF = 730
SKILL_ROLE_DETAIL_ERASE_DEBUFF_STR = 731
SKILL_ROLE_DETAIL_ERASE_DEBUFF_DEF = 732
SKILL_ROLE_DETAIL_ERASE_DEBUFF_INT = 733
SKILL_ROLE_DETAIL_ERASE_DEBUFF_MND = 734

SKILL_ROLE_DETAIL_REMOVE_ALIMENT_ALL_LIST = {
[SKILL_ROLE_DETAIL_REMOVE_ALIMENT_POISON] = true,
[SKILL_ROLE_DETAIL_REMOVE_ALIMENT_PARALYSYS] = true,
[SKILL_ROLE_DETAIL_REMOVE_ALIMENT_SICK] = true,
[SKILL_ROLE_DETAIL_REMOVE_ALIMENT_BLIND] = true,
[SKILL_ROLE_DETAIL_REMOVE_ALIMENT_CURSE] = true,
[SKILL_ROLE_DETAIL_REMOVE_ALIMENT_SILENCE] = true
}

-- スキルの対象
-- 敵
SKILL_TARGET_OPPONENT = 1
-- 味方
SKILL_TARGET_ALLY = 2
-- 自分自身に使用
SKILL_TARGET_ME = 3

-- スキルのターゲット条件
-- 自分
SKILL_TARGET_COND_ME = 1
-- 自分単体以外
SKILL_TARGET_COND_NOT_ONLY_ME = 2
-- 自分以外
SKILL_TARGET_COND_NOT_ME = 3
-- 自分:自分以外全体含む
SKILL_TARGET_COND_NOT_ONLY_OTHER = 4

-- スキルの規模
SKILL_SCALE_SINGLE = 1
SKILL_SCALE_WHOLE = 2

-- スキルの重複可否
SKILL_CAN_MULTI_CAST = 0
SKILL_CANNOT_MULTI_CAST = 1

-- スキルのプロセス付加情報
SKILL_PROC_INFO_SUB_ELEMENT = 100
SKILL_PROC_INFO_SKILL_GROUP = 200

-- 魔法陣展開レベル
PRECAST_LEVEL_NONE = 0
PRECAST_LEVEL_MIDDLE = 2
PRECAST_LEVEL_HIGH = 3

-- スキルタイプが使用不可な理由
-- SKILL_USE_CAN(0)は使用可能
SKILL_USE_CAN = 0
SKILL_USE_STATE = 1
SKILL_USE_AILMENT = 2
SKILL_USE_PROCESS = 4
SKILL_USE_OPTION = 8

-- スキル履歴のインデックス
SKILL_HISTORY_TYPE = 1
SKILL_HISTORY_INDEX = 2
SKILL_HISTORY_SLOT_INDEX = 3
SKILL_HISTORY_TARGET = 4
SKILL_HISTORY_TIME = 5

-- UnitPlaySkill()のモード
PLAYSKILL_MODE_NORMAL = 0			-- 可能であれば使用(即時で使用できなければキャンセル)
PLAYSKILL_MODE_WAIT = 1				-- 可能であれば使用(即時で使用できなければIdleになるまで遅延)
PLAYSKILL_MODE_COUNTER = 2			-- 可能であれば使用(即時で使用できなければカウンターが発動可能な状態まで遅延)
PLAYSKILL_MODE_FORCE = 8			-- ステートや発動可否に関わらず強制使用(死亡状態は除く。自身のステートを強制的にMainに切り替える)
PLAYSKILL_MODE_FORCE_NONSTATE = 9	-- ステートや発動可否に関わらず強制使用(死亡状態は除く。自身のステートはそのまま)
PLAYSKILL_MODE_FORCE_GODMODE = 10	-- ステートや発動可否に関わらず強制使用(死亡状態でも使用)

PLAYSKILL_OPTION_NORMAL = 0			-- 特になし
PLAYSKILL_OPTION_IGNORECOST = 1		-- コストを無視

PLAYSKILL_MOVE_NORMAL = 0			-- マスタの設定に従う（移動が中断されるとスキルが開始されない場合あり）
PLAYSKILL_MOVE_DIRECT = 1			-- 強制的に「その場」扱いとする（スカる場合あり）
PLAYSKILL_MOVE_WARP = 2				-- マスタの設定に基づき、超必殺技同様、即座に移動して発動する

PLAYSKILL_STAT_LOST = 0				-- 予約に失敗した
PLAYSKILL_STAT_RESERVE = 1			-- 予約に成功した
PLAYSKILL_STAT_PLAY = 2				-- 即時発動した

-- パッシブスキルの所属
PROC_AFFILIATION_NONE = 0
PROC_AFFILIATION_BUFF = 2
PROC_AFFILIATION_AUTOSKILL = 4
PROC_AFFILIATION_ARK = 5
PROC_AFFILIATION_WEAPON = 6
PROC_AFFILIATION_ARMOR = 7
PROC_AFFILIATION_ACCESSORY = 8
PROC_AFFILIATION_TERRAIN = 9
PROC_AFFILIATION_FORMATION = 12

-- 味方ユニットグループ
UNIT_ALLY = 2
-- 敵ユニットグループ
UNIT_OPPONENT  = 1

-- 敵・味方全て
TARGET_SIDE_ALL = 0
-- 敵に使用
TARGET_SIDE_OPPONENT = 1
-- 味方に使用
TARGET_SIDE_ALLY = 2
-- 自分自身に使用
TARGET_SIDE_ME = 3
-- なし
TARGET_SIDE_NONE = 5

-- 味方側
TARGET_TYPE_ALLY = 1
-- 敵側
TARGET_TYPE_OPPONENT = 2
-- 自分
TARGET_TYPE_ME = 3
-- リスト指定
TARGET_TYPE_LIST = 4
-- 全員
TARGET_TYPE_ALL = 5

-- 生存の有無
TARGET_COND_ALL = -1	-- GetCondUnitListのみ対応
TARGET_COND_BOTH = 0
TARGET_COND_ALIVE = 1
TARGET_COND_DEAD = 2
TARGET_COND_SECEDE = 3

-- 行動状態
STATE_IDLE = 0
STATE_MOVE = 1
STATE_STANDBY = 2
STATE_MAIN = 3
STATE_DAMAGE = 4
STATE_DAMAGESKY = 5
STATE_GUARD = 6
STATE_DEAD = 7
STATE_ATTRACT = 8
STATE_BREAK = 9
STATE_RESURRECT = 10
STATE_ACCESS = 12
STATE_OPERATION = 13

-- 向き
DIR_LEFT = 0
DIR_RIGHT = 1

-- 対象への向き
DIR_TO_FRONT = 0
DIR_TO_BACK = 1

-- 気絶・ブレイク
VIT_TYPE_ALL = 0
VIT_TYPE_STUN = 1
VIT_TYPE_BREAK = 2

-- ユニットドレスグループ
UNIT_DRESS_GROUP_NONE = 0
UNIT_DRESS_GROUP_MONSTER = 1
UNIT_DRESS_GROUP_EIREI = 2

-- キャラクタータイプ
CHARA_TYPE_THIS = -1
CHARA_TYPE_DUMMY = 1
CHARA_TYPE_SOLDIER = 1001
CHARA_TYPE_SNIPER = 1002
CHARA_TYPE_KNIGHT = 1003
CHARA_TYPE_SORCERER = 1004
CHARA_TYPE_HEALER = 1005
CHARA_TYPE_BEAST = 2001
CHARA_TYPE_PLANT = 2002
CHARA_TYPE_INSECT = 2003
CHARA_TYPE_BIRD = 2004
CHARA_TYPE_MAGICAL = 2005
CHARA_TYPE_UNDEAD = 2006
CHARA_TYPE_STONE = 2007
CHARA_TYPE_MACHINE = 2008
CHARA_TYPE_SPIRIT = 2009
CHARA_TYPE_DRAGON = 2010
CHARA_TYPE_GOD = 2011
CHARA_TYPE_FISH = 2012

CHARA_TYPE_LIST = {CHARA_TYPE_SOLDIER, CHARA_TYPE_SNIPER, CHARA_TYPE_KNIGHT, CHARA_TYPE_SORCERER, CHARA_TYPE_BEAST, CHARA_TYPE_PLANT, CHARA_TYPE_INSECT, CHARA_TYPE_BIRD, CHARA_TYPE_MAGICAL, CHARA_TYPE_UNDEAD, CHARA_TYPE_STONE, CHARA_TYPE_MACHINE, CHARA_TYPE_SPIRIT, CHARA_TYPE_DRAGON, CHARA_TYPE_GOD, CHARA_TYPE_FISH}

-- キャラカテゴリ識別ID
-- キャラタイプの上一桁
CHARA_CATEGORY_DUMMY = 0
CHARA_CATEGORY_HUMAN = 1
CHARA_CATEGORY_OTHER = 2

-- ユニット性別
GENDER_MALE = 1
GENDER_FEMALE = 2
GENDER_UNKNOWN = 3
GENDER_DUMMY = 4

-- ボスフラグ
ENEMY_TYPE_ALL = 0
ENEMY_TYPE_NORMAL = 1
ENEMY_TYPE_BOSS = 2

-- 属性
ELEMENT_NOT_DARK = -16
ELEMENT_NOT_LIGHT = -15
ELEMENT_NOT_THUNDER = -14
ELEMENT_NOT_TREE = -13
ELEMENT_NOT_ICE = -12
ELEMENT_NOT_FIRE = -11
ELEMENT_WEAPON_2_NOT_NONE = -10 --thisの武器を見る(無以外)
ELEMENT_WEAPON_1_NOT_NONE = -9 --thisの武器を見る(無以外)
ELEMENT_ANY_WEAPON_NOT_NONE = -8 --thisの武器を見る(無以外)
ELEMENT_SAME_WEAPON_NOT_NONE = -7 --thisの武器を見る(無以外)
ELEMENT_WEAPON_2 = -6 --thisの武器を見る
ELEMENT_WEAPON_1 = -5 --thisの武器を見る
ELEMENT_ANY_WEAPON = -4 --thisの武器を見る
ELEMENT_SAME_WEAPON = -3 --thisの武器を見る
ELEMENT_UNMENTIONED = -2
ELEMENT_ALL = -1
ELEMENT_NONE = 0
ELEMENT_FIRE = 1
ELEMENT_ICE = 2
ELEMENT_TREE = 3
ELEMENT_THUNDER = 4
ELEMENT_LIGHT = 5
ELEMENT_DARK = 6

ELEMENT_STRONG = {[ELEMENT_FIRE] = ELEMENT_TREE, [ELEMENT_ICE] = ELEMENT_FIRE, [ELEMENT_TREE] = ELEMENT_THUNDER, [ELEMENT_THUNDER] = ELEMENT_ICE, [ELEMENT_LIGHT] = ELEMENT_DARK, [ELEMENT_DARK] = ELEMENT_LIGHT}
ELEMENT_WEAK = {[ELEMENT_FIRE] = ELEMENT_ICE, [ELEMENT_ICE] = ELEMENT_THUNDER, [ELEMENT_TREE] = ELEMENT_FIRE, [ELEMENT_THUNDER] = ELEMENT_TREE, [ELEMENT_LIGHT] = ELEMENT_DARK, [ELEMENT_DARK] = ELEMENT_LIGHT}

-- 属性をクライアント判定にする際の拡張情報
-- 0未満の値を使用する場合はこちらにも定義する
-- 動的に要素を変更したい場合はテーブルをディープコピーした上で編集すること
ELEMENT_EXPANSION = {
[ELEMENT_ALL] = {ELEMENT_FIRE, ELEMENT_ICE, ELEMENT_TREE, ELEMENT_THUNDER, ELEMENT_LIGHT, ELEMENT_DARK},
[ELEMENT_UNMENTIONED] = {ELEMENT_NONE, ELEMENT_FIRE, ELEMENT_ICE, ELEMENT_TREE, ELEMENT_THUNDER, ELEMENT_LIGHT, ELEMENT_DARK},
[ELEMENT_NOT_FIRE] = {ELEMENT_NONE, ELEMENT_ICE, ELEMENT_TREE, ELEMENT_THUNDER, ELEMENT_LIGHT, ELEMENT_DARK},
[ELEMENT_NOT_ICE] = {ELEMENT_NONE, ELEMENT_FIRE, ELEMENT_TREE, ELEMENT_THUNDER, ELEMENT_LIGHT, ELEMENT_DARK},
[ELEMENT_NOT_TREE] = {ELEMENT_NONE, ELEMENT_FIRE, ELEMENT_ICE, ELEMENT_THUNDER, ELEMENT_LIGHT, ELEMENT_DARK},
[ELEMENT_NOT_THUNDER] = {ELEMENT_NONE, ELEMENT_FIRE, ELEMENT_ICE, ELEMENT_TREE, ELEMENT_LIGHT, ELEMENT_DARK},
[ELEMENT_NOT_LIGHT] = {ELEMENT_NONE, ELEMENT_FIRE, ELEMENT_ICE, ELEMENT_TREE, ELEMENT_THUNDER, ELEMENT_DARK},
[ELEMENT_NOT_DARK] = {ELEMENT_NONE, ELEMENT_FIRE, ELEMENT_ICE, ELEMENT_TREE, ELEMENT_THUNDER, ELEMENT_LIGHT},
}

-- 状態異常
AILMENT_BASIC = -1
AILMENT_ALL = 0
AILMENT_POISON = 1
AILMENT_PARALYSYS = 2
AILMENT_SICK = 3
AILMENT_BLIND = 4
AILMENT_CURSE = 5
AILMENT_SILENCE = 6
AILMENT_SEAL = 10
AILMENT_FREEZE = 11
AILMENT_RAGE = 12
AILMENT_CORRUPTION = 13
AILMENT_DEADLYPOISON = 20
AILMENT_HINDERCHANT = 21
AILMENT_GLOOM = 22
AILMENT_DISEASE = 23
AILMENT_BOUND = 24

AILMENT_COMMON = {AILMENT_POISON, AILMENT_PARALYSYS, AILMENT_SICK, AILMENT_BLIND, AILMENT_CURSE, AILMENT_SILENCE}
IS_AILMENT_COMMON = {[AILMENT_POISON] = true, [AILMENT_PARALYSYS] = true, [AILMENT_SICK] = true, [AILMENT_BLIND] = true, [AILMENT_CURSE] = true, [AILMENT_SILENCE] = true}

-- 地形効果
TERRAIN_NONE = 0
TERRAIN_COLD = 1
TERRAIN_HOT = 2
TERRAIN_HEAT = 3
TERRAIN_WATER = 4
TERRAIN_POISON = 5
TERRAIN_SEAL = 6
TERRAIN_CURSE = 7
TERRAIN_STRAY = 8

-- 装備箇所
EQUIP_POS_WEAPON = 1
EQUIP_POS_ARMOR = 2
EQUIP_POS_ACCESSORY_1 = 3
EQUIP_POS_ACCESSORY_2 = 4
EQUIP_POS_SKIN = 5

-- 装備品タイプ
EQUIP_TYPE_SWORD = 10
EQUIP_TYPE_AX = 11
EQUIP_TYPE_SPEAR = 12
EQUIP_TYPE_HAMMER = 13
EQUIP_TYPE_BOW = 14
EQUIP_TYPE_MACHINE = 15
EQUIP_TYPE_CLAW = 16
EQUIP_TYPE_WAND = 17
EQUIP_TYPE_ARMOR = 20
EQUIP_TYPE_WEAR = 21
EQUIP_TYPE_ROBE = 22
EQUIP_TYPE_ACCESSORY = 30

-- ユニットスケールタイプ
UNIT_SCALE_TYPE_GROSS = 0
UNIT_SCALE_TYPE_TIMELINE = 1
UNIT_SCALE_TYPE_MST = 2

-- ユニットプロパティタイプ
UNIT_PROPERTY_GROUND_HEIGHT = 1
UNIT_PROPERTY_LEVEL = 50
UNIT_PROPERTY_LIMITBREAK_LV = 51
UNIT_PROPERTY_AWAKE_LV = 52
UNIT_PROPERTY_FIXED_TARGET = 102
UNIT_PROPERTY_PROC_VALUE = 151
UNIT_PROPERTY_CALC_LUA_VALUE = 152
UNIT_PROPERTY_CALC_PROC_VALUE = 153
UNIT_PROPERTY_ACTIVE_TIME = 170
UNIT_PROPERTY_IS_REMOTE = 200
UNIT_PROPERTY_IS_OWNER = 201
UNIT_PROPERTY_CAST_MIN_CLAMP = 220
UNIT_PROPERTY_PERSONALITY_LV = 300
UNIT_PROPERTY_SKILL_LV = 310
UNIT_PROPERTY_SHADOW_MIN_HEIGHT = 600
UNIT_PROPERTY_SHADOW_MAX_HEIGHT = 601
UNIT_PROPERTY_SHADOW_OFFSET_HEIGHT = 602
UNIT_PROPERTY_SHADOW_SCALE_RATIO = 610
UNIT_PROPERTY_SHADOW_SCALE = 611
UNIT_PROPERTY_SHADOW_ALPHA_RATIO = 620
UNIT_PROPERTY_SHADOW_ALPHA = 621
UNIT_PROPERTY_ACTIVE_SKILL_PUID = 1000
UNIT_PROPERTY_IS_BUFF_BY_UID = 3000
UNIT_PROPERTY_GET_BUFF_UID_BY_ID = 3001

-- 領域の挙動タイプ
COLLISION_ACTION_TYPE_STAY = 0
COLLISION_ACTION_TYPE_FOLLOWING = 2

-- 追従先アンカーのタイプ
ANCHOR_TYPE_TARGTOP = 350
ANCHOR_TYPE_TARGCENTER = 351
ANCHOR_TYPE_TARGBOTTOM = 352
ANCHOR_TYPE_TARGPOS = 353
ANCHOR_TYPE_TARGGROUND = 354

-- バフリスト
BuffIds = {
	AutoSkillControl	= 101,	-- オートスキル制御用
	AutoSkillControl2	= 102,	-- オートスキル制御用2
	P_MpDecDmgPerFlag1	= 200,	-- P_特技発動時MP消費与ダメージ増加フラグ_特技1
	P_MpDecDmgPerFlag2	= 201,	-- P_特技発動時MP消費与ダメージ増加フラグ_特技2
	P_MpDecDmgPerFlag3	= 202,	-- P_特技発動時MP消費与ダメージ増加フラグ_特技3
	P_MpDecDmgPerJudge1	= 300,	-- P_特技発動時MP消費与ダメージ増加判定_特技1
	P_MpDecDmgPerJudge2	= 301,	-- P_特技発動時MP消費与ダメージ増加判定_特技2
	P_MpDecDmgPerJudge3	= 302,	-- P_特技発動時MP消費与ダメージ増加判定_特技3
	P_MpDecDmgPer1		= 400,	-- P_特技発動時MP消費与ダメージ増加_特技1
	P_MpDecDmgPer2		= 401,	-- P_特技発動時MP消費与ダメージ増加_特技2
	P_MpDecDmgPer3		= 402,	-- P_特技発動時MP消費与ダメージ増加_特技3
	Control_UseBuffUid	= 500,	-- 制御用バフ_UID使用前提
	Control_UseBuffUid_DE= 501,	-- 制御用バフ_UID使用前提_死亡時解除
	Control_UseBuffUid_AE= 502,	-- 制御用バフ_UID使用前提_復活時解除
	NearAttackAutoCounter= 11108,	-- 近距離通常攻撃被弾時自動反撃【無】
	NearAttackAutoCounterFire= 11109,	-- 近距離通常攻撃被弾時自動反撃【炎】
	NearAttackAutoCounterIce= 11110,	-- 近距離通常攻撃被弾時自動反撃【氷】
	NearAttackAutoCounterTree= 11111,	-- 近距離通常攻撃被弾時自動反撃【樹】
	NearAttackAutoCounterThunder= 11112,	-- 近距離通常攻撃被弾時自動反撃【雷】
	NearAttackAutoCounterLight= 11113,	-- 近距離通常攻撃被弾時自動反撃【光】
	NearAttackAutoCounterDarkness= 11114,	-- 近距離通常攻撃被弾時自動反撃【闇】
	Regene				= 20000,	-- リジェネ
	YggRegene			= 20001,	-- リジェネ(ユグドラシル専用)
	E_Regene			= 20002,	-- リジェネ(オートリジェネ)
	P_RatioRegene		= 20003,	-- 割合リジェネ(パッシブ)
	P_Regene			= 20004,	-- リジェネ(パッシブ)
	StyleGreen			= 20005,	-- 天山の構え【翠】
	Regene2				= 20006,	-- リジェネ2
	MeatDinner			= 20100,	-- 肉の晩餐
	HpRecoverFuture		= 20101,	-- 時間経過HP回復
	DevilMode			= 20102,	-- 鬼神化
	Gen_SctRecover		= 20200,	-- 薄っぺらな言葉
	P_IntervalSctRecover= 20201,	-- P_指定時間毎単独SCT回復
	Reraise				= 20500,	-- リレイズ
	Endure				= 20600,	-- 根性
	NextPhysicalSkillEndure= 20601,	-- 回数制限付き対物理スキル中根性
	NormalDrain			= 20700,	-- 通常攻撃時HP吸収
	NextSkillDrain		= 20701,	-- 回数制限付き特技攻撃時指定確率HP吸収
	P_TargetSkillPUIDDrain= 20702,	-- P_特定PUIDスキル攻撃時指定確率HP吸収
	SctRcvVal			= 21000,	-- SCT回復量増加
	E_SctRcvVal			= 21001,	-- SCT回復量増加(オートヘイスト)
	P_SctRcvVal			= 21002,	-- SCT回復量増加(パッシブ)
	ModeCleanUp			= 21003,	-- 掃討モード
	SctRcvValSkill1		= 21004,	-- 特技1SCT回復量増加
	SctRcvValSkill2		= 21005,	-- 特技2SCT回復量増加
	SctRcvValSkill3		= 21006,	-- 特技3SCT回復量増加
	SctRcvValSingleSkill = {
	[0] = 21000,
	[1] = 21004,
	[2] = 21005,
	[3] = 21006,
	},								-- 単独SCT回復量増加_まとめ
	MpRegene			= 21200,	-- MPリジェネ
	P_MpRegene			= 21201,	-- MPリジェネ(パッシブ)
	P_TargetSkillConvMP	= 21202,	-- 特定スキルMP変換(パッシブ)
	E_MpRegene			= 21203,	-- MPリジェネ(オートマジック)
	AfterTimeMpRecover		= 21204,	-- 花言葉は嘘つき
	P_TargetSkillPUIDHealPer= 21300,	-- P_指定PUIDスキル回復量増減
	HealPer				= 21301,	-- HP回復量増加
	EtherRcv			= 21500,	-- 超必殺技ゲージ増加量増加
	StrEdit				= 30000,	-- STR増加
	FireEquipStatus		= 30001,	-- 炎装(ステアップ)
	E_StrEdit			= 30002,	-- STR増加(オートブレイブ)
	WP_StrEdit			= 30003,	-- STR増加(Wave跨ぎパッシブ)
	P_StatusEdit		= 30004,	-- 全ステ増加(パッシブ)
	P_StrEdit			= 30005,	-- STR増加(パッシブ)
	HumanStrEdit		= 30006,	-- 人型STR増加
	OtherStrEdit		= 30007,	-- 魔獣STR増加
	E_StatusEdit		= 30008,	-- 全ステ増加(永続)
	StyleRed			= 30009,	-- 修羅の構え【紅】
	P_Dragonoid			= 30010,	-- P_竜魔人
	GiveName			= 30011,	-- 名前をつける
	AllStatusEdit		= 30012,	-- 全ステ増加
	P_CharaCountCondTargetStatusEdit= 30013,-- 特定キャラ生存人数状況指定ステータス増減
	P_CharaCategoryCountCondTargetStatusEdit= 30014,-- 特定キャラカテゴリ生存人数状況指定ステータス増減
	P_TargetStatusEdit	= 30015,	-- P_対象ステータス増減
	WP_StatusEdit		= 30016,	-- 全ステ増加(Wave跨ぎパッシブ)
	PD_StrEdit			= 30017,	-- STR増加(死亡時解除パッシブ)
	DefEdit				= 30100,	-- DEF増加
	E_DefEdit			= 30101,	-- DEF増加(永続)
	P_DefEdit			= 30102,	-- DEF増加(パッシブ)
	FA_DefEdit			= 30103,	-- FA専用DEF増加
	WP_DefEdit			= 30104,	-- DEF増加(Wave跨ぎパッシブ)
	PD_DefEdit			= 30105,	-- DEF増加(死亡時解除パッシブ)
	IntEdit				= 30200,	-- INT増加
	IntUpMndDown		= 30201,	-- INT増加＆MND減少
	E_IntEdit			= 30202,	-- INT増加(オートオーラ)
	Zekus_Attack		= 30203,	-- 千変万化【攻撃】
	P_IntEdit			= 30204,	-- P_INT増加
	WP_IntEdit			= 30205,	-- WP_INT増加
	MndEdit				= 30300,	-- MND増加
	E_MndEdit			= 30301,	-- MND増加(永続)
	Zekus_Defense		= 30302,	-- 千変万化【防御】
	P_MndEdit			= 30303,	-- MND増加(パッシブ)
	WP_MndEdit			= 30304,	-- MND増加(Wave跨ぎパッシブ)
	CrtEdit				= 30400,	-- CRT率増加
	E_CrtEdit			= 30401,	-- CRT率増加(オートクリティカル)
	P_ResistCrt			= 30402,	-- P_CRT耐性
	MaxHpEdit			= 30500,	-- 最大HP増加
	Demonization		= 30501,	-- 鬼族の角
	P_MaxHpEdit			= 30502,	-- P_最大HP増加
	WP_MaxHpEdit		= 30503,	-- WP_最大HP増加
	E_MaxHpEdit			= 30504,	-- 最大HP増加(永続)
	PoisonResist		= 30601,	-- 毒耐性増加
	ParalysysResist		= 30602,	-- 麻痺耐性増加
	SickResist			= 30603,	-- 病気耐性増加
	DarknessResist		= 30604,	-- 暗闇耐性増加
	CurseResist			= 30605,	-- 呪い耐性増加
	SlienceResist		= 30606,	-- 沈黙耐性増加
	AilmentBarrier		= 30607,	-- 一定回数基本異常無効化
	YggAilmentResist	= 30649,	-- 基本状態異常耐性増加(ユグドラシル専用)
	ElementResist		= 30700,	-- 全属性耐性増加
	FireResist			= 30701,	-- 炎耐性増加
	IceResist			= 30702,	-- 氷耐性増加
	TreeResist			= 30703,	-- 樹耐性増加
	ThunderResist		= 30704,	-- 雷耐性増加
	LightResist			= 30705,	-- 光耐性増加
	DarknessResist		= 30706,	-- 闇耐性増加
	P_PenetrateElemResistPUID= 30707,	-- P_特定PUIDスキル敵属性耐性貫通
	KillerResist = {
	[CHARA_TYPE_SOLDIER] = 30800,
	[CHARA_TYPE_SNIPER] = 30801,
	[CHARA_TYPE_KNIGHT] = 30802,
	[CHARA_TYPE_SORCERER] = 30803,
	[CHARA_TYPE_BEAST] = 30804,
	[CHARA_TYPE_PLANT] = 30805,
	[CHARA_TYPE_INSECT] = 30806,
	[CHARA_TYPE_BIRD] = 30807,
	[CHARA_TYPE_MAGICAL] = 30808,
	[CHARA_TYPE_UNDEAD] = 30809,
	[CHARA_TYPE_STONE] = 30810,
	[CHARA_TYPE_MACHINE] = 30811,
	[CHARA_TYPE_SPIRIT] = 30812,
	[CHARA_TYPE_DRAGON] = 30813,
	[CHARA_TYPE_GOD] = 30814,
	[CHARA_TYPE_FISH] = 30815,
	},								-- キラー無効 まとめ
	SpdEdit				= 31000,	-- 移動速度増加
	OverLoad			= 31001,	-- OVERLOAD
	SpdEdit2			= 31002,	-- 移動速度増加(消去不可)
	P_SpdEdit			= 31003,	-- P_移動速度増加
	HungryAngry			= 31004,	-- 飢餓暴走
	SuperSonic 			= 31005,	-- 超音速
	WP_SpdEdit			= 31006,	-- WP_移動速度増加
	ShorteningCast		= 31200,	-- 詠唱速度増加
	StunEdit			= 31400,	-- 気絶値増加
	BreakEdit			= 31401,	-- ブレイク値増加
	ResistStun			= 31402,	-- 被気絶無効
	MeredyCharge		= 31403,	-- 被弾蓄積ソウル変換
	P_TargetSkillPUIDBreakEdit= 31404,	-- P_特定PUIDスキルブレイク値増減
	P_TargetSkillPUIDStunEdit= 31405,	-- P_特定PUIDスキル気絶値増減
	P_TargetSkillVitDamagePer= 31406,-- P_対特定敵タイプ特定スキルVIT与ダメージ増減
	WP_TargetSkillVitDamagePer= 31407,-- WP_対特定敵タイプ特定スキルVIT与ダメージ増減
	P_TargetSkillPUIDVitDamagePer= 31408,	-- P_特定PUIDスキルVIT与ダメージ増減
	SufferBreakEdit		= 31409,	-- 被ブレイク値増加
	SufferStunEdit		= 31410,	-- 被気絶値増加
	SuperArmor			= 31700,	-- スーパーアーマー
	P_SuperArmor		= 31701,	-- P_スーパーアーマー
	P_SuperArmorPUID	= 31702,	-- P_対特定PUIDスキルスーパーアーマー
	SuperArmor_SkillType = {
	[0] = 31700,
	[SKILL_PHYSIC] = 31703,
	[SKILL_MAGIC] = 31704,
	[SKILL_SKILL] = 31705,
	[SKILL_SPECIAL] = 31706,
	[SKILL_ATTACK] = 31707,
	},								-- 特定スキルスーパーアーマー まとめ
	SuperArmorLegnis	= 31708,	-- レグニス専用スーパーアーマー
	MaxMpEdit			= 31800,	-- 最大MP増加
	WP_MaxMpEdit		= 31801,	-- WP_最大MP増加
	GoldenPrestige		= 32000,	-- 黄金の威信
	HateUp				= 32001,	-- 狙われやすさ増加
	Gen_Voluble			= 32002,	-- 口八丁
	HateEffect			= 32004,	-- 狙われ効果増加
	P_Hate				= 32005,	-- P_狙われやすさ増減
	HateDown			= 32050,	-- 狙われやすさ減少
	P_CsstSuperArmorPUID= 32200,	-- P_対特定PUIDスキル詠唱スーパーアーマー
	P_MaxSpEdit			= 32300,	-- P_特技ストック最大値増減
	Trance				= 32600,	-- トランス
	P_MaxVitEdit		= 32700,	-- P_VIT上限増減
	WP_MaxVitEdit		= 32701,	-- WP_VIT上限増減
	P_TargetSkillPUIDFatalBlowEdit= 32900,	-- P_特定PUIDスキル致命の一撃発生率増減
	P_TargetSkillPUIDSetAilment	= 40000,	-- P_特定PUIDスキル指定確率異常付与
	P_CntBreakTime		= 40600,	-- P_指定回数気絶・ブレイク回復速度増減
	PhysicalShield		= 50200,	-- フィジカルシールド
	StyleBlue			= 50201,	-- 羅刹の構え【蒼】
	TypeShield = {
	[CHARA_TYPE_BEAST] = 50202,		-- 対獣被ダメージ減少
	[CHARA_TYPE_PLANT] = 50203,		-- 対植物被ダメージ減少
	[CHARA_TYPE_INSECT] = 50204,		-- 対昆虫被ダメージ減少
	[CHARA_TYPE_BIRD] = 50205,		-- 対鳥被ダメージ減少
	[CHARA_TYPE_MAGICAL] = 50206,		-- 対魔法生物被ダメージ減少
	[CHARA_TYPE_UNDEAD] = 50207,		-- 対不死生物被ダメージ減少
	[CHARA_TYPE_STONE] = 50208,		-- 対鉱石被ダメージ減少
	[CHARA_TYPE_MACHINE] = 50209,		-- 対機械被ダメージ減少
	[CHARA_TYPE_FISH] = 50210,		-- 対魚被ダメージ減少
	[CHARA_TYPE_SPIRIT] = 50211,		-- 対精霊被ダメージ減少
	[CHARA_TYPE_DRAGON] = 50212,		-- 対竜被ダメージ減少
	[CHARA_TYPE_GOD] = 50213,		-- 対神被ダメージ減少
	[CHARA_TYPE_SOLDIER] = 50214,		-- 対ソルジャー被ダメージ減少
	[CHARA_TYPE_KNIGHT] = 50215,		-- 対ナイト被ダメージ減少
	[CHARA_TYPE_SNIPER] = 50216,		-- 対スナイパー被ダメージ減少
	[CHARA_TYPE_SORCERER] = 50217,		-- 対ウィッチ被ダメージ減少
	},
	RunnersHigh			= 50218,	-- ランナーズハイ
	Extinction			= 50219,	-- 滅化
	P_ElementSkillDamagePer	= 50220,	-- P_属性付き特定スキル与ダメージ増加
	ChristmasCarol		= 50221,	-- クリスマスキャロル
	P_ElementSkillSufferDamagePer= 50222,	-- P_属性付き特定スキル被ダメージ減少
	P_TargetCharaSkillPUIDDamagePer	= 50223,	-- P_対特定キャラ特定PUIDスキル与ダメージ増減
	SufferSkillDmgPer	= 50225,	-- 特技被ダメージ減少
	SufferSpecialDmgPer	= 50226,	-- 超必殺技被ダメージ減少
	EmperorSong			= 50227,	-- 帝歌
	AS_Eldravahna		= 50228,	-- AS_エルドラヴァーナ
	SufferBossDmgPer	= 50229,	-- 対ボス被ダメージ減少
	SufferNotBossDmgPer	= 50230,	-- 対雑魚被ダメージ減少
	TechConst = {
	[ELEMENT_FIRE] = 50231,
	[ELEMENT_ICE] = 50232,
	[ELEMENT_TREE] = 50233,
	[ELEMENT_THUNDER] = 50234,
	[ELEMENT_LIGHT] = 50235,
	[ELEMENT_DARK] = 50236
	},								-- 術式構築 まとめ
	OilCoating			= 50237,	-- オイルコーティング
	WP_ElementSkillDamagePer	= 50238,	-- WP_属性付き特定スキル与ダメージ増加
	NextSkill1_2DamagePer= 50239,	-- 回数制限付き特技1・2与ダメージ増加
	NextSkill1_3DamagePer= 50240,	-- 回数制限付き特技1・3与ダメージ増加
	NextSkill2_3DamagePer= 50241,	-- 回数制限付き特技2・3与ダメージ増加
	AllDamagePer		= 50242,	-- 与ダメージ増加
	NextElementSkillDamagePer = {
	[ELEMENT_NONE] = 50243,
	[ELEMENT_FIRE] = 50244,
	[ELEMENT_ICE] = 50245,
	[ELEMENT_TREE] = 50246,
	[ELEMENT_THUNDER] = 50247,
	[ELEMENT_LIGHT] = 50248,
	[ELEMENT_DARK] = 50249
	},								-- 回数制限付き属性特技与ダメージ増 まとめ
	P_ElementMagicDmgPer= 50300,	-- P_属性魔法与ダメージ増減
	WaterShield			= 50303,	-- ウォーターシールド
	MagicalShield		= 50308,	-- マジカルシールド
	MagicDamagePer		= 50309,	-- 魔法与ダメージ増加
	AS_LilyMatter		= 50310,	-- AS_リリーマター
	DrivingHigh			= 50311,	-- ドライビングハイ
	AS_Lilahamur		= 50312,	-- AS_リラハムル
	NextHitSufferDamagePer= 50313,	-- 回数制限付き被ダメージ減少
	SufferCriticalDamagePer= 50314,	-- クリティカル被ダメージ減少
	SufferWeakElemDamagePer= 50315,	-- 弱点属性被ダメージ減少
	P_DistanceCondSkillPUIDDamagePer= 50316,	-- P_特定PUIDスキル距離状況与ダメージ増減
	WP_ElementSkillSufferDamagePer= 50317,	-- WP_属性付き特定スキル被ダメージ減少
	SufferDmgPer		= 50400,	-- 被ダメージ減少
	SufferPhysDmgPer	= 50401,	-- 物理被ダメージ減少
	SufferMagDmgPer		= 50402,	-- 魔法被ダメージ減少
	SuperSufferPhysDmgPer= 50403,	-- 物理被ダメージ減少(打ち消し不可)
	FireEquipDamage		= 50404,	-- 炎装(炎与ダメージ増加)
	ElementSkillDmgPer = {
	[ELEMENT_FIRE]		= 50405,	-- 炎属性スキル威力増加
	[ELEMENT_ICE]		= 50406,	-- 氷属性スキル威力増加
	[ELEMENT_TREE]		= 50407,	-- 樹属性スキル威力増加
	[ELEMENT_THUNDER]	= 50408,	-- 雷属性スキル威力増加
	[ELEMENT_LIGHT]		= 50409,	-- 光属性スキル威力増加
	[ELEMENT_DARK]		= 50410,	-- 闇属性スキル威力増加
	[ELEMENT_ALL] 		= 50224,	-- 全属性スキル威力増加
	},
	P_TargetSkillIDDmgPer= 50411,	-- P_指定IDスキル威力増加
	SufferHumanDmgPer	= 50412,	-- 対人型被ダメージ減少
	SufferBeastPer		= 50413,	-- 対魔獣被ダメージ減少
	E_SufferPhysDmgPer	= 50414,	-- 物理被ダメージ減少(オートプロテクション)
	E_SufferMagDmgPer	= 50415,	-- 魔法被ダメージ減少(オートバリア)
	P_SkillFirstDmgPer	= 50416,	-- P_特定スキル初撃与ダメージ増減
	SufferMagDmgPer2	= 50417,	-- 魔法被ダメージ減少(魔鏡ポムラム)
	P_TargetSkillPUIDDmgPer= 50418,	-- P_指定PUIDスキル威力増減
	Mana_Purim			= 50419,	-- マナ_プリム
	Mana_Popoie			= 50420,	-- マナ_ポポイ
	SkillDamagePer		= 50421,	-- 特技与ダメージ増加
	SpecialDamagePer	= 50422,	-- 超必殺技与ダメージ増加
	TargetBreakDamagePer= 50423,	-- 対ブレイク中与ダメージ増加
	PhysicalDamagePer	= 50424,	-- 物理与ダメージ増加
	P_TargetSkillDmgPerTrig= 50425,	-- P_指定回数特定スキル発動時与ダメージ増減
	NextSkillDamagePer	= 50426,	-- 回数制限付き特技与ダメージ増加
	SufferNonElementDmgPer= 50427,	-- 無属性被ダメージ減少
	SufferFireDmgPer	= 50428,	-- 炎属性被ダメージ減少
	SufferIceDmgPer		= 50429,	-- 氷属性被ダメージ減少
	SufferTreeDmgPer	= 50430,	-- 樹属性被ダメージ減少
	SufferThunderDmgPer	= 50431,	-- 雷属性被ダメージ減少
	SufferLightDmgPer	= 50432,	-- 光属性被ダメージ減少
	SufferDarkDmgPer	= 50433,	-- 闇属性被ダメージ減少
	SufferElementDmgPer	= 50434,	-- 全属性被ダメージ減少
	SufferElementSkillDmgPer = {
	[ELEMENT_ALL] = 50434,
	[ELEMENT_NONE] = 50427,
	[ELEMENT_FIRE] = 50428,
	[ELEMENT_ICE] = 50429,
	[ELEMENT_TREE] = 50430,
	[ELEMENT_THUNDER] = 50431,
	[ELEMENT_LIGHT] = 50432,
	[ELEMENT_DARK] = 50433
	},								-- 属性被ダメージ減少 まとめ
	P_SufferTargetSkillPUIDDmgPer= 50435,	-- P_対特定PUIDスキル被ダメージ増減
	P_SufferTargetSkillPUIDDmgHitPer= 50436,	-- P_対特定PUIDスキルHit数状況被ダメージ増減
	GameMaster = {
	[ELEMENT_NONE] = 50437,
	[ELEMENT_FIRE] = 50438,
	[ELEMENT_ICE] = 50439,
	[ELEMENT_TREE] = 50440,
	[ELEMENT_THUNDER] = 50441,
	[ELEMENT_LIGHT] = 50442,
	[ELEMENT_DARK] = 50443
	},								-- ゲームマスター まとめ
	P_SkillDamagePer	= 50444,	-- P_特定スキル与ダメージ増加
	NextSpecialDamagePer= 50445,	-- 回数制限付き超必殺技与ダメージ増加
	FightingSpirit = {
	50446,
	50447,
	50448,
	},								-- 闘気 まとめ
	P_TargetSkillNextHitDamagePer= 50449,	-- P_発動数制限付き特定スキル与ダメージ増加
	YggShutoutPhysDmg	= 50500,	-- 物理被ダメージ0(ユグドラシル専用)
	YggShutoutMagDmg	= 50501,	-- 魔法被ダメージ0(ユグドラシル専用)
	ShutoutPhysDmgHp	= 50502,	-- 一定量物理被ダメージ0
	ShutoutPhysDmgCnt	= 50503,	-- 一定回数物理被ダメージ0
	MagicShield			= 50504, 	-- 魔法バリア
	KingOfKnight		= 50514, 	-- 騎士王
	EtherShield			= 50515, 	-- エーテルシールド
	ShutoutDmgHp		= 50516, 	-- 一定量被ダメージ無効
	P_ElementSkillShutoutDmgLottery= 50517, 	-- P_指定確率属性付き特定スキル被ダメージ0
	HitRate				= 50600,	-- 命中率増加
	PhysicalAvoid		= 50601,	-- 物理攻撃回避
	PhysicalAvoidCnt	= 50602,	-- 一定回数物理攻撃回避
	PhysicalAvoidRate	= 50603,	-- 物理攻撃回避率増加
	MagicAvoid			= 50604,	-- 魔法攻撃回避
	MagicAvoidCnt		= 50605,	-- 一定回数魔法攻撃回避
	P_TargetSkillPUIDChangeSkillElem	= 50700,	-- P_特定PUIDスキル属性変化
	Barrier				= 50800,	-- バリア
	Shield				= 50801,	-- シールド
	KillerPower			= 50900,	-- キラー倍率増加
	P_Counter			= 70000,	-- P_カウンター
	P_SkillStockCondGroundCounter= 70001,	-- P_地上特技ストック数条件カウンター
	AdditionalDmg		= 80100,	-- 追加ダメージ
	AdditionalDmgFire	= 80101,	-- 追加ダメージ(炎)
	AdditionalDmgIce	= 80102,	-- 追加ダメージ(氷)
	AdditionalDmgTree	= 80103,	-- 追加ダメージ(樹)
	AdditionalDmgThunder= 80104,	-- 追加ダメージ(雷)
	AdditionalDmgLight	= 80105,	-- 追加ダメージ(光)
	AdditionalDmgDarkness= 80106,	-- 追加ダメージ(闇)
	AdditionalDmgNormal	= 80107,	-- 通常攻撃時追加ダメージ
	AdditionalDmgNormalFire= 80108,	-- 通常攻撃時追加ダメージ(炎)
	AdditionalDmgNormalIce= 80109,	-- 通常攻撃時追加ダメージ(氷)
	AdditionalDmgNormalTree= 80110,	-- 通常攻撃時追加ダメージ(樹)
	AdditionalDmgNormalThunder= 80111,	-- 通常攻撃時追加ダメージ(雷)
	AdditionalDmgNormalLight= 80112,	-- 通常攻撃時追加ダメージ(光)
	AdditionalDmgNormalDarkness= 80113,	-- 通常攻撃時追加ダメージ(闇)
	P_TargetSkillPUIDAdditionalDmg= 80114,	-- P_特定PUIDスキル追加ダメージ
	ReductionMpCost		= 80200,	-- 消費MP減少
	YggShutoutDebuff	= 81000,	-- デバフ無効(ユグドラシル専用)
	GrimReaperBarrier	= 81001,	-- 一定回数死神無効
	InvalidGrimReaper	= 81002,	-- 死神無効
	AdditionalDmgNonElementPer= 81100,	-- 追加ダメージ威力増加(無)
	AdditionalDmgFirePer= 81101,	-- 追加ダメージ威力増加(炎)
	AdditionalDmgIcePer	= 81102,	-- 追加ダメージ威力増加(氷)
	AdditionalDmgTreePer= 81103,	-- 追加ダメージ威力増加(樹)
	AdditionalDmgThunderPer= 81104,	-- 追加ダメージ威力増加(雷)
	AdditionalDmgLightPer= 81105,	-- 追加ダメージ威力増加(光)
	AdditionalDmgDarknessPer= 81106,	-- 追加ダメージ威力増加(闇)
	PF_AddCharaType		= 81400,	-- PF_タイプ追加
	P_AnalyzeFire		= 81600,	-- P_解析鑑定_炎耐性
	P_AnalyzeIce		= 81601,	-- P_解析鑑定_氷耐性
	P_AnalyzeTree		= 81602,	-- P_解析鑑定_樹耐性
	P_AnalyzeThunder	= 81603,	-- P_解析鑑定_雷耐性
	P_AnalyzeLight		= 81604,	-- P_解析鑑定_光耐性
	P_AnalyzeDark		= 81605,	-- P_解析鑑定_闇耐性
	P_AnalyzePoison		= 81606,	-- P_解析鑑定_毒耐性
	P_AnalyzeParalysys	= 81607,	-- P_解析鑑定_麻痺耐性
	P_AnalyzeSick		= 81608,	-- P_解析鑑定_病気耐性
	P_AnalyzeDarkness	= 81609,	-- P_解析鑑定_暗闇耐性
	P_AnalyzeCurse		= 81610,	-- P_解析鑑定_呪い耐性
	P_AnalyzeSlience	= 81611,	-- P_解析鑑定_沈黙耐性
	P_AnalyzePain		= 81612,	-- P_解析鑑定_痛覚耐性
	P_AnalyzeMagic		= 81613,	-- P_解析鑑定_魔法上限
	P_SpiritPower = {
	[ELEMENT_FIRE] = {81614, 81615, 81616, 81617, 81618},
	[ELEMENT_ICE] = {81619, 81620, 81621, 81622, 81623},
	[ELEMENT_TREE] = {81624, 81625, 81626, 81627, 81628},
	[ELEMENT_THUNDER] = {81629, 81630, 81631, 81632, 81633},
	[ELEMENT_LIGHT] = {81634, 81635, 81636, 81637, 81638},
	[ELEMENT_DARK] = {81639, 81640, 81641, 81642, 81643}
	},								-- P_精霊力 まとめ
	SpiritOverDrive = {
	[ELEMENT_FIRE] = 81644,
	[ELEMENT_ICE] = 81645,
	[ELEMENT_TREE] = 81646,
	[ELEMENT_THUNDER] = 81647,
	[ELEMENT_LIGHT] = 81648,
	[ELEMENT_DARK] = 81649
	},								-- 精霊力解放 まとめ
	DevilBreaker_1		= 81650,	-- デビルブレイカー_1
	DevilBreaker_2		= 81651,	-- デビルブレイカー_2
	DevilBreaker_3		= 81652,	-- デビルブレイカー_3
	DevilBreaker_4		= 81653,	-- デビルブレイカー_4
	Dante_Trickster		= 81654,	-- ダンテ_トリックスター
	Dante_SwordMaster	= 81655,	-- ダンテ_ソードマスター
	Dante_RoyalGuard	= 81656,	-- ダンテ_ロイヤルガード
	A2_BerserkMode		= 81657,	-- A2_バーサクモード
	Guardian			= 81658,	-- 守護
	Ardine_Power		= 81659,	-- アーディン_力
	Ardine_Fire			= 81660,	-- アーディン_炎
	Ardine_Tree			= 81661,	-- アーディン_樹
	Ardine_Thunder		= 81662,	-- アーディン_雷
	Ardine_Poison		= 81663,	-- アーディン_毒
	Ardine_Break		= 81664,	-- アーディン_ブレイク
	Ardine_Dragon		= 81665,	-- アーディン_ドラゴン
	AT_Gus				= 81666,	-- AT_ガス
	AT_SnapBlade		= 81667,	-- AT_スナップブレード
	LimiterRemoval		= 81668,	-- リミッター解除
	StyleImmovable		= 81669,	-- 不動の構え
	Charged = {
	[1] = 81673,
	[2] = 81674,
	[3] = 81675,
	},								-- 帯電 まとめ
	Wave				= 81676,	-- ウェーブ
	BigWave				= 81677,	-- ビッグウェーブ
	Veneration			= 81678,	-- 崇敬
	TrueDemon			= 81680,	-- 真魔人
	Doppelganger		= 81681,	-- ドッペルゲンガー
	Demon				= 81682,	-- 魔人
	SpiritualBarrier	= 81683,	-- 魔導結界
	GodSword			= 81684,	-- 神剣
	SandSword			= 81686,	-- 砂の剣
	SandShield			= 81687,	-- 砂の盾
	FieldOfFonons = {
	[ELEMENT_FIRE] = 81688,
	[ELEMENT_ICE] = 81689,
	[ELEMENT_TREE] = 81690,
	[ELEMENT_THUNDER] = 81691,
	[ELEMENT_LIGHT] = 81692,
	[ELEMENT_DARK] = 81693
	},								-- フィールドオブフォニム まとめ
	OverLimits			= 81694,	-- オーバーリミッツ
	OverLimitsGauge = {
	[1] = 81695,
	[2] = 81696,
	[3] = 81697,
	[4] = 81698,
	},								-- オーバーリミッツゲージ まとめ
	PresentStockRed		= 81699,	-- プレゼントストック_赤
	PresentStockGreen	= 81700,	-- プレゼントストック_緑
	PresentStockPurple	= 81701,	-- プレゼントストック_紫
	PresentRed			= 81702,	-- プレゼントバフ_赤
	PresentGreen		= 81703,	-- プレゼントバフ_緑
	PresentPurple		= 81704,	-- プレゼントバフ_紫
	SpiritualFist		= 81708,	-- 魔導拳
	ShorteningDistances	= 81709,	-- 縮地
	WitchTime			= 81710,	-- ウィッチタイム
	Zero_Attack			= 81712,	-- ゼロ【攻撃】
	Zero_Defense		= 81713,	-- ゼロ【防御】
	EngagementRing		= 81714,	-- エンゲージリング
	Thruster			= 81716,	-- スラスター
	GodGuardian			= 81718,	-- 番神の守護
	ReCharge			= 81719,	-- リチャージ
	CaptainMission		= 81720,	-- 隊長任務
	TS_Magicules		= 81721,	-- TS_魔素
	TS_DragonGuidance	= 81722,	-- TS_暴風竜の指南
	TS_Fear				= 81723,	-- TS_恐怖
	TrainedElectro		= 81724,	-- 電刃錬気
	LBOOST				= 81725,	-- L-BOOST
	ThunderGod			= 81726,	-- 雷神
	AckermannsBlood		= 81727,	-- アッカーマンの血族
	SoulBlade			= 81729,	-- ソウルブレイド解放
	LiberationMaiden	= 81730,	-- 巫女の解放
	SN_Ring = {
	[1] = 81731,
	[2] = 81732,
	[3] = 81733,
	[4] = 81734,
	[5] = 81735,
	},								-- SN_リング まとめ
	DragonFactor		= 81736,	-- 竜の因子
	VeilOfSeiran		= 81737,	-- 青嵐のベール
	FreezingAura 		= 81740,	-- 凍気
	OV_Love		 		= 81741,	-- 愛情
	OV_OverLord 		= 81742,	-- OVERLORD
	OV_DeadlyHeroesSoul	= 81743,	-- 死せる勇者の魂
	SacrificeOfPower	= 81745,	-- 力の贄
	DemonDevourer		= 81746,	-- 喰魔化
	GeneralUnitBuff		= 81748,	-- 汎用ユニットバフ
	CoagulationEther = {
	[1] = 81749,
	[2] = 81750,
	[3] = 81751,
	[4] = 81752,
	},								-- エーテル凝結 まとめ
	SufferLacDefBonus	= 81755,	-- 被裂傷値蓄積量減少
	BF_OverDrive		= 81756,	-- BF_オーバードライブ
	P_TargetSkillIDReductionMpCost	= 81900,	-- P_特定ID魔法消費MP増減
	P_UnitDrift_old		= 82000,	-- P_常時指定方向移動
	P_UnitDrift			= 82001,	-- P_真・常時指定方向移動
	PreCastMiddle		= 82100,	-- 中級魔法陣展開
	PreCastHigh			= 82101,	-- 上級魔法陣展開
	P_NearDeathSkill	= 82102,	-- P_死亡確定時外部スキル発動
	P_DamageCounterSkill= 82103,	-- P_特定攻撃被弾時外部スキル発動
	P_AllySkillTriggerSkill= 82104,	-- P_味方複数条件スキル発動時外部スキル発動
	GP_NearDeathSkill	= 82105,	-- GP_死亡確定時外部スキル発動
	CounterMagic		= 82300,	-- カウンタマジック
	P_DamageEditCnt		= 82400,	-- P_指定回数与ダメージ固定
	P_TargetCharaSkillPUIDDmgAbsoluteLimitBreak		= 82401,	-- P_対特定キャラ特定PUIDスキルダメージ限界突破
	SufferDamageLimit_CharaType = {
	[CHARA_TYPE_SOLDIER] = 82434,	-- 対ソルジャー被ダメージ上限減少
	[CHARA_TYPE_SNIPER] = 82435,	-- 対スナイパー被ダメージ上限減少
	[CHARA_TYPE_KNIGHT] = 82436,	-- 対ナイト被ダメージ上限減少
	[CHARA_TYPE_SORCERER] = 82437,	-- 対ソーサラー被ダメージ上限減少
	[CHARA_TYPE_BEAST] = 82438,		-- 対獣被ダメージ上限減少
	[CHARA_TYPE_PLANT] = 82439,		-- 対植物被ダメージ上限減少
	[CHARA_TYPE_INSECT] = 82440,	-- 対昆虫被ダメージ上限減少
	[CHARA_TYPE_BIRD] = 82441,		-- 対鳥被ダメージ上限減少
	[CHARA_TYPE_MAGICAL] = 82442,	-- 対魔法生物被ダメージ上限減少
	[CHARA_TYPE_UNDEAD] = 82443,	-- 対不死生物被ダメージ上限減少
	[CHARA_TYPE_STONE] = 82444,		-- 対鉱石被ダメージ上限減少
	[CHARA_TYPE_MACHINE] = 82445,	-- 対機械被ダメージ上限減少
	[CHARA_TYPE_SPIRIT] = 82446,	-- 対精霊被ダメージ上限減少
	[CHARA_TYPE_DRAGON] = 82447,	-- 対竜被ダメージ上限減少
	[CHARA_TYPE_GOD] = 82448,		-- 対神被ダメージ上限減少
	[CHARA_TYPE_FISH] = 82449,		-- 対魚被ダメージ上限減少
	},
	DamageLimit_Element = {
	[ELEMENT_FIRE] = 82600,
	[ELEMENT_ICE] = 82601,
	[ELEMENT_TREE] = 82602,
	[ELEMENT_THUNDER] = 82603,
	[ELEMENT_LIGHT] = 82604,
	[ELEMENT_DARK] = 82605,
	[ELEMENT_ALL] = 82617,
	},								-- 指定属性ダメージ上限アップ まとめ
	DamageLimit_SkillType = {
	[SKILL_PHYSIC] = 82606,
	[SKILL_MAGIC] = 82607,
	[SKILL_SKILL] = 82608,
	[SKILL_SPECIAL] = 82609,
	[SKILL_ATTACK] = 82610,
	[0] = 82618,
	},								-- 特定スキルダメージ上限アップ まとめ
	P_TargetSkillDamageLimit= 82611,-- P_特定スキルダメージ上限アップ
	WP_TargetSkillDamageLimit= 82612,-- WP_特定スキルダメージ上限アップ
	P_TargetSkillPUIDDamageLimit= 82613,	-- P_特定PUIDスキルダメージ上限増減
	P_ParentPvCondTargetSkillDamageLimit= 82614,	-- P_親pv1値状況特定スキルダメージ上限増減
	P_TargetSkillNextHitDamageLimit= 82615,	-- P_発動数制限付き特定スキルダメージ上限増減
	KillerDamageLimit= 82616,	-- キラーダメージ上限アップ
	P_TargetSkillDmgLimitTrig= 82619,	-- P_指定回数特定スキル発動時ダメージ上限増減
	NextSkillDamageLimit= 82620,	-- 回数制限付き特技ダメージ上限増減
	SufferDamageLimit_Element = {
	[ELEMENT_NONE] = 82621,
	[ELEMENT_FIRE] = 82622,
	[ELEMENT_ICE] = 82623,
	[ELEMENT_TREE] = 82624,
	[ELEMENT_THUNDER] = 82625,
	[ELEMENT_LIGHT] = 82626,
	[ELEMENT_DARK] = 82627,
	[ELEMENT_ALL] = 82628,
	},								-- 指定属性被ダメージ上限減少 まとめ
	WeakElemDamageLimit	= 82629,	-- 弱点属性ダメージ上限アップ
	NextSpecialDamageLimit= 82630,	-- 回数制限付き超必殺技ダメージ上限増減
	NextMagicDamageLimit= 82631,	-- 回数制限付き魔法ダメージ上限増減
	DamageLimit_CharaType = {
	[CHARA_TYPE_SOLDIER] = 82632,
	[CHARA_TYPE_SNIPER] = 82633,
	[CHARA_TYPE_KNIGHT] = 82634,
	[CHARA_TYPE_SORCERER] = 82635,
	[CHARA_TYPE_BEAST] = 82636,
	[CHARA_TYPE_PLANT] = 82637,
	[CHARA_TYPE_INSECT] = 82638,
	[CHARA_TYPE_BIRD] = 82639,
	[CHARA_TYPE_MAGICAL] = 82640,
	[CHARA_TYPE_UNDEAD] = 82641,
	[CHARA_TYPE_STONE] = 82642,
	[CHARA_TYPE_MACHINE] = 82643,
	[CHARA_TYPE_SPIRIT] = 82644,
	[CHARA_TYPE_DRAGON] = 82645,
	[CHARA_TYPE_GOD] = 82646,
	[CHARA_TYPE_FISH] = 82647,
	},								-- 対特定キャラダメージ上限アップ まとめ
	DamageLimit_EnemyType = {
	[ENEMY_TYPE_BOSS] = 82648,
	[ENEMY_TYPE_NORMAL] = 82649,
	[0] = 82618,
	},								-- 対特定敵タイプダメージ上限アップ まとめ
	NextNormalAttackDamageLimit= 82677,	-- 回数制限付き通常攻撃ダメージ上限増減
	TargetBreakDamageLimit= 82678,	-- 対ブレイク中ダメージ上限アップ
	SufferWeakElemDamageLimit= 82680,	-- 弱点属性被ダメージ上限減少
	P_ClampHp			= 82800,	-- P_HP上限下限ロック
	S_FatalityReservSetBuff	= 1000000,-- S_対象復活時バフ付与予約
	S_DMC_DamageRankPointCtrl	= 1000001,-- S_被ダメージ時ランクポイント増減_制御
	S_DMC_DeadRankPoint	= 1000002,-- S_死亡時ランクポイント増減
	S_DMC_ContinueRankPoint	= 1000003,-- S_コンティニュー時ランクポイント増減
	S_DMC_AttackRankPoint	= 1000004,-- S_与ダメージ時ランクポイント増減
	S_DMC_SkillRankPoint	= 1000005,-- S_特技発動時ランクポイント増減
	S_DMC_MagicRankPoint	= 1000006,-- S_魔法発動時ランクポイント増減
	S_DMC_SpecialRankPoint	= 1000007,-- S_超必殺技発動時ランクポイント増減
	S_DMC_ArkSkillRankPoint	= 1000008,-- S_アークスキル発動時ランクポイント増減
	S_DMC_SpecialKillRankPoint	= 1000009,-- S_超必殺技トドメ発生時ランクポイント増減
	S_DMC_ArkSkillKillRankPoint	= 1000010,-- S_アークスキルトドメ発生時ランクポイント増減
	S_DMC_SameSkillKillRankPointCtrl	= 1000011,-- S_同一スキルトドメ発生時ランクポイント増減_制御
	S_DMC_SameSkillKillRankPointProc	= 1000012,-- S_同一スキルトドメ発生時ランクポイント増減_処理
	S_DMC_DamageRankPointProc	= 1000013,-- S_被ダメージ時ランクポイント増減_処理
	S_DMC_BossBreakRankPointCtrl	= 1000014,-- S_ブレイク発生時ランクポイント増減_制御
	S_DMC_BossBreakRankPointProc	= 1000015,-- S_ブレイク発生時ランクポイント増減_処理
	S_RankPointInstant	= 1000016,-- S_特定ランクポイント即時増減
	S_RevivalReservSetSystemBuff	= 1000017,-- S_復活時制御用バフ付与予約
	S_SN_RingControl	= 1000018,-- S_SNリング配置管理用
	S_SN_RingEffectControl	= 1000019,-- S_SNリング効果管理用
	S_SupportPassiveControl		= 1000020,-- S_援護効果管理用
	S_SupportPassiveControl2	= 1000021,-- S_援護効果管理用2
	S_StyleBlueControl	= 1011102,-- S_羅刹の構え【蒼】_制御用
	S_HaveBuffUidSkillTriggerHpDec	= 1011104,-- S_特定UIDバフ効果中特定スキル発動時HP減少
	S_HaveBuffUidDotDamage= 1011105,-- S_特定UIDバフ効果中DOTダメージ
	S_HaveBuffUidIntervalMPSpend	= 1011201,	-- S_特定UIDバフ効果中指定時間毎MP消費
	S_HaveBuffUidRegene	= 1020000,	-- S_特定UIDバフ効果中リジェネ
	S_TargetElementSkillParentHeal= 1020100,-- S_特定属性スキル発動時親HP回復
	S_HpCondSharingHp_Ally= 1020101,-- S_味方HP条件HP分与_味方
	S_PctRecoverInstant	= 1020102,-- S_即時HP割合回復
	S_HaveBuffUidHpCondHpPctRecover	= 1020103,-- S_特定UIDバフ効果中HP条件HP回復
	S_SeriesFirstAid	= 1020200,-- S_シリーズ効果応急処置
	S_BossBreakSctEdit	= 1020201,	-- S_対象ブレイク時単独SCT回復
	S_Endure			= 1020600,	-- S_根性
	S_AllyStatusEditEndureControl= 1020601,	-- S_味方ステータス増減根性_制御用
	S_TargetUidAliveSctRcvVal= 1021002,-- S_特定UID生存中SCT回復速度増減
	S_MpRecoverInstant	= 1021200,-- S_即時MP回復
	S_DefeatReset		= 1030000,	-- S_死亡時累積数リセット
	S_BossBreakStrEdit	= 1030001,	-- S_対象ブレイク時永続STR増減
	S_TargetUidAliveStatusEdit= 1030002,	-- S_特定UID生存中全ステータス増減
	S_HaveBuffUidPenetrateDef= 1030100,	-- S_特定UIDバフ効果中特定攻撃時指定確率DEF貫通
	S_BossBreakDefEdit	= 1030101,	-- S_対象ブレイク時永続STR増減
	S_FaDefReset		= 1030102,	-- S_全は世界！カウントリセット制御
	S_DeteriorateDefStatusEditControl= 1030103,	-- S_劣化DEF増減最大劣化時全ステ増減_制御用
	S_BossBreakIntEdit	= 1030200,	-- S_対象ブレイク時永続INT増減
	S_BossBreakMndEdit	= 1030300,	-- S_対象ブレイク時永続MND増減
	S_DemonizationAlly	= 1030500,	-- S_味方瀕死時鬼族の角_味方
	S_TargetUidAliveElemSkillKiller	= 1030800,	-- S_特定UID生存中特定タイプ特定スキルキラー
	S_HaveBuffUidElemSkillKiller	= 1030801,	-- S_特定UIDバフ効果中特定タイプ特定スキルキラー
	S_HungryAngryControl	= 1031002,	-- S_飢餓暴走制御用
	S_HaveBuffUidAccessSpdEdit= 1031003,	-- S_特定UIDバフ効果中スキル前移動速度増減
	S_HaveBuffUidStunEdit	= 1031400,	-- 特定UIDバフ効果中気絶値増加
	S_HaveBuffUidBreakEdit	= 1031401,	-- 特定UIDバフ効果中ブレイク値増加
	S_HaveBuffUidSufferStunEdit	= 1031402,	-- 特定UIDバフ効果中被気絶値増加
	S_HaveBuffUidSufferBreakEdit= 1031403,	-- 特定UIDバフ効果中被ブレイク値増加
	S_HaveBuffUidSufferVitEdit	= 1031404,	-- S_特定UIDバフ効果中VIT被ダメージ増減
	S_HaveBuffUidSetSuperArmor = 1031700, -- S_特定UIDバフ効果中対特定スキルスーパーアーマー
	S_GoldenPrestigeAlly= 1032000,	-- S_黄金の威信
	S_LockOnControl		= 1032001,-- S_ロックオン制御用
	S_HaveBuffUidSetCastSuperArmor= 1032200,	-- S_特定UIDバフ効果中対特定スキル詠唱スーパーアーマー
	S_HaveBuffUidSkillSetAilment= 1040000,	-- S_特定UIDバフ効果中特定攻撃時指定確率異常付与
	S_DetectBulletSufferPhysDmgPer= 1050200,-- S_特定バレット検知物理被ダメージ増減
	S_FatalityReservSufferPhysDmgPer= 1050201,-- S_死亡者物理被ダメージ増減予約
	S_RunnersHighControl= 1050202,-- S_ランナーズハイ制御
	S_WaveEndDebuffAilmentCount= 1050203,-- S_前WAVE終了時デバフ・状態異常カウント制御
	S_WaveEndHpPerMemory= 1050204,-- S_前WAVE終了時残りHP割合記憶
	S_DetectBulletSufferMagDmgPer= 1050300,	-- S_特定バレット検知魔法被ダメージ増減
	S_FatalityReservSufferMagDmgPer= 1050301,-- S_死亡者魔法被ダメージ増減予約
	S_BuffControl_1050360	= 1050302,	-- S_指定回数魔法与ダメージ増減_バフ制御
	S_Rimuru_Sword_1	= 1050303,	-- S_リムルの剣_1
	S_Rimuru_Sword_2	= 1050304,	-- S_リムルの剣_2
	S_Rimuru_Sword_3	= 1050305,	-- S_リムルの剣_3
	S_Rimuru_Sword_4	= 1050306,	-- S_リムルの剣_4
	S_Rimuru_Sword_5	= 1050307,	-- S_リムルの剣_5
	S_Rimuru_Sword_6	= 1050308,	-- S_リムルの剣_6
	S_Rimuru_Sword_7	= 1050309,	-- S_リムルの剣_7
	S_Rimuru_Sword_8	= 1050310,	-- S_リムルの剣_8
	S_Rimuru_Sword_9	= 1050311,	-- S_リムルの剣_9
	S_Rimuru_Sword_10	= 1050312,	-- S_リムルの剣_10
	S_DrivingHighControl= 1050313,-- S_ドライビングハイ制御
	S_HpCondSufferDmgPer_Ally= 1050400,	-- S_味方HP条件被ダメージ増減付与_味方
	S_Companionship_Ally= 1050401,	-- S_仲間想い_味方
	S_HaveBuffUidElemDmgPer= 1050402,	-- S_特定UIDバフ効果中指定属性威力増加
	S_HaveBuffUidPayHpSklDmgPer= 1050403,	-- S_特定UIDバフ効果中HP消費指定スキル威力増加
	S_HaveBuffUidSkillDmgPer= 1050404,	-- S_特定UIDバフ効果中特定攻撃威力増加
	S_HaveBuffUidSkillKindDmgPer= 1050405,	-- S_特定UIDバフ効果中特定種別スキル威力増加
	S_WholeHpCondElemSkillDmgPerStep_Ally= 1050406,	-- S_全体HP条件累積達成状況特定属性特定スキル与ダメージ増減_味方
	S_WholeHpCondElemSkillDmgPerStep_Own= 1050407,	-- S_全体HP条件累積達成状況特定属性特定スキル与ダメージ増減_自分
	S_LotteryTargetUidBuffDmgPer= 1050408,	-- S_特定UIDバフ抽選成功時与ダメージ増減
	S_TargetUidAliveSufferDmgPer= 1050409,	-- S_特定UID生存中特定規模スキル被ダメージ増減
	S_WarCry_Ally		= 1050410,	-- S_ウォークライ味方用
	S_HaveBuffUidSufferSkillDmgPer= 1050411,	-- S_特定UIDバフ効果中特定攻撃被ダメージ増減
	S_TargetUidAliveElemSkillDmgPer= 1050412,	-- S_特定UID生存中特定スキル与ダメージ増減
	S_TargetUidAliveElemSkillSufferDmgPer= 1050413,	-- S_特定UID生存中特定スキル被ダメージ増減
	S_TargetUidAliveTargetEnemyTypeElemSkillSufferDmgPer= 1050414,	-- S_特定UID生存中対特定敵タイプ特定スキル被ダメージ増減
	S_SingleWeaponHaveBuffUidDmgPer= 1050415,	-- S_一刀時特定UIDバフ効果中属性付き特定攻撃与ダメージ増減
	S_HaveBuffUidSufferMultiElemSkillDmgPer= 1050416,	-- S_特定UIDバフ効果中複数属性特定攻撃被ダメージ増減
	S_HaveBuffUidOwnerGenderElemSkillDmgPer= 1050417,	-- S_特定UIDバフ効果中自分特定性別特定攻撃与ダメージ増減
	S_HaveBuffUidOwnerGenderSufferElemSkillDmgPer= 1050418,	-- S_特定UIDバフ効果中自分特定性別特定攻撃被ダメージ増減
	S_Exceed_SkillDmgPer= 1050419,	-- S_イクシード_与ダメージ増減
	S_HaveBuffUidElemSkillDmgPer= 1050420,	-- S_特定UIDバフ効果中指定属性特定攻撃与ダメージ増減
	S_HaveBuffUidSufferWeakElemSkillDmgPer= 1050421,	-- S_特定UIDバフ効果中弱点属性特定攻撃被ダメージ増減
	S_HaveBuffUidElemSkillDmgRandomPer= 1050422,	-- S_特定UIDバフ効果中指定属性特定攻撃ランダム与ダメージ増減
	S_HaveBuffUidTargetEnemyTypeSufferDmgPer= 1050423,	-- S_特定UIDバフ効果中対特定敵タイプ属性付き特定攻撃被ダメージ増減
	S_HaveBuffUidTargetEnemyTypeDmgPer= 1050424,	-- S_特定UIDバフ効果中対特定敵タイプ属性付き特定攻撃与ダメージ増減
	S_HaveBuffUidTargetCharaKillerDmgPer= 1050425,	-- S_特定UIDバフ効果中特定キラー発生時属性付き特定攻撃与ダメージ増減
	S_HaveBuffUidTargetCharaKillerSufferDmgPer= 1050426,	-- S_特定UIDバフ効果中特定キラー発生時属性付き特定攻撃被ダメージ増減
	S_HaveBuffUidTargetAilmentDmgPer= 1050427,	-- S_特定UIDバフ効果中特定状態異常中属性付き特定攻撃与ダメージ増減
	S_HaveBuffUidTargetAilmentSufferDmgPer= 1050428,	-- S_特定UIDバフ効果中特定状態異常中属性付き特定攻撃被ダメージ増減
	S_HaveBuffUidTargetCharaTypeDmgPer= 1050429,	-- 特定UIDバフ効果中対特定キャラ属性付き特定攻撃与ダメージ増減
	S_HaveBuffUidOwnerCharaDmgPer= 1050430,	-- S_特定UIDバフ効果中自分特定キャラ属性付き特定攻撃与ダメージ増減
	S_NoDamage			= 1050500,	-- S_被ダメージ0
	S_KingOfKnightControl_1= 1050501, 	-- S_騎士王_制御用1
	S_KingOfKnightControl_2= 1050502,	-- S_騎士王_制御用2
	S_DivineWorkControl	= 1050503,	-- S_神業_制御用
	S_HaveBuffUidPhysicalAvoidRate= 1050600,	-- S_特定UIDバフ効果中物理攻撃回避率増加
	S_HaveBuffUidChangeSkillElem= 1050700,	-- S_特定UIDバフ効果中特定スキル属性変化
	S_SkillPuidShowPassive= 1070000,-- S_特定PUIDスキル発動時パッシブ表示
	S_SkillEndBuffControl= 1080400,	-- S_スキル終了時指定UIDバフ削除
	S_HpCondBuffControl	= 1080401,	-- S_HP条件指定UIDバフ削除
	S_NotSkillPuidBuffControl= 1080402,	-- S_特定PUID以外スキル発動時指定UIDバフ削除
	S_UidBuffEndBuffControl= 1080403,	-- S_指定UIDバフ終了時指定UIDバフ削除
	S_HpCondTimeLimitBuffControl= 1080404,	-- S_HP条件一定時間後指定UIDバフ削除
	S_LeaveFieldBuffControl= 1080405,	-- S_死亡・除外時指定UIDバフ削除
	S_TargetLeaveFieldBuffControl= 1080406,	-- S_指定対象死亡・除外時指定UIDバフ削除
	S_EnemyKillBuffControl= 1080407,	-- S_敵撃破時指定UIDバフ削除
	S_UidBuffEndRemoveStatusBuffDebuff= 1080408,	-- S_指定UIDバフ終了時通常ステータスバフ・デバフ消去
	S_DamageCountCondBuffControl= 1080409,	-- S_属性付き特定スキル被弾回数条件指定UIDバフ削除
	S_ValidSkillEndBuffControl= 1080410,	-- S_特定スキル終了時指定UIDバフ削除
	S_BuffControl		= 1080411,	-- S_指定UIDバフ削除
	S_NotMultiAilmentBuffControl= 1080412,	-- S_特定状態異常回復時指定UIDバフ削除
	S_HaveBuffUidMpSpendFailedBuffControl= 1080413,	-- S_特定UIDバフ効果中指定時間毎MP消費失敗時UIDバフ削除
	S_SkillPuidStandbyEndBuffControl= 1080414,	-- S_特定PUIDスキル詠唱終了時指定UIDバフ削除
	S_ArriveFieldBuffControl= 1080415,	-- S_復活・乱入時指定UIDバフ削除
	S_TargetNumberCollisionRemoveAllAfterBuffControl= 1080416,	-- S_指定番号領域全削除時指定UIDバフ削除
	S_AilmentTriggerBuffControl= 1080417,	-- S_特定状態異常発生時指定UIDバフ削除
	S_HaveBuffUidResistForceStun= 1081001,	-- S_特定UIDバフ効果中強制気絶・ブレイク無効
	S_ResurrectCallBack	= 1081600,	-- S_復活時コールバック発行
	S_DevilBreakerControl= 1081601,	-- S_デビルブレイカー制御
	S_InitializeLottery= 1081602,	-- S_バレット内指定抽選初期化
	S_LotterySingleWeaponCritical= 1081603,	-- S_一刀クリティカル時特定スキル抽選
	S_CharaCountChangeTrigger_1	= 1081604,	-- S_生存人数変動またはキャラタイプ変化時発火_1
	S_CharaCountChangeTrigger_2	= 1081605,	-- S_生存人数変動またはキャラタイプ変化時発火_2
	S_BreakCallBack		= 1081606,	-- S_ブレイク時コールバック発行
	S_AllyDeadResetPV	= 1081607,	-- S_味方死亡時親PVリセット
	S_AilmentTriggerSubProc	= 1081608,	-- S_親UID生存中特定状態異常発生時サブプロセス発火
	S_EnemyKillCountUpPV	= 1081609,	-- S_撃破時親pv1カウントアップ
	S_IntervalCountUpPV	= 1081610,	-- S_指定時間毎親pv1カウントアップ
	S_FightingSpiritControl = 1081611,	-- S_闘気_制御用
	S_HpTriggerSubProc	= 1081612,	-- S_親UID生存中HP条件サブプロセス発火
	S_RebootGuardian	= 1081613,	-- S_守護リブート
	S_SkillInfoControl	= 1081614,	-- S_スキル発動毎情報管理
	S_ATGusControl		= 1081615,	-- S_ATガス効果制御用
	S_ATSnapBladeRevival_1= 1081616,	-- S_スナップブレード再付与制御_1
	S_ATSnapBladeRevival_2= 1081617,	-- S_スナップブレード再付与制御_2
	S_ATSnapBladeRevival_3= 1081618,	-- S_スナップブレード再付与制御_3
	S_LimiterRemoval_ProbEdit= 1081619,	-- S_リミッター解除_確率増減効果
	S_IntervalSubProc	= 1081620,	-- S_指定時間毎サブプロセス発火
	S_ProcessEventResetPV	= 1081621,	-- S_特定IDパッシブ由来指定プロセス内トリガ発火時親PVリセット
	S_BreakTriggerSubProc= 1081622,	-- S_親UID生存中気絶・ブレイク時サブプロセス発火
	S_Prison			= 1081623,	-- S_監獄
	S_AttackSkillSubProc= 1081624,	-- S_親UID生存中特定スキル攻撃時サブプロセス発火
	S_UidBuffEndAddGeneralCount= 1081625,	-- S_指定UIDバフ終了時汎用数値情報付与
	S_EngagementRingDmgPer= 1081626,	-- S_エンゲージリング与ダメージアップ
	S_EngagementRingDmgLimitBreak= 1081627,	-- S_エンゲージリングダメージ上限アップ
	S_UidBuffEndSubProc	= 1081628,	-- S_指定UIDバフ終了時サブプロセス発火
	S_CollisionOutSubProc= 1081629,	-- S_対象指定領域脱出時サブプロセス発火
	S_SkillDetectionSubProc= 1081630,	-- S_特定スキル発動検知時サブプロセス発火
	S_CaptainMissionTakeOver= 1081631,	-- S_隊長任務バフ移動
	S_HaveBuffUidSkillTriggerSubProc= 1081632,	-- S_特定UIDバフ効果中特定攻撃スキル発動時サブプロセス発火
	S_HaveBuffUidSkillTriggerAddSkillInfo= 1081633,	-- S_特定UIDバフ効果中特定攻撃スキル発動時MP消費スキル発動毎情報付与
	S_ProcessEventSubProc	= 1081634,	-- S_指定プロセス内トリガ発火時サブプロセス発火
	S_HaveBuffUidIntervalTargetBuffIdSubProc	= 1081635,	-- S_特定UIDバフ効果中指定時間経過毎対特定IDバフサブプロセス発火
	S_HaveBuffUidDecLacBonus	= 1081636,	-- S_特定UIDバフ効果中被裂傷値蓄積量増減
	S_UidBuffEndDecLacBonus	= 1081637,	-- S_指定UIDバフ終了時被裂傷値蓄積量増減
	S_CharaTypeAddSubProc= 1081638,	-- S_指定キャラタイプ追加時サブプロセス発火
	S_CharaTypeRemoveSubProc= 1081639,	-- S_指定キャラタイプ削除時サブプロセス発火
	S_SkillPuidTimelineExistsElementSkillTriggerSubProc= 1081640,	-- S_特定PUIDスキル継続中属性付き特定スキル発動時サブプロセス発火
	S_DyingMessage		= 1082100,	-- S_死亡確定時演出再生
	S_PlayerAiUseSkill	= 1082101,	-- S_プレイヤーAI特技連打
	S_HpCondCreateCollisionFirstAid	= 1082103,	-- S_HP条件領域展開演出応急処置用
	S_TargetSkillKindMultiElemMagicMultiBullet= 1082500,	-- S_特定種別複数属性多段魔法
	S_TargetSkillScaleMagicMultiBullet= 1082501,	-- S_特定規模多段魔法
	S_HaveBuffUidDmgLimitBreak= 1082600,	-- S_特定UIDバフ効果中属性付き特定攻撃ダメージ上限増減
	S_WholeHpCondElemSkillDmgLimitBreakStep_Ally= 1082601,	-- S_全体HP条件累積達成状況特定属性特定スキルダメージ上限増減_味方
	S_WholeHpCondElemSkillDmgLimitBreakStep_Own= 1082602,	-- S_全体HP条件累積達成状況特定属性特定スキルダメージ上限増減_自分
	S_LotteryTargetUidBuffDmgLimitBreak= 1082603,	-- S_特定UIDバフ抽選成功時ダメージ上限増減
	S_TargetUidAliveElemSkillDmgLimitBreak= 1082604,	-- S_特定UID生存中特定スキルダメージ上限増減
	S_SingleWeaponHaveBuffUidDmgLimitBreak= 1082605,	-- S_一刀時特定UIDバフ効果中属性付き特定攻撃ダメージ上限増減
	S_HaveBuffTargetUidAliveElemSkillDmgLimitBreak= 1082606,	-- S_特定バフ所持中特定UID生存中特定スキルダメージ上限増減
	S_Exceed_SkillDmgLimitBreak= 1082607,	-- S_イクシード_ダメージ上限増減
	S_HaveBuffUidCanOverlapCondElemSkillDmgLimitBreak= 1082608,	-- S_特定UIDバフ効果中スキル重複可否条件属性付き特定スキルダメージ上限増減
	S_SkillCountCondNextSkillDmgLimitBreak= 1082609,	-- S_指定ロール属性付き特定スキル使用数状況次回特定スキルダメージ上限増減
	S_HaveBuffUidTargetEnemyTypeDmgLimitBreak= 1082610,	-- S_特定UIDバフ効果中対特定敵タイプ属性付き特定攻撃ダメージ上限増減
	S_TargetSkillScaleCastTimeCondDmgLimitBreak= 1082611,	-- S_属性付き特定規模攻撃詠唱時間状況ダメージ上限増減
	S_HaveBuffUidSkillKindDmgLimitBreak= 1082612,	-- S_特定UIDバフ効果中特定種別スキルダメージ上限増減
	S_SingleWeaponHaveBuffUidSkillKindDmgLimitBreak= 1082613,	-- S_一刀時特定UIDバフ効果中特定種別スキルダメージ上限増減
	S_HaveBuffUidOwnerCharaDmgLimitBreak= 1082614,	-- S_特定UIDバフ効果中自分特定キャラ特定スキルダメージ上限増減
	S_HaveBuffUidTargetCharaKillerDmgLimitBreak= 1082615,	-- S_特定UIDバフ効果中特定キラー発生時特定スキルダメージ上限増減
	S_HaveBuffUidSufferDmgLimitBreak= 1082616,	-- S_特定UIDバフ効果中属性付き特定攻撃被ダメージ上限増減
	S_TargetUidAliveTargetCharaKillerElemSkillDmgLimitBreak= 1082617,	-- S_特定UID生存中特定キラー発生時特定スキルダメージ上限増減
	S_HaveBuffUidTargetAilmentDmgLimitBreak= 1082618,	-- S_特定UIDバフ効果中特定状態異常中属性付き特定攻撃ダメージ上限増減
	S_HaveBuffUidTargetAilmentSufferLimitBreak= 1082619,	-- S_特定UIDバフ効果中特定状態異常中属性付き特定攻撃被ダメージ上限増減
	S_HaveBuffUidSufferWeakElemSkillDmgLimitBreak= 1082620,	-- S_特定UIDバフ効果中弱点属性特定攻撃被ダメージ上限増減
	S_Alchemy			= 1083200,	-- S_錬金術
	S_GuildHunt			= 1083400,	-- S_ギルドハント用HP分割
	S_AlchemySpecial	= 1083900,	-- S_超必錬金術
	C_Control			= 2000000,	-- C_制御用
	C_AppendControl		= 2000001,	-- C_後付制御用
	C_AnimaControl		= 2000050,	-- C_アニマ制御用
	C_AnimaAppendControl= 2000051,	-- C_アニマ後付制御用
	C_DevilMegius		= 2011100,	-- C_魔神メギウス
	C_MaidenSera		= 2021300,	-- C_巫女セラ
	C_Roland			= 2030000,	-- C_ローランド
	C_Degrogue			= 2030001,	-- C_ディグログ
	C_Rimuru			= 2030002,	-- C_魔王リムル
	C_Murren			= 2030003,	-- C_ミューレン
	C_Adel				= 2030004,	-- C_アデル
	C_Bradley			= 2030005,	-- C_ブラッドレイ
	C_Leodore			= 2030006,	-- C_レオダール
	C_Soleil			= 2030007,	-- C_ソレイユ
	C_Granadas			= 2030100,	-- C_グラナダス
	C_Kyle				= 2030500,	-- C_騎士王カイル
	C_Ainz				= 2030501,	-- C_アインズ
	C_Maja				= 2050200,	-- C_マジャ
	C_Vayne				= 2050201,	-- C_ヴェイン
	C_Veldora			= 2050202,	-- C_ヴェルドラ
	C_GodLily			= 2050300,	-- C_神徒リリー
	C_Lougseus			= 2050301,	-- C_ログシウス
	C_GodBeyland		= 2050302,	-- C_英装ベイランド
	C_SageLagrobos		= 2050303,	-- C_英装ラグロボス
	C_KingRoland		= 2050400,	-- C_英雄王ローランド
	C_SummerLeona		= 2050401,	-- C_水着レオナ
	C_Graphel			= 2050402,	-- C_グラッフル
	C_Megius			= 2050403,	-- C_メギウス
	C_GodThouzer		= 2050404,	-- C_神獣サウザー
	C_MageZekus			= 2050405,	-- C_英装ゼクス
	C_Kynei				= 2050406,	-- C_カイネ
	C_Gilbert			= 2050407,	-- C_ギルバート
	C_GodKyle			= 2050408,	-- C_白炎カイル
	C_Lilaha			= 2050409,	-- C_リラハ
	C_Arkh				= 2050410,	-- C_アルク
	C_Balezar			= 2050411,	-- C_ベルザール
	C_Aernewisse		= 2050412,	-- C_アルネウス
	C_GodLougseus		= 2050413,	-- C_英装ログシウス
	C_SamuraiKyle		= 2050414,	-- C_侍カイル
	C_Judecca			= 2050415,	-- C_ジュデッカ
	C_KarmaNoug			= 2050416,	-- C_カルマノーグ
	C_RadaDour			= 2050417,	-- C_ラダドール
	C_Beyland			= 2082600,	-- C_ベイランド
	C_Lagrobos			= 2082601,	-- C_ラグロボス
	C_Zekus				= 2082602,	-- C_覚醒ゼクス
	C_Mauna				= 2082603,	-- C_神騎マウナ
	C_KingArkh			= 2082604,	-- C_竜王アルク
	E_MultiFirstAid_1	= 9000001,	-- E_マルチ応急処置用1
	E_MultiFirstAid_2	= 9000002,	-- E_マルチ応急処置用2
}
-- 一部バフIDの機能拡張
setmetatable(BuffIds.SctRcvValSingleSkill,{__index = function(_table, _key) if _key == -1 then return _table[math.random(1, 3)] else return nil end end})
setmetatable(BuffIds.TypeShield,{__index = function(_table, _key) if _key < 0 then _key = _key * -1 if _key&16==16 then local tSide if _key&12==12 then tSide = TARGET_SIDE_ALL elseif _key&8==8 then tSide = TARGET_SIDE_OPPONENT elseif _key&4==4 then tSide = TARGET_SIDE_ALLY else return nil end return _table[units:GetMostCharaType(tSide, _key&2==2 and TARGET_COND_BOTH or TARGET_COND_ALIVE, UNIT_COND_NONE + (_key&1 == 1 and UNIT_COND_NOT_ME or 0))] else return nil end else return nil end end})

-- デバフリスト
DebuffIds = {
	ElementEdgeFire		= 10100,	-- 炎刃
	ElementEdgeIce		= 10101,	-- 氷刃
	ElementEdgeTree		= 10102,	-- 樹刃
	ElementEdgeThunder	= 10103,	-- 雷刃
	ElementEdgeLight	= 10104,	-- 光刃
	ElementEdgeDarkness	= 10105,	-- 闇刃
	ElementEdge = {
	[ELEMENT_FIRE] = 10100,
	[ELEMENT_ICE] = 10101,
	[ELEMENT_TREE] = 10102,
	[ELEMENT_THUNDER] = 10103,
	[ELEMENT_LIGHT] = 10104,
	[ELEMENT_DARK] = 10105
	},								-- 属性刃 まとめ
	ElementEdgeFour		= 10106,	-- 四属性刃
	WeaknessPoison		= 10107,	-- 衰弱毒
	DotDamage			= 11100,	-- DOTダメージ
	AttackDecHpNone		= 11101,	-- 無属性攻撃時HP減少
	AttackDecHpFire		= 11102,	-- 炎属性攻撃時HP減少
	AttackDecHpIce		= 11103,	-- 氷属性攻撃時HP減少
	AttackDecHpTree		= 11104,	-- 樹属性攻撃時HP減少
	AttackDecHpThunder	= 11105,	-- 雷属性攻撃時HP減少
	AttackDecHpLight	= 11106,	-- 光属性攻撃時HP減少
	AttackDecHpDarkness	= 11107,	-- 闇属性攻撃時HP減少
	Bleed				= 11115,	-- 出血
	SongOfDestruction	= 11116,	-- 破滅ノ歌声
	SctRcvVal			= 21050,	-- SCT回復量減少
	SctRcvValSkill1		= 21051,	-- 特技1SCT回復量減少
	SctRcvValSkill2		= 21052,	-- 特技2SCT回復量減少
	SctRcvValSkill3		= 21053,	-- 特技3SCT回復量減少
	SctRcvValSingleSkill = {
	[0] = 21050,
	[1] = 21051,
	[2] = 21052,
	[3] = 21053,
	},								-- 単独SCT回復量減少_まとめ
	EvilSpirit			= 21350,	-- 悪霊跋扈
	HealPer				= 21351,	-- HP回復量減少
	EtherRcv			= 21550,	-- 超必殺技ゲージ増加量減少
	StrEdit				= 30050,	-- STR減少
	StatusEdit			= 30051,	-- 全能力減少(不死)
	E_StrEdit			= 30052,	-- STR減少(永続)
	StatusEdit2			= 30053,	-- 全能力減少(ダラメキラの呪い)
	HumanStrEdit		= 30054,	-- 人型STR減少
	OtherStrEdit		= 30055,	-- 魔獣STR減少
	AllStatusEdit		= 30056,	-- 全ステ増加
	DefEdit				= 30150,	-- DEF減少
	E_DefEdit			= 30151,	-- DEF減少(永続)
	IntEdit				= 30250,	-- INT減少
	E_IntEdit			= 30251,	-- INT減少(永続)
	MndEdit				= 30350,	-- MND減少
	E_MndEdit			= 30351,	-- MND減少(永続)
	CrtEdit				= 30450,	-- CRT率減少
	E_CrtEdit			= 30451,	-- CRT率減少(永続)
	MaxHpEdit			= 30550,	-- 最大HP減少
	E_MaxHpEdit			= 30551,	-- 最大HP減少(永続)
	AilmentResist		= 30650,	-- 基本状態異常耐性減少
	PoisonResist		= 30651,	-- 毒耐性減少
	ParalysysResist		= 30652,	-- 麻痺耐性減少
	SickResist			= 30653,	-- 病気耐性減少
	DarknessResist		= 30654,	-- 暗闇耐性減少
	CurseResist			= 30655,	-- 呪い耐性減少
	SlienceResist		= 30656,	-- 沈黙耐性減少
	ElementResist		= 30750,	-- 全属性耐性減少
	FireResist			= 30751,	-- 炎耐性減少
	IceResist			= 30752,	-- 氷耐性減少
	TreeResist			= 30753,	-- 樹耐性減少
	ThunderResist		= 30754,	-- 雷耐性減少
	LightResist			= 30755,	-- 光耐性減少
	DarknessResist		= 30756,	-- 闇耐性減少
	SpdEdit				= 31050,	-- 移動速度減少
	SpdEdit2			= 31051,	-- 移動速度減少(消去不可)
	ShorteningCast		= 31250,	-- 詠唱速度減少
	StunEdit			= 31450,	-- 気絶値減少
	BreakEdit			= 31451,	-- ブレイク値減少
	P_SufferVitEdit		= 31452,	-- P_VIT被ダメージ増減
	SufferStunEdit		= 31453,	-- 被気絶値増加
	SufferBreakEdit		= 31454,	-- 被ブレイク値増加
	MaxMpEdit			= 31850,	-- 最大MP減少
	LockOn				= 32003,	-- ロックオン
	HateEffect			= 32051,	-- 狙われ効果減少
	PhysicalDamagePer	= 50250,	-- 物理与ダメージ減少
	SufferSkillDmgPer	= 50251,	-- 特技被ダメージ増加
	SufferSpecialDmgPer	= 50252,	-- 超必殺技被ダメージ増加
	SufferBossDmgPer	= 50253,	-- 対ボス被ダメージ増加
	SufferNotBossDmgPer	= 50254,	-- 対雑魚被ダメージ増加
	SkillDamagePer		= 50255,	-- 特技与ダメージ減少
	SufferDamagePer_CharaType	=	{
	[CHARA_TYPE_SOLDIER] = 50256,	-- 対ソルジャー被ダメージ増加
	[CHARA_TYPE_SNIPER] = 50257,	-- 対スナイパー被ダメージ増加
	[CHARA_TYPE_KNIGHT] = 50258,	-- 対ナイト被ダメージ増加
	[CHARA_TYPE_SORCERER] = 50259,	-- 対ソーサラー被ダメージ増加
	[CHARA_TYPE_BEAST] = 50260,		-- 対獣被ダメージ増加
	[CHARA_TYPE_PLANT] = 50261,		-- 対植物被ダメージ増加
	[CHARA_TYPE_INSECT] = 50262,	-- 対昆虫被ダメージ増加
	[CHARA_TYPE_BIRD] = 50263,		-- 対鳥被ダメージ増加
	[CHARA_TYPE_MAGICAL] = 50264,	-- 対魔法生物被ダメージ増加
	[CHARA_TYPE_UNDEAD] = 50265,	-- 対不死生物被ダメージ増加
	[CHARA_TYPE_STONE] = 50266,		-- 対鉱石被ダメージ増加
	[CHARA_TYPE_MACHINE] = 50267,	-- 対機械被ダメージ増加
	[CHARA_TYPE_SPIRIT] = 50268,	-- 対精霊被ダメージ増加
	[CHARA_TYPE_DRAGON] = 50269,	-- 対竜被ダメージ増加
	[CHARA_TYPE_GOD] = 50270,		-- 対神被ダメージ増加
	[CHARA_TYPE_FISH] = 50271,		-- 対魚被ダメージ増加
	},
	MagicDamagePer		= 50350,	-- 魔法与ダメージ減少
	NextHitSufferDamagePer= 50351,	-- 回数制限付き被ダメージ増加
	SufferCriticalDamagePer= 50352,	-- クリティカル被ダメージ増加
	SufferWeakElemDamagePer= 50353,	-- 弱点属性被ダメージ増加
	SufferDmgPer		= 50450,	-- 被ダメージ増加
	SufferPhysDmgPer	= 50451,	-- 物理被ダメージ増加
	SufferMagDmgPer		= 50452,	-- 魔法被ダメージ増加
	SufferNonElementDmgPer= 50453,	-- 無属性被ダメージ増加
	SufferFireDmgPer	= 50454,	-- 炎属性被ダメージ増加
	SufferIceDmgPer		= 50455,	-- 氷属性被ダメージ増加
	SufferTreeDmgPer	= 50456,	-- 樹属性被ダメージ増加
	SufferThunderDmgPer	= 50457,	-- 雷属性被ダメージ増加
	SufferLightDmgPer	= 50458,	-- 光属性被ダメージ増加
	SufferDarkDmgPer	= 50459,	-- 闇属性被ダメージ増加
	SufferElementDmgPer	= 50460,	-- 全属性被ダメージ増加
	SufferElementSkillDmgPer = {
	[ELEMENT_ALL] = 50460,
	[ELEMENT_NONE] = 50453,
	[ELEMENT_FIRE] = 50454,
	[ELEMENT_ICE] = 50455,
	[ELEMENT_TREE] = 50456,
	[ELEMENT_THUNDER] = 50457,
	[ELEMENT_LIGHT] = 50458,
	[ELEMENT_DARK] = 50459
	},								-- 属性被ダメージ増加 まとめ
	AllDamagePer		= 50461,	-- 与ダメージ減少
	SpecialDamagePer	= 50462,	-- 超必殺技与ダメージ減少
	HitRate				= 50650,	-- 命中率減少
	KillerPower			= 50950,	-- キラー倍率減少
	ReductionMpCost		= 80250,	-- 消費MP増加
	P_ForbidMagOrSkill	= 81300,	-- P_指定操作禁止
	ForbidSkill			= 81301,	-- 特技発動不可
	ForbidMagic			= 81302,	-- 魔法発動不可
	AddCharaType = {
	[CHARA_TYPE_SOLDIER] = 81450,	-- ソルジャータイプ追加
	[CHARA_TYPE_SNIPER] = 81451,	-- スナイパータイプ追加
	[CHARA_TYPE_KNIGHT] = 81452,	-- ナイトタイプ追加
	[CHARA_TYPE_SORCERER] = 81453,	-- ソーサラータイプ追加
	[CHARA_TYPE_BEAST] = 81454,		-- 獣タイプ追加
	[CHARA_TYPE_PLANT] = 81455,		-- 植物タイプ追加
	[CHARA_TYPE_INSECT] = 81456,	-- 昆虫タイプ追加
	[CHARA_TYPE_BIRD] = 81457,		-- 鳥タイプ追加
	[CHARA_TYPE_MAGICAL] = 81458,	-- 魔法生物タイプ追加
	[CHARA_TYPE_UNDEAD] = 81459,	-- 不死生物タイプ追加
	[CHARA_TYPE_STONE] = 81460,		-- 鉱石タイプ追加
	[CHARA_TYPE_MACHINE] = 81461,	-- 機械タイプ追加
	[CHARA_TYPE_SPIRIT] = 81462,	-- 精霊タイプ追加
	[CHARA_TYPE_DRAGON] = 81463,	-- 竜タイプ追加
	[CHARA_TYPE_GOD] = 81464,		-- 神タイプ追加
	[CHARA_TYPE_FISH] = 81465,		-- 魚タイプ追加
	},
	NoticeLetter		= 81670,	-- 予告状
	Reform				= 81671,	-- 改心
	LightningNeedle		= 81672,	-- 導雷針
	Prison				= 81679,	-- 監獄
	GodAdmonition		= 81685,	-- 神戒
	PresentRed			= 81705,	-- プレゼントデバフ_赤
	PresentGreen		= 81706,	-- プレゼントデバフ_緑
	PresentPurple		= 81707,	-- プレゼントデバフ_紫
	Atrophy				= 81711,	-- 萎縮
	WaterPoison			= 81715,	-- 水毒
	Corrosion			= 81717,	-- 腐食
	AT_Revenge			= 81728,	-- 復讐
	TheoryOfMagicSystem	= 81738,	-- 魔術理論体系
	LougseusSealed		= 81739,	-- 破神封印
	FaithCollection		= 81744,	-- 信仰徴収
	CG_Geass			= 81753,	-- CG_ギアス
	SufferLacDefBonus	= 81754,	-- 被裂傷値蓄積量増加
	Condemnation		= 81757,	-- 断罪
	SufferDamageLimit_CharaType = {
	[CHARA_TYPE_SOLDIER] = 82484,	-- 対ソルジャー被ダメージ上限増加
	[CHARA_TYPE_SNIPER] = 82485,	-- 対スナイパー被ダメージ上限増加
	[CHARA_TYPE_KNIGHT] = 82486,	-- 対ナイト被ダメージ上限増加
	[CHARA_TYPE_SORCERER] = 82487,	-- 対ソーサラー被ダメージ上限増加
	[CHARA_TYPE_BEAST] = 82488,		-- 対獣被ダメージ上限増加
	[CHARA_TYPE_PLANT] = 82489,		-- 対植物被ダメージ上限増加
	[CHARA_TYPE_INSECT] = 82490,	-- 対昆虫被ダメージ上限増加
	[CHARA_TYPE_BIRD] = 82491,		-- 対鳥被ダメージ上限増加
	[CHARA_TYPE_MAGICAL] = 82492,	-- 対魔法生物被ダメージ上限増加
	[CHARA_TYPE_UNDEAD] = 82493,	-- 対不死生物被ダメージ上限増加
	[CHARA_TYPE_STONE] = 82494,		-- 対鉱石被ダメージ上限増加
	[CHARA_TYPE_MACHINE] = 82495,	-- 対機械被ダメージ上限増加
	[CHARA_TYPE_SPIRIT] = 82496,	-- 対精霊被ダメージ上限増加
	[CHARA_TYPE_DRAGON] = 82497,	-- 対竜被ダメージ上限増加
	[CHARA_TYPE_GOD] = 82498,		-- 対神被ダメージ上限増加
	[CHARA_TYPE_FISH] = 82499,		-- 対魚被ダメージ上限増加
	},
	SufferDamageLimit_Element = {
	[ELEMENT_NONE] = 82650,
	[ELEMENT_FIRE] = 82651,
	[ELEMENT_ICE] = 82652,
	[ELEMENT_TREE] = 82653,
	[ELEMENT_THUNDER] = 82654,
	[ELEMENT_LIGHT] = 82655,
	[ELEMENT_DARK] = 82656,
	[ELEMENT_ALL] = 82657,
	},								-- 指定属性被ダメージ上限増加 まとめ
	WeakElemDamageLimit	= 82658,	-- 弱点属性ダメージ上限ダウン
	DamageLimit_CharaType = {
	[CHARA_TYPE_SOLDIER] = 82659,
	[CHARA_TYPE_SNIPER] = 82660,
	[CHARA_TYPE_KNIGHT] = 82661,
	[CHARA_TYPE_SORCERER] = 82662,
	[CHARA_TYPE_BEAST] = 82663,
	[CHARA_TYPE_PLANT] = 82664,
	[CHARA_TYPE_INSECT] = 82665,
	[CHARA_TYPE_BIRD] = 82666,
	[CHARA_TYPE_MAGICAL] = 82667,
	[CHARA_TYPE_UNDEAD] = 82668,
	[CHARA_TYPE_STONE] = 82669,
	[CHARA_TYPE_MACHINE] = 82670,
	[CHARA_TYPE_SPIRIT] = 82671,
	[CHARA_TYPE_DRAGON] = 82672,
	[CHARA_TYPE_GOD] = 82673,
	[CHARA_TYPE_FISH] = 82674,
	},								-- 対特定キャラダメージ上限ダウン まとめ
	DamageLimit_EnemyType = {
	[ENEMY_TYPE_BOSS] = 82675,
	[ENEMY_TYPE_NORMAL] = 82676,
	},								-- 対特定敵タイプダメージ上限ダウン まとめ
	TargetBreakDamageLimit= 82679,	-- 対ブレイク中ダメージ上限ダウン
	SufferWeakElemDamageLimit= 82681,	-- 弱点属性被ダメージ上限増加
	P_DisableSkill		= 82700,	-- P_特定スキル使用不可
	TargetLock			= 83100,	-- ターゲット変更不可
	S_UidBuffEndDead	= 1010400,	-- S_指定UIDバフ終了時死亡
	S_DotDamage			= 1011100,	-- S_DOTダメージ
	S_DotDamage2		= 1011101,	-- S_DOTダメージ2
	S_HpSpendInstant	= 1011103,	-- S_即時HP減少
	S_MpSpend			= 1011200,	-- S_MP消費
	S_ForceVit0			= 1012000,	-- S_強制気絶・ブレイク
	S_SctRcvVal			= 1021000,	-- S_SCT回復速度減少
	S_SctRcvTrigBreak	= 1021001,	-- S_SCT回復速度変動トリガ_ブレイク
	S_HaveBuffUidBulletHealPer= 1021301,	-- S_特定UIDバフ効果中バレットHP回復量減少
	S_EtherRcv			= 1021500,	-- S_超必殺ゲージ増加量減少
	S_MaxHpEdit			= 1030501,	-- S_最大HP減少
	S_IntervalCountUpMaxHpEdit= 1030502,	-- S_指定時間毎最大HP累積減少
	S_ElementResist		= 1030700,	-- S_属性耐性減少
	S_MaxHpEdit			= 1030500,	-- S_最大HP減少
	S_SpdEditInSea		= 1031000,	-- S_魚以外移動速度減少
	S_MaxMpEdit			= 1031800,	-- S_最大MP減少
	S_MpCostEdit		= 1080200,	-- S_消費MP増減
	S_InvalidationKillerAvoid= 1081000,	-- S_キラー発生時回避スキル無効
	S_InvalidationTargetActorSkillAvoid= 1081002,-- S_対指定アクター特定スキル回避無効
	S_InvalidationTargetBuffActorSkillAvoid= 1081003,-- S_対特定バフカテゴリ指定アクター特定スキル回避無効
	S_ForbidMagOrSkill	= 1081300,	-- S_指定操作禁止
	S_DisableSkill		= 1082700,	-- S_特定スキル使用不可
	S_DisableSkill_WAVE	= 1082701,	-- S_特定スキル使用不可_WAVE
	C_Megius			= 2021350,	-- C_メギウス_アニマ
	C_Shida				= 2030050,	-- C_シダ_アニマ
	C_Ryvern			= 2030051,	-- C_ライバーン_アニマ
	C_GodRei			= 2030052,	-- C_獣神レイ_アニマ
	C_Zero				= 2030053,	-- C_神戒ゼロ_アニマ
	C_GodLougseus		= 2030054,	-- C_英装ログシウス_アニマ
	C_Lucia				= 2030055,	-- C_ルシア_アニマ
	C_Ardine			= 2030150,	-- C_アーディン_アニマ
	C_Mauna				= 2030151,	-- C_マウナ_アニマ
	C_Lougseus			= 2030350,	-- C_ログシウス_アニマ
	C_Labyreth			= 2030650,	-- C_ラブレス_アニマ
	C_Kyna				= 2030651,	-- C_カイナ_アニマ
	C_Eliza				= 2030750,	-- C_英装エリザ_アニマ
	C_Lagreign			= 2030751,	-- C_神獣ラグレイン_アニマ
	C_GodMia			= 2030752,	-- C_神戒ミア_アニマ
	C_SummerSera		= 2030753,	-- C_水着セラ_アニマ
	C_DevilMayly		= 2030754,	-- C_英装メイリー_アニマ
	C_Lilaha			= 2030755,	-- C_リラハ_アニマ
	C_GodLenius			= 2030756,	-- C_英装レニウス_アニマ
	C_Garland			= 2031450,	-- C_ガーランド_アニマ
	C_Mayly				= 2050250,	-- C_メイリー_アニマ
	C_Lenius			= 2050251,	-- C_レニウス_アニマ
	C_Nael				= 2050450,	-- C_ネイル_アニマ
	C_SummerNael		= 2050451,	-- C_水着ネイル_アニマ
	C_Lonardo			= 2050452,	-- C_ロナード_アニマ
	C_SummerLabyreth	= 2050453,	-- C_水着ラブレス_アニマ
	C_DevilLabyreth		= 2050454,	-- C_魔神ラブレス_アニマ
	C_EmperorLonardo	= 2050455,	-- C_皇帝ロナード_アニマ
	C_Yuda				= 2050456,	-- C_ユダ
	C_Thouzer			= 2082650,	-- C_サウザー_アニマ
}
-- 一部デバフIDの機能拡張
setmetatable(DebuffIds.SctRcvValSingleSkill,{__index = function(_table, _key) if _key == -1 then return _table[math.random(1, 3)] else return nil end end})
setmetatable(DebuffIds.AddCharaType,{__index = function(_table, _key) 
	if _key < 0 then 
		_key = _key * -1
		if _key&16==16 then
			local tSide
			if _key&12==12 then 
				tSide = TARGET_SIDE_ALL
			elseif _key&8==8 then 
				tSide = TARGET_SIDE_OPPONENT
			elseif _key&4==4 then
				tSide = TARGET_SIDE_ALLY
			else
				return nil
			end
			return _table[units:GetMostCharaType(tSide, _key&2==2 and TARGET_COND_BOTH or TARGET_COND_ALIVE, UNIT_COND_NONE + (_key&1 == 1 and UNIT_COND_NOT_ME or 0))]
		else return nil end
	else return nil end 
end})
setmetatable(DebuffIds.SufferDamagePer_CharaType,{__index = function(_table, _key) if _key < 0 then _key = _key * -1 if _key&16==16 then local tSide if _key&12==12 then tSide = TARGET_SIDE_ALL elseif _key&8==8 then tSide = TARGET_SIDE_OPPONENT elseif _key&4==4 then tSide = TARGET_SIDE_ALLY else return nil end return _table[units:GetMostCharaType(tSide, _key&2==2 and TARGET_COND_BOTH or TARGET_COND_ALIVE, UNIT_COND_NONE + (_key&1 == 1 and UNIT_COND_NOT_ME or 0))] else return nil end else return nil end end})

-- バフ情報テーブルのキー
BUFF_INFO_ID = 'buffId'					-- バフID
BUFF_INFO_NAME = 'name'					-- 名称
BUFF_INFO_COND_ID = 'condition'			-- 条件ID
BUFF_INFO_COND_PARAM = 'condParam'		-- 条件パラメータ(配列)
BUFF_INFO_METHOD = 'method'				-- 操作方法
BUFF_INFO_OPE = 'ope'					-- 操作タイプ
BUFF_INFO_SOURCE = 'source'				-- 参照元
BUFF_INFO_TARGET = 'target'				-- 対象
BUFF_INFO_ISSCRIPT = 'script'			-- スクリプト使用(bool)
BUFF_INFO_TYPE = 'buffType'				-- バフタイプ
BUFF_INFO_CATEGORY = 'category'			-- バフカテゴリ
BUFF_INFO_GROUP = 'group'				-- バフグループ
BUFF_INFO_SUBJECT = 'subj'				-- バフ発動者識別子
BUFF_INFO_OWNER = 'owner'				-- バフオーナー識別子
BUFF_INFO_UID = 'uid'					-- バフUID
BUFF_INFO_REMAIN = 'remain'				-- バフの残りフレーム(UnitGetBuffs, UnitGetDebuffsのみ)
BUFF_INFO_ICON_ID = 'iconId'			-- バフアイコンID
BUFF_INFO_PARAM = 'param'				-- バフパラメータ
BUFF_INFO_DESCRIPTION = 'description'	-- バフ説明文
BUFF_INFO_QUOTE = 'quote'				-- バフ処理説明引用

-- バフタイプ(2で割った余り)
BUFF_TYPE_BUFF = 0
BUFF_TYPE_DEBUFF = 1

-- バフカテゴリ
BUFF_CATEGORY_STR_UP_1 = 100
BUFF_CATEGORY_STR_UP_2 = 101
BUFF_CATEGORY_STR_DOWN_1 = 150
BUFF_CATEGORY_STR_DOWN_2 = 151
BUFF_CATEGORY_DEF_UP_1 = 200
BUFF_CATEGORY_DEF_UP_2 = 201
BUFF_CATEGORY_DEF_DOWN_1 = 250
BUFF_CATEGORY_INT_UP_1 = 300
BUFF_CATEGORY_INT_UP_2 = 301
BUFF_CATEGORY_INT_DOWN_1 = 350
BUFF_CATEGORY_MND_UP_1 = 400
BUFF_CATEGORY_MND_DOWN_1 = 450
BUFF_CATEGORY_CRT_UP_1 = 500
BUFF_CATEGORY_CRT_DOWN_1 = 550
BUFF_CATEGORY_HP_UP_1 = 600
BUFF_CATEGORY_HP_DOWN_1 = 650
BUFF_CATEGORY_AILMENT_UP_1 = 700
BUFF_CATEGORY_AILMENT_UP_2 = 701
BUFF_CATEGORY_AILMENT_DOWN_1 = 750
BUFF_CATEGORY_POISON_UP = 800
BUFF_CATEGORY_POISON_DOWN = 850
BUFF_CATEGORY_PARALYSYS_UP = 900
BUFF_CATEGORY_PARALYSYS_DOWN = 950
BUFF_CATEGORY_SICK_UP = 1000
BUFF_CATEGORY_SICK_DOWN = 1050
BUFF_CATEGORY_BLIND_UP = 1100
BUFF_CATEGORY_BLIND_DOWN = 1150
BUFF_CATEGORY_CURSE_UP = 1200
BUFF_CATEGORY_CURSE_DOWN = 1250
BUFF_CATEGORY_SILENCE_UP = 1300
BUFF_CATEGORY_SILENCE_DOWN = 1350
BUFF_CATEGORY_SPEED_UP_1 = 1400
BUFF_CATEGORY_SPEED_UP_2 = 1401
BUFF_CATEGORY_SPEED_DOWN_1 = 1450
BUFF_CATEGORY_CAST_SPEED_UP_1 = 1500
BUFF_CATEGORY_CAST_SPEED_DOWN_1 = 1550
BUFF_CATEGORY_MP_UP_1 = 1600
BUFF_CATEGORY_MP_DOWN_1 = 1650
BUFF_CATEGORY_HIT_RATE_UP_1 = 1700
BUFF_CATEGORY_HIT_RATE_DOWN_1 = 1750
BUFF_CATEGORY_SUPER_ARMOR_1 = 1800
BUFF_CATEGORY_SUPER_ARMOR_2 = 1801
BUFF_CATEGORY_SUPER_ARMOR_3 = 1802
BUFF_CATEGORY_SUPER_ARMOR_4 = 1803
BUFF_CATEGORY_SUPER_ARMOR_5 = 1804
BUFF_CATEGORY_SUPER_ARMOR_6 = 1805
BUFF_CATEGORY_SUPER_ARMOR_7 = 1806
BUFF_CATEGORY_SUPER_ARMOR_8 = 1807
BUFF_CATEGORY_ADD_HIT_1 = 1900
BUFF_CATEGORY_ADD_HIT_FIRE_1 = 2000
BUFF_CATEGORY_ADD_HIT_ICE_1 = 2100
BUFF_CATEGORY_ADD_HIT_TREE_1 = 2200
BUFF_CATEGORY_ADD_HIT_THUNDER_1 = 2300
BUFF_CATEGORY_ADD_HIT_LIGHT_1 = 2400
BUFF_CATEGORY_ADD_HIT_DARKNESS_1 = 2500
BUFF_CATEGORY_REGENE_1 = 2600
BUFF_CATEGORY_REGENE_2 = 2601
BUFF_CATEGORY_MP_REGENE_1 = 2700
BUFF_CATEGORY_MP_REGENE_2 = 2701
BUFF_CATEGORY_BARRIER = 2800
BUFF_CATEGORY_BARRIER_2 = 2801
BUFF_CATEGORY_SCT_UP_1 = 2900
BUFF_CATEGORY_SCT_UP_2 = 2901
BUFF_CATEGORY_SCT_UP_3 = 2902
BUFF_CATEGORY_SCT_UP_4 = 2903
BUFF_CATEGORY_SCT_UP_5 = 2904
BUFF_CATEGORY_SCT_DOWN_1 = 2950
BUFF_CATEGORY_SCT_DOWN_2 = 2951
BUFF_CATEGORY_SCT_DOWN_3 = 2952
BUFF_CATEGORY_SCT_DOWN_4 = 2953
BUFF_CATEGORY_SCT_DOWN_5 = 2954
BUFF_CATEGORY_RESIST_ALL_UP = 3000
BUFF_CATEGORY_RESIST_ALL_DOWN = 3050
BUFF_CATEGORY_RESIST_FIRE_UP = 3100
BUFF_CATEGORY_RESIST_FIRE_DOWN = 3150
BUFF_CATEGORY_RESIST_ICE_UP = 3200
BUFF_CATEGORY_RESIST_ICE_DOWN = 3250
BUFF_CATEGORY_RESIST_TREE_UP = 3300
BUFF_CATEGORY_RESIST_TREE_DOWN = 3350
BUFF_CATEGORY_RESIST_THUNDER_UP = 3400
BUFF_CATEGORY_RESIST_THUNDER_DOWN = 3450
BUFF_CATEGORY_RESIST_LIGHT_UP = 3500
BUFF_CATEGORY_RESIST_LIGHT_DOWN = 3550
BUFF_CATEGORY_RESIST_DARKNESS_UP = 3600
BUFF_CATEGORY_RESIST_DARKNESS_DOWN = 3650
BUFF_CATEGORY_RESIST_DAMAGE_UP_1 = 3700
BUFF_CATEGORY_RESIST_DAMAGE_DOWN_1 = 3750
BUFF_CATEGORY_RESIST_MAGIC_DAMAGE_UP_1 = 3800
BUFF_CATEGORY_RESIST_MAGIC_DAMAGE_UP_2 = 3801
BUFF_CATEGORY_RESIST_MAGIC_DAMAGE_UP_3 = 3802
BUFF_CATEGORY_RESIST_MAGIC_DAMAGE_DOWN_1 = 3850
BUFF_CATEGORY_RESIST_PHYSICAL_DAMAGE_UP_1 = 3900
BUFF_CATEGORY_RESIST_PHYSICAL_DAMAGE_UP_2 = 3901
BUFF_CATEGORY_RESIST_PHYSICAL_DAMAGE_DOWN_1 = 3950
BUFF_CATEGORY_MAGIC_NODAMAGE_1 = 4000
BUFF_CATEGORY_PHYSICAL_NODAMAGE_1 = 4100
BUFF_CATEGORY_PHYSICAL_NODAMAGE_2 = 4101
BUFF_CATEGORY_PHYSICAL_NODAMAGE_3 = 4102
BUFF_CATEGORY_NODEBUFF = 4200
BUFF_CATEGORY_FIREEQUIP_STATUS = 4300
BUFF_CATEGORY_FIREEQUIP_POWER = 4400
BUFF_CATEGORY_UNDEAD = 4500
BUFF_CATEGORY_CURSE_OF_DARAMEKIRA = 4501
BUFF_CATEGORY_POWER_FIRE_1 = 4600
BUFF_CATEGORY_POWER_ICE_1 = 4700
BUFF_CATEGORY_POWER_TREE_1 = 4800
BUFF_CATEGORY_POWER_THUNDER_1 = 4900
BUFF_CATEGORY_POWER_LIGHT_1 = 5000
BUFF_CATEGORY_POWER_DARKNESS_1 = 5100
BUFF_CATEGORY_GOLDEN_PRESTIGE = 5200
BUFF_CATEGORY_MP_CONVERT = 5300
BUFF_CATEGORY_OVERLOAD = 5400
BUFF_CATEGORY_DOT_DAMAGE_1 = 5500
BUFF_CATEGORY_DOT_DAMAGE_2 = 5501
BUFF_CATEGORY_DOT_DAMAGE_3 = 5502
BUFF_CATEGORY_DAMAGE_HUMAN_1 = 5600
BUFF_CATEGORY_DAMAGE_BEAST_1 = 5700
BUFF_CATEGORY_NORMAL_ATTACK_ADD_HIT = 5800
BUFF_CATEGORY_FIRST_ATTACK_1 = 5900
BUFF_CATEGORY_SKILL_MPDEC_DAMAGE_FLAG1 = 6000
BUFF_CATEGORY_SKILL_MPDEC_DAMAGE_FLAG2 = 6001
BUFF_CATEGORY_SKILL_MPDEC_DAMAGE_FLAG3 = 6002
BUFF_CATEGORY_SKILL_MPDEC_DAMAGE_JUDGE1 = 6100
BUFF_CATEGORY_SKILL_MPDEC_DAMAGE_JUDGE2 = 6101
BUFF_CATEGORY_SKILL_MPDEC_DAMAGE_JUDGE3 = 6102
BUFF_CATEGORY_ELEMENT_EDGE_1 = 6200
BUFF_CATEGORY_ELEMENT_EDGE_2 = 6201
BUFF_CATEGORY_ALL_STATUS_UP_1 = 6300
BUFF_CATEGORY_ALL_STATUS_UP_2 = 6301
BUFF_CATEGORY_ALL_STATUS_DOWN_1 = 6350
BUFF_CATEGORY_SKILL_DAMAGE_UP_1 = 6400
BUFF_CATEGORY_SKILL_DAMAGE_DOWN_1 = 6450
BUFF_CATEGORY_SPECIAL_DAMAGE_UP_1 = 6500
BUFF_CATEGORY_SPECIAL_DAMAGE_DOWN_1 = 6550
BUFF_CATEGORY_RESIST_PHYSICAL_DAMAGE_HP_1 = 6600
BUFF_CATEGORY_ELEMENT_SKILL_PARENT_HEAL = 6700
BUFF_CATEGORY_RESIST_MAGIC_DAMAGE_HP_1 = 6800
BUFF_CATEGORY_ALWAYS_MOVE_2 = 6901
BUFF_CATEGORY_AILMENT_BARRIER_1 = 7000
BUFF_CATEGORY_NORMAL_DRAIN_1 = 7100
BUFF_CATEGORY_REFLECT_1 = 7200
BUFF_CATEGORY_PHYSICAL_DAMAGE_UP_1 = 7300
BUFF_CATEGORY_PHYSICAL_DAMAGE_UP_2 = 7301
BUFF_CATEGORY_PHYSICAL_DAMAGE_UP_3 = 7302
BUFF_CATEGORY_PHYSICAL_DAMAGE_DOWN_1 = 7350
BUFF_CATEGORY_RERAISE_1 = 7400
BUFF_CATEGORY_TARGET_BREAK_DAMAGE_UP_1 = 7500
BUFF_CATEGORY_STUN_UP_1 = 7600
BUFF_CATEGORY_STUN_DOWN_1 = 7650
BUFF_CATEGORY_BREAK_UP_1 = 7700
BUFF_CATEGORY_BREAK_DOWN_1 = 7750
BUFF_CATEGORY_NEXT_SKILL_DAMAGE_UP_1 = 7800
BUFF_CATEGORY_NEXT_SKILL_DAMAGE_UP_2 = 7801
BUFF_CATEGORY_RESIST_NONELEMENT_DAMAGE_UP_1 = 7900
BUFF_CATEGORY_RESIST_NONELEMENT_DAMAGE_DOWN_1 = 7950
BUFF_CATEGORY_RESIST_FIRE_DAMAGE_UP_1 = 8000
BUFF_CATEGORY_RESIST_FIRE_DAMAGE_DOWN_1 = 8050
BUFF_CATEGORY_RESIST_ICE_DAMAGE_UP_1 = 8100
BUFF_CATEGORY_RESIST_ICE_DAMAGE_DOWN_1 = 8150
BUFF_CATEGORY_RESIST_TREE_DAMAGE_UP_1 = 8200
BUFF_CATEGORY_RESIST_TREE_DAMAGE_DOWN_1 = 8250
BUFF_CATEGORY_RESIST_THUNDER_DAMAGE_UP_1 = 8300
BUFF_CATEGORY_RESIST_THUNDER_DAMAGE_DOWN_1 = 8350
BUFF_CATEGORY_RESIST_LIGHT_DAMAGE_UP_1 = 8400
BUFF_CATEGORY_RESIST_LIGHT_DAMAGE_DOWN_1 = 8450
BUFF_CATEGORY_RESIST_DARKNESS_DAMAGE_UP_1 = 8500
BUFF_CATEGORY_RESIST_DARKNESS_DAMAGE_DOWN_1 = 8550
BUFF_CATEGORY_ADD_HIT_FIRE_DAMAGE_UP_1 = 8600
BUFF_CATEGORY_ADD_HIT_ICE_DAMAGE_UP_1 = 8700
BUFF_CATEGORY_ADD_HIT_TREE_DAMAGE_UP_1 = 8800
BUFF_CATEGORY_ADD_HIT_THUNDER_DAMAGE_UP_1 = 8900
BUFF_CATEGORY_ADD_HIT_LIGHT_DAMAGE_UP_1 = 9000
BUFF_CATEGORY_ADD_HIT_DARKNESS_DAMAGE_UP_1 = 9100
BUFF_CATEGORY_CHARISMA_CONTROL_1 = 9200
BUFF_CATEGORY_CHARISMA_CONTROL_2 = 9201
BUFF_CATEGORY_ANIMA_CONTROL_1 = 9250
BUFF_CATEGORY_ANIMA_CONTROL_2 = 9251
BUFF_CATEGORY_CHARISMA_1 = 9300
BUFF_CATEGORY_ANIMA_1 = 9350
BUFF_CATEGORY_AVOID_PHYSIC_1 = 9400
BUFF_CATEGORY_AVOID_PHYSIC_2 = 9401
BUFF_CATEGORY_AVOID_PHYSIC_NUM_1 = 9500
BUFF_CATEGORY_AVOID_PHYSIC_NUM_1 = 9500
BUFF_CATEGORY_MAGIC_DAMAGE_UP_1 = 9600
BUFF_CATEGORY_MAGIC_DAMAGE_DOWN_1 = 9650
BUFF_CATEGORY_RESIST_ELEMENT_DAMAGE_UP_1 = 9700
BUFF_CATEGORY_RESIST_ELEMENT_DAMAGE_DOWN_1 = 9750
BUFF_CATEGORY_ADD_HIT_NONELEMENT_DAMAGE_UP_1 = 9800
BUFF_CATEGORY_STYLE_UP_1 = 9900
BUFF_CATEGORY_STYLE_UP_2 = 9901
BUFF_CATEGORY_STYLE_CONTROL_1 = 10000
BUFF_CATEGORY_ELEMENT_ABSORB_NONE_1 = 10100
BUFF_CATEGORY_ELEMENT_ABSORB_FIRE_1 = 10200
BUFF_CATEGORY_ELEMENT_ABSORB_ICE_1 = 10300
BUFF_CATEGORY_ELEMENT_ABSORB_TREE_1 = 10400
BUFF_CATEGORY_ELEMENT_ABSORB_THUNDER_1 = 10500
BUFF_CATEGORY_ELEMENT_ABSORB_LIGHT_1 = 10600
BUFF_CATEGORY_ELEMENT_ABSORB_DARKNESS_1 = 10700
BUFF_CATEGORY_BULLET_COUNTER_1 = 10800
BUFF_CATEGORY_ANALYZE_FIRE = 10900
BUFF_CATEGORY_ANALYZE_ICE = 10901
BUFF_CATEGORY_ANALYZE_TREE = 10902
BUFF_CATEGORY_ANALYZE_THUNDER = 10903
BUFF_CATEGORY_ANALYZE_LIGHT = 10904
BUFF_CATEGORY_ANALYZE_DARK = 10905
BUFF_CATEGORY_ANALYZE_POISON = 10906
BUFF_CATEGORY_ANALYZE_PARALYSYS = 10907
BUFF_CATEGORY_ANALYZE_SICK = 10908
BUFF_CATEGORY_ANALYZE_DARKNESS = 10909
BUFF_CATEGORY_ANALYZE_CURSE = 10910
BUFF_CATEGORY_ANALYZE_SLIENCE = 10911
BUFF_CATEGORY_ANALYZE_PAIN = 10912
BUFF_CATEGORY_ANALYZE_MAGIC = 10913
BUFF_CATEGORY_RIMURU_SWORD = 11000
BUFF_CATEGORY_EVIL_SPIRIT = 11100
BUFF_CATEGORY_SERIES_FIRST_AID = 11200
BUFF_CATEGORY_DEMONIZATION = 11300
BUFF_CATEGORY_SPIRIT_POWER_FIRE = 11400
BUFF_CATEGORY_SPIRIT_POWER_ICE = 11401
BUFF_CATEGORY_SPIRIT_POWER_TREE = 11402
BUFF_CATEGORY_SPIRIT_POWER_THUNDER = 11403
BUFF_CATEGORY_SPIRIT_POWER_LIGHT = 11404
BUFF_CATEGORY_SPIRIT_POWER_DARK = 11405
BUFF_CATEGORY_SPIRIT_OVER_DRIVE = 11500
BUFF_CATEGORY_AS_LILY_MATTER = 11600
BUFF_CATEGORY_AS_ELD_RAVAHNA = 11601
BUFF_CATEGORY_DEVIL_BREAKER = 11700
BUFF_CATEGORY_MODE_CLEANUP = 11800
BUFF_CATEGORY_TYPE_SHIELD = 11900
BUFF_CATEGORY_RESIST_STUN_1 = 12000
BUFF_CATEGORY_RESIST_STUN_DOWN_1 = 12050
BUFF_CATEGORY_RANK_POINT_1 = 12100
BUFF_CATEGORY_RANK_POINT_2 = 12101
BUFF_CATEGORY_RANK_POINT_3 = 12102
BUFF_CATEGORY_RANK_POINT_4 = 12103
BUFF_CATEGORY_RANK_POINT_5 = 12104
BUFF_CATEGORY_RANK_POINT_6 = 12105
BUFF_CATEGORY_RANK_POINT_7 = 12106
BUFF_CATEGORY_RANK_POINT_8 = 12107
BUFF_CATEGORY_RANK_POINT_9 = 12108
BUFF_CATEGORY_RANK_POINT_10 = 12109
BUFF_CATEGORY_RANK_POINT_11 = 12110
BUFF_CATEGORY_ELEMENT_DAMAGE_LIMIT_UP_1 = 12200
BUFF_CATEGORY_ELEMENT_DAMAGE_LIMIT_UP_2 = 12201
BUFF_CATEGORY_ELEMENT_DAMAGE_LIMIT_UP_3 = 12202
BUFF_CATEGORY_ELEMENT_DAMAGE_LIMIT_UP_4 = 12203
BUFF_CATEGORY_ELEMENT_DAMAGE_LIMIT_UP_5 = 12204
BUFF_CATEGORY_ELEMENT_DAMAGE_LIMIT_UP_6 = 12205
BUFF_CATEGORY_ELEMENT_DAMAGE_LIMIT_UP_7 = 12206
BUFF_CATEGORY_MEREDY_CHARGE = 12300
BUFF_CATEGORY_HATE_UP_1 = 12400
BUFF_CATEGORY_HATE_DOWN_1 = 12450
BUFF_CATEGORY_ZEKUS_BUFF_1 = 12500
BUFF_CATEGORY_GEN_BUFF_1 = 12600
BUFF_CATEGORY_GEN_BUFF_2 = 12601
BUFF_CATEGORY_GEN_BUFF_3 = 12602
BUFF_CATEGORY_FORBID_SKILL = 12700
BUFF_CATEGORY_FORBID_SKILL_2 = 12701
BUFF_CATEGORY_FORBID_MAGIC = 12800
BUFF_CATEGORY_FORBID_MAGIC_2 = 12801
BUFF_CATEGORY_KING_OF_KNIGHT = 12900
BUFF_CATEGORY_TARGET_LOCK = 13000
BUFF_CATEGORY_GAME_MASTER = 13100
BUFF_CATEGORY_TECHNIQUE_CONSTRUCTION = 13101
BUFF_CATEGORY_NODAMAGE_1 = 13200
BUFF_CATEGORY_WAR_CRY = 13300
BUFF_CATEGORY_LOCK_ON = 13400
BUFF_CATEGORY_SKILL_DAMAGE_LIMIT_UP_1 = 13500
BUFF_CATEGORY_SKILL_DAMAGE_LIMIT_UP_2 = 13501
BUFF_CATEGORY_SKILL_DAMAGE_LIMIT_UP_3 = 13502
BUFF_CATEGORY_SKILL_DAMAGE_LIMIT_UP_4 = 13503
BUFF_CATEGORY_SKILL_DAMAGE_LIMIT_UP_5 = 13504
BUFF_CATEGORY_SKILL_DAMAGE_LIMIT_UP_6 = 13505
BUFF_CATEGORY_EXTINCTION = 13600
BUFF_CATEGORY_EXCLUSIVE_1 = 13700
BUFF_CATEGORY_EXCLUSIVE_2 = 13701
BUFF_CATEGORY_EXCLUSIVE_3 = 13702
BUFF_CATEGORY_EXCLUSIVE_4 = 13703
BUFF_CATEGORY_EXCLUSIVE_5 = 13704
BUFF_CATEGORY_EXCLUSIVE_6 = 13705
BUFF_CATEGORY_EXCLUSIVE_7 = 13706
BUFF_CATEGORY_EXCLUSIVE_8 = 13707
BUFF_CATEGORY_EXCLUSIVE_9 = 13708
BUFF_CATEGORY_EXCLUSIVE_10 = 13709
BUFF_CATEGORY_EXCLUSIVE_11 = 13710
BUFF_CATEGORY_EXCLUSIVE_12 = 13711
BUFF_CATEGORY_EXCLUSIVE_13 = 13712
BUFF_CATEGORY_EXCLUSIVE_14 = 13713
BUFF_CATEGORY_EXCLUSIVE_15 = 13714
BUFF_CATEGORY_EXCLUSIVE_16 = 13715
BUFF_CATEGORY_EXCLUSIVE_17 = 13716
BUFF_CATEGORY_EXCLUSIVE_18 = 13717
BUFF_CATEGORY_EXCLUSIVE_19 = 13718
BUFF_CATEGORY_EXCLUSIVE_20 = 13719
BUFF_CATEGORY_EXCLUSIVE_21 = 13720
BUFF_CATEGORY_EXCLUSIVE_22 = 13721
BUFF_CATEGORY_EXCLUSIVE_23 = 13722
BUFF_CATEGORY_EXCLUSIVE_24 = 13723
BUFF_CATEGORY_EXCLUSIVE_25 = 13724
BUFF_CATEGORY_EXCLUSIVE_26 = 13725
BUFF_CATEGORY_EXCLUSIVE_27 = 13726
BUFF_CATEGORY_EXCLUSIVE_28 = 13727
BUFF_CATEGORY_EXCLUSIVE_29 = 13728
BUFF_CATEGORY_EXCLUSIVE_30 = 13729
BUFF_CATEGORY_EXCLUSIVE_31 = 13730
BUFF_CATEGORY_EXCLUSIVE_32 = 13731
BUFF_CATEGORY_EXCLUSIVE_33 = 13732
BUFF_CATEGORY_EXCLUSIVE_34 = 13733
BUFF_CATEGORY_EXCLUSIVE_35 = 13734
BUFF_CATEGORY_EXCLUSIVE_36 = 13735
BUFF_CATEGORY_EXCLUSIVE_37 = 13736
BUFF_CATEGORY_EXCLUSIVE_38 = 13737
BUFF_CATEGORY_EXCLUSIVE_39 = 13738
BUFF_CATEGORY_EXCLUSIVE_40 = 13739
BUFF_CATEGORY_EXCLUSIVE_41 = 13740
BUFF_CATEGORY_EXCLUSIVE_42 = 13741
BUFF_CATEGORY_EXCLUSIVE_43 = 13742
BUFF_CATEGORY_EXCLUSIVE_44 = 13743
BUFF_CATEGORY_EXCLUSIVE_45 = 13744
BUFF_CATEGORY_EXCLUSIVE_46 = 13745
BUFF_CATEGORY_EXCLUSIVE_47 = 13746
BUFF_CATEGORY_EXCLUSIVE_48 = 13747
BUFF_CATEGORY_EXCLUSIVE_49 = 13748
BUFF_CATEGORY_EXCLUSIVE_50 = 13749
BUFF_CATEGORY_EXCLUSIVE_51 = 13750
BUFF_CATEGORY_EXCLUSIVE_52 = 13751
BUFF_CATEGORY_EXCLUSIVE_53 = 13752
BUFF_CATEGORY_EXCLUSIVE_54 = 13753
BUFF_CATEGORY_EXCLUSIVE_55 = 13754
BUFF_CATEGORY_EXCLUSIVE_56 = 13755
BUFF_CATEGORY_EXCLUSIVE_57 = 13756
BUFF_CATEGORY_EXCLUSIVE_58 = 13757
BUFF_CATEGORY_EXCLUSIVE_59 = 13758
BUFF_CATEGORY_EXCLUSIVE_60 = 13759
BUFF_CATEGORY_EXCLUSIVE_61 = 13760
BUFF_CATEGORY_EXCLUSIVE_62 = 13761
BUFF_CATEGORY_EXCLUSIVE_63 = 13762
BUFF_CATEGORY_EXCLUSIVE_64 = 13763
BUFF_CATEGORY_EXCLUSIVE_65 = 13764
BUFF_CATEGORY_EXCLUSIVE_66 = 13765
BUFF_CATEGORY_EXCLUSIVE_67 = 13766
BUFF_CATEGORY_EXCLUSIVE_68 = 13767
BUFF_CATEGORY_EXCLUSIVE_69 = 13768
BUFF_CATEGORY_EXCLUSIVE_70 = 13769
BUFF_CATEGORY_EXCLUSIVE_71 = 13770
BUFF_CATEGORY_EXCLUSIVE_72 = 13771
BUFF_CATEGORY_EXCLUSIVE_73 = 13772
BUFF_CATEGORY_EXCLUSIVE_74 = 13773
BUFF_CATEGORY_EXCLUSIVE_75 = 13774
BUFF_CATEGORY_EXCLUSIVE_76 = 13775
BUFF_CATEGORY_EXCLUSIVE_77 = 13776
BUFF_CATEGORY_EXCLUSIVE_78 = 13777
BUFF_CATEGORY_EXCLUSIVE_79 = 13778
BUFF_CATEGORY_EXCLUSIVE_80 = 13779
BUFF_CATEGORY_EXCLUSIVE_81 = 13780
BUFF_CATEGORY_EXCLUSIVE_82 = 13781
BUFF_CATEGORY_EXCLUSIVE_83 = 13782
BUFF_CATEGORY_EXCLUSIVE_84 = 13783
BUFF_CATEGORY_EXCLUSIVE_85 = 13784
BUFF_CATEGORY_EXCLUSIVE_86 = 13785
BUFF_CATEGORY_EXCLUSIVE_87 = 13786
BUFF_CATEGORY_EXCLUSIVE_88 = 13787
BUFF_CATEGORY_EXCLUSIVE_89 = 13788
BUFF_CATEGORY_EXCLUSIVE_90 = 13789
BUFF_CATEGORY_EXCLUSIVE_91 = 13790
BUFF_CATEGORY_EXCLUSIVE_92 = 13791
BUFF_CATEGORY_EXCLUSIVE_93 = 13792
BUFF_CATEGORY_EXCLUSIVE_94 = 13793
BUFF_CATEGORY_EXCLUSIVE_95 = 13794
BUFF_CATEGORY_EXCLUSIVE_96 = 13795
BUFF_CATEGORY_EXCLUSIVE_97 = 13796
BUFF_CATEGORY_EXCLUSIVE_98 = 13797
BUFF_CATEGORY_EXCLUSIVE_99 = 13798
BUFF_CATEGORY_EXCLUSIVE_100 = 13799
BUFF_CATEGORY_ETHER_RECOVER_UP_1 = 13900
BUFF_CATEGORY_ETHER_RECOVER_DOWN_1 = 13950
BUFF_CATEGORY_KILLER_POWER_UP_1 = 14000
BUFF_CATEGORY_KILLER_POWER_DOWN_1 = 14050
BUFF_CATEGORY_KILLER_DAMAGE_LIMIT_UP_1 = 14100
BUFF_CATEGORY_CHRISTMAS_CAROL = 14200
BUFF_CATEGORY_POWER_ELEMENT_1 = 14300
BUFF_CATEGORY_RESIST_SKILL_DAMAGE_UP_1 = 14400
BUFF_CATEGORY_RESIST_SKILL_DAMAGE_DOWN_1 = 14450
BUFF_CATEGORY_RESIST_SPECIAL_DAMAGE_UP_1 = 14500
BUFF_CATEGORY_RESIST_SPECIAL_DAMAGE_DOWN_1 = 14550
BUFF_CATEGORY_RESIST_BOSS_DAMAGE_UP_1 = 14600
BUFF_CATEGORY_RESIST_BOSS_DAMAGE_DOWN_1 = 14650
BUFF_CATEGORY_RESIST_NOTBOSS_DAMAGE_UP_1 = 14700
BUFF_CATEGORY_RESIST_NOTBOSS_DAMAGE_DOWN_1 = 14750
BUFF_CATEGORY_INVALID_GRIM_REAPER_1 = 14800
BUFF_CATEGORY_COLLABORATION_1 = 14900
BUFF_CATEGORY_COLLABORATION_2 = 14901
BUFF_CATEGORY_NEXT_SKILL_DAMAGE_LIMIT_UP_1 = 15100
BUFF_CATEGORY_DAMAGE_UP_1 = 15200
BUFF_CATEGORY_DAMAGE_DOWN_1 = 15250
BUFF_CATEGORY_NEXT_MAGIC_DAMAGE_UP_1 = 15300
BUFF_CATEGORY_NEXT_MAGIC_DAMAGE_UP_2 = 15301
BUFF_CATEGORY_RESIST_NONELEMENT_DAMAGE_LIMIT_UP_1 = 15400
BUFF_CATEGORY_RESIST_NONELEMENT_DAMAGE_LIMIT_DOWN_1 = 15450
BUFF_CATEGORY_RESIST_FIRE_DAMAGE_LIMIT_UP_1 = 15500
BUFF_CATEGORY_RESIST_FIRE_DAMAGE_LIMIT_DOWN_1 = 15550
BUFF_CATEGORY_RESIST_ICE_DAMAGE_LIMIT_UP_1 = 15600
BUFF_CATEGORY_RESIST_ICE_DAMAGE_LIMIT_DOWN_1 = 15650
BUFF_CATEGORY_RESIST_TREE_DAMAGE_LIMIT_UP_1 = 15700
BUFF_CATEGORY_RESIST_TREE_DAMAGE_LIMIT_DOWN_1 = 15750
BUFF_CATEGORY_RESIST_THUNDER_DAMAGE_LIMIT_UP_1 = 15800
BUFF_CATEGORY_RESIST_THUNDER_DAMAGE_LIMIT_DOWN_1 = 15850
BUFF_CATEGORY_RESIST_LIGHT_DAMAGE_LIMIT_UP_1 = 15900
BUFF_CATEGORY_RESIST_LIGHT_DAMAGE_LIMIT_DOWN_1 = 15950
BUFF_CATEGORY_RESIST_DARKNESS_DAMAGE_LIMIT_UP_1 = 16000
BUFF_CATEGORY_RESIST_DARKNESS_DAMAGE_LIMIT_DOWN_1 = 16050
BUFF_CATEGORY_RESIST_ELEMENT_DAMAGE_LIMIT_UP_1 = 16100
BUFF_CATEGORY_RESIST_ELEMENT_DAMAGE_LIMIT_DOWN_1 = 16150
BUFF_CATEGORY_WEAK_ELEMENT_DAMAGE_LIMIT_UP_1 = 16200
BUFF_CATEGORY_WEAK_ELEMENT_DAMAGE_LIMIT_DOWN_1 = 16250
BUFF_CATEGORY_HATE_EFFECT_UP_1 = 16300
BUFF_CATEGORY_HATE_EFFECT_DOWN_1 = 16350
BUFF_CATEGORY_NEXT_SPECIAL_DAMAGE_LIMIT_UP_1 = 16400
BUFF_CATEGORY_HEAL_UP_1 = 16500
BUFF_CATEGORY_HEAL_DOWN_1 = 16550
BUFF_CATEGORY_RESIST_NEXT_HIT_DAMAGE_UP_1 = 16600
BUFF_CATEGORY_RESIST_NEXT_HIT_DAMAGE_DOWN_1 = 16650
BUFF_CATEGORY_ENDURE_1 = 16700
BUFF_CATEGORY_RESIST_CRT_DAMAGE_UP_1 = 16800
BUFF_CATEGORY_RESIST_CRT_DAMAGE_DOWN_1 = 16850
BUFF_CATEGORY_RESIST_WEAK_ELEMENT_DAMAGE_UP_1 = 16900
BUFF_CATEGORY_RESIST_WEAK_ELEMENT_DAMAGE_DOWN_1 = 16950
BUFF_CATEGORY_NEXT_MAGIC_DAMAGE_LIMIT_UP_1 = 17000
BUFF_CATEGORY_TARGET_TYPE_DAMAGE_LIMIT_UP_1 = 17100
BUFF_CATEGORY_TARGET_TYPE_DAMAGE_LIMIT_DOWN_1 = 17150
BUFF_CATEGORY_BOSS_DAMAGE_LIMIT_UP_1 = 17200
BUFF_CATEGORY_BOSS_DAMAGE_LIMIT_DOWN_1 = 17250
BUFF_CATEGORY_NOTBOSS_DAMAGE_LIMIT_UP_1 = 17300
BUFF_CATEGORY_NOTBOSS_DAMAGE_LIMIT_DOWN_1 = 17350
BUFF_CATEGORY_MPDEC_UP_1 = 17400
BUFF_CATEGORY_MPDEC_DOWN_1 = 17450
BUFF_CATEGORY_NEXT_SKILL_DRAIN_1 = 17500
BUFF_CATEGORY_NEXT_SKILL_ENDURE_1 = 17600
BUFF_CATEGORY_GENERAL_UNIT_BUFF_1 = 17700
BUFF_CATEGORY_AVOID_MAGIC_1 = 17800
BUFF_CATEGORY_AVOID_MAGIC_NUM_1 = 17900
BUFF_CATEGORY_NEXT_NORMAL_ATTACK_DAMAGE_LIMIT_UP_1 = 18000
BUFF_CATEGORY_KILLER_RESIST_UP_1 = 18100
BUFF_CATEGORY_KILLER_RESIST_UP_2 = 18101
BUFF_CATEGORY_KILLER_RESIST_UP_3 = 18102
BUFF_CATEGORY_KILLER_RESIST_UP_4 = 18103
BUFF_CATEGORY_KILLER_RESIST_UP_5 = 18104
BUFF_CATEGORY_KILLER_RESIST_UP_6 = 18105
BUFF_CATEGORY_KILLER_RESIST_UP_7 = 18106
BUFF_CATEGORY_KILLER_RESIST_UP_8 = 18107
BUFF_CATEGORY_KILLER_RESIST_UP_9 = 18108
BUFF_CATEGORY_KILLER_RESIST_UP_10 = 18109
BUFF_CATEGORY_KILLER_RESIST_UP_11 = 18110
BUFF_CATEGORY_KILLER_RESIST_UP_12 = 18111
BUFF_CATEGORY_KILLER_RESIST_UP_13 = 18112
BUFF_CATEGORY_KILLER_RESIST_UP_14 = 18113
BUFF_CATEGORY_KILLER_RESIST_UP_15 = 18114
BUFF_CATEGORY_KILLER_RESIST_UP_16 = 18115
BUFF_CATEGORY_TARGET_BREAK_DAMAGE_LIMIT_UP_1 = 18200
BUFF_CATEGORY_TARGET_BREAK_DAMAGE_LIMIT_DOWN_1 = 18250

-- パラメータ対応カテゴリリスト(随時更新)
BUFF_CATEGORY_RESIST_ELEMENT_DAMAGE_UP_1_LIST = {
[ELEMENT_ALL] = BUFF_CATEGORY_RESIST_ELEMENT_DAMAGE_UP_1,
[ELEMENT_NONE] = BUFF_CATEGORY_RESIST_NONELEMENT_DAMAGE_UP_1,
[ELEMENT_FIRE] = BUFF_CATEGORY_RESIST_FIRE_DAMAGE_UP_1,
[ELEMENT_ICE] = BUFF_CATEGORY_RESIST_ICE_DAMAGE_UP_1,
[ELEMENT_TREE] = BUFF_CATEGORY_RESIST_TREE_DAMAGE_UP_1,
[ELEMENT_THUNDER] = BUFF_CATEGORY_RESIST_THUNDER_DAMAGE_UP_1,
[ELEMENT_LIGHT] = BUFF_CATEGORY_RESIST_LIGHT_DAMAGE_UP_1,
[ELEMENT_DARK] = BUFF_CATEGORY_RESIST_DARKNESS_DAMAGE_UP_1
}

-- ユーザーから視認可能なバフカテゴリの種類(改修済みなのでもう更新不要)
-- 済:アイコン情報によって判別するように改良する
VISIBLE_BUFF_CATEGORY_LIST = {
[BUFF_CATEGORY_STR_UP_1] = true,
[BUFF_CATEGORY_STR_UP_2] = true,
[BUFF_CATEGORY_DEF_UP_1] = true,
[BUFF_CATEGORY_INT_UP_1] = true,
[BUFF_CATEGORY_INT_UP_2] = true,
[BUFF_CATEGORY_MND_UP_1] = true,
[BUFF_CATEGORY_CRT_UP_1] = true,
[BUFF_CATEGORY_HP_UP_1] = true,
[BUFF_CATEGORY_AILMENT_UP_1] = true,
[BUFF_CATEGORY_POISON_UP] = true,
[BUFF_CATEGORY_PARALYSYS_UP] = true,
[BUFF_CATEGORY_SICK_UP] = true,
[BUFF_CATEGORY_BLIND_UP] = true,
[BUFF_CATEGORY_CURSE_UP] = true,
[BUFF_CATEGORY_SILENCE_UP] = true,
[BUFF_CATEGORY_SPEED_UP_1] = true,
[BUFF_CATEGORY_CAST_SPEED_UP_1] = true,
[BUFF_CATEGORY_MP_UP_1] = true,
[BUFF_CATEGORY_HIT_RATE_UP_1] = true,
[BUFF_CATEGORY_SUPER_ARMOR_1] = true,
[BUFF_CATEGORY_ADD_HIT_1] = true,
[BUFF_CATEGORY_ADD_HIT_FIRE_1] = true,
[BUFF_CATEGORY_ADD_HIT_ICE_1] = true,
[BUFF_CATEGORY_ADD_HIT_TREE_1] = true,
[BUFF_CATEGORY_ADD_HIT_THUNDER_1] = true,
[BUFF_CATEGORY_ADD_HIT_LIGHT_1] = true,
[BUFF_CATEGORY_ADD_HIT_DARKNESS_1] = true,
[BUFF_CATEGORY_REGENE_1] = true,
[BUFF_CATEGORY_REGENE_2] = true,
[BUFF_CATEGORY_MP_REGENE_1] = true,
[BUFF_CATEGORY_MP_REGENE_2] = true,
[BUFF_CATEGORY_BARRIER] = true,
[BUFF_CATEGORY_SCT_UP_1] = true,
[BUFF_CATEGORY_SCT_UP_2] = true,
[BUFF_CATEGORY_RESIST_ALL_UP] = true,
[BUFF_CATEGORY_RESIST_FIRE_UP] = true,
[BUFF_CATEGORY_RESIST_ICE_UP] = true,
[BUFF_CATEGORY_RESIST_TREE_UP] = true,
[BUFF_CATEGORY_RESIST_THUNDER_UP] = true,
[BUFF_CATEGORY_RESIST_LIGHT_UP] = true,
[BUFF_CATEGORY_RESIST_DARKNESS_UP] = true,
[BUFF_CATEGORY_RESIST_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_MAGIC_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_MAGIC_DAMAGE_UP_2] = true,
[BUFF_CATEGORY_RESIST_MAGIC_DAMAGE_UP_3] = true,
[BUFF_CATEGORY_RESIST_PHYSICAL_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_PHYSICAL_DAMAGE_UP_2] = true,
[BUFF_CATEGORY_PHYSICAL_NODAMAGE_1] = true,
[BUFF_CATEGORY_PHYSICAL_NODAMAGE_2] = true,
[BUFF_CATEGORY_POWER_FIRE_1] = true,
[BUFF_CATEGORY_POWER_ICE_1] = true,
[BUFF_CATEGORY_POWER_TREE_1] = true,
[BUFF_CATEGORY_POWER_THUNDER_1] = true,
[BUFF_CATEGORY_POWER_LIGHT_1] = true,
[BUFF_CATEGORY_POWER_DARKNESS_1] = true,
[BUFF_CATEGORY_GOLDEN_PRESTIGE] = true,
[BUFF_CATEGORY_OVERLOAD] = true,
[BUFF_CATEGORY_DAMAGE_HUMAN_1] = true,
[BUFF_CATEGORY_DAMAGE_BEAST_1] = true,
[BUFF_CATEGORY_NORMAL_ATTACK_ADD_HIT] = true,
[BUFF_CATEGORY_FIRST_ATTACK_1] = true,
[BUFF_CATEGORY_ALL_STATUS_UP_1] = true,
[BUFF_CATEGORY_ALL_STATUS_UP_2] = true,
[BUFF_CATEGORY_SKILL_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_SPECIAL_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_PHYSICAL_DAMAGE_HP_1] = true,
[BUFF_CATEGORY_RESIST_MAGIC_DAMAGE_HP_1] = true,
[BUFF_CATEGORY_AILMENT_BARRIER_1] = true,
[BUFF_CATEGORY_NORMAL_DRAIN_1] = true,
[BUFF_CATEGORY_REFLECT_1] = true,
[BUFF_CATEGORY_PHYSICAL_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_PHYSICAL_DAMAGE_UP_2] = true,
[BUFF_CATEGORY_PHYSICAL_DAMAGE_UP_3] = true,
[BUFF_CATEGORY_RERAISE_1] = true,
[BUFF_CATEGORY_TARGET_BREAK_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_STUN_UP_1] = true,
[BUFF_CATEGORY_BREAK_UP_1] = true,
[BUFF_CATEGORY_NEXT_SKILL_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_NONELEMENT_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_FIRE_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_ICE_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_TREE_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_THUNDER_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_LIGHT_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_DARKNESS_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_ADD_HIT_FIRE_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_ADD_HIT_ICE_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_ADD_HIT_TREE_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_ADD_HIT_THUNDER_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_ADD_HIT_LIGHT_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_ADD_HIT_DARKNESS_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_CHARISMA_1] = true,
[BUFF_CATEGORY_AVOID_PHYSIC_1] = true,
[BUFF_CATEGORY_AVOID_PHYSIC_2] = true,
[BUFF_CATEGORY_AVOID_PHYSIC_NUM_1] = true,
[BUFF_CATEGORY_MAGIC_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_ELEMENT_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_RESIST_ELEMENT_DAMAGE_DOWN_1] = true,
[BUFF_CATEGORY_ADD_HIT_NONELEMENT_DAMAGE_UP_1] = true,
[BUFF_CATEGORY_STYLE_UP_1] = true,
[BUFF_CATEGORY_ELEMENT_ABSORB_NONE_1] = true,
[BUFF_CATEGORY_ELEMENT_ABSORB_FIRE_1] = true,
[BUFF_CATEGORY_ELEMENT_ABSORB_ICE_1] = true,
[BUFF_CATEGORY_ELEMENT_ABSORB_TREE_1] = true,
[BUFF_CATEGORY_ELEMENT_ABSORB_THUNDER_1] = true,
[BUFF_CATEGORY_ELEMENT_ABSORB_LIGHT_1] = true,
[BUFF_CATEGORY_ELEMENT_ABSORB_DARKNESS_1] = true,
[BUFF_CATEGORY_BULLET_COUNTER_1] = true,
[BUFF_CATEGORY_ANALYZE_FIRE] = true,
[BUFF_CATEGORY_ANALYZE_ICE] = true,
[BUFF_CATEGORY_ANALYZE_TREE] = true,
[BUFF_CATEGORY_ANALYZE_THUNDER] = true,
[BUFF_CATEGORY_ANALYZE_LIGHT] = true,
[BUFF_CATEGORY_ANALYZE_DARK] = true,
[BUFF_CATEGORY_ANALYZE_POISON] = true,
[BUFF_CATEGORY_ANALYZE_PARALYSYS] = true,
[BUFF_CATEGORY_ANALYZE_SICK] = true,
[BUFF_CATEGORY_ANALYZE_DARKNESS] = true,
[BUFF_CATEGORY_ANALYZE_CURSE] = true,
[BUFF_CATEGORY_ANALYZE_SLIENCE] = true,
[BUFF_CATEGORY_ANALYZE_PAIN] = true,
[BUFF_CATEGORY_ANALYZE_MAGIC] = true,
[BUFF_CATEGORY_RIMURU_SWORD] = true,
[BUFF_CATEGORY_DEMONIZATION] = true,
[BUFF_CATEGORY_SPIRIT_POWER_FIRE] = true,
[BUFF_CATEGORY_SPIRIT_POWER_ICE] = true,
[BUFF_CATEGORY_SPIRIT_POWER_TREE] = true,
[BUFF_CATEGORY_SPIRIT_POWER_THUNDER] = true,
[BUFF_CATEGORY_SPIRIT_POWER_LIGHT] = true,
[BUFF_CATEGORY_SPIRIT_POWER_DARK] = true,
[BUFF_CATEGORY_SPIRIT_OVER_DRIVE] = true,
[BUFF_CATEGORY_AS_LILY_MATTER] = true,
[BUFF_CATEGORY_DEVIL_BREAKER] = true,
[BUFF_CATEGORY_MODE_CLEANUP] = true,
[BUFF_CATEGORY_TYPE_SHIELD] = true,
}
-- バフグループ
BUFF_GROUP_STR = 10
BUFF_GROUP_DEF = 20
BUFF_GROUP_INT = 30
BUFF_GROUP_MND = 40
BUFF_GROUP_CRT = 50
BUFF_GROUP_HP = 60
BUFF_GROUP_AILMENT = 70
BUFF_GROUP_SPEED = 80
BUFF_GROUP_CAST_SPEED = 90
BUFF_GROUP_MP = 100
BUFF_GROUP_DAMAGE = 110
BUFF_GROUP_HIT_RATE = 120
BUFF_GROUP_SUPER_ARMOR = 130
BUFF_GROUP_ADD_HIT = 140
BUFF_GROUP_REGENE = 150
BUFF_GROUP_MP_REGENE = 160
BUFF_GROUP_BARRIER = 170
BUFF_GROUP_SCT = 180
BUFF_GROUP_RESIST_ELEMENT = 190
BUFF_GROUP_PRECAST = 200
BUFF_GROUP_DAMAGE_ELEMENT = 210
BUFF_GROUP_DOT_DAMAGE = 220
BUFF_GROUP_FIRST_ATTACK = 230
BUFF_GROUP_SKILL_MPDEC_DAMAGE_FLAG1 = 240
BUFF_GROUP_SKILL_MPDEC_DAMAGE_FLAG2 = 241
BUFF_GROUP_SKILL_MPDEC_DAMAGE_FLAG3 = 242
BUFF_GROUP_ELEMENT_EDGE = 250
BUFF_GROUP_RESIST_MAGIC_DAMAGE_HP = 260
BUFF_GROUP_ALWAYS_MOVE = 270
BUFF_GROUP_AILMENT_BARRIER = 280
BUFF_GROUP_DRAIN = 290
BUFF_GROUP_RERAISE = 300
BUFF_GROUP_ALL_STATUS = 310
BUFF_GROUP_RESIST_PHYSICAL_DAMAGE_HP = 320
BUFF_GROUP_STUN_UP = 330
BUFF_GROUP_BREAK_UP = 340
BUFF_GROUP_CHARISMA = 350
BUFF_GROUP_AVOID = 360
BUFF_GROUP_STYLE = 370
BUFF_GROUP_SUFFER_ABSORB = 380
BUFF_GROUP_BULLET_COUNTER = 390
BUFF_GROUP_ANALYZE = 400
BUFF_GROUP_EVIL_SPIRIT = 410
BUFF_GROUP_SPIRIT_POWER = 420
BUFF_GROUP_SPIRIT_OVER_DRIVE = 430
BUFF_GROUP_DEVIL_BREAKER = 440
BUFF_GROUP_MODE_CLEANUP = 450
BUFF_GROUP_ELEMENT_DAMAGE_LIMIT = 460
BUFF_GROUP_MEREDY_CHARGE = 470
BUFF_GROUP_HATE = 480
BUFF_GROUP_ZEKUS_BUFF = 490
BUFF_GROUP_GEN_BUFF = 500
BUFF_GROUP_FORBID_MAGORSKILL = 510
BUFF_GROUP_KING_OF_KNIGHT = 520
BUFF_GROUP_TARGET_LOCK = 530
BUFF_GROUP_ADD_CHARA_TYPE = 540
BUFF_GROUP_ANIMA = 550
BUFF_GROUP_FIGHTING_SPIRIT = 560
BUFF_GROUP_ETHER_RECOVER = 570
BUFF_GROUP_BERSERK_MODE = 580
BUFF_GROUP_GUARDIAN = 590
BUFF_GROUP_ARDINE = 610
BUFF_GROUP_HEAL_PER = 640

-- バトルスコアID
BATTLE_SCORE_DMC_RANK = 1
BATTLE_SCORE_DMC_POINT = 2
BATTLE_SCORE_SN_RING = 3

-- UI名
UI_NAME_GUILD_HUNT = 'HuntCounter'
UI_NAME_DROP_ITEM = 'DropItem'

-- オートバトル状態
AUTO_BATTLE_OFF = 0
AUTO_BATTLE_SEMI = 1
AUTO_BATTLE_ON = 2

-- オプション効果変更
OPTION_CHANGE_NOT_AUTO_ATTACK = 1

-- 制限時間モード
BATTLE_TIMER_OFF = 0
BATTLE_TIMER_COUNT_DOWN = 1
BATTLE_TIMER_COUNT_UP = 2

-- クエストタイプ(クライアント)
QUEST_TYPE_NORMAL = 0
QUEST_TYPE_ARENA = 10
QUEST_TYPE_GVG = 20
QUEST_TYPE_WORLD_RAID = 30
QUEST_TYPE_BATTLE_GRAPH = 40

-- 曜日
WEEK_DAY_SUNDAY = 0
WEEK_DAY_MONDAY = 1
WEEK_DAY_TUESDAY = 2
WEEK_DAY_WEDNESDAY = 3
WEEK_DAY_THURSDAY = 4
WEEK_DAY_FRIDAY = 5
WEEK_DAY_SATURDAY = 6

-- ユニットLuaワークの共通キー定義
UNIT_VALUE_AI_SAVE_DATA = 'AiSaveData'
UNIT_VALUE_RANK_INFO = 'RankInfo'
UNIT_VALUE_COLLISION_TO_GROUP_LIST = 'CollisionToGroupList'
UNIT_VALUE_COLLISION_GROUP_INFO = 'CollisionGroupInfo'
UNIT_VALUE_FORCE_UNIT_ROLE = 'ForceUnitRole'
UNIT_VALUE_OPTION_CHANGE = 'optionChange'
UNIT_VALUE_COND_MOVE_DETECTION = 'MoveDetection'
UNIT_VALUE_SUDDEN_DEATH_HP = 'process10401'
UNIT_VALUE_PROCESS_INFO = 'processInfo'
UNIT_VALUE_PROCESS_INFO_EVER = 'processInfoEver'
UNIT_VALUE_FIELD_PROCESS_INFO = 'fieldProcessInfo'
UNIT_VALUE_FIELD_PROCESS_INFO_EVER = 'fieldProcessInfoEver'
UNIT_VALUE_PROCESS_COND_INFO = 'processCondInfo'
UNIT_VALUE_PROCESS_COND_INFO_EVER = 'processCondInfoEver'
UNIT_VALUE_PROCESS_EVENT_INFO = 'processEventInfo'
UNIT_VALUE_GENERAL_INFO = 'generalInfo'
UNIT_VALUE_GENERAL_INFO_EVER = 'generalInfoEver'
UNIT_VALUE_GENERAL_COUNT = 'generalCount'
UNIT_VALUE_GENERAL_COUNT_SLOT_INFO = 'generalCountSlotInfo'
UNIT_VALUE_GENERAL_COUNT_EVER = 'generalCountEver'
UNIT_VALUE_GENERAL_COUNT_SLOT_INFO_EVER = 'generalCountSlotInfoEver'
UNIT_VALUE_GENERAL_COUNT_CUT_IN = 'generalCountCutIn'
UNIT_VALUE_ORNAMENT_INFO = 'ornamentInfo'
UNIT_VALUE_LACERATION_INFO = 'lacerationInfo'
UNIT_VALUE_SKILL_GROUP_LIMIT_INFO = 'skillGroupLimitInfo'
UNIT_VALUE_SKILL_GROUP_LIMIT_INFO_EVER = 'skillGroupLimitInfoEver'
UNIT_VALUE_SUPPORT_PASSIVE_INFO = 'supportPassiveInfo'
UNIT_VALUE_SCORE_EFFECT_COOL_TIME = 'scoreEffectCoolTime'
UNIT_VALUE_SKILL_INFO = 'skillInfo'
UNIT_VALUE_SKILL_INFO_EVER = 'skillInfoEver'
UNIT_VALUE_BULLET_INFO = 'bulletInfo'
UNIT_VALUE_SERIES_INFO = 'seriesInfo'
UNIT_VALUE_SERIES_INFO_EVER = 'seriesInfoEver'
UNIT_VALUE_PROCESS_PAIRING_BUFFS = 'processPairingBuffs'
UNIT_VALUE_PROCESS_TARGET = 'processTarget'
UNIT_VALUE_ELEMENT_SPIRIT_INFO = 'elemSpiritInfo'
UNIT_VALUE_PROCESS_1020613 = 'process1020613'
UNIT_VALUE_PROCESS_1030011_1 = 'process1030011_1'
UNIT_VALUE_PROCESS_1030011_2 = 'process1030011_2'
UNIT_VALUE_PROCESS_1030011_3 = 'process1030011_3'
UNIT_VALUE_PROCESS_1030021 = 'process1030021'
UNIT_VALUE_CRAZY_FLAME = 'process1081600'
UNIT_VALUE_STAND_ON_STAGE = 'process1081602'
UNIT_VALUE_GRAND_WORM_INHALE = 'process81600'
UNIT_VALUE_TL_GENERAL_FLAG = 'process1081615'
UNIT_VALUE_UNIT_DRIFT_SLOT = 'process82001'
UNIT_VALUE_STEAL_LOG = 'stealLog'
UNIT_VALUE_MONOMANE_STACK = 'maneStack'
UNIT_VALUE_MONOMANE_DONE = 'maneDone'
UNIT_VALUE_ALWAYS_BEHIND_ATTACK = 'alwaysBehindAttack'
UNIT_VALUE_MODE_EXPLODE = 'ModeExplode'
UNIT_VALUE_PROCESS_1050360_LIST = 'process1050360'
UNIT_VALUE_PROCESS_1050477_LIST = 'process1050477'
UNIT_VALUE_PROCESS_1050471_LIST = 'process1050471'
UNIT_VALUE_PROCESS_1050701_LIST = 'process1050701'
UNIT_VALUE_PROCESS_2050451_LIST = 'process2050451'
UNIT_VALUE_BUFF_50425_LIST = 'buff50425'
UNIT_VALUE_BUFF_1000014_LIST = 'buff1000014'
UNIT_VALUE_RAND_BETWEEN_PLIST = 'RandBetween'
UNIT_VALUE_DISABLE_SKILL_LIST = 'DisableSkill'
UNIT_VALUE_WAVE_DISABLE_SKILL_LIST = 'DisableSkill_Wave'
UNIT_VALUE_SKILL_COMBO_ENDURE = 'process1020604'
UNIT_VALUE_SPIRIT_OVER_DRIVE_CONTROL = 'SpiritOverDriveControl'
UNIT_VALUE_AI_GENERAL_INFO_TABLE = 'ai_general_info'
UNIT_VALUE_AI_DAMAGE_COUNT = 'damage_count'
UNIT_VALUE_AI_FIRST_WAIT = 'first_wait'
UNIT_VALUE_AI_SKILL_RATE = 'skill_rate'
UNIT_VALUE_AI_SKILL_ROLE_DETAIL_CHANGE = 'skill_role_detail_change'
UNIT_VALUE_ADD_SCALE = 'add_scale'
UNIT_VALUE_LAVANA_CHARGE = 'lavana_charge'
UNIT_VALUE_LAVANA_PHASE = 'lavana_phase'
UNIT_VALUE_LAVANA_SP = 'lavana_sp'
UNIT_VALUE_PROCESS_FLAG = 'process_flag'

-- フィールド共通Luaワークのキー定義
FIELD_VALUE_ANIMA_CONTROL_INFO = 'animaControlInfo'
FIELD_VALUE_SUPPORT_PASSIVE_INFO = 'supportPassiveInfo'

-- 裂傷情報のキー定義
LACERATION_INFO_ATK_DEC_BONUS = {UNIT_VALUE_LACERATION_INFO, 'ATK', 'decLacBonus'}
LACERATION_INFO_ATK_DEC_BONUS_VAL = {UNIT_VALUE_LACERATION_INFO, 'ATK', 'decLacBonus', 1}
LACERATION_INFO_ATK_DEC_BONUS_PER = {UNIT_VALUE_LACERATION_INFO, 'ATK', 'decLacBonus', 2}
LACERATION_INFO_ATK_DEC_BONUS_ADD = {UNIT_VALUE_LACERATION_INFO, 'ATK', 'decLacBonus', 3}
LACERATION_INFO_ATK_PER = {UNIT_VALUE_LACERATION_INFO, 'ATK', 'lacDamagePer'}
LACERATION_INFO_ATK_LIMIT = {UNIT_VALUE_LACERATION_INFO, 'ATK', 'lacDamageLimit'}
LACERATION_INFO_DEF_BEFORE_SKILL = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'beforeSkill'}
LACERATION_INFO_DEF_BEFORE_VALUE = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'beforeValue'}
LACERATION_INFO_DEF_DEC_BONUS = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'decLacBonus'}
LACERATION_INFO_DEF_DEC_BONUS_VAL = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'decLacBonus', 1}
LACERATION_INFO_DEF_DEC_BONUS_PER = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'decLacBonus', 2}
LACERATION_INFO_DEF_DEC_BONUS_ADD = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'decLacBonus', 3}
LACERATION_INFO_DEF_MAX = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'maxLac'}
LACERATION_INFO_DEF_MAX_VAL = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'maxLac', 1}
LACERATION_INFO_DEF_MAX_PER = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'maxLac', 2}
LACERATION_INFO_DEF_MAX_ADD = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'maxLac', 3}
LACERATION_INFO_DEF_NOW = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'nowLac'}
LACERATION_INFO_DEF_ACT_COUNT = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'actCount'}
LACERATION_INFO_DEF_TOTAL_PER = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'lacDamageTotalPer'}
LACERATION_INFO_DEF_TOTAL_PER_DETAIL = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'lacDamageTotalPerDetail'}
LACERATION_INFO_DEF_TOTAL_LIMIT = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'lacDamageTotalLimit'}
LACERATION_INFO_DEF_TOTAL_LIMIT_DETAIL = {UNIT_VALUE_LACERATION_INFO, 'DEF', 'lacDamageTotalLimitDetail'}

-- 裂傷耐性デフォルト値
LACERATION_DEFAULT_DURABILITY = 14000
LACERATION_DEFAULT_DURABILITY_BONUS = 6

-- 裂傷削りデフォルト値
LACERATION_ATK_DEFAULT_SKILL = {
[SKILL_SKILL] = 250,
[SKILL_MAGIC] = 375,
}
setmetatable(LACERATION_ATK_DEFAULT_SKILL,{__index = function() return 0 end})

-- 裂傷効果デフォルト値
LACERATION_DEFAULT_PER = 1500
LACERATION_DEFAULT_LIMIT = 29990001

-- 常時背面攻撃タイプ
ALWAYS_BEHIND_ATTACK_PHYSICAL = 'Physical'

-- 装備シリーズ情報
EQUIP_SERIES_INFO_COUNT = 1
EQUIP_SERIES_INFO_AFFILIATION = 2
EQUIP_SERIES_INFO_LOCALID = 3

-- エレメントイーター情報
ELEMENT_SPIRIT_INFO_LV = 'LV'
ELEMENT_SPIRIT_INFO_EXP = 'EXP'

-- ユニットを取得する条件
UNIT_COND_NONE = 1
UNIT_COND_NEAR = 2
UNIT_COND_FAR = 3
UNIT_COND_HP_PER_OVER = 4
UNIT_COND_HP_PER_UNDER = 5
UNIT_COND_HP_OVER = 6
UNIT_COND_HP_UNDER = 7
UNIT_COND_STR_OVER = 8
UNIT_COND_STR_UNDER = 9
UNIT_COND_DEF_OVER = 10
UNIT_COND_DEF_UNDER = 11
UNIT_COND_INT_OVER = 12
UNIT_COND_INT_UNDER = 13
UNIT_COND_MND_OVER = 14
UNIT_COND_MND_UNDER = 15
UNIT_COND_AIMED_NONE = 16
UNIT_COND_AIMED_FEW = 17
UNIT_COND_AIMED_MANY = 18
UNIT_COND_CHARA_TYPE = 19
UNIT_COND_MP_PER_OVER = 20
UNIT_COND_MP_PER_UNDER = 21
UNIT_COND_MP_OVER = 22
UNIT_COND_MP_UNDER = 23
UNIT_COND_GENDER = 24
UNIT_COND_CHARA_CATEGORY = 25
UNIT_COND_MAXHP_OVER = 26
UNIT_COND_MAXHP_UNDER = 27
UNIT_COND_MAXMP_OVER = 28
UNIT_COND_MAXMP_UNDER = 29
UNIT_COND_PURE_HP_OVER = 30
UNIT_COND_PURE_HP_UNDER = 31
UNIT_COND_PURE_MAXHP_OVER = 32
UNIT_COND_PURE_MAXHP_UNDER = 33
UNIT_COND_PURE_MP_OVER = 34
UNIT_COND_PURE_MP_UNDER = 35
UNIT_COND_PURE_MAXMP_OVER = 36
UNIT_COND_PURE_MAXMP_UNDER = 37
UNIT_COND_PURE_STR_OVER = 38
UNIT_COND_PURE_STR_UNDER = 39
UNIT_COND_PURE_DEF_OVER = 40
UNIT_COND_PURE_DEF_UNDER = 41
UNIT_COND_PURE_INT_OVER = 42
UNIT_COND_PURE_INT_UNDER = 43
UNIT_COND_PURE_MND_OVER = 44
UNIT_COND_PURE_MND_UNDER = 45

-- ユニットを取得する追加条件(1000+)
UNIT_COND_NOT_ME = 1000

-- 演算モード
CALCULATE_ADD = 1
CALCULATE_SUB = 2
CALCULATE_MULT = 3
CALCULATE_DIV = 4
CALCULATE_REJ = 5
CALCULATE_OVR = 6
CALCULATE_MIN = 7
CALCULATE_MAX = 8
CALCULATE_RANDOM = 9
CALCULATE_ORMORE = 10
CALCULATE_ORLESS = 11
CALCULATE_OVER = 12
CALCULATE_UNDER = 13
CALCULATE_EQUAL = 14
CALCULATE_MOD = 15

-- C#側の演算モードに変換
CALCULATE_CS = {
[0] = 0,
[CALCULATE_ADD] = 1,
[CALCULATE_SUB] = 2,
[CALCULATE_MULT] = 3,
[CALCULATE_DIV] = 5,
[CALCULATE_OVR] = 0,
[CALCULATE_MIN] = 15,
[CALCULATE_MAX] = 16,
[CALCULATE_MOD] = 8
}

-- C#側の比較モード
CS_COMPARE_NONE = 0
CS_COMPARE_DIRECT = 1
CS_COMPARE_PARAM = 2

-- 比較モード
COMPARE_ARG2_SWITCH = -1
COMPARE_EQUAL = 1
COMPARE_OVER = 2
COMPARE_UNDER = 3
COMPARE_ORMORE = 4
COMPARE_ORLESS = 5
COMPARE_ARRAY_EQUAL = 6
COMPARE_NOT_EQUAL = 7

-- プロセス側の比較モード指定から変換
PROC_COMPARE_MODE = {
[-1] = COMPARE_ARG2_SWITCH,
[0] = COMPARE_UNDER,
[1] = COMPARE_ORMORE,
[2] = COMPARE_EQUAL,
[3] = COMPARE_ORLESS,
[4] = COMPARE_OVER,
}

-- プロセス側の閾値判定モード指定から変換
PROC_COMPARE_MODE_STRIDE = {
[0] = {COMPARE_ORLESS, COMPARE_UNDER},
[1] = {COMPARE_ORMORE, COMPARE_OVER},
}

-- UnitControl
UNIT_CTL_AI_START = 1000
UNIT_CTL_AI_END = 1001
UNIT_CTL_AI_COND = 1002
UNIT_CTL_AI_ACT = 1003
UNIT_CTL_AI_CLR_FLG = 1010
UNIT_CTL_AI_SET_FLG = 1011

-- 初回パースでエラーが出るので回避用
unitInfos = {}

----------------------------------------------------------------------------------
-- 									汎用関数									--
----------------------------------------------------------------------------------
-- 四捨五入
function round(val)
  --valを四捨五入する
  return math.floor(val + 0.5)
end

-- 単純抽選
function lottery(rate)
  return math.random(Pct100)<=rate and true or false
end

-- 線形補正後の係数算出
function calcCoe(_cnt, _min, _max)
  if _min ~= _max then
    return math.max(math.min((_cnt - _min) / (_max - _min), 1), 0)
  else
    return (_cnt==_min and 1 or 0)
  end
end

-- 数値型チェック
function isNumber(_arg)
	return type(_arg)==ARG_TYPE_NUM and true or false
end

-- 文字列型チェック
function isString(_arg)
	return type(_arg)==ARG_TYPE_STR and true or false
end

-- bool型チェック
function isBoolean(_arg)
	return type(_arg)==ARG_TYPE_BOOL and true or false
end

-- bool値に変換
function toBoolean(_arg)
	return _arg and true or false
end

-- 関数型チェック
function isFunction(_arg)
	return type(_arg)==ARG_TYPE_FUNC and true or false
end

-- クラスorテーブル型チェック
function isTableOrClass(_arg, _type)
	_type = _type or ARG_TYPE_TABLE
	if type(_arg)==ARG_TYPE_TABLE then
		if _type==ARG_TYPE_TABLE then
			return true
		elseif _type==_arg.type then
			return true
		end
	end
	return false
end

-- 配列またはテーブルのコピー
-- コピーする深さを指定可能
function copyTable(_array, _depth)
local t = {}
	_depth = _depth or 1
	-- テーブルの配列部を保全するため、先にipairsを回す
	for i,j in ipairs(_array) do
		if _depth > 1 and isTableOrClass(j) then
			t[i] = copyTable(j, _depth - 1)
		else
			t[i] = j
		end
	end
	for i,j in pairs(_array) do
		if t[i] == nil then
			if _depth > 1 and isTableOrClass(j) then
				t[i] = copyTable(j, _depth - 1)
			else
				t[i] = j
			end
		end
	end
	return t
end

-- 対象のテーブルから値を取得する
-- ネストしたテーブルの深い場所から値を取得する場合に
-- nilアクセスチェックが面倒なのでこれを使用する
function tableGetValue(_tbl, _keys)
local t = _tbl
	if not isTableOrClass(_keys) then _keys = {_keys} end
	for i,k in ipairs(_keys) do
		if not isTableOrClass(t) then return nil end
		t = t[k]
	end
	return t
end

-- 対象のテーブルに値を設定する
-- ネストしたテーブルの深い場所に値を設定する場合に
-- nilアクセスチェックが面倒なのでこれを使用する
function tableSetValue(_tbl, _keys, _val)
	if not isTableOrClass(_tbl) then _tbl = {} end
	if not isTableOrClass(_keys) then _keys = {_keys} end
	local k
	local t = _tbl
	for i = 1,#_keys - 1 do
		k = _keys[i]
		if not isTableOrClass(t[k]) then t[k] = {} end
		t = t[k]
	end
	t[_keys[#_keys]] = _val
	return _tbl
end

-- 対象のテーブルを配列化する
-- 配列部の保全は特に考慮しない
function tableToArray(_tbl)
local t = {}
	for i,v in pairs(_tbl) do table.insert(t, v) end
	return t
end

-- 対象のテーブルのキーの配列を得る
function tableKeys(_tbl)
local t = {}
	for i,v in pairs(_tbl) do
		table.insert(t, i)
	end
	return t
end

-- 対象のテーブルのキーと要素を入れ替える
-- _cont を指定した場合は元々のキーは破棄され、テーブルの全ての要素が _cont となる
function tableFlip(_tbl, _cont)
local t = {}
	for i,v in pairs(_tbl) do
		t[v] = (_cont==nil and i or _cont)
	end
	return t
end

-- 対象のテーブルの要素を検索し、最初に見つかったキーを返す
function tableFind(_tbl, _val)
	for i,v in pairs(_tbl) do
		if v == _val then return i end
	end
end

-- 演算用の関数を定義
-- 例外的に、第二引数だけnil(省略含む)の場合はTrueを返すので注意
calculate = {}
calculate[CALCULATE_ADD] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 return _arg1 + _arg2 end
calculate[CALCULATE_SUB] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 return _arg1 - _arg2 end
calculate[CALCULATE_MULT] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 return _arg1 * _arg2 end
calculate[CALCULATE_DIV] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 if _arg2 == 0 then return 0 end return math.floor(_arg1 / _arg2) end
calculate[CALCULATE_REJ] = function(_arg1, _arg2) return _arg1 end
calculate[CALCULATE_OVR] = function(_arg1, _arg2) return _arg2 end
calculate[CALCULATE_MIN] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 return math.min(_arg1, _arg2) end
calculate[CALCULATE_MAX] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 return math.max(_arg1, _arg2) end
calculate[CALCULATE_RANDOM] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 return math.random(math.min(_arg1, _arg2), math.max(_arg1, _arg2)) end
calculate[CALCULATE_ORMORE] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 return (_arg1 <= _arg2 and _arg2 or 0) end
calculate[CALCULATE_ORLESS] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 return (_arg1 >= _arg2 and _arg2 or 0) end
calculate[CALCULATE_OVER] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 return (_arg1 < _arg2 and _arg2 or 0) end
calculate[CALCULATE_UNDER] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 return (_arg1 > _arg2 and _arg2 or 0) end
calculate[CALCULATE_EQUAL] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 return (_arg1 == _arg2 and _arg2 or 0) end
calculate[CALCULATE_MOD] = function(_arg1, _arg2) _arg1, _arg2 = _arg1 or 0, _arg2 or 0 if _arg2 == 0 then return 0 end return math.floor(_arg1 % _arg2) end
setmetatable(calculate, {__call = function(_table, _calcType, _arg1, _arg2) if isFunction(_table[_calcType]) then return _table[_calcType](_arg1, _arg2) else log:write(LOG_LEVEL_WARNING, 'CalculateType Not Exist : CalcType=>', _calcType, ' Arg1=>', _arg1, ' Arg2=>', _arg2) return _arg1 end end})

-- C#側で長期記憶を演算する際、Luaの演算方法を使用する
-- @param _val 演算値
-- @param _csfx C#側演算用関数
-- @param _param C#側演算用関数に渡すパラメータ配列
-- @param _calcIndex C#側演算用関数で演算タイプを指定するためのパラメータINDEX
-- @param _valIndex C#側演算用関数で演算値を指定するためのパラメータINDEX
-- @param _beforefx 演算元値を得るための関数(演算元値の直値を渡すこともできる)
-- @param _bparam 演算元値を得るための関数に渡すパラメータ配列
calculateCS = {}
calculateCS[CALCULATE_ADD] = function(_val, _csfx, _param, _calcIndex, _valIndex) _param[_calcIndex] = CALCULATE_CS[CALCULATE_ADD] _param[_valIndex] = _val return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_SUB] = function(_val, _csfx, _param, _calcIndex, _valIndex) _param[_calcIndex] = CALCULATE_CS[CALCULATE_SUB] _param[_valIndex] = _val return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_MULT] = function(_val, _csfx, _param, _calcIndex, _valIndex) _param[_calcIndex] = CALCULATE_CS[CALCULATE_MULT] _param[_valIndex] = _val return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_DIV] = function(_val, _csfx, _param, _calcIndex, _valIndex) _param[_calcIndex] = CALCULATE_CS[CALCULATE_DIV] _param[_valIndex] = _val return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_REJ] = function(_val, _csfx, _param, _calcIndex, _valIndex, _beforefx, _bparam) if isFunction(_beforefx) then return _beforefx(table.unpack(_bparam)) else return _beforefx end end
calculateCS[CALCULATE_OVR] = function(_val, _csfx, _param, _calcIndex, _valIndex) _param[_calcIndex] = 0 _param[_valIndex] = _val return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_MIN] = function(_val, _csfx, _param, _calcIndex, _valIndex) _param[_calcIndex] = CALCULATE_CS[CALCULATE_MIN] _param[_valIndex] = _val return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_MAX] = function(_val, _csfx, _param, _calcIndex, _valIndex) _param[_calcIndex] = CALCULATE_CS[CALCULATE_MAX] _param[_valIndex] = _val return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_RANDOM] = function(_val, _csfx, _param, _calcIndex, _valIndex, _beforefx, _bparam) local bval _param[_calcIndex] = 0 if isFunction(_beforefx) then bval = _beforefx(table.unpack(_bparam)) or 0 else bval = _beforefx or 0 end _param[_valIndex] = math.random(math.min(bval, _param[_valIndex]), math.max(bval, _param[_valIndex])) return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_ORMORE] = function(_val, _csfx, _param, _calcIndex, _valIndex, _beforefx, _bparam) local bval _param[_calcIndex] = 0 if isFunction(_beforefx) then bval = _beforefx(table.unpack(_bparam)) or 0 else bval = _beforefx or 0 end if bval > _param[_valIndex] then _param[_valIndex] = 0 end return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_ORLESS] = function(_val, _csfx, _param, _calcIndex, _valIndex, _beforefx, _bparam) local bval _param[_calcIndex] = 0 if isFunction(_beforefx) then bval = _beforefx(table.unpack(_bparam)) or 0 else bval = _beforefx or 0 end if bval < _param[_valIndex] then _param[_valIndex] = 0 end return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_OVER] = function(_val, _csfx, _param, _calcIndex, _valIndex, _beforefx, _bparam) local bval _param[_calcIndex] = 0 if isFunction(_beforefx) then bval = _beforefx(table.unpack(_bparam)) or 0 else bval = _beforefx or 0 end if bval >= _param[_valIndex] then _param[_valIndex] = 0 end return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_UNDER] = function(_val, _csfx, _param, _calcIndex, _valIndex, _beforefx, _bparam) local bval _param[_calcIndex] = 0 if isFunction(_beforefx) then bval = _beforefx(table.unpack(_bparam)) or 0 else bval = _beforefx or 0 end if bval <= _param[_valIndex] then _param[_valIndex] = 0 end return _csfx(table.unpack(_param)) end
calculateCS[CALCULATE_EQUAL] = function(_val, _csfx, _param, _calcIndex, _valIndex, _beforefx, _bparam) local bval _param[_calcIndex] = 0 if isFunction(_beforefx) then bval = _beforefx(table.unpack(_bparam)) or 0 else bval = _beforefx or 0 end if bval ~= _param[_valIndex] then _param[_valIndex] = 0 return _csfx(table.unpack(_param)) else return bval end end
calculateCS[CALCULATE_MOD] = function(_val, _csfx, _param, _calcIndex, _valIndex) _param[_calcIndex] = CALCULATE_CS[CALCULATE_MOD] _param[_valIndex] = _val return _csfx(table.unpack(_param)) end
calculateCS[0] = calculateCS[CALCULATE_OVR]
setmetatable(calculateCS, {__call = function(_table, _calcType, _val, _csfx, _param, _calcIndex, _valIndex, _beforefx, _bparam) if isFunction(_table[_calcType]) then return _table[_calcType](_val, _csfx, _param, _calcIndex, _valIndex, _beforefx, _bparam) else log:write(LOG_LEVEL_WARNING, 'CalculateType(CS) Not Exist : CalcType=>', _calcType, ' Val=>', _val) return _arg1 end end})

-- 比較用の関数を定義
-- 例外的に、第二引数だけnil(省略含む)の場合はTrueを返すので注意
compare = {}
compare[COMPARE_ARG2_SWITCH] = function(_arg1, _arg2) if _arg1~=nil and _arg2~=nil then if _arg2>=0 then return _arg1>=_arg2 else return _arg1<-_arg2 end elseif _arg1~=nil then return true else return false end end
compare[COMPARE_EQUAL] = function(_arg1, _arg2) if _arg1~=nil and _arg2~=nil then return _arg1==_arg2 elseif _arg1~=nil then return true else return false end end
compare[COMPARE_NOT_EQUAL] = function(_arg1, _arg2) if _arg1~=nil and _arg2~=nil then return _arg1~=_arg2 elseif _arg1~=nil then return true else return false end end
compare[COMPARE_OVER] = function(_arg1, _arg2) if _arg1~=nil and _arg2~=nil then return _arg1>_arg2 elseif _arg1~=nil then return true else return false end end
compare[COMPARE_UNDER] = function(_arg1, _arg2) if _arg1~=nil and _arg2~=nil then return _arg1<_arg2 elseif _arg1~=nil then return true else return false end end
compare[COMPARE_ORMORE] = function(_arg1, _arg2) if _arg1~=nil and _arg2~=nil then return _arg1>=_arg2 elseif _arg1~=nil then return true else return false end end
compare[COMPARE_ORLESS] = function(_arg1, _arg2) if _arg1~=nil and _arg2~=nil then return _arg1<=_arg2 elseif _arg1~=nil then return true else return false end end
compare[COMPARE_ARRAY_EQUAL] = function(_arg1, _arg2) if _arg1~=nil and _arg2~=nil then if isTableOrClass(_arg1) then for i,j in ipairs(_arg1) do if j==_arg2 then return true end end return false else return _arg1==_arg2 end elseif _arg1~=nil then return true else return false end end

-- 比較・抽出関数の作成
-- 仕様上、「以上」と「より大きい」、「以下」と「未満」は同じ動作になる
function newCompare(_func)
local i
local t={}
	return function(_arg)
	local val,mode,param
		val, mode, param = _func(_arg)
		param = param or i
		if param~=nil and val~=nil and val==param then table.insert(t, _arg) elseif compare[mode](val, param) then t={_arg} i=val end
		return t, i
	end
end

-- より汎用的な比較・抽出関数の作成
-- モードだけ先に決めておき、抽出要素と比較する値を別々に渡せるように改良(モードも都度変更可能)
-- 仕様上、「以上」と「より大きい」、「以下」と「未満」は同じ動作になる
function newCompare2(_mode)
local i
local t={}
	return function(_arg, _val, _oMode, _prm)
	local val, mode, param
		val = _val or _arg
		if _oMode ~= nil and _mode ~= _oMode then _mode = _oMode end
		mode = _mode or COMPARE_OVER
		param = _prm
		param = param or i
		if param~=nil and val~=nil and val==param then table.insert(t, _arg) elseif compare[mode](val, param) then t={_arg} i=val end
		return t, i
	end
end

-- フィルタ関数の作成
function newFilter(_func, _param)
local t={}
	return function(_arg)
	local val,mode, param
		val, mode, param = _func(_arg)
		param = param or _param
		if compare[mode](val, param) then table.insert(t, _arg) end
		return t
	end
end

-- 単純比較用の関数を定義
function luaCompare(_mode, _arg1, _arg2)
	if _arg1==nil or _arg2==nil then
		return false
	else
		return compare[_mode](_arg1, _arg2)
	end
end

-- プロセス内での比較用の関数を定義
-- こちらはどちらかにnilが含まれていると必ずfalseを返す
-- arg3(before_arg1)にint値が指定された場合は閾値跨ぎ判定モードとなる
-- 単純比較時のみ、arg1やarg2に配列を指定すると複数要素の比較が可能
-- この場合、arg3にbool値を指定することでandとorを切り替え可能(Falseかnilでand、Trueでor)
function procCompare(_mode, _arg1, _arg2, _arg3)
local b, flg1, flg2
	if _arg1==nil or _arg2==nil then
		return false
	elseif isNumber(_arg3) then
		return compare[PROC_COMPARE_MODE_STRIDE[_mode][1]](_arg1, _arg2) and compare[PROC_COMPARE_MODE_STRIDE[_mode][2]](_arg2, _arg3)
	elseif not (isTableOrClass(_arg1) or isTableOrClass(_arg2)) then
		return compare[PROC_COMPARE_MODE[_mode]](_arg1, _arg2)
	else
		flg1, flg2 = false, true
		if not isTableOrClass(_arg1) then _arg1 = {_arg1} end
		if not isTableOrClass(_arg2) then _arg2 = {_arg2} end
		for i,j in pairs(_arg1) do
			for k,l in pairs(_arg2) do
				b = compare[PROC_COMPARE_MODE[_mode]](j, l)
				flg1, flg2 = flg1 or b, flg2 and b
			end
		end
		return (_arg3 and flg1 or flg2)
	end
end

-- 配列を指定したインデックスまで拡張する
-- 拡張した要素は_initValの値で初期化される
function arrayInit(_table, _index, _initVal)
local n = #_table
	if n < _index then
		for i = n, _index do
			table.insert(_table, _initVal)
		end
	end
	log:write(LOG_LEVEL_INFO, 'arrayInit : ', log:format(_table))
	return _table
end

-- 配列の中身を外部関数の戻り値に従って削除し、再インデックスする
-- fnKeep(_table, _key, _expectedKey)の戻り値がFalseとなる要素を削除する
-- table.remove() の代替
function arrayRemove(_table, fnKeep)
local j, n = 1, #_table
	for i = 1, n do
		if (fnKeep(_table, i, j)) then
			if (i ~= j) then
				_table[j] = _table[i]
				_table[i] = nil
			end
			j = j + 1
		else
			_table[i] = nil
		end
	end
	log:write(LOG_LEVEL_INFO, 'arrayRemove : ', log:format(_table))
	return _table
end

-- 配列の中身をランダムな順番に入れ替える
-- 配列でないテーブルも配列化されて返されるので注意
function arrayRandomize(_table)
local tbl, tbl2 = {}, {}
	for i,j in pairs(_table) do
		table.insert(tbl, {math.random(), i})
	end
	table.sort(tbl, function(a, b) return (a[1] < b[1]) end)
	for i,j in ipairs(tbl) do
		table.insert(tbl2, _table[j[2]])
	end
	return tbl2
end

-- 特定ビットの値をbool値で取得する
function bitToBoolean(_val, _bit)
	if not isNumber(_val) then return false end
	return (_val&(2^(_bit-1)))>>(_bit-1)==1
end

-- 特定ビットの値を数値で取得する
function bitToInt(_val, _bit, _length)
	if not (isNumber(_val) and isNumber(_bit) and isNumber(_length)) then return 0 end
	return (_val>>(_bit-_length))&(2^(_length)-1)
end

-- 各ビットの値をbool値にした配列を返す
function bitBooleanList(_val, _offset)
local tbl = {}
	if not isNumber(_offset) then _offset = 0 end
	for i = 1,64 do
		if 2^(i-1) > _val then log:write(LOG_LEVEL_INFO, 'bitBooleanList : ', log:format(tbl)) return tbl end
		tbl[i-_offset] = bitToBoolean(_val, i)
	end
end

-- 各ビットの値をbool値にした配列を値に変換する
function bitBooleanListToVal(_tbl, _offset)
local val = 0
	if not isNumber(_offset) then _offset = 0 end
	for i,j in pairs(_tbl) do
		if isNumber(i) then
			val = val + (2^(i-1+_offset) * (j and 1 or 0))
		end
	end
	log:write(LOG_LEVEL_INFO, 'bitBooleanListToVal : ', val)
	return val
end

-- 指定ビット毎に分割した値をキーとした辞書を返す
-- _cont は辞書の中身を指定する 省略可能で省略した場合はTrueが入る
function bitSplitDic(_val, _bit, _cont)
local tbl = {}
	for i = 1,64,_bit do
		if 2^(i-1) > _val then log:write(LOG_LEVEL_INFO, 'bitSplitDic : ', log:format(tbl)) return tbl end
		tbl[bitToInt(_val, i + _bit - 1, _bit)] = (_cont==nil and true or _cont)
	end
	return tbl
end

-- 下位から指定ビット毎に分割した数値の配列を返す
function bitSplitArray(_val, _bit, _ubound)
local j = 0
local tbl = {}
local ub = _ubound or 64
	for i = 1,64,_bit do
		if 2^(i-1) > _val or ub < j then
			if _ubound ~= nil and _ubound > j then
				for k = j,_ubound do
					table.insert(tbl, 0)
				end
			end
			log:write(LOG_LEVEL_INFO, 'bitSplitArray : ', log:format(tbl)) return tbl
		end
		table.insert(tbl, bitToInt(_val, i + _bit - 1, _bit))
		j = j + 1
	end
	return tbl
end

-- 前処理フック関数
function preHook(fName, hFunc, env)
if not env then env = _G end
local _f = env[fName]

	env[fName] = function(...)
		return _f(hFunc(...))
	end
end

-- 後処理フック関数
function postHook(fName, hFunc, env)
if not env then env = _G end
local _f = env[fName]

	env[fName] = function(...)
		return hFunc(_f(...))
	end
end

TSTTT = {}
TSTTT[UNIT_ALLY] = {}
TSTTT[UNIT_ALLY][TARGET_SIDE_ALLY] = TARGET_TYPE_ALLY
TSTTT[UNIT_ALLY][TARGET_SIDE_OPPONENT] = TARGET_TYPE_OPPONENT
TSTTT[UNIT_ALLY][TARGET_SIDE_ME] = TARGET_TYPE_ME
TSTTT[UNIT_ALLY][TARGET_SIDE_ALL] = TARGET_TYPE_ALL
TSTTT[UNIT_OPPONENT] = {}
TSTTT[UNIT_OPPONENT][TARGET_SIDE_ALLY] = TARGET_TYPE_OPPONENT
TSTTT[UNIT_OPPONENT][TARGET_SIDE_OPPONENT] = TARGET_TYPE_ALLY
TSTTT[UNIT_OPPONENT][TARGET_SIDE_ME] = TARGET_TYPE_ME
TSTTT[UNIT_OPPONENT][TARGET_SIDE_ALL] = TARGET_TYPE_ALL
-- TARGET_SIDE_XXXをTARGET_TYPE_XXXに変換
function targetSideToTargetType(_uSide, _tSide)
	return TSTTT[_uSide][_tSide]
end

-- ユニットタイプをユニットカテゴリに変換
function unitTypeToCategory(_type)
	return (_type // 1000)
end

-- ユニットタイプ配列を32bitINTに変換
function unitTypeArrayToInt32(_table)
local bit
local res = 0
	for i,ct in pairs(_table) do
		bit = ((ct // 1000) - 1) * 16 + (ct % 1000)
		if bit <= 32 and not bitToBoolean(res, bit) then
			res = res + (1 << (bit - 1))
		end
	end
	return res
end

-- 32bitINTをユニットタイプ配列に変換
function int32ToUnitTypeArray(_int)
local res = {}
	if _int == CHARA_TYPE_THIS then 
		res = this:Type()
	elseif bitToBoolean(_int, 10) then
		res = {_int}
	else
		for i=1,32 do
			if bitToBoolean(_int, i) then
				res[#res + 1] = (((i // 16) + 1) * 1000) + (i % 16)
			end
		end
	end
	return res
end

-- スキルタイプ配列を32bitINTに変換
-- 単純なbitBooleanListToValだが、エイリアスとして
function skillTypeArrayToInt32(_table)
	return bitBooleanListToVal(_table, 4)
end

-- ユニットの静的な情報を得る
function GetUnitInfo(t)
	if not t then
		error('GetUnitInfo t is nil!')
		return nil
	end
	local info = unitInfos[t]
	if not info then
		info = {}
		info.name = UnitGetName(t)
		info.side = UnitGetSide(t)
		info.oppSide = UnitGetSide(t, true)
		unitInfos[t] = info
	end
	return info
end

----------------------------------------------------------------------------------
-- 								C#関数のラッパー								--
-- 			C#側に変更があっても、ここの修正だけで吸収できるようにする			--
----------------------------------------------------------------------------------

-- 名前の衝突を避けるためにテーブルに入れる
c = {}

-- 各種マスタの情報を返す
function c.GetMasterInfo(masterType, id, paramNo, subId) return GetMasterInfo(masterType, id, paramNo or 0, subId or 0) end

-- ユーザーに関する情報を返す
function c.GetUserInfo(userInfoID, id1, id2) return GetUserInfo(userInfoID, id1, id2 or id1) end

-- 操作ユニットの識別子を返す
function c.GetOperationUnit() return UnitGetOperationUnit() end

-- ダミーユニットの識別子を返す
function c.GetDummyUnit() return GetDummyUnitID(UNIT_ALLY) end

-- ダミーユニットかどうかを返す
function c.IsDummyUnit(t) return IsDummyUnit(t) end

-- 有効なユニットかどうかを返す
function c.IsValidUnit(t)
	if GlobalValidUnits then
		local v1 = GlobalValidUnits[t]
-- 		local v2 = IsValidUnit(t)
		if not v1 then v1 = false end
-- 		if v1 ~= v2 then
-- 			error('c.IsValidUnit 不整合 t=', t, ' v1=', v1, ' v2=', v2)
-- 			return v2
-- 		end
		return v1
	else
-- 		error('c.IsValidUnit 未設定 t=', t)
		return IsValidUnit(t)
	end
end

-- ユニットの名前を返す
function c.GetUnitName(t)
	if GlobalUnitNames then
		local v1 = GlobalUnitNames[t] or 'nil'
-- 		local v2 = UnitGetName(t)
-- 		if v1 ~= v2 then
-- 			error('c.GetUnitName 不整合 t=', t, ' v1=', v1, ' v2=', v2)
-- 			return v2
-- 		end
		return v1
	else
-- 		error('c.GetUnitName 未設定 t=', t)
		return UnitGetName(t)
	end
end

-- ユニットの名前を変更する
function c.SetUnitName(t, _name) return UnitSetName(t, _name) end

-- ユニットが生存しているかを返す
function c.IsAliveUnit(t) return UnitIsAlive(t) end

-- ユニットの(AI用の)状態を返す
function c.GetUnitState(t, _subUnitId) return UnitGetState(t, _subUnitId or 0) end

-- ユニットが現在カウンター攻撃中かを返す
function c.UnitHaveCounter(t) return UnitHaveCounter(t) end

-- ユニットのインデックスを返す
function c.GetUnitIndex(t) return UnitGetIndex(t)+1 end

-- ユニットIDまたはモンスターIDを返す
function c.GetUnitUnitID(t, isMonster) return UnitGetUnitID(t, isMonster) end

-- モンスターIDを返す
-- @return
-- 　MonsterId
-- 　MonsterDictId
function c.GetUnitMonsterID(t) return UnitGetMonsterID(t) end

-- キャラクターIDを返す
function c.GetUnitCharacterID(t) return UnitGetCharacterID(t) end

-- 指定したキャラクターIDのドットを読み込む
function c.LoadCharacter(characterID) return UnitPrepareCharacter(characterID) end

-- キャラクターIDとドットを変更する
function c.ChangeCharacter(t, characterID) UnitChangeCharacter(t, characterID) end

-- ユニットのレベルを返す
function c.GetUnitLevel(t) return UnitGetLevel(t) end

-- ユニットのレベルを変更する
function c.SetUnitLevel(t, val) return UnitSetProperty(t, UNIT_PROPERTY_LEVEL, val) end

-- ユニットの限界突破LVを返す
function c.GetUnitLimitBreakLv(t) return UnitGetProperty(t, UNIT_PROPERTY_LIMITBREAK_LV) end

-- ユニットの覚醒LVを返す
function c.GetUnitAwakeLv(t) return UnitGetProperty(t, UNIT_PROPERTY_AWAKE_LV) end

-- ユニットの個性LVとIDを返す
-- 注：第2引数は個性indexではなくLv1時点のパッシブID
function c.GetUnitPersonalityLv(t, _passiveId) return UnitGetProperty(t, UNIT_PROPERTY_PERSONALITY_LV, _passiveId) end

-- ユニットのタイプを配列で返す
-- @return {CHARA_TYPE_XXX}
function c.GetUnitCharType(t) local res = UnitGetCharType(t) if not isTableOrClass(res) then res = {res} end return res end

-- ユニットの性別を返す
-- @return GENDER_XXX
function c.GetUnitGender(t) return UnitGetGender(t) end

-- ユニットの装備武器種を返す
-- 未装備なら0
function c.GetUnitWeaponType(t) return UnitGetWeaponType(t) or 0 end

-- ユニットの武器枠に装備された装備種を返す
-- 未装備なら0
function c.GetUnitWeaponType2(t) return UnitGetEquipType(t, EQUIP_POS_WEAPON) or 0 end

-- ユニットの1つ目の装備武器属性を返す
-- 未装備なら0
function c.GetUnitWeaponElem(t) return UnitGetEquipElem(t, EQUIP_POS_WEAPON) or 0 end

-- ユニットの2つ目の装備武器属性を返す(防具の場合は0)
-- 未装備なら0
function c.GetUnitSubWeaponElem(t) return UnitGetEquipElem(t, EQUIP_POS_ARMOR) or 0 end

-- ユニットの装備防具種を返す
-- 未装備なら0
function c.GetUnitArmorType(t) return UnitGetArmorType(t) or 0 end

-- ユニットの防具枠に装備された装備種を返す(武器の可能性もある)
-- 未装備なら0
function c.GetUnitArmorType2(t) return UnitGetEquipType(t, EQUIP_POS_ARMOR) or 0 end

-- ユニットの装備アクセサリ属性を返す
-- @return array
function c.GetUnitAccessoryElem(t) local res = UnitGetAccessoryElem(t) if res == nil then return {} else return res end end

-- ユニットの装備IDを返す
function c.GetUnitEquipID(t, equipPos) return UnitGetEquipID(t, equipPos) end

-- ユニットのステータスを返す
-- ※プロセス側はワークが参照可能なので、別途プロセスライブラリ側で定義を上書きしている
-- TODO:定義の上書きは事故の元なのでなんとかしたい
function c.GetUnitStatus(t, _statType) return UnitGetValue(t, _statType, true) end

-- ユニットのバフ前のステータスを返す
function c.GetUnitPureStatus(t, _statType) return UnitGetValue(t, _statType, true, false) end

-- ユニットの超必殺ゲージ(エーテル)の状態を返す
function c.GetUnitEther(t) return UnitGetSp(t) end

-- ユニットの詠唱速度下限指定値を返す
function c.GetUnitCastMinClamp(t) return UnitGetProperty(t, UNIT_PROPERTY_CAST_MIN_CLAMP) end

-- ユニットの魔法陣展開状態を返す
function c.GetUnitCastLevel(t) return UnitGetCastLevel(t) end

-- モンスターの気絶・ブレイク時間のマスタ設定値を返す
function c.GetUnitBreakTime(t) return UnitGetBreakTime(t) end

-- ユニットの属性耐性を返す
-- @return
-- 　ELEMENT_XXXをキーとしたテーブル
-- 　-999(999%増加) ～ 50(50%低減) ～ 100(無効)
-- 空テーブルが返ってくることがあるため、Lua側でもテーブルの初期化を行う(AW_QA-15375)
function c.GetUnitElemResists(t, _isFinal) res = UnitGetElemResists(t, _isFinal==nil or _isFinal, false, false) if not isTableOrClass(res) or res[1] == nil then return {[1]=0, [2]=0, [3]=0, [4]=0, [5]=0, [6]=0} end return res end

-- ユニットの状態異常耐性を返す
-- @return
-- 　AILMENT_XXXをキーとしたテーブル
-- 　-50（弱点）～ 50（半減） ～ 100（無効）
-- 空テーブルが返ってくることがあるため、Lua側でもテーブルの初期化を行う(AW_QA-15375)
function c.GetUnitStatResists(t, _isFinal, _isUnitPure) res = UnitGetStatResists(t, _isFinal==nil or _isFinal, toBoolean(_isUnitPure)) if not isTableOrClass(res) or res[1] == nil then return {[1]=0, [2]=0, [3]=0, [4]=0, [5]=0, [6]=0, [10]=0, [11]=0, [12]=0, [13]=0, [20]=0} end return res end

-- ユニットのスケールを返す
-- @return x,y,z
function c.GetUnitScale(t, scaleType) return UnitGetScale(t, scaleType) end

-- ユニットのスケールを設定する
function c.SetUnitScale(t, x, y, z, scaleType) return UnitSetScale(t, x, y, z, scaleType) end

-- ユニットの不透明度を返す
-- @return 不透明度(0.0=透明、1.0=不透明)
function c.GetUnitOpacity(t) return UnitGetOpacity(t) end

-- ユニットの不透明度を設定する
function c.SetUnitOpacity(t, opacity) return UnitSetOpacity(t, opacity) end

-- ユニットの床の高さを返す
function c.GetUnitGroundY(t) return UnitGetProperty(t, UNIT_PROPERTY_GROUND_HEIGHT) * 1000 end

-- ユニットの床の高さを設定する
function c.SetUnitGroundY(t, height) return UnitSetProperty(t, UNIT_PROPERTY_GROUND_HEIGHT, height) end

-- ユニット毎の経過時間を返す
function c.GetUnitActiveTime(t) return UnitGetProperty(t, UNIT_PROPERTY_ACTIVE_TIME) end

-- ユニットがリモートで処理されているかどうかを返す
function c.UnitIsRemote(t) return UnitGetProperty(t, UNIT_PROPERTY_IS_REMOTE) end

-- ユニットのターゲットが固定化されているなら、対象の識別子を返す(固定されていない時は0)
function c.UnitFixedTarget(t) return UnitGetProperty(t, UNIT_PROPERTY_FIXED_TARGET) end

-- ユニットの半径(Radius設定)を返す
function c.GetUnitRadius(t) return UnitGetRadius(t) end

-- ユニットの向いている方向を返す
-- @return DIR_XXX
function c.GetUnitDir(t) return UnitGetDir(t) end

-- ユニットの絶対位置を返す
-- @return x, y, z
function c.GetUnitPos(t) return UnitGetPos(t) end

-- 指定した2体のユニットの位置関係を距離と角度で返す
-- @return
-- 　距離(mm), t1を中心とした角度(-179～180)
-- 　角度は 0:画面奥側 90:右側面 180:手前 -90:左側面
function c.UnitCalcPos(t1, t2) return UnitCalcPos(t1, t2) end

-- 指定した2体のユニットの位置関係を相対座標で返す
-- @return x, z
function c.UnitPosVector(t1, t2) return UnitPosVector(t1, t2) end

-- フィールド上の絶対座標xzから半径radiusの範囲内の、sideに含まれるユニットのID配列を返す
-- @return Array
function c.FindUnitInCircle(x,z,radius,side) return UnitFindInCircle(x,z,radius,side) end

-- 現在のWAVEを返す
function c.GetWaveCount() return GetWaveCount() end

-- 現在のクエストの最大WAVE数を返す
function c.GetMaxWave() return NumWaves() end

-- 現在の背景の地形タイプを返す
function c.GetBgTerrain() return GetBgTerrainType() end

-- 現在の地形効果タイプとIDを返す
-- @return
-- 　TERRAIN_XXX
-- 　TerrainId
function c.GetTerrain() return GetTerrain() end

-- ユニットが現在かかっている状態異常を返す
-- @return
-- 　AILMENT_XXXをキーとしたbool値のテーブル
function c.GetUnitBadStatus(t) return UnitGetBadStatus(t) end

-- ユニットに現在かかっているバフを返す
-- @return 掛かっているバフ情報の配列(table)
-- 　table = {
-- 　uid ... バフUID
-- 　subj ... バフ発動者識別子
-- 　owner ... バフオーナー識別子
-- 　buffId ... バフID
-- 　name ... バフ名称
-- 　description ... バフ説明文
-- 　condition ... 条件ID
-- 　condParam ... 条件パラメータ（配列）
-- 　method ... 操作方法
-- 　ope ... 操作タイプ
-- 　source ... 参照元
-- 　target ... 対象
-- 　param ... バフパラメータ（配列）
-- 　script ... スクリプト使用(bool)
-- 　buffType ... バフタイプ
-- 　category ... バフカテゴリ
-- 　group ... バフグループ
-- 　iconId ... バフアイコンID
-- 　remain ... バフの残りフレーム数（UnitGetBuffs, UnitGetDebuffsのみ）}
function c.GetUnitBuffs(t) return UnitGetBuffs(t) end

-- ユニットに現在かかっているデバフを返す
-- @return 掛かっているデバフ情報の配列(c.GetUnitBuffsと同等)
function c.GetUnitDebuffs(t) return UnitGetDebuffs(t) end

-- 指定したUIDのバフの情報を返す
-- @return バフ情報の配列(c.GetUnitBuffsと同等)/無効なUIDの場合はnil
function c.GetBuffInfo(buffUID) return GetBuffInfo(buffUID) end

-- ユニットの気絶・ブレイク時間の残り時間を返す
function c.GetUnitBreakRemain(t) return UnitGetBreakRemain(t) end

-- ユニットのWave開始からの気絶・ブレイク回数を返す
function c.GetUnitBreakCount(t) return UnitGetBreakCount(t) end

-- ユニットの被コンボ数を返す
function c.GetUnitCombo(t) return UnitGetComboCount(t) end

-- ユニットの現在のWAVEの被ダメージ内訳を返す
-- @return table1 in table2
-- 　table1 key=ユニット識別子 item=table2
-- 　table2 key=ダメージ属性 item=ダメージ数
function c.GetUnitDamageInfo(t) return UnitGetDamageInfo(t) end

-- ユニットの現在のWAVEの被ダメージ回数内訳を返す
-- @return table1 in table2
-- 　table1 key=ユニット識別子 item=table2
-- 　table2 key=ダメージ属性 item=ダメージHIT数
function c.GetUnitDamageHitInfo(t) return UnitGetDamageInfo(t, 1) end

-- ユニットの行動成功回数を返す
function c.GetUnitSkillUseCount(t) return UnitGetSkillUsed(t) end

-- ユニットの現在のWAVEの行動履歴を返す
-- @return 直近10件の行動履歴情報が入った配列(table)
-- 　table = {
-- 　[SKILL_HISTORY_TYPE(1)]		：スキルタイプ(SKILL_XXX)
-- 　[SKILL_HISTORY_INDEX(2)]		：スキルインデックス
-- 　[SKILL_HISTORY_SLOT_INDEX(3)]	：スキルスロットインデックス
-- 　[SKILL_HISTORY_TARGET(4)]		：スキルターゲットユニット識別子
-- 　[SKILL_HISTORY_TIME(5)]		：WAVE開始からの経過時間(秒)		}
function c.GetUnitActionHistory(t, skillType) return UnitGetActionHistory(t, skillType or 0) end

-- ユニットLuaワークに値を保持する
function c.UnitSetLuaValue(_t, _key, _val, _ever) return UnitSetLuaValue(_t, _key, _val, _ever or false) end

-- ユニットLuaワークの数値を演算し保持する
-- nilは0として扱われる
function c.UnitCalcLuaValue(_t, _key, _val, _calc, _ever) _calc = _calc or 0 if _calc == 0 then UnitSetLuaValue(_t, _key, _val, _ever or false) else return UnitSetProperty(_t, UNIT_PROPERTY_CALC_LUA_VALUE, _key, _calc, _val, _ever or false) end end

-- ユニットLuaワークの値を取得する
function c.UnitGetLuaValue(_t, _key) return UnitGetLuaValue(_t, _key) end

-- ユニットLuaプロセスワークに値を保持する
function c.UnitSetProcValue(_t, _affiliation, _localId, _procIndex, _key, _val, _ever) return UnitSetProperty(_t, UNIT_PROPERTY_PROC_VALUE, _affiliation, _localId, _procIndex, _key, _val, _ever or false) end

-- ユニットLuaプロセスワークの値を取得する
function c.UnitGetProcValue(_t, _affiliation, _localId, _procIndex, _key) return UnitGetProperty(_t, UNIT_PROPERTY_PROC_VALUE, _affiliation, _localId, _procIndex, _key) end

-- 特定のアクターのボスフラグを編集する
function c.ChangeBossFlag(_t, _isBoss) UnitChangeBossFlag(_t, _isBoss) end

-- ボスゲージのオーナーを特定のアクターに変更する
function c.ChangeBossGaugeOwner(_t) UnitChangeBossGaugeOwner(_t, true) end

-- ボスゲージを非表示にする
function c.HideBossGauge(_t) UnitChangeBossGaugeOwner(_t, false) end

-- ユニットを戦闘から一時的に除外する
function c.SetUnitExclude(_t, _isExclude, _frame) UnitSetExclude(_t, _isExclude, _frame) end

-- ユニットが戦闘から一時除外されているかを返す
function c.UnitIsExcluded(_t) return UnitIsExcluded(_t) end

-- ユニットが戦闘から退場させられているかを返す
function c.UnitIsExiled(_t) return UnitIsExiled(_t) end

-- ユニットのターゲットマーカーを永続的に非表示/非表示解除する
function c.ShowTargetMarker(_t, _show) UnitShowTargetMarker(_t, _show) end

-- ユニットにセットされているパッシブスキルを配列で返す
function c.GetUnitPassiveList(t, affiliation) return UnitGetPassiveList(t, affiliation) end

-- スキルのプリロード
function c.PreloadSkill(skillID) PreloadSkill(skillID) end

-- ユニットの発動中スキルを返す
-- @return
-- 　skillSlot
-- 　skillType
-- 　skillIndex
-- 　target uid
function c.GetUnitActiveSkill(t) return UnitGetActiveSkill(t) end

-- ユニットの発動中スキルのPUIDを返す
function c.GetUnitActiveSkillPUID(t) return UnitGetProperty(t, UNIT_PROPERTY_ACTIVE_SKILL_PUID) end

-- ユニットが指定したUIDのバフを所持しているかを返す
function c.UnitIsBuffByUID(t, buffUID) return UnitGetProperty(t, UNIT_PROPERTY_IS_BUFF_BY_UID, buffUID) end

-- ユニットが指定したIDのバフを所持している場合、最初に見つかったUIDを返す(所持していない場合は0)
-- _isList = true の場合はすべてのバフのUIDのリストを返す
function c.GetUnitBuffUID(t, buffID, _isList) return UnitGetProperty(t, UNIT_PROPERTY_GET_BUFF_UID_BY_ID, buffID, _isList and 1 or 0) end

-- ユニットの指定スキルの稼働状況を返す
-- @return
-- 　{
-- 　	puid = スキルPUID
-- 　	elapsed = 発動からの経過時間(フレーム)
-- 　}
function c.GetUnitSkillPlayInfo(t, skillType, skillIndex) return UnitGetSkillPlayInfo(t, skillType, skillIndex) end

-- 指定したpuidのスキルの稼働状況を返す
function c.IsSkillActive(puid) return IsSkillActive(puid, false) end

-- ユニットの指定したスキルタイプであるスキルの所持数を返す
function c.GetUnitSkillNum(t, skillType) if skillType== SKILL_ATTACK then return 1 else return UnitNumSkills(t, skillType) end end

-- ユニットのスキルスロット情報を返す
function c.GetUnitSkillSlots(t) return UnitGetSkillSlots(t) end

-- 指定スキルのIDを返す
function c.GetUnitSkillID(t, skillType, skillIndex) return UnitGetSkillID(t, skillType, skillIndex) end

-- 指定スキルの名前を返す
function c.GetSkillName(t, skillType, skillIndex) return UnitGetSkillName(t, skillType, skillIndex) end

-- 指定スキルの種別を返す
function c.GetSkillKind(t, skillType, skillIndex) return UnitGetSkillKind(t, skillType, skillIndex) end

-- 指定スキルの特技INDEXを返す
function c.GetUnitSkillIndex(t, skillType, skillIndex) return UnitGetSkillIndex(t, skillType, skillIndex) end

-- 指定スキルの現在のコスト状況を返す
function c.GetSkillCharge(t, skillType, skillIndex) return UnitGetSkillCharge(t, skillType, skillIndex) end

-- 指定スキルの消費コストを返す
-- 特技はクールタイム制になったので、恐らく魔法にしか使わない
function c.GetSkillCost(t, skillType, skillIndex) return UnitGetSkillCost(t, skillType, skillIndex) end

-- 指定スキルの属性を返す
-- @return
-- 　ELEMENT_XXX
function c.GetSkillElement(t, skillType, skillIndex) return UnitGetSkillElement(t, skillType, skillIndex) end

-- 指定スキルの対象情報を返す
-- @return
-- 　SKILL_TARGET_XXX
function c.GetSkillTarget(t, skillType, skillIndex) return UnitGetSkillTarget(t, skillType, skillIndex) end

-- 指定スキルの対象規模を返す
-- @return
-- 　SKILL_SCALE_XXX
function c.GetSkillScale(t, skillType, skillIndex) return UnitGetSkillTargetType(t, skillType, skillIndex) end

-- 指定スキルのロールを返す
-- @return SKILL_ROLE_XXX
function c.GetSkillRole(t, skillType, skillIndex) return UnitGetSkillType(t, skillType, skillIndex) end

-- 指定スキルのロール詳細を返す
-- @return SKILL_ROLE_DETAIL_XXX
function c.GetSkillRoleDetail(t, skillType, skillIndex) return UnitGetSkillRoleDetail(t, skillType, skillIndex) end

-- 指定スキルのレベルを返す
function c.GetSkillLevel(t, skillType, skillIndex) return UnitGetSkillLevel(t, skillType, skillIndex) end

-- 指定スキルの絶対レベル(魔法陣LV)を返す
function c.GetSkillCastLevel(t, skillType, skillIndex) return GetSkillAbsLevel(t, skillType, skillIndex) end

-- 指定スキルのキラー情報を返す
-- @return
-- 　type	1
-- 　value	CHARA_TYPE_XXX
function c.GetUnitSkillKiller(t, skillType, skillIndex) return UnitGetSkillKiller(t, skillType, skillIndex) end

-- 指定した特技の残り使用可能回数を返す
function c.GetSkillAvail(t, skillIndex)
	if c.GetSkillCost(t, SKILL_SKILL, skillIndex) <= 0 then
	-- 過渡期のため、コスト0の特技に対応
		return 9
	else
		return UnitGetSkillAvail(t, skillIndex)
	end
end

-- 指定した特技の最大使用可能回数を返す
function c.GetSkillMaxAvail(t, skillIndex) return UnitGetSkillMaxAvail(t, skillIndex) end

-- 指定スキルのプロセス付加情報の配列数を返す
function c.GetSkillProcInfoCount(t, skillType, skillIndex) return UnitControl(t, 511, skillType, skillIndex, 100) end

-- 指定スキルのプロセス付加情報を返す
function c.GetSkillProcInfo(t, skillType, skillIndex, infoIndex)
local res = UnitControl(t, 511, skillType, skillIndex, 101, infoIndex)
	if res[2] ~= nil then
		return res
	else
		return 0, {}
	end
end

-- 指定スキルの指定配列タイプのプロセス付加情報を返す
function c.FindSkillProcInfo(t, skillType, skillIndex, infoKey)
local res = UnitControl(t, 511, skillType, skillIndex, 102, infoKey)
	if res ~= nil then
		return res
	else
		return {}
	end
end

-- 条件を満たす全てのユニットのID配列を返す
-- TARGET_COND_ALLのみLua側で実装
-- @param side TARGET_SIDE_XXX
-- @param cond TARGET_COND_XXX
-- @return Array
function c.GetUnitList(side, cond)
local t
	if cond == TARGET_COND_ALL then
		t = UnitGetList(side, TARGET_COND_BOTH)
		for i,u in pairs(UnitGetList(side, TARGET_COND_SECEDE)) do
			table.insert(t, u)
		end
		return t
	else
		return UnitGetList(side, cond)
	end
end

-- 狙われやすさのウェイトの合計を返す
-- @param tlist 識別子の配列
function c.GetTotalHate(tlist) return UnitTotalSelectWeight(tlist) end

-- ユニットの狙われやすさのウェイトを返す
function c.GetUnitHate(t) return UnitGetSelectWeight(t) end

-- 狙われやすさを考慮してターゲットを抽選する
-- @param tlist 識別子の配列
function c.SelectTarget(tlist) return UnitSelectTarget(tlist) end

-- ユニットがターゲットされている数を返す
function c.GetUnitAimedCount(t) return UnitGetAimedCount(t) end

-- 指定ユニットをターゲットしている敵ユニットを配列で返す
function c.GetUnitAimedList(t) return UnitGetAimedList(t) end

-- アクターがユニットかモンスターかを返す
function c.GetUnitSide(t, opposit)
	if GlobalUnitSides then
		local v1
-- 		local v2 = UnitGetSide(t, opposit or false)
		if opposit then
			v1 = GlobalUnitOppSides[t] or -1
		else
			v1 = GlobalUnitSides[t] or -1
		end
-- 		if v1 ~= v2 then
-- 			error('c.GetUnitSide 不整合 t=', t, ' v1=', v1, ' v2=', v2)
-- 			return v2
-- 		end
		return v1
	else
-- 		error('c.GetUnitSide 未設定 t=', t)
		return UnitGetSide(t, opposit or false)
	end
end

-- モンスターがボスかどうかを返す
function c.GetUnitBossFlg(t) return UnitGetBossFlg(t) end

-- 自ユニットから最も近いユニットを返す
function c.GetNearestUnit(side) return GetNearestUnit(side) end

-- 自ユニットからいい感じに近いユニットを返す
function c.GetNearestUnitForFirst(side) return GetNearestUnitForFirst(side) end

-- ユニットの位置からx,z分オフセットした位置がエリア内か判定する
-- @return (bool)x, (bool)z
function c.IsInsideArea(t,x,z) return InsideArea(t,x,z) end

-- 自ユニットから壁までの距離を返す
-- @return top, left, right, down
function c.GetDistanceWall() return GetDistanceWall() end

-- 指定したスキルタイプのスキルがオプションも含め使用可能かを返す
function c.CanUseSkillType(t,skillType) return UnitCanAction(t,skillType) end

-- 指定したスキルが使用可能か返す
function c.CanUseSkill(t, skillType, skillIndex)
	if skillType == SKILL_ATTACK then
		return true
	elseif skillType == SKILL_SKILL then
		return UnitIsSkillDisabled(t, skillType, skillIndex) == SKILL_USE_CAN
	elseif skillType == SKILL_MAGIC then
		return UnitIsSkillDisabled(t, skillType, skillIndex) == SKILL_USE_CAN
	elseif skillType == SKILL_SPECIAL then
		if c.CanUseSkillType(t, SKILL_SPECIAL) == SKILL_USE_CAN and UnitIsSkillDisabled(t, skillType, skillIndex) == SKILL_USE_CAN then
			if skillIndex == nil then
				return UnitCanUseSpecial(t, 0, true)
			else
				return UnitCanUseSpecial(t, skillIndex - 1, true)
			end
		else
			return false
		end
	end
	return false
end

-- 指定ユニットにスキルを発動させる
-- @param _subj ... 発動者ユニット識別子
-- @param _skillType ... 対象のスキルタイプ
-- @param _skillIndex ... 対象のスキルインデックス
-- @param _skillIndex ... 対象のスキルID(Directのみ)
-- @param _mode ... 動作モード PLAYSKILL_MODE_XXX
-- @param _option ... オプション PLAYSKILL_OPTION_XXX
-- @param _delay ... 遅延フレーム（このフレーム消化後にplayModeの条件で発動）
-- @param _targ ... ターゲットユニット識別子(0で現在のターゲット)
-- @param _move ... 移動タイプ PLAYSKILL_MOVE_XXX
-- @return スキルPUID
-- @return 予約状態 PLAYSKILL_STAT_XXX
function c.PlaySkill(_subj, _skillType, _skillIndex, _mode, _option, _delay, _targ, _move) return UnitPlaySkill(_subj~=0 and _subj or ownUnit, _skillType, _skillIndex, _mode, _option or 0, _delay or 0, _targ or 0, _move or 0) end
function c.PlaySkillDirect(_subj, _skillId, _mode, _option, _delay, _targ, _move) return UnitPlaySkillDirect(_subj~=0 and _subj or ownUnit, _skillId, _mode, _option or 0, _delay or 0, _targ or 0, _move or 0) end

-- 現在のWaveの経過時間および制限時間を返す
-- @return 経過時間(秒), 制限時間(秒、制限がない場合は0)
function c.GetWaveTime() return GetWaveTimer() end

-- 今回のクエスト中に稼いだ合計ゼル数を返す
function c.GetTotalZel() return GetTotalZel() end

-- 現在のアリーナ関連の情報を返す
-- @param ARENA_INFO_ACTRISE_ID
function c.GetArenaInfo(t, arenaInfo) return UnitGetArenaInfo(t, arenaInfo) end

-- 現在のクエストIDを返す
function c.GetQuestID() return GetBattleInfo(5) end

-- 現在のオートバトル状態を返す
-- @return AUTO_BATTLE_XXX
function c.GetAutoBattleInfo() return GetBattleInfo(4) end

-- オプション「一度見たストーリーをスキップ」の設定を返す
function c.GetAdvSkip() return GetBattleInfo(6)==1 end

-- 現在のクエストフェーズに設定されている配置物管理IDを返す
function c.GetOrnamentManageID() return GetBattleInfo(7) end

-- 現在のクエストタイプ(マスタ設定値ではなくクライアント判定値)を返す
function c.GetQuestType() return GetBattleInfo(10) end

-- マルチプレイバトルか
function c.IsMultiPlay() return GetBattleInfo(700) end

-- クエストオプションに設定されている難易度を返す
function c.GetQuestOptionDifficulty() local res = GetBattleInfo(900) if isTableOrClass(res) then return res[1] end end

-- テキストウィンドウが表示され、メッセージ表示中かを返す
function c.IsDrawTextBusy() return GetBattleInfo(1001) end

-- アイテムドロップテーブルの要素数を返す(テーブルがない場合は0)
function c.GetItemDropTableCount() return GetBattleInfo(1002) end

-- ミッションシードの値を返す(値がない場合、nilを返す可能性がある)
function c.GetMissionSeedInfo(_key) return GetBattleInfo(1500, _key) end

-- 指定IDのバトルスコアを返す
function c.GetBattleScore(_scoreId) return BattleControl(100, _scoreId) end

-- 指定IDのバトルスコアを増減する
function c.AddBattleScore(_scoreId, _val) return BattleControl(101, _scoreId, round(_val)) end

-- 指定IDのバトルスコアを設定する
function c.SetBattleScore(_scoreId, _val) return BattleControl(102, _scoreId, round(_val)) end

-- 1秒あたりのバトルスコア減少量を設定する
function c.SetBattleScoreAOT(_scoreId, _val) return BattleControl(103, _scoreId, round(_val)) end

-- HPブレイク回数の合計値を返す
function c.GetHpBreakCount(_t) return BattleControl(150, _t or 0) end

-- 現在のタイマーモードを返す
-- @return 0:無効 1:ダウンタイマー 2:アップタイマー
function c.GetTimerMode() return BattleControl(210) end

-- クエストの制限時間を返す(秒単位、小数あり)
function c.GetLimitTime() return BattleControl(211) end

-- 現在のタイマー値（残り時間／経過時間）を返す
function c.GetTimerValue() return BattleControl(212) end

-- 現在のタイマー値を指定値に変更
function c.SetTimerValue(_sec) return BattleControl(213, _sec) end

-- 現在のタイマー値に指定値を加減算
function c.AddTimerValue(_sec) return BattleControl(214, _sec) end

-- 戦場に領域を作成する
-- @param owner 領域のオーナーアクター識別子
-- @param targets 領域に反応するアクター　TARGET_SIDE_XXXまたは識別子の配列で指定
-- @param listeners トリガが発火するアクター　TARGET_SIDE_XXXまたは識別子の配列で指定
-- @param x,y,z 領域の中心座標 省略した場合はオーナーアクターの座標を使用
-- @param collisionId コリジョンID（コリジョンマスタで定義したもの）
-- @param actionType 領域の挙動タイプ(省略した場合はstayとなる)
-- @param actionParams 挙動タイプ依存のパラメータ（原則int配列）
-- @return 領域識別子
function c.CreateCollision(owner, targets, listeners, x, y, z, collisionId, actionType, actionParams)
	return BattleControl(451, owner:ID(), isTableOrClass(targets) and 4 or targetSideToTargetType(owner:Side(), targets), isTableOrClass(targets) and targets or nil, isTableOrClass(listeners) and 4 or targetSideToTargetType(owner:Side(), listeners), isTableOrClass(listeners) and listeners or nil, x or owner:PosX(), y or owner:PosY(), z or owner:PosZ(), collisionId, actionType or 0, actionParams or {})
end

-- 領域を削除する
-- @param _id 領域識別子
function c.RemoveCollision(_id) return BattleControl(452, _id) end

-- 領域の一覧を取得する
-- @param owner 領域のオーナーアクター識別子 省略した場合は全ての領域の一覧を返す
-- @return 領域識別子の配列
function c.GetCollisionsByOwner(owner) return BattleControl(453, owner) end

-- 指定識別子の領域内に存在する、その領域に反応するアクターの一覧を取得する
-- @param _id 領域識別子
-- @return アクター識別子の配列
function c.GetTargetInCollision(_id) return BattleControl(454, _id) end

-- 指定識別子の領域のオーナーを取得する
-- @param _id 領域識別子
-- @return 領域のオーナーアクター識別子
function c.GetOwnerByCollision(_id) return BattleControl(455, _id) end

-- 指定識別子の領域内に存在するアクターの一覧を取得する
-- @param _id 領域識別子
-- @return アクター識別子の配列
function c.GetInCollision(_id) return BattleControl(456, _id) end

-- 指定識別子の領域が有効かどうかを返す
function c.IsValidCollision(_id) return BattleControl(457, _id) end

-- 対象のスイッチがセットされているかを返す
function c.IsSwitch(_switchID) return BattleControl(620, _switchID) end

-- 対象のUIをロードする
function c.LoadUI(_uiName, _target, _valueType, _value, _buffUID) return UIControl(_uiName, 100, _target, _valueType, _value, _buffUID) end

-- 対象のUIがロードされているかどうかを返す
function c.IsLoadedUI(_uiName) return UIControl(_uiName, 102) end

-- ドロップアイテム演出をキックする
function c.DropItemPopUI(_t, _cnt) return UIControl(UI_NAME_DROP_ITEM, 90300, _t, _cnt) end

-- 端末の現在の日時を返す
-- @return 年(西暦), 月, 日, 時, 分, 秒, 曜日(WEEK_DAY_XXX)
function c.GetDateTime() return GetDateTime() end

-- 指定のUIメッセージIDに対応する文字列を返す
function c.GetUiMsg(uiMsgID) return GetUiMsg(uiMsgID) end

-- バトルスクリプトを呼び出す
-- バトルスクリプト側の処理が完了するまで待つ
function c.CallBattleScript(funcName, ...) return CallQuestFunc(funcName, ...) end

-- バトルスクリプトを非同期に呼び出す
-- バトルスクリプト側の処理を待たずに処理を続行できる
function c.CallBattleScriptAsync(funcName, ...) return InvokeQuestFunc(funcName, ...) end

----------------------------------------------------------------------------------
-- 				各オブジェクトの全メソッドに仕込む基本ログ機能の定義			--
-- 		仕込み先のオブジェクトには、id/name/parent/method/method.parent			--
--						プロパティが存在する必要がある							--
----------------------------------------------------------------------------------
LoggingMethod = function(_table, _key)
	local _self = _table.parent
	if isFunction(_self.super[_key]) then
		return function(_obj, ...)
		local res,params
			res = {_self.super[_key](_obj, ...)}
			if LOG_LEVEL >= LOG_LEVEL_INFO then
				params = _obj==_self and log:format(...) or log:format(_obj, ...)
				log:write(LOG_LEVEL_INFO, _self.type, ' ', _key, ' : Name=>', _self.name, '(', _self.id, ')', params~='' and ' Param=>' .. params or '', ' Return=>', log:format(table.unpack(res)))
			end
			return table.unpack(res)
		end
	elseif _self.super[_key]~=nil then
		return _self.super[_key]
	else
		log:write(LOG_LEVEL_WARNING, _self.type, ' Not Exist : OwnUnit=>', ownUnit, ' Func=>', _key)
		return  nil
	end
end
AddLoggingMethod = function(_table, _key, _value)
	if isFunction(_value) then
		_table.method[_key] = function(_obj, ...)
		local res,params
		local _self = _table
			res = {_value(_obj, ...)}
			if LOG_LEVEL >= LOG_LEVEL_INFO then
				params = _obj==_self and log:format(...) or log:format(_obj, ...)
				log:write(LOG_LEVEL_INFO, _self.type, ' ', _key, ' : Name=>', _self.name, '(', _self.id, ')', params~='' and ' Param=>' .. params or '', ' Return=>', log:format(table.unpack(res)))
			end
			return table.unpack(res)
		end
	else
		rawset(_table, _key, _value)
	end
end
AddLoggingMethodSuper = function(_table, _key, _value) if isFunction(_value) then _table.super[_key] = _value else rawset(_table, _key, _value) end end

----------------------------------------------------------------------------------
-- 								ログ機能の定義									--
--					実際に使用するにはwriteの挙動定義が必要						--
----------------------------------------------------------------------------------
log = {}
log.id = ownUnit
log.name = c.GetUnitName(ownUnit)
-- writeの中身は下位のライブラリで定義
function log:write(_level, ...) end
-- クラス名を取得　全てのオブジェクトにid/nameプロパティがあることが前提
function log:ObjName(class) return class==nil and '(オブジェクトがありません)' or (class.name==nil or class.id==nil) and self:tableFormat(class) or class.name .. '(' .. class.id .. ')' end
-- 可変長引数をそれっぽい文字列に整形する
function log:format(...) local str = '' for i,j in ipairs({...})do if isTableOrClass(j) then j=self:ObjName(j) end str = str .. ' ' .. tostring(j) end return str end
-- テーブルの中身を文字列化
function log:tableFormat(t)
local res = '{'
	if isTableOrClass(t) then
		for i,j in pairs(t) do
			res = res .. (res=='{' and '' or ', ') .. tostring(i) .. '=>'
			if isTableOrClass(j) then res = res .. self:ObjName(j) else res = res .. tostring(j) end
		end
		return res .. '}'
	else
		return tostring(t)
	end
end
-- 名前が変化する可能性が出てきたのでFrameUpdateが必要
function log:FrameUpdate() self.id = ownUnit self.name = c.GetUnitName(ownUnit) end

----------------------------------------------------------------------------------
-- 								スキルの定義									--
--		※1フレーム内で複数回GETしても、C#側の関数が呼ばれるのは1度だけ			--
----------------------------------------------------------------------------------
Skill = {}
function Skill:ParentUnit() return self.parent end
function Skill:Name() return self.name end
function Skill:Type(_comp)
	if _comp == nil then
		return self.skillType
	else
		if _comp == 0 then return true end
		if _comp > SKILL_COUNTER then
			_comp = bitBooleanList(_comp, 4)
			for i,j in pairs(_comp) do
				if j and self:Type(i) then
					return true
				end
			end
			return false
		else
			return ((_comp==self:Type() or (_comp==SKILL_PHYSIC and SKILL_CATEGORY_PHYSIC[self:Type()]) or (_comp==SKILL_COUNTER and self.parent:IsCounter())) and not (_comp~=SKILL_COUNTER and self.parent:IsCounter()))
		end
	end
end
function Skill:Index() return self.skillIndex end
function Skill:ID() if self.cache.ID == nil then self.cache.ID = c.GetUnitSkillID(self.parent:ID(), self.skillType, self.skillIndex) end return self.cache.ID end
function Skill:PUIDs(_comp)
local t,comp
	if _comp == nil then
		if self.cache.PUIDs == nil then
			t = c.GetUnitSkillPlayInfo(self.parent:ID(), self.skillType, self.skillIndex)
			comp = function(arg1, arg2) return arg1.elapsed < arg2.elapsed end
			table.sort(t, comp)
			self.cache.PUIDs = {}
			for i,j in ipairs(t) do
				table.insert(self.cache.PUIDs, j.puid)
			end
		end
		return self.cache.PUIDs
	else
		for i,j in pairs(self:PUIDs()) do
			if _comp == j then return true end
		end
		return false
	end
end
function Skill:Kind() if self.cache.Kind == nil then self.cache.Kind = c.GetSkillKind(self.parent:ID(), self.skillType, self.skillIndex) end return self.cache.Kind end
function Skill:Group(_comp) if _comp == nil then if self.cache.Group == nil then self.cache.GroupH = {} for i,j in pairs(self:ProcInfo(SKILL_PROC_INFO_SKILL_GROUP)) do self.cache.GroupH[j] = true end self.cache.Group = tableKeys(self.cache.GroupH) end return self.cache.Group else return toBoolean(self.cache.GroupH[_comp]) end end
function Skill:IndexUI() if self.cache.IndexUI == nil then self.cache.IndexUI = c.GetUnitSkillIndex(self.parent:ID(), self.skillType, self.skillIndex) end return self.cache.IndexUI end
function Skill:Charge() if self.cache.Charge == nil then self.cache.Charge = c.GetSkillCharge(self.parent:ID(), self.skillType, self.skillIndex) end return self.cache.Charge end
function Skill:Cost() if self.cache.Cost == nil then self.cache.Cost = c.GetSkillCost(self.parent:ID(), self.skillType, self.skillIndex) end return self.cache.Cost end
function Skill:Element(_comp)
	if _comp == nil then
		if self.cache.Element == nil then
			self.cache.Element = c.GetSkillElement(self.parent:ID(), self.skillType, self.skillIndex)
		end
		return self.cache.Element
	else
		if _comp == ELEMENT_UNMENTIONED then return true end
		if _comp == ELEMENT_ALL then return self:Element()~=ELEMENT_NONE end
		return _comp==self:Element()
	end
end
-- プロセス付加情報の「サブ属性」も入れた属性
-- 引数を省略(GET)すると配列を返す
function Skill:Element2(_comp)
	if self.cache.Element2 == nil then
		self.cache.Element2h = {[c.GetSkillElement(self.parent:ID(), self.skillType, self.skillIndex)] = true}
		for i,j in pairs(self:ProcInfo(SKILL_PROC_INFO_SUB_ELEMENT)) do
			self.cache.Element2h[j] = true
		end
		self.cache.Element2 = tableKeys(self.cache.Element2h)
	end
	if _comp == nil then
		return self.cache.Element2
	else
		if _comp == ELEMENT_UNMENTIONED then return true end
		if _comp == ELEMENT_ALL then return self:Element()~=ELEMENT_NONE or #(self:Element2())>=2 end
		return toBoolean(self.cache.Element2h[_comp])
	end
end
function Skill:Target() if self.cache.Target == nil then self.cache.Target = c.GetSkillTarget(self.parent:ID(), self.skillType, self.skillIndex) end return self.cache.Target end
function Skill:Scale() if self.cache.Scale == nil then self.cache.Scale = c.GetSkillScale(self.parent:ID(), self.skillType, self.skillIndex) end return self.cache.Scale end
function Skill:Level() if self.cache.Level == nil then self.cache.Level = c.GetSkillLevel(self.parent:ID(), self.skillType, self.skillIndex) end return self.cache.Level end
function Skill:CastLevel() if self.cache.CastLevel == nil then self.cache.CastLevel = c.GetSkillCastLevel(self.parent:ID(), self.skillType, self.skillIndex) end return self.cache.CastLevel end
function Skill:MultiCast() if self.cache.Mst == nil then self.cache.Mst = Field:GetSkillInfo(self:ID()) end return self.cache.Mst[SKILL_MST_INFO_MULTI_CAST] end
function Skill:Role(_comp)
	if _comp == nil then
		if self.cache.Role == nil then
			self.cache.Role = c.GetSkillRole(self.parent:ID(), self.skillType, self.skillIndex)
		end
		return self.cache.Role
	else
		if _comp == 0 then return true else _comp = bitSplitDic(_comp, 4, true) end
		if isTableOrClass(self:Role()) then
			for i,j in pairs(self:Role()) do
				if _comp[j] then return true end
			end
			return false
		else
			return toBoolean(_comp[self:Role()])
		end
	end
end
function Skill:RoleDtl(_comp)
	if _comp == nil then
		if self.cache.RoleDtl == nil then
			self.cache.RoleDtl = c.GetSkillRoleDetail(self.parent:ID(), self.skillType, self.skillIndex)
		end
		return self.cache.RoleDtl
	else
		if _comp == 0 then return true end
		for i,j in pairs(self:RoleDtlArr()) do
			if _comp == j then return true end
		end
		return false
	end
end
function Skill:RoleDtlArr()
local srd = self:RoleDtl()
	if srd == SKILL_ROLE_DETAIL_REMOVE_ALIMENT_ALL_AND_HEAL_HP then
		return {SKILL_ROLE_DETAIL_REMOVE_ALIMENT_ALL, SKILL_ROLE_DETAIL_HEAL_HP}
	else
		return {srd}
	end
end
function Skill:Stock() if self.cache.Stock == nil then self.cache.Stock = (self.skillType==SKILL_SKILL and c.GetSkillAvail(self.parent:ID(), self.skillIndex) or 0) end return self.cache.Stock end
function Skill:MaxStock() if self.cache.MaxStock == nil then self.cache.MaxStock = (self.skillType==SKILL_SKILL and c.GetSkillMaxAvail(self.parent:ID(), self.skillIndex) or 0) end return self.cache.MaxStock end
function Skill:Available()
	if self.cache.Available == nil then
		if c.CanUseSkill(self.parent:ID(), self.skillType, self.skillIndex) then
			if self.skillType == SKILL_ATTACK then
				self.cache.Available = true
			elseif self.skillType == SKILL_SKILL then
				self.cache.Available = c.GetSkillAvail(self.parent:ID(), self.skillIndex) >= 1 and not self.parent:IsAilment(AILMENT_CURSE) and not self.parent:IsAilment(AILMENT_SEAL) and self.parent:CanUseSkillType(SKILL_SKILL) == SKILL_USE_CAN
			elseif self.skillType == SKILL_MAGIC then
				self.cache.Available = self.parent:MP() >= self:Cost() and not self.parent:IsAilment(AILMENT_SILENCE) and not self.parent:IsAilment(AILMENT_SEAL) and not self.parent:IsAilment(AILMENT_RAGE) and self.parent:CanUseSkillType(SKILL_MAGIC) == SKILL_USE_CAN
			elseif self.skillType == SKILL_SPECIAL then
				self.cache.Available = c.CanUseSkill(self.parent:ID(), SKILL_SPECIAL)
			end
		end
	end
	return self.cache.Available
end
function Skill:ProcInfo(_infoKey)
local cnt
local key, val
	if self.cache.ProcInfo == nil then self.cache.ProcInfo = {} end
	if _infoKey ~= nil then
		if self.cache.ProcInfo[_infoKey] == nil then
			self.cache.ProcInfo[_infoKey] = c.FindSkillProcInfo(self.parent:ID(), self.skillType, self.skillIndex, _infoKey)
		end
		return copyTable(self.cache.ProcInfo[_infoKey])
	else
		if not self.cache.ProcInfoAll then
			cnt = c.GetSkillProcInfoCount(self.parent:ID(), self.skillType, self.skillIndex)
			for i = 1, cnt do
				key, val = c.GetSkillProcInfo(self.parent:ID(), self.skillType, self.skillIndex, i)
				self.cache.ProcInfo[key] = val
			end
			self.cache.ProcInfoAll = true
		end
		return copyTable(self.cache.ProcInfo, 2)
	end
end
function Skill:Play(t, mode, option, delay, move) return c.PlaySkill(self.parent:ID(), self.skillType, self.skillIndex, mode, option, delay, t and t:ID(), move) end
function Skill:FrameUpdate() self.cache = {} end

Skill.GetCache = function(_table, _key) local myKey = _table.parent.cache_key local uCache = _table.parent.parent.cache if uCache[myKey] == nil then return nil end return uCache[myKey][_key] end
Skill.SetCache = function(_table, _key, _value) local myKey = _table.parent.cache_key local uCache = _table.parent.parent.cache if uCache[myKey] == nil then uCache[myKey] = {} end uCache[myKey][_key] = _value end
Skill.new = function(_u, _type, _index)
	local obj = {}
	obj.super = Skill
	obj.type = C_TYPE_SKILL
	obj.parent = _u
	obj.id = tostring(_type) .. '_' .. tostring(_index)
	obj.name = c.GetSkillName(_u:ID(), _type, _index)
	obj.method = {}
	obj.method.parent = obj
	obj.skillType = _type
	obj.skillIndex = _index
	obj.cache = {}
	obj.cache.parent = obj
	obj.cache_key = 'SKL_Cache_' .. obj.id
	setmetatable(obj.method, {__index = LoggingMethod})
	setmetatable(obj.cache, {__index = Skill.GetCache, __newindex = Skill.SetCache})
	setmetatable(obj, {__index = obj.method, __newindex = AddLoggingMethod})
	return obj
end

----------------------------------------------------------------------------------
-- 								ユニットの定義									--
-- 					ステータスGET系の関数はここにまとめる						--
-- 		※1フレーム内で複数回GETしても、C#側の関数が呼ばれるのは1度だけ			--
-- 		FrameUpdate()はUnitListから呼ばれるため、個別に呼ぶ必要はない			--
----------------------------------------------------------------------------------
Unit = {}
function Unit:ID() return self.id end
function Unit:Name() return self.name end
function Unit:SetName(_name) self.name = _name c.SetUnitName(self.id, _name) end
function Unit:Side() return self.side end
function Unit:RelativeSide(_u, _comp) if _comp == nil then return (self.side==_u:Side() and TARGET_SIDE_ALLY or TARGET_SIDE_OPPONENT) else return (_comp==TARGET_SIDE_ALL or (_comp==TARGET_SIDE_ME and self:ID()==_u:ID()) or _comp==self:RelativeSide(_u)) end end
function Unit:IsValid() if self.cache.IsValid == nil then self.cache.IsValid = toBoolean(c.IsValidUnit(self.id)) end return self.cache.IsValid end
function Unit:IsMonster() if self.cache.MonsterId == nil then self.cache.MonsterId, self.cache.MonsterDictId = c.GetUnitMonsterID(self.id) end return self.cache.MonsterId ~= 0 end
function Unit:IsBoss() if self.cache.IsBoss == nil then self.cache.IsBoss = toBoolean(c.GetUnitBossFlg(self.id)) end return self.cache.IsBoss end
function Unit:SetBoss(_isBoss) self.cache.IsBoss = nil c.ChangeBossFlag(self.id, _isBoss) if _isBoss then c.ChangeBossGaugeOwner(self.id) end end
function Unit:SetHpStopperUI(_hpCond, _buffUID) return c.LoadUI('@HpStopper', self.id, 32, _hpCond, _buffUID) end
function Unit:IsDummy() if self.cache.IsDummy == nil then self.cache.IsDummy = c.IsDummyUnit(self.id) end return self.cache.IsDummy end
function Unit:IsRemote() if self.cache.IsRemote == nil then self.cache.IsRemote = c.UnitIsRemote(self.id) end return self.cache.IsRemote end
function Unit:Index() if self.cache.Index == nil then self.cache.Index = c.GetUnitIndex(self.id) end return self.cache.Index end
function Unit:ActriseID() if self.cache.ActriseID == nil then self.cache.ActriseID = c.GetArenaInfo(self.id, ARENA_INFO_ACTRISE_ID) end return self.cache.ActriseID end
function Unit:SetExclude(_isExclude, _frame) self.cache.IsExcluded = nil c.SetUnitExclude(self.id, _isExclude, _frame or -1) end
function Unit:IsExcluded() if self.cache.IsExcluded == nil then self.cache.IsExcluded = (c.UnitIsExcluded(self.id) or c.UnitIsExiled(self.id)) end return self.cache.IsExcluded end
function Unit:CanMove() if self.cache.CanMove == nil then self.cache.CanMove = (this:IsBreak()==false and not this:IsAilment(AILMENT_PARALYSYS) and not this:IsAilment(AILMENT_FREEZE)) end return self.cache.CanMove end
function Unit:ShowMarker(_show)  c.ShowTargetMarker(self.id, _show) end
function Unit:Hate() if self.cache.Hate == nil then self.cache.Hate = c.GetUnitHate(self.id) end return self.cache.Hate end
function Unit:FixedTarget() local u if self.cache.FixedTarget == nil then u = c.UnitFixedTarget(self.id) if u ~= 0 then self.cache.FixedTarget = units:GetUnit(u) end end return self.cache.FixedTarget end
function Unit:Scale(_scaleType)
	if self.cache.Scale == nil then
		self.cache.Scale = {}
	end
	if self.cache.Scale.x == nil then
		self.cache.Scale.x, self.cache.Scale.y, self.cache.Scale.z = c.GetUnitScale(self.id, _scaleType or UNIT_SCALE_TYPE_GROSS)
		self.cache.Scale.x, self.cache.Scale.y, self.cache.Scale.z = self.cache.Scale.x / Per2Num, (self.cache.Scale.y or 1) / Per2Num, (self.cache.Scale.z or 1) / Per2Num
	end
	return self.cache.Scale
end
function Unit:ScaleX(_scaleType) local res = self:Scale(_scaleType) return res.x end
function Unit:ScaleY(_scaleType) local res = self:Scale(_scaleType) return res.y end
function Unit:ScaleZ(_scaleType) local res = self:Scale(_scaleType) return res.z end
function Unit:SetScale(_scaleType, _per) self.cache.Scale = nil c.SetUnitScale(self.id, _per * Per2Num, _per * Per2Num, _per * Per2Num, _scaleType or UNIT_SCALE_TYPE_GROSS) end
function Unit:SetScaleX(_scaleType, _per) c.SetUnitScale(self.id, _per * Per2Num, self:ScaleY() * Per2Num, self:ScaleZ() * Per2Num, _scaleType or UNIT_SCALE_TYPE_GROSS) self.cache.Scale = nil end
function Unit:SetScaleY(_scaleType, _per) c.SetUnitScale(self.id, self:ScaleX() * Per2Num, _per * Per2Num, self:ScaleZ() * Per2Num, _scaleType or UNIT_SCALE_TYPE_GROSS) self.cache.Scale = nil end
function Unit:SetScaleZ(_scaleType, _per) c.SetUnitScale(self.id, self:ScaleX() * Per2Num, self:ScaleY() * Per2Num, _per * Per2Num, _scaleType or UNIT_SCALE_TYPE_GROSS) self.cache.Scale = nil end
function Unit:Opacity() if self.cache.Opacity == nil then self.cache.Opacity = c.GetUnitOpacity(self.id) * Pct100 end return self.cache.Opacity end
function Unit:SetOpacity(_per) self.cache.Opacity = nil c.SetUnitOpacity(self.id, _per * Per2Num) end
function Unit:GroundY() if self.cache.GroundY == nil then self.cache.GroundY = c.GetUnitGroundY(self.id) end return self.cache.GroundY end
function Unit:SetGroundY(_height) self.cache.GroundY = nil c.SetUnitGroundY(self.id, _height) end
function Unit:UnitID(_notDress) if self.cache.UnitID == nil then self.cache.UnitID = c.GetUnitUnitID(self.id, self:IsMonster() or toBoolean(_notDress)) end return self.cache.UnitID end
function Unit:MonsterID() if self.cache.MonsterId == nil then self.cache.MonsterId, self.cache.MonsterDictId = c.GetUnitMonsterID(self.id) end return self.cache.MonsterId end
function Unit:CharaID() if self.cache.CharaID == nil then self.cache.CharaID = c.GetUnitCharacterID(self.id) end return self.cache.CharaID end
function Unit:SetCharaID(_charaID, _noLoad) self.cache.CharaID = nil if not _noLoad then c.LoadCharacter(_charaID) end c.ChangeCharacter(self.id, _charaID) end
function Unit:Alive() if self.cache.Alive == nil then self.cache.Alive = c.IsAliveUnit(self.id) end return self.cache.Alive end
function Unit:Level() if self.cache.Level == nil then self.cache.Level = c.GetUnitLevel(self.id) end return self.cache.Level end
function Unit:PersonalityLevel(_index) if self.cache.PersonalityLevel == nil then self.cache.PersonalityLevel = {} self.cache.PersonalityID = {} end if self.cache.PersonalityLevel[_index] == nil then self.cache.PersonalityLevel[_index], self.cache.PersonalityID[_index] = c.GetUnitPersonalityLv(self.id, Field:GetPersonalSkillId(self:UnitID(), _index)) end return self.cache.PersonalityLevel[_index] end
function Unit:PersonalityID(_index) if self.cache.PersonalityID == nil then self.cache.PersonalityLevel = {} self.cache.PersonalityID = {} end if self.cache.PersonalityID[_index] == nil then self.cache.PersonalityLevel[_index], self.cache.PersonalityID[_index] = c.GetUnitPersonalityLv(self.id, Field:GetPersonalSkillId(self:UnitID(), _index)) end return self.cache.PersonalityID[_index] end
function Unit:LimitBreakLevel() if self.cache.LimitBreakLevel == nil then self.cache.LimitBreakLevel = c.GetUnitLimitBreakLv(self.id) end return self.cache.LimitBreakLevel end
-- キャラタイプID:1010が存在しない前提の判定を行っているため、追加された場合は改修必須
function Unit:Type(_comp) if _comp == nil then if self.cache.Type == nil then self.cache.Type = c.GetUnitCharType(self.id) end return self.cache.Type else if _comp == 0 then return true end if not isTableOrClass(_comp) then _comp = int32ToUnitTypeArray(_comp) end if isTableOrClass(self:Type()) then for i,j in pairs(self:Type()) do for k,l in pairs(_comp) do if l == j then return true end end end return false else return _comp==self:Type() end end end
function Unit:Category(_comp) local tbl = {} if _comp == nil then if self.cache.Category == nil then for i,j in pairs(self:Type()) do tbl[unitTypeToCategory(j)] = 0 end self.cache.Category = {} for i,j in pairs(tbl) do table.insert(self.cache.Category, i) end end return self.cache.Category else if _comp == 0 then return true end if isTableOrClass(self:Category()) then for i,j in pairs(self:Category()) do if _comp == j then return true end end return false else return _comp==self:Category() end end end
function Unit:Gender() if self.cache.Gender == nil then self.cache.Gender = c.GetUnitGender(self.id) end return self.cache.Gender end
function Unit:Group(_comp) if self:IsMonster() then return nil end if _comp == nil then if self.cache.Group == nil then self.cache.Group = Field:GetUnitDressGroupInfo(self:UnitID()) end return self.cache.Group else if _comp == 0 then return true end if isTableOrClass(self:Group()) then for i,j in pairs(self:Group()) do if _comp == j then return true end end return false else return _comp==self:Group() end end end
-- 武器枠未装備なら0だが、防具枠に武器が装備されている場合はそれが返ってきてしまうので、IDを見て回避する
function Unit:WeaponType() if self.cache.WeaponType == nil then if self:EquipID(EQUIP_POS_WEAPON) ~= 0 then self.cache.WeaponType = c.GetUnitWeaponType2(self.id) else self.cache.WeaponType = 0 end end return self.cache.WeaponType end
function Unit:SubWeaponType() if self.cache.SubWeaponType == nil then self.cache.SubWeaponType = (self:ArmorType()==0 and c.GetUnitArmorType2(self.id) or 0) end return self.cache.SubWeaponType end
-- 未装備ならnil
function Unit:WeaponElem(_comp) if _comp == nil then if self.cache.WeaponElem == nil then if self:EquipID(EQUIP_POS_WEAPON) ~= 0 then self.cache.WeaponElem = c.GetUnitWeaponElem(self.id) else self.cache.WeaponElem = false end end return self.cache.WeaponElem or nil else if self:WeaponElem() == nil then return false end if _comp == ELEMENT_UNMENTIONED then return true end if _comp == ELEMENT_ALL then return self:WeaponElem()~=ELEMENT_NONE end if _comp == ELEMENT_SAME_WEAPON then return self:WeaponElem()==self:SubWeaponElem() end return _comp==self:WeaponElem() end end
function Unit:SubWeaponElem(_comp) if _comp == nil then if self.cache.SubWeaponElem == nil then if self:SubWeaponType() ~= 0 then if self:EquipID(EQUIP_POS_WEAPON) ~= 0 then self.cache.SubWeaponElem = c.GetUnitSubWeaponElem(self.id) else self.cache.SubWeaponElem = c.GetUnitWeaponElem(self.id) end else self.cache.SubWeaponElem = false end end return self.cache.SubWeaponElem or nil else if self:SubWeaponElem() == nil then return false end if _comp == ELEMENT_UNMENTIONED then return true end if _comp == ELEMENT_ALL then return self:SubWeaponElem()~=ELEMENT_NONE end if _comp == ELEMENT_SAME_WEAPON then return self:WeaponElem()==self:SubWeaponElem() end return _comp==self:SubWeaponElem() end end
function Unit:ArmorType() if self.cache.ArmorType == nil then self.cache.ArmorType = c.GetUnitArmorType(self.id) end return self.cache.ArmorType end
function Unit:AccessoryElem(_index) if self.cache.AccessoryElem == nil then self.cache.AccessoryElem = c.GetUnitAccessoryElem(self.id) end return self.cache.AccessoryElem[_index] end
function Unit:EquipID(_equipPos) if self.cache.EquipID == nil then self.cache.EquipID = {} end if self.cache.EquipID[_equipPos] == nil then self.cache.EquipID[_equipPos] = c.GetUnitEquipID(self.id, _equipPos) end return self.cache.EquipID[_equipPos] end
function Unit:Status(_statusType) local tbl if _statusType < 256 then if self.cache.Status == nil then self.cache.Status = {} end if self.cache.Status[_statusType] == nil then self.cache.Status[_statusType] = c.GetUnitStatus(self.id, _statusType) end return self.cache.Status[_statusType] else tbl = {} for i,j in pairs(bitSplitArray(_statusType, 8)) do if j > 0 then table.insert(tbl, self:Status(j - 1)) end end return tbl end end
function Unit:HP() if self.cache.HP == nil then self.cache.HP = c.GetUnitStatus(self.id, STATUS_TYPE_HP) end return self.cache.HP end
function Unit:MaxHP() if self.cache.MaxHP == nil then self.cache.MaxHP = c.GetUnitStatus(self.id, STATUS_TYPE_MAX_HP) end return self.cache.MaxHP end
function Unit:PerHP() if self.cache.PerHP == nil then self.cache.PerHP = math.floor(self:HP() / self:MaxHP() * Pct100) end return self.cache.PerHP end
function Unit:MP() if self.cache.MP == nil then self.cache.MP = c.GetUnitStatus(self.id, STATUS_TYPE_MP) end return self.cache.MP end
function Unit:MaxMP() if self.cache.MaxMP == nil then self.cache.MaxMP = c.GetUnitStatus(self.id, STATUS_TYPE_MAX_MP) end return self.cache.MaxMP end
function Unit:PerMP() if self.cache.PerMP == nil then self.cache.PerMP = math.floor(self:MP() / self:MaxMP() * Pct100) end return self.cache.PerMP end
function Unit:VIT() if self.cache.VIT == nil then self.cache.VIT = c.GetUnitStatus(self.id, STATUS_TYPE_VIT) end return self.cache.VIT end
function Unit:MaxVIT() if self.cache.MaxVIT == nil then self.cache.MaxVIT = c.GetUnitStatus(self.id, STATUS_TYPE_MAX_VIT) end return self.cache.MaxVIT end
function Unit:PerVIT() if self.cache.PerVIT == nil then self.cache.PerVIT = math.floor(self:VIT() / self:MaxVIT() * Pct100) end return self.cache.PerVIT end
function Unit:LAC() if self.cache.LAC == nil then self.cache.LAC = self:GetValue(LACERATION_INFO_DEF_NOW) if self.cache.LAC == nil then self:SetValue(LACERATION_INFO_DEF_NOW, LACERATION_DEFAULT_DURABILITY) self.cache.LAC = LACERATION_DEFAULT_DURABILITY end end return self.cache.LAC end
function Unit:MaxLAC() local tbl if self.cache.MaxLAC == nil then tbl = self:GetValue(LACERATION_INFO_DEF_MAX) or {0, 0, 0} self.cache.MaxLAC = (((LACERATION_DEFAULT_DURABILITY + tbl[1]) * (tbl[2] + Pct100) * Per2Num) + tbl[3]) * (LACERATION_DEFAULT_DURABILITY_BONUS ^ (self:GetValue(LACERATION_INFO_DEF_ACT_COUNT) or 0)) end return self.cache.MaxLAC end
function Unit:PerLAC() if self.cache.PerLAC == nil then self.cache.PerLAC = math.floor(self:LAC() / self:MaxLAC() * Pct100) end return self.cache.PerLAC end
function Unit:DecLacAtkBonus() if self.cache.DecLacAtkBonus == nil then self.cache.DecLacAtkBonus = self:GetValue(LACERATION_INFO_ATK_DEC_BONUS) or {0, 0, 0} end return {self.cache.DecLacAtkBonus[1] or 0, self.cache.DecLacAtkBonus[2] or 0, self.cache.DecLacAtkBonus[3] or 0} end
function Unit:DecLacDefBonus() if self.cache.DecLacDefBonus == nil then self.cache.DecLacDefBonus = self:GetValue(LACERATION_INFO_DEF_DEC_BONUS) or {0, 0, 0} end return {self.cache.DecLacDefBonus[1] or 0, self.cache.DecLacDefBonus[2] or 0, self.cache.DecLacDefBonus[3] or 0} end
function Unit:CalcDecLac(_t, _val) local tbl, tbl2 if not (isTableOrClass(_t, C_TYPE_UNIT) or isTableOrClass(_t, C_TYPE_MYUNIT)) then _t = target end tbl, tbl2 = self:DecLacAtkBonus(), _t:DecLacDefBonus() return ((_val + tbl[1] + tbl2[1]) * (tbl[2] + tbl2[2] + Pct100) * Per2Num) + tbl[3] + tbl2[3] end
function Unit:STR() if self.cache.STR == nil then self.cache.STR = c.GetUnitStatus(self.id, STATUS_TYPE_STR) end return self.cache.STR end
function Unit:DEF() if self.cache.DEF == nil then self.cache.DEF = c.GetUnitStatus(self.id, STATUS_TYPE_DEF) end return self.cache.DEF end
function Unit:INT() if self.cache.INT == nil then self.cache.INT = c.GetUnitStatus(self.id, STATUS_TYPE_INT) end return self.cache.INT end
function Unit:MND() if self.cache.MND == nil then self.cache.MND = c.GetUnitStatus(self.id, STATUS_TYPE_MND) end return self.cache.MND end
function Unit:CRT() if self.cache.CRT == nil then self.cache.CRT = c.GetUnitStatus(self.id, STATUS_TYPE_CRT) end return self.cache.CRT end
function Unit:Ether() if self.cache.Ether == nil then self.cache.Ether = c.GetUnitEther(self.id) end return self.cache.Ether end
function Unit:PerEther(_index) _index = _index or 1 if self.cache.PerEther == nil then self.cache.PerEther = {} end if self.cache.PerEther[_index] == nil then  self.cache.PerEther[_index] = math.floor(self:Ether() / self:SKL_Cost(SKILL_SPECIAL, _index) * Pct100) end return self.cache.PerEther[_index] end
function Unit:Speed() if self.cache.Speed == nil then self.cache.Speed = c.GetUnitStatus(self.id, STATUS_TYPE_SPD) end return self.cache.Speed end
function Unit:ElemResist(_elem) if self.cache.ElemResist == nil then self.cache.ElemResist = c.GetUnitElemResists(self.id) end return _elem==nil and self.cache.ElemResist or self.cache.ElemResist[_elem] or 0 end
function Unit:WeakestElem(_toArray) local compareFunc, elem, min_resist if self.cache.WeakestElem == nil then self.cache.WeakestElem = {} compareFunc = newCompare2(COMPARE_ORLESS) elem, min_resist = 0, math.maxinteger for e,n in pairs(self:ElemResist()) do elem, min_resist = compareFunc(e, n) end if not _toArray and #elem > 0 then elem = elem[math.random(1, #elem)] else elem = _toArray and {} or 0 end self.cache.WeakestElem[1], self.cache.WeakestElem[2] = elem, min_resist end return self.cache.WeakestElem[1], self.cache.WeakestElem[2] end
function Unit:StrongestElem(_toArray) local compareFunc, elem, min_resist if self.cache.StrongestElem == nil then self.cache.StrongestElem = {} compareFunc = newCompare2(COMPARE_ORMORE) elem, min_resist = 0, 0 for e,n in pairs(self:ElemResist()) do elem, min_resist = compareFunc(e, n) end if not _toArray and #elem > 0 then elem = elem[math.random(1, #elem)] else elem = _toArray and {} or 0 end self.cache.StrongestElem[1], self.cache.StrongestElem[2] = elem, min_resist end return self.cache.StrongestElem[1], self.cache.StrongestElem[2] end
function Unit:StatResist(_ailment) if self.cache.StatResist == nil then self.cache.StatResist = c.GetUnitStatResists(self.id) end return _ailment==nil and self.cache.StatResist or self.cache.StatResist[_ailment] or 0 end
function Unit:PureStatus(_statusType) local tbl if _statusType < 256 then if self.cache.PureStatus == nil then self.cache.PureStatus = {} end if self.cache.PureStatus[_statusType] == nil then self.cache.PureStatus[_statusType] = c.GetUnitPureStatus(self.id, _statusType) end return self.cache.PureStatus[_statusType] else tbl = {} for i,j in pairs(bitSplitArray(_statusType, 8)) do if j > 0 then table.insert(tbl, self:PureStatus(j - 1)) end end return tbl end end
function Unit:PureHP() if self.cache.PureHP == nil then self.cache.PureHP = c.GetUnitPureStatus(self.id, STATUS_TYPE_HP) end return self.cache.PureHP end
function Unit:PureMaxHP() if self.cache.PureMaxHP == nil then self.cache.PureMaxHP = c.GetUnitPureStatus(self.id, STATUS_TYPE_MAX_HP) end return self.cache.PureMaxHP end
function Unit:PurePerHP() if self.cache.PurePerHP == nil then self.cache.PurePerHP = math.floor(self:PureHP() / self:PureMaxHP() * Pct100) end return self.cache.PurePerHP end
function Unit:PureMP() if self.cache.PureMP == nil then self.cache.PureMP = c.GetUnitPureStatus(self.id, STATUS_TYPE_MP) end return self.cache.PureMP end
function Unit:PureMaxMP() if self.cache.PureMaxMP == nil then self.cache.PureMaxMP = c.GetUnitPureStatus(self.id, STATUS_TYPE_MAX_MP) end return self.cache.PureMaxMP end
function Unit:PurePerMP() if self.cache.PurePerMP == nil then self.cache.PurePerMP = math.floor(self:PureMP() / self:PureMaxMP() * Pct100) end return self.cache.PurePerMP end
function Unit:PureVIT() if self.cache.PureVIT == nil then self.cache.PureVIT = c.GetUnitPureStatus(self.id, STATUS_TYPE_VIT) end return self.cache.PureVIT end
function Unit:PureMaxVIT() if self.cache.PureMaxVIT == nil then self.cache.PureMaxVIT = c.GetUnitPureStatus(self.id, STATUS_TYPE_MAX_VIT) end return self.cache.PureMaxVIT end
function Unit:PurePerVIT() if self.cache.PurePerVIT == nil then self.cache.PurePerVIT = math.floor(self:PureVIT() / self:PureMaxVIT() * Pct100) end return self.cache.PurePerVIT end
function Unit:PureSTR() if self.cache.PureSTR == nil then self.cache.PureSTR = c.GetUnitPureStatus(self.id, STATUS_TYPE_STR) end return self.cache.PureSTR end
function Unit:PureDEF() if self.cache.PureDEF == nil then self.cache.PureDEF = c.GetUnitPureStatus(self.id, STATUS_TYPE_DEF) end return self.cache.PureDEF end
function Unit:PureINT() if self.cache.PureINT == nil then self.cache.PureINT = c.GetUnitPureStatus(self.id, STATUS_TYPE_INT) end return self.cache.PureINT end
function Unit:PureMND() if self.cache.PureMND == nil then self.cache.PureMND = c.GetUnitPureStatus(self.id, STATUS_TYPE_MND) end return self.cache.PureMND end
function Unit:PureCRT() if self.cache.PureCRT == nil then self.cache.PureCRT = c.GetUnitPureStatus(self.id, STATUS_TYPE_CRT) end return self.cache.PureCRT end
function Unit:PureSpeed() if self.cache.PureSpeed == nil then self.cache.PureSpeed = c.GetUnitPureStatus(self.id, STATUS_TYPE_SPD) end return self.cache.PureSpeed end
function Unit:PureElemResist(_elem) if self.cache.PureElemResist == nil then self.cache.PureElemResist = c.GetUnitElemResists(self.id, false) end return _elem==nil and self.cache.PureElemResist or self.cache.PureElemResist[_elem] or 0 end
function Unit:PureStatResist(_ailment) if self.cache.PureStatResist == nil then self.cache.PureStatResist = c.GetUnitStatResists(self.id, false) end return _ailment==nil and self.cache.PureStatResist or self.cache.PureStatResist[_ailment] end
function Unit:CastSpeedLimit() if self.cache.CastSpeedLimit == nil then self.cache.CastSpeedLimit = c.GetUnitCastMinClamp(self.id) end return self.cache.CastSpeedLimit end
function Unit:CastLV() if self.cache.CastLV == nil then self.cache.CastLV = c.GetUnitCastLevel(self.id) end return self.cache.CastLV end
function Unit:Time() if self.cache.Time == nil then self.cache.Time = math.floor(c.GetUnitActiveTime(self.id) * OneSec) end return self.cache.Time end
function Unit:State(_subUnitId)
	if _subUnitId then
		if self.cache.StateTable == nil then
			self.cache.StateTable = {}
		end
		if self.cache.StateTable[_subUnitId] == nil then
			self.cache.StateTable[_subUnitId] = c.GetUnitState(self.id, _subUnitId)
			if self.cache.StateTable[_subUnitId] == STATE_ACCESS or self.cache.StateTable[_subUnitId] == STATE_OPERATION then
				self.cache.StateTable[_subUnitId] = STATE_MOVE
			end
		end
		return self.cache.StateTable[_subUnitId]
	else
		if self.cache.State == nil then
			self.cache.State = c.GetUnitState(self.id)
			if self.cache.State == STATE_ACCESS or self.cache.State == STATE_OPERATION then
				self.cache.State = STATE_MOVE
			end
		end
		return self.cache.State
	end
end
function Unit:State2(_subUnitId)
	if _subUnitId then
		if self.cache.StateTable2 == nil then
			self.cache.StateTable2 = {}
		end
		if self.cache.StateTable2[_subUnitId] == nil then
			self.cache.StateTable2[_subUnitId] = c.GetUnitState(self.id, _subUnitId)
		end
		return self.cache.StateTable2[_subUnitId]
	else
		if self.cache.State2 == nil then
			self.cache.State2 = c.GetUnitState(self.id)
		end
		return self.cache.State2
	end
end
function Unit:Radius() if self.cache.Radius == nil then self.cache.Radius = c.GetUnitRadius(self.id) end return self.cache.Radius end
function Unit:Dir() if self.cache.Dir == nil then self.cache.Dir = c.GetUnitDir(self.id) end return self.cache.Dir end
-- このユニットが_tに対してどちらを向いているか
function Unit:ToDir(_t) local tid = _t:ID() if self.cache.ToDir == nil then self.cache.ToDir = {} end if self.cache.ToDir[tid] == nil then self.cache.ToDir[tid] = (self:Dir()==(self:PosX()>_t:PosX() and DIR_LEFT or DIR_RIGHT) and DIR_TO_FRONT or DIR_TO_BACK) end return self.cache.ToDir[tid] end
function Unit:Hits() if self.cache.Hits == nil then self.cache.Hits = c.GetUnitCombo(self.id) end return self.cache.Hits end
function Unit:IsBreak() if self.cache.IsBreak == nil then if c.GetUnitBreakRemain(self.id) > 0 then self.cache.IsBreak = self:IsBoss() and VIT_TYPE_BREAK or VIT_TYPE_STUN else self.cache.IsBreak = false end end return self.cache.IsBreak end
function Unit:BreakCount() if self.cache.BreakCount == nil then self.cache.BreakCount = c.GetUnitBreakCount(self.id) end return self.cache.BreakCount end
function Unit:IsCounter() if self.cache.IsCounter == nil then self.cache.IsCounter = c.UnitHaveCounter(self.id) end return self.cache.IsCounter end
function Unit:Aimed() if self.cache.Aimed == nil then self.cache.Aimed = c.GetUnitAimedCount(self.id) end return self.cache.Aimed end
function Unit:AimedList()
	if self.cache.AimedList == nil then
		self.cache.AimedList = {}
		for i,j in ipairs(c.GetUnitAimedList(self.id)) do
			self.cache.AimedList[i] = units:GetUnit(j)
		end
		self.cache.Aimed = #self.cache.AimedList
	end
	return self.cache.AimedList
end
function Unit:ActCount() if self.cache.ActCount == nil then self.cache.ActCount = c.GetUnitSkillUseCount(self.id) end return self.cache.ActCount end
function Unit:DamageInfo(_t, _elem, _sklType)
local cnt = 0
local tbl_t, tbl_e, tbl_s, tbl_te, tbl_ts, tbl_es = {}, {}, {}, {}, {}, {}
	if self.cache.DamageInfoElem == nil then
		self.cache.DamageInfo = c.GetUnitDamageInfo(self.id)
		for i,j in pairs(self.cache.DamageInfo) do
			for k,l in pairs(j) do
				for m,n in pairs(l) do
					tbl_t[i] = (tbl_t[i] or 0) + n
					tbl_e[k] = (tbl_e[k] or 0) + n
					tbl_s[m] = (tbl_s[m] or 0) + n
					if tbl_te[i] == nil then tbl_te[i] = {} end
					tbl_te[i][k] = (tbl_te[i][k] or 0) + n
					if tbl_ts[i] == nil then tbl_ts[i] = {} end
					tbl_ts[i][m] = (tbl_ts[i][m] or 0) + n
					if tbl_es[k] == nil then tbl_es[k] = {} end
					tbl_es[k][m] = (tbl_es[k][m] or 0) + n
					cnt = cnt + n
				end
			end
		end
		self.cache.DamageInfoTgt = tbl_t
		self.cache.DamageInfoTgtElem = tbl_te
		self.cache.DamageInfoTgtStype = tbl_ts
		self.cache.DamageInfoElem = tbl_e
		self.cache.DamageInfoElemStype = tbl_es
		self.cache.DamageInfoStype = tbl_s
		self.cache.DamageInfoAll = cnt
	end
	if _t==nil and _elem==nil and _sklType==nil then
		return self.cache.DamageInfoAll
	elseif _t==nil and _sklType==nil then
		return self.cache.DamageInfoElem[_elem] or 0
	elseif _t==nil and _elem==nil then
		if _sklType == SKILL_PHYSIC then
			cnt = 0
			for i,j in pairs(self.cache.DamageInfoStype) do
				if SKILL_CATEGORY_PHYSIC[i] then cnt = cnt + (j or 0) end
			end
			return cnt
		else
			return self.cache.DamageInfoStype[_sklType] or 0
		end
	elseif _elem==nil and _sklType==nil then
		return self.cache.DamageInfoTgt[_t] or 0
	elseif _sklType==nil then
		if self.cache.DamageInfoTgtElem[_t] == nil then return 0 end
		return self.cache.DamageInfoTgtElem[_t][_elem] or 0
	elseif _t==nil then
		if self.cache.DamageInfoElemStype[_elem] == nil then return 0 end
		if _sklType == SKILL_PHYSIC then
			cnt = 0
			for i,j in pairs(self.cache.DamageInfoElemStype[_elem]) do
				if SKILL_CATEGORY_PHYSIC[i] then cnt = cnt + (self.cache.DamageInfoElemStype[_elem][i] or 0) end
			end
			return cnt
		else
			return self.cache.DamageInfoElemStype[_elem][_sklType] or 0
		end
	elseif _elem==nil then
		if self.cache.DamageInfoTgtStype[_t] == nil then return 0 end
		if _sklType == SKILL_PHYSIC then
			cnt = 0
			for i,j in pairs(self.cache.DamageInfoTgtStype[_t]) do
				if SKILL_CATEGORY_PHYSIC[i] then cnt = cnt + (self.cache.DamageInfoTgtStype[_t][i] or 0) end
			end
			return cnt
		else
			return self.cache.DamageInfoTgtStype[_t][_sklType] or 0
		end
	else
		if self.cache.DamageInfo[_t] == nil then return 0 end
		if self.cache.DamageInfo[_t][_elem] == nil then return 0 end
		if _sklType == SKILL_PHYSIC then
			cnt = 0
			for i,j in pairs(self.cache.DamageInfo[_t][_elem]) do
				if SKILL_CATEGORY_PHYSIC[i] then cnt = cnt + (self.cache.DamageInfo[_t][_elem][i] or 0) end
			end
			return cnt
		else
			return self.cache.DamageInfo[_t][_elem][_sklType] or 0
		end
	end
end
function Unit:HitInfo(_t, _elem, _sklType)
local cnt = 0
local tbl_t, tbl_e, tbl_s, tbl_te, tbl_ts, tbl_es = {}, {}, {}, {}, {}, {}
	if self.cache.DamageHitInfoElem == nil then
		self.cache.DamageHitInfo = c.GetUnitDamageHitInfo(self.id)
		for i,j in pairs(self.cache.DamageHitInfo) do
			for k,l in pairs(j) do
				for m,n in pairs(l) do
					tbl_t[i] = (tbl_t[i] or 0) + n
					tbl_e[k] = (tbl_e[k] or 0) + n
					tbl_s[m] = (tbl_s[m] or 0) + n
					if tbl_te[i] == nil then tbl_te[i] = {} end
					tbl_te[i][k] = (tbl_te[i][k] or 0) + n
					if tbl_ts[i] == nil then tbl_ts[i] = {} end
					tbl_ts[i][m] = (tbl_ts[i][m] or 0) + n
					if tbl_es[k] == nil then tbl_es[k] = {} end
					tbl_es[k][m] = (tbl_es[k][m] or 0) + n
					cnt = cnt + n
				end
			end
		end
		self.cache.DamageHitInfoTgt = tbl_t
		self.cache.DamageHitInfoTgtElem = tbl_te
		self.cache.DamageHitInfoTgtStype = tbl_ts
		self.cache.DamageHitInfoElem = tbl_e
		self.cache.DamageHitInfoElemStype = tbl_es
		self.cache.DamageHitInfoStype = tbl_s
		self.cache.DamageHitInfoAll = cnt
	end
	if _t==nil and _elem==nil and _sklType==nil then
		return self.cache.DamageHitInfoAll
	elseif _t==nil and _sklType==nil then
		return self.cache.DamageHitInfoElem[_elem] or 0
	elseif _t==nil and _elem==nil then
		if _sklType == SKILL_PHYSIC then
			cnt = 0
			for i,j in pairs(self.cache.DamageHitInfoStype) do
				if SKILL_CATEGORY_PHYSIC[i] then cnt = cnt + (j or 0) end
			end
			return cnt
		else
			return self.cache.DamageHitInfoStype[_sklType] or 0
		end
	elseif _elem==nil and _sklType==nil then
		return self.cache.DamageHitInfoTgt[_t] or 0
	elseif _sklType==nil then
		if self.cache.DamageHitInfoTgtElem[_t] == nil then return 0 end
		return self.cache.DamageHitInfoTgtElem[_t][_elem] or 0
	elseif _t==nil then
		if self.cache.DamageHitInfoElemStype[_elem] == nil then return 0 end
		if _sklType == SKILL_PHYSIC then
			cnt = 0
			for i,j in pairs(self.cache.DamageHitInfoElemStype[_elem]) do
				if SKILL_CATEGORY_PHYSIC[i] then cnt = cnt + (self.cache.DamageHitInfoElemStype[_elem][i] or 0) end
			end
			return cnt
		else
			return self.cache.DamageHitInfoElemStype[_elem][_sklType] or 0
		end
	elseif _elem==nil then
		if self.cache.DamageHitInfoTgtStype[_t] == nil then return 0 end
		if _sklType == SKILL_PHYSIC then
			cnt = 0
			for i,j in pairs(self.cache.DamageHitInfoTgtStype[_t]) do
				if SKILL_CATEGORY_PHYSIC[i] then cnt = cnt + (self.cache.DamageHitInfoTgtStype[_t][i] or 0) end
			end
			return cnt
		else
			return self.cache.DamageHitInfoTgtStype[_t][_sklType] or 0
		end
	else
		if self.cache.DamageHitInfo[_t] == nil then return 0 end
		if self.cache.DamageHitInfo[_t][_elem] == nil then return 0 end
		if _sklType == SKILL_PHYSIC then
			cnt = 0
			for i,j in pairs(self.cache.DamageHitInfo[_t][_elem]) do
				if SKILL_CATEGORY_PHYSIC[i] then cnt = cnt + (self.cache.DamageHitInfo[_t][_elem][i] or 0) end
			end
			return cnt
		else
			return self.cache.DamageHitInfo[_t][_elem][_sklType] or 0
		end
	end
end
function Unit:Distance(u)
	if self.cache.Distance == nil then self.cache.Distance = {} end
	if self.cache.Distance[u:ID()] == nil then
		self.cache.Distance[u:ID()] = math.abs((select(1, c.UnitCalcPos(self.id, u:ID()))))
	end
	return self.cache.Distance[u:ID()]
end
function Unit:DistX(u) return math.abs(self:PosX() - u:PosX()) end
function Unit:DistY(u) return math.abs(self:PosY() - u:PosY()) end
function Unit:DistZ(u) return math.abs(self:PosZ() - u:PosZ()) end
function Unit:Position()
	if self.cache.Position == nil then
		self.cache.Position = {}
		self.cache.Position.x, self.cache.Position.y, self.cache.Position.z = c.GetUnitPos(self.id)
	end
	return self.cache.Position.x, self.cache.Position.y, self.cache.Position.z
end
function Unit:PosX() return (select(1, self:Position())) end
function Unit:PosY() return (select(2, self:Position())) end
function Unit:PosZ() return (select(3, self:Position())) end
function Unit:IsAilment(_type)
	if self.cache.Ailment == nil then
		self.cache.Ailment = c.GetUnitBadStatus(self.id)
	end
	if _type == nil then
		for i,j in pairs(self.cache.Ailment) do
			if j then return true end
		end
		return false
	elseif _type > 31 then
		_type = bitBooleanList(_type, 4)
		for i,j in pairs(_type) do
			if j and toBoolean(self.cache.Ailment[i]) then
				return true
			end
		end
		return false
	end
	return toBoolean(self.cache.Ailment[_type])
end
function Unit:AilmentList()
	if self.cache.Ailment == nil then
		self.cache.Ailment = c.GetUnitBadStatus(self.id)
	end
	return self.cache.Ailment
end
-- buffIdを省略した場合は、バフorデバフ/バフ/デバフがそれぞれ掛かっているか3つのbool値を返す
function Unit:IsBuff(buffId)
local tbl
	if self.cache.IsBuff == nil then self.cache.IsBuff = {} end
	if buffId==nil then
		if self.cache.IsBuffAll == nil then
			self.cache.IsBuffAll = {}
			tbl = self:GetBuff(false)
			self.cache.IsBuffAll[2] = toBoolean(tbl[1])
			tbl = self:GetBuff(true)
			self.cache.IsBuffAll[3] = toBoolean(tbl[1])
			self.cache.IsBuffAll[1] = self.cache.IsBuffAll[2] or self.cache.IsBuffAll[3]
		end
		return self.cache.IsBuffAll[1], self.cache.IsBuffAll[2], self.cache.IsBuffAll[3]
	else
		if self.cache.IsBuff[buffId] == nil then self.cache.IsBuff[buffId] = (c.GetUnitBuffUID(self.id, buffId) ~= 0) end
		return self.cache.IsBuff[buffId]
	end
end
function Unit:IsBuffCategory(buffCate)
	if self.cache.IsBuffCategory == nil then self.cache.IsBuffCategory = {} end
	if self.cache.IsBuffCategory[buffCate] == nil then
		for i,j in pairs(self:GetBuff(false)) do
			if j[BUFF_INFO_CATEGORY] == buffCate then self.cache.IsBuffCategory[buffCate] = true break end
		end
		if not self.cache.IsBuffCategory[buffCate] then
			for i,j in pairs(self:GetBuff(true)) do
				if j[BUFF_INFO_CATEGORY] == buffCate then self.cache.IsBuffCategory[buffCate] = true break end
			end
		end
		self.cache.IsBuffCategory[buffCate] = toBoolean(self.cache.IsBuffCategory[buffCate])
	end
	return self.cache.IsBuffCategory[buffCate]
end
function Unit:GetBuffCategoryParam(buffCate, _index, _option, _optionParam)
local buff
	if self.cache.GetBuffCategoryParam == nil then self.cache.GetBuffCategoryParam = {} end
	if self.cache.GetBuffCategoryParam[buffCate] == nil then
		self.cache.GetBuffCategoryParam[buffCate] = arrayInit({}, 10, 0)
		buff = (self:GetBuffCategoryBuffs(buffCate))[1]
		if buff ~= nil then
			for i,j in pairs(buff[BUFF_INFO_PARAM] or {}) do
				self.cache.GetBuffCategoryParam[buffCate][i] = j
			end
		end
	end
	if _index ~= nil then
		return self.cache.GetBuffCategoryParam[buffCate][_index]
	else
		return self.cache.GetBuffCategoryParam[buffCate]
	end
end
function Unit:GetBuffRemain(buffId)
	if self.cache.GetBuffRemain == nil then self.cache.GetBuffRemain = {} end
	if self.cache.GetBuffRemain[buffId] == nil then
		for i,j in pairs(self:GetBuff(false)) do
			if j[BUFF_INFO_ID] == buffId then self.cache.GetBuffRemain[buffId] = j[BUFF_INFO_REMAIN] break end
		end
		if self.cache.GetBuffRemain[buffId] == nil then
			for i,j in pairs(self:GetBuff(true)) do
				if j[BUFF_INFO_ID] == buffId then self.cache.GetBuffRemain[buffId] = j[BUFF_INFO_REMAIN] break end
			end
		end
	end
	return self.cache.GetBuffRemain[buffId]
end
function Unit:GetBuffCategoryRemain(buffCate)
	if self.cache.GetBuffCategoryRemain == nil then self.cache.GetBuffCategoryRemain = {} end
	if self.cache.GetBuffCategoryRemain[buffCate] == nil then
		self.cache.GetBuffCategoryRemain[buffCate] = self.cache.GetBuffCategoryRemain[buffCate] or 0
		for i,j in pairs(self:GetBuff(false)) do
			if j[BUFF_INFO_CATEGORY] == buffCate and self.cache.GetBuffCategoryRemain[buffCate] < j[BUFF_INFO_REMAIN] then self.cache.GetBuffCategoryRemain[buffCate] = j[BUFF_INFO_REMAIN] end
		end
		for i,j in pairs(self:GetBuff(true)) do
			if j[BUFF_INFO_CATEGORY] == buffCate and self.cache.GetBuffCategoryRemain[buffCate] < j[BUFF_INFO_REMAIN] then self.cache.GetBuffCategoryRemain[buffCate] = j[BUFF_INFO_REMAIN] end
		end
	end
	return self.cache.GetBuffCategoryRemain[buffCate]
end
function Unit:GetBuffCategoryBuffs(buffCate)
	if self.cache.GetBuffCategoryBuffs == nil then self.cache.GetBuffCategoryBuffs = {} end
	if self.cache.GetBuffCategoryBuffs[buffCate] == nil then
		self.cache.GetBuffCategoryBuffs[buffCate] = self.cache.GetBuffCategoryBuffs[buffCate] or {}
		for i,j in pairs(self:GetBuff(false)) do
			if j[BUFF_INFO_CATEGORY] == buffCate then table.insert(self.cache.GetBuffCategoryBuffs[buffCate], j) end
		end
		for i,j in pairs(self:GetBuff(true)) do
			if j[BUFF_INFO_CATEGORY] == buffCate then table.insert(self.cache.GetBuffCategoryBuffs[buffCate], j) end
		end
	end
	return self.cache.GetBuffCategoryBuffs[buffCate]
end
function Unit:GetBuffIdBuffs(buffId)
	if self.cache.GetBuffIdBuffs == nil then self.cache.GetBuffIdBuffs = {} end
	if self.cache.GetBuffIdBuffs[buffId] == nil then
		self.cache.GetBuffIdBuffs[buffId] = self.cache.GetBuffIdBuffs[buffId] or {}
		for i,j in pairs(self:GetBuff(false)) do
			if j[BUFF_INFO_ID] == buffId then table.insert(self.cache.GetBuffIdBuffs[buffId], j) end
		end
		for i,j in pairs(self:GetBuff(true)) do
			if j[BUFF_INFO_ID] == buffId then table.insert(self.cache.GetBuffIdBuffs[buffId], j) end
		end
	end
	return self.cache.GetBuffIdBuffs[buffId]
end
function Unit:GetBuff(_isDeBuff)
	if self.cache.BuffDeBuff == nil then
		self.cache.BuffDeBuff = {}
		self.cache.Buff = c.GetUnitBuffs(self.id)
		self.cache.DeBuff = c.GetUnitDebuffs(self.id)
		for i,bff in pairs(self.cache.Buff) do
			table.insert(self.cache.BuffDeBuff, bff)
		end
		for i,bff in pairs(self.cache.DeBuff) do
			table.insert(self.cache.BuffDeBuff, bff)
		end
	end
	if _isDeBuff == nil then
		return self.cache.BuffDeBuff
	elseif _isDeBuff then
		return self.cache.DeBuff
	else
		return self.cache.Buff
	end
end
function Unit:GetVisibleBuff(_isDeBuff, _invisible)
	if self.cache.VisibleBuffDeBuff == nil then
		self.cache.VisibleBuffDeBuff = {}
		self.cache.VisibleBuff = {}
		self.cache.VisibleDeBuff = {}
		self.cache.InvisibleBuffDeBuff = {}
		self.cache.InvisibleBuff = {}
		self.cache.InvisibleDeBuff = {}
		for i,bff in pairs(self:GetBuff(false)) do
			if bff[BUFF_INFO_ICON_ID] == 0 then
				table.insert(self.cache.InvisibleBuff, bff)
				table.insert(self.cache.InvisibleBuffDeBuff, bff)
			else
				table.insert(self.cache.VisibleBuff, bff)
				table.insert(self.cache.VisibleBuffDeBuff, bff)
			end
		end
		for i,bff in pairs(self:GetBuff(true)) do
			if bff[BUFF_INFO_ICON_ID] == 0 then
				table.insert(self.cache.InvisibleDeBuff, bff)
				table.insert(self.cache.InvisibleBuffDeBuff, bff)
			else
				table.insert(self.cache.VisibleDeBuff, bff)
				table.insert(self.cache.VisibleBuffDeBuff, bff)
			end
		end
	end
	if _invisible then
		if _isDeBuff == nil then
			return self.cache.InvisibleDeBuff
		elseif _isDeBuff then
			return self.cache.InvisibleDeBuff
		else
			return self.cache.InvisibleBuff
		end
	else
		if _isDeBuff == nil then
			return self.cache.VisibleBuffDeBuff
		elseif _isDeBuff then
			return self.cache.VisibleDeBuff
		else
			return self.cache.VisibleBuff
		end
	end
end
function Unit:VisibleBuffCount(_isDeBuff, _invisible) local t, cnt = {}, 0 for i,j in pairs(self:GetVisibleBuff(_isDeBuff, _invisible)) do if t[j[BUFF_INFO_CATEGORY]] == nil then t[j[BUFF_INFO_CATEGORY]] = true cnt = cnt + 1 end end return cnt end
function Unit:GetSkillValue(_index, _puid) local t = self:GetValue(UNIT_VALUE_SKILL_INFO) or {} local pt = t[_puid] or {} return pt[_index] end
function Unit:SetPairingBuff(_pairingID, _buffUID)
local pbList = self:GetValue(UNIT_VALUE_PROCESS_PAIRING_BUFFS) or {}
	if pbList[_pairingID] == nil then
		pbList[_pairingID] = {}
	end
	table.insert(pbList[_pairingID], _buffUID)
	self:SetValue(UNIT_VALUE_PROCESS_PAIRING_BUFFS, pbList)
end
function Unit:GetPairingBuffs(_pairingID)
local n
local pbList = self:GetValue(UNIT_VALUE_PROCESS_PAIRING_BUFFS) or {}
	if pbList[_pairingID] == nil then
		return {}
	else
		n = #(pbList[_pairingID])
		pbList[_pairingID] = arrayRemove(pbList[_pairingID], function(tbl, i, j) return Field:IsBuffExists(tbl[i]) end)
		if n > #(pbList[_pairingID]) then
			self:SetValue(UNIT_VALUE_PROCESS_PAIRING_BUFFS, pbList)
		end
		return pbList[_pairingID]
	end
end
function Unit:SetProcessTarget(_targetID, _unit)
local ptList = self:GetValue(UNIT_VALUE_PROCESS_TARGET) or {}
	if _unit == nil then
		if ptList[_targetID] ~= nil then
			ptList[_targetID] = nil
			self:SetValue(UNIT_VALUE_PROCESS_TARGET, ptList)
			return true
		end
	elseif isTableOrClass(_unit) and _unit:IsValid() then
		ptList[_targetID] = _unit:ID()
		self:SetValue(UNIT_VALUE_PROCESS_TARGET, ptList)
		return true
	end
	log:write(LOG_LEVEL_WARNING, 'SetProcessTarget Failed : Unit is nil or invalid')
	return false
end
function Unit:GetProcessTarget(_targetID)
local u
local ptList = self:GetValue(UNIT_VALUE_PROCESS_TARGET) or {}
	if ptList[_targetID] ~= nil then
		u = units:GetUnit(ptList[_targetID])
		if u:IsValid() then return u end
	end
	log:write(LOG_LEVEL_WARNING, 'GetProcessTarget Failed : Unit is nil or invalid')
	return nil
end
function Unit:MakeSkillList()
	if not isTableOrClass(self.skill) then
		local n,t,g
		self.skill = {}
		self.skillId = {}
		self.skillIndexUI = {}
		self.skillGroup = {}
		self.scnt = {}
		
		for i,j in ipairs(SKILL_CATEGORY_LIST) do
			t = {}
			n = c.GetUnitSkillNum(self:ID(), j)
			-- ダミーユニットには召喚魔法を持たせる
			-- TODO：クライアント側でちゃんと持たせてもらう
			if j == SKILL_SUMMON and self:IsDummy() then
				n = 1
			end
			self.scnt[j] = n
			for k = 1, n do
				t[k] = Skill.new(self, j, k)
				self.skillId[t[k]:ID()] = t[k]
				g = t[k]:Group()
				for l, grp in pairs(g) do
					if self.skillGroup[grp] == nil then self.skillGroup[grp] = {} end
					table.insert(self.skillGroup[grp], t[k])
				end
				if j == SKILL_SKILL then self.skillIndexUI[t[k]:IndexUI()] = t[k] end
			end
			self.skill[j] = t
		end
		t = c.GetUnitSkillSlots(self.id)
		if t == nil then
			self.scnt[SKILL_SLOT] = 0
			self.skill[SKILL_SLOT] = {}
		else
			self.scnt[SKILL_SLOT] = #t
			for i,j in pairs(t) do
				t[i] = self.skill[t[i][SKILL_SLOT_KEY_TYPE]][t[i][SKILL_SLOT_KEY_INDEX]]
			end
			self.skill[SKILL_SLOT] = t
		end
	end
end
function Unit:ActSkill() local _slot, _type, _index, _t if self.cache.ActSkill == nil then _slot, _type, _index, _t = c.GetUnitActiveSkill(self.id) self.cache.ActSkill = self:GetSkill(_type, _index) self.cache.ActSkillTarget = units:GetUnit(_t) end if self.cache.ActSkillPUID == nil then self.cache.ActSkillPUID = c.GetUnitActiveSkillPUID(self.id) end return self.cache.ActSkill, self.cache.ActSkillTarget, self.cache.ActSkillPUID end
function Unit:GetSkill(skillType, skillIndex)
	self:MakeSkillList()
	if skillIndex == nil then
		if skillType == nil then
			return copyTable(self.skill, 2)
		else
			return copyTable(self.skill[skillType])
		end
	else
		-- ダイレクトスキルに対応
		return skillIndex == -999 and Skill.new(self, skillType, skillIndex) or self.skill[skillType][skillIndex]
	end
end
function Unit:GetSkillFromID(skillId) self:MakeSkillList() return self.skillId[skillId] end
function Unit:GetSkillFromIndexUI(indexUI) self:MakeSkillList() return self.skillIndexUI[indexUI] end
function Unit:GetSkillsFromSkillGroup(skillGroup) self:MakeSkillList() return self.skillGroup[skillGroup] or {} end
function Unit:SKL_Name(skillType, skillIndex) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Name() else return nil end end
function Unit:SKL_Kind(skillType, skillIndex) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Kind() else return nil end end
function Unit:SKL_Charge(skillType, skillIndex) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Charge() else return nil end end
function Unit:SKL_Cost(skillType, skillIndex) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Cost() else return nil end end
function Unit:SKL_Element(skillType, skillIndex, _comp) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Element(_comp) else return nil end end
function Unit:SKL_Element2(skillType, skillIndex, _comp) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Element2(_comp) else return nil end end
function Unit:SKL_Target(skillType, skillIndex) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Target() else return nil end end
function Unit:SKL_Scale(skillType, skillIndex) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Scale() else return nil end end
function Unit:SKL_Level(skillType, skillIndex) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Level() else return nil end end
function Unit:SKL_CastLevel(skillType, skillIndex) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:CastLevel() else return nil end end
function Unit:SKL_MultiCast(skillType, skillIndex) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:MultiCast() else return nil end end
function Unit:SKL_Role(skillType, skillIndex, _comp) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Role(_comp) else return nil end end
function Unit:SKL_Available(skillType, skillIndex) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Available() else return nil end end
function Unit:SKL_Stock(skillIndex) local skl = self:GetSkill(SKILL_SKILL, skillIndex) if skl ~= nil then return skl:Stock() else return nil end end
function Unit:SKL_MaxStock(skillIndex) local skl = self:GetSkill(SKILL_SKILL, skillIndex) if skl ~= nil then return skl:MaxStock() else return nil end end
function Unit:SKL_Play(skillType, skillIndex, t, mode, option, delay, move) local skl = self:GetSkill(skillType, skillIndex) if skl ~= nil then return skl:Play(t, mode, option, delay, move) else return nil end end
function Unit:SKL_PlayDirect(skillId, t, mode, option, delay, move) return c.PlaySkillDirect(self.parent:ID(), skillId, mode, option, delay, t and t:ID(), move) end
function Unit:SkillCount(skillType) self:MakeSkillList() return self.scnt[skillType] end
function Unit:SkillExists(skillType, skillIndex) return self:GetSkill(skillType, skillIndex)~=nil end
function Unit:SkillHistory(skillType)
	skillType = skillType or 0
	if self.cache.SkillHistory == nil then
		self.cache.SkillHistory = {}
	end
	if self.cache.SkillHistory[skillType] == nil then
		self.cache.SkillHistory[skillType] = c.GetUnitActionHistory(self.id, skillType)
	end
	return self.cache.SkillHistory[skillType]
end
function Unit:CanUseSkillType(skillType) if self.cache.CanUseSkillType == nil then self.cache.CanUseSkillType = {} end if self.cache.CanUseSkillType[skillType] == nil then self.cache.CanUseSkillType[skillType] = c.CanUseSkillType(self.id, skillType) end return self.cache.CanUseSkillType[skillType] end
function Unit:PassiveList() if self.cache.PassiveList == nil then self.cache.PassiveList = c.GetUnitPassiveList(self.id, PROC_AFFILIATION_AUTOSKILL) end return self.cache.PassiveList end
function Unit:HavePassive(_passiveId) if self.cache.HavePassive == nil then self.cache.HavePassive = {} if not self:IsMonster() then for i,pid in pairs(self:PassiveList()) do self.cache.HavePassive[pid] = true end end end return toBoolean(self.cache.HavePassive[_passiveId]) end
function Unit:ArkPassiveList() if self.cache.ArkPassiveList == nil then self.cache.ArkPassiveList = c.GetUnitPassiveList(self.id, PROC_AFFILIATION_ARK) end return self.cache.ArkPassiveList end
function Unit:SetValue(_key, _val, _ever) return c.UnitSetLuaValue(self.id, _key, _val, _ever) end
function Unit:CalcValue(_key, _val, _calc, _ever) return calculateCS(_calc, _val, c.UnitCalcLuaValue, {self.id, _key, _val, _calc, _ever}, 4, 3, c.UnitGetLuaValue, {self.id, _key}) end
function Unit:GetValue(_key) return c.UnitGetLuaValue(self.id, _key) end
function Unit:SetGeneralInfo(_index, _bool, _ever) local t = self:GetValue(UNIT_VALUE_GENERAL_INFO) or {} t[_index] = _bool self:SetValue(UNIT_VALUE_GENERAL_INFO, t, false) if _ever then t = self:GetValue(UNIT_VALUE_GENERAL_INFO_EVER) or {} t[_index] = _bool self:SetValue(UNIT_VALUE_GENERAL_INFO_EVER, t, true) end end
function Unit:GetGeneralInfo(_index) local t = self:GetValue(UNIT_VALUE_GENERAL_INFO) or {} if t[_index] == nil then t = self:GetValue(UNIT_VALUE_GENERAL_INFO_EVER) or {} if t[_index] ~= nil then self:SetGeneralInfo(_index, t[_index]) end end return t[_index] or Field:GetGeneralInfo(_index) end
function Unit:SetGeneralCount(_index, _cnt) return self:AddGeneralCount(_index, _cnt, 2, {CALCULATE_OVR}) end
function Unit:AddGeneralCount(_index, _cnt, _option, _prm)
	if not isNumber(_cnt) then
		log:write(LOG_LEVEL_ERROR, 'AddGeneralCount Failed : cnt is not number')
		return false
	elseif _index == 0 then
		log:write(LOG_LEVEL_WARNING, 'AddGeneralCount Failed : index cannot be 0')
		return false
	end
	local b4
	local val = 0
	local slot = 1
	local calc = CALCULATE_ADD
	local _ever = false
	local res = false
	_option = _option or 0
	if _option // 10 == 1 then slot = (_option % 10) + 2 calc = _prm[1] elseif _option==2 then calc = _prm[1] elseif _option==3 then calc = CALCULATE_OVR _cnt = math.random(math.min(_cnt, _prm[1]), math.max(_cnt, _prm[1])) end
	b4 = self:GetValue({UNIT_VALUE_GENERAL_COUNT, _index, slot}) or 0
	val = self:CalcValue({UNIT_VALUE_GENERAL_COUNT, _index, slot}, _cnt, calc, false)
	if _option == 1 then
		if _cnt > 0 then
			val = self:CalcValue({UNIT_VALUE_GENERAL_COUNT, _index, slot}, _prm[1], CALCULATE_MIN, false)
		elseif _cnt < 0 then
			val = self:CalcValue({UNIT_VALUE_GENERAL_COUNT, _index, slot}, _prm[1], CALCULATE_MAX, false)
		end
	end
	if val ~= b4 then res = true end
	if _option // 10 == 2 then
		self:SetValue({UNIT_VALUE_GENERAL_COUNT_SLOT_INFO, _index, (_option % 10) + 2}, _prm[1], false)
	end
	if _ever then
		local val2 = val
		b4 = self:GetValue({UNIT_VALUE_GENERAL_COUNT_EVER, _index, slot}) or 0
		val = self:CalcValue({UNIT_VALUE_GENERAL_COUNT_EVER, _index, slot}, _cnt, calc, true)
		if _option == 1 then
			if _cnt > 0 then
				val = self:CalcValue({UNIT_VALUE_GENERAL_COUNT_EVER, _index, slot}, _prm[1], CALCULATE_MIN, true)
			elseif _cnt < 0 then
				val = self:CalcValue({UNIT_VALUE_GENERAL_COUNT_EVER, _index, slot}, _prm[1], CALCULATE_MAX, true)
			end
		end
		if val ~= b4 then res = true end
		if _option // 10 == 2 then
			self:SetValue({UNIT_VALUE_GENERAL_COUNT_SLOT_INFO_EVER, _index, (_option % 10) + 2}, _prm[1], true)
		end
		return res, val, val2
	end
	return res, val
end
function Unit:GetGeneralCount(_index)
	if _index == 0 then return 0 end
	local val
	local t = self:GetValue({UNIT_VALUE_GENERAL_COUNT, _index})
	local calc = self:GetValue({UNIT_VALUE_GENERAL_COUNT_SLOT_INFO, _index}) or {}
	if t == nil then
		t = self:GetValue({UNIT_VALUE_GENERAL_COUNT_EVER, _index})
		calc = self:GetValue({UNIT_VALUE_GENERAL_COUNT_SLOT_INFO_EVER, _index}) or {}
		if t ~= nil then self:SetValue({UNIT_VALUE_GENERAL_COUNT, _index}, t, false) self:SetValue({UNIT_VALUE_GENERAL_COUNT_SLOT_INFO, _index}, calc, false) end
	end
	if isTableOrClass(t) then
		val = t[1] or 0
		for i = 2, 11 do
			if isNumber(t[i]) then val = calculate(calc[i] or CALCULATE_ADD, val, t[i] or 0) end
		end
		return val
	else
		return t or 0
	end
end
function Unit:AddSeriesCount(_index, _ever)
local t = self:GetValue(UNIT_VALUE_SERIES_INFO) or {}
	if t[_index] == nil then t[_index] = {} end
	t[_index][EQUIP_SERIES_INFO_COUNT] = (t[_index][EQUIP_SERIES_INFO_COUNT] or 0) + 1
	self:SetValue(UNIT_VALUE_SERIES_INFO, t, false)
	if _ever then
		t = self:GetValue(UNIT_VALUE_SERIES_INFO_EVER) or {}
		if t[_index] == nil then t[_index] = {} end
		t[_index][EQUIP_SERIES_INFO_COUNT] = (t[_index][EQUIP_SERIES_INFO_COUNT] or 0) + 1
		self:SetValue(UNIT_VALUE_SERIES_INFO_EVER, t, true)
	end
end
function Unit:SetSeriesCount(_index, _cnt, _ever)
local t = self:GetValue(UNIT_VALUE_SERIES_INFO) or {}
	if t[_index] == nil then t[_index] = {} end
	t[_index][EQUIP_SERIES_INFO_COUNT] = _cnt
	self:SetValue(UNIT_VALUE_SERIES_INFO, t, false)
	if _ever then
		t = self:GetValue(UNIT_VALUE_SERIES_INFO_EVER) or {}
		if t[_index] == nil then t[_index] = {} end
		t[_index][EQUIP_SERIES_INFO_COUNT] = _cnt
		self:SetValue(UNIT_VALUE_SERIES_INFO_EVER, t, true)
	end
end
function Unit:GetSeriesCount(_index)
local t = self:GetValue(UNIT_VALUE_SERIES_INFO) or {}
local te
	if t[_index] == nil then
		te = self:GetValue(UNIT_VALUE_SERIES_INFO_EVER) or {}
		if te[_index] == nil then return 0 end
		if te[_index][EQUIP_SERIES_INFO_COUNT] == nil then return 0 end
		self:SetSeriesCount(_index, te[_index][EQUIP_SERIES_INFO_COUNT])
		return te[_index][EQUIP_SERIES_INFO_COUNT] or 0
	else
		return t[_index][EQUIP_SERIES_INFO_COUNT] or 0
	end
end
function Unit:SetSeriesLeader(_index, _affiliation, _localId, _ever)
local t = self:GetValue(UNIT_VALUE_SERIES_INFO) or {}
	if t[_index] == nil then t[_index] = {} end
	t[_index][EQUIP_SERIES_INFO_AFFILIATION] = _affiliation
	t[_index][EQUIP_SERIES_INFO_LOCALID] = _localId
	self:SetValue(UNIT_VALUE_SERIES_INFO, t, false)
	if _ever then
		t = self:GetValue(UNIT_VALUE_SERIES_INFO_EVER) or {}
		if t[_index] == nil then t[_index] = {} end
		t[_index][EQUIP_SERIES_INFO_AFFILIATION] = _affiliation
		t[_index][EQUIP_SERIES_INFO_LOCALID] = _localId
		self:SetValue(UNIT_VALUE_SERIES_INFO_EVER, t, true)
	end
end
function Unit:GetSeriesLeader(_index)
local t = self:GetValue(UNIT_VALUE_SERIES_INFO) or {}
local te
	if t[_index] == nil then
		te = self:GetValue(UNIT_VALUE_SERIES_INFO_EVER) or {}
		if te[_index] == nil then return nil, nil end
		self:SetSeriesLeader(_index, te[_index][EQUIP_SERIES_INFO_AFFILIATION], te[_index][EQUIP_SERIES_INFO_LOCALID])
		return te[_index][EQUIP_SERIES_INFO_AFFILIATION], te[_index][EQUIP_SERIES_INFO_LOCALID]
	else
		return t[_index][EQUIP_SERIES_INFO_AFFILIATION], t[_index][EQUIP_SERIES_INFO_LOCALID]
	end
end
function Unit:CreateFollowedCollision(targets, listeners, x, y, z, collisionId, groupId, _anchorType)
	return Field:CreateCollision(targets, listeners, x or 0, y or 0, z or 0, collisionId, groupId, COLLISION_ACTION_TYPE_FOLLOWING, {self:ID(), _anchorType or ANCHOR_TYPE_TARGBOTTOM, 0, 1})
end

-- newとFrameUpdateはさらに下位のライブラリで個別定義(※最低限動くが、必ず再定義すること！)
function Unit:FrameUpdate()
	self.name = c.GetUnitName(self.id)
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
	obj.skillId = 0
	obj.scnt = 0
	obj.side = c.GetUnitSide(obj.id)
	
	setmetatable(obj.method,{__index = LoggingMethod})
	setmetatable(obj,{__index = obj.method, __newindex = AddLoggingMethod})

	return obj
end

----------------------------------------------------------------------------------
-- 							ユニットリストの定義								--
-- 			AIで使用している、自分以外のユニットをグローバルで管理する			--
-- 				※処理ごとにUnitをnew→破棄するのは無駄なため					--
-- 					処理開始時に必ずFrameUpdate()すること！						--
----------------------------------------------------------------------------------
UnitList = {}
UnitList.CondFunc = {}
UnitList.CondFunc[UNIT_COND_NONE] = function(_unit) return true, COMPARE_EQUAL, true end
UnitList.CondFunc[UNIT_COND_HP_PER_OVER] = function(_unit) return _unit:PerHP(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_HP_PER_UNDER] = function(_unit) return _unit:PerHP(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_MP_PER_OVER] = function(_unit) return _unit:PerMP(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_MP_PER_UNDER] = function(_unit) return _unit:PerMP(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_NEAR] = function(_unit) return this:Distance(_unit), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_FAR] = function(_unit) return this:Distance(_unit), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_HP_OVER] = function(_unit) return _unit:HP(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_HP_UNDER] = function(_unit) return _unit:HP(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_MP_OVER] = function(_unit) return _unit:MP(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_MP_UNDER] = function(_unit) return _unit:MP(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_MAXHP_OVER] = function(_unit) return _unit:MaxHP(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_MAXHP_UNDER] = function(_unit) return _unit:MaxHP(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_MAXMP_OVER] = function(_unit) return _unit:MaxMP(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_MAXMP_UNDER] = function(_unit) return _unit:MaxMP(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_STR_OVER] = function(_unit) return _unit:STR(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_STR_UNDER] = function(_unit) return _unit:STR(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_DEF_OVER] = function(_unit) return _unit:DEF(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_DEF_UNDER] = function(_unit) return _unit:DEF(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_INT_OVER] = function(_unit) return _unit:INT(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_INT_UNDER] = function(_unit) return _unit:INT(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_MND_OVER] = function(_unit) return _unit:MND(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_MND_UNDER] = function(_unit) return _unit:MND(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_PURE_HP_OVER] = function(_unit) return _unit:PureHP(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_PURE_HP_UNDER] = function(_unit) return _unit:PureHP(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_PURE_MP_OVER] = function(_unit) return _unit:PureMP(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_PURE_MP_UNDER] = function(_unit) return _unit:PureMP(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_PURE_MAXHP_OVER] = function(_unit) return _unit:PureMaxHP(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_PURE_MAXHP_UNDER] = function(_unit) return _unit:PureMaxHP(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_PURE_MAXMP_OVER] = function(_unit) return _unit:PureMaxMP(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_PURE_MAXMP_UNDER] = function(_unit) return _unit:PureMaxMP(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_PURE_STR_OVER] = function(_unit) return _unit:PureSTR(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_PURE_STR_UNDER] = function(_unit) return _unit:PureSTR(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_PURE_DEF_OVER] = function(_unit) return _unit:PureDEF(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_PURE_DEF_UNDER] = function(_unit) return _unit:PureDEF(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_PURE_INT_OVER] = function(_unit) return _unit:PureINT(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_PURE_INT_UNDER] = function(_unit) return _unit:PureINT(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_PURE_MND_OVER] = function(_unit) return _unit:PureMND(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_PURE_MND_UNDER] = function(_unit) return _unit:PureMND(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_AIMED_NONE] = function(_unit) return _unit:Aimed(), COMPARE_EQUAL, 0 end
UnitList.CondFunc[UNIT_COND_AIMED_FEW] = function(_unit) return _unit:Aimed(), COMPARE_UNDER end
UnitList.CondFunc[UNIT_COND_AIMED_MANY] = function(_unit) return _unit:Aimed(), COMPARE_ORMORE end
UnitList.CondFunc[UNIT_COND_CHARA_TYPE] = function(_unit) return _unit:Type(), COMPARE_ARRAY_EQUAL end
UnitList.CondFunc[UNIT_COND_GENDER] = function(_unit) return _unit:Gender(), COMPARE_EQUAL end
UnitList.CondFunc[UNIT_COND_CHARA_CATEGORY] = function(_unit) return _unit:Category(), COMPARE_ARRAY_EQUAL end

UnitList.ProcTargetCond = {}
UnitList.ProcTargetCond[0] = function(self, _side, _option) local ulist = self:GetCondUnitList(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_NONE + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) if ulist[1] ~= nil then return ulist[math.random(1, #ulist)] end end
UnitList.ProcTargetCond[1] = function(self, _side, _option) return self:GetCondUnit(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_PURE_HP_UNDER + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) end
UnitList.ProcTargetCond[3] = function(self, _side, _option) return self:GetCondUnit(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_PURE_DEF_UNDER + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) end
UnitList.ProcTargetCond[6] = function(self, _side, _option) return self:GetCondUnit(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_PURE_STR_OVER + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) end
UnitList.ProcTargetCond[8] = function(self, _side, _option) return self:GetCondUnit(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_PURE_INT_OVER + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) end
UnitList.ProcTargetCond[51] = function(self, _side, _option) return self:GetCondUnit(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_HP_UNDER + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) end
UnitList.ProcTargetCond[56] = function(self, _side, _option) return self:GetCondUnit(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_STR_OVER + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) end
UnitList.ProcTargetCond[58] = function(self, _side, _option) return self:GetCondUnit(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_INT_OVER + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) end
UnitList.ProcTargetCond[106] = function(self, _side, _option) local condFunc, res local ulist = self:GetCondUnitList(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_CHARA_TYPE + ((_option&1==1) and UNIT_COND_NOT_ME or 0), CHARA_TYPE_GOD) if #ulist >= 1 then condFunc = newCompare(self.CondFunc[UNIT_COND_PURE_STR_OVER]) res = {} for i, j in pairs(ulist) do res = (condFunc(j)) end if #res >= 2 then return self:PickUnitFromUlist(res) else return res[1] end end end
UnitList.ProcTargetCond[153] = function(self, _side, _option) local u = self:GetCondUnit(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_HP_PER_UNDER + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) if u ~= nil and u:HP() ~= u:MaxHP() then return u end end
UnitList.ProcTargetCond[253] = function(self, _side, _option) local condFunc, res local ulist = self:GetCondUnitList(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_GENDER + ((_option&1==1) and UNIT_COND_NOT_ME or 0), GENDER_MALE) if #ulist >= 1 then condFunc = newCompare(self.CondFunc[UNIT_COND_PURE_INT_OVER]) res = {} for i, j in pairs(ulist) do res = (condFunc(j)) end if #res >= 2 then return self:PickUnitFromUlist(res) else return res[1] end end end
UnitList.ProcTargetCond[265] = function(self, _side, _option) local condFunc, res local ulist = self:GetCondUnitList(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_GENDER + ((_option&1==1) and UNIT_COND_NOT_ME or 0), GENDER_MALE) if #ulist >= 1 then condFunc = newFilter(self.CondFunc[UNIT_COND_CHARA_TYPE], CHARA_TYPE_SORCERER) res = {} for i, j in pairs(ulist) do res = (condFunc(j)) end if #res >= 2 then return self:PickUnitFromUlist(res) else return res[1] end end end
UnitList.ProcTargetCond[1000] = function(self, _side, _option) local condFunc, res local ulist = self:GetCondUnitList(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_CHARA_TYPE + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) if #ulist >= 1 then condFunc = newCompare(self.CondFunc[UNIT_COND_NEAR]) res = {} for i, j in pairs(ulist) do res = (condFunc(j)) end if #res >= 2 then return self:PickUnitFromUlist(res) else return res[1] end end end
UnitList.ProcTargetCond[1001] = function(self, _side, _option) local condFunc, res local ulist = self:GetCondUnitList(_side, (_option&2==2) and TARGET_COND_ALIVE or TARGET_COND_BOTH, UNIT_COND_CHARA_TYPE + ((_option&1==1) and UNIT_COND_NOT_ME or 0)) if #ulist >= 1 then condFunc = newCompare(self.CondFunc[UNIT_COND_FAR]) res = {} for i, j in pairs(ulist) do res = (condFunc(j)) end if #res >= 2 then return self:PickUnitFromUlist(res) else return res[1] end end end

function UnitList:Add(_u)
	if isTableOrClass(_u, C_TYPE_UNIT) or isTableOrClass(_u, C_TYPE_MYUNIT) then
		if self.list[_u:ID()]==nil then
			self.list[_u:ID()] = _u
		end
	end
end
function UnitList:AddUnit(_id) if self.list[_id]==nil then self.list[_id] = Unit.new(_id) end end
function UnitList:GetUnit(_id)
	if c.IsValidUnit(_id) then
		self:AddUnit(_id)
		return self.list[_id]
	else
		return self:GetDummyUnit()
	end
end
function UnitList:GetOperationUnit() return self:GetUnit(c.GetOperationUnit()) end
function UnitList:GetFirstAllyUnit() local ulist = c.GetUnitList(TARGET_SIDE_ALLY, TARGET_COND_ALL) return self:GetUnit(ulist[1]) end
function UnitList:GetDummyUnit() return self:GetUnit(c.GetDummyUnit()) end
function UnitList:GetMostCharaType(_targetSide, _targetCond, _unitCond, _param, _sameList) local tbl, maxi, maxc = {}, 0, {} for i,u in pairs(self:GetCondUnitList(_targetSide, _targetCond, _unitCond, _param)) do for j,k in pairs(u:Type()) do tbl[k] = (tbl[k] or 0) + 1 if maxi < tbl[k] then maxi = tbl[k] maxc = {k} elseif maxi == tbl[k] then table.insert(maxc, k) end end end if maxc[1] ~= nil then return _sameList and maxc or maxc[math.random(1, #maxc)], maxi else return _sameList and {} or 0, maxi end end
function UnitList:PickUnitFromUlist(_ulist)
local tbl
	if #_ulist>=2 then
		-- 無駄だが、一旦識別子配列にしてからc#側で抽選(ヘイト考慮)
		-- TODO そもそも識別子テーブルを別途用意することを検討
		tbl = {}
		for i,j in ipairs(_ulist) do
			table.insert(tbl, j:ID())
		end
		return self:GetUnit(c.SelectTarget(tbl))
	else
		return _ulist[1]
	end
end
-- 条件を満たすユニットを返す
function UnitList:GetCondUnit(_targetSide, _targetCond, _unitCond, _sameList)
local res = {}
local u,ulist,condFunc,val,restxt,notMe

	notMe = bitToBoolean(_unitCond//1000, 1)
	_unitCond = _unitCond % 1000
	-- 近いユニットは別口で分かる
	if _unitCond==UNIT_COND_NEAR then
		res = self:GetUnit(c.GetNearestUnit(_targetSide))
		return res
	end
	ulist = c.GetUnitList(_targetSide, _targetCond)
	if #ulist >= 1 then
		if _cond==UNIT_COND_NONE then
			res = self:GetUnit(ulist[math.random(#ulist)])
			return res
		end
		condFunc = newCompare(self.CondFunc[_unitCond])
		for i, j in ipairs(ulist) do
			u = self:GetUnit(j)
			if (not notMe) or this:ID() ~= u:ID() then
				res,val = condFunc(u)
			end
		end
	else
		log:write(LOG_LEVEL_WARNING, 'GetCondUnit Failed : Cond=>', _unitCond)
		return nil
	end
	if res[1]==nil then return nil end
	if not _sameList then res = self:PickUnitFromUlist(res) end
	return res
end

-- 条件を満たすユニット配列を返す
function UnitList:GetCondUnitList(_targetSide, _targetCond, _unitCond, _param)
local res = {}
local u,ulist,condFunc,mode,restxt,notMe

	notMe = bitToBoolean(_unitCond//1000, 1)
	_unitCond = _unitCond % 1000
	ulist = c.GetUnitList(_targetSide, _targetCond)
	if #ulist >= 1 then
		condFunc = newFilter(self.CondFunc[_unitCond], _param)
		for i, j in ipairs(ulist) do
			u = self:GetUnit(j)
			if (not notMe) or this:ID() ~= u:ID() then
				res = condFunc(u)
			end
		end
	else
		log:write(LOG_LEVEL_INFO, 'GetCondUnitList Failed : Cond=>', _unitCond)
		return {}
	end
	return res
end

-- 条件を満たすプロセスターゲットを返す
function UnitList:GetProcessTarget(_targetSide, _ptCond, _option)
	if isFunction(self.ProcTargetCond[_ptCond]) then
		return self.ProcTargetCond[_ptCond](self, _targetSide, _option)
	end
end

function UnitList:FrameUpdate()
	for i,u in pairs(self.list) do
		if u:ID()~=this:ID() then u:FrameUpdate() end
	end
	return this:FrameUpdate()
end

UnitList.new = function()
	local obj = {}
	obj.super = UnitList
	obj.type = C_TYPE_UNIT_LIST
	obj.id = 0
	obj.name = 'units'
	obj.method = {}
	obj.method.parent = obj
	obj.list = {}
	setmetatable(obj.method,{__index = LoggingMethod})
	setmetatable(obj,{__index = obj.method, __newindex = AddLoggingMethod})
	return obj
end

-- 管理用ユニットリストのインスタンスを作成
units = UnitList.new()

----------------------------------------------------------------------------------
-- 								スコアの定義									--
--	※ひとまずスコアの基本的な操作だけまとめて、後はスコアごとに派生させる想定	--
----------------------------------------------------------------------------------
Score = {}
function Score:ID() return self.id end
function Score:Name() return self.name end
function Score:SetName(_name) if _name == nil then self.name = 'Score' else self.name = _name end end
function Score:Get() if self.cache.Get == nil then self.cache.Get = c.GetBattleScore(self.id) end return self.cache.Get end
function Score:Set(_val) self.cache.Get = nil c.SetBattleScore(self.id, _val) end
function Score:Add(_val) self.cache.Get = nil return c.AddBattleScore(self.id, _val) end
function Score:SetAOT(_val) c.SetBattleScoreAOT(self.id, _val) end
function Score:FrameUpdate() self.cache = {} end

Score.new = function(_id)
	local obj = {}
	obj.super = Score
	obj.type = C_TYPE_SCORE
	obj.id = _id
	obj.name = 'Score'
	obj.method = {}
	obj.method.parent = obj
	obj.cache = {}
	setmetatable(obj.method, {__index = LoggingMethod})
	setmetatable(obj, {__index = obj.method, __newindex = AddLoggingMethod})
	return obj
end

----------------------------------------------------------------------------------
-- 								ランクの定義									--
--				※2つのスコアを組み合わせてランク管理を実現する					--
----------------------------------------------------------------------------------
Rank = {}
function Rank:RankID() return self.rank:ID() end
function Rank:PointID() return self.point:ID() end
function Rank:Name() return self.name end
function Rank:SetName(_name) if _name == nil then _name = 'Rank' end self.name = _name Field:UpdateRankInfo(self.rank:ID(), self.point:ID(), 'name', _name) end
function Rank:SetMaxRank(_val) if _val > 0 then self.maxRank = _val Field:UpdateRankInfo(self.rank:ID(), self.point:ID(), 'maxRank', _val) end end
function Rank:SetMaxPoint(_val) if _val > 0 then self.maxPoint = _val Field:UpdateRankInfo(self.rank:ID(), self.point:ID(), 'maxPoint', _val) end end
function Rank:SetPointMap(_tbl) if isTableOrClass(_tbl) then self.pointMap = _tbl Field:UpdateRankInfo(self.rank:ID(), self.point:ID(), 'pointMap', _tbl) return true end return false end
function Rank:SetRankBonus(_tbl) if isTableOrClass(_tbl) then self.rankBonus = _tbl Field:UpdateRankInfo(self.rank:ID(), self.point:ID(), 'rankBonus', _tbl) return true end return false end
function Rank:SetRankDownPenalty(_per) self.rankDownPenalty = math.min(math.max(_per, 0), Pct100) Field:UpdateRankInfo(self.rank:ID(), self.point:ID(), 'rankDownPenalty', self.rankDownPenalty) end
function Rank:IsMultiRankUp(_bool) self.multiRankUp = toBoolean(_bool) Field:UpdateRankInfo(self.rank:ID(), self.point:ID(), 'multiRankUp', toBoolean(_bool)) end
function Rank:IsmultiRankDown(_bool) self.multiRankDown = toBoolean(_bool) Field:UpdateRankInfo(self.rank:ID(), self.point:ID(), 'multiRankDown', toBoolean(_bool)) end
function Rank:GetRank() return self.rank:Get() end
function Rank:GetPoint() return self.point:Get() * self:GetPointCoe() end
function Rank:GetPointCoe(_isRankBonus)
local coe = 1
local rank = self.rank:Get()
	if self.pointMap[rank] == nil or self.pointMap[rank] <= 0 then coe = self.pointMap_Default else coe = self.maxPoint / self.pointMap[rank] end
	if _isRankBonus and self.rankBonus[rank] ~= nil and self.rankBonus[rank] > 0 then coe = coe * (self.rankBonus[rank] + Pct100) * Per2Num end
	return coe
end
function Rank:SetAOT(_val) self.point:SetAOT(_val * self:GetPointCoe(true)) self.aot = _val Field:UpdateRankInfo(self.rank:ID(), self.point:ID(), 'aot', _val) end
function Rank:AddPoint(_val, _isRankBonus)
local beforeRank, rank, point, after, coe
	beforeRank = self.rank:Get()
	rank = beforeRank
	point = self.point:Get()
	coe = self:GetPointCoe(_isRankBonus)
	if _val == 0 or rank == nil then return false end
	after = point + (_val * coe)
	if _val > 0 then
		if after < self.maxPoint then
			self.point:Set(after)
		else
			while after >= self.maxPoint do
				if rank < self.maxRank then
					after = after - self.maxPoint
					rank = rank + 1
					self.rank:Set(rank)
					after = after / coe
					coe = self:GetPointCoe(_isRankBonus)
					after = after * coe
					if not self.multiRankUp then break end
				else
					after = self.maxPoint
					break
				end
			end
			self.point:Set(math.min(after, self.maxPoint))
		end
	else
		if after >= 0 then
			self.point:Set(after)
		else
			while after < 0 do
				if rank > 0 then
					after = after + self.maxPoint
					rank = rank - 1
					self.rank:Set(rank)
					after = after / coe
					coe = self:GetPointCoe(_isRankBonus)
					after = after * coe
					if self.rankDownPenalty > 0 then after = (Pct100 - self.rankDownPenalty) * Per2Num * self.maxPoint end
					if not self.multiRankDown then break end
				else
					after = 0
					break
				end
			end
			self.point:Set(math.max(after, 0))
		end
	end
	self:SetAOT(self.aot)
end
function Rank:PromotionRank() if self:GetRank() < self.maxRank then self.point:Set(0) self.rank:Add(1) self:SetAOT(self.aot) end end
function Rank:DemotionRank() if self:GetRank() > 0 then self.point:Set(0) self.rank:Add(-1) self:SetAOT(self.aot) end end

Rank.new = function(_rankId, _pointId)
	local obj = {}
	obj.super = Rank
	obj.type = C_TYPE_RANK
	obj.rank = Score.new(_rankId)
	obj.point = Score.new(_pointId)
	obj.maxRank = 10
	obj.maxPoint = Pct100
	obj.pointMap = {}
	obj.pointMap_Default = 10000
	obj.rankBonus = {}
	obj.rankBonus_Default = 1
	obj.aot = 10
	obj.multiRankUp = false
	obj.multiRankDown = false
	obj.rankDownPenalty = 0
	obj.id = 0
	obj.name = 'Rank'
	obj.method = {}
	obj.method.parent = obj
	setmetatable(obj.method, {__index = LoggingMethod})
	setmetatable(obj, {__index = obj.method, __newindex = AddLoggingMethod})
	return obj
end
----------------------------------------------------------------------------------
-- 									領域の定義									--
--			基本的にフィールドからインスタンスを受け取って使用する				--
----------------------------------------------------------------------------------
Collision = {}
function Collision:ID() return self.id end
function Collision:Enable() if self.cache.Enable == nil then self.cache.Enable = c.IsValidCollision(self.id) end return self.cache.Enable end
-- function Collision:SetGroupID() end
function Collision:GroupIds(_comp) local t, gt if _comp == nil then if self.cache.GroupIds == nil then t = Field:GetValue({UNIT_VALUE_COLLISION_TO_GROUP_LIST, self.id}) or {} self.cache.GroupIds = {} for i,j in pairs(t) do gt = j if not isTableOrClass(gt) then gt = {gt} end for k,l in pairs(gt) do table.insert(self.cache.GroupIds, l) end end end return self.cache.GroupIds else for i,j in pairs(self:GroupIds()) do if _comp == j then return true end end return false end end
function Collision:Groups() if self.cache.Groups == nil then self.cache.Groups = {} for i,j in pairs(self:GroupIds()) do self.cache.Groups[j] = Field:GetCollisionGroupInstance(j) end end return self.cache.Groups end
function Collision:Parent() if self.cache.Parent == nil then if self.cache.ParentId == nil then self.cache.ParentId = c.GetOwnerByCollision(self.id) end self.cache.Parent = units:GetUnit(self.cache.ParentId) end return self.cache.Parent end
function Collision:InsideTargets(_comp) if _comp == nil then if self.cache.InsideTargets == nil then self.cache.InsideTargets = {} for i,j in pairs(self:InsideTargetIds()) do table.insert(self.cache.InsideTargets, units:GetUnit(j)) end end return self.cache.InsideTargets elseif isTableOrClass(_comp) then return self:InsideTargetIds(_comp:ID()) else return false end end
function Collision:InsideTargetIds(_comp) local t if _comp == nil then if self.cache.InsideTargetIds == nil then self.cache.InsideTargetIds = c.GetTargetInCollision(self.id) end return self.cache.InsideTargetIds else t =self:InsideTargetIdDic() if isTableOrClass(t) then return toBoolean(t[_comp]) else return false end end end
function Collision:InsideTargetIdDic() if self.cache.InsideTargetIdDic == nil then self.cache.InsideTargetIdDic = tableFlip(self:InsideTargetIds(), true) end return self.cache.InsideTargetIdDic end
function Collision:InsideUnits(_comp) if _comp == nil then if self.cache.InsideUnits == nil then self.cache.InsideUnits = {} for i,j in pairs(self:InsideUnitIds()) do table.insert(self.cache.InsideUnits, units:GetUnit(j)) end end return self.cache.InsideUnits elseif isTableOrClass(_comp) then return self:InsideUnitIds(_comp:ID()) else return false end end
function Collision:InsideUnitIds(_comp) local t if _comp == nil then if self.cache.InsideUnitIds == nil then self.cache.InsideUnitIds = c.GetInCollision(self.id) end return self.cache.InsideUnitIds else t =self:InsideUnitIdDic() if isTableOrClass(t) then return toBoolean(t[_comp]) else return false end end end
function Collision:InsideUnitIdDic() if self.cache.InsideUnitIdDic == nil then self.cache.InsideUnitIdDic = tableFlip(self:InsideUnitIds(), true) end return self.cache.InsideUnitIdDic end
-- function Collision:Expire() for i,j in pairs(self:Groups()) do j:ExcludeCollision(self.id) end c.RemoveCollision(self.id) self.cache = {} end

Collision.new = function(_collisionId)
	local obj = {}
	obj.super = Collision
	obj.type = C_TYPE_COLLISION
	obj.id = _collisionId
	obj.name = 'Collision'
	obj.method = {}
	obj.method.parent = obj
	obj.cache = {}
	setmetatable(obj.method, {__index = LoggingMethod})
	setmetatable(obj, {__index = obj.method, __newindex = AddLoggingMethod})
	return obj
end

----------------------------------------------------------------------------------
-- 								領域グループの定義								--
--			基本的にフィールドからインスタンスを受け取って使用する				--
----------------------------------------------------------------------------------
CollisionGroup = {}
function CollisionGroup:ID() return self.id end
function CollisionGroup:Collisions() return self.list end
function CollisionGroup:IsIncluded(coll) return toBoolean(self.dict[coll:ID()]) end
function CollisionGroup:ExcludeCollision(coll) local collId = coll:ID() if self:IsIncluded(coll) and this:ID() == coll:Parent():ID() then self.cache = {} Field:SetValue({UNIT_VALUE_COLLISION_GROUP_INFO, self.id, this:ID()}, arrayRemove(Field:GetValue({UNIT_VALUE_COLLISION_GROUP_INFO, self.id, this:ID()}) or {}, function(_t,_k) return _t[_k] ~= collId end)) Field:SetValue({UNIT_VALUE_COLLISION_TO_GROUP_LIST, collId, this:ID()}, arrayRemove(Field:GetValue({UNIT_VALUE_COLLISION_TO_GROUP_LIST, collId, this:ID()}) or {}, function(_t,_k) return _t[_k] ~= self.id end)) self.list = arrayRemove(self.list, function(_t,_k) return (_t[_k]):ID() ~= collId end) self.dict[collId] = nil end end
function CollisionGroup:ExcludeCollisions(colls) local flag = false local collId, t1, t2 for i,coll in pairs(colls) do if self:IsIncluded(coll) and this:ID() == coll:Parent():ID() then collId = coll:ID() if not flag then self.cache = {} t1, t2 = Field:GetValue({UNIT_VALUE_COLLISION_GROUP_INFO, self.id, this:ID()}) or {}, Field:GetValue({UNIT_VALUE_COLLISION_TO_GROUP_LIST, collId, this:ID()}) or {} flag = true end t1 = arrayRemove(t1, function(_t,_k) return _t[_k] ~= collId end) t2 = arrayRemove(t2, function(_t,_k) return _t[_k] ~= self.id end) self.list = arrayRemove(self.list, function(_t,_k) return (_t[_k]):ID() ~= collId end) self.dict[collId] = nil end end if flag then Field:SetValue({UNIT_VALUE_COLLISION_GROUP_INFO, self.id, this:ID()}, t1) Field:SetValue({UNIT_VALUE_COLLISION_TO_GROUP_LIST, collId, this:ID()}, t2) end end
function CollisionGroup:AddCollision(coll) if coll:Enable() and not self:IsIncluded(coll) and this:ID() == coll:Parent():ID() then self.cache = {} local t, t2 =  Field:GetValue({UNIT_VALUE_COLLISION_GROUP_INFO, self.id, this:ID()}) or {}, Field:GetValue({UNIT_VALUE_COLLISION_TO_GROUP_LIST, coll:ID(), this:ID()}) or {} table.insert(t, coll:ID()) table.insert(t2, self.id) Field:SetValue({UNIT_VALUE_COLLISION_GROUP_INFO, self.id, this:ID()}, t) Field:SetValue({UNIT_VALUE_COLLISION_TO_GROUP_LIST, coll:ID(), this:ID()}, t2) table.insert(self.list, coll) self.dict[coll:ID()] = true return true else return false end end
function CollisionGroup:InsideTargets(_comp) if _comp == nil then if self.cache.InsideTargets == nil then self.cache.InsideTargets = {} for i,j in pairs(self:InsideTargetIds()) do table.insert(self.cache.InsideTargets, units:GetUnit(j)) end end return self.cache.InsideTargets elseif isTableOrClass(_comp) then return self:InsideTargetIds(_comp:ID()) else return false end end
function CollisionGroup:InsideTargetIds(_comp) local t if _comp == nil then if self.cache.InsideTargetIds == nil then self.cache.InsideTargetIds = tableKeys(self:InsideTargetIdDic()) end return self.cache.InsideTargetIds else t =self:InsideTargetIdDic() if isTableOrClass(t) then return toBoolean(t[_comp]) else return false end end end
function CollisionGroup:InsideTargetIdDic() local t if self.cache.InsideTargetIdDic == nil then t = {} for i,j in pairs(self.list) do for k,l in pairs(j:InsideTargetIds()) do t[l] = true end end self.cache.InsideTargetIdDic = t end return self.cache.InsideTargetIdDic end
function CollisionGroup:InsideUnits(_comp) if _comp == nil then if self.cache.InsideUnits == nil then self.cache.InsideUnits = {} for i,j in pairs(self:InsideUnitIds()) do table.insert(self.cache.InsideUnits, units:GetUnit(j)) end end return self.cache.InsideUnits elseif isTableOrClass(_comp) then return self:InsideUnitIds(_comp:ID()) else return false end end
function CollisionGroup:InsideUnitIds(_comp) local t if _comp == nil then if self.cache.InsideUnitIds == nil then self.cache.InsideUnitIds = tableKeys(self:InsideUnitIdDic()) end return self.cache.InsideUnitIds else t =self:InsideUnitIdDic() if isTableOrClass(t) then return toBoolean(t[_comp]) else return false end end end
function CollisionGroup:InsideUnitIdDic() local t if self.cache.InsideUnitIdDic == nil then t = {} for i,j in pairs(self.list) do for k,l in pairs(j:InsideUnitIds()) do t[l] = true end end self.cache.InsideUnitIdDic = t end return self.cache.InsideUnitIdDic end
function CollisionGroup:Expire() for i,j in pairs(self.list) do j:Expire() end self.cache = {} end

CollisionGroup.new = function(_id)
	local coll
	local t = {}
	local obj = {}
	obj.super = CollisionGroup
	obj.type = C_TYPE_COLLISION_GROUP
	obj.id = _id
	obj.name = 'CollisionGroup'
	obj.list = {}
	obj.dict = {}
	for i,j in pairs(Field:GetValue({UNIT_VALUE_COLLISION_GROUP_INFO, _id}) or {}) do
		for k,l in pairs(isTableOrClass(j) and j or {}) do
			coll = Field:GetCollisionInstance(l)
			if coll:Enable() then
				table.insert(obj.list, coll)
				obj.dict[coll:ID()] = true
			else
				table.insert(t, coll)
			end
		end
	end
	obj.method = {}
	obj.method.parent = obj
	obj.cache = {}
	setmetatable(obj.method, {__index = LoggingMethod})
	setmetatable(obj, {__index = obj.method, __newindex = AddLoggingMethod})
	-- マルチ対応のためごみ掃除
	obj:ExcludeCollisions(t)
	return obj
end

----------------------------------------------------------------------------------
-- 								フィールドの定義								--
-- 				FrameUpdateを一本化するために、定義だけはここでやる				--
----------------------------------------------------------------------------------
Field = {}
Field.type = C_TYPE_FIELD
Field.id = 0
Field.name = 'Field'
Field.method = {}
Field.method.parent = Field
Field.cache = {}
Field.qod = c.GetQuestOptionDifficulty()
setmetatable(Field,{__index = Field.method, __newindex = AddLoggingMethod})

function Field:GetSummonSkill() if self.cache.GetSummonSkill == nil then self.cache.GetSummonSkill = units:GetDummyUnit():GetSkill(SKILL_SUMMON, 1) end return self.cache.GetSummonSkill end
function Field:GetPersonalSkillId(unitDressId, index) if self.cache.GetPersonalSkillId == nil then self.cache.GetPersonalSkillId = {} end if self.cache.GetPersonalSkillId[unitDressId] == nil then self.cache.GetPersonalSkillId[unitDressId] = c.GetMasterInfo(MASTER_UNIT_DRESS, unitDressId, UNIT_DRESS_MST_INFO_PERSONAL_SKILL_ID) end return self.cache.GetPersonalSkillId[unitDressId][index] end
function Field:GetUnitDressGroupInfo(unitDressId) if self.cache.GetUnitDressGroupInfo == nil then self.cache.GetUnitDressGroupInfo = {} end if self.cache.GetUnitDressGroupInfo[unitDressId] == nil then self.cache.GetUnitDressGroupInfo[unitDressId] = c.GetMasterInfo(MASTER_UNIT_DRESS, unitDressId, UNIT_DRESS_MST_INFO_GROUP_INFO) end return self.cache.GetUnitDressGroupInfo[unitDressId] end
function Field:GetSkillInfo(skillId) if self.cache.GetSkillInfo == nil then self.cache.GetSkillInfo = {} end if self.cache.GetSkillInfo[skillId] == nil then self.cache.GetSkillInfo[skillId] = c.GetMasterInfo(MASTER_SKILL, skillId) end return self.cache.GetSkillInfo[skillId] end
function Field:GetBuffMstInfo(buffId) if self.cache.GetBuffMstInfo == nil then self.cache.GetBuffMstInfo = {} end if self.cache.GetBuffMstInfo[buffId] == nil then self.cache.GetBuffMstInfo[buffId] = c.GetMasterInfo(MASTER_BUFF, buffId) end return self.cache.GetBuffMstInfo[buffId] end
function Field:GetItemMaterialInfo(itemId, maxItemId) return c.GetUserInfo(USER_INFO_ITEM_MATERIAL, itemId, maxItemId) end
function Field:GetOrnamentManageMstInfo(ornamentManageId) if self.cache.GetOrnamentManageMstInfo == nil then self.cache.GetOrnamentManageMstInfo = {} end if self.cache.GetOrnamentManageMstInfo[ornamentManageId] == nil then self.cache.GetOrnamentManageMstInfo[ornamentManageId] = c.GetMasterInfo(MASTER_ORNAMENT_MANAGE, ornamentManageId) end return self.cache.GetOrnamentManageMstInfo[ornamentManageId] end
 -- Ornamentマスタは今は使わないので空に
function Field:GetOrnamentMstInfo(ornamentId) return {} end
function Field:GetOrnamentPosLotteryMstInfo(ornamentPosLotteryId) if self.cache.GetOrnamentPosLotteryMstInfo == nil then self.cache.GetOrnamentPosLotteryMstInfo = {} end if self.cache.GetOrnamentPosLotteryMstInfo[ornamentPosLotteryId] == nil then self.cache.GetOrnamentPosLotteryMstInfo[ornamentPosLotteryId] = c.GetMasterInfo(MASTER_ORNAMENT_POS_LOTTERY, ornamentPosLotteryId) end return self.cache.GetOrnamentPosLotteryMstInfo[ornamentPosLotteryId] end
function Field:GetBattlePosMstInfo(battlePosId) if self.cache.GetBattlePosMstInfo == nil then self.cache.GetBattlePosMstInfo = {} end if self.cache.GetBattlePosMstInfo[battlePosId] == nil then self.cache.GetBattlePosMstInfo[battlePosId] = c.GetMasterInfo(MASTER_BATTLE_POS, battlePosId) end return self.cache.GetBattlePosMstInfo[battlePosId] end
function Field:GetSwitchInfo(switchId, _maxSwitchId) if _maxSwitchId == nil or _maxSwitchId < switchId then _maxSwitchId = switchId end return (c.GetUserInfo(USER_INFO_SWITCH, switchId, _maxSwitchId)==1) end
function Field:GetOptionInfo(optionId) if self.cache.GetOptionInfo == nil then self.cache.GetOptionInfo = {} end if self.cache.GetOptionInfo[optionId] == nil then self.cache.GetOptionInfo[optionId] = c.GetUserInfo(USER_INFO_OPTION, optionId) end return self.cache.GetOptionInfo[optionId] end
function Field:GetBgmVolume() return self:GetOptionInfo(OPTION_INFO_BGM_VOL) end
function Field:GetSeVolume() return self:GetOptionInfo(OPTION_INFO_SE_VOL) end
function Field:GetVoiceVolume() return self:GetOptionInfo(OPTION_INFO_VOICE_VOL) end
function Field:GetWorldInfo(questId) if self.cache.GetWorldInfo == nil then self.cache.GetWorldInfo = {} end if self.cache.GetWorldInfo[questId] == nil then self.cache.GetWorldInfo[questId] = c.GetMasterInfo(MASTER_WORLD, questId) end return self.cache.GetWorldInfo[questId] end
function Field:GetLandInfo(questId) if self.cache.GetLandInfo == nil then self.cache.GetLandInfo = {} end if self.cache.GetLandInfo[questId] == nil then self.cache.GetLandInfo[questId] = c.GetMasterInfo(MASTER_LAND, questId) end return self.cache.GetLandInfo[questId] end
function Field:GetAreaInfo(questId) if self.cache.GetAreaInfo == nil then self.cache.GetAreaInfo = {} end if self.cache.GetAreaInfo[questId] == nil then self.cache.GetAreaInfo[questId] = c.GetMasterInfo(MASTER_AREA, questId) end return self.cache.GetAreaInfo[questId] end
function Field:GetDungeonInfo(questId) if self.cache.GetDungeonInfo == nil then self.cache.GetDungeonInfo = {} end if self.cache.GetDungeonInfo[questId] == nil then self.cache.GetDungeonInfo[questId] = c.GetMasterInfo(MASTER_DUNGEON, questId) end return self.cache.GetDungeonInfo[questId] end
function Field:GetQuestInfo(questId) questId = questId or self:QuestID() if self.cache.GetQuestInfo == nil then self.cache.GetQuestInfo = {} end if self.cache.GetQuestInfo[questId] == nil then self.cache.GetQuestInfo[questId] = c.GetMasterInfo(MASTER_QUEST, questId) end return self.cache.GetQuestInfo[questId] end
function Field:QuestOptionDifficulty()  if self.qod == nil then self.qod = c.GetQuestOptionDifficulty() end return self.qod end
function Field:GetQuestDefeatCount()  if self.cache.GetQuestDefeatCount == nil then self.cache.GetQuestDefeatCount = tableGetValue(c.GetMissionSeedInfo(33), 1) or 0 end return self.cache.GetQuestDefeatCount end
function Field:GetUiMsg(uiMsgId) if self.cache.GetUiMsg == nil then self.cache.GetUiMsg = {} end if self.cache.GetUiMsg[uiMsgId] == nil then self.cache.GetUiMsg[uiMsgId] = c.GetUiMsg(uiMsgId) end return self.cache.GetUiMsg[uiMsgId] end
function Field:Wave() if self.cache.Wave == nil then self.cache.Wave = c.GetWaveCount() end return self.cache.Wave end
function Field:MaxWave() if self.cache.MaxWave == nil then self.cache.MaxWave = c.GetMaxWave() end return self.cache.MaxWave end
-- GetBossの下位互換だが、互換性維持のために残す
function Field:IsBoss()
	if self.cache.IsBoss == nil then
		for i,u in ipairs(units:GetCondUnitList(this:Side()==UNIT_ALLY and TARGET_SIDE_OPPONENT or TARGET_SIDE_ALLY, TARGET_COND_ALL, UNIT_COND_NONE)) do
			if u:IsBoss() then self.cache.IsBoss = true end
		end
		if self.cache.IsBoss == nil then self.cache.IsBoss = false end
	end
	return self.cache.IsBoss
end
function Field:GetBoss()
	if self.cache.GetBoss == nil then
		for i,u in ipairs(units:GetCondUnitList(this:Side()==UNIT_ALLY and TARGET_SIDE_OPPONENT or TARGET_SIDE_ALLY, TARGET_COND_ALL, UNIT_COND_NONE)) do
			if u:IsBoss() then self.cache.GetBoss = u end
		end
		if self.cache.GetBoss == nil then self.cache.GetBoss = false end
	end
	return self.cache.GetBoss
end
function Field:IsPvP() return (isArena or isGvG) end
function Field:IsGvG() return isGvG end
function Field:IsBattleGraph() if self.cache.QuestType == nil then self.cache.QuestType = c.GetQuestType() end return self.cache.QuestType == QUEST_TYPE_BATTLE_GRAPH end
function Field:IsMulti() if self.cache.IsMulti == nil then self.cache.IsMulti = c.IsMultiPlay() end return self.cache.IsMulti end
function Field:LoadChara(_charaID) c.LoadCharacter(_charaID) end
function Field:LoadSkill(skillID) c.PreloadSkill(skillID) end
function Field:LoadUI(_uiName) self.cache.IsLoadedUI = nil c.LoadUI(_uiName) end
function Field:IsLoadedUI(_uiName) if self.cache.IsLoadedUI == nil then self.cache.IsLoadedUI = {} end if self.cache.IsLoadedUI[_uiName] == nil then self.cache.IsLoadedUI[_uiName] = c.IsLoadedUI(_uiName) end return self.cache.IsLoadedUI[_uiName] end
function Field:SetBossFlag(_t, _isBoss) self.cache.IsBoss = nil self.cache.GetBoss = nil _t:SetBoss(_isBoss) end
function Field:ShowBossGauge(_show) if _show and self:GetBoss() and self:GetBoss():Alive() and not self:GetBoss():IsExcluded() then c.ChangeBossGaugeOwner(self:GetBoss():ID()) elseif not _show and self:GetBoss() then c.HideBossGauge(self:GetBoss():ID()) end end
function Field:HpBreakCount() if self.cache.HpBreakCount == nil then self.cache.HpBreakCount = c.GetHpBreakCount() end return self.cache.HpBreakCount end
function Field:GetBuffInfo(buffUID) if self.cache.GetBuffInfo == nil then self.cache.GetBuffInfo = {} end if self.cache.GetBuffInfo[buffUID] == nil then self.cache.GetBuffInfo[buffUID] = c.GetBuffInfo(buffUID) end return self.cache.GetBuffInfo[buffUID] end
function Field:IsSkillActive(PUID) if self.cache.IsSkillActive == nil then self.cache.IsSkillActive = c.IsSkillActive(PUID) end return self.cache.IsSkillActive end
function Field:QuestID() if self.cache.QuestID == nil then self.cache.QuestID = c.GetQuestID() end return self.cache.QuestID end
function Field:Terrain() if self.cache.Terrain == nil then self.cache.Terrain = (c.GetTerrain()) end return self.cache.Terrain end
function Field:BgTerrain() if self.cache.BgTerrain == nil then self.cache.BgTerrain = c.GetBgTerrain() end return self.cache.BgTerrain end
function Field:OrnamentManageID() if self.cache.OrnamentManageID == nil then self.cache.OrnamentManageID = c.GetOrnamentManageID() end return self.cache.OrnamentManageID end
function Field:Time() if self.cache.Time == nil then self.cache.Time = math.floor(c.GetWaveTime() * OneSec) end return self.cache.Time end
function Field:LimitTime() if self.cache.LimitTime == nil then self.cache.LimitTime = math.floor(c.GetTimerValue() * OneSec) end return self.cache.LimitTime end
function Field:AutoBattleInfo() if self.cache.AutoBattleInfo == nil then self.cache.AutoBattleInfo = c.GetAutoBattleInfo() end return self.cache.AutoBattleInfo end
function Field:IsAdvSkip() if self.cache.IsAdvSkip == nil then self.cache.IsAdvSkip = c.GetAdvSkip() end return self.cache.IsAdvSkip end
function Field:IsDrawTextBusy() if self.cache.IsDrawTextBusy == nil then self.cache.IsDrawTextBusy = c.IsDrawTextBusy() end return self.cache.IsDrawTextBusy end
function Field:GetItemDropTableCount() if self.cache.GetItemDropTableCount == nil then self.cache.GetItemDropTableCount = c.GetItemDropTableCount() end return self.cache.GetItemDropTableCount end
function Field:OS_Year() if self.cache.OS_Year == nil then self:OS_DateTime_Cache() end return self.cache.OS_Year end
function Field:OS_Month() if self.cache.OS_Month == nil then self:OS_DateTime_Cache() end return self.cache.OS_Month end
function Field:OS_Day() if self.cache.OS_Day == nil then self:OS_DateTime_Cache() end return self.cache.OS_Day end
function Field:OS_Hour() if self.cache.OS_Hour == nil then self:OS_DateTime_Cache() end return self.cache.OS_Hour end
function Field:OS_Minute() if self.cache.OS_Minute == nil then self:OS_DateTime_Cache() end return self.cache.OS_Minute end
function Field:OS_Second() if self.cache.OS_Second == nil then self:OS_DateTime_Cache() end return self.cache.OS_Second end
function Field:OS_Weekday() if self.cache.OS_Weekday == nil then self:OS_DateTime_Cache() end return self.cache.OS_Weekday end
function Field:OS_DateTime_Cache() self.cache.OS_Year, self.cache.OS_Month, self.cache.OS_Day, self.cache.OS_Hour, self.cache.OS_Minute, self.cache.OS_Second, self.cache.OS_Weekday = c.GetDateTime() end
function Field:Zel() if self.cache.Zel == nil then self.cache.Zel = (c.GetTotalZel()) end return self.cache.Zel end
function Field:SetValue(_key, _val, _ever) return c.UnitSetLuaValue(nil, _key, _val, _ever) end
function Field:CalcValue(_key, _val, _calc, _ever) return calculateCS(_calc, _val, c.UnitCalcLuaValue, {nil, _key, _val, _calc, _ever}, 4, 3, c.UnitGetLuaValue, {nil, _key}) end
function Field:GetValue(_key) return c.UnitGetLuaValue(nil, _key) end
function Field:SetGeneralInfo(_index, _bool, _ever, _isParty) local _side = _isParty and this:Side() or TARGET_SIDE_ALL local t = self:GetValue(UNIT_VALUE_GENERAL_INFO) or {} if t[_side] == nil then t[_side] = {} end t[_side][_index] = _bool self:SetValue(UNIT_VALUE_GENERAL_INFO, t, false) if _ever then t = self:GetValue(UNIT_VALUE_GENERAL_INFO_EVER) or {} if t[_side] == nil then t[_side] = {} end t[_side][_index] = _bool self:SetValue(UNIT_VALUE_GENERAL_INFO_EVER, t, true) end end
function Field:GetGeneralInfo(_index) local _side = this:Side() local t = self:GetValue(UNIT_VALUE_GENERAL_INFO) or {} t[TARGET_SIDE_ALL], t[_side] = t[TARGET_SIDE_ALL] or {}, t[_side] or {} if t[TARGET_SIDE_ALL][_index] == nil and t[_side][_index] == nil then t = self:GetValue(UNIT_VALUE_GENERAL_INFO_EVER) or {} if t[TARGET_SIDE_ALL] == nil and t[_side] == nil then return nil else t[TARGET_SIDE_ALL], t[_side] = t[TARGET_SIDE_ALL] or {}, t[_side] or {} end if t[TARGET_SIDE_ALL][_index] ~= nil then self:SetGeneralInfo(_index, t[TARGET_SIDE_ALL][_index]) end if t[_side][_index] ~= nil then self:SetGeneralInfo(_index, t[_side][_index], false, true) end end return toBoolean(t[TARGET_SIDE_ALL][_index] or t[_side][_index]) end
function Field:CallScript(_func, ...) c.CallBattleScript(_func, ...) end
function Field:CallScriptAsync(_func, ...) c.CallBattleScriptAsync(_func, ...) end
function Field:MakeNewRank(_rankId, _pointId)
local obj
	if self.cache.RankList ~= nil and self.cache.RankList[_rankId] ~= nil and self.cache.RankList[_rankId][_pointId] ~= nil then log:write(LOG_LEVEL_INFO,  'MakeNewRank Duplicated : RankId=>', _rankId, ' PointId=>', _pointId, ' RankInfo=>', self.cache.RankList) return false end
	if self.cache.RankList == nil then self.cache.RankList = {} end
	if self.cache.RankList[_rankId] == nil then self.cache.RankList[_rankId] = {} end
	obj = Rank.new(_rankId, _pointId)
	self.cache.RankList[_rankId][_pointId] = obj
	if self.cache.RankInfo == nil then self.cache.RankInfo = {} end
	if self.cache.RankInfo[_rankId] == nil then self.cache.RankInfo[_rankId] = {} end
	if self.cache.RankInfo[_rankId][_pointId] == nil then self.cache.RankInfo[_rankId][_pointId] = {} end
	this:SetValue(UNIT_VALUE_RANK_INFO, self.cache.RankInfo, true)
	return obj
end
function Field:GetScore(_scoreId) if self.cache.GetScore == nil then self.cache.GetScore = {} end if self.cache.GetScore[_scoreId] == nil then self.cache.GetScore[_scoreId] = Score.new(_scoreId) end return self.cache.GetScore[_scoreId] end
function Field:GetRank(_rankId, _pointId)
	if self.cache.RankList == nil or self.cache.RankList[_rankId] == nil or self.cache.RankList[_rankId][_pointId] == nil then return nil end
	return self.cache.RankList[_rankId][_pointId]
end
function Field:UpdateRankInfo(_rankId, _pointId, _key, _value)
	if self.cache.RankInfo == nil or self.cache.RankInfo[_rankId] == nil or self.cache.RankInfo[_rankId][_pointId] == nil then log:write(LOG_LEVEL_WARNING,  'UpdateRankInfo Failed : RankId=>', _rankId, ' PointId=>', _pointId, ' Key=>', _key, ' Value=>', _value, ' RankInfo=>', self.cache.RankInfo) return false end
	self.cache.RankInfo[_rankId][_pointId][_key] = _value
	this:SetValue(UNIT_VALUE_RANK_INFO, self.cache.RankInfo, true)
end
function Field:GetCollisionInstance(collId)
	if self.cache.CollisionList == nil then self.cache.CollisionList = {} end
	if self.cache.CollisionList[collId] == nil then self.cache.CollisionList[collId] = Collision.new(collId) end
	return self.cache.CollisionList[collId]
end
function Field:GetCollisionGroupInstance(groupId)
	if self.cache.CollisionGroupList == nil then self.cache.CollisionGroupList = {} end
	if self.cache.CollisionGroupList[groupId] == nil then self.cache.CollisionGroupList[groupId] = CollisionGroup.new(groupId) end
	return self.cache.CollisionGroupList[groupId]
end
function Field:RankFrameUpdate()
local obj
local tbl = this:GetValue(UNIT_VALUE_RANK_INFO)
	if isTableOrClass(tbl) then
		if self.cache.RankList == nil then self.cache.RankList = {} end
		for i,j in pairs(tbl) do
			if isTableOrClass(j) then
				if self.cache.RankList[i] == nil then self.cache.RankList[i] = {} end
				for k,l in pairs(j) do
					if isTableOrClass(l) then
						obj = Rank.new(i, k)
						for m,n in pairs(l) do
							obj[m] = n
						end
						self.cache.RankList[i][k] = obj
					end
				end
			end
		end
	end
	self.cache.RankInfo = tbl
end
-- FrameUpdateはさらに下位のライブラリで個別定義(※最低限動くが、必ず再定義すること！)
function Field:FrameUpdate()
	self.cache = {}
	log:FrameUpdate()
	units:FrameUpdate()
	-- self:RankFrameUpdate() 20240827パフォーマンス改善№5によりコメントアウト(再使用時は解除予定)
end
