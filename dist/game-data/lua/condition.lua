require 'procCondCommon'
-- 条件判定関数
-- target : 対象ユニットの識別子
-- params : 条件パラメータ（数値の配列）
-- paramsの添え字は 1～5 です。 0 からではありません

-- プロセストリガタイプ
PROCESS_TRIGTYPE_ALL = 0
PROCESS_TRIGTYPE_SKILL = 10
PROCESS_TRIGTYPE_PASSIVE = 11

-- 条件判定関数にログを仕込む関数
-- SetCondLog(条件判定関数名)を呼ぶと、以降ログが出力されるようになる
function SetCondLog(_fname) local _f = _G[_fname] _G[_fname] = function(_target, _params) local res = {_f(_target, _params)} local params if LOG_LEVEL >= LOG_LEVEL_INFO then params = log:format(table.unpack(_params)) log:write(LOG_LEVEL_INFO, 'Conditon ', _fname, ' : Target=>', target:Name(), '(', target:ID(), ')', params~='' and ' Param=>' .. params or '', ' Return=>', log:format(table.unpack(res))) end return table.unpack(res) end end

-- リリース時にはログを出力しないように
-- function SetCondLog(_fname) end


-- プロセスパラメータINDEXを取り出す(※最大6つ)
function GetProcParamIndex(_n)
local res = {}
	res[1] = _n&15
	if _n > 15 then res[2] = (_n&240)>>4
	if _n > 255 then res[3] = (_n&3840)>>8
	if _n > 4095 then res[4] = (_n&61440)>>12
	if _n > 65535 then res[5] = (_n&983040)>>16
	if _n > 1048575 then res[6] = (_n&15728640)>>20
	end end end end end
	log:write(LOG_LEVEL_INFO, 'Conditon GetProcParamIndex : Param=>' , _n, ' Return=>', log:format(res))
	return res
end

-- プロセスパラメータを取り出す(※最大6つ)
function GetProcParamArray(_n)
local res = {}
	if _n > 0 then res[1] = Process:Param(_n&15)
	if _n > 15 then res[2] = Process:Param((_n&240)>>4)
	if _n > 255 then res[3] = Process:Param((_n&3840)>>8)
	if _n > 4095 then res[4] = Process:Param((_n&61440)>>12)
	if _n > 65535 then res[5] = Process:Param((_n&983040)>>16)
	if _n > 1048575 then res[6] = Process:Param((_n&15728640)>>20)
	end end end end end end
	log:write(LOG_LEVEL_INFO, 'Conditon GetProcParamArray : Param=>' , _n, ' Return=>', log:format(res))
	return res
end

-- プロセスパラメータを取り出す
function GetProcParamArray2(_n, zeroDef, freeParam, ubound)
local res = bitSplitArray(_n, 4, ubound)
local res2 = copyTable(res)
	if not isTableOrClass(freeParam) then freeParam = {} end
	if not isTableOrClass(zeroDef) then zeroDef = {} end
	for i,j in ipairs(res) do
		if j == 0 then
			if zeroDef[i] then res[i] = zeroDef[i] end
		elseif j > 10 then
			if isTableOrClass(freeParam[i]) then
				res[i] = (freeParam[i][j - 10]) or 0
			else
				res[i] = (freeParam[j - 10]) or 0
			end
		else
			res[i] = Process:Param(j)
		end
	end
	log:write(LOG_LEVEL_INFO, 'Conditon GetProcParamArray2 : Param=>' , _n, ' freeParam=>', log:format(freeParam), ' Return=>', log:format(res), ' ,', log:format(res2))
	return res,res2
end

-- プロセスパラメータINDEXのリストからパラメータを取り出し、指定した値と等しいものがあるか判定
-- _argにクラス、_funcNameにメソッド名を渡した場合、取り出したパラメータをメソッドに渡し、nilまたはfalse以外の値が返ってくれば真となる
-- _useZeroをtrueにした場合、0=無条件→0もタイプの1つとして比較するように振る舞いが変わる
function CompareFromProcParamIndex(_ppiList, _arg, _funcName, _useZero)
	if _funcName~=nil then
		for i,j in pairs(_ppiList) do
			if j~=0 then
				if not _useZero and Process:Param(j) == 0 then
					return (i == 1)
				else
					if _arg[_funcName](_arg, Process:Param(j)) then
						return true
					end
				end
			end
		end
	else
		for i,j in pairs(_ppiList) do
			if j~=0 then
				if not _useZero and Process:Param(j) == 0 then
					return (i == 1)
				else
					if Process:Param(j) == _arg then
						return true
					end
				end
			end
		end
	end
	return false
end

-- 対象がプロセス発動に適切か
-- _this	:バレットまたはプロセスの発動者
-- _target	:バレットまたはプロセスの対象
-- _param	:プロセスの敵・味方条件
function IsValidTarget(_this, _target, _param)
	if _param==TARGET_SIDE_ALL then
		return true
	else
		if _this:IsDummy() or _target:IsDummy() then return false end
		return _param==(_this:Side()==_target:Side() and TARGET_SIDE_ALLY or TARGET_SIDE_OPPONENT)
	end
end

-- プロセス系トリガーのバフチェック
-- _trigType :スキルorパッシブ
-- _category :トリガーとなったプロセスカテゴリ
function ProcessCategoryCheck(_trigType, _category)
local flag = false
	if _trigType ~= PROCESS_TRIGTYPE_ALL then
		for i,j in ipairs(TrigProc:Category()) do
			if j == _trigType then flag = true break end
		end
		if not flag then return false end
		flag = false
	end
	if _category==PROCESS_CATEGORY_BUFF then
		for i,j in ipairs(TrigProc:Buffs()) do
			if j[BUFF_INFO_TYPE] % 2 == BUFF_TYPE_BUFF then
				flag = true
				break
			end
		end
		return flag
	elseif _category==PROCESS_CATEGORY_DEBUFF then
		for i,j in ipairs(TrigProc:Buffs()) do
			if j[BUFF_INFO_TYPE] % 2 == BUFF_TYPE_DEBUFF then
				flag = true
				break
			end
		end
		return flag
	elseif _category==PROCESS_CATEGORY_DEBUFF_ELEMENT then
		for i,j in ipairs(TrigProc:Behav()) do
			if j==PARAM_BEHAV_VAL then
				if TrigProc:Param(i)>0 then return false elseif TrigProc:Param(i)<0 then flag = true end
			end
		end
		return flag
	end
	return true
end

-- 残りHPがパーティ内で最も少ないユニットを返す
-- ※全員残りHPが同じ(開幕など)なら、自分を返す
function TargetHpMin(_target, params)
Field:FrameUpdate(_target)
local t = this
	for i,u in pairs(units:GetCondUnitList(TARGET_SIDE_ALLY, TARGET_COND_ALIVE, UNIT_COND_NONE)) do
		if u:PerHP() < t:PerHP() then t = u end
	end
	return t:ID()
end
SetCondLog('TargetHpMin')

-- 自分の残りHP割合が条件を満たしているか
-- params[1]:HP条件MIN(％)
-- params[2]:HP条件MAX(％)
function OwnerHpCond(_target, params)
Field:FrameUpdate(_target)
local nowHp = this:PerHP() * Pml2Pct
	return params[1] <= nowHp and (params[2] == 0 or nowHp <= params[2])
end
SetCondLog('OwnerHpCond')

-- 発動者MP条件
-- params[1]:MP条件MIN(％)
-- params[2]:MP条件MAX(％)
function OwnerMpCond(_target, params)
Field:FrameUpdate(_target)
local nowMp = this:PerMP() * Pml2Pct
	return params[1] <= nowMp and (params[2] == 0 or nowMp <= params[2])
end
SetCondLog('OwnerMpCond')

-- 自分に特定IDのバフが掛かっているか
-- params[1]:バフID
function OwnerBuffIDCond(_target, params)
Field:FrameUpdate(_target)
	return this:IsBuff(params[1])
end
SetCondLog('OwnerBuffIDCond')

-- 発動者特定バフカテゴリ
-- params[1]:バフカテゴリ
function OwnerBuffCategoryCond(_target, params)
Field:FrameUpdate(_target)
	return this:IsBuffCategory(params[1])
end
SetCondLog('OwnerBuffCategoryCond')

-- 対象に特定IDのバフが掛かっているか
-- params[1]:バフID
function TargetBuffIDCond(_target, params)
Field:FrameUpdate(_target)
	return target:IsBuff(params[1])
end
SetCondLog('TargetBuffIDCond')

-- 対象特定バフカテゴリ
-- params[1]:バフカテゴリ
function TargetBuffCategoryCond(_target, params)
Field:FrameUpdate(_target)
	return target:IsBuffCategory(params[1])
end
SetCondLog('TargetBuffCategoryCond')

-- 対象はこのバレットでノックバックさせることができるか
function TargetCanKB(_target, params)
Field:FrameUpdate(_target)
	return Bullet:CanKB()
end
SetCondLog('TargetCanKB')

-- 対象のY位置がp1以上
function TargetPosY(_target, params)
Field:FrameUpdate(_target)
	return target:PosY() >= params[1] * 1000
end
SetCondLog('TargetPosY')

-- 炎の暴走
function CrazyFlame(_target, params)
Field:FrameUpdate(_target)
	return this:GetValue(UNIT_VALUE_CRAZY_FLAME) or false
end
SetCondLog('CrazyFlame')

-- 吸い込んだ相手を返す
function WhoAreInhaled(_target, params)
Field:FrameUpdate(_target)
	return math.tointeger(this:GetValue(UNIT_VALUE_GRAND_WORM_INHALE)) or false
end
SetCondLog('WhoAreInhaled')

-- ターゲットから除外/復帰
function TargetExclude(_target, params)
local frame
	Field:FrameUpdate(_target)
	if params[2] > 0 then frame = params[2] end
	this:SetExclude((params[1]==1), frame)
	return true
end
SetCondLog('TargetExclude')

-- 地面の高さを設定
function GroundHeight(_target, params)
	Field:FrameUpdate(_target)
	if params[1] >= 0 then this:SetGroundY(params[1]) end
	return true
end
SetCondLog('GroundHeight')

-- ターゲットマーカー表示
-- params[1]:表示/非表示
function ShowTargetMarker(_target, params)
	Field:FrameUpdate(_target)
	this:ShowMarker(params[1]>0)
	return true
end
SetCondLog('ShowTargetMarker')

-- 敵パーティが全滅している
function AllOpponentDead(_target, params)
local ulist
	Field:FrameUpdate(_target)
	ulist = units:GetCondUnitList(TARGET_SIDE_OPPONENT, TARGET_COND_ALIVE, UNIT_COND_NONE)
	return (#ulist==0)
end
SetCondLog('AllOpponentDead')

-- 生成した乱数と指定した値が一致しているか？
-- 全てほぼ同時に呼び出す前提
-- params[1]:乱数を生成するか？
-- params[2]:乱数MIN
-- params[3]:乱数MAX
-- params[4]:指定値
-- params[5]:指定値(最大値拡張)
function RandBetween(_target, params)
local val
	Field:FrameUpdate(_target)
	if params[1] > 0 then this:SetValue(UNIT_VALUE_RAND_BETWEEN_PLIST, SyncedRandom(params[2], params[3])) end
	if params[5] == 0 then params[5] = params[4] end
	val = this:GetValue(UNIT_VALUE_RAND_BETWEEN_PLIST)
	return (val>=params[4] and val<=params[5])
end
SetCondLog('RandBetween')

-- 対象の状態
-- params[1]:生存状態条件
function TargetSituation(_target, params)
Field:FrameUpdate(_target)
	return (params[1]==0 and target:Alive()) or (params[1]==1 and not target:Alive())
end
SetCondLog('TargetSituation')

-- ターゲットを累加的に拡大/縮小
-- params[1]:スケール加算値(万分率)
function AddScale(_target, params)
Field:FrameUpdate(_target)
	local add_scale = (this:GetValue(UNIT_VALUE_ADD_SCALE) or this:ScaleX(UNIT_SCALE_TYPE_MST)) + params[1]
	this:SetScale(UNIT_SCALE_TYPE_MST, add_scale)
	this:SetValue(UNIT_VALUE_ADD_SCALE, add_scale)
	return true
end
SetCondLog('AddScale')

-- 対象との距離条件
-- params[1]:距離条件MIN(メートル)
-- params[2]:距離条件MAX(メートル)
function TargetDistanceCond(_target, params)
Field:FrameUpdate(_target)
local dist = this:Distance(target)
	return (params[1] * 1000) <= dist and (params[2] == 0 or dist <= (params[2] * 1000))
end
SetCondLog('TargetDistanceCond')

-- 壁との距離条件
-- params[1]:X距離条件MIN(メートル)
-- params[2]:X距離条件MAX(メートル)
-- params[3]:Z距離条件MIN(メートル)
-- params[4]:Z距離条件MAX(メートル)
function WallDistanceCond(_target, params)
Field:FrameUpdate(_target)
local distX, distZ = math.min(this:DistWallLeft(), this:DistWallRight()), math.min(this:DistWallTop(), this:DistWallDown())
	return ((params[1] * 1000) <= distX and (params[2] == 0 or distX <= (params[2] * 1000))) and ((params[3] * 1000) <= distZ and (params[4] == 0 or distZ <= (params[4] * 1000)))
end
SetCondLog('WallDistanceCond')

-- 対象が指定範囲内
-- params[1]:Xオフセット(メートル)
-- params[2]:X距離(メートル)
-- params[3]:Y位置(メートル)
-- params[4]:Z距離(メートル)
function TargetRange(_target, params)
	Field:FrameUpdate(_target)
	if params[2] >= 0 then
		if this:ToDir(target) == DIR_TO_FRONT then
	 		if (((params[1] - params[2]) < 0 and this:DistX(target) < (params[1] - params[2]) * 1000) or this:DistX(target) > (params[1] + params[2]) * 1000) then return false end
	 	else
	 		if (((params[1] + params[2]) < 0 and this:DistX(target) < (params[1] + params[2]) * 1000) or this:DistX(target) > (params[1] - params[2]) * 1000) then return false end
	 	end
	 end
	if params[3] >= 0 and target:PosY() > params[3] * 1000 then return false end
	if params[4] >= 0 and this:DistZ(target) > params[4] * 1000 then return false end
	return true
end
SetCondLog('TargetRange')

-- 対象が前方の指定範囲内に居るか？
-- params[1]:Xオフセット(メートル)
-- params[2]:X距離(メートル)
-- params[3]:Y位置(メートル)
-- params[4]:Z距離(メートル)
function ForwardRange(_target, params)
	Field:FrameUpdate(_target)
	if this:ToDir(target) ~= DIR_TO_FRONT then return false end
	if params[2] >= 0 and (this:DistX(target) < params[1] * 1000 or this:DistX(target) > (params[1] + params[2]) * 1000) then return false end
	if params[3] >= 0 and target:PosY() > params[3] * 1000 then return false end
	if params[4] >= 0 and this:DistZ(target) > params[4] * 1000 then return false end
	return true
end
SetCondLog('ForwardRange')

-- 前方の指定範囲内に居る中でランダムな敵を返す
-- params[1]:Xオフセット(メートル)
-- params[2]:X距離(メートル)
-- params[3]:Y位置(メートル)
-- params[4]:Z距離(メートル)
-- params[5]:生存状態(0:生存 1:死亡 2:両方)
function ForwardRangeRandom(_target, params)
local ulist, tCond = {}, TARGET_COND_ALIVE
	Field:FrameUpdate(_target)
	if params[5] == 1 then
		tCond = TARGET_COND_DEAD
	elseif params[5] == 2 then
		tCond = TARGET_COND_BOTH
	else
		tCond = TARGET_COND_ALIVE
	end
	for i,u in pairs(units:GetCondUnitList(TARGET_SIDE_OPPONENT, tCond, UNIT_COND_NONE)) do
		if this:ToDir(u) == DIR_TO_FRONT then
			if params[2] < 0 or (this:DistX(target) >= params[1] * 1000 and this:DistX(target) <= (params[1] + params[2]) * 1000) then
				if params[3] < 0 or target:PosY() <= params[3] * 1000 then
					if params[4] < 0 or this:DistZ(target) <= params[4] * 1000 then
						table.insert(ulist, u)
					end
				end
			end
		end
	end
	return ulist[1]~=nil and units:PickUnitFromUlist(ulist):ID() or false
end
SetCondLog('ForwardRangeRandom')

-- 対象が指定したキャラクターIDか
-- params[1]:キャラクターID条件
function CharaID(_target, params)
	Field:FrameUpdate(_target)
	return target:CharaID() == params[1]
end
SetCondLog('CharaID')

-- 対象が指定した装備IDの装備品を装備しているか
-- params[1]:装備ID条件
function EquipID(_target, params)
	Field:FrameUpdate(_target)
	return params[1]==target:EquipID(EQUIP_POS_WEAPON) or params[1]==target:EquipID(EQUIP_POS_ARMOR) or params[1]==target:EquipID(EQUIP_POS_ACCESSORY_1) or params[1]==target:EquipID(EQUIP_POS_ACCESSORY_2)
end
SetCondLog('EquipID')

-- 対象が指定した装備IDのスキンを装備しているか
-- params[1]:装備ID条件
function SkinID(_target, params)
	Field:FrameUpdate(_target)
	return params[1]==target:EquipID(EQUIP_POS_SKIN)
end
SetCondLog('SkinID')

-- 対象の位置が登録時から変化しているか
-- params[1]:モード(0:登録 1:検知)
function MoveDetection(_target, params)
Field:FrameUpdate(_target)
local u, x, y, z
local pos = this:GetValue(UNIT_VALUE_COND_MOVE_DETECTION) or {t=0, x=0, y=0, z=0}
	if params[1]==0 then
		pos.t = target:ID()
		pos.x, pos.y, pos.z = target:Position()
		this:SetValue(UNIT_VALUE_COND_MOVE_DETECTION, pos)
		return true
	elseif pos.t~=0 then
		u = units:GetUnit(pos.t)
		x, y, z = u:Position()
		return x~=pos.x or y~=pos.y or z~=pos.z
	end
	return false
end
SetCondLog('MoveDetection')

-- ステージに立つ
function StandOnStage(_target, params)
	Field:FrameUpdate(_target)
	return (target:GetValue(UNIT_VALUE_STAND_ON_STAGE) or false) and target:WeaponType()==EQUIP_TYPE_WAND and target:ArmorType()==EQUIP_TYPE_WEAR and (target:AccessoryElem(1)~=nil or target:AccessoryElem(2)~=nil)
end
SetCondLog('StandOnStage')

-- 対象が発動者ではない
function NotOwner(_target, params)
	Field:FrameUpdate(_target)
	return target:ID() ~= this:ID()
end
SetCondLog('NotOwner')

-- ボスゲージ表示
-- params[1]:表示/非表示
function ShowBossGauge(_target, params)
	Field:FrameUpdate(_target)
	Field:ShowBossGauge(params[1]~=0)
	return true
end
SetCondLog('ShowBossGauge')

-- 特定スキルレベル
-- params[1]:スキルID
-- params[2]:スキルレベル
function SkillLevel(_target, params)
local skl
	Field:FrameUpdate(_target)
	skl = this:GetSkillFromID(params[1])
	if skl == nil then return false end
	return skl:Level() == params[2]
end
SetCondLog('SkillLevel')

-- TL用汎用フラグ
-- params[1]:フラグ番号
function TimeLineFlag(_target, params)
Field:FrameUpdate(_target)
local tbl = this:GetValue(UNIT_VALUE_TL_GENERAL_FLAG) or {}
	return tbl[params[1]] or false
end
SetCondLog('TimeLineFlag')

-- 対象の地面位置をp1にする
-- params[1]:Y位置
function SetGroundY(_target, params)
	Field:FrameUpdate(_target)
	target:SetGroundY(params[1]<0 and target:PosY() or params[1])
	return true
end
SetCondLog('SetGroundY')

-- バトルスクリプトを呼び出す
-- params[1]:スクリプトINDEX
-- params[2]:スクリプトパラメータ1
-- params[3]:スクリプトパラメータ2
-- params[4]:スクリプトパラメータ3
-- params[5]:スクリプトパラメータ4
function CallBattleScript(_target, params)
	Field:FrameUpdate(_target)
	Field:CallScript('TLFunc' .. tostring(params[1]), params[2], params[3], params[4], params[5])
	return true
end
SetCondLog('CallBattleScript')

-- 生存人数条件
-- params[1]:敵・味方
-- params[2]:条件方向
-- params[3]:人数条件
function LivingCountCond(_target, params)
local Over,Under = 1,0
local ulist
	Field:FrameUpdate(_target)
	ulist = units:GetCondUnitList(params[1], TARGET_COND_ALIVE, UNIT_COND_NONE)
	return (params[2] == (#ulist >= params[3] and Over or Under))
end
SetCondLog('LivingCountCond')

-- スキル発動毎情報条件
-- params[1]:スキル発動毎情報INDEX
-- params[2]:条件方向
-- params[3]:スキル発動毎情報閾値
function SkillInfoCond(_target, params)
local val
	Field:FrameUpdate(_target)
	val = TimeLine:SKL_GetValue(params[1])
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
	if params[2] == 0 and val == 0 then return false end
	return procCompare(params[2], val, params[3])
end
SetCondLog('SkillInfoCond')

-- フィールド内のランダムな位置を返す
-- params[1]:デッドゾーンX
-- params[2]:デッドゾーンZ
function RandomPos(_target, params)
Field:FrameUpdate(_target)
local x, z = Field:GetRandomPos((params[1] or 0) * 1000, (params[2] or 0) * 1000)
	x, z = x / 1000, z / 1000
	return x, 0, z
end

-- 事前抽選済みの配置物の座標を返す
function OrnamentPos(_target, params)
Field:FrameUpdate(_target)
local x, y, z = table.unpack(this:GetValue({UNIT_VALUE_ORNAMENT_INFO, TimeLine:SKL_PUID()}) or {})
	x, y, z = (x or 0) / 1000, (y or 0) / 1000, (z or 0) / 1000
	return x, y, z
end

-- リフレク専用
-- params[1]:制限回数
-- params[2]:HP閾値方向
-- params[3]:HP条件
function Reflecting(_target, params)
local HpOver,HpUnder = 1,0
local cnt
	Field:FrameUpdate(_target)
	cnt = Process:GetKeptParam(1) or 0
	if Process:Param(params[1])>0 and Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	if select(2, Bullet:Parent():ActSkill()):ID()==this:ID() then
		if (Process:Param(params[2])==HpOver and this:PerHP() >= Process:Param(params[3])) or (Process:Param(params[2])==HpUnder and this:PerHP() < Process:Param(params[3])) then
			if this:Side()~=Bullet:Parent():Side() and Bullet:SKL_Type(SKILL_MAGIC) and Bullet:SKL_Role(SKILL_ROLE_ATTACK) then
				Process:KeepParam(1, 1, CALCULATE_ADD)
				return true
			end
		end
	end
	return false
end
SetCondLog('Reflecting')

-- ランダムなアクターを返す
-- params[1]:敵味方
-- params[2]:生存状態(0:生存 1:死亡 2:両方)
function RandomActor(_target, params)
local ulist, tCond = {}, TARGET_COND_ALIVE
local res
	Field:FrameUpdate(_target)
	if params[2] == 1 then
		tCond = TARGET_COND_DEAD
	elseif params[2] == 2 then
		tCond = TARGET_COND_BOTH
	else
		tCond = TARGET_COND_ALIVE
	end
	for i,u in pairs(units:GetCondUnitList(params[1], tCond, UNIT_COND_NONE)) do
		if tCond ~= TARGET_COND_DEAD or u:State() ~= STATE_RESURRECT then table.insert(ulist, u) end
	end
	res = ulist[1]~=nil and ulist[SyncedRandom(1, #ulist)]:ID() or false
	return res
end
SetCondLog('RandomActor')

-- 特定バフIDランダムアクター
-- params[1]:敵味方
-- params[2]:生存状態(0:生存 1:死亡 2:両方)
-- params[3]:バフID条件
function BuffIDCondRandomActor(_target, params)
local ulist, tCond = {}, TARGET_COND_ALIVE
local res
	Field:FrameUpdate(_target)
	if params[2] == 1 then
		tCond = TARGET_COND_DEAD
	elseif params[2] == 2 then
		tCond = TARGET_COND_BOTH
	else
		tCond = TARGET_COND_ALIVE
	end
	for i,u in pairs(units:GetCondUnitList(params[1], tCond, UNIT_COND_NONE)) do
		if (tCond ~= TARGET_COND_DEAD or u:State() ~= STATE_RESURRECT) and u:IsBuff(params[3]) then table.insert(ulist, u) end
	end
	res = ulist[1]~=nil and ulist[SyncedRandom(1, #ulist)]:ID() or false
	return res
end
SetCondLog('BuffIDCondRandomActor')

-- 指定アクター
-- params[1]:敵味方
-- params[2]:オプション(+1:自身を除く +2:死者を除く)
-- params[3]:ターゲット選択方法
function SpecifiedActor(_target, params)
local u
	Field:FrameUpdate(_target)
	u = units:GetProcessTarget(params[1], params[3], params[2])
	if u ~= nil then
		return u:ID()
	else
		return false
	end
end
SetCondLog('SpecifiedActor')

-- 対象ヒット数条件
-- params[1]:ヒット数閾値方向
-- params[2]:ヒット数条件
function TargetHitsCond(_target, params)
	Field:FrameUpdate(_target)
	return procCompare(params[1], target:Hits(), params[2])
end
SetCondLog('TargetHitsCond')

-- 特定の条件を満たすスキルかどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkill(_target, params)
local t
	Field:FrameUpdate(_target, params)
	-- ClientCache:SetParamSettings(5, 1)
	-- ClientCache:SetKey({CACHE_KEY_BLT_TARGET_PARTY_SIDE, CACHE_KEY_BLT_SKILL_ELEMENT, CACHE_KEY_BLT_SKILL_TYPE, CACHE_KEY_BLT_SKILL_ROLE})
	-- ClientCache:Regist()
	if not Bullet:TargetSide(params[1]) then return false end
	if params[5]&4==4 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Role(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Role(params[4], CS_COMPARE_DIRECT) then return false end
	if params[5]&1==1 and params[2]>=0 then if not Bullet:Element(GetProcParamArray(params[2]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[2], CS_COMPARE_DIRECT) then return false end
	if params[5]&2==2 then t = GetProcParamIndex(params[3]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[3], CS_COMPARE_DIRECT) then return false end
	return true
end
SetCondLog('IsValidSkill')

-- 指定確率特定攻撃スキル
-- params[1]:敵・味方
-- params[2]:確率INDEX
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillLottery(_target, params)
	Field:FrameUpdate(_target)
	if not lottery(Process:Param(params[2])) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillLottery')

-- 特定スキルノーマルヒット
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillNormalHit(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:IsNormalHit() then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillNormalHit')

-- 自分対象特定スキル
-- params[1]:属性
-- params[2]:スキルタイプ
-- params[3]:スキルロール
-- params[4]:パラメータタイプ(bit)
function IsValidSkillOwnHit(_target, params)
local t
	Field:FrameUpdate(_target)
	if Bullet:Parent():ID() ~= Bullet:Target():ID() or Bullet:Parent():ID() ~= this:ID() then return false end
	if params[4]&4==4 then t = GetProcParamIndex(params[3]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Role(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Role(params[3], CS_COMPARE_DIRECT) then return false end
	if params[4]&1==1 and params[1]>=0 then if not Bullet:Element(GetProcParamArray(params[1]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[1], CS_COMPARE_DIRECT) then return false end
	if params[4]&2==2 then t = GetProcParamIndex(params[2]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[2], CS_COMPARE_DIRECT) then return false end
	return true
end
SetCondLog('IsValidSkillOwnHit')

-- 特定の条件を満たすスキルかどうか(自分以外対象)
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillNotOwnHit(_target, params)
	Field:FrameUpdate(_target)
	if Bullet:Parent():ID() == Bullet:Target():ID() and Bullet:Parent():ID() == this:ID() then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillNotOwnHit')

-- アリーナで特定スキル
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillArena(_target, params)
	Field:FrameUpdate(_target)
	if not Field:IsPvP() then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillArena')

-- アリーナ防衛側で特定の条件を満たすスキルかどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillArenaDefense(_target, params)
	Field:FrameUpdate(_target)
	if not Field:IsPvP() or this:Side()==TARGET_SIDE_ALLY then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==Bullet:Element()) then return false end elseif params[2]~=Bullet:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillArenaDefense')

-- 特定スキル発動中スキル発動毎情報特定スキル
-- params[1]:パラメータ定義(発動者敵・味方/発動対象敵・味方/バレットオーナー敵・味方/バレット対象敵・味方/スキル発動毎情報INDEX/条件方向/スキル発動毎情報閾値)
-- params[2]:パラメータ定義(発動属性/発動スキルタイプ/発動スキルロール/バレット属性/バレットスキルタイプ/バレットスキルロール)
-- params[3]:フリー1
-- params[4]:フリー2
-- params[5]:フリー3
function IsTargetSkillMainSkillInfoAndValidSkill(_target, params)
local prm1, prm2, skl, tgt, puid, val
	Field:FrameUpdate(_target)
	if this:State()~=STATE_MAIN then return false end
	prm1 = GetProcParamArray2(params[1], {[6] = -1}, {params[3], params[4], params[5]}, 7)
	prm2 = GetProcParamArray2(params[2], {[1] = ELEMENT_UNMENTIONED, [4] = ELEMENT_UNMENTIONED}, {params[3], params[4], params[5]}, 6)
	skl, tgt, puid = this:ActSkill()
	if not (IsValidTarget(this, tgt, prm1[1]) and IsValidTarget(this, Bullet:Parent(), prm1[2]) and IsValidTarget(this, Bullet:Target(), prm1[3]) and IsValidTarget(Bullet:Parent(), Bullet:Target(), prm1[4])) then return false end
	if not (Bullet:Element(prm2[4]) and Bullet:SKL_Type(prm2[5]) and Bullet:SKL_Role(prm2[6])) then return false end
	if not (skl:Element(prm2[1]) and skl:Type(prm2[2]) and skl:Role(prm2[3])) then return false end
	if prm1[5]>0 then
		if prm1[6]==-1 then
			if (this:GetSkillValue(prm1[5], puid) or 0) == 0 then return false end
		else
			val = this:GetSkillValue(prm1[5], puid) or 0
			-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
			if prm1[6] == 0 and val == 0 then return false end
			if not procCompare(prm1[6], val, prm1[7]) then return false end
		end
	end
	return true
end
SetCondLog('IsTargetSkillMainSkillInfoAndValidSkill')

-- 対特定スキル発動中特定スキル
-- params[1]:パラメータ定義(発動者敵・味方/発動対象敵・味方/発動属性/発動スキルタイプ/発動スキルロール/発動特技INDEX)
-- params[2]:パラメータ定義(バレットオーナー敵・味方/バレット対象敵・味方/バレット属性/バレットスキルタイプ/バレットスキルロール/バレット特技INDEX)
-- params[3]:フリー1
-- params[4]:フリー2
-- params[5]:フリー3
function IsTargetSkillMainAndValidSkill(_target, params)
local prm1, prm2, idx1, idx2, skl, tgt
	Field:FrameUpdate(_target)
	if Bullet:Target():State()~=STATE_MAIN then return false end
	prm1, idx1 = GetProcParamArray2(params[1], {[3] = ELEMENT_UNMENTIONED}, {params[3], params[4], params[5]}, 6)
	prm2, idx2 = GetProcParamArray2(params[2], {[3] = ELEMENT_UNMENTIONED}, {params[3], params[4], params[5]}, 6)
	skl, tgt = Bullet:Target():ActSkill()
	if not ((idx1[1]==0 or IsValidTarget(Bullet:Target(), this, prm1[1])) and (idx1[2]==0 or IsValidTarget(Bullet:Target(), tgt, prm1[2])) and (idx2[1]==0 or IsValidTarget(this, Bullet:Parent(), prm2[1])) and (idx2[2]==0 or Bullet:TargetSide(prm2[2]))) then return false end
	if not ((idx2[3]==0 or Bullet:Element(prm2[3], CS_COMPARE_DIRECT)) and (idx2[4]==0 or Bullet:SKL_Type(prm2[4], CS_COMPARE_DIRECT)) and (idx2[5]==0 or Bullet:SKL_Role(prm2[5], CS_COMPARE_DIRECT))) then return false end
	if not ((idx1[3]==0 or skl:Element(prm1[3])) and (idx1[4]==0 or skl:Type(prm1[4])) and (idx1[5]==0 or skl:Role(prm1[5])) and (idx1[6]==0 or prm1[6]==0 or prm1[6]==skl:IndexUI())) then return false end
	if idx2[6] ~= 0 and prm2[6] ~= 0 then skl = Bullet:GetParentSkill() if prm2[6] ~= skl:IndexUI() then return false end end
	return true
end
SetCondLog('IsTargetSkillMainAndValidSkill')

-- 相手がスキル発動準備中で特定スキル
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetStandbyAndValidSkill(_target, params)
	Field:FrameUpdate(_target)
	if Bullet:Target():State()~=STATE_STANDBY then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==Bullet:Element()) then return false end elseif params[2]~=Bullet:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetStandbyAndValidSkill')

-- 対特定スキル発動準備特定スキル
-- params[1]:パラメータ定義(発動者敵・味方/発動対象敵・味方/発動属性/発動スキルタイプ/発動スキルロール)
-- params[2]:パラメータ定義(バレットオーナー敵・味方/バレット対象敵・味方/バレット属性/バレットスキルタイプ/バレットスキルロール)
-- params[3]:フリー1
-- params[4]:フリー2
-- params[5]:フリー3
function IsTargetValidSkillStandbyAndValidSkill(_target, params)
local prm1, prm2, skl, tgt
	Field:FrameUpdate(_target)
	if Bullet:Target():State()~=STATE_STANDBY then return false end
	prm1 = GetProcParamArray2(params[1], {[3] = ELEMENT_UNMENTIONED}, {params[3], params[4], params[5]})
	prm2 = GetProcParamArray2(params[2], {[3] = ELEMENT_UNMENTIONED}, {params[3], params[4], params[5]})
	skl, tgt = Bullet:Target():ActSkill()
	if not (IsValidTarget(Bullet:Target(), this, prm1[1]) and IsValidTarget(Bullet:Target(), tgt, prm1[2]) and IsValidTarget(this, Bullet:Parent(), prm2[1]) and IsValidTarget(Bullet:Parent(), Bullet:Target(), prm2[2])) then return false end
	if not (Bullet:Element(prm2[3]) and Bullet:SKL_Type(prm2[4]) and Bullet:SKL_Role(prm2[5])) then return false end
	if not (skl:Element(prm1[3]) and skl:Type(prm1[4]) and skl:Role(prm1[5])) then return false end
	return true
end
SetCondLog('IsTargetValidSkillStandbyAndValidSkill')

-- ダメージ発生特定スキル
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillHpDamage(_target, params)
	Field:FrameUpdate(_target)
	if Bullet:Damage() <= 0 then return false end
	-- 2022/4/11 天塊応急処置(AW_QA-18204)
	if this:ID() == Bullet:Target():ID() then
		if myTrigger == TriggerTypes.OnCalcAttack or myTrigger == TriggerTypes.AfterCalcAttack then return false end
	else
		if myTrigger == TriggerTypes.OnCalcDamage or myTrigger == TriggerTypes.AfterCalcDamage then return false end
	end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillHpDamage')

-- 特定の条件を満たすHP回復を持つスキルかどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillHpHeal(_target, params)
	Field:FrameUpdate(_target)
	if Bullet:Heal() <= 0 then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillHpHeal')

-- 特定の条件を満たすコストを消費するスキルかどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillUseCost(_target, params)
	Field:FrameUpdate(_target)
	if Bullet:SKL_BeforeCost() - Bullet:SKL_AfterCost() <= 0 then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillUseCost')

-- 特定の条件を満たすコストを消費するスキルかどうか
-- params[1]:敵・味方
-- params[2]:スキル種別
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetKindAttackSkillUseCost(_target, params)
	Field:FrameUpdate(_target)
	if Bullet:SKL_BeforeCost() - Bullet:SKL_AfterCost() <= 0 then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==Bullet:SKL_Kind()) then return false end elseif params[2]~=Bullet:SKL_Kind() then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetKindAttackSkillUseCost')

-- 自身が詠唱中且つ特定の条件を満たすスキルかどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillOwnStandBy(_target, params)
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_STANDBY then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillOwnStandBy')

-- 特定のIDのスキルかどうか
-- params[1]:敵・味方
-- params[2]:スキルID
-- params[3]:パラメータタイプ(bit)
function IsTargetSkillID(_target, params)
	Field:FrameUpdate(_target)
	if params[3]&1==1 then if not (params[2]==0 or Process:Param(params[2])==Bullet:SKL_ID()) then return false end elseif params[2]~=Bullet:SKL_ID() then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetSkillID')

-- 特定のIDのスキルと同一名称のスキルかどうか
-- params[1]:敵・味方
-- params[2]:スキルID
-- params[3]:パラメータタイプ(bit)
function SameNameTargetSkillID(_target, params)
local skillId
local sklInfo, sklName
local skl
	Field:FrameUpdate(_target)
	if params[3]&1==1 and params[2]~=0 then skillId = Process:Param(params[2]) else skillId = params[2] end
	if skillId ~= 0 then
		sklInfo = Field:GetSkillInfo(skillId)
		sklName = sklInfo[SKILL_MST_INFO_NAME]
		skl = Bullet:GetParentSkill()
		if skl == nil then return false end
		if skl:Name() ~= sklName then return false end
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('SameNameTargetSkillID')

-- 特定のPUIDのスキルかどうか
-- params[1]:敵・味方
-- params[2]:スキルPUID_INDEX
function IsTargetSkillPUID(_target, params)
	Field:FrameUpdate(_target)
	if Process:Param(params[2])~=Bullet:SKL_PUID() then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetSkillPUID')

-- 指定確率特定スキルPUID
-- params[1]:敵・味方
-- params[2]:確率INDEX
-- params[3]:スキルPUID_INDEX
function IsTargetSkillPUIDLottery(_target, params)
	Field:FrameUpdate(_target)
	if not lottery(Process:Param(params[2])) then return false end
	if Process:Param(params[3])~=Bullet:SKL_PUID() then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetSkillPUIDLottery')

-- 対特定敵タイプ・キャラタイプ特定スキルPUID
-- params[1]:敵・味方
-- params[2]:スキルPUID_INDEX
-- params[3]:キャラタイプ
-- params[4]:エネミータイプ(ボスフラグ)
-- params[5]:パラメータタイプ(bit)
function IsTargetEnemyTypeAndCharaTypeTargetSkillPUID(_target, params)
local t
local boss
local charaType
local flag = false
	Field:FrameUpdate(_target)
	if Process:Param(params[2])~=Bullet:SKL_PUID() then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&2==2 then if not (params[4]==0 or Process:Param(params[4])==boss) then return false end elseif (params[4]==0 and ENEMY_TYPE_NORMAL or params[4])~=boss then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), t, 'Type')) then return false end elseif not t:Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetEnemyTypeAndCharaTypeTargetSkillPUID')

-- 特定スキルPUIDトドメ
-- params[1]:敵・味方
-- params[2]:スキルPUID_INDEX
function IsFinishTargetSkillPUID(_target, params)
	Field:FrameUpdate(_target)
	if Process:Param(params[2])~=Bullet:SKL_PUID() then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:IsKill()
end
SetCondLog('IsFinishTargetSkillPUID')

-- プロセスパラメータが特定のIDかどうか
-- params[1]:敵・味方
-- params[2]:スキルID_INDEX
-- params[3]:バレットID_INDEX
-- params[4]:スキルPUID_INDEX
-- params[5]:バレットUID_INDEX
function IsTargetID_PP(_target, params)
	Field:FrameUpdate(_target)
	if params[2]~=0 and Process:Param(params[2])~=Bullet:SKL_ID() then return false end
	if params[3]~=0 and Process:Param(params[3])~=Bullet:MST_Info(BULLET_PROPERTY_ID) then return false end
	if params[4]~=0 and Process:Param(params[4])~=Bullet:SKL_PUID() then return false end
	if params[5]~=0 and Process:Param(params[5])~=Bullet:UID() then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetID_PP')

-- 特定召喚スキル装備中特定スキル攻撃
-- params[1]:敵・味方
-- params[2]:召喚スキルID
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetSummonSetAndAttackSkill(_target, params)
local skl
	Field:FrameUpdate(_target)
	skl = Field:GetSummonSkill()
	if skl == nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==skl:ID()) then return false end elseif params[2]~=skl:ID() then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetSummonSetAndAttackSkill')

-- 物理スキルかどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルロール
-- params[4]:パラメータタイプ(bit)
-- function IsPhysSkill(_target, params)
-- 	Field:FrameUpdate(_target)
-- 	if params[4]&1==1 then if not (params[2]==0 or Process:Param(params[2])==Bullet:Element()) then return false end elseif params[2]~=Bullet:Element() then return false end
-- 	if params[4]&2==2 then if not (params[3]==0 or Process:Param(params[3])==Bullet:SKL_Role()) then return false end elseif params[3]~=Bullet:SKL_Role() then return false end
-- 	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and (Bullet:SKL_Type()==SKILL_ATTACK or Bullet:SKL_Type()==SKILL_SKILL)
-- end

-- 特定規模
-- params[1]:敵・味方
-- params[2]:スキル規模
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidScaleSkill(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==Bullet:SKL_Scale()) then return false end elseif params[2]~=Bullet:SKL_Scale() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidScaleSkill')

-- 特定規模以外
-- params[1]:敵・味方
-- params[2]:スキル規模
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsInvalidScaleSkill(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])~=Bullet:SKL_Scale()) then return false end elseif params[2]==Bullet:SKL_Scale() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsInvalidScaleSkill')

-- 特定規模攻撃スキル
-- params[1]:敵・味方
-- params[2]:スキル規模
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsValidScaleAndAttackSkill(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==Bullet:SKL_Scale()) then return false end elseif params[2]~=Bullet:SKL_Scale() then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidScaleAndAttackSkill')

-- 特定UID生存中特定規模攻撃スキル
-- params[1]:敵・味方
-- params[2]:アクターUID_INDEX
-- params[3]:スキル規模
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsValidScaleAndTargetUidAlive(_target, params)
local u, flag
	Field:FrameUpdate(_target)
	flag = false
	for i,index in pairs(GetProcParamIndex(params[2])) do
		if index ~= 0 and Process:Param(index) ~= 0 then
			u = units:GetUnit(Process:Param(index))
			if u:Alive() and not u:IsExcluded() then
				flag = true
				break
			end
		end
	end
	if not flag then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Scale(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Scale(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidScaleAndTargetUidAlive')

-- ターゲット条件攻撃スキル
-- params[1]:敵・味方
-- params[2]:自分ターゲット条件INDEX
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetCondAttackSkill(_target, params)
local tl, pp2
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[2] ~= 0 then
		tl = Field:GetTimeLine(Bullet:SKL_PUID())
		pp2 = Process:Param(params[2])
		if tl:Target():ID() ~= Bullet:Target():ID() then
			if pp2 == SKILL_TARGET_COND_ME then return false elseif pp2 == SKILL_TARGET_COND_NOT_ONLY_ME and Bullet:SKL_Scale() == SKILL_SCALE_WHOLE then return false end
		elseif pp2 == SKILL_TARGET_COND_NOT_ONLY_ME or pp2 == SKILL_TARGET_COND_NOT_ME then return false end
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetCondAttackSkill')

-- プロセスターゲット条件特定スキル
-- params[1]:敵味方/ターゲットID/ターゲット条件
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsProcessTargetCondValidSkill(_target, params)
local u, tl, prm
	Field:FrameUpdate(_target)
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}, [3] = {1, 2, 3}}, 3)
	if prm[2] ~= 0 and prm[3] ~= 0 then
		u = this:GetProcessTarget(prm[2])
		if u == nil then return false end
		tl = Field:GetTimeLine(Bullet:SKL_PUID())
		if u:ID() ~= tl:Target():ID() then
			if prm[3] == SKILL_TARGET_COND_ME then return false elseif prm[3] == SKILL_TARGET_COND_NOT_ONLY_ME and Bullet:SKL_Scale() == SKILL_SCALE_WHOLE then return false end
		elseif prm[3] == SKILL_TARGET_COND_NOT_ONLY_ME or prm[3] == SKILL_TARGET_COND_NOT_ME then return false end
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), prm[1])
end
SetCondLog('IsProcessTargetCondValidSkill')

-- クリティカルが発生したかどうか
function IsCritical(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:IsCRT()
end
SetCondLog('IsCritical')

-- 指定INDEXの特技でクリティカル発生
-- params[1]:敵・味方
-- params[2]:特技INDEX_INDEX
-- params[3]:属性
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetUIIndexSkillCritical(_target, params)
local skl
	Field:FrameUpdate(_target)
	if not Bullet:IsCRT() then return false end
	skl = Bullet:GetParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) or (params[2]~=0 and Process:Param(params[2])~=0 and Process:Param(params[2])~=skl:IndexUI()) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]),  Bullet, 'Element', true)) then return false end elseif params[3]~=Bullet:Element() then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetUIIndexSkillCritical')

-- 致命の一撃発生
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsFatalBlow(_target, params)
local t
	Field:FrameUpdate(_target, params)
	if not (Bullet:TargetSide(params[1]) and Bullet:IsFatalBlow()) then return false end
	if params[5]&4==4 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Role(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Role(params[4], CS_COMPARE_DIRECT) then return false end
	if params[5]&1==1 and params[2]>=0 then if not Bullet:Element(GetProcParamArray(params[2]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[2], CS_COMPARE_DIRECT) then return false end
	if params[5]&2==2 then t = GetProcParamIndex(params[3]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[3], CS_COMPARE_DIRECT) then return false end
	return true
end
SetCondLog('IsFatalBlow')

-- 指定INDEXの特技で致命の一撃発生
-- params[1]:敵・味方
-- params[2]:特技INDEX_INDEX
-- params[3]:属性
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetUIIndexSkillFatalBlow(_target, params)
local t, skl
	Field:FrameUpdate(_target, params)
	if not (Bullet:TargetSide(params[1]) and Bullet:IsFatalBlow()) then return false end
	skl = Bullet:GetParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) or (params[2]~=0 and Process:Param(params[2])~=0 and Process:Param(params[2])~=skl:IndexUI()) then return false end
	if params[5]&2==2 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Role(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Role(params[4], CS_COMPARE_DIRECT) then return false end
	if params[5]&1==1 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	return true
end
SetCondLog('IsTargetUIIndexSkillFatalBlow')

-- 特定のスキル種別のスキルかどうか
-- params[1]:敵・味方
-- params[2]:スキル種別
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillKind(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==Bullet:SKL_Kind()) then return false end elseif params[2]~=Bullet:SKL_Kind() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillKind')

-- 特定のスキル種別以外のスキルかどうか
-- params[1]:敵・味方
-- params[2]:スキル種別
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsInvalidSkillKind(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])~=Bullet:SKL_Kind()) then return false end elseif params[2]==Bullet:SKL_Kind() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsInvalidSkillKind')

-- 特定のスキル種別の属性付き攻撃スキルかどうか
-- params[1]:敵・味方
-- params[2]:スキル種別
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsValidElementAndKindAttackSkill(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==Bullet:SKL_Kind()) then return false end elseif params[2]~=Bullet:SKL_Kind() then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet:Element(), nil, true)) then return false end elseif params[3]~=Bullet:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidElementAndKindAttackSkill')

-- 特定種別以外又は属性以外攻撃スキル
-- params[1]:敵・味方
-- params[2]:スキル種別(Not)
-- params[3]:属性(Not)
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
-- params[2]とparams[3]はor
function IsNotValidElementOrKindAttackSkill(_target, params)
local res = false
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if (params[2]==0 or Process:Param(params[2])==Bullet:SKL_Kind()) then res = true end elseif params[2]==Bullet:SKL_Kind() then res = true end
	if res then if params[5]&2==2 then if (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet:Element(), nil, true)) then return false end elseif params[3]==Bullet:Element() then return false end end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsNotValidElementOrKindAttackSkill')

-- 特定種別属性攻撃以外スキル_偽
-- params[1]:敵・味方
-- params[2]:スキル種別
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsNotValidElementAndKindNonAttackSkill(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return true end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==Bullet:SKL_Kind()) then return true end elseif params[2]~=Bullet:SKL_Kind() then return true end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet:Element(), nil, true)) then return true end elseif params[3]~=Bullet:Element() then return true end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return true end elseif not Bullet:SKL_Type(params[4]) then return true end
	return not IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsNotValidElementAndKindNonAttackSkill')

-- 特定種別スキル特定敵タイプ
-- params[1]:敵・味方
-- params[2]:エネミータイプ
-- params[3]:スキル種別
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetEnemyTypeAndKindAttackSkill(_target, params)
local t
local boss
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&2==2 then if not (params[3]==0 or Process:Param(params[3])==Bullet:SKL_Kind()) then return false end elseif params[3]~=Bullet:SKL_Kind() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetEnemyTypeAndKindAttackSkill')

-- 特定のスキルの重複可否条件
-- params[1]:敵・味方
-- params[2]:重複可否
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillMultiCast(_target, params)
Field:FrameUpdate(_target)
local skl = Bullet:GetParentSkill()
	if skl == nil then return false end
	if not (params[2]==0 or Process:Param(params[2])==skl:MultiCast()) then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillMultiCast')

-- 特定攻撃スキル重複可否
-- params[1]:敵・味方
-- params[2]:重複可否
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillMultiCast(_target, params)
Field:FrameUpdate(_target)
local skl = Bullet:GetParentSkill()
	if skl == nil then return false end
	if not skl:Role(SKILL_ROLE_ATTACK) then return false end
	if not (params[2]==0 or Process:Param(params[2])==skl:MultiCast()) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillMultiCast')

-- 敵特定攻撃スキル重複可否自分バフカテゴリ状態
-- params[1]:重複可否
-- params[2]:バフカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsEnemyAttackSkillMultiCastOwnerBuffCategory(_target, params)
local t, skl, buffCate
	Field:FrameUpdate(_target)
	if not (Bullet:SKL_Role(SKILL_ROLE_ATTACK, CS_COMPARE_DIRECT) and Bullet:TargetSide(TARGET_SIDE_OPPONENT)) then return false end
	if params[5]&2==2 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	if params[5]&4==4 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[4], CS_COMPARE_DIRECT) then return false end
	skl = Bullet:GetParentSkill()
	if skl == nil then return false end
	if not (params[1]==0 or Process:Param(params[1])==skl:MultiCast()) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return this:IsBuffCategory(buffCate)
end
SetCondLog('IsEnemyAttackSkillMultiCastOwnerBuffCategory')

-- 攻撃スキル重複可否対象純粋属性耐性指定値間
-- params[1]:敵・味方
-- params[2]:属性条件
-- params[3]:スキルタイプ条件
-- params[4]:重複可否/純粋属性耐性MIN-MAX INDEX(bit)
-- params[5]:パラメータタイプ(bit)
function IsTargetPureElementResistBetweenAttackSkillMultiCast(_target, params)
local t, prm, prm2, elmrst, skl
	Field:FrameUpdate(_target)
	skl = Bullet:GetParentSkill()
	if skl == nil then return false end
	if not (Bullet:SKL_Role(SKILL_ROLE_ATTACK, CS_COMPARE_DIRECT) and Bullet:TargetSide(params[1])) then return false end
	if params[5]&1==1 and params[2]>=0 then if not Bullet:Element(GetProcParamArray(params[2]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[2], CS_COMPARE_DIRECT) then return false end
	if params[5]&2==2 then t = GetProcParamIndex(params[3]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[3], CS_COMPARE_DIRECT) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	prm, prm2 = GetProcParamArray2(params[4], nil, nil, 4)
	if not (prm2[1]==0 or prm[1]==skl:MultiCast()) then return false end
	if params[4] > 256 then
		elmrst = t:PureElemResist(prm[4]>0 and prm[4] or Bullet:Element())
		if prm[2] <= prm[3] then
			if elmrst < prm[2] or elmrst > prm[3] then return false end
		elseif prm[2] - prm[3] == 1 then
			if elmrst >= prm[2] then return false end
		else
			if elmrst < prm[2] then return false end
		end
	end
	return true
end
SetCondLog('IsTargetPureElementResistBetweenAttackSkillMultiCast')

-- 気絶発生
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function RaiseStun(_target, params)
local t
	Field:FrameUpdate(_target)
	if not (Bullet:IsBreak() and not Bullet:Target():IsBoss()) then return false end
	if not Bullet:TargetSide(params[1]) then return false end
	if params[5]&4==4 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Role(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Role(params[4], CS_COMPARE_DIRECT) then return false end
	if params[5]&1==1 and params[2]>=0 then if not Bullet:Element(GetProcParamArray(params[2]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[2], CS_COMPARE_DIRECT) then return false end
	if params[5]&2==2 then t = GetProcParamIndex(params[3]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[3], CS_COMPARE_DIRECT) then return false end
	return true
end
SetCondLog('RaiseStun')

-- ブレイクが発生したかどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function RaiseBreak(_target, params)
	Field:FrameUpdate(_target)
	if not (Bullet:IsBreak() and Bullet:Target():IsBoss()) then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('RaiseBreak')

-- ブレイク発生攻撃スキル自分特定汎用数値情報
-- params[1]:敵・味方
-- params[2]:汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function AttackSkillRaiseBreakOwnerGeneralCount(_target, params)
local t, prm
local cond, val
	Field:FrameUpdate(_target)
	if not (Bullet:IsBreak() and Bullet:Target():IsBoss()) then return false end
	if not (Bullet:SKL_Role(SKILL_ROLE_ATTACK, CS_COMPARE_DIRECT) and Bullet:TargetSide(params[1])) then return false end
	if params[5]&1==1 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	if params[5]&2==2 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[4], CS_COMPARE_DIRECT) then return false end
	if params[2] > 290 then
		prm = GetProcParamIndex(params[2])
		cond, val = Process:Param(prm[2]), this:GetGeneralCount(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[2] > 0 and params[2] <= 10 then
		if (this:GetGeneralCount(Process:Param(params[2])) or 0) == 0 then return false end
	elseif params[2] ~= 0 then
		return false
	end
	return true
end
SetCondLog('AttackSkillRaiseBreakOwnerGeneralCount')

-- 気絶・ブレイク発生
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function RaiseStunOrBreak(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:IsBreak() then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('RaiseStunOrBreak')

-- 一刀特定装備の特定スキル攻撃でブレイク発生
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:スキル属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetSingleWeaponAndAttackSkillRaiseBreak(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if not (Bullet:IsBreak() and Bullet:Target():IsBoss()) then return false end
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	equip1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	equip2 = this:WeaponType()==0 and this:SubWeaponType() or this:WeaponType()
	if equip1 ~= 0 and equip2 ~= equip1 then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetSingleWeaponAndAttackSkillRaiseBreak')

-- 特定装備で指定スキル
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetEquipSkill(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==this:WeaponType() or Process:Param(params[2])==this:SubWeaponType() or Process:Param(params[2])==this:ArmorType()) then return false end elseif not (params[2]==this:WeaponType() or params[2]==this:SubWeaponType() or params[2]==this:ArmorType()) then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetEquipSkill')

-- 二刀特定装備で特定スキル攻撃
-- params[1]:敵・味方
-- params[2]:装備タイプ1
-- params[3]:装備タイプ2
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetDoubleEquipAndAttackSkill(_target, params)
local equip1,equip2
	Field:FrameUpdate(_target)
	if this:WeaponType()==0 or this:SubWeaponType()==0 then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	equip1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	equip2 = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if equip1 == equip2 then
		if equip1 ~= 0 and (this:WeaponType()~=this:SubWeaponType() or this:WeaponType()~=equip1) then return false end
	else
		if equip1 ~= 0 and this:WeaponType() ~= equip1 and this:SubWeaponType() ~= equip1 then return false end
		if equip2 ~= 0 and this:WeaponType() ~= equip2 and this:SubWeaponType() ~= equip2 then return false end
	end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetDoubleEquipAndAttackSkill')

-- 二刀特定装備で属性スキル攻撃
-- params[1]:敵・味方
-- params[2]:装備タイプ1
-- params[3]:装備タイプ2
-- params[4]:スキル属性
-- params[5]:パラメータタイプ(bit)
function IsTargetDoubleEquipAndAttackSkillElement(_target, params)
local equip1,equip2
	Field:FrameUpdate(_target)
	if this:WeaponType()==0 or this:SubWeaponType()==0 then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	equip1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	equip2 = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if equip1 == equip2 then
		if equip1 ~= 0 and (this:WeaponType()~=this:SubWeaponType() or this:WeaponType()~=equip1) then return false end
	else
		if equip1 ~= 0 and this:WeaponType() ~= equip1 and this:SubWeaponType() ~= equip1 then return false end
		if equip2 ~= 0 and this:WeaponType() ~= equip2 and this:SubWeaponType() ~= equip2 then return false end
	end
	if params[5]&4==4 then if not (params[4]==0 or Process:Param(params[4])==Bullet:Element()) then return false end elseif params[4]~=Bullet:Element() then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetDoubleEquipAndAttackSkillElement')

-- 二刀特定装備で敵に属性スキル攻撃
-- params[1]:装備タイプ1
-- params[2]:装備タイプ2
-- params[3]:スキル属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetDoubleEquipAndAttackSkillElementToEnemy(_target, params)
local equip1,equip2
	Field:FrameUpdate(_target)
	if this:WeaponType()==0 or this:SubWeaponType()==0 then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	equip1 = (params[5]&1==1 and params[1]~=0) and Process:Param(params[1]) or params[1]
	equip2 = (params[5]&2==2 and params[2]~=0) and Process:Param(params[2]) or params[2]
	if equip1 == equip2 then
		if equip1 ~= 0 and (this:WeaponType()~=this:SubWeaponType() or this:WeaponType()~=equip1) then return false end
	else
		if equip1 ~= 0 and this:WeaponType() ~= equip1 and this:SubWeaponType() ~= equip1 then return false end
		if equip2 ~= 0 and this:WeaponType() ~= equip2 and this:SubWeaponType() ~= equip2 then return false end
	end
	if params[5]&4==4 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsTargetDoubleEquipAndAttackSkillElementToEnemy')

-- 二刀特定装備で属性スキル攻撃
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsDoubleEquipMultiCondAndAttackSkill(_target, params)
	Field:FrameUpdate(_target)
	if this:WeaponType()==0 or this:SubWeaponType()==0 then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or (CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:WeaponType()) and CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:SubWeaponType()))) then return false end elseif not (params[2]==this:WeaponType() and params[2]==this:SubWeaponType()) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsDoubleEquipMultiCondAndAttackSkill')

-- 二刀複数条件特定装備で特定スキルクリティカル攻撃
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsDoubleEquipMultiCondAndAttackSkillCritical(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:IsCRT() then return false end
	if this:WeaponType()==0 or this:SubWeaponType()==0 then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or (CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:WeaponType()) and CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:SubWeaponType()))) then return false end elseif not (params[2]==this:WeaponType() and params[2]==this:SubWeaponType()) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsDoubleEquipMultiCondAndAttackSkillCritical')

-- 特定属性二刀装備で特定スキル攻撃
-- params[1]:敵・味方
-- params[2]:装備属性1
-- params[3]:装備属性2
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetElementDoubleEquipAndAttackSkill(_target, params)
local equip1,equip2
	Field:FrameUpdate(_target)
	if this:WeaponType()==0 or this:SubWeaponType()==0 then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	equip1 = params[5]&1==1 and Process:Param(params[2]) or (params[2]~=0 and params[2] or ELEMENT_UNMENTIONED)
	equip2 = params[5]&2==2 and Process:Param(params[3]) or (params[3]~=0 and params[3] or ELEMENT_UNMENTIONED)
	if (not this:WeaponElem(equip1) or not this:SubWeaponElem(equip2)) and (not this:WeaponElem(equip2) or not this:SubWeaponElem(equip1)) then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetElementDoubleEquipAndAttackSkill')

-- 特定属性二刀特定装備で敵に特定スキル攻撃
-- params[1]:装備属性
-- params[2]:装備タイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetElementDoubleEquipMultiCondAndValidAttackSkillToEnemy(_target, params)
	Field:FrameUpdate(_target)
	if this:WeaponType()==0 or this:SubWeaponType()==0 then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[1]==0 or (CompareFromProcParamIndex(GetProcParamIndex(params[1]), this, 'WeaponElem', true) and CompareFromProcParamIndex(GetProcParamIndex(params[1]), this, 'SubWeaponElem', true))) then return false end elseif not (this:WeaponElem(params[1]) and this:SubWeaponElem(params[1])) then return false end
	if params[5]&2==2 then if not (params[2]==0 or (CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:WeaponType()) and CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:SubWeaponType()))) then return false end elseif not (params[2]==this:WeaponType() and params[2]==this:SubWeaponType()) then return false end
	if params[5]&4==4 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif Bullet:Element(params[3]) then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsTargetElementDoubleEquipMultiCondAndValidAttackSkillToEnemy')

-- 一刀特定装備
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetSingleWeaponSkill(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	equip1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	equip2 = this:WeaponType()==0 and this:SubWeaponType() or this:WeaponType()
	if equip1 ~= 0 and equip2 ~= equip1 then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetSingleWeaponSkill')

-- 一刀特定装備で特定スキル攻撃
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:スキル属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetSingleWeaponAndAttackSkill(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	equip1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	equip2 = this:WeaponType()==0 and this:SubWeaponType() or this:WeaponType()
	if equip1 ~= 0 and equip2 ~= equip1 then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetSingleWeaponAndAttackSkill')

-- 一刀特定装備で指定INDEXの攻撃特技
-- params[1]:敵・味方
-- params[2]:特技INDEX_INDEX
-- params[3]:装備タイプ
-- params[4]:スキル属性
-- params[5]:パラメータタイプ(bit)
function IsTargetSingleWeaponAndTargetUIIndexAttackSkill(_target, params)
local skl
local equip1, equip2
	Field:FrameUpdate(_target)
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) or not Bullet:SKL_Type(SKILL_SKILL) then return false end
	equip1 = (params[5]&1==1 and params[3]~=0) and Process:Param(params[3]) or params[3]
	equip2 = this:WeaponType()==0 and this:SubWeaponType() or this:WeaponType()
	if equip1 ~= 0 and equip2 ~= equip1 then return false end
	skl = Bullet:GetParentSkill()
	if skl==nil or (params[2]~=0 and Process:Param(params[2])~=0 and Process:Param(params[2])~=skl:IndexUI()) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetSingleWeaponAndTargetUIIndexAttackSkill')

-- 一刀特定装備で特定スキルクリティカル攻撃
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:スキル属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetSingleWeaponAndAttackSkillCritical(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if not Bullet:IsCRT() then return false end
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	equip1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	equip2 = this:WeaponType()==0 and this:SubWeaponType() or this:WeaponType()
	if equip1 ~= 0 and equip2 ~= equip1 then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetSingleWeaponAndAttackSkillCritical')

-- 一刀特定装備で特定種別属性攻撃スキル
-- params[1]:装備タイプ
-- params[2]:スキル種別
-- params[3]:スキル属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetSingleWeaponAndValidElementAndKindAttackSkill(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	equip1 = (params[5]&1==1 and params[1]~=0) and Process:Param(params[1]) or params[1]
	equip2 = this:WeaponType()==0 and this:SubWeaponType() or this:WeaponType()
	if equip1 ~= 0 and equip2 ~= equip1 then return false end
	if params[5]&2==2 then if not (params[2]==0 or Process:Param(params[2])==Bullet:SKL_Kind()) then return false end elseif params[2]~=Bullet:SKL_Kind() then return false end
	if params[5]&4==4 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsTargetSingleWeaponAndValidElementAndKindAttackSkill')

-- 一刀特定装備で特定敵タイプに特定スキル攻撃
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:エネミータイプ
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetEnemyTypeAndSingleWeaponAttackSkill(_target, params)
local equip1, equip2
local t
local boss
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&2==2 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	equip1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	equip2 = this:WeaponType()==0 and this:SubWeaponType() or this:WeaponType()
	if equip1 ~= 0 and equip2 ~= equip1 then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetEnemyTypeAndSingleWeaponAttackSkill')

-- 一刀特定装備で特定敵タイプの敵に特定スキル攻撃
-- params[1]:装備タイプ
-- params[2]:エネミータイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetEnemyTypeEnemyAndSingleWeaponAttackSkill(_target, params)
local equip1, equip2
local t
local boss
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&2==2 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	equip1 = (params[5]&1==1 and params[1]~=0) and Process:Param(params[1]) or params[1]
	equip2 = this:WeaponType()==0 and this:SubWeaponType() or this:WeaponType()
	if equip1 ~= 0 and equip2 ~= equip1 then return false end
	if params[5]&4==4 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsTargetEnemyTypeEnemyAndSingleWeaponAttackSkill')

-- 二刀特定装備で弱点属性スキル攻撃
-- params[1]:敵・味方
-- params[2]:装備タイプ1
-- params[3]:装備タイプ2
-- params[4]:スキル属性
-- params[5]:パラメータタイプ(bit)
function IsTargetDoubleEquipAndAttackWeakElement(_target, params)
local equip1,equip2
	Field:FrameUpdate(_target)
	if Bullet:Element() == ELEMENT_NONE then return false end
	if (Bullet:Target():ElemResist(Bullet:Element()) or 0)>=0 then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:Element(Process:Param(params[4]))) then return false end elseif not Bullet:Element(params[4]) then return false end
	if this:WeaponType()==0 or this:SubWeaponType()==0 then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	equip1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	equip2 = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if equip1 == equip2 then
		if equip1 ~= 0 and (this:WeaponType()~=this:SubWeaponType() or this:WeaponType()~=equip1) then return false end
	else
		if equip1 ~= 0 and this:WeaponType() ~= equip1 and this:SubWeaponType() ~= equip1 then return false end
		if equip2 ~= 0 and this:WeaponType() ~= equip2 and this:SubWeaponType() ~= equip2 then return false end
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetDoubleEquipAndAttackWeakElement')

-- 特定装備時にクリティカルが発生したかどうか
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetEquipCritical(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==this:WeaponType() or Process:Param(params[2])==this:SubWeaponType() or Process:Param(params[2])==this:ArmorType()) then return false end elseif not (params[2]==this:WeaponType() or params[2]==this:SubWeaponType() or params[2]==this:ArmorType()) then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:IsCRT()
end
SetCondLog('IsTargetEquipCritical')

-- 特定装備時キラー発生
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetEquipKiller(_target, params)
local flag
	Field:FrameUpdate(_target)
	for i,j in ipairs(Bullet:Target():Type()) do
		if Bullet:IsKiller(j) then flag = true break end
	end
	if not flag then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==this:WeaponType() or Process:Param(params[2])==this:SubWeaponType() or Process:Param(params[2])==this:ArmorType()) then return false end elseif not (params[2]==this:WeaponType() or params[2]==this:SubWeaponType() or params[2]==this:ArmorType()) then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetEquipKiller')

-- 特定装備で特定敵タイプに指定スキル
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:エネミータイプ
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetEnemyTypeAndTargetEquipSkill(_target, params)
local t
local boss
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&2==2 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==this:WeaponType() or Process:Param(params[2])==this:SubWeaponType() or Process:Param(params[2])==this:ArmorType()) then return false end elseif not (params[2]==this:WeaponType() or params[2]==this:SubWeaponType() or params[2]==this:ArmorType()) then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetEnemyTypeAndTargetEquipSkill')

-- 特定装備で特定敵タイプから指定攻撃スキル
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:エネミータイプ
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetEnemyTypeAndTargetEquipAttackSkill(_target, params)
local t
local boss
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&2==2 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==this:WeaponType() or Process:Param(params[2])==this:SubWeaponType() or Process:Param(params[2])==this:ArmorType()) then return false end elseif not (params[2]==this:WeaponType() or params[2]==this:SubWeaponType() or params[2]==this:ArmorType()) then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetEnemyTypeAndTargetEquipAttackSkill')

-- 特定属性の武器装備時に攻撃スキル
-- params[1]:敵・味方
-- params[2]:武器属性
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetElementWeaponEquip(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==this:WeaponElem() or Process:Param(params[2])==this:SubWeaponElem()) then return false end elseif not (params[2]==this:WeaponElem() or params[2]==this:SubWeaponElem()) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Process:Param(params[3])==Bullet:Element()) then return false end elseif params[3]~=Bullet:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetElementWeaponEquip')

-- 特定属性特定武器装備で敵に特定スキル攻撃
-- params[1]:装備属性
-- params[2]:装備タイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetElementWeaponEquipMultiCondAndValidAttackSkillToEnemy(_target, params)
local res1, res2 = true, true
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then
		if params[1]~=0 then
			if not CompareFromProcParamIndex(GetProcParamIndex(params[1]), this, 'WeaponElem', true) then res1 = false end
			if not CompareFromProcParamIndex(GetProcParamIndex(params[1]), this, 'SubWeaponElem', true) then res2 = false end
		end
	else
		if not this:WeaponElem(params[1]) then res1 = false end
		if not this:SubWeaponElem(params[1]) then res2 = false end
	end
	if params[5]&2==2 then
		if params[2]~=0 then
			if res1 and not CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:WeaponType()) then res1 = false end
			if res2 and not CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:SubWeaponType()) then res2 = false end
		end
	else
		if res1 and not params[2]==this:WeaponType() then res1 = false end
		if res2 and not params[2]==this:SubWeaponType() then res2 = false end
	end
	if not (res1 or res2) then return false end
	if params[5]&4==4 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif Bullet:Element(params[3]) then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsTargetElementWeaponEquipMultiCondAndValidAttackSkillToEnemy')

-- 敵に特定スキル攻撃時装備条件
-- params[1]:武器装備状況INDEX
-- params[2]:防具装備状況INDEX
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsValidAttackSkillToEnemyWithEquipCond(_target, params)
local isEquip,notEquip = 1,2
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if not (params[1]==0 or Process:Param(params[1])==0 or Process:Param(params[1])==((this:WeaponType()==0 and this:SubWeaponType()==0) and notEquip or isEquip)) then return false end
	if not (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==(this:ArmorType()==0 and notEquip or isEquip)) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsValidAttackSkillToEnemyWithEquipCond')

-- 絶対装備で敵に特定スキル攻撃
-- params[1]:武器装備状況
-- params[2]:防具装備状況
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetAbsoluteEquipAndAttackSkill(_target, params)
local isEquip,notEquip = 1,2
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if not (params[1]==0 or params[1]==((this:WeaponType()==0 and this:SubWeaponType()==0) and notEquip or isEquip)) then return false end
	if not (params[2]==0 or params[2]==(this:ArmorType()==0 and notEquip or isEquip)) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsTargetAbsoluteEquipAndAttackSkill')

-- 特定装備で指定攻撃スキル
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetEquipAttackSkill(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:WeaponType()) or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:SubWeaponType()) or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:ArmorType())) then return false end elseif not (params[2]==this:WeaponType() or params[2]==this:SubWeaponType() or params[2]==this:ArmorType()) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetEquipAttackSkill')

-- 特定装備で特定キャラタイプの敵に攻撃
-- params[1]:装備タイプ
-- params[2]:キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetEquipAndTargetCharaTypeEnemyAttackSkill(_target, params)
local t
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[1]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[1]), this:WeaponType()) or CompareFromProcParamIndex(GetProcParamIndex(params[1]), this:SubWeaponType()) or CompareFromProcParamIndex(GetProcParamIndex(params[1]), this:ArmorType())) then return false end elseif not (params[1]==this:WeaponType() or params[1]==this:SubWeaponType() or params[1]==this:ArmorType()) then return false end
	if params[5]&4==4 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif Bullet:Element(params[3]) then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&2==2 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Type')) then return false end elseif not t:Type(params[2]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsTargetEquipAndTargetCharaTypeEnemyAttackSkill')

-- 特定装備で武器と同属性の特定攻撃
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetEquipAndWeaponElementAttackSkill(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if not this:WeaponElem(Bullet:Element()) and not this:SubWeaponElem(Bullet:Element()) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:WeaponType()) or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:SubWeaponType()) or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:ArmorType())) then return false end elseif not (params[2]==this:WeaponType() or params[2]==this:SubWeaponType() or params[2]==this:ArmorType()) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetEquipAndWeaponElementAttackSkill')

-- ガードが発生したかどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsGuard(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:IsGuard() then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsGuard')

-- ガード非発生
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsNotGuard(_target, params)
	Field:FrameUpdate(_target)
	if Bullet:IsGuard() then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsNotGuard')

-- 弱点属性かどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsWeakElement(_target, params)
	Field:FrameUpdate(_target)
	if Bullet:Element() == ELEMENT_NONE then return false end
	-- TODO：AIの試し撃ち中にElemResistが取れないようなので、直してもらう
	if params[5]&1==1 then if not ((params[2]==0 or Process:Param(params[2])==ELEMENT_NONE or Bullet:Element(Process:Param(params[2]))) and (Bullet:Target():ElemResist(Bullet:Element()) or 0)<0) then return false end elseif not (Bullet:Element(params[2]) and (Bullet:Target():ElemResist(Bullet:Element()) or 0)<0) then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsWeakElement')

-- 弱点属性クリティカル発生
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsWeakElementCritical(_target, params)
	Field:FrameUpdate(_target)
	if Bullet:Element() == ELEMENT_NONE or not Bullet:IsCRT() then return false end
	-- TODO：AIの試し撃ち中にElemResistが取れないようなので、直してもらう
	if params[5]&1==1 then if not ((params[2]==0 or Process:Param(params[2])==ELEMENT_NONE or Bullet:Element(Process:Param(params[2]))) and (Bullet:Target():ElemResist(Bullet:Element()) or 0)<0) then return false end elseif not (Bullet:Element(params[2]) and (Bullet:Target():ElemResist(Bullet:Element()) or 0)<0) then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsWeakElementCritical')

-- 弱点属性攻撃特定敵タイプ
-- params[1]:敵・味方
-- params[2]:エネミータイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetEnemyTypeAndWeakElementAttack(_target, params)
local t, boss
	Field:FrameUpdate(_target)
	if Bullet:Element() == ELEMENT_NONE then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	-- TODO：AIの試し撃ち中にElemResistが取れないようなので、直してもらう
	if params[5]&2==2 then if not ((params[3]==0 or Process:Param(params[3])==ELEMENT_NONE or Process:Param(params[3])==Bullet:Element()) and (Bullet:Target():ElemResist(Bullet:Element()) or 0)<0) then return false end elseif not (params[3]==Bullet:Element() and (Bullet:Target():ElemResist(Bullet:Element()) or 0)<0) then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetEnemyTypeAndWeakElementAttack')

-- 弱点属性攻撃自分特定汎用数値情報
-- params[1]:敵・味方
-- params[2]:汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsWeakElementAttackOwnerGeneralCount(_target, params)
local prm
local cond, val
	Field:FrameUpdate(_target)
	if Bullet:Element() == ELEMENT_NONE then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	-- TODO：AIの試し撃ち中にElemResistが取れないようなので、直してもらう
	if params[5]&1==1 then if not ((params[3]==0 or Process:Param(params[3])==ELEMENT_NONE or Bullet:Element(Process:Param(params[3]))) and (Bullet:Target():ElemResist(Bullet:Element()) or 0)<0) then return false end elseif not (Bullet:Element(params[3]) and (Bullet:Target():ElemResist(Bullet:Element()) or 0)<0) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[2] > 290 then
		prm = GetProcParamIndex(params[2])
		cond, val = Process:Param(prm[2]), this:GetGeneralCount(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[2] > 0 and params[2] <= 10 then
		if (this:GetGeneralCount(Process:Param(params[2])) or 0) == 0 then return false end
	elseif params[2] ~= 0 then
		return false
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsWeakElementAttackOwnerGeneralCount')

-- 対特定属性弱点
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetElementWeak(_target, params)
	Field:FrameUpdate(_target)
	-- TODO：AIの試し撃ち中にElemResistが取れないようなので、直してもらう
	if params[5]&1==1 then if not (params[2]==0 or ((Bullet:Target():ElemResist(Process:Param(params[2])) or 0) < 0)) then return false end elseif not (Bullet:Target():ElemResist(params[2]) or 0) < 0 then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetElementWeak')

-- 対特定属性弱点敵指定INDEX攻撃特技
-- params[1]:敵・味方
-- params[2]:特技INDEX INDEX
-- params[3]:属性
-- params[4]:スキル属性
-- params[5]:パラメータタイプ(bit)
function IsTargetElementWeakAndTargetUIIndexAttackSkillEnemy(_target, params)
local skl
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	skl = Bullet:GetParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) or (params[2]~=0 and Process:Param(params[2])~=0 and Process:Param(params[2])~=skl:IndexUI()) then return false end
	-- TODO：AIの試し撃ち中にElemResistが取れないようなので、直してもらう
	if params[5]&1==1 then if not (params[3]==0 or ((Bullet:Target():ElemResist(Process:Param(params[3])) or 0) < 0)) then return false end elseif not (Bullet:Target():ElemResist(params[3]) or 0) < 0 then return false end
	if params[5]&2==2 and params[4]>=0 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetElementWeakAndTargetUIIndexAttackSkillEnemy')

-- キラー発生
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsKillerBullet(_target, params)
local flag = false
	Field:FrameUpdate(_target)
	for i,j in ipairs(Bullet:Target():Type()) do
		if Bullet:IsKiller(j) then flag = true break end
	end
	if not flag then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsKillerBullet')

-- 特定キラー発生攻撃
-- params[1]:敵・味方
-- params[2]:キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetKillerAttackBullet(_target, params)
local charaType
local flag = false
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	charaType = (params[5]&1==1 and params[2]~=0) and GetProcParamArray(params[2]) or {params[2]}
	for i,j in pairs(charaType) do
		if Bullet:IsKiller(j) then flag = true break end
	end
	if not flag then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetKillerAttackBullet')

-- 特定UID生存中特定キラー発生敵特定攻撃スキル
-- params[1]:アクターUID_INDEX
-- params[2]:キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetKillerEnemyAttackSkillTargetUidAlive(_target, params)
local charaType
local u, flag, prm
	Field:FrameUpdate(_target)
	if not (Bullet:SKL_Role(SKILL_ROLE_ATTACK) and IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	charaType = (params[5]&1==1 and params[2]~=0) and GetProcParamArray(params[2]) or {params[2]}
	flag = false
	for i,j in pairs(charaType) do
		if Bullet:IsKiller(j) then flag = true break end
	end
	if not flag then return false end
	flag = false
	for i,index in pairs(GetProcParamIndex(params[1])) do
		prm = Process:Param(index)
		if index ~= 0 and prm ~= 0 then
			u = units:GetUnit(prm)
			if u:Alive() and not u:IsExcluded() then
				flag = true
				break
			end
		end
	end
	if not flag then return false end
	return true
end
SetCondLog('IsTargetKillerEnemyAttackSkillTargetUidAlive')

-- 特定キラー非発生攻撃
-- params[1]:敵・味方
-- params[2]:キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsNotTargetKillerAttackBullet(_target, params)
local charaType
local flag = true
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	charaType = (params[5]&1==1 and params[2]~=0) and GetProcParamArray(params[2]) or {params[2]}
	for i,j in pairs(charaType) do
		if Bullet:Target():Type(j) and Bullet:IsKiller(j) then flag = false break end
	end
	if not flag then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsNotTargetKillerAttackBullet')

-- キラーまたは弱点属性かどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsWeakBullet(_target, params)
local t
	Field:FrameUpdate(_target)
	if not (Bullet:IsKiller(Bullet:Target():Type()) or ((Bullet:Target():ElemResist(Bullet:Element()) or 0)<0)) then return false end
	if not Bullet:TargetSide(params[1]) then return false end
	if params[5]&4==4 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Role(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Role(params[4], CS_COMPARE_DIRECT) then return false end
	if params[5]&1==1 and params[2]>=0 then if not Bullet:Element(GetProcParamArray(params[2]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[2], CS_COMPARE_DIRECT) then return false end
	if params[5]&2==2 then t = GetProcParamIndex(params[3]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[3], CS_COMPARE_DIRECT) then return false end
	return true
end
SetCondLog('IsWeakBullet')

-- 特定キラーか弱点属性敵攻撃スキル死神条件
-- params[1]:死神条件
-- params[2]:キラータイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsWeakBulletEnemyAttackSkillGrimReaperCond(_target, params)
local t, charaType
	Field:FrameUpdate(_target)
	if not (Bullet:SKL_Role(SKILL_ROLE_ATTACK, CS_COMPARE_DIRECT) and Bullet:TargetSide(TARGET_SIDE_OPPONENT) and Bullet:GrimReaperCond(params[1])) then return false end
	if params[5]&2==2 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	if params[5]&4==4 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[4], CS_COMPARE_DIRECT) then return false end
	if (Bullet:Target():ElemResist(Bullet:Element()) or 0) < 0 then return true end
	charaType = (params[5]&1==1 and params[2]~=0) and GetProcParamArray(params[2]) or {params[2]}
	for i,j in pairs(charaType) do
		if j == 0 then return Bullet:IsKiller() end
		for k,l in pairs(int32ToUnitTypeArray(j)) do
			if Bullet:IsKiller(l) then return true end
		end
	end
	return false
end
SetCondLog('IsWeakBulletEnemyAttackSkillGrimReaperCond')

-- 指定フレーム間隔
function FrameInterval(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or this
-- 初回発火時の処理を改修 この条件以外も順次対応予定
local pcv = keepObj:GetProcCondValue()
	if pcv == nil then 
		pcv = {[1] = true} 
		keepObj:SetProcCondValue(pcv)
		return false
	end
	return true
end
SetCondLog('FrameInterval')

-- 指定フレーム間隔生存中
function FrameIntervalAlive(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or this
-- 初回発火時の処理を改修 この条件以外も順次対応予定
local pcv = keepObj:GetProcCondValue()
	if pcv == nil then 
		pcv = {[1] = true} 
		keepObj:SetProcCondValue(pcv)
		return false
	end
	return this:Alive()
end
SetCondLog('FrameIntervalAlive')

-- 指定フレーム間隔HP条件
function FrameIntervalHpCond(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1) or 0
local HpOver,HpUnder = 1,0
local res =  (Process:Param(params[2])==HpOver and this:PerHP() >= Process:Param(params[3])) or (Process:Param(params[2])==HpUnder and this:PerHP() < Process:Param(params[3]))
local isFirst = keepObj:GetKeptParam(3) or 0
	if isFirst==0 then
		keepObj:KeepParam(3, 1)
		return false
	end
	keepObj:KeepParam(1, res and 1 or 0)
	keepObj:KeepParam(2, before)
	return res
end
SetCondLog('FrameIntervalHpCond')

-- 指定フレーム間隔特技ストック数条件
-- params[1]:指定間隔
-- params[2]:特技INDEX INDEX
-- params[3]:ストック数閾値方向INDEX
-- params[4]:ストック数条件INDEX
function FrameIntervalSkillStockCond(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1) or 0
local Over,Under = 1,0
local skl, cnt, res
local isFirst = keepObj:GetKeptParam(3) or 0
	if isFirst==0 then
		keepObj:KeepParam(3, 1)
		return false
	end
	cnt = 0
	if params[2] == 0 or Process:Param(params[2]) == 0 then
		for i = 1, this:SkillCount(SKILL_SKILL) do
			cnt = cnt + this:SKL_Stock(i)
		end
	else
		skl = this:GetSkillFromIndexUI(Process:Param(params[2]))
		if skl ~= nil then cnt = skl:Stock() end
	end
	res =  (Process:Param(params[3])==Over and cnt >= Process:Param(params[4])) or (Process:Param(params[3])==Under and cnt < Process:Param(params[4]))
	keepObj:KeepParam(1, res and 1 or 0)
	keepObj:KeepParam(2, before)
	return res
end
SetCondLog('FrameIntervalSkillStockCond')

-- 指定フレーム間隔特定汎用数値情報
-- params[1]:指定間隔
-- params[2]:汎用数値情報INDEX
-- params[3]:条件方向
-- params[4]:汎用数値情報閾値
function FrameIntervalGeneralCountCond(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1) or 0
local cond, val, res
local isFirst = keepObj:GetKeptParam(3) or 0
	if isFirst==0 then
		keepObj:KeepParam(3, 1)
		return false
	end
	res = true
	if params[2] ~= 0 then
		if params[3] ~= 0 and params[4] ~= 0 then
			cond, val = Process:Param(params[3]), this:GetGeneralCount(Process:Param(params[2]))
			-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
			if cond == 0 and val == 0 then
				res = false
			elseif not procCompare(cond, val, Process:Param(params[4])) then
				res = false
			end
		elseif (this:GetGeneralCount(Process:Param(params[2])) or 0) == 0 then
			res = false
		end
	else
		res = false
	end
	keepObj:KeepParam(1, res and 1 or 0)
	keepObj:KeepParam(2, before)
	return res
end
SetCondLog('FrameIntervalGeneralCountCond')

-- 指定フレーム間隔バフ状態特定汎用数値情報
-- params[1]:指定間隔
-- params[2]:バフカテゴリ/バフID
-- params[3]:汎用数値情報INDEX
-- params[4]:条件方向
-- params[5]:汎用数値情報閾値
function FrameIntervalGeneralCountBuffCond(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or this
local pcv = keepObj:GetProcCondValue()
local prm, cond, val, res
	if pcv == nil then
		keepObj:SetProcCondValue({false, false})
		return false
	end
	res = true
	if params[3] ~= 0 then
		if params[4] ~= 0 and params[5] ~= 0 then
			cond, val = Process:Param(params[4]), this:GetGeneralCount(Process:Param(params[3]))
			-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
			if cond == 0 and val == 0 then
				res = false
			elseif not procCompare(cond, val, Process:Param(params[5])) then
				res = false
			end
		elseif (this:GetGeneralCount(Process:Param(params[3])) or 0) == 0 then
			res = false
		end
	else
		res = false
	end
	if res then
		prm = GetProcParamArray2(params[2], {}, {}, 2)
		if prm[1] < 0 and prm[1] == prm[2] then prm[2] = -prm[2] end
		if (prm[1] > 0 and not this:IsBuffCategory(prm[1])) or (prm[2] > 0 and not this:IsBuff(prm[2])) or ((prm[1]==0 and prm[2]==0) and this:VisibleBuffCount()==0) then res = false end
	end
	keepObj:SetProcCondValue({res, pcv[1]})
	return res
end
SetCondLog('FrameIntervalGeneralCountBuffCond')

-- 指定フレーム間隔非バフ状態特定汎用数値情報
-- params[1]:指定間隔
-- params[2]:バフカテゴリ/バフID
-- params[3]:汎用数値情報INDEX
-- params[4]:条件方向
-- params[5]:汎用数値情報閾値
function FrameIntervalGeneralCountNotBuffCond(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or this
local pcv = keepObj:GetProcCondValue()
local prm, cond, val, res
	if pcv == nil then
		keepObj:SetProcCondValue({false, false})
		return false
	end
	res = true
	if params[3] ~= 0 then
		if params[4] ~= 0 and params[5] ~= 0 then
			cond, val = Process:Param(params[4]), this:GetGeneralCount(Process:Param(params[3]))
			-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
			if cond == 0 and val == 0 then
				res = false
			elseif not procCompare(cond, val, Process:Param(params[5])) then
				res = false
			end
		elseif (this:GetGeneralCount(Process:Param(params[3])) or 0) == 0 then
			res = false
		end
	else
		res = false
	end
	if res then
		prm = GetProcParamArray2(params[2], {}, {}, 2)
		if prm[1] < 0 and prm[1] == prm[2] then prm[2] = -prm[2] end
		if (prm[1] > 0 and this:IsBuffCategory(prm[1])) or (prm[2] > 0 and this:IsBuff(prm[2])) or ((prm[1]==0 and prm[2]==0) and this:VisibleBuffCount()~=0) then res = false end
	end
	keepObj:SetProcCondValue({res, pcv[1]})
	return res
end
SetCondLog('FrameIntervalGeneralCountNotBuffCond')

-- 特定対象指定フレーム間隔
-- params[1]:指定間隔
-- params[2]:エネミータイプ
-- params[3]:キャラタイプ
-- params[4]:性別
-- params[5]:パラメータタイプ(bit)
function FrameIntervalSpecificTarget(_target, params)
Field:FrameUpdate(_target)
local boss
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local isFirst = keepObj:GetKeptParam(1) or 0
	if isFirst==0 then
		keepObj:KeepParam(1, 1)
		return false
	end
	boss = this:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 then if not (params[4]==0 or Process:Param(params[4])==this:Gender()) then return false end elseif params[4]~=this:Gender() then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), this, 'Type')) then return false end elseif not this:Type(params[3]) then return false end
	return true
end
SetCondLog('FrameIntervalSpecificTarget')

-- 死亡中指定フレーム間隔
function DeadFrameInterval(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local cnt = keepObj:GetKeptParam(1) or 0
local callCnt = keepObj:GetKeptParam(2) or 0
local prm2 = (params[3]==0 and params[2] or Process:Param(params[2]))
local prm4 = (params[5]==0 and params[4] or Process:Param(params[4]))
	if prm4 < 0 or callCnt < prm4 then
		if this:Alive() then
			keepObj:KeepParam(1, 1)
		elseif cnt>=prm2 then
			keepObj:KeepParam(1, 1)
			keepObj:KeepParam(2, 1, CALCULATE_ADD)
			return true
		else
			keepObj:KeepParam(1, 1, CALCULATE_ADD)
		end
	end
	return false
end
SetCondLog('DeadFrameInterval')

-- 指定フレーム間隔個性LV条件_PP
-- params[1]:指定間隔INDEX
-- params[2]:個性LV閾値方向INDEX
-- params[2]:個性INDEX INDEX
-- params[4]:個性LV条件INDEX
function FrameIntervalPersonalityLevel_PP(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1) or 0
local Over,Under = 1,0
local res =  (Process:Param(params[2])==Over and this:PersonalityLevel(Process:Param(params[3])) >= Process:Param(params[4])) or (Process:Param(params[2])==Under and this:PersonalityLevel(Process:Param(params[3])) < Process:Param(params[4]))
local isFirst = keepObj:GetKeptParam(3) or 0
	if isFirst==0 then
		keepObj:KeepParam(3, 1)
		return false
	end
	keepObj:KeepParam(1, res and 1 or 0)
	keepObj:KeepParam(2, before)
	return res
end
SetCondLog('FrameIntervalPersonalityLevel_PP')

-- ユニットID条件
-- params[1]:ユニットID
-- params[2]:ユニットドレスID
-- params[3]:キャラクターID
-- params[4]:パラメータタイプ(bit)
function UnitId(_target, params)
	Field:FrameUpdate(_target)
	if params[4]&1==1 then if not (params[1]==0 or Process:Param(params[1])==this:UnitID(true)) then return false end elseif params[1]~=this:UnitID(true) then return false end
	if params[4]&2==2 then if not (params[2]==0 or Process:Param(params[2])==this:UnitID(false)) then return false end elseif params[2]~=this:UnitID(false) then return false end
	if params[4]&4==4 then if not (params[3]==0 or Process:Param(params[3])==this:CharaID()) then return false end elseif params[3]~=this:CharaID() then return false end
	return true
end
SetCondLog('UnitId')

-- ステータス比較
-- params[1]:条件方向INDEX
-- params[2]:比較元ステータス
-- params[3]:比較先ステータス
-- params[4]:パラメータタイプ(bit)
function ComparePureStatus(_target, params)
local status1,status2
	Field:FrameUpdate(_target)
	status1 = (params[4]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	status2 = (params[4]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	return procCompare(Process:Param(params[1]), this:PureStatus(status1), this:PureStatus(status2))
end
SetCondLog('ComparePureStatus')

-- 全体純粋ステータス比較
-- params[1]:条件方向INDEX
-- params[2]:敵味方
-- params[3]:比較元ステータス
-- params[4]:比較先ステータス
-- params[5]:パラメータタイプ(bit)
function CompareWholePureStatus(_target, params)
local Over,Under = 1,0
local targetSide,status1,status2
	Field:FrameUpdate(_target)
	if Process:Param(params[1]) ~= Over and Process:Param(params[1]) ~= Under then return false end
	if params[5]&1==1 and params[2]~=0 then targetSide = Process:Param(params[2]) else targetSide = params[2] end
	status1 = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	status2 = (params[5]&4==4 and params[4]~=0) and Process:Param(params[4]) or params[4]
	for i,u in pairs(units:GetCondUnitList(targetSide, TARGET_COND_BOTH, UNIT_COND_NONE)) do
		if not ((Process:Param(params[1]) == Over and procCompare(Over, this:PureStatus(status1), u:PureStatus(status2))) or (Process:Param(params[1]) == Under and procCompare(Over, u:PureStatus(status2), this:PureStatus(status1)))) then
			return false
		end
	end
	return true
end
SetCondLog('CompareWholePureStatus')

-- ユニットLV条件
function LvCond(_target, params)
Field:FrameUpdate(_target)
local before = Process:GetKeptParam(1) or 0
local LvOver,LvUnder = 1,0
local res =  (Process:Param(params[1])==LvOver and this:Level() >= Process:Param(params[2])) or (Process:Param(params[1])==LvUnder and this:Level() < Process:Param(params[2]))
	Process:KeepParam(1, res and 1 or 0)
	Process:KeepParam(2, before)
	return res
end
SetCondLog('LvCond')

-- HPが閾値を跨いだ時
function HpTrigger(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj, keepObj2 = next(Buff:Parent()) and Buff or Process, next(Buff:Parent()) and Buff or this
local ADDITION,REDUCTION = 1,0
local cnt = keepObj:GetKeptParam(1) or 0
local beforeHp = keepObj2:GetProcCondValue()
local res
	if beforeHp==nil then
		keepObj:KeepParam(1, 0)
		keepObj2:SetProcCondValue(this:PerHP())
		return false
	else
		keepObj2:SetProcCondValue(this:PerHP())
		if params[1]==0 or Process:Param(params[1])<=0 or cnt<Process:Param(params[1]) then
			res = (Process:Param(params[2])==REDUCTION and Process:Param(params[3])<beforeHp and this:PerHP()<=Process:Param(params[3])) or (Process:Param(params[2])==ADDITION and Process:Param(params[3])>beforeHp and this:PerHP()>=Process:Param(params[3]))
			if res then keepObj:KeepParam(1, 1, CALCULATE_ADD) end
			return res
		end
	end
	return false
end
SetCondLog('HpTrigger')

-- ボスWAVEでHPが閾値を跨いだ時
function IsBossWaveHpTrigger(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local ADDITION,REDUCTION = 1,0
local cnt = keepObj:GetKeptParam(1) or 0
local beforeHp = keepObj:GetKeptParam(2)
local res
	if beforeHp==nil then
		keepObj:KeepParam(1, 0)
		keepObj:KeepParam(2, this:PerHP())
		return false
	elseif params[1]==0 or Process:Param(params[1])<=0 or cnt<Process:Param(params[1]) then
		res = Field:IsBoss() and procCompare(Process:Param(params[2]), this:PerHP(), Process:Param(params[3]), beforeHp)
		keepObj:KeepParam(2, this:PerHP())
		if res then keepObj:KeepParam(1, 1, CALCULATE_ADD) end
		return res
	end
	return false
end
SetCondLog('IsBossWaveHpTrigger')

-- HPが閾値を跨いだ時に特定UIDのアクターが生存
function HpTriggerTargetUidAlive(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local u = units:GetUnit(Process:Param(params[4]))
local ADDITION,REDUCTION = 1,0
local cnt = keepObj:GetKeptParam(1) or 0
local beforeHp = keepObj:GetKeptParam(2)
local res
	if beforeHp==nil then
		keepObj:KeepParam(1, 0)
		keepObj:KeepParam(2, this:PerHP())
		return false
	elseif params[1]==0 or Process:Param(params[1])<=0 or cnt<Process:Param(params[1]) then
		res = (Process:Param(params[2])==REDUCTION and Process:Param(params[3])<beforeHp and this:PerHP()<=Process:Param(params[3])) or (Process:Param(params[2])==ADDITION and Process:Param(params[3])>beforeHp and this:PerHP()>=Process:Param(params[3]))
		res = res and u:Alive() and not u:IsExcluded()
		keepObj:KeepParam(2, this:PerHP())
		if res then keepObj:KeepParam(1, 1, CALCULATE_ADD) end
		return res
	end
	return false
end
SetCondLog('HpTriggerTargetUidAlive')

-- HP閾値跨ぎ特定汎用数値情報
-- params[1]:発動条件方向
-- params[2]:残りHP閾値
-- params[3]:汎用数値情報番号
-- params[4]:条件方向
-- params[5]:汎用数値情報閾値
function HpTriggerGeneralCountCond(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or this
local beforeHp = keepObj:GetProcCondValue()
local prm, val
	if beforeHp==nil then
		-- keepObj:KeepParam(1, 0)
		keepObj:SetProcCondValue(this:PerHP())
		return false
	else
		keepObj:SetProcCondValue(this:PerHP())
		if not procCompare(Process:Param(params[1])&1, this:PerHP(), Process:Param(params[2]), beforeHp) then return false end
		prm = {params[3]==0 and 0 or Process:Param(params[3]), params[4]==0 and -1 or params[4]==params[1] and Process:Param(params[4])>>1 or Process:Param(params[4]), params[5]==0 and 0 or Process:Param(params[5])}
		if prm[1] > 0 then
			val = this:GetGeneralCount(prm[1]) or 0
			-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
			if prm[2] == 0 and val == 0 then return false end
			if prm[2] == -1 then
				if prm[3] < 0 and val == 0 then return false end
				if prm[3] == 0 then prm[2], prm[3] = 1, 1 end
			end
			if not procCompare(prm[2], val, prm[3]) then return false end
		end
		-- keepObj:KeepParam(1, 1, CALCULATE_ADD)
		return true
	end
	return false
end
SetCondLog('HpTriggerGeneralCountCond')

-- HP状況
function HpCond(_target, params)
Field:FrameUpdate(_target)
local before = Process:GetKeptParam(1) or 0
local HpOver,HpUnder = 1,0
local res =  (Process:Param(params[1])==HpOver and this:PerHP() >= Process:Param(params[2])) or (Process:Param(params[1])==HpUnder and this:PerHP() < Process:Param(params[2]))
	Process:KeepParam(1, res and 1 or 0)
	Process:KeepParam(2, before)
	return res
end
SetCondLog('HpCond')

-- HP指定量変動毎
-- params[1]:条件方向INDEX
-- params[2]:HP変動値INDEX
-- params[3]:オプション
-- params[4]:ワーク番号
function HpChangeInterval(_target, params)
Field:FrameUpdate(_target)
local ADDITION,REDUCTION = 1,0
local ever, defeatReset
local pcv = this:GetProcCondValue() or {}
local beforeHp, changedHp = pcv[1], (pcv[2] or 0)
local res = 0
	if params[3] < 0 and params[3] >= -10 then params[3] = Process:Param(-(params[3])) end
	ever = bitToBoolean(params[3], 1)
	defeatReset = bitToBoolean(params[3], 2)
	if beforeHp~=nil then
		if Process:Param(params[1]) == ADDITION then
			changedHp = changedHp + math.max(this:PerHP() - beforeHp, 0)
		elseif Process:Param(params[1]) == REDUCTION then
			changedHp = changedHp + math.max(beforeHp - this:PerHP(), 0)
		end
		if changedHp >= Process:Param(params[2]) then
			res = math.floor(changedHp / Process:Param(params[2]))
			changedHp = changedHp - (Process:Param(params[2]) * res)
			if params[4] > 0 and params[4] <= 5 then
				Process:KeepParam(params[4], res, nil, ever)
			end
		end
	end
	if not this:Alive() and defeatReset then
		changedHp = 0
	end
	pcv[1] = this:PerHP()
	pcv[2] = changedHp
	this:SetProcCondValue(pcv, ever)
	return (res > 0)
end
SetCondLog('HpChangeInterval')

-- MPが閾値を跨いだ時
function MpTrigger(_target, params)
Field:FrameUpdate(_target)
local ADDITION,REDUCTION = 1,0
local cnt = Process:GetKeptParam(1) or 0
local beforeMp = Process:GetKeptParam(2)
local res
	if beforeMp==nil then
		Process:KeepParam(1, 0)
		Process:KeepParam(2, this:PerMP())
		return false
	elseif params[1]==0 or Process:Param(params[1])<=0 or cnt<Process:Param(params[1]) then
		res = (Process:Param(params[2])==REDUCTION and Process:Param(params[3])<beforeMp and this:PerMP()<=Process:Param(params[3])) or (Process:Param(params[2])==ADDITION and Process:Param(params[3])>beforeMp and this:PerMP()>=Process:Param(params[3]))
		Process:KeepParam(2, this:PerMP())
		if res then Process:KeepParam(1, 1, CALCULATE_ADD) end
		return res
	end
	return false
end
SetCondLog('MpTrigger')

-- MP条件
function MpCond(_target, params)
Field:FrameUpdate(_target)
local before = Process:GetKeptParam(1) or 0
local MpOver,MpUnder = 1,0
local res =  (Process:Param(params[1])==MpOver and this:PerMP() >= Process:Param(params[2])) or (Process:Param(params[1])==MpUnder and this:PerMP() < Process:Param(params[2]))
	Process:KeepParam(1, res and 1 or 0)
	Process:KeepParam(2, before)
	return res
end
SetCondLog('MpCond')

-- MP値条件
-- params[1]:条件INDEX
-- params[2]:MP閾値INDEX
function MpValueCond(_target, params)
Field:FrameUpdate(_target)
local before = Process:GetKeptParam(1) or 0
local res =  procCompare(Process:Param(params[1]), this:MP(), Process:Param(params[2]))
	Process:KeepParam(1, res and 1 or 0)
	Process:KeepParam(2, before)
	return res
end
SetCondLog('MpValueCond')

-- MP確認
-- params[1]:直値INDEX
-- params[2]:最大MP倍率INDEX
function MpFulfill(_target, params)
	Field:FrameUpdate(_target)
	return (this:MP() >= (math.max(math.ceil(Process:Param(params[1]) + (this:MaxMP() * Process:Param(params[2]) / Pct100)), 1)))
end
SetCondLog('MpFulfill')

-- MP増減
-- params[1]:閾値方向INDEX
function MpAddOrMinus(_target, params)
Field:FrameUpdate(_target)
local before = Process:GetKeptParam(1)
local Over,Under = 1,0
local res = false
	if before ~= nil then
		res = (Process:Param(params[1])==Over and this:MP() >= before) or (Process:Param(params[1])==Under and this:MP() < before)
		Process:KeepParam(2, before)
	end
	Process:KeepParam(1, this:MP())
	return res
end
SetCondLog('MpAddOrMinus')

-- エーテル状況
-- params[1]:超必殺技INDEX
-- params[2]:閾値方向INDEX
-- params[3]:エーテル閾値INDEX
function EtherCond(_target, params)
Field:FrameUpdate(_target)
local before = Process:GetKeptParam(1) or 0
local EtherOver,EtherUnder = 1,0
local PerEther = round(this:Ether() / this:SKL_Cost(SKILL_SPECIAL, params[1]) * Pct100)
local res =  (Process:Param(params[2])==EtherOver and PerEther >= Process:Param(params[3])) or (Process:Param(params[2])==EtherUnder and PerEther < Process:Param(params[3]))
	Process:KeepParam(1, res and 1 or 0)
	Process:KeepParam(2, before)
	return res
end
SetCondLog('EtherCond')

-- 特定汎用情報
-- params[1]:汎用情報条件INDEX
-- params[2]:条件オプションINDEX 不問(0)/ON(1)/OFF(2) INDEX自体が0の場合はON
function GeneralInfoCond(_target, params)
local flagCond
	Field:FrameUpdate(_target)
	flagCond = (params[2]>0 and Process:Param(params[2]) or 1)
	return (params[1] <= 0 or (flagCond <= 0 or (not toBoolean(this:GetGeneralInfo(Process:Param(params[1]))) ~= (flagCond == 1))))
end
SetCondLog('GeneralInfoCond')

-- 特定汎用数値情報
-- params[1]:汎用数値情報INDEX
-- params[2]:条件方向
-- params[3]:汎用数値情報閾値
function GeneralCountCond(_target, params)
local cond, val
	Field:FrameUpdate(_target)
	if params[1] ~= 0 then
		if params[2] ~= 0 and params[3] ~= 0 then
			cond, val = Process:Param(params[2]), this:GetGeneralCount(Process:Param(params[1]))
			-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
			if cond == 0 and val == 0 then return false end
			if not procCompare(cond, val, Process:Param(params[3])) then return false end
		elseif (this:GetGeneralCount(Process:Param(params[1])) or 0) == 0 then
			return false
		end
	else
		return false
	end
	return true
end
SetCondLog('GeneralCountCond')

-- 特定LV差の敵である
-- params[1]:閾値方向INDEX
-- params[2]:相対LV閾値INDEX
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function LvDiffCond(_target, params)
local LvOver,LvUnder = 1,0
local t, res
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	res = (Process:Param(params[1])==LvOver and t:Level() >= this:Level() + Process:Param(params[2])) or (Process:Param(params[1])==LvUnder and t:Level() < this:Level() + Process:Param(params[2]))
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT) and res
end
SetCondLog('LvDiffCond')

-- 装備状況
-- params[1]:武器装備状況INDEX
-- params[2]:防具装備状況INDEX
function EquipCond(_target, params)
local isEquip,notEquip = 1,2
	Field:FrameUpdate(_target)
	if not (params[1]==0 or Process:Param(params[1])==0 or Process:Param(params[1])==((this:WeaponType()==0 and this:SubWeaponType()==0) and notEquip or isEquip)) then return false end
	if not (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==(this:ArmorType()==0 and notEquip or isEquip)) then return false end
	return true
end
SetCondLog('EquipCond')

-- 絶対装備状況
-- params[1]:武器装備状況
-- params[2]:防具装備状況
-- params[3]:アクセサリ装備状況
function AbsoluteEquipCond(_target, params)
local isEquip,notEquip = 1,2
	Field:FrameUpdate(_target)
	if not (params[1]==0 or params[1]==((this:WeaponType()==0 and this:SubWeaponType()==0) and notEquip or isEquip)) then return false end
	if not (params[2]==0 or params[2]==(this:ArmorType()==0 and notEquip or isEquip)) then return false end
	if not (params[3]==0 or params[3]==((this:AccessoryElem(1)==nil and this:AccessoryElem(2)==nil) and notEquip or isEquip)) then return false end
	return true
end
SetCondLog('AbsoluteEquipCond')

-- 特定装備時
-- params[1]:武器装備状況
-- params[2]:武器装備状況(追加条件)
-- params[3]:パラメータタイプ(bit)
function IsTargetEquip(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if params[3]&1==1 and params[1]~=0 then equip1 = Process:Param(params[1]) else equip1 = params[1] end
	if params[3]&2==2 and params[2]~=0 then equip2 = Process:Param(params[2]) else equip2 = params[2] end
	if equip1 ~= 0 and equip1 ~= this:WeaponType() and equip1 ~= this:SubWeaponType() and equip1 ~= this:ArmorType() then return false end
	if equip2 ~= 0 and equip2 ~= this:WeaponType() and equip2 ~= this:SubWeaponType() and equip2 ~= this:ArmorType() then return false end
	if equip1 ~= 0 and equip1 == equip2 and this:WeaponType() ~= this:SubWeaponType() then return false end
	-- 二刀流対応のため
	-- if params[3]&1==1 then if not (params[1]==0 or Process:Param(params[1])==this:WeaponType() or Process:Param(params[1])==this:SubWeaponType() or Process:Param(params[1])==this:ArmorType()) then return false end elseif not (params[1]==this:WeaponType() or params[1]==this:SubWeaponType() or params[1]==this:ArmorType()) then return false end
	-- if params[3]&2==2 then if not (params[2]==0 or Process:Param(params[2])==this:WeaponType() or Process:Param(params[2])==this:SubWeaponType() or Process:Param(params[2])==this:ArmorType()) then return false end elseif not (params[2]==this:WeaponType() or params[2]==this:SubWeaponType() or params[2]==this:ArmorType()) then return false end
	return true
end
SetCondLog('IsTargetEquip')

-- 特定属性武器装備
-- params[1]:武器属性条件
-- params[2]:武器装備状況
-- params[3]:武器装備状況(追加条件)
-- params[4]:パラメータタイプ(bit)
function IsTargetElementWeapon(_target, params)
local elem, equip1, equip2
	Field:FrameUpdate(_target)
	if this:WeaponType()==0 and this:SubWeaponType()==0 then return false end
	if params[4]&1==1 and params[1]>=0 then if params[1]==0 then elem = ELEMENT_UNMENTIONED else elem = Process:Param(params[1]) end else elem = params[1] end
	-- if params[4]&1==1 then if not (params[1]==0 or this:WeaponElem(Process:Param(params[1])) or this:SubWeaponElem(Process:Param(params[1]))) then return false end elseif not (this:WeaponElem(params[1]) or this:SubWeaponElem(params[1])) then return false end
	if params[4]&2==2 and params[2]~=0 then equip1 = Process:Param(params[2]) else equip1 = params[2] end
	if params[4]&4==4 and params[3]~=0 then equip2 = Process:Param(params[3]) else equip2 = params[3] end
	if ((equip1 ~= 0 and equip1 ~= this:WeaponType()) or not this:WeaponElem(elem)) and ((equip1 ~= 0 and equip1 ~= this:SubWeaponType()) or not this:SubWeaponElem(elem)) then return false end
	if ((equip2 ~= 0 and equip2 ~= this:WeaponType()) or not this:WeaponElem(elem)) and ((equip2 ~= 0 and equip2 ~= this:SubWeaponType()) or not this:SubWeaponElem(elem)) then return false end
	if equip1 ~= 0 and equip1 == equip2 and this:WeaponType() ~= this:SubWeaponType() then return false end
	-- 二刀流対応のため
	-- if params[3]&1==1 then if not (params[1]==0 or Process:Param(params[1])==this:WeaponType() or Process:Param(params[1])==this:SubWeaponType() or Process:Param(params[1])==this:ArmorType()) then return false end elseif not (params[1]==this:WeaponType() or params[1]==this:SubWeaponType() or params[1]==this:ArmorType()) then return false end
	-- if params[3]&2==2 then if not (params[2]==0 or Process:Param(params[2])==this:WeaponType() or Process:Param(params[2])==this:SubWeaponType() or Process:Param(params[2])==this:ArmorType()) then return false end elseif not (params[2]==this:WeaponType() or params[2]==this:SubWeaponType() or params[2]==this:ArmorType()) then return false end
	return true
end
SetCondLog('IsTargetElementWeapon')

-- 二刀特定装備
-- params[1]:武器装備状況
-- params[2]:武器装備状況(追加条件)
-- params[3]:パラメータタイプ(bit)
function IsTargetDoubleWeapon(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if this:WeaponType()==0 or this:SubWeaponType()==0 then return false end
	equip1 = (params[3]&1==1 and params[1]~=0) and Process:Param(params[1]) or params[1]
	equip2 = (params[3]&2==2 and params[2]~=0) and Process:Param(params[2]) or params[2]
	if equip1 == equip2 then
		if equip1 ~= 0 and (this:WeaponType()~=this:SubWeaponType() or this:WeaponType()~=equip1) then return false end
	elseif equip2 == -1 then
		if this:WeaponType()~=this:SubWeaponType() or (equip1 ~= 0 and this:WeaponType()~=equip1) then return false end
	else
		if equip1 ~= 0 and this:WeaponType() ~= equip1 and this:SubWeaponType() ~= equip1 then return false end
		if equip2 ~= 0 and this:WeaponType() ~= equip2 and this:SubWeaponType() ~= equip2 then return false end
	end
	return true
end
SetCondLog('IsTargetDoubleWeapon')

-- 一刀特定装備
-- params[1]:武器装備状況
-- params[2]:武器装備状況(追加条件)
-- params[3]:パラメータタイプ(bit)
function IsTargetSingleWeapon(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	if params[3]&1==1 and params[1]~=0 then equip1 = Process:Param(params[1]) else equip1 = params[1] end
	if params[3]&2==2 and params[2]~=0 then equip2 = Process:Param(params[2]) else equip2 = params[2] end
	if equip1 ~= 0 and equip1 ~= this:WeaponType() and equip1 ~= this:SubWeaponType() and equip1 ~= this:ArmorType() then return false end
	if equip2 ~= 0 and equip2 ~= this:WeaponType() and equip2 ~= this:SubWeaponType() and equip2 ~= this:ArmorType() then return false end
	if equip1 ~= 0 and equip1 == equip2 and this:WeaponType() ~= this:SubWeaponType() then return false end
	return true
end
SetCondLog('IsTargetSingleWeapon')

-- 一刀特定属性武器装備
-- params[1]:武器属性条件
-- params[2]:武器装備状況
-- params[3]:防具装備状況(追加条件)
-- params[4]:パラメータタイプ(bit)
function IsTargetElementSingleWeapon(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if params[4]&1==1 then if not (params[1]==0 or Process:Param(params[1])==this:WeaponElem() or Process:Param(params[1])==this:SubWeaponElem()) then return false end elseif not (params[1]==this:WeaponElem() or params[1]==this:SubWeaponElem()) then return false end
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	if params[4]&2==2 and params[2]~=0 then equip1 = Process:Param(params[2]) else equip1 = params[2] end
	if params[4]&4==4 and params[3]~=0 then equip2 = Process:Param(params[3]) else equip2 = params[3] end
	if equip1 ~= 0 and equip1 ~= this:WeaponType() and equip1 ~= this:SubWeaponType() and equip1 ~= this:ArmorType() then return false end
	if equip2 ~= 0 and equip2 ~= this:WeaponType() and equip2 ~= this:SubWeaponType() and equip2 ~= this:ArmorType() then return false end
	if equip1 ~= 0 and equip1 == equip2 and this:WeaponType() ~= this:SubWeaponType() then return false end
	return true
end
SetCondLog('IsTargetElementSingleWeapon')

-- ボスWAVE一刀特定装備
-- params[1]:武器装備状況
-- params[2]:武器装備状況(追加条件)
-- params[3]:パラメータタイプ(bit)
function IsBossWaveTargetSingleWeapon(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if not Field:IsBoss() then return false end
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	if params[3]&1==1 and params[1]~=0 then equip1 = Process:Param(params[1]) else equip1 = params[1] end
	if params[3]&2==2 and params[2]~=0 then equip2 = Process:Param(params[2]) else equip2 = params[2] end
	if equip1 ~= 0 and equip1 ~= this:WeaponType() and equip1 ~= this:SubWeaponType() and equip1 ~= this:ArmorType() then return false end
	if equip2 ~= 0 and equip2 ~= this:WeaponType() and equip2 ~= this:SubWeaponType() and equip2 ~= this:ArmorType() then return false end
	if equip1 ~= 0 and equip1 == equip2 and this:WeaponType() ~= this:SubWeaponType() then return false end
	return true
end
SetCondLog('IsBossWaveTargetSingleWeapon')

-- シリーズ装備条件
-- シリーズ装備のうち、リーダーにあたる1つの効果のみ発動する
-- ※リーダーはシリーズ集計時に最初に処理されたものとなるが、装備破壊を加味しリーダーが装備品の場合は条件判定時に毎回交代判定を行う
-- params[1]:シリーズID INDEX
-- params[2]:条件方向INDEX
-- params[3]:シリーズ数閾値INDEX
function SeriesEquipCond(_target, params)
local res
local Over,Under = 1,0
local aff, lid = 0, 0
	Field:FrameUpdate(_target)
	aff, lid = this:GetSeriesLeader(Process:Param(params[1]))
	if aff == PROC_AFFILIATION_WEAPON or aff == PROC_AFFILIATION_ARMOR or aff == PROC_AFFILIATION_ACCESSORY then
		if this:EquipID(EQUIP_POS_WEAPON) ~= lid and this:EquipID(EQUIP_POS_ARMOR) ~= lid and this:EquipID(EQUIP_POS_ACCESSORY_1) ~= lid and this:EquipID(EQUIP_POS_ACCESSORY_2) ~= lid then
			aff, lid = Process:Affiliation(), Process:localID()
			this:SetSeriesLeader(Process:Param(params[1]), aff, lid)
		end
	end
	if aff == Process:Affiliation() and lid == Process:localID() then
		res =  (Process:Param(params[2])==Over and this:GetSeriesCount(Process:Param(params[1])) >= Process:Param(params[3])) or (Process:Param(params[2])==Under and this:GetSeriesCount(Process:Param(params[1])) < Process:Param(params[3]))
		return res
	end
	return false
end
SetCondLog('SeriesEquipCond')

-- 特定ID召喚スキル装備
-- params[1]:スキルID
-- params[2]:パラメータタイプ(bit)
function SummonSkillId(_target, params)
local skl
	Field:FrameUpdate(_target)
	skl = Field:GetSummonSkill()
	if skl==nil then return false end
	if params[2]&1==1 then if not (params[1]==0 or Process:Param(params[1])==skl:ID()) then return false end elseif params[1]~=skl:ID() then return false end
	return true
end
SetCondLog('SummonSkillId')

-- 特定対象
-- params[1]:キャラタイプ
-- params[2]:性別
-- params[3]:パラメータタイプ(bit)
function IsSpecificTarget(_target, params)
local charaType
local flag = false
	Field:FrameUpdate(_target)
	if params[3]&2==2 then if not (params[2]==0 or Process:Param(params[2])==target:Gender()) then return false end elseif params[2]~=target:Gender() then return false end
	if params[3]&1==1 and params[1]~=0 then charaType = Process:Param(params[1]) else charaType = params[1] end
	if charaType == 0 then
		flag = true
	else
		for i,j in ipairs(target:Type()) do
			if j == charaType then flag = true break end
		end
	end
	return flag
end
SetCondLog('IsSpecificTarget')

-- 特定対象2
-- params[1]:インターバル
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
function IsSpecificTarget2(_target, params)
Field:FrameUpdate(_target)
local charaType
local flag = false
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local isFirst = keepObj:GetKeptParam(1) or 0
	if isFirst == 0 then
		keepObj:KeepParam(1, 1)
		return false
	end
	if params[4]&2==2 then if not (params[3]==0 or Process:Param(params[3])==target:Gender()) then return false end elseif params[3]~=target:Gender() then return false end
	if params[4]&1==1 and params[2]~=0 then charaType = Process:Param(params[2]) else charaType = params[2] end
	if charaType == 0 then
		flag = true
	else
		for i,j in ipairs(target:Type()) do
			if j == charaType then flag = true break end
		end
	end
	return flag
end
SetCondLog('IsSpecificTarget2')

-- 自分以外の味方が全員死亡
-- params[1]:制限回数
function AllAllyDead(_target, params)
Field:FrameUpdate(_target)
local flag = false
local keepObj = next(Buff:Parent()) and Buff or Process
local cnt = keepObj:GetKeptParam(1) or 0
	if Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	if not this:Alive() then return false end
	for i,u in pairs(Process:TrigUnits()) do
		if u:RelativeSide(this) == TARGET_SIDE_ALLY and not u:Alive() then
			flag = true
			break
		end
	end
	if not flag then return false end
	for i,u in pairs(units:GetCondUnitList(TARGET_SIDE_ALLY, TARGET_COND_ALIVE, UNIT_COND_NONE)) do
		if u:ID() ~= this:ID() then return false end
	end
	keepObj:KeepParam(1, 1, CALCULATE_ADD)
	return true
end
SetCondLog('AllAllyDead')

-- ボスが死亡
function BossDead(_target, params)
	Field:FrameUpdate(_target)
	for i,u in pairs(Process:TrigUnits()) do
		if u:IsBoss() and not u:Alive() then return true end
	end
	return false
end
SetCondLog('BossDead')

-- 特定対象人数変動
-- params[1]:敵・味方
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
-- params[5]:オプション
-- 	自分を含む(0)/含まない(1) 増加に反応する(0)/しない(2) 減少に反応する(0)/しない(4) 初回発火しない(0)/する(8)
-- 	自身生存中に発火する(0)/しない(16) 自身死亡中に発火する(0)/しない(32) 乱入・復帰に反応しない(0)/する(64) 除外に反応しない(0)/する(128)
-- 	ボスWAVE中に発火する(0)/しない(256) ボスWAVE中以外に発火する(0)/しない(512)
function SpecificTargetCountChange(_target, params)
Field:FrameUpdate(_target)
local res, isFirst = false, false
local isAlive, isExcluded, beforeInfo
local cnt, cnt2 = 0, 0
if (bitToBoolean(params[5], 9) and Field:IsBoss()) or (bitToBoolean(params[5], 10) and not Field:IsBoss()) then return false end
local keepObj = next(Buff:Parent()) and Buff or this
-- pv[uid] = {isAlive, isExcluded}
local pv = keepObj:GetProcCondValue()
	if pv == nil then pv = {} isFirst = true end
	if params[4]&1==1 and params[1]~=0 then targetSide = Process:Param(params[1]) else targetSide = params[1] end
	if params[4]&2==2 and params[2]~=0 then charaType = Process:Param(params[2]) else charaType = params[2] end
	if params[4]&4==4 and params[3]~=0 then gender = Process:Param(params[3]) else gender =params[3] end
	for i,u in ipairs(units:GetCondUnitList(targetSide, TARGET_COND_ALL, UNIT_COND_NONE)) do
		if (not bitToBoolean(params[5], 1)) or u:ID() ~= this:ID() then
			isAlive, isExcluded = u:Alive(), u:IsExcluded()
			beforeInfo = pv[u:ID()]
			if (gender == 0 or u:Gender() == gender) and u:Type(charaType) then
				if not bitToBoolean(params[5], 2) then
					if isAlive and not isExcluded then
						if beforeInfo == nil then
							if bitToBoolean(params[5], 7) then
								res = true
								cnt2 = cnt2 + 1
							end
						elseif (not beforeInfo[1] or (bitToBoolean(params[5], 7) and beforeInfo[2])) then
							res = true
							cnt2 = cnt2 + 1
						end
						cnt = cnt + 1
					end
				end
				if not bitToBoolean(params[5], 3) then
					if not isAlive or (bitToBoolean(params[5], 8) and isExcluded) then
						if beforeInfo ~= nil and (beforeInfo[1] and not beforeInfo[2]) then
							res = true
							cnt2 = cnt2 + 1
						end
						cnt = cnt + 1
					end
				end
			end
			beforeInfo = {isAlive, isExcluded}
			pv[u:ID()] = beforeInfo
		end
	end
	keepObj:SetProcCondValue(pv)
	Process:KeepParam(1, cnt)
	Process:KeepParam(2, cnt2)
	if bitToBoolean(params[5], 5) and this:Alive() then return false end
	if bitToBoolean(params[5], 6) and not this:Alive() then return false end
	if isFirst then return bitToBoolean(params[5], 4) end
	return res
end
SetCondLog('SpecificTargetCountChange')

-- 特定対象人数減少
-- TODO キャラタイプ追加によるカウントずれに対応する
-- TODO 自身が死亡または除外状態中にカウントが変化した場合のずれに対応する
-- params[1]:敵・味方
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
-- params[5]:自分を含む(0)/含まない(1) 自分が死亡中は発火しない(0)/する(2)
function SpecificTargetDead(_target, params)
Field:FrameUpdate(_target)
local charaType, gender
local cnt = 0
local beforeCnt = Process:GetKeptParam(1) or 0
local flag = true
	if params[4]&1==1 and params[2]~=0 then charaType = Process:Param(params[2]) else charaType = params[2] end
	if params[4]&2==2 and params[3]~=0 then gender = Process:Param(params[3]) else gender =params[3] end
	for i,u in ipairs(units:GetCondUnitList(params[1], TARGET_COND_ALIVE, UNIT_COND_NONE)) do
		if (not bitToBoolean(params[5], 1)) or u:ID() ~= this:ID() then
			if charaType ~= 0 then
				flag = false
				for i,j in ipairs(u:Type()) do
					if j == charaType then flag = true break end
				end
			end
			if flag and gender == 0 or gender == u:Gender() then
				cnt = cnt + 1
			end
		end
	end
	Process:KeepParam(1, cnt)
	Process:KeepParam(2, beforeCnt - cnt)
	flag = (bitToBoolean(params[5], 2) or this:Alive()) and (cnt < beforeCnt)
	if flag then
		for i,u in pairs(Process:TrigUnits()) do
			if not u:Alive() and not u:IsExcluded() then return flag end
		end
	end
	return false
end

SetCondLog('SpecificTargetDead')

-- 特定ID人数減少
-- params[1]:敵・味方
-- params[2]:キャラクターID
-- params[3]:ユニットドレスID
-- params[4]:モンスターID
-- params[5]:パラメータタイプ(bit)
function SpecificIdDead(_target, params)
Field:FrameUpdate(_target)
local charaId, unitId, monsterId
local cnt = 0
local beforeCnt = Process:GetKeptParam(1) or 0
local flag = true
	if params[5]&1==1 and params[2]~=0 then charaId = Process:Param(params[2]) else charaId = params[2] end
	if params[5]&2==2 and params[3]~=0 then unitId = Process:Param(params[3]) else unitId = params[3] end
	if params[5]&4==4 and params[4]~=0 then monsterId = Process:Param(params[4]) else monsterId = params[4] end
	for i,u in ipairs(units:GetCondUnitList(params[1], TARGET_COND_ALIVE, UNIT_COND_NONE)) do
		if (charaId==0 or charaId==u:CharaID()) and ((unitId==u:UnitID() or monsterId==u:UnitID()) or (unitId==0 and monsterId==0)) then
			cnt = cnt + 1
		end
	end
	Process:KeepParam(1, cnt)
	flag = (cnt < beforeCnt)
	if flag then
		for i,u in pairs(Process:TrigUnits()) do
			if not u:Alive() and not u:IsExcluded() then return flag end
		end
	end
	return false
end
SetCondLog('SpecificIdDead')

-- 自身が生存中
function OwnAlive(_target, params)
	Field:FrameUpdate(_target)
	return this:Alive()
end
SetCondLog('OwnAlive')

-- 特定UIDが生存中
function TargetUidAlive(_target, params)
Field:FrameUpdate(_target)
local u = units:GetUnit(Process:Param(params[1]))
	return not u:IsDummy() and u:Alive()
end
SetCondLog('TargetUidAlive')

-- プロセスターゲットが特定生存状態中
-- params[1]:ターゲットID_INDEX
-- params[2]:0:不問 1:生存 2:死亡
function ProcessTargetAlive(_target, params)
Field:FrameUpdate(_target)
local u = this:GetProcessTarget(Process:Param(params[1]))
	if u == nil then return false end
	if params[2]==0 then 
		return true 
	elseif params[2]==1 then 
		return u:Alive()
	elseif params[2]==2 then 
		return  not u:Alive()
	else 
		return false 
	end
end
SetCondLog('ProcessTargetAlive')

-- 自分以外の味方全員死亡時に汎用数値情報条件
-- params[1]:汎用数値情報INDEX
-- params[2]:条件方向
-- params[3]:汎用数値情報閾値
function AllAllyDeadGeneralCountCond(_target, params)
Field:FrameUpdate(_target)
local flag, cond, val
	if not this:Alive() then return false end
	for i,u in pairs(Process:TrigUnits()) do
		if u:RelativeSide(this) == TARGET_SIDE_ALLY and not u:Alive() then
			flag = true
			break
		end
	end
	if not flag then return false end
	for i,u in pairs(units:GetCondUnitList(TARGET_SIDE_ALLY, TARGET_COND_ALIVE, UNIT_COND_NONE)) do
		if u:ID() ~= this:ID() then return false end
	end
	
	if params[1] ~= 0 then
		if params[2] ~= 0 and params[3] ~= 0 then
			cond, val = Process:Param(params[2]), this:GetGeneralCount(Process:Param(params[1]))
			-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
			if cond == 0 and val == 0 then return false end
			if not procCompare(cond, val, Process:Param(params[3])) then return false end
		elseif (this:GetGeneralCount(Process:Param(params[1])) or 0) == 0 then
			return false
		end
	else
		return false
	end
	return true
end
SetCondLog('AllAllyDeadGeneralCountCond')

-- 自身の生存状態に変化
-- params[1]:1:生存 2:死亡 3:復帰 4:除外 5:生存+復帰 6:死亡+除外
function OwnChangeAlive(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1)
local before_e = keepObj:GetKeptParam(2)
local now = this:Alive() and 1 or 0
local now_e = this:IsExcluded() and 0 or 1
	if before==nil or before_e==nil then keepObj:KeepParam(1, now) keepObj:KeepParam(2, now_e) return false end
	for i,j in pairs(Process:TrigUnits()) do
		if j:ID() == this:ID() then
			keepObj:KeepParam(1, now)
			keepObj:KeepParam(2, now_e)
			if params[1]==0 then return true end
			if (params[1]==1 or params[1]==5) and now==1 and before~=now then return true end
			if (params[1]==2 or params[1]==6) and now==0 and before~=now then return true end
			if (params[1]==3 or params[1]==5) and now_e==1 and before_e~=now_e then return true end
			if (params[1]==4 or params[1]==6) and now_e==0 and before_e~=now_e then return true end
			return false
		end
	end
	return false
end
SetCondLog('OwnChangeAlive')

-- 自身の生存状態に変化(初回あり)
-- params[1]:1:生存 2:死亡 3:復帰 4:除外 5:生存+復帰 6:死亡+除外
function OwnChangeAliveEnableFirst(_target, params)
Field:FrameUpdate(_target)
local ulist
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1)
local before_e = keepObj:GetKeptParam(2)
local now = this:Alive() and 1 or 0
local now_e = this:IsExcluded() and 0 or 1
	if before == nil or before_e == nil then
		ulist = {this}
	else
		ulist = Process:TrigUnits()
	end
	for i,j in pairs(ulist) do
		if j:ID() == this:ID() then
			keepObj:KeepParam(1, now)
			keepObj:KeepParam(2, now_e)
			if params[1]==0 then return true end
			if (params[1]==1 or params[1]==5) and now==1 and before~=now then return true end
			if (params[1]==2 or params[1]==6) and now==0 and before~=now then return true end
			if (params[1]==3 or params[1]==5) and now_e==1 and before_e~=now_e then return true end
			if (params[1]==4 or params[1]==6) and now_e==0 and before_e~=now_e then return true end
			return false
		end
	end
	return false
end
SetCondLog('OwnChangeAliveEnableFirst')

-- ボスWAVEで自身の生存状態に変化
-- params[1]:1:生存 2:死亡 3:復帰 4:除外 5:生存+復帰 6:死亡+除外
function BossWaveOwnChangeAlive(_target, params)
Field:FrameUpdate(_target)
if not Field:IsBoss() then return false end
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1)
local before_e = keepObj:GetKeptParam(2)
local now = this:Alive() and 1 or 0
local now_e = this:IsExcluded() and 0 or 1
	if before==nil or before_e==nil then keepObj:KeepParam(1, now) keepObj:KeepParam(2, now_e) return false end
	for i,j in pairs(Process:TrigUnits()) do
		if j:ID() == this:ID() then
			keepObj:KeepParam(1, now)
			keepObj:KeepParam(2, now_e)
			if params[1]==0 then return true end
			if (params[1]==1 or params[1]==5) and now==1 and before~=now then return true end
			if (params[1]==2 or params[1]==6) and now==0 and before~=now then return true end
			if (params[1]==3 or params[1]==5) and now_e==1 and before_e~=now_e then return true end
			if (params[1]==4 or params[1]==6) and now_e==0 and before_e~=now_e then return true end
			return false
		end
	end
	return false
end
SetCondLog('BossWaveOwnChangeAlive')

-- ボスWAVEで自身の生存状態に変化時MP条件
-- params[1]:1:生存 2:死亡 3:復帰 4:除外 5:生存+復帰 6:死亡+除外
-- params[2]:MP閾値方向INDEX
-- params[3]:MP条件INDEX
function BossWaveOwnChangeAliveMpCond(_target, params)
Field:FrameUpdate(_target)
local res = false
local keepObj = next(Buff:Parent()) and Buff or this
local before, before_e
local now, now_e = this:Alive(), this:IsExcluded()
	before = keepObj:GetProcCondValue() or {}
	before, before_e = before[1], before[2]
	if before==nil or before_e==nil then keepObj:SetProcCondValue({now, now_e}) return false end
	for i,j in pairs(Process:TrigUnits()) do
		if j:ID() == this:ID() then
			keepObj:SetProcCondValue({now, now_e})
			if params[1]==0 then res = true end
			if (params[1]==1 or params[1]==5) and now and before~=now then res = true end
			if (params[1]==2 or params[1]==6) and not now and before~=now then res = true end
			if (params[1]==3 or params[1]==5) and now_e and before_e~=now_e then res = true end
			if (params[1]==4 or params[1]==6) and not now_e and before_e~=now_e then res = true end
			if res then return (Field:IsBoss() and procCompare(Process:Param(params[2]), this:PerMP(), Process:Param(params[3]))) end
			return false
		end
	end
	return false
end
SetCondLog('BossWaveOwnChangeAliveMpCond')

-- 自身生存状態変化時に特定汎用数値情報条件
-- params[1]:1:生存 2:死亡 3:復帰 4:除外 5:生存+復帰 6:死亡+除外
-- params[2]:汎用数値情報INDEX
-- params[3]:条件方向
-- params[4]:汎用数値情報閾値
function OwnChangeAliveGeneralCount(_target, params)
Field:FrameUpdate(_target)
local cond, val, res
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1)
local before_e = keepObj:GetKeptParam(2)
local now = this:Alive() and 1 or 0
local now_e = this:IsExcluded() and 0 or 1
	if params[2] ~= 0 then
		if before==nil or before_e==nil then keepObj:KeepParam(1, now) keepObj:KeepParam(2, now_e) return false end
		res = false
		for i,j in pairs(Process:TrigUnits()) do
			if j:ID() == this:ID() then
				keepObj:KeepParam(1, now)
				keepObj:KeepParam(2, now_e)
				if params[1]==0 then res = true end
				if (params[1]==1 or params[1]==5) and now==1 and before~=now then res = true end
				if (params[1]==2 or params[1]==6) and now==0 and before~=now then res = true end
				if (params[1]==3 or params[1]==5) and now_e==1 and before_e~=now_e then res = true end
				if (params[1]==4 or params[1]==6) and now_e==0 and before_e~=now_e then res = true end
			end
		end
		if not res then return false end
		if params[3] ~= 0 and params[4] ~= 0 then
			cond, val = Process:Param(params[3]), this:GetGeneralCount(Process:Param(params[2]))
			-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
			if cond == 0 and val == 0 then return false end
			if not procCompare(cond, val, Process:Param(params[4])) then return false end
		elseif (this:GetGeneralCount(Process:Param(params[2])) or 0) == 0 then
			return false
		end
	else
		return false
	end
	return true
end
SetCondLog('OwnChangeAliveGeneralCount')

-- プロセスターゲットの生存状態に変化
-- params[1]:ターゲットID_INDEX
-- params[2]:1:生存 2:死亡 3:復帰 4:除外 5:生存+復帰 6:死亡+除外
function ProcessTargetChangeAlive(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1)
local before_e = keepObj:GetKeptParam(2)
local u = this:GetProcessTarget(Process:Param(params[1]))
if u == nil then return false end
local pcv = this:GetProcCondValue()
local now = u:Alive() and 1 or 0
local now_e = u:IsExcluded() and 0 or 1
	if u:ID() ~= pcv then this:SetProcCondValue(u:ID()) end
	if before==nil or before_e==nil then keepObj:KeepParam(1, now) keepObj:KeepParam(2, now_e) return false end
	for i,j in pairs(Process:TrigUnits()) do
		if j:ID() == u:ID() then
			if u:ID() ~= pcv then before = 2 before_e = 2 end
			keepObj:KeepParam(1, now)
			keepObj:KeepParam(2, now_e)
			if params[2]==0 then return true end
			if (params[2]==1 or params[2]==5) and now==1 and before~=now then return true end
			if (params[2]==2 or params[2]==6) and now==0 and before~=now then return true end
			if (params[2]==3 or params[2]==5) and now_e==1 and before_e~=now_e then return true end
			if (params[2]==4 or params[2]==6) and now_e==0 and before_e~=now_e then return true end
			return false
		end
	end
	if u:ID() ~= pcv then
		keepObj:KeepParam(1, now)
		keepObj:KeepParam(2, now_e) 
	end
	return false
end
SetCondLog('ProcessTargetChangeAlive')

-- プロセスターゲットの生存状態に変化(初回あり)
-- params[1]:ターゲットID_INDEX
-- params[2]:1:生存 2:死亡 3:復帰 4:除外 5:生存+復帰 6:死亡+除外
function ProcessTargetChangeAliveFirst(_target, params)
Field:FrameUpdate(_target)
local ulist
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1)
local before_e = keepObj:GetKeptParam(2)
local u = this:GetProcessTarget(Process:Param(params[1]))
if u == nil then return false end
local pcv = this:GetProcCondValue()
local now = u:Alive() and 1 or 0
local now_e = u:IsExcluded() and 0 or 1
	if u:ID() ~= pcv then this:SetProcCondValue(u:ID()) end
	if before==nil or before_e==nil then 
		ulist = {u}
	else
		ulist = Process:TrigUnits()
	end
	for i,j in pairs(ulist) do
		if j:ID() == u:ID() then
			if u:ID() ~= pcv then before = 2 before_e = 2 end
			keepObj:KeepParam(1, now)
			keepObj:KeepParam(2, now_e)
			if params[2]==0 then return true end
			if (params[2]==1 or params[2]==5) and now==1 and before~=now then return true end
			if (params[2]==2 or params[2]==6) and now==0 and before~=now then return true end
			if (params[2]==3 or params[2]==5) and now_e==1 and before_e~=now_e then return true end
			if (params[2]==4 or params[2]==6) and now_e==0 and before_e~=now_e then return true end
			return false
		end
	end
	if u:ID() ~= pcv then
		keepObj:KeepParam(1, now)
		keepObj:KeepParam(2, now_e) 
	end
	return false
end
SetCondLog('ProcessTargetChangeAliveFirst')

-- プロセスターゲットの生存状態変化時に特定汎用数値情報条件
-- params[1]:ターゲットID_INDEX
-- params[2]:1:生存 2:死亡 3:復帰 4:除外 5:生存+復帰 6:死亡+除外
-- params[3]:汎用数値情報INDEX
-- params[4]:条件方向
-- params[5]:汎用数値情報閾値
function ProcessTargetChangeAliveGeneralCount(_target, params)
Field:FrameUpdate(_target)
local cond, val, res
local u = this:GetProcessTarget(Process:Param(params[1]))
if u == nil then return false end
local pcv = this:GetProcCondValue()
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1)
local before_e = keepObj:GetKeptParam(2)
local now = u:Alive() and 1 or 0
local now_e = u:IsExcluded() and 0 or 1
	if params[3] ~= 0 then
		if u:ID() ~= pcv then this:SetProcCondValue(u:ID()) end
		if before==nil or before_e==nil then keepObj:KeepParam(1, now) keepObj:KeepParam(2, now_e) return false end
		res = false
		for i,j in pairs(Process:TrigUnits()) do
			if j:ID() == u:ID() then
				if u:ID() ~= pcv then before = 2 before_e = 2 end
				keepObj:KeepParam(1, now)
				keepObj:KeepParam(2, now_e)
				if params[2]==0 then res = true end
				if (params[2]==1 or params[2]==5) and now==1 and before~=now then res = true end
				if (params[2]==2 or params[2]==6) and now==0 and before~=now then res = true end
				if (params[2]==3 or params[2]==5) and now_e==1 and before_e~=now_e then res = true end
				if (params[2]==4 or params[2]==6) and now_e==0 and before_e~=now_e then res = true end
			end
		end
		if u:ID() ~= pcv then
			keepObj:KeepParam(1, now)
			keepObj:KeepParam(2, now_e) 
		end
		if not res then return false end
		if params[4] ~= 0 and params[5] ~= 0 then
			cond, val = Process:Param(params[4]), this:GetGeneralCount(Process:Param(params[3]))
			-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
			if cond == 0 and val == 0 then return false end
			if not procCompare(cond, val, Process:Param(params[5])) then return false end
		elseif (this:GetGeneralCount(Process:Param(params[3])) or 0) == 0 then
			return false
		end
	else
		return false
	end
	return true
end
SetCondLog('ProcessTargetChangeAliveGeneralCount')

-- 特定UIDのアクターの生存状態に変化
-- params[1]:アクターUID_INDEX
-- params[2]:1:生存 2:死亡 3:復帰 4:除外 5:生存+復帰 6:死亡+除外
function TargetUidChangeAlive(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1)
local before_e = keepObj:GetKeptParam(2)
local u = units:GetUnit(Process:Param(params[1]))
local now = u:Alive() and 1 or 0
local now_e = u:IsExcluded() and 0 or 1
	if before==nil or before_e==nil then keepObj:KeepParam(1, now) keepObj:KeepParam(2, now_e) return false end
	for i,j in pairs(Process:TrigUnits()) do
		if j:ID() == u:ID() then
			keepObj:KeepParam(1, now)
			keepObj:KeepParam(2, now_e)
			if params[2]==0 then return true end
			if (params[2]==1 or params[2]==5) and now==1 and before~=now then return true end
			if (params[2]==2 or params[2]==6) and now==0 and before~=now then return true end
			if (params[2]==3 or params[2]==5) and now_e==1 and before_e~=now_e then return true end
			if (params[2]==4 or params[2]==6) and now_e==0 and before_e~=now_e then return true end
			return false
		end
	end
	return false
end
SetCondLog('TargetUidChangeAlive')

-- 気絶・ブレイク状態が変化
-- params[1]:エネミータイプ
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
function OwnerBreakChange(_target, params)
local boss
local charaType
local flag = false
	Field:FrameUpdate(_target)
	boss = this:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[4]&1==1 then if not (params[1]==0 or Process:Param(params[1])==boss) then return false end elseif (params[1]==0 and ENEMY_TYPE_NORMAL or params[1])~=boss then return false end
	if params[4]&4==4 then if not (params[3]==0 or Process:Param(params[3])==this:Gender()) then return false end elseif params[3]~=this:Gender() then return false end
	if params[4]&2==2 and params[2]~=0 then charaType = Process:Param(params[2]) else charaType = params[2] end
	if charaType == 0 then
		flag = true
	else
		for i,j in ipairs(this:Type()) do
			if j == charaType then flag = true break end
		end
	end
	return flag
end
SetCondLog('OwnerBreakChange')

-- 気絶・ブレイク中
-- params[1]:エネミータイプ
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
function OwnerBreak(_target, params)
local boss
local charaType
local flag = false
	Field:FrameUpdate(_target)
	if not this:IsBreak() then return false end
	boss = this:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[4]&1==1 then if not (params[1]==0 or Process:Param(params[1])==boss) then return false end elseif (params[1]==0 and ENEMY_TYPE_NORMAL or params[1])~=boss then return false end
	if params[4]&4==4 then if not (params[3]==0 or Process:Param(params[3])==this:Gender()) then return false end elseif params[3]~=this:Gender() then return false end
	if params[4]&2==2 and params[2]~=0 then charaType = Process:Param(params[2]) else charaType = params[2] end
	if charaType == 0 then
		flag = true
	else
		for i,j in ipairs(this:Type()) do
			if j == charaType then flag = true break end
		end
	end
	return flag
end
SetCondLog('OwnerBreak')

-- 気絶・ブレイク中特定UID生存
-- params[1]:アクターUID INDEX
-- params[2]:エネミータイプ
-- params[3]:キャラタイプ
-- params[4]:性別
-- params[5]:パラメータタイプ(bit)
function OwnerBreakTargetUidAlive(_target, params)
Field:FrameUpdate(_target)
local boss
local charaType
local flag = false
local u = units:GetUnit(Process:Param(params[1]))
	if not this:IsBreak() then return false end
	if u:IsExcluded() or not u:Alive() then return false end
	boss = this:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 then if not (params[4]==0 or Process:Param(params[4])==this:Gender()) then return false end elseif params[4]~=this:Gender() then return false end
	if params[5]&2==2 and params[3]~=0 then charaType = Process:Param(params[3]) else charaType = params[3] end
	if charaType == 0 then
		flag = true
	else
		for i,j in ipairs(this:Type()) do
			if j == charaType then flag = true break end
		end
	end
	return flag
end
SetCondLog('OwnerBreakTargetUidAlive')

-- 気絶・ブレイク回復時
-- params[1]:エネミータイプ
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
function IsRemoveOwnerBreak(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1) or 0
local after = this:IsBreak() and 1 or 0
local boss
	keepObj:KeepParam(1, after)
	keepObj:KeepParam(2, before)
	if after == 1 or before == after then return false end
	boss = this:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[4]&1==1 then if not (params[1]==0 or Process:Param(params[1])==boss) then return false end elseif (params[1]==0 and ENEMY_TYPE_NORMAL or params[1])~=boss then return false end
	if params[4]&4==4 then if not (params[3]==0 or Process:Param(params[3])==this:Gender()) then return false end elseif params[3]~=this:Gender() then return false end
	if params[4]&2==2 and params[2]~=0 then if not this:Type(Process:Param(params[2])) then return false end else if not this:Type(params[2]) then return false end end
	return true
end
SetCondLog('IsRemoveOwnerBreak')

-- ボスブレイク中
-- params[1]:キャラタイプ
-- params[2]:性別
-- params[3]:パラメータタイプ(bit)
function BossBreak(_target, params)
local u
	Field:FrameUpdate(_target)
	u = Field:GetBoss()
	if not (isTableOrClass(u, C_TYPE_UNIT) and u:IsBreak()) then return false end
	if params[3]&2==2 then if not (params[2]==0 or Process:Param(params[2])==u:Gender()) then return false end elseif params[2]~=u:Gender() then return false end
	if params[3]&1==1 then if not (params[1]==0 or u:Type(Process:Param(params[1]))) then return false end elseif not u:Type(params[1]) then return false end
	return true
end
SetCondLog('BossBreak')

-- 特定の状態異常中
-- params[1]:状態異常
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
function IsTargetBadStatus(_target, params)
local ailment, charaType, gender
local flag = false
local before
	Field:FrameUpdate(_target)
	before = Process:GetKeptParam(1) or 0
	ailment = (params[1]~=0 and params[4]&1==1) and Process:Param(params[1]) or params[1]
	ailment = ailment~=0 and ailment or nil
	if target:IsAilment(ailment) then
		gender = (params[3]~=0 and params[4]&1==1) and Process:Param(params[3]) or params[3]
		if gender == 0 or target:Gender() == gender then
			charaType = (params[4]&2==2 and params[2]~=0) and Process:Param(params[2]) or params[2]
			if charaType == 0 then
				flag = true
			else
				for i,j in ipairs(target:Type()) do
					if j == charaType then flag = true break end
				end
			end
		end
	end
	Process:KeepParam(1, flag and 1 or 0)
	Process:KeepParam(2, before)
	return flag
end
SetCondLog('IsTargetBadStatus')

-- 特定の状態異常ではない
-- params[1]:状態異常
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
function NotTargetBadStatus(_target, params)
local ailment
local charaType
local flag = false
	Field:FrameUpdate(_target)
	ailment = (params[1]~=0 and params[4]&1==1) and Process:Param(params[1]) or params[1]
	ailment = ailment~=0 and ailment or nil
	if target:IsAilment(ailment) then return false end
	if params[4]&4==4 then if not (params[3]==0 or Process:Param(params[3])==target:Gender()) then return false end elseif params[3]~=target:Gender() then return false end
	if params[4]&2==2 and params[2]~=0 then charaType = Process:Param(params[2]) else charaType = params[2] end
	if charaType == 0 then
		flag = true
	else
		for i,j in ipairs(target:Type()) do
			if j == charaType then flag = true break end
		end
	end
	return flag
end
SetCondLog('NotTargetBadStatus')

-- 特定の状態異常ではない(初回なし)
-- params[1]:状態異常
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
function NotTargetBadStatusChange(_target, params)
Field:FrameUpdate(_target)
local ailment
local charaType
local flag = false
local cnt = Process:GetKeptParam(1) or 0
	if cnt == 0 then
		Process:KeepParam(1, 1)
		return false
	else
		ailment = (params[1]~=0 and params[4]&1==1) and Process:Param(params[1]) or params[1]
		ailment = ailment~=0 and ailment or nil
		if target:IsAilment(ailment) then return false end
		if params[4]&4==4 then if not (params[3]==0 or Process:Param(params[3])==target:Gender()) then return false end elseif params[3]~=target:Gender() then return false end
		if params[4]&2==2 and params[2]~=0 then charaType = Process:Param(params[2]) else charaType = params[2] end
		if charaType == 0 then
			flag = true
		else
			for i,j in ipairs(target:Type()) do
				if j == charaType then flag = true break end
			end
		end
		return flag
	end
end
SetCondLog('NotTargetBadStatusChange')

-- 特定の状態異常ではない
-- params[1]:状態異常1
-- params[2]:状態異常2
-- params[3]:状態異常3
-- params[4]:状態異常4
-- params[5]:パラメータタイプ(bit)
function NotTargetMultiCondBadStatus(_target, params)
Field:FrameUpdate(_target)
local ailment
local charaType
local flag = false
	if params[5]&1==1 then if (params[1]==0 and target:IsAilment()) or ((Process:Param(params[1])==0 and target:IsAilment()) or (Process:Param(params[1])~=0 and target:IsAilment(Process:Param(params[1])))) then return false end elseif params[1]~=0 and target:IsAilment(params[1]) then return false end
	if params[5]&2==2 then if params[2]~=0 and target:IsAilment(Process:Param(params[2])) then return false end elseif params[2]~=0 and target:IsAilment(params[2]) then return false end
	if params[5]&4==4 then if params[3]~=0 and target:IsAilment(Process:Param(params[3])) then return false end elseif params[3]~=0 and target:IsAilment(params[3]) then return false end
	if params[5]&8==8 then if params[4]~=0 and target:IsAilment(Process:Param(params[4])) then return false end elseif params[4]~=0 and target:IsAilment(params[4]) then return false end
	return true
end
SetCondLog('NotTargetMultiCondBadStatus')

-- 特定の状態異常ではない(初回なし)
-- params[1]:状態異常1
-- params[2]:状態異常2
-- params[3]:状態異常3
-- params[4]:状態異常4
-- params[5]:パラメータタイプ(bit)
function NotTargetMultiCondBadStatusChange(_target, params)
Field:FrameUpdate(_target)
local ailment
local charaType
local flag = false
local keepObj = next(Buff:Parent()) and Buff or Process
local cnt = keepObj:GetKeptParam(1) or 0
	if cnt == 0 then
		keepObj:KeepParam(1, 1)
		return false
	else
		if params[5]&1==1 then if (params[1]==0 and target:IsAilment()) or ((Process:Param(params[1])==0 and target:IsAilment()) or (Process:Param(params[1])~=0 and target:IsAilment(Process:Param(params[1])))) then return false end elseif params[1]~=0 and target:IsAilment(params[1]) then return false end
		if params[5]&2==2 then if params[2]~=0 and target:IsAilment(Process:Param(params[2])) then return false end elseif params[2]~=0 and target:IsAilment(params[2]) then return false end
		if params[5]&4==4 then if params[3]~=0 and target:IsAilment(Process:Param(params[3])) then return false end elseif params[3]~=0 and target:IsAilment(params[3]) then return false end
		if params[5]&8==8 then if params[4]~=0 and target:IsAilment(Process:Param(params[4])) then return false end elseif params[4]~=0 and target:IsAilment(params[4]) then return false end
		return true
	end
end
SetCondLog('NotTargetMultiCondBadStatusChange')

-- 特定状態異常発生時
-- params[1]:状態異常
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
function IsAddBadStatus(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1) or 0
local tbl = bitBooleanList(before)
local trigAilment = {}
	for i,j in pairs(this:AilmentList()) do
		if j == true and (tbl[i] or false) == false then
			trigAilment[i] = true
			if trigAilment[0] == nil then trigAilment[0] = true end
			if trigAilment[-1] == nil and IS_AILMENT_COMMON[i] then trigAilment[-1] = true end
		end
	end
	keepObj:KeepParam(1, bitBooleanListToVal(this:AilmentList()))
	keepObj:KeepParam(2, bitBooleanListToVal(trigAilment, 2))
	ailment = (params[1]~=0 and params[4]&1==1) and Process:Param(params[1]) or params[1]
	if trigAilment[ailment] == nil or trigAilment[ailment] == false then return false end
	if params[4]&2==2 then if not (params[2]==0 or Process:Param(params[2])==target:Type()) then return false end elseif params[2]~=target:Type() then return false end
	if params[4]&4==4 then if not (params[3]==0 or Process:Param(params[3])==target:Gender()) then return false end elseif params[3]~=target:Gender() then return false end
	return true
end
SetCondLog('IsAddBadStatus')

-- 特定状態異常発生時特定UID生存
-- params[1]:アクターUID INDEX
-- params[2]:状態異常
-- params[3]:キャラタイプ
-- params[4]:性別
-- params[5]:パラメータタイプ(bit)
function IsAddBadStatusTargetUidAlive(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or Process
local u = units:GetUnit(Process:Param(params[1]))
local before = keepObj:GetKeptParam(1) or 0
local tbl = bitBooleanList(before)
local trigAilment = {}
	for i,j in pairs(this:AilmentList()) do
		if j == true and (tbl[i] or false) == false then
			trigAilment[i] = true
			if trigAilment[0] == nil then trigAilment[0] = true end
			if trigAilment[-1] == nil and IS_AILMENT_COMMON[i] then trigAilment[-1] = true end
		end
	end
	keepObj:KeepParam(1, bitBooleanListToVal(this:AilmentList()))
	keepObj:KeepParam(2, bitBooleanListToVal(trigAilment, 2))
	if u:IsExcluded() or not u:Alive() then return false end
	ailment = (params[2]~=0 and params[5]&1==1) and Process:Param(params[2]) or params[2]
	if trigAilment[ailment] == nil or trigAilment[ailment] == false then return false end
	if params[5]&2==2 then if not (params[3]==0 or Process:Param(params[3])==target:Type()) then return false end elseif params[3]~=target:Type() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Process:Param(params[4])==target:Gender()) then return false end elseif params[4]~=target:Gender() then return false end
	return true
end
SetCondLog('IsAddBadStatusTargetUidAlive')

-- 特定状態異常回復時
-- params[1]:状態異常
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
function IsRemoveBadStatus(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1) or 0
local tbl = bitBooleanList(before)
local trigAilment = {}
	for i,j in pairs(this:AilmentList()) do
		if j == false and (tbl[i] or false) == true then
			trigAilment[i] = true
			if trigAilment[0] == nil then trigAilment[0] = true end
			if trigAilment[-1] == nil and IS_AILMENT_COMMON[i] then trigAilment[-1] = true end
		end
	end
	keepObj:KeepParam(1, bitBooleanListToVal(this:AilmentList()))
	keepObj:KeepParam(2, bitBooleanListToVal(trigAilment, 2))
	ailment = (params[1]~=0 and params[4]&1==1) and Process:Param(params[1]) or params[1]
	if trigAilment[ailment] == nil or trigAilment[ailment] == false then return false end
	if params[4]&2==2 then if not (params[2]==0 or Process:Param(params[2])==target:Type()) then return false end elseif params[2]~=target:Type() then return false end
	if params[4]&4==4 then if not (params[3]==0 or Process:Param(params[3])==target:Gender()) then return false end elseif params[3]~=target:Gender() then return false end
	return true
end
SetCondLog('IsRemoveBadStatus')

-- 魔法陣展開中
-- params[1]:展開LV
-- params[2]:キャラタイプ
-- params[3]:性別
-- params[4]:パラメータタイプ(bit)
function IsPreCast(_target, params)
local charaType
local flag = false
	Field:FrameUpdate(_target)
	if (params[1]==0 and 1 or math.max(Process:Param(params[1]), 1)) > target:CastLV() then return false end
	if params[4]&2==2 then if not (params[3]==0 or Process:Param(params[3])==target:Gender()) then return false end elseif params[3]~=target:Gender() then return false end
	if params[4]&1==1 and params[2]~=0 then charaType = Process:Param(params[2]) else charaType = params[2] end
	if charaType == 0 then
		flag = true
	else
		for i,j in ipairs(target:Type()) do
			if j == charaType then flag = true break end
		end
	end
	return flag
end
SetCondLog('IsPreCast')

-- 生存人数が閾値を跨いだ時
-- params[1]:敵・味方
-- params[2]:以上・未満
-- params[3]:人数条件
-- params[4]:回数制限
-- params[5]:パラメータタイプ(bit)
function ActorCountTrigger(_target, params)
Field:FrameUpdate(_target)
local ADDITION,REDUCTION = 1,0
local cnt = Process:GetKeptParam(1) or 0
local beforeNum = Process:GetKeptParam(2)
local ucnt = #(units:GetCondUnitList((params[5]&1==1) and Process:Param(params[1]) or params[1], TARGET_COND_ALIVE, UNIT_COND_NONE))
local res
	if beforeNum==nil then
		Process:KeepParam(1, 0)
		Process:KeepParam(2, ucnt)
		return false
	elseif params[4]==0 or Process:Param(params[4])<=0 or cnt<Process:Param(params[4]) then
		res = (Process:Param(params[2])==REDUCTION and Process:Param(params[3])<beforeNum and ucnt<=Process:Param(params[3])) or (Process:Param(params[2])==ADDITION and Process:Param(params[3])>beforeNum and ucnt>=Process:Param(params[3]))
		Process:KeepParam(2, ucnt)
		if res then Process:KeepParam(1, 1, CALCULATE_ADD) end
		return res
	end
	return false
end
SetCondLog('ActorCountTrigger')

-- 二種人数条件
-- params[1]:敵・味方1
-- params[2]:条件種別/条件方向/人数閾値/オプション/固定値オプション(65536:自分以外)1
-- params[3]:敵・味方2
-- params[4]:条件種別/条件方向/人数閾値/オプション/固定値オプション(65536:自分以外)2
-- params[5]:パラメータタイプ(bit)
function ActorCountDoubleCond(_target, params)
Field:FrameUpdate(_target)
local prm1, prm2
	prm1 = GetProcParamIndex(params[2])
	prm1[1], prm1[2], prm1[3] = prm1[1] or 0, prm1[2] or 0, prm1[3] or 0
	if prm1[1] > 0 and prm1[1] <= 10 then prm1[1] = Process:Param(prm1[1]) else prm1[1] = prm1[1] - 10 end
	if prm1[4] ~= nil then prm1[4] = Process:Param(prm1[4]) elseif prm1[5] ~= nil then prm1[4] = prm1[5] end
	if procCompare(Process:Param(prm1[2]), #(units:GetCondUnitList(((params[5]&1==1) and params[1] ~= 0) and Process:Param(params[1]) or params[1], prm1[1] + (prm1[4] == 1 and UNIT_COND_NOT_ME or 0), UNIT_COND_NONE)), Process:Param(prm1[3])) then
		prm2 = GetProcParamIndex(params[4])
		prm2[1], prm2[2], prm2[3] = prm2[1] or 0, prm2[2] or 0, prm2[3] or 0
		if prm2[1] > 0 and prm2[1] <= 10 then prm2[1] = Process:Param(prm2[1]) else prm2[1] = prm2[1] - 10 end
		if prm2[4] ~= nil then prm2[4] = Process:Param(prm2[4]) elseif prm2[5] ~= nil then prm2[4] = prm2[5] end
		if procCompare(Process:Param(prm2[2]), #(units:GetCondUnitList(((params[5]&2==2) and params[3] ~= 0) and Process:Param(params[3]) or params[3], prm2[1] + (prm2[4] == 1 and UNIT_COND_NOT_ME or 0), UNIT_COND_NONE)), Process:Param(prm2[3])) then
			return true
		end
	end
	return false
end
SetCondLog('ActorCountDoubleCond')

-- 二種人数条件変動
-- params[1]:敵・味方1
-- params[2]:条件種別/条件方向/人数閾値/オプション/固定値オプション(65536:自分以外)1
-- params[3]:敵・味方2
-- params[4]:条件種別/条件方向/人数閾値/オプション/固定値オプション(65536:自分以外)2
-- params[5]:パラメータタイプ(bit)
function ActorCountDoubleCondPulse(_target, params)
Field:FrameUpdate(_target)
local prm1, prm2
local pcv = this:GetProcCondValue() or false
	prm1 = GetProcParamIndex(params[2])
	prm1[1], prm1[2], prm1[3] = prm1[1] or 0, prm1[2] or 0, prm1[3] or 0
	if prm1[1] > 0 and prm1[1] <= 10 then prm1[1] = Process:Param(prm1[1]) else prm1[1] = prm1[1] - 10 end
	if prm1[4] ~= nil then prm1[4] = Process:Param(prm1[4]) elseif prm1[5] ~= nil then prm1[4] = prm1[5] end
	if procCompare(Process:Param(prm1[2]), #(units:GetCondUnitList(((params[5]&1==1) and params[1] ~= 0) and Process:Param(params[1]) or params[1], prm1[1] + (prm1[4] == 1 and UNIT_COND_NOT_ME or 0), UNIT_COND_NONE)), Process:Param(prm1[3])) then
		prm2 = GetProcParamIndex(params[4])
		prm2[1], prm2[2], prm2[3] = prm2[1] or 0, prm2[2] or 0, prm2[3] or 0
		if prm2[1] > 0 and prm2[1] <= 10 then prm2[1] = Process:Param(prm2[1]) else prm2[1] = prm2[1] - 10 end
		if prm2[4] ~= nil then prm2[4] = Process:Param(prm2[4]) elseif prm2[5] ~= nil then prm2[4] = prm2[5] end
		if procCompare(Process:Param(prm2[2]), #(units:GetCondUnitList(((params[5]&2==2) and params[3] ~= 0) and Process:Param(params[3]) or params[3], prm2[1] + (prm2[4] == 1 and UNIT_COND_NOT_ME or 0), UNIT_COND_NONE)), Process:Param(prm2[3])) then
			if not pcv then this:SetProcCondValue(true, true) end
			return not pcv
		end
	end
	this:SetProcCondValue(false, true)
	return false
end
SetCondLog('ActorCountDoubleCondPulse')

-- 特定UIDが指定領域に出入り
-- params[1]:領域識別子_INDEX
-- params[2]:アクターUID_INDEX
-- params[3]:出入り条件_INDEX
function TargetUidCollisionInOut(_target, params)
Field:FrameUpdate(_target)
local coll = Field:GetCollisionInstance(Process:Param(params[1]))
local cond = (params[3] > 0 and Process:Param(params[3]) or -params[3])
local uid = Process:Param(params[2])
	if this:IsRemote() then return false end
	for i,u in pairs(Process:TrigUnits()) do
		if u:ID() == uid and (cond == 0 or (cond == 1 and coll:InsideTargetIds(uid)) or (cond == 2 and not coll:InsideTargetIds(uid))) then return true end
	end
	return false
end
SetCondLog('TargetUidCollisionInOut')

-- 指定番号に属する自身の非展開領域展開後
-- params[1]:トリガタイプ
-- params[2]:領域番号_INDEX
function TargetNewNumberOwnerCollisionCreateAfter(_target, params)
Field:FrameUpdate(_target)
local trigCid, trigGid = Process:GetProcEventValue(PROC_TRIGGER_COLLISION_CREATE_AFTER)
local gid = (params[2]==0 and 0 or Process:Param(params[2]))
	if trigCid ~= nil and trigGid ~= nil then
		if gid == trigGid then
			collG = Field:GetCollisionGroupInstance(gid)
			for i,coll in pairs(collG:Collisions()) do
				if coll:ID() ~= trigCid and coll:Parent():ID() == this:ID() then return false end
			end
			return true
		end
	end
	return false
end
SetCondLog('TargetNewNumberOwnerCollisionCreateAfter')

-- 指定領域削除後
-- params[1]:トリガタイプ
-- params[2]:領域識別子_INDEX
function TargetUidCollisionRemoveAfter(_target, params)
Field:FrameUpdate(_target)
local trigId = ({Process:GetProcEventValue(PROC_TRIGGER_COLLISION_REMOVE_AFTER)})[1]
	return (Process:Param(params[2]) == trigId and not Field:GetCollisionInstance(Process:Param(params[2])):Enable())
end
SetCondLog('TargetUidCollisionRemoveAfter')

-- 指定番号に属する自身の領域削除後
-- params[1]:トリガタイプ
-- params[2]:領域番号_INDEX
function TargetNumberOwnerCollisionRemoveAfter(_target, params)
Field:FrameUpdate(_target)
local trigGid = {select(2, Process:GetProcEventValue(PROC_TRIGGER_COLLISION_REMOVE_AFTER))}
local gid = (params[2]==0 and 0 or Process:Param(params[2]))
	for i,g in pairs(trigGid) do
		if gid == g then return true end
	end
	return false
end
SetCondLog('TargetNumberOwnerCollisionRemoveAfter')

-- 指定番号に属する自身の領域全削除後
-- params[1]:トリガタイプ
-- params[2]:領域番号_INDEX
function TargetNumberOwnerCollisionRemoveAllAfter(_target, params)
Field:FrameUpdate(_target)
local trigCid, trigGid = Process:GetProcEventValue(PROC_TRIGGER_COLLISION_REMOVE_AFTER)
local gid = (params[2]==0 and 0 or Process:Param(params[2]))
	if trigCid ~= nil and trigGid ~= nil then
		if gid == trigGid then
			collG = Field:GetCollisionGroupInstance(gid)
			for i,coll in pairs(collG:Collisions()) do
				if coll:ID() ~= trigCid and coll:Parent():ID() == this:ID() then return false end
			end
			return true
		end
	end
	return false
end
SetCondLog('TargetNumberOwnerCollisionRemoveAllAfter')

-- 指定番号に属する領域内出入り発生時
-- params[1]:敵・味方
-- params[2]:領域番号_INDEX
-- params[3]:出入り条件_INDEX
-- params[4]:パラメータタイプ(bit)
function TargetNumberCollisionInOut(_target, params)
Field:FrameUpdate(_target)
local gid = (params[2]==0 and 0 or Process:Param(params[2]))
local cond = (params[3] > 0 and Process:Param(params[3]) or -params[3])
local side = ((params[4]&1==1) and params[1] ~= 0) and Process:Param(params[1]) or params[1]
	if this:IsRemote() then return false end
	for i,coll in pairs(Process:TrigCollisions()) do
		if gid == 0 or coll:GroupIds(gid) then
			if cond == 0 then return true end
			for j,u in pairs(coll:TrigUnits()) do
				if u:RelativeSide(this, side) then
					if (cond == 1 and coll:InsideTargetIds(u:ID())) or (cond == 2 and not coll:InsideTargetIds(u:ID())) then return true end
				end
			end
		end
	end
	
	return false
end
SetCondLog('TargetNumberCollisionInOut')

-- 人数状況
-- params[1]:敵・味方
-- params[2]:以上・未満
-- params[3]:人数条件
-- params[5]:パラメータタイプ(bit)
function ActorCount(_target, params)
local ulist
	Field:FrameUpdate(_target)
	ulist = units:GetCondUnitList((params[5]&1==1) and Process:Param(params[1]) or params[1], TARGET_COND_ALIVE, UNIT_COND_NONE)
	return procCompare(Process:Param(params[2]), #ulist, Process:Param(params[3]))
end
SetCondLog('ActorCount')

-- 特定のユニットID以外のユニットかどうか
-- params[1]:ユニットID INDEX
function IsNotTargetUnitID(_target, params)
	Field:FrameUpdate(_target)
	if Process:Param(params[1])==0 then
		return true
	else
		return Process:Param(params[1])~=this:UnitID(true)
	end
end
SetCondLog('IsNotTargetUnitID')

-- 特定キャラタイプ
-- params[1]:キャラタイプ
-- params[2]:パラメータタイプ(bit)
function IsTargetCharaType(_target, params)
local charaType
	Field:FrameUpdate(_target)
	if params[2]&1==1 and params[1]~=0 then charaType = Process:Param(params[1]) else charaType = params[1] end
	return target:Type(charaType)
end
SetCondLog('IsTargetCharaType')

-- 特定キャラタイプ変化
-- params[1]:キャラタイプ
-- params[2]:変化条件
-- params[3]:パラメータタイプ(bit)
function IsTargetCharaTypeChange(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or this
local before = keepObj:GetProcCondValue()
local charaType
local res = false
	if params[3]&1==1 and params[1]~=0 then charaType = Process:Param(params[1]) else charaType = params[1] end
	res = (charaType==0 or target:Type(charaType)) and 1 or 2
	keepObj:SetProcCondValue(res)
	if before == nil then return false end
	return ((before ~= res) and (params[2]==0 or params[2]==res))
end
SetCondLog('IsTargetCharaTypeChange')

-- 各種人数条件
-- params[1]:生死/敵味方/自含/条件方向/人数閾値
-- params[2]:キャラタイプ条件
-- params[3]:キャラカテゴリ条件(INDEX)
-- params[4]:性別条件
-- params[5]:パラメータタイプ(bit)
function ValidActorCount(_target, params)
local prm, cnt
	Field:FrameUpdate(_target)
	prm = GetProcParamIndex(params[1])
	prm[1], prm[2], prm[3], prm[4], prm[5] = prm[1] or 0, prm[2] or 0, prm[3] or 0, prm[4] or 0, prm[5] or 0
	if prm[1]==0 or prm[3]==0 or prm[4]==0 or prm[5]==0 then return true end
	if prm[1] > 0 and prm[1] <= 10 and prm[1] == prm[3] then
		prm[1], prm[3] = bitToInt(Process:Param(prm[1]), 2, 2), bitToInt(Process:Param(prm[1]), 3, 1)
		if prm[1] == 0 then return true elseif prm[1] == 3 then prm[1] = TARGET_COND_BOTH end
	else
		if prm[1] > 0 and prm[1] <= 10 then prm[1] = Process:Param(prm[1]) elseif prm[1] == 13 then prm[1] = TARGET_COND_BOTH else prm[1] = prm[1] - 10 end
		if prm[3] > 0 and prm[3] <= 10 then prm[3] = Process:Param(prm[3]) else prm[3] = prm[3] - 11 end
	end
	if prm[2] == 0 then prm[2] = TARGET_SIDE_ALL elseif prm[2] > 0 and prm[2] <= 10 then prm[2] = Process:Param(prm[2]) else prm[2] = prm[2] - 10 end
	if prm[4] > 0 and prm[4] <= 10 then prm[4] = Process:Param(prm[4]) else prm[4] = prm[4] - 11 end
	if prm[5] > 0 and prm[5] <= 10 then prm[5] = Process:Param(prm[5]) else prm[5] = prm[5] - 10 end
	cnt = 0
	for i,u in pairs(units:GetCondUnitList(prm[2], prm[1], UNIT_COND_NONE + (prm[3]~=0 and UNIT_COND_NOT_ME or 0))) do
		if params[2]==0 or (bitToBoolean(params[5], 1) and CompareFromProcParamIndex(GetProcParamIndex(params[2]), u, 'Type')) or (not bitToBoolean(params[5], 1) and u:Type(params[2])) then
			if params[3]==0 or (CompareFromProcParamIndex(GetProcParamIndex(params[3]), u, 'Category')) then
				if params[4]==0 or (bitToBoolean(params[5], 2) and CompareFromProcParamIndex(GetProcParamIndex(params[4]), u:Gender())) or (not bitToBoolean(params[5], 2) and u:Gender()==params[4]) then
					cnt = cnt + 1
				end
			end
		end
	end
	if not procCompare(prm[4], cnt, prm[5]) then return false end
	return true
end
SetCondLog('ValidActorCount')

-- キャラタイプ種類数条件
-- params[1]:以上・未満
-- params[2]:キャラタイプ数条件
function TargetCharaTypeCount(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1) or 0
local res =  procCompare(Process:Param(params[1]), #(this:Type()), Process:Param(params[2]))
	keepObj:KeepParam(1, res and 1 or 0)
	keepObj:KeepParam(2, before)
	return res
end
SetCondLog('TargetCharaTypeCount')

-- 特定キャラタイプ人数状況
-- params[1]:敵・味方
-- params[2]:以上・未満
-- params[3]:人数条件
-- params[4]:キャラタイプ条件
-- params[5]:パラメータタイプ(bit)
function CharaTypeCount(_target, params)
local Over,Under = 1,0
local charaType
local ulist
local res
	Field:FrameUpdate(_target)
	charaType = params[5]&1==1 and Process:Param(params[4]) or params[4]
	if charaType == 0 then
		ulist = units:GetCondUnitList(params[1], TARGET_COND_ALIVE, UNIT_COND_NONE)
	else
		ulist = units:GetCondUnitList(params[1], TARGET_COND_ALIVE, UNIT_COND_CHARA_TYPE, charaType)
	end
	res = Process:Param(params[2]) == (#ulist >= Process:Param(params[3]) and Over or Under)
	return res
end
SetCondLog('CharaTypeCount')

-- パーティ性別構成条件
-- params[1]:男性条件情報INDEX
-- params[2]:女性条件情報INDEX
-- params[3]:その他条件情報INDEX
function GenderTypeStructure(_target, params)
local Over,Under,None = 2, 1, 0
local mCnt, fCnt, uCnt = 0, 0, 0
local mNum, fNum, uNum = 0, 0, 0
local mCond, fCond, uCond = 0, 0, 0
	Field:FrameUpdate(_target)
	if params[1]~=0 then
		mCond = Process:Param(params[1])
		mNum = Process:Param(params[1] + 1)
	end
	if params[2]~=0 then
		fCond = Process:Param(params[2])
		fNum = Process:Param(params[2] + 1)
	end
	if params[3]~=0 then
		uCond = Process:Param(params[3])
		uNum = Process:Param(params[3] + 1)
	end
	for i,u in pairs(units:GetCondUnitList(TARGET_SIDE_ALLY, TARGET_COND_ALL, UNIT_COND_NONE)) do
		if u:Gender() == GENDER_MALE then
			mCnt = mCnt + 1
		elseif u:Gender() == GENDER_FEMALE then
			fCnt = fCnt + 1
		elseif u:Gender() == GENDER_UNKNOWN then
			uCnt = uCnt + 1
		end
	end
	if (mCond==Over and mNum > mCnt) or (mCond==Under and mNum <= mCnt) then return false end
	if (fCond==Over and fNum > fCnt) or (fCond==Under and fNum <= fCnt) then return false end
	if (uCond==Over and uNum > uCnt) or (uCond==Under and uNum <= uCnt) then return false end
	return true
end
SetCondLog('GenderTypeStructure')

-- 獣or鳥or魚or竜が存在(魔獣ハンター)
function MonsterHunter(_target, params)
	Field:FrameUpdate(_target)
	for i,u in pairs(units:GetCondUnitList(TARGET_SIDE_ALL, TARGET_COND_ALIVE, UNIT_COND_NONE)) do
		for j,k in pairs(u:Type()) do
			if k==CHARA_TYPE_BEAST or k==CHARA_TYPE_BIRD or k==CHARA_TYPE_FISH or k==CHARA_TYPE_DRAGON then return true end
		end
	end
	return false
end
SetCondLog('MonsterHunter')

-- 特定キャラカテゴリ
-- params[1]:キャラカテゴリINDEX
function IsTargetCharaCategory(_target, params)
local charaCategory
	Field:FrameUpdate(_target)
	if params[1]~=0 then charaCategory = Process:Param(params[1]) else charaCategory = 0 end
	if charaCategory == 0 then
		return true
	else
		for i,j in ipairs(target:Category()) do
			if j == charaCategory then return true end
		end
	end
	return false
end
SetCondLog('IsTargetCharaCategory')

-- 自分が特定キャラタイプ
-- params[1]:敵・味方
-- params[2]:自分キャラタイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function OwnerCharaType(_target, params)
local charaType
local flag = false
	Field:FrameUpdate(_target)
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[5]&1==1 and params[2]~=0 then charaType = Process:Param(params[2]) else charaType = params[2] end
	if charaType == 0 then
		flag = true
	else
		for i,j in ipairs(this:Type()) do
			if j == charaType then flag = true break end
		end
	end
	return flag and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerCharaType')

-- 自分が特定キャラタイプ攻撃スキル
-- params[1]:敵・味方
-- params[2]:自分キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function OwnerCharaTypeAttackSkill(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this, 'Type')) then return false end elseif not this:Type(params[2]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerCharaTypeAttackSkill')

-- 自分が特定キャラタイプでクリティカル発生
-- params[1]:敵・味方
-- params[2]:自分キャラタイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function OwnerCharaTypeCritical(_target, params)
local charaType
local flag = false
	Field:FrameUpdate(_target)
	if not Bullet:IsCRT() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[5]&1==1 and params[2]~=0 then charaType = Process:Param(params[2]) else charaType = params[2] end
	if charaType == 0 then
		flag = true
	else
		for i,j in ipairs(this:Type()) do
			if j == charaType then flag = true break end
		end
	end
	return flag and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerCharaTypeCritical')

-- 自分特定キャラタイプキラー発生敵攻撃スキル
-- params[1]:自分キャラタイプ
-- params[2]:対象キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsKillerBulletOwnerCharaTypeEnemyAttackSkill(_target, params)
local t, charaType
local flag = false
	Field:FrameUpdate(_target)
	if not (Bullet:SKL_Role(SKILL_ROLE_ATTACK, CS_COMPARE_DIRECT) and Bullet:TargetSide(TARGET_SIDE_OPPONENT)) then return false end
	if params[5]&4==4 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	if params[5]&8==8 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[4], CS_COMPARE_DIRECT) then return false end
	if params[5]&1==1 then if not (params[1]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[1]), this, 'Type')) then return false end elseif not this:Type(params[1]) then return false end
	charaType = (params[5]&2==2 and params[2]~=0) and GetProcParamArray(params[2]) or {params[2]}
	for i,j in pairs(charaType) do
		if j == 0 then return Bullet:IsKiller() end
		for k,l in pairs(int32ToUnitTypeArray(j)) do
			if Bullet:IsKiller(l) then flag = true break end
		end
	end
	return flag
end
SetCondLog('IsKillerBulletOwnerCharaTypeEnemyAttackSkill')

-- 自分特定キャラタイプ且つ対象特定キャラタイプ敵攻撃スキル
-- params[1]:自分キャラタイプ
-- params[2]:対象キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function OwnerCharaTypeAndTargetCharaTypeEnemyAttackSkill(_target, params)
local t
	Field:FrameUpdate(_target)
	if not (Bullet:SKL_Role(SKILL_ROLE_ATTACK, CS_COMPARE_DIRECT) and Bullet:TargetSide(TARGET_SIDE_OPPONENT)) then return false end
	if params[5]&4==4 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	if params[5]&8==8 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[4], CS_COMPARE_DIRECT) then return false end
	if params[5]&1==1 then if not (params[1]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[1]), this, 'Type')) then return false end elseif not this:Type(params[1]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&2==2 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Type')) then return false end elseif not t:Type(params[2]) then return false end
	return true
end
SetCondLog('OwnerCharaTypeAndTargetCharaTypeEnemyAttackSkill')

-- 自分特定キャラタイプ且つ特定キャラタイプ攻撃スキル
-- params[1]:敵・味方
-- params[2]:キャラタイプ1
-- params[3]:キャラタイプ2
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function OwnerCharaTypeAndOwnerCharaTypeAttackSkill(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this, 'Type')) then return false end elseif not this:Type(params[2]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), this, 'Type')) then return false end elseif not this:Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerCharaTypeAndOwnerCharaTypeAttackSkill')

-- 自分特定キャラタイプ且つ特定キャラタイプ攻撃スキルクリティカル発生
-- params[1]:敵・味方
-- params[2]:キャラタイプ1
-- params[3]:キャラタイプ2
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function OwnerCharaTypeAndOwnerCharaTypeAttackSkillCritical(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if not Bullet:IsCRT() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this, 'Type')) then return false end elseif not this:Type(params[2]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), this, 'Type')) then return false end elseif not this:Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerCharaTypeAndOwnerCharaTypeAttackSkillCritical')

-- 自分複数キャラタイプ
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function OwnerMultipleCharaType(_target, params)
	Field:FrameUpdate(_target)
	if #(this:Type()) < 2 then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerMultipleCharaType')

-- 特定キャラカテゴリ以外攻撃スキル
-- params[1]:敵・味方
-- params[2]:キャラカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function OwnerCharaCategoryNotAttackSkill(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[2]~=0 and CompareFromProcParamIndex(GetProcParamIndex(params[2]), this, 'Category') then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerCharaCategoryNotAttackSkill')

-- 特定キャラタイプ
-- params[1]:敵・味方
-- params[2]:キャラタイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetCharaType(_target, params)
local t
	Field:FrameUpdate(_target)
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Type')) then return false end elseif not t:Type(params[2]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetCharaType')

-- 特定キャラタイプ攻撃スキル
-- params[1]:敵・味方
-- params[2]:キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetCharaTypeAttackSkill(_target, params)
local t
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Type')) then return false end elseif not t:Type(params[2]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetCharaTypeAttackSkill')

-- 特定キャラタイプ攻撃スキルクリティカル
-- params[1]:敵・味方
-- params[2]:キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetCharaTypeAttackSkillCritical(_target, params)
local t
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if not Bullet:IsCRT() then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Type')) then return false end elseif not t:Type(params[2]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetCharaTypeAttackSkillCritical')

-- 特定キャラタイプ以外
-- params[1]:敵・味方
-- params[2]:キャラタイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetCharaTypeNot(_target, params)
local t
	Field:FrameUpdate(_target)
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[2]==0 or not CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Type')) then return false end elseif t:Type(params[2]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetCharaTypeNot')

-- 特定キャラタイプ以外攻撃スキル
-- params[1]:敵・味方
-- params[2]:キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetCharaTypeNotAttackSkill(_target, params)
local t
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[2]==0 or not CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Type')) then return false end elseif t:Type(params[2]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetCharaTypeNotAttackSkill')

-- 特定キャラタイプ以外キラー発生攻撃スキル
-- params[1]:敵・味方
-- params[2]:キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsKillerBulletTargetCharaTypeNotAttackSkill(_target, params)
local t
local flag = false
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	for i,j in ipairs(Bullet:Target():Type()) do
		if Bullet:IsKiller(j) then flag = true break end
	end
	if not flag then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[2]==0 or not CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Type')) then return false end elseif t:Type(params[2]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsKillerBulletTargetCharaTypeNotAttackSkill')

-- 特定キャラカテゴリ
-- params[1]:敵・味方
-- params[2]:キャラカテゴリ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetCharaCategory(_target, params)
local t
local charaCategory
local flag = false
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[2]~=0 then charaCategory = Process:Param(params[2]) else charaCategory = 0 end
	if charaCategory == 0 then
		flag = true
	else
		for i,j in ipairs(t:Category()) do
			if j == charaCategory then flag = true break end
		end
	end
	return flag and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetCharaCategory')

-- 特定キャラカテゴリ攻撃スキル
-- params[1]:敵・味方
-- params[2]:キャラカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetCharaCategoryAttackSkill(_target, params)
local t
local charaCategory
local flag = false
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Category')) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetCharaCategoryAttackSkill')

-- 特定味カテゴリ
-- params[1]:敵・味方
-- params[2]:味カテゴリ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetTasteCategory(_target, params)
local t, tasteCategory
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[2]~=0 then tasteCategory = Process:Param(params[2]) else tasteCategory = CHARA_TASTE_ALL end
	return t:TasteCategory(tasteCategory) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetTasteCategory')

-- 特定エネミータイプ
-- params[1]:敵・味方
-- params[2]:エネミータイプ(ボスフラグ)
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetEnemyType(_target, params)
local t
local boss
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetEnemyType')

-- 特定エネミータイプ攻撃スキル
-- params[1]:敵・味方
-- params[2]:エネミータイプ(ボスフラグ)
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeAttackSkill(_target, params)
local t
local boss
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	-- if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:Element(Process:Param(params[3]))) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetEnemyTypeAttackSkill')

-- 特定敵タイプ攻撃スキルクリティカル
-- params[1]:敵・味方
-- params[2]:エネミータイプ(ボスフラグ)
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeAttackSkillCritical(_target, params)
local t
local boss
	Field:FrameUpdate(_target)
	if not Bullet:IsCRT() or not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	-- if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:Element(Process:Param(params[3]))) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetEnemyTypeAttackSkillCritical')

-- 特定エネミータイプ特定地形攻撃スキル
-- params[1]:敵・味方
-- params[2]:地形タイプ
-- params[3]:エネミータイプ(ボスフラグ)
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeAttackSkillWithTerrain(_target, params)
local t
local boss
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if not (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==Field:BgTerrain()) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetEnemyTypeAttackSkillWithTerrain')

-- 特定エネミータイプ背後
-- params[1]:敵・味方
-- params[2]:エネミータイプ(ボスフラグ)
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeBehind(_target, params)
local t
local boss
	Field:FrameUpdate(_target)
	if Bullet:TargetToDir()~=DIR_TO_BACK then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetEnemyTypeBehind')

-- 特定敵タイプ状態異常
-- params[1]:敵・味方
-- params[2]:エネミータイプ(ボスフラグ)
-- params[3]:状態異常ID
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeAilment(_target, params)
local t
local boss
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[3]==0 or Process:Param(params[3])==0 then
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:Target():IsAilment()
	else
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:Target():IsAilment(Process:Param(params[3]))
	end
end
SetCondLog('TargetEnemyTypeAilment')

-- 特定エネミータイプ攻撃スキル(制限回数付き)
-- params[1]:敵・味方
-- params[2]:制限回数
-- params[3]:エネミータイプ(ボスフラグ)
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeAttackSkillCount(_target, params)
local cnt, t, boss
	Field:FrameUpdate(_target)
	cnt = Process:GetKeptParam(1) or 0
	if Process:Param(params[2])>0 and Process:Param(params[2])<=cnt then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if not IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) then return false end
	Process:KeepParam(1, 1, CALCULATE_ADD)
	return true
end
SetCondLog('TargetEnemyTypeAttackSkillCount')

-- 特定UID生存中特定敵タイプ敵特定攻撃スキル
-- params[1]:アクターUID_INDEX
-- params[2]:エネミータイプ(ボスフラグ)
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeEnemyAttackSkillTargetUidAlive(_target, params)
local t
local boss
local u, flag
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	flag = false
	for i,index in pairs(GetProcParamIndex(params[1])) do
		if index ~= 0 and Process:Param(index) ~= 0 then
			u = units:GetUnit(Process:Param(index))
			if u:Alive() and not u:IsExcluded() then
				flag = true
				break
			end
		end
	end
	if not flag then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('TargetEnemyTypeEnemyAttackSkillTargetUidAlive')

-- 自分特定エネミータイプ
-- params[1]:敵・味方
-- params[2]:エネミータイプ(ボスフラグ)
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function OwnerEnemyType(_target, params)
local boss
	Field:FrameUpdate(_target)
	boss = this:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerEnemyType')

-- ボスWAVE
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function BossWave(_target, params)
	Field:FrameUpdate(_target)
	if not Field:IsBoss() then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('BossWave')

-- 特定キャラクターID
-- params[1]:敵・味方
-- params[2]:キャラクターID
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetCharaID(_target, params)
local t
local boss
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==t:CharaID()) then return false end elseif params[2]~=t:CharaID() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetCharaID')

-- 特定キャラタイプ且つ特定エネミータイプ
-- params[1]:敵・味方
-- params[2]:キャラタイプ
-- params[3]:エネミータイプ(ボスフラグ)
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeAndCharaType(_target, params)
local t
local boss
local charaType
local flag = false
	Field:FrameUpdate(_target)
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&2==2 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	if params[5]&1==1 and params[2]~=0 then charaType = Process:Param(params[2]) else charaType = params[2] end
	if charaType == 0 then
		flag = true
	else
		for i,j in ipairs(t:Type()) do
			if j == charaType then flag = true break end
		end
	end
	return flag and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetEnemyTypeAndCharaType')

-- 特定敵タイプ・キャラタイプ攻撃スキル
-- params[1]:パラメータ定義(敵・味方/自分エネミータイプ/相手エネミータイプ/自分キャラタイプ/相手キャラタイプ/スキル属性/スキルタイプ)
-- params[2]:フリー1
-- params[3]:フリー2
-- params[4]:フリー3
-- params[5]:フリー4
function TargetEnemyTypeAndCharaTypeAttackSkill(_target, params)
local prm, tgt, boss1, boss2
	Field:FrameUpdate(_target)
	tgt = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	prm = GetProcParamArray2(params[1], {[6] = ELEMENT_UNMENTIONED}, {params[2], params[3], params[4], params[5]}, 7)
	if not IsValidTarget(Bullet:Parent(), Bullet:Target(), prm[1]) then return false end
	if not (Bullet:Element(prm[6]) and Bullet:SKL_Type(prm[7]) and Bullet:SKL_Role(SKILL_ROLE_ATTACK)) then return false end
	boss1 = this:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	boss2 = tgt:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if not (this:Type(prm[4]) and tgt:Type(prm[5]) and (prm[2] == 0 or boss1 == prm[2]) and (prm[3] == 0 or boss2 == prm[3])) then return false end
	return true
end
SetCondLog('TargetEnemyTypeAndCharaTypeAttackSkill')

-- 特定敵タイプ且つ特定キャラカテゴリ
-- params[1]:敵・味方
-- params[2]:キャラカテゴリ
-- params[3]:エネミータイプ(ボスフラグ)
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeAndCharaCategory(_target, params)
local t
local boss
local charaCategory
local flag = false
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[2]~=0 then charaCategory = Process:Param(params[2]) else charaCategory = 0 end
	if charaCategory == 0 then
		flag = true
	else
		for i,j in ipairs(t:Category()) do
			if j == charaCategory then flag = true break end
		end
	end
	return flag and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetEnemyTypeAndCharaCategory')

-- 特定敵タイプ・特定性別
-- params[1]:エネミータイプ(ボスフラグ)
-- params[2]:性別
-- params[4]:属性
-- params[3]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeAndGenderType(_target, params)
local t, boss
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[1]==0 or Process:Param(params[1])==boss) then return false end elseif (params[1]==0 and ENEMY_TYPE_NORMAL or params[1])~=boss then return false end
	if params[5]&2==2 then if not (params[2]==0 or Process:Param(params[2])==t:Gender()) then return false end elseif params[2]~=t:Gender() then return false end
	if params[5]&4==4 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('TargetEnemyTypeAndGenderType')

-- 特定エネミータイプにクリティカル
-- params[1]:敵・味方
-- params[2]:エネミータイプ(ボスフラグ)
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeCritical(_target, params)
local t
local boss
	Field:FrameUpdate(_target)
	if not Bullet:IsCRT() then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetEnemyTypeCritical')

-- 特定エネミータイプにキラー
-- params[1]:敵・味方
-- params[2]:エネミータイプ(ボスフラグ)
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeKiller(_target, params)
local t
local boss
local flag = false
	Field:FrameUpdate(_target)
	for i,j in ipairs(Bullet:Target():Type()) do
		if Bullet:IsKiller(j) then flag = true break end
	end
	if not flag then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetEnemyTypeKiller')

-- 自分が特定性別
-- params[1]:敵・味方
-- params[2]:性別
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function OwnerGenderType(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==this:Gender()) then return false end elseif params[2]~=this:Gender() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerGenderType')

-- 自分特定性別攻撃スキル
-- params[1]:敵・味方
-- params[2]:性別
-- params[4]:属性
-- params[3]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function OwnerGenderTypeAndAttackSkill(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==this:Gender()) then return false end elseif params[2]~=this:Gender() then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerGenderTypeAndAttackSkill')

-- 特定性別
-- params[1]:敵・味方
-- params[2]:性別
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetGenderType(_target, params)
local t
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==t:Gender()) then return false end elseif params[2]~=t:Gender() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetGenderType')

-- 自分特定性別攻撃スキル
-- params[1]:敵・味方
-- params[2]:性別
-- params[4]:属性
-- params[3]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetGenderTypeAndAttackSkill(_target, params)
local t
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==t:Gender()) then return false end elseif params[2]~=t:Gender() then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetGenderTypeAndAttackSkill')

-- 特定性別気絶・ブレイク攻撃スキル
-- params[1]:性別
-- params[2]:気絶orブレイク INDEX
-- params[4]:属性
-- params[3]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetGenderTypeBreakAndAttackSkill(_target, params)
local t, res
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	res = t:IsBreak() and (Process:Param(params[2])==VIT_TYPE_ALL or Process:Param(params[2])==t:IsBreak())
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) or not res then return false end
	if params[5]&1==1 then if not (params[1]==0 or Process:Param(params[1])==t:Gender()) then return false end elseif params[1]~=t:Gender() then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('TargetGenderTypeBreakAndAttackSkill')

-- 特定性別且つ自分以外
-- params[1]:敵・味方
-- params[2]:性別
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetGenderTypeNotOwn(_target, params)
local t
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if t:ID()==this:ID() then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==t:Gender()) then return false end elseif params[2]~=t:Gender() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetGenderTypeNotOwn')

-- 攻撃スキル距離条件
-- params[1]:HP閾値方向INDEX
-- params[2]:HP条件INDEX
-- params[3]:属性条件
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function DistanceCondAttackSkill(_target, params)
local t
local Over,Under = 1,0
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if (Process:Param(params[1])==Over and this:Distance(t) >= Process:Param(params[2])) or (Process:Param(params[1])==Under and this:Distance(t) < Process:Param(params[2])) then
		if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
		if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
	end
	return false
end
SetCondLog('DistanceCondAttackSkill')

-- 敵距離順位条件特定装備時攻撃スキル
-- params[1]:条件方向/距離順位閾値
-- params[2]:装備条件
-- params[3]:属性条件
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function EnemyDistanceOrderCondTargetEquipAttackSkill(_target, params)
local t, filter, res
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]~=0 then if not (CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:WeaponType()) or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:SubWeaponType()) or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this:ArmorType())) then return false end end else if params[2]~=this:WeaponType() and params[2]~=this:SubWeaponType() and params[2]~=this:ArmorType() then return false end end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	prm = GetProcParamArray(params[1])
	prm[1], prm[2] = prm[1] or 0, prm[2] or 0
	if prm[1] >= 3 then prm[1] = prm[1] - 3 prm[3] = COMPARE_OVER else prm[3] = COMPARE_UNDER end
	filter = newFilter(function(_u) return this:Distance(_u), prm[3] end, this:Distance(t))
	res = {}
	for i,u in pairs(units:GetCondUnitList(TARGET_SIDE_OPPONENT, TARGET_COND_ALIVE, UNIT_COND_NONE)) do
		if u:ID() ~= t:ID() then  res = filter(u) end
	end
	if procCompare(prm[1], #res + 1, prm[2]) then
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
	end
	return false
end
SetCondLog('EnemyDistanceOrderCondTargetEquipAttackSkill')

-- 移動中特定スキル
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillMove(_target, params)
	Field:FrameUpdate(_target)
	if Bullet:Target():State() ~= STATE_MOVE then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillMove')

-- 自分特定スキル発動中攻撃スキル
-- params[1]:敵・味方
-- params[2]:発動中スキルタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillAndValidAttackSkill(_target, params)
local skl
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	skl = this:ActSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Type')) then return false end elseif not skl:Type(params[2]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('ActValidOwnerSkillAndValidAttackSkill')

-- 対象特定スキル発動中攻撃スキル
-- params[1]:敵・味方
-- params[2]:発動中スキルタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function ActValidTargetSkillAndValidAttackSkill(_target, params)
local t, skl
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if t:State() ~= STATE_MAIN then return false end
	skl = t:ActSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Type')) then return false end elseif not skl:Type(params[2]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('ActValidTargetSkillAndValidAttackSkill')

-- 待機中特定スキル
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillIdle(_target, params)
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_IDLE then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillIdle')

-- 被ダメージステート中特定スキル
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillDamageState(_target, params)
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_DAMAGE and this:State() ~= STATE_DAMAGESKY then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillDamageState')

-- 対象が空中に居る
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsSky(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:Target():PosY()>0
end
SetCondLog('IsSky')

-- 地上
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsGround(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:Target():PosY()==0
end
SetCondLog('IsGround')

-- 自分空中
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsOwnerSky(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and this:PosY()>0
end
SetCondLog('IsOwnerSky')

-- 特定地形
-- params[1]:敵・味方
-- params[2]:地形タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillWithTerrain(_target, params)
	Field:FrameUpdate(_target)
	if not (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==Field:BgTerrain()) then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillWithTerrain')

-- 特定地形クリティカル発生
-- params[1]:敵・味方
-- params[2]:地形タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillCriticalWithTerrain(_target, params)
	Field:FrameUpdate(_target)
	if not (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==Field:BgTerrain()) then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:IsCRT()
end
SetCondLog('IsValidSkillCriticalWithTerrain')

-- 特定地形ガード発生
-- params[1]:敵・味方
-- params[2]:地形タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillGuardWithTerrain(_target, params)
	Field:FrameUpdate(_target)
	if not (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==Field:BgTerrain()) then return false end
	if not Bullet:IsGuard() then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillGuardWithTerrain')

-- 特定地形攻撃スキル
-- params[1]:敵・味方
-- params[2]:地形タイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsValidAttackSkillWithTerrain(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if not (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==Field:BgTerrain()) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidAttackSkillWithTerrain')

-- 特定地形で気絶またはブレイク状態の敵に攻撃スキル
-- params[1]:地形タイプ
-- params[2]:気絶orブレイク
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsBreakAttackSkillWithTerrainToEnemy(_target, params)
local res
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if not (params[1]==0 or Process:Param(params[1])==0 or Process:Param(params[1])==Field:BgTerrain()) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	res = Bullet:Target():IsBreak() and (Process:Param(params[2])==VIT_TYPE_ALL or Process:Param(params[2])==Bullet:Target():IsBreak())
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT) and res
end
SetCondLog('IsBreakAttackSkillWithTerrainToEnemy')

-- 特定地形でキラー発生攻撃スキル
-- params[1]:敵・味方
-- params[2]:地形タイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsKillerBulletAttackSkillWithTerrain(_target, params)
local flag = false
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if not (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==Field:BgTerrain()) then return false end
	for i,j in ipairs(Bullet:Target():Type()) do
		if Bullet:IsKiller(j) then flag = true break end
	end
	if not flag then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsKillerBulletAttackSkillWithTerrain')

-- 特定地形効果
-- params[1]:敵・味方
-- params[2]:地形効果タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillWithTerrainEffect(_target, params)
	Field:FrameUpdate(_target)
	if Field:Terrain()==TERRAIN_NONE then return false end
	if not (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==Field:Terrain()) then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillWithTerrainEffect')

-- 特定サブタイプクエスト攻撃スキル
-- params[1]:敵・味方
-- params[2]:クエストサブタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillWithQuestSubType(_target, params)
local res
	Field:FrameUpdate(_target)
	res = Field:GetQuestInfo()
	if params[5]&1==1 then if not (params[2]==0 or res[QUEST_MST_INFO_SUB_TYPE]==Process:Param(params[2])) then return false end elseif res[QUEST_MST_INFO_SUB_TYPE]~=params[2] then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillWithQuestSubType')

-- 自分が状態異常
-- params[1]:敵・味方
-- params[2]:状態異常ID
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function OwnerAilment(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[2]==0 or Process:Param(params[2])==0 then
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and this:IsAilment()
	else
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and this:IsAilment(Process:Param(params[2]))
	end
end
SetCondLog('OwnerAilment')

-- 自分状態異常攻撃スキル
-- params[1]:敵・味方
-- params[2]:状態異常ID
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function OwnerAilmentAttackSkill(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[2]==0 or Process:Param(params[2])==0 then
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and this:IsAilment()
	else
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and this:IsAilment(Process:Param(params[2]))
	end
end
SetCondLog('OwnerAilmentAttackSkill')

-- 対象が状態異常
-- params[1]:敵・味方
-- params[2]:状態異常ID
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsAilment(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[2]==0 or Process:Param(params[2])==0 then
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:Target():IsAilment()
	else
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:Target():IsAilment(Process:Param(params[2]))
	end
end
SetCondLog('IsAilment')

-- 状態異常攻撃スキル
-- params[1]:敵・味方
-- params[2]:状態異常ID
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAilmentAttackSkill(_target, params)
local t, ailment
	Field:FrameUpdate(_target)
	if not (Bullet:SKL_Role(SKILL_ROLE_ATTACK, CS_COMPARE_DIRECT) and Bullet:TargetSide(params[1])) then return false end
	if params[5]&2==2 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	if params[5]&4==4 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[4], CS_COMPARE_DIRECT) then return false end
	ailment = (params[2]~=0 and params[5]&1==1) and Process:Param(params[2]) or params[2]
	ailment = ailment~=0 and ailment or nil
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if not t:IsAilment(ailment) then return false end
	return true
end
SetCondLog('IsAilmentAttackSkill')

-- 状態異常攻撃スキルクリティカル発生
-- params[1]:敵・味方
-- params[2]:状態異常ID
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAilmentAttackSkillCritical(_target, params)
local ailment
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) or not Bullet:IsCRT() then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	ailment = (params[2]~=0 and params[5]&1==1) and Process:Param(params[2]) or params[2]
	ailment = ailment~=0 and ailment or nil
	if not Bullet:Target():IsAilment(ailment) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAilmentAttackSkillCritical')

-- 状態異常攻撃スキル死神条件
-- params[1]:死神条件
-- params[2]:状態異常ID
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAilmentAttackSkillGrimReaperCond(_target, params)
local t, ailment
	Field:FrameUpdate(_target)
	if not (Bullet:TargetSide(TARGET_SIDE_OPPONENT) and Bullet:GrimReaperCond(params[1])) then return false end
	if params[5]&2==2 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	if params[5]&4==4 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[4], CS_COMPARE_DIRECT) then return false end
	ailment = (params[2]~=0 and params[5]&1==1) and Process:Param(params[2]) or params[2]
	ailment = ailment~=0 and ailment or nil
	if not Bullet:Target():IsAilment(ailment) then return false end
	return true
end
SetCondLog('IsAilmentAttackSkillGrimReaperCond')

-- 非状態異常
-- params[1]:敵・味方
-- params[2]:状態異常ID
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsNotAilment(_target, params)
local ailment
	Field:FrameUpdate(_target)
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	ailment = (params[2]~=0 and params[5]&1==1) and Process:Param(params[2]) or params[2]
	ailment = ailment~=0 and ailment or nil
	if Bullet:Target():IsAilment(ailment) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsNotAilment')

-- 非状態異常攻撃スキル
-- params[1]:敵・味方
-- params[2]:状態異常ID
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsNotAilmentAttackSkill(_target, params)
local ailment
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	ailment = (params[2]~=0 and params[5]&1==1) and Process:Param(params[2]) or params[2]
	ailment = ailment~=0 and ailment or nil
	if Bullet:Target():IsAilment(ailment) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsNotAilmentAttackSkill')

-- 状態異常数条件
-- params[1]:敵味方/条件方向/条件オプション/状態異常数閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillAilmentCountCond(_target, params)
local t, prm, cnt
	Field:FrameUpdate(_target)
	prm = GetProcParamArray2(params[1], {[2] = -1}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}, {0, 1, 2}, {1, 2}}, 4)
	if not Bullet:TargetSide(prm[1]) then return false end
	if params[5]&4==4 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Role(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Role(params[4], CS_COMPARE_DIRECT) then return false end
	if params[5]&1==1 and params[2]>=0 then if not Bullet:Element(GetProcParamArray(params[2]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[2], CS_COMPARE_DIRECT) then return false end
	if params[5]&2==2 then t = GetProcParamIndex(params[3]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[3], CS_COMPARE_DIRECT) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if prm[2] == -1 then
		if prm[4] >= 0 then
			prm[2] = 1
		else
			prm[2] = 0
			prm[4] = -prm[4]
		end
	end
	cnt = 0
	for i,j in pairs(t:AilmentList()) do
		if j and (prm[3]==0 or (IS_AILMENT_COMMON[i] and prm[3]==1) or (not IS_AILMENT_COMMON[i] and prm[3]==2)) then
			cnt = cnt + 1
		end
	end
	if not procCompare(prm[2], cnt, prm[4]) then return false end
	return true
end
SetCondLog('IsValidSkillAilmentCountCond')

-- 指定スキル使用不可中攻撃スキル
-- params[1]:敵・味方
-- params[2]:使用不可スキル INDEX
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerCannotUseTargetSkill(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if not Process:IsSimulating() then
		if (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==2) and not this:CanUseSkillType(SKILL_SKILL) then return true end
		if (params[2]==0 or Process:Param(params[2])==1 or Process:Param(params[2])==2) and not this:CanUseSkillType(SKILL_MAGIC) then return true end
	end
	return false
end
SetCondLog('IsAttackSkillOwnerCannotUseTargetSkill')

-- 対象がバフ状態
-- params[1]:敵・味方
-- params[2]:バフ/デバフ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsBuff(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[2]==0 then
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and (select(1, Bullet:Target():IsBuff()))
	else
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and (select(Process:Param(params[2]) + 1, Bullet:Target():IsBuff()))
	end
end
SetCondLog('IsBuff')

-- 特定スキル自分バフカテゴリ状態
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillOwnerBuffCategory(_target, params)
local buffCate
	Field:FrameUpdate(_target)
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (this:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsValidSkillOwnerBuffCategory')

-- 特定攻撃スキル自分バフID状態
-- params[1]:敵・味方
-- params[2]:バフID
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerBuffId(_target, params)
local buffId
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffId = nil else buffId = Process:Param(params[2]) end else buffId = params[2] end
	if (buffId and not this:IsBuff(buffId)) or (buffId == nil and this:VisibleBuffCount() == 0) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillOwnerBuffId')

-- 特定攻撃スキル自分バフカテゴリ状態
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerBuffCategory(_target, params)
local buffCate
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (this:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsAttackSkillOwnerBuffCategory')

-- 特定攻撃スキル自分非バフカテゴリ状態
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillNotOwnerBuffCategory(_target, params)
local buffCate
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (not this:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsAttackSkillNotOwnerBuffCategory')

-- 指定INDEX攻撃特技自分バフカテゴリ状態
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:特技INDEX_INDEX
-- params[4]:属性
-- params[5]:パラメータタイプ(bit)
function IsTargetUIIndexAttackSkillOwnerBuffCategory(_target, params)
local buffCate, skl
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 and params[4]>=0 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[4]) then return false end
	skl = Bullet:GetParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) or (params[3]~=0 and Process:Param(params[3])~=0 and Process:Param(params[3])~=skl:IndexUI()) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (this:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsTargetUIIndexAttackSkillOwnerBuffCategory')

-- ガード発生攻撃スキル自分バフカテゴリ状態
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsGuardAttackSkillOwnerBuffCategory(_target, params)
local buffCate
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) or not Bullet:IsGuard() then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (this:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsGuardAttackSkillOwnerBuffCategory')

-- 自分空中攻撃スキル自分バフカテゴリ状態
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsOwnerSkyAttackSkillOwnerBuffCategory(_target, params)
local buffCate
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) or not (this:PosY()>0) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (this:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsOwnerSkyAttackSkillOwnerBuffCategory')

-- 特定向き敵攻撃スキル自分バフカテゴリ状態
-- params[1]:向き
-- params[2]:バフカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsEnemyAttackSkillDirectionOwnerBuffCategory(_target, params)
local buffCate
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) or Bullet:TargetToDir()~=params[1] then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return this:IsBuffCategory(buffCate)
end
SetCondLog('IsEnemyAttackSkillDirectionOwnerBuffCategory')

-- 特定UID生存中特定攻撃スキル自分バフカテゴリ状態
-- params[1]:アクターUID_INDEX
-- params[2]:バフカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillTargetUidAliveAndOwnerBuffCategory(_target, params)
local u, flag, buffCate
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	flag = false
	for i,index in pairs(GetProcParamIndex(params[1])) do
		if index ~= 0 and Process:Param(index) ~= 0 then
			u = units:GetUnit(Process:Param(index))
			if u:Alive() and not u:IsExcluded() then
				flag = true
				break
			end
		end
	end
	if not flag then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (this:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT))
end
SetCondLog('IsAttackSkillTargetUidAliveAndOwnerBuffCategory')

-- 特定攻撃スキル対象特定敵タイプ敵自分バフカテゴリ状態
-- params[1]:バフカテゴリ
-- params[2]:エネミータイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillTargetEnemyTypeAndOwnerBuffCategory(_target, params)
local t, boss, buffCate
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&2==2 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[1]==0 then buffCate = nil else buffCate = Process:Param(params[1]) end else buffCate = params[1] end
	return (this:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT))
end
SetCondLog('IsAttackSkillTargetEnemyTypeAndOwnerBuffCategory')

-- 個性LV条件特定攻撃スキル自分バフカテゴリ状態
-- params[1]:敵・味方
-- params[2]:条件方向/個性lvINDEX/個性lv閾値
-- params[3]:バフカテゴリ
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerBuffCategoryPersonalityLevelCond(_target, params)
local buffCate,prm
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[3]==0 then buffCate = nil else buffCate = Process:Param(params[3]) end else buffCate = params[3] end
	prm = GetProcParamIndex(params[2])
	if not procCompare(Process:Param(prm[1]), this:PersonalityLevel(Process:Param(prm[2])), Process:Param(prm[3])) then return false end
	return (this:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsAttackSkillOwnerBuffCategoryPersonalityLevelCond')

-- 特定スキル対象バフカテゴリ状態
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillTargetBuffCategory(_target, params)
local t, buffCate
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (t:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsValidSkillTargetBuffCategory')

-- 特定攻撃スキル対象バフカテゴリ状態
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillTargetBuffCategory(_target, params)
local t, buffCate
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (t:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsAttackSkillTargetBuffCategory')

-- 特定攻撃スキルクリティカルキラー発生対象バフカテゴリ状態
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillCriticalKillerTargetBuffCategory(_target, params)
local t, buffCate
local flag = false
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if not Bullet:IsCRT() then return false end
	for i,j in ipairs(Bullet:Target():Type()) do
		if Bullet:IsKiller(j) then flag = true break end
	end
	if not flag then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (t:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsAttackSkillCriticalKillerTargetBuffCategory')

-- 特定攻撃スキル敵バフカテゴリ状態HP条件
-- params[1]:制限回数/条件方向/HP閾値
-- params[2]:バフカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillTargetBuffCategoryHpCond(_target, params)
local t, buffCate, cnt, prm
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	cnt = Process:GetKeptParam(1) or 0
	prm = GetProcParamIndex(params[1])
	prm[1], prm[2], prm[3] = prm[1] or 0, prm[2] or 0, prm[3] or 0
	if prm[1] > 0 and Process:Param(prm[1])>0 and Process:Param(prm[1])<=cnt then return false end
	if t:PerHP() < 0 or not procCompare(Process:Param(prm[2]), t:PerHP(), Process:Param(prm[3])) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	if (t:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)) then
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return true
	end
	return false
end
SetCondLog('IsAttackSkillTargetBuffCategoryHpCond')

-- 指定INDEX攻撃特技敵バフカテゴリ状態HP条件
-- params[1]:制限回数/条件方向/HP閾値
-- params[2]:特技INDEX_INDEX
-- params[3]:バフカテゴリ
-- params[4]:属性
-- params[5]:パラメータタイプ(bit)
function IsTargetUIIndexAttackSkillAndTargetBuffCategoryHpCond(_target, params)
local t, skl, buffCate, cnt, prm
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 and params[4]>=0 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[4]) then return false end
	skl = Bullet:GetParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) or (params[2]~=0 and Process:Param(params[2])~=0 and Process:Param(params[2])~=skl:IndexUI()) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	cnt = Process:GetKeptParam(1) or 0
	prm = GetProcParamIndex(params[1])
	prm[1], prm[2], prm[3] = prm[1] or 0, prm[2] or 0, prm[3] or 0
	if prm[1] > 0 and Process:Param(prm[1])>0 and Process:Param(prm[1])<=cnt then return false end
	if t:PerHP() < 0 or not procCompare(Process:Param(prm[2]), t:PerHP(), Process:Param(prm[3])) then return false end
	if params[5]&1==1 then if params[3]==0 then buffCate = nil else buffCate = Process:Param(params[3]) end else buffCate = params[3] end
	if (t:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)) then
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return true
	end
	return false
end
SetCondLog('IsTargetUIIndexAttackSkillAndTargetBuffCategoryHpCond')

-- 特定攻撃スキル対象特定敵タイプ敵バフカテゴリ状態
-- params[1]:バフカテゴリ
-- params[2]:エネミータイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillTargetEnemyTypeBuffCategory(_target, params)
local t, boss, buffCate
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&2==2 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[1]==0 then buffCate = nil else buffCate = Process:Param(params[1]) end else buffCate = params[1] end
	return (t:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT))
end
SetCondLog('IsAttackSkillTargetEnemyTypeBuffCategory')

-- 特定攻撃スキルクリティカル発生対象特定敵タイプ敵バフカテゴリ状態
-- params[1]:バフカテゴリ
-- params[2]:エネミータイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillCriticalTargetEnemyTypeBuffCategory(_target, params)
local t, boss, buffCate
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if not Bullet:IsCRT() then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&2==2 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[1]==0 then buffCate = nil else buffCate = Process:Param(params[1]) end else buffCate = params[1] end
	return (t:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT))
end
SetCondLog('IsAttackSkillCriticalTargetEnemyTypeBuffCategory')

-- 特定攻撃スキル対象指定ヒット以上特定敵タイプ敵バフカテゴリ状態
-- params[1]:ヒット数条件
-- params[2]:バフカテゴリ
-- params[3]:エネミータイプ
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillTargetEnemyTypeOverHitsBuffCategory(_target, params)
local t, boss, buffCate
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if Bullet:Target():Hits()<Process:Param(params[1]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&2==2 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (t:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT))
end
SetCondLog('IsAttackSkillTargetEnemyTypeOverHitsBuffCategory')

-- 被弾者が特定の向き
-- あくまで発動者と被弾者の位置関係だけで判断する
-- params[1]:敵・味方
-- params[2]:向き
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function Direction(_target, params)
local u,t
local res
	Field:FrameUpdate(_target)
	u,t = Bullet:Parent(),Bullet:Target()
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(u, t, params[1]) and Bullet:TargetToDir()==params[2]
end
SetCondLog('Direction')

-- 攻撃スキル向き
-- ※あくまで発動者と被弾者の位置関係だけで判断する
-- params[1]:敵・味方
-- params[2]:向き
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function DirectionAttack(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:TargetToDir()==params[2]
end
SetCondLog('DirectionAttack')

-- 被弾者が特定の向き且つクリティカル発生
-- あくまで発動者と被弾者の位置関係だけで判断する
-- params[1]:敵・味方
-- params[2]:向き
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function DirectionCritical(_target, params)
local u,t
local res
	Field:FrameUpdate(_target)
	if not Bullet:IsCRT() then return false end
	u,t = Bullet:Parent(),Bullet:Target()
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(u, t, params[1]) and Bullet:TargetToDir()==params[2]
end
SetCondLog('DirectionCritical')

-- クリティカル発生攻撃スキル向き
-- ※あくまで発動者と被弾者の位置関係だけで判断する
-- params[1]:敵・味方
-- params[2]:向き
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function DirectionAttackCritical(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) or not Bullet:IsCRT() then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:TargetToDir()==params[2]
end
SetCondLog('DirectionAttackCritical')

-- 特定敵タイプ敵攻撃スキル向き
-- ※あくまで発動者と被弾者の位置関係だけで判断する
-- params[1]:向き
-- params[2]:エネミータイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function DirectionAttackTargetEnemyType(_target, params)
local t, boss
	Field:FrameUpdate(_target)
	if not (Bullet:SKL_Role(SKILL_ROLE_ATTACK) and Bullet:TargetSide(TARGET_SIDE_OPPONENT)) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&2==2 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	if params[5]&4==4 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[4], CS_COMPARE_DIRECT) then return false end
	return Bullet:TargetToDir()==params[1]
end
SetCondLog('DirectionAttackTargetEnemyType')

-- 向き死神条件
-- あくまで発動者と被弾者の位置関係だけで判断する
-- params[1]:死神条件
-- params[2]:向き
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function DirectionGrimReaperCond(_target, params)
local t
	Field:FrameUpdate(_target)
	if not (Bullet:TargetSide(TARGET_SIDE_OPPONENT) and Bullet:TargetToDir()==params[2] and Bullet:GrimReaperCond(params[1])) then return false end
	if params[5]&1==1 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	if params[5]&2==2 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[4], CS_COMPARE_DIRECT) then return false end
	return true
end
SetCondLog('DirectionGrimReaperCond')

-- 半径条件キャラカテゴリボス
-- params[1]:半径閾値方向INDEX
-- params[2]:半径条件INDEX
-- params[3]:キャラカテゴリ条件
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsTargetCharaCategoryBossEnemyAndRadiusCond(_target, params)
local Over,Under = 1,0
local t, charaCategory
local flag = false
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	if not t:IsBoss() then return false end
	if (Process:Param(params[1])==Over and t:Radius() >= Process:Param(params[2])) or (Process:Param(params[1])==Under and t:Radius() < Process:Param(params[2])) then
		if params[5]&1==1 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
		if params[3]~=0 then charaCategory = Process:Param(params[3]) else charaCategory = 0 end
		if charaCategory == 0 then
			flag = true
		else
			for i,j in ipairs(t:Category()) do
				if j == charaCategory then flag = true break end
			end
		end
		return flag and IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
	end
	return false
end
SetCondLog('IsTargetCharaCategoryBossEnemyAndRadiusCond')

-- 対象が気絶またはブレイク状態
-- params[1]:敵・味方
-- params[2]:気絶orブレイク
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsBreak(_target, params)
local t, res
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	res = t:IsBreak() and (params[2]==VIT_TYPE_ALL or params[2]==t:IsBreak())
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and res
end
SetCondLog('IsBreak')

-- 気絶・ブレイク攻撃スキル
-- params[1]:敵・味方
-- params[2]:気絶orブレイク
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsBreakAttackSkill(_target, params)
local t, res
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	res = t:IsBreak() and (params[2]==VIT_TYPE_ALL or params[2]==t:IsBreak())
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and res
end
SetCondLog('IsBreakAttackSkill')

-- 気絶・ブレイク攻撃スキル_PP
-- params[1]:敵・味方
-- params[2]:気絶orブレイク INDEX
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsBreakAttackSkill_PP(_target, params)
local t, res
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	res = t:IsBreak() and (Process:Param(params[2])==VIT_TYPE_ALL or Process:Param(params[2])==t:IsBreak())
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) or not res then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsBreakAttackSkill_PP')

-- B_自分気絶・ブレイク
-- params[1]:敵・味方
-- params[2]:気絶orブレイク
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsOwnerBreak(_target, params)
local res
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	res = this:IsBreak() and (params[2]==VIT_TYPE_ALL or params[2]==this:IsBreak())
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and res
end
SetCondLog('IsOwnerBreak')

-- 特定地形で攻撃スキル対象が気絶またはブレイク状態
-- params[1]:敵・味方
-- params[2]:気絶orブレイク
-- params[3]:地形タイプ
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsBreakAttackSkillWithTerrain(_target, params)
local res
	Field:FrameUpdate(_target)
	if not (params[3]==0 or Process:Param(params[3])==0 or Process:Param(params[3])==Field:BgTerrain()) then return false end
	if params[5]&1==1 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	res = Bullet:Target():IsBreak() and (params[2]==VIT_TYPE_ALL or params[2]==Bullet:Target():IsBreak())
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and res
end
SetCondLog('IsBreakAttackSkillWithTerrain')

-- 攻撃スキル自分個性LV条件
-- params[1]:敵・味方
-- params[2]:条件方向/個性lvINDEX/個性lv閾値
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerPersonalityLevelCond(_target, params)
local prm
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	prm = GetProcParamIndex(params[2])
	if not procCompare(Process:Param(prm[1]), this:PersonalityLevel(Process:Param(prm[2])), Process:Param(prm[3])) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillOwnerPersonalityLevelCond')

-- 攻撃スキル自分パッシブ所持条件
-- params[1]:敵・味方
-- params[2]:パッシブID
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerHaveTargetIdPassive(_target, params)
local prm
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), this, 'HavePassive')) then return false end elseif not this:HavePassive(params[2]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillOwnerHaveTargetIdPassive')

-- 攻撃スキル自分パッシブ未所持条件
-- params[1]:敵・味方
-- params[2]:パッシブID
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerNotHaveTargetIdPassive(_target, params)
local prm
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or not CompareFromProcParamIndex(GetProcParamIndex(params[2]), this, 'HavePassive')) then return false end elseif this:HavePassive(params[2]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillOwnerNotHaveTargetIdPassive')

-- 攻撃スキル自分HP条件
-- params[1]:制限回数INDEX
-- params[2]:HP閾値方向INDEX
-- params[3]:HP条件INDEX
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerHpCond(_target, params)
local HpOver,HpUnder = 1,0
local cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	cnt = Process:GetKeptParam(1) or 0
	if Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	if (Process:Param(params[2])==HpOver and this:PerHP() >= Process:Param(params[3])) or (Process:Param(params[2])==HpUnder and this:PerHP() < Process:Param(params[3])) then
		if params[5]&1==1 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return true
	end
	return false
end
SetCondLog('IsAttackSkillOwnerHpCond')

-- 特定敵タイプ攻撃スキル自分HP条件
-- params[1]:HP閾値方向INDEX
-- params[2]:HP条件INDEX
-- params[3]:エネミータイプ条件
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillTargetEnemyOwnerHpCond(_target, params)
local HpOver,HpUnder = 1,0
local t, boss
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if (Process:Param(params[1])==HpOver and this:PerHP() >= Process:Param(params[2])) or (Process:Param(params[1])==HpUnder and this:PerHP() < Process:Param(params[2])) then
		t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
		-- 召喚魔法は対象外
		if t:Gender() == GENDER_DUMMY then return false end
		boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
		if params[5]&1==1 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
		if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
		return true
	end
	return false
end
SetCondLog('IsAttackSkillTargetEnemyOwnerHpCond')

-- 属性攻撃自分HP条件
-- params[1]:制限回数INDEX
-- params[2]:HP閾値方向INDEX
-- params[3]:HP条件INDEX
-- params[4]:属性
-- params[5]:パラメータタイプ(bit)
function IsAttackOwnerHpCond(_target, params)
local HpOver,HpUnder = 1,0
local cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	cnt = Process:GetKeptParam(1) or 0
	if Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	if (Process:Param(params[2])==HpOver and this:PerHP() >= Process:Param(params[3])) or (Process:Param(params[2])==HpUnder and this:PerHP() < Process:Param(params[3])) then
		if params[5]&1==1 then if not (params[4]==0 or Process:Param(params[4])==Bullet:Element()) then return false end elseif params[4]~=Bullet:Element() then return false end
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return true
	end
	return false
end
SetCondLog('IsAttackOwnerHpCond')

-- 属性攻撃魔法自分HP条件
-- params[1]:制限回数INDEX
-- params[2]:HP閾値方向INDEX
-- params[3]:HP条件INDEX
-- params[4]:属性
-- params[5]:パラメータタイプ(bit)
function IsAttackMagicOwnerHpCond(_target, params)
local HpOver,HpUnder = 1,0
local cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) or not Bullet:SKL_Type(SKILL_MAGIC) then return false end
	cnt = Process:GetKeptParam(1) or 0
	if Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	if (Process:Param(params[2])==HpOver and this:PerHP() >= Process:Param(params[3])) or (Process:Param(params[2])==HpUnder and this:PerHP() < Process:Param(params[3])) then
		if params[5]&1==1 then if not (params[4]==0 or Process:Param(params[4])==Bullet:Element()) then return false end elseif params[4]~=Bullet:Element() then return false end
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return true
	end
	return false
end
SetCondLog('IsAttackMagicOwnerHpCond')

-- 自分HP条件
-- params[1]:制限回数INDEX
-- params[2]:HP閾値方向INDEX
-- params[3]:HP条件INDEX
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsValidSkillOwnerHpCond(_target, params)
local cnt
	Field:FrameUpdate(_target)
	cnt = Process:GetKeptParam(1) or 0
	if Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	if procCompare(Process:Param(params[2]), this:PerHP(), Process:Param(params[3])) then
		if params[5]&1==1 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return true
	end
	return false
end
SetCondLog('IsValidSkillOwnerHpCond')

-- 敵HP条件
-- params[1]:制限回数/条件方向/HP閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillTargetEnemyHpCond(_target, params)
local t, cnt, prm
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	cnt = Process:GetKeptParam(1) or 0
	prm = GetProcParamIndex(params[1])
	prm[1], prm[2], prm[3] = prm[1] or 0, prm[2] or 0, prm[3] or 0
	if prm[1] > 0 and Process:Param(prm[1])>0 and Process:Param(prm[1])<=cnt then return false end
	if t:PerHP() < 0 or not procCompare(Process:Param(prm[2]), t:PerHP(), Process:Param(prm[3])) then return false end
	if IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT) then
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return true
	end
	return false
end
SetCondLog('IsValidSkillTargetEnemyHpCond')

-- 攻撃スキル敵HP条件
-- params[1]:制限回数INDEX
-- params[2]:HP閾値方向INDEX
-- params[3]:HP条件INDEX
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillTargetHpCond(_target, params)
local t, cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	cnt = Process:GetKeptParam(1) or 0
	if Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if procCompare(Process:Param(params[2]), t:PerHP(), Process:Param(params[3])) then
		if params[5]&1==1 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
	end
	return false
end
SetCondLog('IsAttackSkillTargetHpCond')

-- 攻撃スキルクリティカル敵HP条件
-- params[1]:制限回数INDEX
-- params[2]:HP閾値方向INDEX
-- params[3]:HP条件INDEX
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillCriticalTargetHpCond(_target, params)
local t
local HpOver,HpUnder = 1,0
local cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) or not Bullet:IsCRT() then return false end
	cnt = Process:GetKeptParam(1) or 0
	if Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if (Process:Param(params[2])==HpOver and t:PerHP() >= Process:Param(params[3])) or (Process:Param(params[2])==HpUnder and t:PerHP() < Process:Param(params[3])) then
		if params[5]&1==1 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
	end
	return false
end
SetCondLog('IsAttackSkillCriticalTargetHpCond')

-- 回復スキル自分HP条件
-- params[1]:制限回数INDEX
-- params[2]:HP閾値方向INDEX
-- params[3]:HP条件INDEX
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsHealSkillOwnerHpCond(_target, params)
local cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_HEAL) then return false end
	cnt = Process:GetKeptParam(1) or 0
	if Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	if procCompare(Process:Param(params[2]), this:PerHP(), Process:Param(params[3])) then
		if params[5]&1==1 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_ALLY)
	end
	return false
end
SetCondLog('IsHealSkillOwnerHpCond')

-- 回復スキル味方HP条件
-- params[1]:制限回数INDEX
-- params[2]:HP閾値方向INDEX
-- params[3]:HP条件INDEX
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsHealSkillTargetHpCond(_target, params)
local t, cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_HEAL) then return false end
	cnt = Process:GetKeptParam(1) or 0
	if Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if procCompare(Process:Param(params[2]), t:PerHP(), Process:Param(params[3])) then
		if params[5]&1==1 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_ALLY)
	end
	return false
end
SetCondLog('IsHealSkillTargetHpCond')

-- 特定スキル前後対象HP条件
-- params[1]:敵味方
-- params[2]:条件方向1/ワークHP閾値/条件方向2/リアルHP閾値
-- params[3]:スキルタイプ条件
-- params[4]:スキルロール条件
-- params[5]:パラメータタイプ(bit)
function IsValidSkillTargetHpCondBeforeAfter(_target, params)
local t, prm
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	prm = GetProcParamIndex(params[2])
	prm[1], prm[2], prm[3], prm[4] = prm[1] or 0, prm[2] or 0, prm[3] or 0, prm[4] or 0
	if (prm[1] <= 0 or prm[2] <= 0 or procCompare(Process:Param(prm[1]), t:PerHP(), Process:Param(prm[2]))) and (prm[3] <= 0 or prm[4] <= 0 or procCompare(Process:Param(prm[3]), t:RealPerHP(), Process:Param(prm[4]))) then
		if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
		if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
		return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
	end
	return false
end
SetCondLog('IsValidSkillTargetHpCondBeforeAfter')

-- 攻撃スキル対象MP条件
-- params[1]:制限回数INDEX
-- params[2]:MP閾値方向INDEX
-- params[3]:MP条件INDEX
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillTargetMpCond(_target, params)
local t
local MpOver,MpUnder = 1,0
local cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	cnt = Process:GetKeptParam(1) or 0
	if params[1] > 0 and Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	if (Process:Param(params[2])==MpOver and t:PerMP() >= Process:Param(params[3])) or (Process:Param(params[2])==MpUnder and t:PerMP() < Process:Param(params[3])) then
		if params[5]&1==1 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return true
	end
	return false
end
SetCondLog('IsAttackSkillTargetMpCond')

-- 特定敵タイプ敵VIT条件攻撃スキル
-- params[1]:制限回数/条件方向/VIT閾値
-- params[2]:エネミータイプ条件
-- params[3]:属性条件
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsEnemyAttackSkilllTargetEnemyTypeVitCond(_target, params)
local t, boss, cnt, prm
	Field:FrameUpdate(_target)
	if not IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT) then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	cnt = Process:GetKeptParam(1) or 0
	prm = GetProcParamIndex(params[1])
	prm[1], prm[2], prm[3] = prm[1] or 0, prm[2] or 0, prm[3] or 0
	if prm[1] > 0 and Process:Param(prm[1])>0 and Process:Param(prm[1])<=cnt then return false end
	if t:PerVIT() < 0 or not procCompare(Process:Param(prm[2]), t:PerVIT(), Process:Param(prm[3])) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	Process:KeepParam(1, 1, CALCULATE_ADD)
	return true
end
SetCondLog('IsEnemyAttackSkilllTargetEnemyTypeVitCond')

-- 特定敵タイプ敵VIT条件自分特定汎用情報攻撃スキル
-- params[1]:汎用情報条件
-- params[2]:制限回数/条件方向/VIT閾値
-- params[3]:エネミータイプ条件
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsEnemyAttackSkilllTargetEnemyTypeVitCondOwnerGeneralInfo(_target, params)
local t, boss, cnt, prm
	Field:FrameUpdate(_target)
	if not IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT) then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	cnt = Process:GetKeptParam(1) or 0
	prm = GetProcParamIndex(params[2])
	prm[1], prm[2], prm[3] = prm[1] or 0, prm[2] or 0, prm[3] or 0
	if prm[1] > 0 and Process:Param(prm[1])>0 and Process:Param(prm[1])<=cnt then return false end
	if t:PerVIT() < 0 or not procCompare(Process:Param(prm[2]), t:PerVIT(), Process:Param(prm[3])) then return false end
	if params[1] ~= 0 and not toBoolean(this:GetGeneralInfo(Process:Param(params[1]))) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	Process:KeepParam(1, 1, CALCULATE_ADD)
	return true
end
SetCondLog('IsEnemyAttackSkilllTargetEnemyTypeVitCondOwnerGeneralInfo')

-- 攻撃スキル自分超必殺ゲージ条件
-- params[1]:制限回数INDEX
-- params[2]:超必殺ゲージ閾値方向INDEX
-- params[3]:超必殺ゲージ条件INDEX
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerEtherCond(_target, params)
local Over,Under = 1,0
local cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	cnt = Process:GetKeptParam(1) or 0
	if Process:Param(params[1])>0 and Process:Param(params[1])<=cnt then return false end
	if (Process:Param(params[2])==Over and this:PerEther() >= Process:Param(params[3])) or (Process:Param(params[2])==Under and this:PerEther() < Process:Param(params[3])) then
		if params[5]&1==1 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
		Process:KeepParam(1, 1, CALCULATE_ADD)
		return true
	end
	return false
end
SetCondLog('IsAttackSkillOwnerEtherCond')

-- 特定UID生存中特定攻撃スキル
-- params[1]:敵・味方
-- params[2]:アクターUID_INDEX
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillTargetUidAlive(_target, params)
local u, flag
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	flag = false
	for i,index in pairs(GetProcParamIndex(params[2])) do
		if index ~= 0 and Process:Param(index) ~= 0 then
			u = units:GetUnit(Process:Param(index))
			if u:Alive() and not u:IsExcluded() then
				flag = true
				break
			end
		end
	end
	if not flag then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillTargetUidAlive')

-- プロセスターゲット生存中特定攻撃スキル
-- params[1]:敵・味方
-- params[2]:ターゲットID_INDEX
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillProcessTargetAlive(_target, params)
local u
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	u = this:GetProcessTarget(Process:Param(params[2]))
	if u == nil or not u:Alive() or u:IsExcluded() then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillProcessTargetAlive')

-- 攻撃スキル味方生存数条件
-- params[1]:閾値条件方向INDEX
-- params[2]:味方生存数条件INDEX
-- params[3]:属性条件
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillAllyAliveCond(_target, params)
local Over,Under = 1,0
local cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	cnt = #(units:GetCondUnitList(TARGET_SIDE_ALLY, TARGET_COND_ALIVE, UNIT_COND_NONE))
	if (Process:Param(params[1])==Over and cnt >= Process:Param(params[2])) or (Process:Param(params[1])==Under and cnt < Process:Param(params[2])) then
		return true
	end
	return false
end
SetCondLog('IsAttackSkillAllyAliveCond')

-- 攻撃スキル味方死亡数条件
-- params[1]:閾値条件方向INDEX
-- params[2]:味方死亡数条件INDEX
-- params[3]:属性条件
-- params[4]:スキルタイプ条件
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillAllyDeadCond(_target, params)
local Over,Under = 1,0
local cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	cnt = #(units:GetCondUnitList(TARGET_SIDE_ALLY, TARGET_COND_DEAD, UNIT_COND_NONE))
	if (Process:Param(params[1])==Over and cnt >= Process:Param(params[2])) or (Process:Param(params[1])==Under and cnt < Process:Param(params[2])) then
		return true
	end
	return false
end
SetCondLog('IsAttackSkillAllyDeadCond')

-- 自分が指定番号に属する領域内
-- params[1]:敵・味方
-- params[2]:領域識別子_INDEX
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerInTargetNumberCollision(_target, params)
local flag = false
local collG
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[2] ~= 0 and Process:Param(params[2]) ~= 0 then
		collG = Field:GetCollisionGroupInstance(Process:Param(params[2]))
		for i,coll in pairs(collG:Collisions()) do if coll:InsideUnitIds(this:ID()) then flag = true break end end if not flag then return false end
	end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillOwnerInTargetNumberCollision')

-- 対象にトドメを刺した
-- params[1]:敵・味方
-- params[2]:エネミータイプ(ボスフラグ)
-- params[3]:キャラタイプ
-- params[4]:性別
-- params[5]:パラメータタイプ(bit)
function IsFinish(_target, params)
local t
local boss
local charaType
local flag = false
	Field:FrameUpdate(_target)
	if not Bullet:IsKill() then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 then if not (params[4]==0 or Process:Param(params[4])==t:Gender()) then return false end elseif params[4]~=t:Gender() then return false end
	if params[5]&2==2 and params[3]~=0 then charaType = Process:Param(params[3]) else charaType = params[3] end
	return t:Type(charaType) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsFinish')

-- 対象にトドメを刺した(キャラカテゴリ参照)
-- params[1]:敵・味方
-- params[2]:キャラカテゴリ
-- params[3]:エネミータイプ(ボスフラグ)
-- params[4]:性別
-- params[5]:パラメータタイプ(bit)
function IsTargetCharaCategoryAndFinish(_target, params)
local t
local boss
local charaCategory
local flag = false
	Field:FrameUpdate(_target)
	if not Bullet:IsKill() then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	if params[5]&2==2 then if not (params[4]==0 or Process:Param(params[4])==t:Gender()) then return false end elseif params[4]~=t:Gender() then return false end
	if params[2]~=0 then charaCategory = Process:Param(params[2]) else charaCategory = 0 end
	if charaCategory == 0 then
		flag = true
	else
		for i,j in ipairs(t:Category()) do
			if j == charaCategory then flag = true break end
		end
	end
	return flag and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetCharaCategoryAndFinish')

-- 特定の味の対象にトドメを刺した
-- params[1]:敵・味方
-- params[2]:味カテゴリ
-- params[3]:エネミータイプ(ボスフラグ)
-- params[4]:性別
-- params[5]:パラメータタイプ(bit)
function IsTargetTasteCategoryAndFinish(_target, params)
local t
local boss
local tasteCategory
	Field:FrameUpdate(_target)
	if not Bullet:IsKill() then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	if params[5]&2==2 then if not (params[4]==0 or Process:Param(params[4])==t:Gender()) then return false end elseif params[4]~=t:Gender() then return false end
	if params[2]~=0 then tasteCategory = Process:Param(params[2]) else tasteCategory = CHARA_TASTE_ALL end
	return t:TasteCategory(tasteCategory) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetTasteCategoryAndFinish')

-- 特定の条件を満たすスキルでトドメを刺した
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillFinish(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:IsKill() then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsValidSkillFinish')

-- 指定INDEX特技トドメ
-- params[1]:敵・味方
-- params[2]:特技INDEX INDEX
-- params[3]:属性
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetUIIndexSkillFinish(_target, params)
local skl
	Field:FrameUpdate(_target)
	if not Bullet:IsKill() then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	skl = Bullet:GetParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) or (params[2]~=0 and Process:Param(params[2])~=0 and Process:Param(params[2])~=skl:IndexUI()) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetUIIndexSkillFinish')

-- 特定攻撃スキル自分バフカテゴリ状態トドメ
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerBuffCategoryFinish(_target, params)
local buffCate
	Field:FrameUpdate(_target)
	if not (Bullet:SKL_Role(SKILL_ROLE_ATTACK) and Bullet:IsKill()) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (this:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsAttackSkillOwnerBuffCategoryFinish')

-- 特定スキル対象バフカテゴリ状態トドメ
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillTargetBuffCategoryFinish(_target, params)
local t, buffCate
	Field:FrameUpdate(_target)
	if not Bullet:IsKill() then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (t:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsValidSkillTargetBuffCategoryFinish')

-- 特定スキル自分非バフカテゴリ状態トドメ
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillNotOwnerBuffCategoryFinish(_target, params)
local t, buffCate
	Field:FrameUpdate(_target)
	if not Bullet:IsKill() then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (not this:IsBuffCategory(buffCate) and IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]))
end
SetCondLog('IsValidSkillNotOwnerBuffCategoryFinish')

-- 攻撃スキル自分特定汎用情報トドメ
-- params[1]:敵・味方
-- params[2]:汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerGeneralCountFinish(_target, params)
local prm
local cond, val
	Field:FrameUpdate(_target)
	if not Bullet:IsKill() then return false end
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[2] > 290 then
		prm = GetProcParamIndex(params[2])
		cond, val = Process:Param(prm[2]), this:GetGeneralCount(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[2] > 0 and params[2] <= 10 then
		if (this:GetGeneralCount(Process:Param(params[2])) or 0) == 0 then return false end
	elseif params[2] ~= 0 then
		return false
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillOwnerGeneralCountFinish')

-- 対象死亡中
function IsTargetDead(_target, params)
	Field:FrameUpdate(_target)
	return not Bullet:Target():Alive()
end
SetCondLog('IsTargetDead')

-- 死亡予定
function IsFatal(_target, params)
	Field:FrameUpdate(_target)
	return Bullet:IsFatal()
end
SetCondLog('IsFatal')

-- 生存予定
-- params[1]:制限回数
function IsSurvival(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or Process
local cnt = keepObj:GetKeptParam(1) or 0
	if params[1]==0 or Process:Param(params[1])<=0 or cnt<Process:Param(params[1]) then
		if not Bullet:IsFatal() then
			keepObj:KeepParam(1, 1, CALCULATE_ADD)
			return true
		end
	end
	return false
end
SetCondLog('IsSurvival')

-- 生存予定二種人数条件
-- params[1]:敵・味方1
-- params[2]:条件種別/条件方向/人数閾値/オプション/固定値オプション(65536:自分以外)1
-- params[3]:敵・味方2
-- params[4]:条件種別/条件方向/人数閾値/オプション/固定値オプション(65536:自分以外)2
-- params[5]:パラメータタイプ(bit)
function IsSurvivalActorCountDoubleCond(_target, params)
Field:FrameUpdate(_target)
local prm1, prm2
	if not Bullet:IsFatal() then
		prm1 = GetProcParamIndex(params[2])
		prm1[1], prm1[2], prm1[3] = prm1[1] or 0, prm1[2] or 0, prm1[3] or 0
		if prm1[1] > 0 and prm1[1] <= 10 then prm1[1] = Process:Param(prm1[1]) else prm1[1] = prm1[1] - 10 end
		if prm1[4] ~= nil then prm1[4] = Process:Param(prm1[4]) elseif prm1[5] ~= nil then prm1[4] = prm1[5] end
		if procCompare(Process:Param(prm1[2]), #(units:GetCondUnitList(((params[5]&1==1) and params[1] ~= 0) and Process:Param(params[1]) or params[1], prm1[1] + (prm1[4] == 1 and UNIT_COND_NOT_ME or 0), UNIT_COND_NONE)), Process:Param(prm1[3])) then
			prm2 = GetProcParamIndex(params[4])
			prm2[1], prm2[2], prm2[3] = prm2[1] or 0, prm2[2] or 0, prm2[3] or 0
			if prm2[1] > 0 and prm2[1] <= 10 then prm2[1] = Process:Param(prm2[1]) else prm2[1] = prm2[1] - 10 end
			if prm2[4] ~= nil then prm2[4] = Process:Param(prm2[4]) elseif prm2[5] ~= nil then prm2[4] = prm2[5] end
			if procCompare(Process:Param(prm2[2]), #(units:GetCondUnitList(((params[5]&2==2) and params[3] ~= 0) and Process:Param(params[3]) or params[3], prm2[1] + (prm2[4] == 1 and UNIT_COND_NOT_ME or 0), UNIT_COND_NONE)), Process:Param(prm2[3])) then
				return true
			end
		end
	end
	return false
end
SetCondLog('IsSurvivalActorCountDoubleCond')

-- 指定以上ヒットしているか
-- params[1]:敵・味方
-- params[2]:ヒット数
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function OverHits(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:Target():Hits()>=Process:Param(params[2])
end
SetCondLog('OverHits')

-- ヒット未満
-- params[1]:敵・味方
-- params[2]:ヒット数
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function UnderHits(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:Target():Hits()<Process:Param(params[2])
end
SetCondLog('UnderHits')

-- 空中の相手に指定以上ヒットしているか
-- params[1]:敵・味方
-- params[2]:ヒット数
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function OverHitsIsSky(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and Bullet:Target():Hits()>=Process:Param(params[2]) and Bullet:Target():PosY()>0
end
SetCondLog('OverHitsIsSky')

-- 指定バレットを指定ヒット毎
-- params[1]:敵・味方
-- params[2]:ヒット数INDEX
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function MultipleHits(_target, params)
local cnt
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Process:Param(params[3])==Bullet:Element()) then return false end elseif params[3]~=Bullet:Element() then return false end
	if not IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) then return false end
	cnt = (Process:GetKeptParam(1) or 0) + 1
	if cnt >= Process:Param(params[2]) then Process:KeepParam(1, 0) return true else Process:KeepParam(1, 1, CALCULATE_ADD) return false end
end
SetCondLog('MultipleHits')

-- 攻撃スキル指定ヒットインデックス
-- params[1]:敵・味方
-- params[2]:バレットヒットINDEX
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillHitIndex(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if Process:Param(params[2]) > 0 and Bullet:HitIndex() ~= Process:Param(params[2]) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillHitIndex')

-- 指定した魔法陣展開中かどうか
-- params[1]:敵・味方
-- params[2]:展開LV
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsOwnerSpecificPreCast(_target, params)
	Field:FrameUpdate(_target)
	if Process:Param(params[2])~=this:CastLV() then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsOwnerSpecificPreCast')

-- 相手が魔法陣展開中かどうか
-- params[1]:敵・味方
-- params[2]:展開LV
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetPreCast(_target, params)
	Field:FrameUpdate(_target)
	if (params[1]==0 and 1 or math.max(Process:Param(params[1]), 1)) > Bullet:Target():CastLV() then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetPreCast')

-- 特定の汎用情報を持つ対象か
-- params[1]:敵・味方
-- params[2]:汎用情報条件
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetGeneralInfo(_target, params)
local t
	Field:FrameUpdate(_target)
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[2] ~= 0 and not toBoolean(t:GetGeneralInfo(Process:Param(params[2]))) then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsTargetGeneralInfo')

-- 特定エネミータイプ且つ特定の汎用情報を持つ対象に攻撃したか
-- params[1]:敵・味方
-- params[2]:汎用情報条件
-- params[3]:エネミータイプ(ボスフラグ)
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetEnemyTypeAndGeneralInfo(_target, params)
local t
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[2] ~= 0 and not toBoolean(t:GetGeneralInfo(Process:Param(params[2]))) then return false end
	if params[5]&1==1 then if not (params[3]==0 or Process:Param(params[3])==boss) then return false end elseif (params[3]==0 and ENEMY_TYPE_NORMAL or params[3])~=boss then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetEnemyTypeAndGeneralInfo')

-- 攻撃スキル自分特定汎用情報
-- params[1]:敵・味方
-- params[2]:汎用情報条件
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerGeneralInfo(_target, params)
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[2] ~= 0 and not toBoolean(this:GetGeneralInfo(Process:Param(params[2]))) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillOwnerGeneralInfo')

-- 攻撃スキル特定汎用情報人数条件
-- params[1]:条件方向/汎用情報INDEX/人数閾値/オプション/固定値オプション(65536:自分以外 131072:死者も含む)
-- params[2]:人数カウント対象(敵・味方)
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillGeneralInfoActorCountCond(_target, params)
local prm, cnt
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	prm = GetProcParamIndex(params[1])
	if prm[4] ~= nil then prm[4] = Process:Param(prm[4]) elseif prm[5] ~= nil then prm[4] = prm[5] end
	cnt = 0
	for i,u in pairs(units:GetCondUnitList(((params[5]&1==1) and params[2] ~= 0) and Process:Param(params[2]) or params[2], bitToBoolean(prm[4], 2) and TARGET_COND_BOTH or TARGET_COND_ALIVE, UNIT_COND_NONE)) do
		if (not bitToBoolean(prm[4], 1) or u:ID() ~= this:ID()) and (Process:Param(prm[2]) ~= 0 and u:GetGeneralInfo(Process:Param(prm[2]))) then cnt = cnt + 1 end
	end
	if not procCompare(Process:Param(prm[1]), cnt, Process:Param(prm[3])) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsAttackSkillGeneralInfoActorCountCond')

-- 攻撃スキル自分特定汎用数値情報
-- params[1]:敵・味方
-- params[2]:汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerGeneralCount(_target, params)
local prm
local cond, val
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[2] > 290 then
		prm = GetProcParamIndex(params[2])
		cond, val = Process:Param(prm[2]), this:GetGeneralCount(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[2] > 0 and params[2] <= 10 then
		if (this:GetGeneralCount(Process:Param(params[2])) or 0) == 0 then return false end
	elseif params[2] ~= 0 then
		return false
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillOwnerGeneralCount')

-- 特定キャラタイプ攻撃スキル自分特定汎用数値情報
-- params[1]:敵・味方/汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[2]:キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetCharaTypeAttackSkillOwnerGeneralCount(_target, params)
local prm, t, val
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&2==2 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Type')) then return false end elseif not t:Type(params[2]) then return false end
	prm = GetProcParamArray2(params[1], {[3] = -1}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}, [3] = {0,1,2}}, 4)
	if not IsValidTarget(Bullet:Parent(), Bullet:Target(), prm[1]) then return false end
	if prm[2] > 0 then
		val = this:GetGeneralCount(prm[2]) or 0
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if prm[3] == 0 and val == 0 then return false end
		if prm[3] == -1 then
			if prm[4] < 0 and val == 0 then return false end
			if prm[4] == 0 then prm[3], prm[4] = 1, 1 end
		end
		if not procCompare(prm[3], val, prm[4]) then return false end
	end
	return true
end
SetCondLog('IsTargetCharaTypeAttackSkillOwnerGeneralCount')

-- 自分スキル発動毎情報
-- params[1]:敵・味方/スキル発動毎情報INDEX/条件方向/スキル発動毎情報閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillOwnerSkillInfo(_target, params)
local prm
local cond, val
	Field:FrameUpdate(_target)
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}}, 4)
	if params[1] > 4655 then
		cond, val = prm[3], Bullet:SKL_GetValue(prm[2])
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, prm[4]) then return false end
	elseif params[1] > 0 and params[1] <= 160 then
		if (Bullet:SKL_GetValue(prm[2]) or 0) == 0 then return false end
	elseif prm[2] ~= 0 or prm[3] ~= 0 or prm[4] ~= 0 then
		return false
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), prm[1])
end
SetCondLog('IsValidSkillOwnerSkillInfo')

-- 攻撃スキル自分スキル発動毎情報
-- params[1]:敵・味方
-- params[2]:スキル発動毎情報INDEX/条件方向/スキル発動毎情報閾値
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillOwnerSkillInfo(_target, params)
local prm
local cond, val
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[2] > 290 then
		prm = GetProcParamIndex(params[2])
		cond, val = Process:Param(prm[2]), Bullet:SKL_GetValue(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[2] > 0 and params[2] <= 10 then
		if (Bullet:SKL_GetValue(Process:Param(params[2])) or 0) == 0 then return false end
	elseif params[2] ~= 0 then
		return false
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsAttackSkillOwnerSkillInfo')

-- 特定敵タイプ敵攻撃スキル自分スキル発動毎情報
-- params[1]:スキル発動毎情報INDEX/条件方向/スキル発動毎情報閾値
-- params[2]:エネミータイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetEnemyTypeAndEnemyAttackSkillOwnerSkillInfo(_target, params)
local t, boss, prm
local cond, val
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[1] > 290 then
		prm = GetProcParamIndex(params[1])
		cond, val = Process:Param(prm[2]), Bullet:SKL_GetValue(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[1] > 0 and params[1] <= 10 then
		if (Bullet:SKL_GetValue(Process:Param(params[1])) or 0) == 0 then return false end
	elseif params[1] ~= 0 then
		return false
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsTargetEnemyTypeAndEnemyAttackSkillOwnerSkillInfo')

-- 特定キャラタイプ敵攻撃スキル自分スキル発動毎情報
-- params[1]:スキル発動毎情報INDEX/条件方向/スキル発動毎情報閾値
-- params[2]:キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsTargetCharaTypeAndEnemyAttackSkillOwnerSkillInfo(_target, params)
local t, prm
local cond, val
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Type')) then return false end elseif not t:Type(params[2]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	if params[1] > 290 then
		prm = GetProcParamIndex(params[1])
		cond, val = Process:Param(prm[2]), Bullet:SKL_GetValue(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[1] > 0 and params[1] <= 10 then
		if (Bullet:SKL_GetValue(Process:Param(params[1])) or 0) == 0 then return false end
	elseif params[1] ~= 0 then
		return false
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsTargetCharaTypeAndEnemyAttackSkillOwnerSkillInfo')

-- 個性LV条件対敵攻撃スキル自分スキル発動毎情報
-- params[1]:条件方向/個性lvINDEX/個性lv閾値
-- params[2]:スキル発動毎情報INDEX/条件方向/スキル発動毎情報閾値
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAttackSkillEnemyOwnerSkillInfoPersonalityLevelCond(_target, params)
local prm
local cond, val
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	prm = GetProcParamIndex(params[1])
	if not procCompare(Process:Param(prm[1]), this:PersonalityLevel(Process:Param(prm[2])), Process:Param(prm[3])) then return false end
	if params[2] > 290 then
		prm = GetProcParamIndex(params[2])
		cond, val = Process:Param(prm[2]), Bullet:SKL_GetValue(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[2] > 0 and params[2] <= 10 then
		if (Bullet:SKL_GetValue(Process:Param(params[2])) or 0) == 0 then return false end
	elseif params[2] ~= 0 then
		return false
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsAttackSkillEnemyOwnerSkillInfoPersonalityLevelCond')

-- 死神専用
-- 死神条件の完全下位互換のためもう使わない
-- params[1]:スキルタイプ
-- params[2]:パラメータタイプ(bit)
-- function GrimReaper(_target, params)
-- local t
-- 	Field:FrameUpdate(_target)
-- 	if not (Bullet:TargetSide(TARGET_SIDE_OPPONENT) and Bullet:GrimReaperCond(1) then return false end
-- 	if params[2]&1==1 then t = GetProcParamIndex(params[1]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[1], CS_COMPARE_DIRECT) then return false end
-- 	return true
-- end
-- SetCondLog('GrimReaper')

-- Not死神
-- 死神条件の完全下位互換のためもう使わない
-- params[1]:スキルタイプ
-- params[2]:パラメータタイプ(bit)
-- function NotGrimReaper(_target, params)
-- local t
-- 	Field:FrameUpdate(_target)
-- 	if not (Bullet:TargetSide(TARGET_SIDE_OPPONENT) and Bullet:GrimReaperCond(2) then return false end
-- 	if params[2]&1==1 then t = GetProcParamIndex(params[1]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[1], CS_COMPARE_DIRECT) then return false end
-- 	return true
-- end
-- SetCondLog('NotGrimReaper')

-- 死神条件
-- params[1]:死神条件
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:パラメータタイプ(bit)
function GrimReaperCond(_target, params)
local t
	Field:FrameUpdate(_target)
	if not (Bullet:TargetSide(TARGET_SIDE_OPPONENT) and Bullet:GrimReaperCond(params[1])) then return false end
	if params[4]&1==1 and params[2]>=0 then if not Bullet:Element(GetProcParamArray(params[2]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[2], CS_COMPARE_DIRECT) then return false end
	if params[4]&2==2 then t = GetProcParamIndex(params[3]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[3], CS_COMPARE_DIRECT) then return false end
	return true
end
SetCondLog('GrimReaperCond')

-- 特定キャラタイプ死神条件
-- params[1]:死神条件
-- params[2]:キャラタイプ
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function TargetCharaTypeGrimReaperCond(_target, params)
local t
	Field:FrameUpdate(_target)
	if not (Bullet:TargetSide(TARGET_SIDE_OPPONENT) and Bullet:GrimReaperCond(params[1])) then return false end
	if params[5]&2==2 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	if params[5]&4==4 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Type(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Type(params[4], CS_COMPARE_DIRECT) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), t, 'Type')) then return false end elseif not t:Type(params[2]) then return false end
	return true
end
SetCondLog('TargetCharaTypeGrimReaperCond')

-- 特定キャラタイプ全ロール死神
-- params[1]:キャラタイプ
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:パラメータタイプ(bit)
function TargetCharaTypeGrimReaper_AllSkillRole(_target, params)
local t
	Field:FrameUpdate(_target)
	if Field:IsPvP() or Field:IsBoss() then return false end
	if params[4]&2==2 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[4]&4==4 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[4]&1==1 then if not (params[1]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[1]), t, 'Type')) then return false end elseif not t:Type(params[1]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('TargetCharaTypeGrimReaper_AllSkillRole')

-- 特定操作成否
-- params[1]:操作タイプ
-- params[3]:パラメータタイプ(bit)
function IsTargetControlResult(_target, params)
local res
	Field:FrameUpdate(_target)
	if params[3]&1==1 then if not CompareFromProcParamIndex(GetProcParamIndex(params[1]), Process, 'IsSucceededControl') then return false end elseif not Process:IsSucceededControl(params[1]) then return false end
	return true
end
SetCondLog('IsTargetControlResult')

-- 制限回数
-- params[1]:制限回数
function CountLimit(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or Process
local cnt = keepObj:GetKeptParam(1) or 0
	if params[1]==0 or Process:Param(params[1])<=0 or cnt<Process:Param(params[1]) then
		keepObj:KeepParam(1, 1, CALCULATE_ADD)
		return true
	end
	return false
end
SetCondLog('CountLimit')

-- ターゲットが自分
function OwnTarget(_target, params)
	Field:FrameUpdate(_target)
	return target:ID() == this:ID()
end
SetCondLog('OwnTarget')

-- 操作ユニットが自分
function OwnOperation(_target, params)
	Field:FrameUpdate(_target)
	return units:GetOperationUnit():ID() == this:ID()
end
SetCondLog('OwnOperation')

-- 先頭ユニットが自分
function OwnFirst(_target, params)
	Field:FrameUpdate(_target)
	return units:GetFirstAllyUnit():ID() == this:ID()
end
SetCondLog('OwnFirst')

-- 特定IDスキル所持
-- params[1]:スキルID
-- params[2]:パラメータタイプ(bit)
function HaveTargetIdSkill(_target, params)
	Field:FrameUpdate(_target)
	if params[2]&1==1 then if not (params[1]==0 or toBoolean(this:GetSkillFromID(Process:Param(params[1])))) then return false end elseif not toBoolean(this:GetSkillFromID(params[1])) then return false end
	return true
end
SetCondLog('HaveTargetIdSkill')

-- 特定のプロセスカテゴリを持つプロセスかどうか
-- params[1]:プロセスカテゴリ
-- スキル情報を見れるように拡張 --
-- params[2]:敵・味方
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetProcess(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[2]) and ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1])
end
SetCondLog('IsTargetProcess')

-- 特定プロセス汎用数値情報条件
-- params[1]:プロセスカテゴリ
-- params[2]:敵味方/汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetProcessGeneralCountCond(_target, params)
local prm, val
	Field:FrameUpdate(_target)
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	prm = GetProcParamArray2(params[2], {[3] = -1}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}, [3] = {0,1,2}}, 4)
	if not IsValidTarget(Bullet:Parent(), Bullet:Target(), prm[1]) then return false end
	if prm[2] > 0 then
		val = this:GetGeneralCount(prm[2]) or 0
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if prm[3] == 0 and val == 0 then return false end
		if prm[3] == -1 then
			if prm[4] < 0 and val == 0 then return false end
			if prm[4] == 0 then prm[3], prm[4] = 1, 1 end
		end
		if not procCompare(prm[3], val, prm[4]) then return false end
	end
	return ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1])
end
SetCondLog('IsTargetProcessGeneralCountCond')

-- 特定プロセス自分バフカテゴリ状態
-- params[1]:プロセスカテゴリ
-- params[2]:バフカテゴリ
-- params[3]:パラメータタイプ(bit)
function IsTargetProcessOwnerBuffCategory(_target, params)
local buffCate
	Field:FrameUpdate(_target)
	if params[3]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	return (this:IsBuffCategory(buffCate) and ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]))
end
SetCondLog('IsTargetProcessOwnerBuffCategory')

-- 特定のプロセスカテゴリと特定のパラメータを持つプロセスかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:条件パラメータビヘイビア
-- params[3]:パラメータ条件
-- params[4]:パラメータタイプ(bit)
function IsTargetParamProcess(_target, params)
local behav, flag
	Field:FrameUpdate(_target)
	if params[4]&1==1 and params[2]~=0 then behav = Process:Param(params[2]) else behav = params[2] end
	if behav ~= 0 then
		flag = false
		for i,j in ipairs(TrigProc:Behav()) do
			if j == behav and TrigProc:Param(i) == Process:Param(params[3]) then
				flag = true
				break
			end
		end
	end
	return flag and ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1])
end
SetCondLog('IsTargetParamProcess')

-- 特定の状態異常を付与するプロセスかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:敵・味方
-- params[3]:状態異常
-- params[4]:パラメータタイプ(bit)
function IsTargetAilmentProcess(_target, params)
local ailment
	Field:FrameUpdate(_target)
	if params[1] ~= PROCESS_CATEGORY_AILMENT and params[1] ~= PROCESS_CATEGORY_AILMENT_RESEARCH then return false end
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	for i,j in ipairs(TrigProc:Behav()) do
		if j == PARAM_BEHAV_COND_KIND_1 then ailment = TrigProc:Param(i) break end
	end
	if params[4]&1==1 then if not (params[3]==0 or Process:Param(params[3])==0 or (Process:Param(params[3])==-1 and toBoolean(IS_AILMENT_COMMON[ailment])) or Process:Param(params[3])==ailment) then return false end elseif params[3]~=ailment then return false end
	return true
end
SetCondLog('IsTargetAilmentProcess')

-- 特定のプロセスIDのプロセスかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:プロセスID
-- params[3]:パラメータタイプ(bit)
function IsTargetIdProcess(_target, params)
local pid
	Field:FrameUpdate(_target)
	if params[3]&1==1 and params[2]~=0 then pid = Process:Param(params[2]) else pid = params[2] end
	if TrigProc:ID() ~= pid then return false end
	return ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1])
end
SetCondLog('IsTargetIdProcess')

-- 特定のパッシブIDから発動したプロセスかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:パッシブスキルID
-- params[3]:パラメータタイプ(bit)
function IsTargetPassiveIdProcess(_target, params)
local pid
	Field:FrameUpdate(_target)
	if TrigProc:Affiliation() ~= PROCESS_AFFILIATION_AUTO_SKILL then return false end
	if params[3]&1==1 and params[2]~=0 then pid = Process:Param(params[2]) else pid = params[2] end
	if TrigProc:localID() ~= pid then return false end
	return ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1])
end
SetCondLog('IsTargetPassiveIdProcess')

-- 特定パッシブIDバフプロセス
-- params[1]:プロセスカテゴリ
-- params[2]:パッシブスキルID
-- params[3]:バフカテゴリ
-- params[4]:バフID
-- params[5]:パラメータタイプ(bit)
function IsTargetPassiveIdBuffProcess(_target, params)
local pid, buffCate, buffId
local flag = false
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	if TrigProc:Affiliation() ~= PROCESS_AFFILIATION_AUTO_SKILL then return false end
	if params[5]&1==1 and params[2]~=0 then pid = Process:Param(params[2]) else pid = params[2] end
	if TrigProc:localID() ~= pid then return false end
	if params[5]&2==2 then if params[3]==0 then buffCate = nil else buffCate = Process:Param(params[3]) end else buffCate = params[3] end
	if params[5]&4==4 and params[4]>0 then buffId = Process:Param(params[4]) else buffId = params[4] end
	for i, buff in pairs(TrigProc:Buffs()) do
		if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
			if buffId == 0 or buffId == buff[BUFF_INFO_ID] then
				flag = true
				break
			end
		end
	end
	return flag
end
SetCondLog('IsTargetPassiveIdBuffProcess')

-- 同一パッシブID起因子プロセス
-- params[1]:プロセスカテゴリ
function IsSamePassiveIdChildProcess(_target, params)
local uid
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	uid = TrigProc:UID()
	if not (Process:Affiliation(nil, false, PROCESS_AFFILIATION_AUTO_SKILL) and Process:Affiliation(uid, true, PROCESS_AFFILIATION_AUTO_SKILL)) then return false end
	if Process:localID() ~= Process:localID(uid, true) then return false end
	return true
end
SetCondLog('IsSamePassiveIdChildProcess')

-- 個性プロセス
-- params[1]:プロセスカテゴリ
-- params[2]:個性INDEX_INDEX
function IsTargetPersonalityProcess(_target, params)
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	if TrigProc:Affiliation() ~= PROCESS_AFFILIATION_AUTO_SKILL then return false end
	if TrigProc:localID() ~= this:PersonalityID(Process:Param(params[2])) then return false end
	return true
end
SetCondLog('IsTargetPersonalityProcess')

-- 個性バフプロセス
-- params[1]:プロセスカテゴリ
-- params[2]:個性INDEX_INDEX
-- params[3]:バフカテゴリ
-- params[4]:バフID
-- params[5]:パラメータタイプ(bit)
function IsTargetPersonalityBuffProcess(_target, params)
local buffCate, buffId
local flag = false
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	if TrigProc:Affiliation() ~= PROCESS_AFFILIATION_AUTO_SKILL then return false end
	if TrigProc:localID() ~= this:PersonalityID(Process:Param(params[2])) then return false end
	if params[5]&1==1 then if params[3]==0 then buffCate = nil else buffCate = Process:Param(params[3]) end else buffCate = params[3] end
	if params[5]&2==2 and params[4]>0 then buffId = Process:Param(params[4]) else buffId = params[4] end
	for i, buff in pairs(TrigProc:Buffs()) do
		if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
			if buffId == 0 or buffId == buff[BUFF_INFO_ID] then
				flag = true
				break
			end
		end
	end
	return flag
end
SetCondLog('IsTargetPersonalityBuffProcess')

-- 特定対象個性バフプロセス
-- params[1]:プロセスカテゴリ
-- params[2]:敵味方
-- params[3]:個性INDEX_INDEX
-- params[4]:バフカテゴリ
-- params[5]:パラメータタイプ(bit)
function IsValidTargetPersonalityBuffProcess(_target, params)
local buffCate
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	if TrigProc:Affiliation() ~= PROCESS_AFFILIATION_AUTO_SKILL then return false end
	if TrigProc:localID() ~= this:PersonalityID(Process:Param(params[3])) then return false end
	if not this:RelativeSide(target, ((params[5]&1==1) and params[2] ~= 0) and Process:Param(params[2]) or params[2]) then return false end
	if params[5]&2==2 then if params[4]==0 then buffCate = nil else buffCate = Process:Param(params[4]) end else buffCate = params[4] end
	for i, buff in pairs(TrigProc:Buffs()) do
		if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
			return true
		end
	end
	return false
end
SetCondLog('IsValidTargetPersonalityBuffProcess')

-- 特定カリスマバフプロセス
-- params[1]:プロセスカテゴリ(カリスマ固定)
-- params[2]:カリスマバフID
-- params[3]:パラメータタイプ(bit)
function IsTargetCharismaBuffProcess(_target, params)
local buffId
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, PROCESS_CATEGORY_BUFF) then return false end
	if params[3]&1==1 then if params[2]==0 then buffId = nil else buffId = Process:Param(params[2]) end else buffId = params[2] end
	for i, buff in pairs(TrigProc:Buffs()) do
		if buffId == nil or buffId == buff[BUFF_INFO_ID] then
			return true
		end
	end
	return false
end
SetCondLog('IsTargetCharismaBuffProcess')

-- 気絶・ブレイク中であり、特定のプロセスカテゴリを持つプロセスかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:エネミータイプ
-- params[3]:キャラタイプ
-- params[4]:性別
-- params[5]:パラメータタイプ(bit)
function OwnerBreakTargetProcess(_target, params)
local boss
local charaType
local flag = false
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	if not toBoolean(this:IsBreak()) then return false end
	boss = this:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==boss) then return false end elseif (params[2]==0 and ENEMY_TYPE_NORMAL or params[2])~=boss then return false end
	if params[5]&4==4 then if not (params[4]==0 or Process:Param(params[4])==this:Gender()) then return false end elseif params[4]~=this:Gender() then return false end
	if params[5]&2==2 and params[3]~=0 then charaType = Process:Param(params[3]) else charaType = params[3] end
	if charaType == 0 then
		flag = true
	else
		for i,j in ipairs(this:Type()) do
			if j == charaType then flag = true break end
		end
	end
	return flag
end
SetCondLog('OwnerBreakTargetProcess')

-- 特定装備時特定プロセス
-- params[1]:プロセスカテゴリ
-- params[2]:武器装備状況
-- params[3]:武器装備状況(追加条件)
-- params[4]:パラメータタイプ(bit)
function OwnerEquipTargetProcess(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	if params[4]&1==1 and params[2]~=0 then equip1 = Process:Param(params[2]) else equip1 = params[2] end
	if params[4]&2==2 and params[3]~=0 then equip2 = Process:Param(params[3]) else equip2 = params[3] end
	if equip1 ~= 0 and equip1 ~= this:WeaponType() and equip1 ~= this:SubWeaponType() and equip1 ~= this:ArmorType() then return false end
	if equip2 ~= 0 and equip2 ~= this:WeaponType() and equip2 ~= this:SubWeaponType() and equip2 ~= this:ArmorType() then return false end
	if equip1 ~= 0 and equip1 == equip2 and this:WeaponType() ~= this:SubWeaponType() then return false end
	return true
end
SetCondLog('OwnerEquipTargetProcess')

-- 一刀特定装備で特定プロセス
-- params[1]:プロセスカテゴリ
-- params[2]:武器装備状況
-- params[3]:武器装備状況(追加条件)
-- params[4]:パラメータタイプ(bit)
function OwnerSingleWeaponTargetProcess(_target, params)
local equip1, equip2
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	if params[4]&1==1 and params[2]~=0 then equip1 = Process:Param(params[2]) else equip1 = params[2] end
	if params[4]&2==2 and params[3]~=0 then equip2 = Process:Param(params[3]) else equip2 = params[3] end
	if equip1 ~= 0 and equip1 ~= this:WeaponType() and equip1 ~= this:SubWeaponType() and equip1 ~= this:ArmorType() then return false end
	if equip2 ~= 0 and equip2 ~= this:WeaponType() and equip2 ~= this:SubWeaponType() and equip2 ~= this:ArmorType() then return false end
	if equip1 ~= 0 and equip1 == equip2 and this:WeaponType() ~= this:SubWeaponType() then return false end
	return true
end
SetCondLog('OwnerSingleWeaponTargetProcess')

-- 状態異常を付与するプロセスが成立直前かどうか
-- params[1]:敵・味方
function AddAilmentSuccess(_target, params)
	Field:FrameUpdate(_target)
	return IsValidTarget(this, Process:Target(), params[1]) and TrigProc:ProcFlag(PROC_FLAG_AILMENT_SUCCEEDED)
end
SetCondLog('AddAilmentSuccess')

-- -- 特定異常付与成立直前
-- -- params[1]:敵・味方
-- -- params[2]:対象状態異常
-- -- params[3]:パラメータタイプ(bit)
-- function AddValidAilmentSuccess(_target, params)
-- local ailment
-- 	Field:FrameUpdate(_target)
-- 	if not TrigProc:ProcFlag(PROC_FLAG_AILMENT_SUCCEEDED) then return false end
-- 	if params[2]~=0 then
-- 		if params[3]&1==1 then
-- 			ailment = GetProcParamIndex(params[2])
-- 			if ailment[1] ~= 0 and not CompareFromProcParamIndex(ailment, Process, 'TrigAilment') then return false end
-- 		elseif not Process:TrigAilment(params[2]) then
-- 			return false
-- 		end
-- 	end
-- 	return IsValidTarget(this, target, params[1])
-- end
-- SetCondLog('AddValidAilmentSuccess')
-- 
-- -- 両者ステータス比較特定異常付与成立直前
-- -- params[1]:敵・味方
-- -- params[2]:条件方向/比較元ステータス/比較先ステータス
-- -- params[3]:対象状態異常
-- -- params[4]:パラメータタイプ(bit)
-- function BothCompareStatusAddValidAilmentSuccess(_target, params)
-- local prm, ailment
-- 	Field:FrameUpdate(_target)
-- 	if not TrigProc:ProcFlag(PROC_FLAG_AILMENT_SUCCEEDED) then return false end
-- 	if not IsValidTarget(this, target, params[1]) then return false end
-- 	if params[3]~=0 then
-- 		if params[4]&1==1 then
-- 			ailment = GetProcParamIndex(params[3])
-- 			if ailment[1] ~= 0 and not CompareFromProcParamIndex(ailment, Process, 'TrigAilment') then return false end
-- 		elseif not Process:TrigAilment(params[3]) then
-- 			return false
-- 		end
-- 	end
-- 	prm = arrayInit(GetProcParamArray2(params[2], {}, {{0, 1, 2}}), 3, 0)
-- 	if prm[2] == 0 or prm[3] == 0 or not procCompare(prm[1], this:Status(prm[2]), target:Status(prm[3])) then return false end
-- 	return true
-- end
-- SetCondLog('BothCompareStatusAddValidAilmentSuccess')

-- 対非バフカテゴリ状態異常付与成立直前
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:対象状態異常
-- params[4]:パラメータタイプ(bit)
function AddAilmentSuccessNotTargetBuffCategory(_target, params)
local buffCate, ailment
	Field:FrameUpdate(_target)
	if not TrigProc:ProcFlag(PROC_FLAG_AILMENT_SUCCEEDED) then return false end
	if params[3]~=0 then
		if params[4]&2==2 then
			ailment = GetProcParamIndex(params[3])
			if ailment[1] ~= 0 and not CompareFromProcParamIndex(ailment, Process:TrigAilment()) then return false end
		elseif not Process:TrigAilment() == params[3] then
			return false
		end
	end
	if params[4]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	if target:IsBuffCategory(buffCate) then return false end
	return IsValidTarget(this, target, params[1])
end
SetCondLog('AddAilmentSuccessNotTargetBuffCategory')

-- 相手に掛かっていない状態異常を付与するプロセスが成立直前かどうか
-- params[1]:敵・味方
function AddNewAilmentSuccess(_target, params)
	Field:FrameUpdate(_target)
	return IsValidTarget(this, target, params[1]) and TrigProc:ProcFlag(PROC_FLAG_AILMENT_SUCCEEDED) and not target:IsAilment(Process:TrigAilment())
end
SetCondLog('AddNewAilmentSuccess')

-- 対非バフカテゴリ状態新規異常付与成立直前
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:対象状態異常
-- params[4]:パラメータタイプ(bit)
function AddNewAilmentSuccessNotTargetBuffCategory(_target, params)
local buffCate, ailment
	Field:FrameUpdate(_target)
	if not TrigProc:ProcFlag(PROC_FLAG_AILMENT_SUCCEEDED) or target:IsAilment(Process:TrigAilment()) then return false end
	if params[3]~=0 then
		if params[4]&2==2 then
			ailment = GetProcParamIndex(params[3])
			if ailment[1] ~= 0 and not CompareFromProcParamIndex(ailment, Process:TrigAilment()) then return false end
		elseif not Process:TrigAilment() == params[3] then
			return false
		end
	end
	if params[4]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	if target:IsBuffCategory(buffCate) then return false end
	return IsValidTarget(this, target, params[1])
end
SetCondLog('AddNewAilmentSuccessNotTargetBuffCategory')

-- 異常上書き付与成立直前
-- params[1]:敵・味方
-- params[2]:対象状態異常
-- params[3]:付与状態異常
-- params[4]:パラメータタイプ(bit)
function TargetAilmentAddAilmentSuccess(_target, params)
local ailment, ailment2
	Field:FrameUpdate(_target)
	ailment = (params[2]~=0 and params[4]&1==1) and Process:Param(params[2]) or params[2]
	ailment = ailment~=0 and ailment or nil
	ailment2 = (params[3]~=0 and params[4]&2==2) and Process:Param(params[3]) or params[3]
	ailment2 = ailment2~=0 and ailment2 or nil
	if ailment2 == nil then
		return IsValidTarget(this, target, params[1]) and TrigProc:ProcFlag(PROC_FLAG_AILMENT_SUCCEEDED) and target:IsAilment(ailment)
	else
		return IsValidTarget(this, target, params[1]) and TrigProc:ProcFlag(PROC_FLAG_AILMENT_SUCCEEDED) and Process:TrigAilment() == ailment2 and target:IsAilment(ailment)
	end
end
SetCondLog('TargetAilmentAddAilmentSuccess')

-- 特定のバフかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:バフタイプ
-- params[3]:バフカテゴリ
-- params[4]:バフグループ
-- params[5]:パラメータタイプ(bit)
function IsTargetBuff(_target, params)
Field:FrameUpdate(_target)
local buffType, buffCate, buffGroup
local flag = false
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffType = nil else buffType = Process:Param(params[2]) end else buffType = params[2] end
	if params[5]&2==2 then if params[3]==0 then buffCate = nil else buffCate = Process:Param(params[3]) end else buffCate = params[3] end
	if params[5]&4==4 then if params[4]==0 then buffGroup = nil else buffGroup = Process:Param(params[4]) end else buffGroup = params[4] end
	for i, buff in pairs(TrigProc:Buffs()) do
		if buffType == nil or buffType == buff[BUFF_INFO_TYPE] then
			if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
				if buffGroup == nil or buffGroup == buff[BUFF_INFO_GROUP] then
					flag = true
					break
				end
			end
		end
	end
	return flag
end
SetCondLog('IsTargetBuff')

-- スキル_特定バフ
-- params[1]:プロセスカテゴリ
-- params[2]:バフタイプ
-- params[3]:バフカテゴリ
-- params[4]:バフグループ
-- params[5]:パラメータタイプ(bit)
function IsSkillBuff(_target, params)
Field:FrameUpdate(_target)
local buffType, buffCate, buffGroup
local flag = false
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffType = nil else buffType = Process:Param(params[2]) end else buffType = params[2] end
	if params[5]&2==2 then if params[3]==0 then buffCate = nil else buffCate = Process:Param(params[3]) end else buffCate = params[3] end
	if params[5]&4==4 then if params[4]==0 then buffGroup = nil else buffGroup = Process:Param(params[4]) end else buffGroup = params[4] end
	for i, buff in pairs(TrigProc:Buffs()) do
		if buffType == nil or buffType == buff[BUFF_INFO_TYPE] then
			if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
				if buffGroup == nil or buffGroup == buff[BUFF_INFO_GROUP] then
					flag = true
					break
				end
			end
		end
	end
	return flag
end
SetCondLog('IsSkillBuff')

-- 視認可能バフ
-- params[1]:プロセスカテゴリ
function IsVisibleBuff(_target, params)
Field:FrameUpdate(_target)
local buffType, buffCate, buffGroup
local flag = false
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	for i, buff in pairs(TrigProc:Buffs()) do
		if buff[BUFF_INFO_ICON_ID] ~= 0 then flag = true break end
	end
	return flag
end
SetCondLog('IsVisibleBuff')

-- 視認可能バフ
-- params[1]:バフ/デバフ
function AddVisibleBuff(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local buffType, buffCate, buffGroup
local prm, enableBuff, enableDebuff = 0, false, false
local cnt = 0
	if params[1] < 0 then prm = Process:Param(-params[1]) else prm = params[1] end
	if prm == 0 or prm == 1 then enableBuff = true end
	if prm == 0 or prm == 2 then enableDebuff = true end
	for i, buff in pairs(Process:TrigAddBuffs()) do
		if buff[BUFF_INFO_ICON_ID] ~= 0 then
			if (enableBuff and buff[BUFF_INFO_TYPE] % 2 == BUFF_TYPE_BUFF) or (enableDebuff and buff[BUFF_INFO_TYPE] % 2 == BUFF_TYPE_DEBUFF) then
				cnt = cnt + 1
			end
		end
	end
	keepObj:KeepParam(1, cnt)
	return cnt~=0
end
SetCondLog('AddVisibleBuff')

-- 特定の未発動のバフかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:バフタイプ
-- params[3]:バフカテゴリ
-- params[4]:バフグループ
-- params[5]:パラメータタイプ(bit)
function IsTargetBuffNoPossession(_target, params)
Field:FrameUpdate(_target)
local buffType, buffCate, buffGroup
local flag = false
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffType = nil else buffType = Process:Param(params[2]) end else buffType = params[2] end
	if params[5]&2==2 then if params[3]==0 then buffCate = nil else buffCate = Process:Param(params[3]) end else buffCate = params[3] end
	if params[5]&4==4 then if params[4]==0 then buffGroup = nil else buffGroup = Process:Param(params[4]) end else buffGroup = params[4] end
	for i, buff in pairs(TrigProc:Buffs()) do
		if buffType == nil or buffType == buff[BUFF_INFO_TYPE] then
			if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
				if buffGroup == nil or buffGroup == buff[BUFF_INFO_GROUP] then
					if not target:IsBuffCategory(buff[BUFF_INFO_CATEGORY]) then
						flag = true
						break
					end
				end
			end
		end
	end
	return flag
end
SetCondLog('IsTargetBuffNoPossession')

-- 特定の未発動のスキルバフかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:バフタイプ
-- params[3]:バフカテゴリ
-- params[4]:バフグループ
-- params[5]:パラメータタイプ(bit)
function IsSkillBuffNoPossession(_target, params)
Field:FrameUpdate(_target)
local t
local buffType, buffCate, buffGroup
local flag = false
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffType = nil else buffType = Process:Param(params[2]) end else buffType = params[2] end
	if params[5]&2==2 then if params[3]==0 then buffCate = nil else buffCate = Process:Param(params[3]) end else buffCate = params[3] end
	if params[5]&4==4 then if params[4]==0 then buffGroup = nil else buffGroup = Process:Param(params[4]) end else buffGroup = params[4] end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	for i, buff in pairs(TrigProc:Buffs()) do
		if buffType == nil or buffType == buff[BUFF_INFO_TYPE] then
			if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
				if buffGroup == nil or buffGroup == buff[BUFF_INFO_GROUP] then
					if not t:IsBuffCategory(buff[BUFF_INFO_CATEGORY]) then
						flag = true
						break
					end
				end
			end
		end
	end
	return flag
end
SetCondLog('IsSkillBuffNoPossession')

-- 特定のバフかどうか(プロセストリガ系以外)
-- params[1]:バフタイプ
-- params[2]:バフカテゴリ
-- params[3]:バフグループ
-- params[4]:パラメータタイプ(bit)
function IsTargetBuffNoProc(_target, params)
Field:FrameUpdate(_target)
local buffType, buffCate, buffGroup
local flag = false
	if params[4]&1==1 then if params[1]==0 then buffType = nil else buffType = Process:Param(params[1]) end else buffType = params[1] end
	if params[4]&2==2 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	if params[4]&4==4 then if params[3]==0 then buffGroup = nil else buffGroup = Process:Param(params[3]) end else buffGroup = params[3] end
	for i, buff in pairs(Process:TrigBuffs()) do
		if buffType == nil or buffType == buff[BUFF_INFO_TYPE] then
			if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
				if buffGroup == nil or buffGroup == buff[BUFF_INFO_GROUP] then
					flag = true
					break
				end
			end
		end
	end
	return flag
end
SetCondLog('IsTargetBuffNoProc')

-- 特定のバフを所持しているかどうか(プロセストリガ系以外)
-- params[1]:バフタイプ
-- params[2]:バフカテゴリ
-- params[3]:バフグループ
-- params[4]:パラメータタイプ(bit)
function HaveTargetBuffNoProc(_target, params)
Field:FrameUpdate(_target)
local before = Process:GetKeptParam(1) or 0
local buffType, buffCate, buffGroup
local flag = false
	if params[4]&1==1 then if params[1]==0 then buffType = nil else buffType = Process:Param(params[1]) end else buffType = params[1] end
	if params[4]&2==2 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	if params[4]&4==4 then if params[3]==0 then buffGroup = nil else buffGroup = Process:Param(params[3]) end else buffGroup = params[3] end
	for i, buff in pairs(this:GetBuff()) do
		if buffType == nil or buffType == buff[BUFF_INFO_TYPE] then
			if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
				if buffGroup == nil or buffGroup == buff[BUFF_INFO_GROUP] then
					flag = true
					break
				end
			end
		end
	end
	Process:KeepParam(1, flag and 1 or 0)
	Process:KeepParam(2, before)
	return flag
end
SetCondLog('HaveTargetBuffNoProc')

-- 非特定バフ効果中_汎用
-- params[1]:バフタイプ
-- params[2]:バフカテゴリ
-- params[3]:バフグループ
-- params[4]:パラメータタイプ(bit)
function NotHaveTargetBuffNoProc(_target, params)
Field:FrameUpdate(_target)
local before = Process:GetKeptParam(1) or 0
local buffType, buffCate, buffGroup
local flag = true
	if params[4]&1==1 then if params[1]==0 then buffType = nil else buffType = Process:Param(params[1]) end else buffType = params[1] end
	if params[4]&2==2 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	if params[4]&4==4 then if params[3]==0 then buffGroup = nil else buffGroup = Process:Param(params[3]) end else buffGroup = params[3] end
	for i, buff in pairs(this:GetBuff()) do
		if buffType == nil or buffType == buff[BUFF_INFO_TYPE] then
			if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
				if buffGroup == nil or buffGroup == buff[BUFF_INFO_GROUP] then
					flag = false
					break
				end
			end
		end
	end
	Process:KeepParam(1, flag and 1 or 0)
	Process:KeepParam(2, before)
	return flag
end
SetCondLog('NotHaveTargetBuffNoProc')

-- 特定IDバフ効果中_汎用
-- params[1]:バフID
-- params[2]:パラメータタイプ(bit)
function HaveTargetIdBuffNoProc(_target, params)
Field:FrameUpdate(_target)
local before = Process:GetKeptParam(1) or 0
local buffId
local flag = false
	if params[2]&1==1 then if params[1]==0 then buffId = nil else buffId = Process:Param(params[1]) end else buffId = params[1] end
	for i, buff in pairs(this:GetBuff()) do
		if buffId == nil or buffId == buff[BUFF_INFO_ID] then
			flag = true
			break
		end
	end
	Process:KeepParam(1, flag and 1 or 0)
	Process:KeepParam(2, before)
	return flag
end
SetCondLog('HaveTargetIdBuffNoProc')

-- 指定カテゴリバフ終了時
-- params[1]:バフカテゴリ
-- params[2]:パラメータタイプ(bit)
function EndBuffIsTargetBuffCategory(_target, params)
local buffCate
local flag = false
	Field:FrameUpdate(_target)
	if params[2]&1==1 then if params[1]==0 then buffCate = nil else buffCate = Process:Param(params[1]) end else buffCate = params[1] end
	if #(this:GetBuffCategoryBuffs(buffCate)) ~= 0 then return false end
	for i, buff in pairs(Process:TrigBuffs()) do
		if buff[BUFF_INFO_CATEGORY] == buffCate then
			flag = true
			break
		end
	end
	return flag
end
SetCondLog('EndBuffIsTargetBuffCategory')

-- 指定UIDバフ終了時(バフ変動時トリガ前提)
-- params[1]:バフUID_INDEX
function TrigBuffIsTargetUID(_target, params)
local flag = false
	Field:FrameUpdate(_target)
	if Field:IsBuffExists(Process:Param(params[1])) then return false end
	-- if Field:GetBuffInfo(Process:Param(params[1])) ~= nil then return false end
	for i, buff in pairs(Process:TrigBuffs()) do
		if buff[BUFF_INFO_UID] == Process:Param(params[1]) then
			flag = true
			break
		end
	end
	return flag
end
SetCondLog('TrigBuffIsTargetUID')

-- 特定の条件を満たすスキルのプロセスかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:敵・味方
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:スキルロール
function IsValidSkillProcess(_target, params)
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
	-- if this:ID() ~= Bullet:Parent():ID() then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[2]) and (params[3]==0 or params[3]==Bullet:Element()) and (params[4]==0 or Bullet:SKL_Type(params[4])) and (params[5]==0 or Bullet:SKL_Role(params[5]))
end
SetCondLog('IsValidSkillProcess')

-- 特定スキル種別のスキルのプロセスかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:敵・味方
-- params[3]:スキル種別
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsValidSkillKindProcess(_target, params)
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Kind', true)) then return false end elseif not Bullet:SKL_Kind(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[2])
end
SetCondLog('IsValidSkillKindProcess')

-- 特定スキル_味方対象プロセス
-- params[1]:プロセスカテゴリ
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillAllyTargetProcess(_target, params)
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_ALLY)
end
SetCondLog('IsValidSkillAllyTargetProcess')

-- 特定のバフを持つスキルのプロセスかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:バフタイプ
-- params[3]:バフカテゴリ
-- params[4]:バフグループ
-- params[5]:パラメータタイプ(bit)
function IsSkillBuffProcess(_target, params)
Field:FrameUpdate(_target)
local buffType, buffCate, buffGroup
local flag = false
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffType = nil else buffType = Process:Param(params[2]) end else buffType = params[2] end
	if params[5]&2==2 then if params[3]==0 then buffCate = nil else buffCate = Process:Param(params[3]) end else buffCate = params[3] end
	if params[5]&4==4 then if params[4]==0 then buffGroup = nil else buffGroup = Process:Param(params[4]) end else buffGroup = params[4] end
	for i, buff in pairs(TrigProc:Buffs()) do
		if buffType == nil or buffType == buff[BUFF_INFO_TYPE] then
			if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
				if buffGroup == nil or buffGroup == buff[BUFF_INFO_GROUP] then
					flag = true
					break
				end
			end
		end
	end
	return flag
end
SetCondLog('IsSkillBuffProcess')

-- スキル_敵起因特定バフプロセス
-- params[1]:プロセスカテゴリ
-- params[2]:バフタイプ
-- params[3]:バフカテゴリ
-- params[4]:バフグループ
-- params[5]:パラメータタイプ(bit)
function IsEnemySkillBuffProcess(_target, params)
Field:FrameUpdate(_target)
local buffType, buffCate, buffGroup
local flag = false
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
	if not IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT) then return false end
	if params[5]&1==1 then if params[2]==0 then buffType = nil else buffType = Process:Param(params[2]) end else buffType = params[2] end
	if params[5]&2==2 then if params[3]==0 then buffCate = nil else buffCate = Process:Param(params[3]) end else buffCate = params[3] end
	if params[5]&4==4 then if params[4]==0 then buffGroup = nil else buffGroup = Process:Param(params[4]) end else buffGroup = params[4] end
	for i, buff in pairs(TrigProc:Buffs()) do
		if buffType == nil or buffType == buff[BUFF_INFO_TYPE] then
			if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
				if buffGroup == nil or buffGroup == buff[BUFF_INFO_GROUP] then
					flag = true
					break
				end
			end
		end
	end
	return flag
end
SetCondLog('IsEnemySkillBuffProcess')

-- 特定の条件を満たす自分のスキルの状態異常付与プロセスかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:敵・味方
-- params[3]:状態異常
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function IsAilmentSkillProcess(_target, params)
local ailment
	Field:FrameUpdate(_target)
	if params[1] ~= PROCESS_CATEGORY_AILMENT then return false end
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
	-- if this:ID() ~= Bullet:Parent():ID() then return false end
	for i,j in ipairs(TrigProc:Behav()) do
		if j == PARAM_BEHAV_COND_KIND_1 then ailment = TrigProc:Param(i) break end
	end
	if params[5]&1==1 then if not (params[3]==0 or Process:Param(params[3])==0 or Process:Param(params[3])==ailment) then return false end elseif params[3]~=ailment then return false end
	if params[5]&2==2 then if not (params[4]==0 or Bullet:SKL_Type(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[2])
end
SetCondLog('IsAilmentSkillProcess')

-- 特定特技_特定バフプロセス
-- params[1]:プロセスカテゴリ
-- params[2]:バフカテゴリ
-- params[3]:特技INDEX
-- params[4]:属性
-- params[5]:パラメータタイプ(bit)
function IsSkillUIIndexBuffProcess(_target, params)
Field:FrameUpdate(_target)
local skl,buffCate
local flag = false
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
	if not Bullet:SKL_Type(SKILL_SKILL) then return false end
	skl = Bullet:GetParentSkill()
	if skl==nil or not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl:IndexUI())) then return false end
	if params[5]&2==2 and params[4]>=0 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[4]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	for i, buff in pairs(TrigProc:Buffs()) do
		if buffCate == nil or buffCate == buff[BUFF_INFO_CATEGORY] then
			flag = true
			break
		end
	end
	return flag
end
SetCondLog('IsSkillUIIndexBuffProcess')

-- 自分のスキルのプロセスで両者性別条件を満たしているかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:敵・味方
-- params[3]:自分の性別
-- params[4]:相手の性別
-- params[5]:パラメータタイプ(bit)
function OwnerWGenderSkillProcess(_target, params)
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
	-- if this:ID() ~= Bullet:Parent():ID() then return false end
	if params[5]&1==1 then if not (params[3]==0 or Process:Param(params[3])==this:Gender()) then return false end elseif params[3]~=this:Gender() then return false end
	if params[5]&2==2 then if not (params[4]==0 or Process:Param(params[4])==Bullet:Target():Gender()) then return false end elseif params[4]~=Bullet:Target():Gender() then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[2])
end
SetCondLog('OwnerWGenderSkillProcess')

-- 特定の条件を満たすバレット情報有りのプロセスかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:敵・味方
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:スキルロール
function IsValidBulletProcess(_target, params)
	Field:FrameUpdate(_target)
	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_ALL, params[1]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[2]) and (params[3]==0 or params[3]==Bullet:Element()) and (params[4]==0 or Bullet:SKL_Type(params[4])) and (params[5]==0 or Bullet:SKL_Role(params[5]))
end
SetCondLog('IsValidBulletProcess')

-- 敵バレット起因特定プロセス
-- params[1]:プロセスカテゴリ
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsEnemyBulletProcess(_target, params)
	Field:FrameUpdate(_target)
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('IsEnemyBulletProcess')

-- 指定アクターバレット起因特定プロセス
-- params[1]:プロセスカテゴリ
-- params[2]:アクターUID_INDEX
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetActorBulletProcess(_target, params)
local flag, uid
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	uid = Bullet:Parent():ID()
	flag = false
	for i,index in pairs(GetProcParamIndex(params[2])) do
		if index ~= 0 and Process:Param(index) == uid then
			flag = true
			break
		end
	end
	if not flag then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return true
end
SetCondLog('IsTargetActorBulletProcess')

-- 指定アクターバレット起因特定プロセス対象バフカテゴリ状態
-- params[1]:プロセスカテゴリ
-- params[2]:アクターUID_INDEX
-- params[3]:バフカテゴリ
-- params[4]:スキルタイプ or スキルタイプ_INDEX/敵・味方/属性_INDEX/スキルロール_INDEX
-- params[5]:パラメータタイプ(bit)
function IsTargetActorBulletProcessAndTargetBuffCategory(_target, params)
local flag, uid, buffCate, prm
	Field:FrameUpdate(_target)
	uid = Bullet:Parent():ID()
	flag = false
	for i,index in pairs(GetProcParamIndex(params[2])) do
		if index ~= 0 and Process:Param(index) == uid then
			flag = true
			break
		end
	end
	if not flag then return false end
	if params[5]&2==2 then
		if params[4]~=0 then
			prm = GetProcParamArray2(params[4], {[3] = ELEMENT_UNMENTIONED}, {[2] = {TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}, [4] = {SKILL_ROLE_ATTACK, SKILL_ROLE_HEAL, SKILL_ROLE_BUFF}}, 4)
	 		if not (IsValidTarget(Bullet:Parent(), Bullet:Target(), prm[2]) and Bullet:Element(prm[3]) and Bullet:SKL_Type(prm[1]) and Bullet:SKL_Role(prm[4])) then return false end
	 	end
	 elseif not Bullet:SKL_Type(params[4]) then
	 	return false
	 end
	if params[5]&1==1 then if params[3]==0 then buffCate = nil else buffCate = Process:Param(params[3]) end else buffCate = params[3] end
	return Bullet:Parent():IsBuffCategory(buffCate)
end
SetCondLog('IsTargetActorBulletProcessAndTargetBuffCategory')

-- キラースキル起因で発生したプロセス(パッシブ含む)かどうか
-- params[1]:プロセスカテゴリ
-- params[2]:敵・味方
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function KillerBulletProcess(_target, params)
local res = false
	Field:FrameUpdate(_target)
	-- if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
	-- if this:ID() ~= Bullet:Parent():ID() then return false end
	for i,j in pairs(Bullet:Target():Type()) do
		res = Bullet:IsKiller(j) or res
	end
	if not res then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[2])
end
SetCondLog('KillerBulletProcess')

-- 自分がモンスター側
function OwnerMonster(_target, params)
local pcv
	Field:FrameUpdate(_target)
	-- 召喚モンスターーのみ「ステータス計算時」トリガが複数発火してしまう可能性がある問題を応急処置(AW_QA-25664)
	if myTrigger == TriggerTypes.Status then
		if Field:Time()~=0 then return false end
		pcv = this:GetProcCondValue()
		if pcv then return false end
		this:SetProcCondValue(true, true)
	end
	return this:IsMonster()
end
SetCondLog('OwnerMonster')

-- 特定の条件を満たす相手のスキルのプロセスかどうか
-- params[1]:プロセスカテゴリ
-- params[2]:敵・味方
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:スキルロール
-- function IsTargetSkillProcess(_target, params)
-- 	Field:FrameUpdate(_target)
-- 	if not ProcessCategoryCheck(PROCESS_TRIGTYPE_SKILL, params[1]) then return false end
-- 	if this:ID() ~= Bullet:Target():ID() then return false end
-- 	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[2]) and (params[3]==0 or params[3]==Bullet:Element()) and (params[4]==0 or params[4]==Bullet:SKL_Type() or (params[4]==SKILL_PHYSIC and SKILL_CATEGORY_PHYSIC[Bullet:SKL_Type()])) and (params[5]==0 or params[5]==Bullet:SKL_Role())
-- end
-- SetCondLog('IsTargetSkillProcess')

-- 特定の条件を満たす相手のパッシブスキルのプロセスかどうか
-- function IsTargetPassiveProcess(_target, params)
-- 	Field:FrameUpdate(_target)
-- 	return false
-- end
-- SetCondLog('IsTargetPassiveProcess')

-- ステータス比較
-- params[1]:敵・味方
-- params[2]:比較元ステータス
-- params[3]:比較先ステータス
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function OwnerCompareStatus(_target, params)
local status1,status2
	Field:FrameUpdate(_target)
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	status1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	status2 = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if procCompare(1, this:Status(status2), this:Status(status1)) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerCompareStatus')

-- 両者ステータス比較攻撃スキル
-- params[1]:敵・味方
-- params[2]:条件方向/比較元ステータス/比較先ステータス
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function BothCompareStatusAttackSkill(_target, params)
local prm
local t,status1,status2
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 and params[3]>=0 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	prm = GetProcParamIndex(params[2])
	prm[1], prm[2], prm[3] = prm[1] or 0, prm[2] or 0, prm[3] or 0
	if prm[1] > 0 and prm[1] <= 10 then prm[1] = Process:Param(prm[1]) else prm[1] = prm[1] - 11 end
	status1, status2 = Process:Param(prm[2]), Process:Param(prm[3])
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if not procCompare(prm[1], this:Status(status1), t:Status(status2)) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('BothCompareStatusAttackSkill')

-- 対敵両者ステータス比較攻撃スキル
-- params[1]:条件方向INDEX
-- params[2]:比較元ステータス
-- params[3]:比較先ステータス
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function BothCompareStatusAttackSkillEnemy(_target, params)
local t,status1,status2
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	status1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	status2 = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if not procCompare(Process:Param(params[1]), this:Status(status1), t:Status(status2)) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('BothCompareStatusAttackSkillEnemy')

-- 対特定敵タイプ敵両者ステータス比較攻撃スキル
-- params[1]:条件方向INDEX
-- params[2]:比較元ステータス
-- params[3]:比較先ステータス
-- params[4]:エネミータイプ
-- params[5]:パラメータタイプ(bit)
function BothCompareStatusAttackSkillTargetEnemyType(_target, params)
local boss
local t,status1,status2
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	status1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	status2 = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	-- 召喚魔法は対象外
	if t:Gender() == GENDER_DUMMY then return false end
	boss = t:IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&4==4 then if not (params[4]==0 or Process:Param(params[4])==boss) then return false end elseif (params[4]==0 and ENEMY_TYPE_NORMAL or params[4])~=boss then return false end
	if not procCompare(Process:Param(params[1]), this:Status(status1), t:Status(status2)) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), TARGET_SIDE_OPPONENT)
end
SetCondLog('BothCompareStatusAttackSkillTargetEnemyType')

-- ステータスが対象より高い
-- params[1]:敵・味方
-- params[2]:比較元ステータス
-- params[3]:比較先ステータス
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function OwnerStatusIsOverTargetStatus(_target, params)
local t,status1,status2
	Field:FrameUpdate(_target)
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[4]) then return false end
	status1 = (params[5]&1==1 and params[2]~=0) and Process:Param(params[2]) or params[2]
	status2 = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if this:Status(status1) <= t:Status(status2) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerStatusIsOverTargetStatus')

-- 攻撃スキル自分属性耐性指定値間
-- params[1]:敵・味方
-- params[2]:属性条件
-- params[3]:スキルタイプ条件
-- params[4]:属性耐性MIN-MAX INDEX(bit)
-- params[5]:パラメータタイプ(bit)
function OwnerElementResistBetweenAttackSkill(_target, params)
local elmrst
local prm = {}
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[4] > 16 then
		prm[1] = Process:Param(params[4]&15)
		prm[2] = Process:Param((params[4]&240)>>4)
		prm[3] = Process:Param((params[4]&3840)>>8)
		elmrst = this:ElemResist(prm[3]>0 and prm[3] or Bullet:Element())
		if prm[1] <= prm[2] then
			if elmrst < prm[1] or elmrst > prm[2] then return false end
		elseif prm[1] - prm[2] == 1 then
			if elmrst >= prm[1] then return false end
		else
			if elmrst < prm[1] then return false end
		end
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerElementResistBetweenAttackSkill')

-- 攻撃スキル対象属性耐性指定値間
-- params[1]:敵・味方
-- params[2]:属性条件
-- params[3]:スキルタイプ条件
-- params[4]:属性耐性MIN-MAX INDEX(bit)
-- params[5]:パラメータタイプ(bit)
function TargetElementResistBetweenAttackSkill(_target, params)
local elmrst
local prm = {}
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[4] > 16 then
		prm[1] = Process:Param(params[4]&15)
		prm[2] = Process:Param((params[4]&240)>>4)
		prm[3] = Process:Param((params[4]&3840)>>8)
		elmrst = Bullet:Target():ElemResist(prm[3]>0 and prm[3] or Bullet:Element())
		if prm[1] <= prm[2] then
			if elmrst < prm[1] or elmrst > prm[2] then return false end
		elseif prm[1] - prm[2] == 1 then
			if elmrst >= prm[1] then return false end
		else
			if elmrst < prm[1] then return false end
		end
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetElementResistBetweenAttackSkill')

-- 攻撃スキル自分純粋属性耐性指定値間
-- params[1]:敵・味方
-- params[2]:属性条件
-- params[3]:スキルタイプ条件
-- params[4]:純粋属性耐性MIN-MAX INDEX(bit)
-- params[5]:パラメータタイプ(bit)
function OwnerPureElementResistBetweenAttackSkill(_target, params)
local prm, elmrst
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	if params[4] > 16 then
		prm = GetProcParamArray2(params[4], nil, nil, 3)
		elmrst = this:PureElemResist(prm[3]>0 and prm[3] or Bullet:Element())
		if prm[1] <= prm[2] then
			if elmrst < prm[1] or elmrst > prm[2] then return false end
		elseif prm[1] - prm[2] == 1 then
			if elmrst >= prm[1] then return false end
		else
			if elmrst < prm[1] then return false end
		end
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('OwnerPureElementResistBetweenAttackSkill')

-- 攻撃スキル対象純粋属性耐性指定値間
-- params[1]:敵・味方
-- params[2]:属性条件
-- params[3]:スキルタイプ条件
-- params[4]:純粋属性耐性MIN-MAX INDEX(bit)
-- params[5]:パラメータタイプ(bit)
function TargetPureElementResistBetweenAttackSkill(_target, params)
local t, prm, elmrst
	Field:FrameUpdate(_target)
	if not Bullet:SKL_Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	t = this:ID()==Bullet:Parent():ID() and Bullet:Target() or Bullet:Parent()
	if params[4] > 16 then
		prm = GetProcParamArray2(params[4], nil, nil, 3)
		elmrst = t:PureElemResist(prm[3]>0 and prm[3] or Bullet:Element())
		if prm[1] <= prm[2] then
			if elmrst < prm[1] or elmrst > prm[2] then return false end
		elseif prm[1] - prm[2] == 1 then
			if elmrst >= prm[1] then return false end
		else
			if elmrst < prm[1] then return false end
		end
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('TargetPureElementResistBetweenAttackSkill')

-- 二属性比較
-- params[1]:敵・味方
-- params[2]:発動属性
-- params[3]:比較属性
-- params[4]:スキルタイプ
-- params[5]:スキルロール
function CompareElement(_target, params)
	Field:FrameUpdate(_target)
	if Process:Param(params[2])~=Bullet:Element() then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and (params[4]==0 or Bullet:SKL_Type(params[4])) and (params[5]==0 or Bullet:SKL_Role(params[5])) and (Bullet:Target():ElemResist(Process:Param(params[2])) > Bullet:Target():ElemResist(Process:Param(params[3])))
end
SetCondLog('CompareElement')

-- 特定属性変化
-- params[1]:敵・味方
-- params[2]:元属性
-- params[3]:変化後属性
-- params[4]:スキルタイプ
-- params[5]:スキルロール
function IsElementChange(_target, params)
Field:FrameUpdate(_target)
	local skl = Bullet:GetParentSkill()
	if skl==nil then return false end
	if not (params[2]==0 or Process:Param(params[2])==skl:Element()) then return false end
	if not (params[3]==0 or Process:Param(params[3])==Bullet:Element()) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1]) and (params[4]==0 or Bullet:SKL_Type(params[4])) and (params[5]==0 or Bullet:SKL_Role(params[5]))
end
SetCondLog('IsElementChange')

-- 指定した量のゼルを所持且つ特定の条件を満たすスキルかどうか
-- params[1]:敵・味方
-- params[2]:ゼル条件
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsMillionaire(_target, params)
	Field:FrameUpdate(_target)
	if Process:Param(params[2])>0 and Process:Param(params[2])>Field:Zel() then return false end
	if params[5]&4==4 then if not (params[4]==0 or Bullet:SKL_Role(Process:Param(params[4]))) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or Bullet:SKL_Type(Process:Param(params[3]))) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), params[1])
end
SetCondLog('IsMillionaire')

-- 特定の地形のWAVEかどうか
-- params[1]:地形タイプ
function IsTargetTerrain(_target, params)
	Field:FrameUpdate(_target)
	if Process:Param(params[1])==0 then
		return true
	else
		return Process:Param(params[1])==Field:BgTerrain()
	end
end
SetCondLog('IsTargetTerrain')

-- 特定の地形効果を持つWAVEかどうか
-- params[1]:地形効果タイプ
function IsTargetTerrainEffect(_target, params)
	Field:FrameUpdate(_target)
	if Process:Param(params[1])==0 then
		return Field:Terrain()~=0
	else
		return Process:Param(params[1])==Field:Terrain()
	end
end
SetCondLog('IsTargetTerrainEffect')

-- 特定の地形効果を持つWAVEかどうか(第二パラメータver)
-- params[1]:インターバル
-- params[2]:地形効果タイプ
function IsTargetTerrainEffect2(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local isFirst = keepObj:GetKeptParam(1) or 0
	if isFirst == 0 then
		keepObj:KeepParam(1, 1)
		return false
	end
	if Process:Param(params[2])==0 then
		return Field:Terrain()~=0
	else
		return Process:Param(params[2])==Field:Terrain()
	end
end
SetCondLog('IsTargetTerrainEffect2')

-- 特定の条件を満たすスキルを発動したかどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidSkill(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_MAIN then return false end
	skl = this:ActSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidSkill')

-- 特定装備で特定の条件を満たすスキルを発動したかどうか
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidSkillWithTargetEquip(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_MAIN then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==this:WeaponType() or Process:Param(params[2])==this:SubWeaponType() or Process:Param(params[2])==this:ArmorType()) then return false end elseif not (params[2]==this:WeaponType() or params[2]==this:SubWeaponType() or params[2]==this:ArmorType()) then return false end
	skl = this:ActSkill()
	if params[5]&4==4 then if not (params[4]==0 or skl:Role(Process:Param(params[4]))) then return false end elseif not skl:Role(params[4]) then return false end
	sklType = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if sklType~=0 then if not skl:Type(sklType) then return false end end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidSkillWithTargetEquip')

-- 自分バフカテゴリ状態特定スキル発動時
-- params[1]:敵・味方
-- params[2]:バフカテゴリ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidSkillOwnerBuffCategory(_target, params)
local skl, sklType, buffCate
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_MAIN then return false end
	skl = this:ActSkill()
	if skl==nil then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	if params[5]&1==1 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	if not this:IsBuffCategory(buffCate) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidSkillOwnerBuffCategory')

-- 指定INDEXの特技かどうか
-- params[1]:敵・味方
-- params[2]:特技INDEX_INDEX
-- params[3]:属性
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetUIIndexSkill(_target, params)
local t, skl
	Field:FrameUpdate(_target)
	if not Bullet:TargetSide(params[1]) then return false end
	skl = Bullet:GetParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) or (params[2]~=0 and Process:Param(params[2])~=0 and Process:Param(params[2])~=skl:IndexUI()) then return false end
	if params[5]&2==2 then t = GetProcParamIndex(params[4]) if not (t[1]==0 or Process:Param(t[1])==0 or Bullet:SKL_Role(t, CS_COMPARE_PARAM)) then return false end elseif not Bullet:SKL_Role(params[4], CS_COMPARE_DIRECT) then return false end
	if params[5]&1==1 and params[3]>=0 then if not Bullet:Element(GetProcParamArray(params[3]), CS_COMPARE_DIRECT) then return false end elseif not Bullet:Element(params[3], CS_COMPARE_DIRECT) then return false end
	return true
end
SetCondLog('IsTargetUIIndexSkill')

-- 自分特技ストック条件地上特定スキル
-- params[1]:敵味方/特技INDEX/条件方向/特技ストック閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsValidSkillGroundOwnerStockCond(_target, params)
local prm, skl, cnt, mcnt
	Field:FrameUpdate(_target)
	if Bullet:Target():PosY()~=0 then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), Bullet, 'Element', true)) then return false end elseif not Bullet:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), Bullet, 'SKL_Role')) then return false end elseif not Bullet:SKL_Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), Bullet, 'SKL_Type')) then return false end elseif not Bullet:SKL_Type(params[3]) then return false end
	prm = GetProcParamArray2(params[1], {[3] = -1}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}, {1, 2, 3}, {0, 1, 2}}, 4)
	if prm[3] == -1 then
		if prm[4] >= 0 then
			prm[3] = 1
		else
			prm[3] = 0
			prm[4] = -prm[4]
		end
	end
	cnt, mcnt = 0, 0
	if prm[2] == 0 then
		for i = 1, this:SkillCount(SKILL_SKILL) do
			cnt = cnt + this:SKL_Stock(i)
			if prm[4] < 0 then mcnt = mcnt + this:SKL_MaxStock(i) end
		end
	else
		skl = this:GetSkillFromIndexUI(prm[2])
		if skl ~= nil then cnt = skl:Stock() if prm[4] < 0 then mcnt = mcnt + skl:MaxStock() end end
	end
	if prm[4] >= 0 then
		if not procCompare(prm[3], cnt, prm[4]) then return false end
	else
		if not procCompare(prm[3], cnt / mcnt / Per2Num, -prm[4]) then return false end
	end
	return IsValidTarget(Bullet:Parent(), Bullet:Target(), prm[1])
end
SetCondLog('IsValidSkillGroundOwnerStockCond')

-- ストック最大の特技かどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルロール
-- params[4]:パラメータタイプ(bit)
function IsMaxStockSkill(_target, params)
local skl
	Field:FrameUpdate(_target)
	skl = Bullet:GetParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) or Bullet:SKL_BeforeCost()~=skl:MaxStock() then return false end
	if params[4]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif not skl:Element(params[2]) then return false end
	if params[4]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Role')) then return false end elseif not skl:Role(params[3]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('IsMaxStockSkill')

-- 特定の条件を満たすスキルの発動前かどうか
-- params[1]:敵・味方/オプション/発動者敵・味方/オプション
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidSkillBefore(_target, params)
local skl, prm
	Field:FrameUpdate(_target)
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif not skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	if params[5]&8==8 then prm = GetProcParamArray2(params[1], {}, {[1] = {TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}, [2] = {1}, [3] = {TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}, [4] = {1}}, 4) else prm = {params[1], 0, 0, 0} end
	return (prm[1]==0 or prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()) and (prm[2]==0 or TimeLine:Target():ID() ~= this:ID()) and (prm[3]==0 or IsValidTarget(this, TimeLine:Parent(), prm[3])) and (prm[4]==0 or TimeLine:Parent():ID() ~= this:ID())
end
SetCondLog('ActValidSkillBefore')

-- 特定の条件を満たす自分のスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBefore(_target, params)
local skl, sklType, targetSide
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	if params[5]&8==8 and params[1]~=0 then targetSide = Process:Param(params[1]) else targetSide = params[1] end
	return targetSide==0 or targetSide==TARGET_SIDE_ALL or targetSide==skl:Target()
end
SetCondLog('ActValidOwnerSkillBefore')

-- 特定の条件且つ特定のスキルロールを厳密に満たす自分のスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillRoleBefore(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl:Element(), nil, true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or skl:Role()==Process:Param(params[4])) then return false end elseif skl:Role()~=params[4] then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillRoleBefore')

-- 自分特定規模スキル発動前
-- params[1]:敵・味方
-- params[2]:スキル規模
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillScaleBefore(_target, params)
local skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if not skl:Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl:Scale())) then return false end elseif params[2]~=skl:Scale() then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Element', true)) then return false end elseif not skl:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Type')) then return false end elseif not skl:Type(params[4]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillScaleBefore')

-- 対特定敵タイプ自分特定スキル発動前
-- params[1]:エネミータイプ条件
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeTargetEnemyType(_target, params)
local skl, sklType, boss
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	boss = TimeLine:Target():IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	if params[5]&1==1 then if not (params[1]==0 or Process:Param(params[1])==boss) then return false end elseif (params[1]==0 and ENEMY_TYPE_NORMAL or params[1])~=boss then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&2==2 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&4==4 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return true
end
SetCondLog('ActValidOwnerSkillBeforeTargetEnemyType')

-- HP条件自分特定スキル発動前
-- params[1]:敵・味方/条件方向/HP閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeOwnerHpCond(_target, params)
local prm, skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}}, 3)
	if not procCompare(prm[2], this:PerHP(), prm[3]) then return false end
	return prm[1]==0 or prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillBeforeOwnerHpCond')

-- MP条件自分特定スキル発動前
-- params[1]:敵・味方/条件方向/MP閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeOwnerMpCond(_target, params)
local prm, skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}}, 3)
	if not procCompare(prm[2], this:PerMP(), prm[3]) then return false end
	return prm[1]==0 or prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillBeforeOwnerMpCond')

-- 人数条件自分特定スキル発動前
-- params[1]:敵・味方（スキル対象）/敵・味方（人数確認の対象）/生死/自身を含むかどうか/条件方向/人数条件
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeActorCountCond(_target, params)
local skl
local ulist,prm,prm2,tcond,opt1
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif not skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME},{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME},{TARGET_COND_ALIVE,TARGET_COND_DEAD,TARGET_COND_BOTH},{0,1},{COMPARE_UNDER,COMPARE_ORMORE,COMPARE_EQUAL}}, 6)
	if prm[1]~=0 and (prm[1]~=TARGET_SIDE_ALL and prm[1]~=skl:Target()) then return false end
	prm2 = GetProcParamIndex(params[1])
	if prm2[3]>0 and prm2[3] <= 10 and prm2[3]==prm2[4] and prm[3]&3==3 then tcond = TARGET_COND_BOTH else tcond = prm[3]&3	end 
	if prm2[4]>0 and prm2[4] <= 10 and prm2[3]~=prm2[4] then opt1 = bitToBoolean(prm[4], 1) and 4 or 0 else opt1 = prm[4] end
	ulist = units:GetCondUnitList(prm[2], tcond, UNIT_COND_NONE + (bitToBoolean(opt1, 3) and UNIT_COND_NOT_ME or 0))
	return (procCompare(prm[5],#ulist,prm[6]))
end
SetCondLog('ActValidOwnerSkillBeforeActorCountCond')

-- 対ヒット数条件自分特定スキル発動前
-- params[1]:敵・味方/条件方向/対象ヒット数閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeTargetHitsCond(_target, params)
local prm, skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}}, 4)
	if not procCompare(prm[2], TimeLine:Target():Hits(), prm[3]) then return false end
	return prm[1]==0 or prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillBeforeTargetHitsCond')

-- プロセスターゲット条件自分特定スキル発動前
-- params[1]:敵味方/ターゲットID/ターゲット条件
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActProcessTargetCondOwnerSkillBefore(_target, params)
local skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}, [3] = {1, 2, 3}}, 3)
	if prm[2] ~= 0 and prm[3] ~= 0 then
		u = this:GetProcessTarget(prm[2])
		if u == nil then return false end
		if u:ID() ~= TimeLine:Target():ID() then
			if prm[3] == SKILL_TARGET_COND_ME then return false elseif prm[3] == SKILL_TARGET_COND_NOT_ONLY_ME and skl:Scale() == SKILL_SCALE_WHOLE then return false end
		elseif prm[3] == SKILL_TARGET_COND_NOT_ONLY_ME or prm[3] == SKILL_TARGET_COND_NOT_ME then return false end
	end
	return prm[1]==0 or prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()
end
SetCondLog('ActProcessTargetCondOwnerSkillBefore')

-- 特定の条件を満たす味方(自分以外)のスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidAllySkillBefore(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() == this:ID() then return false end
	if TimeLine:Parent():RelativeSide(this) ~= TARGET_SIDE_ALLY then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif not skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidAllySkillBefore')

-- 特定の条件を満たす味方(自分含む)のスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerAndAllySkillBefore(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if TimeLine:Parent():RelativeSide(this) ~= TARGET_SIDE_ALLY then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif not skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidOwnerAndAllySkillBefore')

-- 特定の条件を満たす敵のスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidEnemySkillBefore(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if TimeLine:Parent():RelativeSide(this) ~= TARGET_SIDE_OPPONENT then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidEnemySkillBefore')

-- 敵特定規模スキル発動前
-- params[1]:敵・味方
-- params[2]:スキル規模
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function ActValidEnemyAttackSkillScaleBefore(_target, params)
local skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():RelativeSide(this) ~= TARGET_SIDE_OPPONENT then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if not skl:Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl:Scale())) then return false end elseif params[2]~=skl:Scale() then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Element', true)) then return false end elseif not skl:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Type')) then return false end elseif not skl:Type(params[4]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidEnemyAttackSkillScaleBefore')

-- 特定の条件且つ特定のスキルロールを厳密に満たすスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidSkillRoleBefore(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==skl:Element()) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or skl:Role()==Process:Param(params[4])) then return false end elseif skl:Role()~=params[4] then return false end
	sklType = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if sklType~=0 then if not skl:Type(sklType) then return false end end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidSkillRoleBefore')

-- 対象に自分を含む特定の条件を満たすスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function TargetMeValidSkillBefore(_target, params)
local skl, sklTarget, sklType
	Field:FrameUpdate(_target)
	skl, sklTarget = TimeLine:ParentSkill(), TimeLine:Target()
	if skl==nil or sklTarget==nil then return false end
	if skl:Scale()==SKILL_SCALE_SINGLE then
		if sklTarget:ID() ~= this:ID() then return false end
	elseif skl:Scale()==SKILL_SCALE_WHOLE then
		if sklTarget:Side() ~= this:Side() then return false end
	end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==skl:Element()) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or skl:Role(Process:Param(params[4]))) then return false end elseif not skl:Role(params[4]) then return false end
	sklType = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if sklType~=0 then if not skl:Type(sklType) then return false end end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('TargetMeValidSkillBefore')

-- 自分特定スキル種別発動前
-- params[1]:敵・味方
-- params[2]:スキル種別
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillKindBefore(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl:Kind(), nil, true)) then return false end elseif not params[2]~=skl:Kind() then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl:Element(), nil, true)) then return false end elseif params[3]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Type')) then return false end elseif not skl:Type(params[4]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillKindBefore')

-- 自分特定スキル種別攻撃発動前
-- params[1]:敵・味方
-- params[2]:スキル種別
-- params[3]:属性
-- params[4]:スキルタイプ
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerAttackSkillKindBefore(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if not skl:Role(SKILL_ROLE_ATTACK) then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl:Kind(), nil, true)) then return false end elseif not params[2]~=skl:Kind() then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Element', true)) then return false end elseif params[3]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Type')) then return false end elseif not skl:Type(params[4]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidOwnerAttackSkillKindBefore')

-- 重複可否条件自分特定スキル発動前
-- params[1]:敵・味方
-- params[2]:スキル種別
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillMultiCastBefore(_target, params)
local skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if not (params[2]==0 or Process:Param(params[2])==skl:MultiCast()) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillMultiCastBefore')

-- 重複可否条件自分魔法発動前
-- params[1]:敵・味方
-- params[2]:スキル重複可否
-- params[3]:属性
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerMagicMultiCastBefore(_target, params)
local skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if not skl:Type(SKILL_MAGIC) then return false end
	if not (params[2]==0 or Process:Param(params[2])==skl:MultiCast()) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Element', true)) then return false end elseif params[3]~=skl:Element() then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidOwnerMagicMultiCastBefore')

-- 重複可否条件魔法発動前
-- params[1]:スキル重複可否
-- params[2]:スキル発動者(敵・味方)
-- params[3]:属性
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidMagicMultiCastBefore(_target, params)
local skl
	Field:FrameUpdate(_target)
	if params[5]&1==1 then if not (params[2]==0 or this:RelativeSide(TimeLine:Parent(), Process:Param(params[2]))) then return false end elseif not this:RelativeSide(TimeLine:Parent(), params[2]) then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if not skl:Type(SKILL_MAGIC) then return false end
	if not (params[1]==0 or Process:Param(params[1])==skl:MultiCast()) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Element', true)) then return false end elseif params[3]~=skl:Element() then return false end
	return true
end
SetCondLog('ActValidMagicMultiCastBefore')

-- 特定IDのスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:スキルID
-- params[3]:パラメータタイプ(bit)
function ActValidSkillIdBefore(_target, params)
local skl
	Field:FrameUpdate(_target)
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[3]&1==1 then if not (params[2]==0 or Process:Param(params[2])==skl:ID()) then return false end elseif params[2]~=skl:ID() then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidSkillIdBefore')

-- 特定ID召喚スキル発動前
-- params[1]:スキルID
-- params[2]:パラメータタイプ(bit)
function ActValidSummonSkillIdBefore(_target, params)
local skl, smnskl
	Field:FrameUpdate(_target)
	skl, smnskl = TimeLine:ParentSkill(), Field:GetSummonSkill()
	if skl==nil or skl:ID() ~= smnskl:ID() then return false end
	if params[2]&1==1 then if not (params[1]==0 or Process:Param(params[1])==skl:ID()) then return false end elseif params[1]~=skl:ID() then return false end
	return true
end
SetCondLog('ActValidSummonSkillIdBefore')

-- 特定IDの自分のスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:スキルID
-- params[3]:パラメータタイプ(bit)
function ActValidOwnerSkillIdBefore(_target, params)
local skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[3]&1==1 then if not (params[2]==0 or Process:Param(params[2])==skl:ID()) then return false end elseif params[2]~=skl:ID() then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillIdBefore')

-- 特定PUIDの自分のスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:スキルPUID INDEX
function ActValidOwnerSkillPUIDBefore(_target, params)
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	if not (params[2]==0 or Process:Param(params[2])==TimeLine:SKL_PUID()) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==TimeLine:Target():Side()
end
SetCondLog('ActValidOwnerSkillPUIDBefore')

-- 特定PUID以外の自分のスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:スキルPUID INDEX
function ActValidOwnerNotSkillPUIDBefore(_target, params)
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	if not (params[2]==0 or Process:Param(params[2])~=TimeLine:SKL_PUID()) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==TimeLine:Target():Side()
end
SetCondLog('ActValidOwnerNotSkillPUIDBefore')

-- 自分特定特技INDEX発動前
-- params[1]:敵・味方
-- params[2]:特技INDEX_INDEX
-- params[3]:属性
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerUIIndexSkillBefore(_target, params)
local skl, prm
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) then return false end
	if params[2] > 0 then if not CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl:IndexUI()) then return false end elseif params[2] < 0 then if skl:IndexUI() ~= -params[2] then return false end end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Element', true)) then return false end elseif not skl:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidOwnerUIIndexSkillBefore')

-- 自分特定スキル発動前特定汎用数値情報条件
-- params[1]:汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeGeneralCount(_target, params)
local skl, sklType
local prm
local cond, val
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	if params[1] > 290 then
		prm = GetProcParamIndex(params[1])
		cond, val = Process:Param(prm[2]), this:GetGeneralCount(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[1] > 0 and params[1] <= 10 then
		if (this:GetGeneralCount(Process:Param(params[1])) or 0) == 0 then return false end
	elseif params[1] ~= 0 then
		return false
	end
	return true
end
SetCondLog('ActValidOwnerSkillBeforeGeneralCount')

-- ボスWAVEで自分特定スキル発動前特定汎用数値情報条件
-- params[1]:汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function BossWaveActValidOwnerSkillBeforeGeneralCount(_target, params)
local skl, sklType
local prm
local cond, val
	Field:FrameUpdate(_target)
	if not Field:IsBoss() then return false end
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	if params[1] > 290 then
		prm = GetProcParamIndex(params[1])
		cond, val = Process:Param(prm[2]), this:GetGeneralCount(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[1] > 0 and params[1] <= 10 then
		if (this:GetGeneralCount(Process:Param(params[1])) or 0) == 0 then return false end
	elseif params[1] ~= 0 then
		return false
	end
	return true
end
SetCondLog('BossWaveActValidOwnerSkillBeforeGeneralCount')

-- 自分特定特技INDEX発動前特定汎用数値情報条件
-- params[1]:汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[2]:特技INDEX_INDEX
-- params[3]:属性
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerUIIndexSkillBeforeGeneralCount(_target, params)
local skl, sklType
local prm
local cond, val
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) then return false end
	if params[2] > 0 then if not CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl:IndexUI()) then return false end elseif params[2] < 0 then if skl:IndexUI() ~= -params[2] then return false end end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Element', true)) then return false end elseif skl:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[1] > 290 then
		prm = GetProcParamIndex(params[1])
		cond, val = Process:Param(prm[2]), this:GetGeneralCount(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[1] > 0 and params[1] <= 10 then
		if (this:GetGeneralCount(Process:Param(params[1])) or 0) == 0 then return false end
	elseif params[1] ~= 0 then
		return false
	end
	return true
end
SetCondLog('ActValidOwnerUIIndexSkillBeforeGeneralCount')

-- 自分特定スキル発動前スキル発動毎情報条件
-- params[1]:スキル発動毎情報INDEX/条件方向/スキル発動毎情報閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeSkillInfo(_target, params)
local skl, sklType
local prm
local cond, val
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	if params[1] > 290 then
		prm = GetProcParamIndex(params[1])
		cond, val = Process:Param(prm[2]), TimeLine:SKL_GetValue(Process:Param(prm[1]))
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if cond == 0 and val == 0 then return false end
		if not procCompare(cond, val, Process:Param(prm[3])) then return false end
	elseif params[1] > 0 and params[1] <= 10 then
		if (TimeLine:SKL_GetValue(Process:Param(params[1])) or 0) == 0 then return false end
	elseif params[1] ~= 0 then
		return false
	end
	return true
end
SetCondLog('ActValidOwnerSkillBeforeSkillInfo')

-- 特定の条件を満たす自分のスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:条件方向/個性lvINDEX/個性lv閾値
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforePersonalityLevelCond(_target, params)
local skl, sklType, prm
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm = GetProcParamIndex(params[2])
	if not procCompare(Process:Param(prm[1]), this:PersonalityLevel(Process:Param(prm[2])), Process:Param(prm[3])) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillBeforePersonalityLevelCond')

-- 特定の条件を満たす味方(自分以外)のスキルの発動前かどうか
-- params[1]:敵・味方
-- params[2]:条件方向/個性lvINDEX/個性lv閾値
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidAllySkillBeforePersonalityLevelCond(_target, params)
local skl, sklType, prm
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() == this:ID() then return false end
	if TimeLine:Parent():RelativeSide(this) ~= TARGET_SIDE_ALLY then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm = GetProcParamIndex(params[2])
	if not procCompare(Process:Param(prm[1]), this:PersonalityLevel(Process:Param(prm[2])), Process:Param(prm[3])) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidAllySkillBeforePersonalityLevelCond')

-- 自分バフ状態自分特定スキル発動前
-- params[1]:敵・味方/バフカテゴリ/バフID
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeOwnerBuffCond(_target, params)
local prm1, skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm1 = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}}, 3)
	if prm1[2] < 0 and prm1[2] == prm1[3] then prm1[3] = -prm1[3] end
	if (prm1[2] > 0 and not this:IsBuffCategory(prm1[2])) or (prm1[3] > 0 and not this:IsBuff(prm1[3])) or ((prm1[2]==0 and prm1[3]==0) and this:VisibleBuffCount()==0) then return false end
	return prm1[1]==TARGET_SIDE_ALL or prm1[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillBeforeOwnerBuffCond')

-- 自分非バフ状態自分特定スキル発動前
-- params[1]:敵・味方/バフカテゴリ/バフID
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeNotOwnerBuffCond(_target, params)
local prm1, skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm1 = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}}, 3)
	if prm1[2] < 0 and prm1[2] == prm1[3] then prm1[3] = -prm1[3] end
	if (prm1[2] > 0 and this:IsBuffCategory(prm1[2])) or (prm1[3] > 0 and this:IsBuff(prm1[3])) or ((prm1[2]==0 and prm1[3]==0) and this:VisibleBuffCount()~=0) then return false end
	return prm1[1]==TARGET_SIDE_ALL or prm1[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillBeforeNotOwnerBuffCond')

-- 自分バフ状態自分特定スキル発動前特定汎用数値情報条件
-- params[1]:敵・味方/バフカテゴリ/バフID/汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeGeneralCountOwnerBuffCond(_target, params)
local prm, skl, val,prm2
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm,prm2 = GetProcParamArray2(params[1], {[5] = -1}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME},[5] = {0,1,2}}, 6)
	if prm[4] > 0 then
		val = this:GetGeneralCount(prm[4]) or 0
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if prm[5] == 0 and val == 0 then return false end
		if prm[5] == -1 then
			if prm[6] < 0 and val == 0 then return false end
			if prm[6] == 0 then prm[5], prm[6] = 1, 1 end
		end
		if not procCompare(prm[5], val, prm[6]) then return false end
	end
	if prm[2] == prm[3] and prm2[2] == prm2[3] then prm[3] = -prm[3] end
	if (prm[2] > 0 and not this:IsBuffCategory(prm[2])) or (prm[3] > 0 and not this:IsBuff(prm[3])) or ((prm[2]==0 and prm[3]==0) and this:VisibleBuffCount()==0) then return false end
	return prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillBeforeGeneralCountOwnerBuffCond')

-- 自分非バフ状態自分特定スキル発動前特定汎用数値情報条件
-- params[1]:敵・味方/バフカテゴリ/バフID/汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeGeneralCountNotOwnerBuffCond(_target, params)
local prm, skl, val,prm2
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm,prm2 = GetProcParamArray2(params[1], {[5] = -1}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME},[5] = {0,1,2}}, 6)
	if prm[4] > 0 then
		val = this:GetGeneralCount(prm[4]) or 0
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if prm[5] == 0 and val == 0 then return false end
		if prm[5] == -1 then
			if prm[6] < 0 and val == 0 then return false end
			if prm[6] == 0 then prm[5], prm[6] = 1, 1 end
		end
		if not procCompare(prm[5], val, prm[6]) then return false end
	end
	if prm[2] == prm[3] and prm2[2] == prm2[3] then prm[3] = -prm[3] end
	if (prm[2] > 0 and this:IsBuffCategory(prm[2])) or (prm[3] > 0 and this:IsBuff(prm[3])) or ((prm[2]==0 and prm[3]==0) and this:VisibleBuffCount()~=0) then return false end
	return prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillBeforeGeneralCountNotOwnerBuffCond')

-- 対象バフ状態自分特定スキル発動前特定汎用数値情報条件
-- params[1]:敵・味方/バフカテゴリ/バフID/汎用数値情報INDEX/条件方向/汎用数値情報閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeGeneralCountTargetBuffCond(_target, params)
local prm, skl, val,prm2
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm,prm2 = GetProcParamArray2(params[1], {[5] = -1}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME},[5] = {0,1,2}}, 6)
	if prm[4] > 0 then
		val = this:GetGeneralCount(prm[4]) or 0
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if prm[5] == 0 and val == 0 then return false end
		if prm[5] == -1 then
			if prm[6] < 0 and val == 0 then return false end
			if prm[6] == 0 then prm[5], prm[6] = 1, 1 end
		end
		if not procCompare(prm[5], val, prm[6]) then return false end
	end
	if prm[2] == prm[3] and prm2[2] == prm2[3] then prm[3] = -prm[3] end
	if (prm[2] > 0 and not TimeLine:Target():IsBuffCategory(prm[2])) or (prm[3] > 0 and not TimeLine:Target():IsBuff(prm[3])) or ((prm[2]==0 and prm[3]==0) and TimeLine:Target():VisibleBuffCount()==0) then return false end
	return prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillBeforeGeneralCountTargetBuffCond')

-- 自分バフカテゴリ状態敵対象自分特定スキル発動前
-- params[1]:バフカテゴリ
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeOwnerBuffCategory(_target, params)
local skl, sklType, buffCate
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&2==2 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&4==4 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	if params[5]&1==1 then if params[1]==0 then buffCate = nil else buffCate = Process:Param(params[1]) end else buffCate = params[1] end
	if not this:IsBuffCategory(buffCate) then return false end
	return true
end
SetCondLog('ActValidOwnerSkillBeforeOwnerBuffCategory')

-- 自分非バフカテゴリ状態自分特定スキル発動前
-- params[1]:バフカテゴリ
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeNotOwnerBuffCategory(_target, params)
local skl, sklType, buffCate
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&2==2 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&4==4 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	if params[5]&1==1 then if params[1]==0 then buffCate = nil else buffCate = Process:Param(params[1]) end else buffCate = params[1] end
	if this:IsBuffCategory(buffCate) then return false end
	return true
end
SetCondLog('ActValidOwnerSkillBeforeNotOwnerBuffCategory')

-- 自分バフカテゴリ状態敵対象自分特定スキル発動前
-- params[1]:バフカテゴリ
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillBeforeToEnemyOwnerBuffCategory(_target, params)
local skl, sklType, buffCate
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&2==2 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&4==4 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	if params[5]&1==1 then if params[1]==0 then buffCate = nil else buffCate = Process:Param(params[1]) end else buffCate = params[1] end
	if not this:IsBuffCategory(buffCate) then return false end
	return skl:Target()==TARGET_SIDE_OPPONENT
end
SetCondLog('ActValidOwnerSkillBeforeToEnemyOwnerBuffCategory')

-- 一刀特定装備自分非バフカテゴリ状態自分特定特技INDEX発動前
-- params[1]:装備タイプ
-- params[2]:バフカテゴリ
-- params[3]:特技INDEX_INDEX
-- params[4]:属性
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerUIIndexSkillBeforeTargetSingleWeaponNotOwnerBuffCategory(_target, params)
local skl, buffCate
local equip1, equip2
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	if (this:WeaponType()==0 and this:SubWeaponType()==0) or (this:WeaponType()~=0 and this:SubWeaponType()~=0) then return false end
	equip1 = (params[5]&1==1 and params[1]~=0) and Process:Param(params[1]) or params[1]
	equip2 = this:WeaponType()==0 and this:SubWeaponType() or this:WeaponType()
	if equip1 ~= 0 and equip2 ~= equip1 then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) or (params[3]~=0 and Process:Param(params[3])~=0 and Process:Param(params[3])~=skl:IndexUI()) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Element', true)) then return false end elseif not skl:Element(params[4]) then return false end
	if params[5]&2==2 then if params[2]==0 then buffCate = nil else buffCate = Process:Param(params[2]) end else buffCate = params[2] end
	if this:IsBuffCategory(buffCate) then return false end
	return true
end
SetCondLog('ActValidOwnerUIIndexSkillBeforeTargetSingleWeaponNotOwnerBuffCategory')

-- 自分バフID状態自分特定特技INDEX発動前
-- params[1]:バフID条件
-- params[2]:特技INDEX_INDEX
-- params[3]:属性
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerUIIndexSkillBeforeOwnerBuffId(_target, params)
local skl, buffId
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) or (params[2]~=0 and Process:Param(params[2])~=0 and Process:Param(params[2])~=skl:IndexUI()) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Element', true)) then return false end elseif not skl:Element(params[3]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&1==1 then if params[1]==0 then buffId = nil else buffId = Process:Param(params[1]) end else buffId = params[1] end
	return this:IsBuff(buffId)
end
SetCondLog('ActValidOwnerUIIndexSkillBeforeOwnerBuffId')

-- HP条件自分特定特技INDEX発動前
-- params[1]:敵・味方/条件方向/HP閾値
-- params[2]:特技INDEX_INDEX
-- params[3]:属性
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerUIIndexSkillBeforeOwnerHpCond(_target, params)
local prm, skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) then return false end
	if params[2] > 0 then if not CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl:IndexUI()) then return false end elseif params[2] < 0 then if skl:IndexUI() ~= -params[2] then return false end end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Element', true)) then return false end elseif skl:Element(params[3]) then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end	
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}}, 3)
	if not procCompare(prm[2], this:PerHP(), prm[3]) then return false end
	return prm[1]==0 or prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()
end
SetCondLog('ActValidOwnerUIIndexSkillBeforeOwnerHpCond')

-- 特定の条件を満たすスキルを発動準備(詠唱)したかどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function StandbyValidSkill(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_STANDBY then return false end
	skl = this:ActSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif not skl:Element(params[2]) then return false end
	-- ラドムーンストーンの不具合に局所的に対応
	-- TODO:他の条件でもスキルロールをプロセスパラメータ側で省略できるようにする
	if params[5]&4==4 then if not (params[4]==0 or Process:Param(params[4])==0 or skl:Role(Process:Param(params[4]))) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('StandbyValidSkill')

-- 特定の条件を満たす特定種別のスキルを発動準備(詠唱)したかどうか
-- params[1]:敵・味方
-- params[2]:スキル種別
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function StandbyValidSkillKind(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_STANDBY then return false end
	skl = this:ActSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==skl:Kind()) then return false end elseif params[2]~=skl:Kind() then return false end
	-- ラドムーンストーンの不具合に局所的に対応
	-- TODO:他の条件でもスキルロールをプロセスパラメータ側で省略できるようにする
	if params[5]&4==4 then if not (params[4]==0 or Process:Param(params[4])==0 or skl:Role(Process:Param(params[4]))) then return false end elseif not skl:Role(params[4]) then return false end
	sklType = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if sklType~=0 then if not skl:Type(sklType) then return false end end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('StandbyValidSkillKind')

-- 特定の地形で特定の条件を満たすスキルを発動準備(詠唱)したかどうか
-- params[1]:敵・味方
-- params[2]:地形タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function StandbyValidSkillWithTerrain(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_STANDBY then return false end
	if not (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==Field:BgTerrain()) then return false end
	skl = this:ActSkill()
	if skl==nil then return false end
	if params[5]&2==2 then if not (params[4]==0 or skl:Role(Process:Param(params[4]))) then return false end elseif not skl:Role(params[4]) then return false end
	sklType = (params[5]&1==1 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if sklType~=0 then if not skl:Type(sklType) then return false end end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('StandbyValidSkillWithTerrain')

-- 特定の地形効果のWAVEで特定の条件を満たすスキルを発動準備(詠唱)したかどうか
-- params[1]:敵・味方
-- params[2]:地形効果タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function StandbyValidSkillWithTerrainEffect(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_STANDBY then return false end
	if Field:Terrain()==TERRAIN_NONE then return false end
	if not (params[2]==0 or Process:Param(params[2])==0 or Process:Param(params[2])==Field:Terrain()) then return false end
	skl = this:ActSkill()
	if skl==nil then return false end
	if params[5]&2==2 then if not (params[4]==0 or skl:Role(Process:Param(params[4]))) then return false end elseif not skl:Role(params[4]) then return false end
	sklType = (params[5]&1==1 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if sklType~=0 then if not skl:Type(sklType) then return false end end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('StandbyValidSkillWithTerrainEffect')

-- 特定装備で特定の条件を満たすスキルを発動したかどうか
-- params[1]:敵・味方
-- params[2]:装備タイプ
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function StandbyValidSkillWithTargetEquip(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_STANDBY then return false end
	if params[5]&1==1 then if not (params[2]==0 or Process:Param(params[2])==this:WeaponType() or Process:Param(params[2])==this:SubWeaponType() or Process:Param(params[2])==this:ArmorType()) then return false end elseif not (params[2]==this:WeaponType() or params[2]==this:SubWeaponType() or params[2]==this:ArmorType()) then return false end
	skl = this:ActSkill()
	if skl==nil then return false end
	if params[5]&4==4 then if not (params[4]==0 or skl:Role(Process:Param(params[4]))) then return false end elseif not skl:Role(params[4]) then return false end
	sklType = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if sklType~=0 then if not skl:Type(sklType) then return false end end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('StandbyValidSkillWithTargetEquip')

-- 特定スキルPUID非発動準備時
-- params[1]:敵・味方
-- params[2]:スキルPUID INDEX
function NotStandbySkillPUID(_target, params)
local skl, tl, tgt
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_STANDBY then
		return true
	else
		skl, tgt, puid = this:ActSkill()
		if params[2]~=0 and Process:Param(params[2]) ~= puid then return true end
		return not (params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==tgt:Side())
	end
end
SetCondLog('NotStandbySkillPUID')

-- 特定の条件を満たすスキルのタイムラインがすべて終了したかどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillTimeLine(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	if not TimeLine:IsLast() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or skl:Element(Process:Param(params[2]))) then return false end elseif not skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or skl:Role(Process:Param(params[4]))) then return false end elseif not skl:Role(params[4]) then return false end
	sklType = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if sklType~=0 then if not skl:Type(sklType) then return false end end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillTimeLine')

-- 自分の特定スキルのタイムライン自身HP条件
-- params[1]:敵・味方/条件方向/HP閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillTimeLineOwnerHpCond(_target, params)
local skl, prm
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	if not TimeLine:IsLast() then return false end
	prm = GetProcParamArray2(params[1], {[2] = -1}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}, [2] = {0, 1, 2}}, 3)
	if this:PerHP() < 0 or not procCompare(prm[2], this:PerHP(), prm[3]) then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif not skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return prm[1]==0 or prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillTimeLineOwnerHpCond')

-- 自分の特定規模スキルのタイムライン
-- params[1]:スキル規模
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillScaleTimeLine(_target, params)
local skl
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	if not TimeLine:IsLast() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[1]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[1]), skl:Scale())) then return false end elseif params[1]~=skl:Scale() then return false end
	if params[5]&2==2 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif not skl:Element(params[2]) then return false end
	if params[5]&8==8 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&4==4 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return true
end
SetCondLog('ActValidOwnerSkillScaleTimeLine')

-- 自分の特定規模スキルのタイムライン対象HP条件
-- params[1]:スキル規模/条件方向/HP閾値
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillScaleTimeLineTargetHpCond(_target, params)
local skl, prm
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	if not TimeLine:IsLast() then return false end
	prm = GetProcParamIndex(params[1])
	prm[1], prm[2], prm[3] = prm[1] or 0, prm[2] or 0, prm[3] or 0
	if prm[1] > 0 and prm[1] <= 10 then prm[1] = Process:Param(prm[1]) else if prm[1] == 11 then prm[1] = SKILL_SCALE_SINGLE elseif prm[1] == 12 then prm[1] = SKILL_SCALE_WHOLE else prm[1] = prm[1] - 10 end end
	if prm[2] > 0 and prm[2] <= 10 then prm[2] = Process:Param(prm[2]) elseif prm[2] == 0 then prm[2] = -1 else prm[2] = prm[2] - 11 end
	if TimeLine:Target():PerHP() < 0 or not procCompare(prm[2], TimeLine:Target():PerHP(), Process:Param(prm[3])) then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if prm[1] ~= 0 and prm[1]~=skl:Scale() then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif not skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return true
end
SetCondLog('ActValidOwnerSkillScaleTimeLineTargetHpCond')

-- 自分非バフ状態自分特定スキルタイムライン
-- params[1]:敵・味方/バフカテゴリ/バフID
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillTimeLineNotOwnerBuffCond(_target, params)
local skl, prm
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	if not TimeLine:IsLast() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif not skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}}, 3)
	if prm[2] < 0 and prm[2] == prm[3] then prm[3] = -prm[3] end
	if (prm[2] > 0 and this:IsBuffCategory(prm[2])) or (prm[3] > 0 and this:IsBuff(prm[3])) or ((prm[2]==0 and prm[3]==0) and this:VisibleBuffCount()~=0) then return false end
	return prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()
end
SetCondLog('ActValidOwnerSkillTimeLineNotOwnerBuffCond')

-- 自分非バフ状態自分特定スキルタイムライン指定回数毎
-- params[1]:敵・味方/バフカテゴリ/バフID/回数条件
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillTimeLineCountIntervalNotOwnerBuffCond(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local cnt = keepObj:GetKeptParam(1)
local skl, prm, add
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	if not TimeLine:IsLast() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 and params[2]>=0 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif not skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}}, 4)
	if prm[2] < 0 and prm[2] == prm[3] then prm[3] = -prm[3] end
	if (prm[2] > 0 and this:IsBuffCategory(prm[2])) or (prm[3] > 0 and this:IsBuff(prm[3])) or ((prm[2]==0 and prm[3]==0) and this:VisibleBuffCount()~=0) then return false end
	if prm[1]~=TARGET_SIDE_ALL and prm[1]~=skl:Target() then return false end
	if cnt == nil then cnt, add = 1, 1 else add = 0 end
	if prm[4] > 0 and prm[4] <= cnt then
		keepObj:KeepParam(1, 1)
		return true
	else
		keepObj:KeepParam(1, 1 + add, CALCULATE_ADD)
		return false
	end
end
SetCondLog('ActValidOwnerSkillTimeLineCountIntervalNotOwnerBuffCond')

-- 自分特定汎用情報未付与中自分特定スキルタイムライン
-- params[1]:汎用情報条件
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function ActValidOwnerSkillTimeLineOwnerNotGeneralInfo(_target, params)
local skl, sklType
	Field:FrameUpdate(_target)
	if TimeLine:Parent():ID() ~= this:ID() then return false end
	if not TimeLine:IsLast() then return false end
	skl = TimeLine:ParentSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or skl:Element(Process:Param(params[2]))) then return false end elseif not skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or skl:Role(Process:Param(params[4]))) then return false end elseif not skl:Role(params[4]) then return false end
	sklType = (params[5]&2==2 and params[3]~=0) and Process:Param(params[3]) or params[3]
	if sklType~=0 then if not skl:Type(sklType) then return false end end
	if params[1] ~= 0 and toBoolean(this:GetGeneralInfo(Process:Param(params[1]))) then return false end
	return true
end
SetCondLog('ActValidOwnerSkillTimeLineOwnerNotGeneralInfo')

-- 特定IDのスキルから発生したタイムラインかどうか
-- params[1]:敵・味方
-- params[2]:スキルID
-- params[3]:パラメータタイプ(bit)
function ActValidSkillIdTimeLine(_target, params)
	Field:FrameUpdate(_target)
	if not TimeLine:IsLast() then return false end
	if params[3]&1==1 then if not (params[2]==0 or Process:Param(params[2])==TimeLine:SKL_ID()) then return false end elseif params[2]~=TimeLine:SKL_ID() then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==TimeLine:Target():Side()
end
SetCondLog('ActValidSkillIdTimeLine')

-- 特定PUIDのスキルから発生したタイムラインかどうか
-- params[1]:敵・味方
-- params[2]:スキルPUID INDEX
function ActValidSkillPUIDTimeLine(_target, params)
	Field:FrameUpdate(_target)
	if not TimeLine:IsLast() then return false end
	if not (params[2]==0 or Process:Param(params[2])==TimeLine:SKL_PUID()) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==TimeLine:Target():Side()
end
SetCondLog('ActValidSkillPUIDTimeLine')

-- 自身ターゲット条件特定敵タイプ特定スキル終了時
-- params[1]:敵・味方(発動者)/敵・味方(対象)/エネミータイプ/自分ターゲット条件INDEX
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsTargetCondActValidEnemyTypeSkillTimeLine(_target, params)
local skl, boss, prm
	Field:FrameUpdate(_target)
	if not TimeLine:IsLast() then return false end
	boss = TimeLine:Parent():IsBoss() and ENEMY_TYPE_BOSS or ENEMY_TYPE_NORMAL
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME},{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME},{ENEMY_TYPE_BOSS, ENEMY_TYPE_NORMAL},{SKILL_TARGET_COND_ME, SKILL_TARGET_COND_NOT_ONLY_ME, SKILL_TARGET_COND_NOT_ME, SKILL_TARGET_COND_NOT_ONLY_OTHER}}, 4)
	if TimeLine:Parent():RelativeSide(this) ~= prm[1] then return false end
	if not (prm[3] == 0 or prm[3] == boss) then return false end
	skl = TimeLine:ParentSkill()
	if skl == nil then return false end
	if prm[4] ~= 0 then
		if TimeLine:Target():ID() ~= this:ID() then
			if prm[4] == SKILL_TARGET_COND_ME or (skl:Scale() == SKILL_SCALE_SINGLE and prm[4] == SKILL_TARGET_COND_NOT_ONLY_OTHER) or (skl:Scale() == SKILL_SCALE_WHOLE and prm[4] == SKILL_TARGET_COND_NOT_ONLY_ME) then return false end
		elseif prm[4] == SKILL_TARGET_COND_NOT_ONLY_ME or prm[4] == SKILL_TARGET_COND_NOT_ME then return false end
	end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return prm[2]==0 or prm[2]==TARGET_SIDE_ALL or prm[2]==TimeLine:Target():Side()
end
SetCondLog('IsTargetCondActValidEnemyTypeSkillTimeLine')

-- 待機状態かどうか
function IsIdle(_target, params)
	Field:FrameUpdate(_target)
	return this:State() == STATE_IDLE
end
SetCondLog('IsIdle')

-- 移動中かどうか
-- params[1]:移動タイプ 1:スキル前移動 2:マニュアル移動
function IsMove(_target, params)
	Field:FrameUpdate(_target)
	if (params[1] == 1 and this:State2() ~= STATE_ACCESS) or (params[1] == 2 and this:State2() ~= STATE_OPERATION) then return false end
	return this:State() == STATE_MOVE
end
SetCondLog('IsMove')

-- スキル前移動中かどうか
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsAccess(_target, params)
local skl
	Field:FrameUpdate(_target)
	if this:State2() ~= STATE_ACCESS then return false end
	skl = this:ActSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('IsAccess')

-- スキル前移動中(初回なし)
-- params[1]:敵・味方
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsAccessNotFirst(_target, params)
Field:FrameUpdate(_target)
local skl
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local isFirst = keepObj:GetKeptParam(1) or 0
	if isFirst==0 then
		keepObj:KeepParam(1, 1)
		return false
	end
	if this:State2() ~= STATE_ACCESS then return false end
	skl = this:ActSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif params[2]~=skl:Element() then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('IsAccessNotFirst')

-- スキル前移動中かどうか
-- params[1]:敵味方/ターゲットID/ターゲット条件
-- params[2]:属性
-- params[3]:スキルタイプ
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsProcessTargetCondAccess(_target, params)
local skl, t
	Field:FrameUpdate(_target)
	if this:State2() ~= STATE_ACCESS then return false end
	skl, t = this:ActSkill()
	if skl==nil then return false end
	if params[5]&1==1 then if not (params[2]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[2]), skl, 'Element', true)) then return false end elseif skl:Element(params[2]) then return false end
	if params[5]&4==4 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	if params[5]&2==2 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Type')) then return false end elseif not skl:Type(params[3]) then return false end
	prm = GetProcParamArray2(params[1], {}, {{TARGET_SIDE_OPPONENT, TARGET_SIDE_ALLY, TARGET_SIDE_ME}, [3] = {1, 2, 3}}, 3)
	if prm[2] ~= 0 and prm[3] ~= 0 then
		u = this:GetProcessTarget(prm[2])
		if u == nil then return false end
		if u:ID() ~= t:ID() then
			if prm[3] == SKILL_TARGET_COND_ME then return false elseif prm[3] == SKILL_TARGET_COND_NOT_ONLY_ME and Bullet:SKL_Scale() == SKILL_SCALE_WHOLE then return false end
		elseif prm[3] == SKILL_TARGET_COND_NOT_ONLY_ME or prm[3] == SKILL_TARGET_COND_NOT_ME then return false end
	end
	return prm[1]==0 or prm[1]==TARGET_SIDE_ALL or prm[1]==skl:Target()
end
SetCondLog('IsProcessTargetCondAccess')

-- 特技前移動中かどうか
-- params[1]:敵・味方
-- params[2]:特技INDEX_INDEX
-- params[3]:属性
-- params[4]:スキルロール
-- params[5]:パラメータタイプ(bit)
function IsUIIndexSkillAccess(_target, params)
local skl
	Field:FrameUpdate(_target)
	if this:State2() ~= STATE_ACCESS then return false end
	skl = this:ActSkill()
	if skl==nil or not skl:Type(SKILL_SKILL) or (params[2]~=0 and Process:Param(params[2])~=0 and Process:Param(params[2])~=skl:IndexUI()) then return false end
	if params[5]&1==1 then if not (params[3]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[3]), skl, 'Element', true)) then return false end elseif params[3]~=skl:Element() then return false end
	if params[5]&2==2 then if not (params[4]==0 or CompareFromProcParamIndex(GetProcParamIndex(params[4]), skl, 'Role')) then return false end elseif not skl:Role(params[4]) then return false end
	return params[1]==0 or params[1]==TARGET_SIDE_ALL or params[1]==skl:Target()
end
SetCondLog('IsUIIndexSkillAccess')

-- 待機状態かどうか
function IsDamageState(_target, params)
	Field:FrameUpdate(_target)
	return this:State() == STATE_DAMAGE or this:State() == STATE_DAMAGESKY
end
SetCondLog('IsDamageState')

-- ガード状態かどうか
function IsGuardState(_target, params)
	Field:FrameUpdate(_target)
	return this:State() == STATE_GUARD
end
SetCondLog('IsGuardState')

-- ガードステート中特定汎用数値情報条件
-- params[1]:汎用数値情報INDEX
-- params[2]:条件方向
-- params[3]:汎用数値情報閾値
function IsGuardStateGeneralCount(_target, params)
local prm, val
	Field:FrameUpdate(_target)
	if this:State() ~= STATE_GUARD then return false end
	prm = {params[1]==0 and 0 or Process:Param(params[1]), params[2]==0 and -1 or Process:Param(params[2]), params[3]==0 and 0 or Process:Param(params[3])}
	if prm[1] > 0 then
		val = this:GetGeneralCount(prm[1]) or 0
		-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
		if prm[2] == 0 and val == 0 then return false end
		if prm[2] == -1 then
			if prm[3] < 0 and val == 0 then return false end
			if prm[3] == 0 then prm[2], prm[3] = 1, 1 end
		end
		if not procCompare(prm[2], val, prm[3]) then return false end
	end
	return true
end
SetCondLog('IsGuardStateGeneralCount')

-- ボスWaveかどうか
function IsBossWave(_target, params)
	Field:FrameUpdate(_target)
	return Field:IsBoss()
end
SetCondLog('IsBossWave')

-- ボス以外WAVE
function IsNotBossWave(_target, params)
	Field:FrameUpdate(_target)
	return not Field:IsBoss()
end
SetCondLog('IsNotBossWave')

-- 指定IDのスイッチがON
-- params[1]:スイッチID MIN
-- params[2]:スイッチID MAX
-- params[3]:パラメータタイプ(bit)
function IsSwitchOn(_target, params)
	Field:FrameUpdate(_target)
	return Field:GetSwitchInfo(bitToBoolean(params[3], 1) and Process:Param(params[1]) or params[1], bitToBoolean(params[3], 2) and Process:Param(params[2]) or params[2])
end
SetCondLog('IsSwitchOn')

-- オートバトル状態かどうか
-- params[1]:敵・味方
-- params[2]:セミオートを含む(0) セミオートを含まない(1)
function IsAutoBattle(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1) or 0
local res =  (Field:AutoBattleInfo()==AUTO_BATTLE_ON or (params[2]==0 and Field:AutoBattleInfo()==AUTO_BATTLE_SEMI)) and this:Side()==params[1]
	keepObj:KeepParam(1, res and 1 or 0)
	keepObj:KeepParam(2, before)
	return res
end
SetCondLog('IsAutoBattle')

-- オートバトルでない
-- params[1]:敵・味方
-- params[2]:セミオートを含む(0) セミオートを含まない(1)
function IsNotAutoBattle(_target, params)
Field:FrameUpdate(_target)
-- バフ以外から呼ばれた場合はProcessオブジェクトに値をキープする
local keepObj = next(Buff:Parent()) and Buff or Process
local before = keepObj:GetKeptParam(1) or 0
local res =  (Field:AutoBattleInfo()==AUTO_BATTLE_ON or (params[2]==0 and Field:AutoBattleInfo()==AUTO_BATTLE_SEMI))
	keepObj:KeepParam(1, res and 1 or 0)
	keepObj:KeepParam(2, before)
	return not res and this:Side()==params[1]
end
SetCondLog('IsNotAutoBattle')

-- アリーナ(ギルドバトルも含むPvP条件)
function IsArena(_target, params)
	Field:FrameUpdate(_target)
	return Field:IsPvP()
end
SetCondLog('IsArena')

-- アリーナ(ギルドバトルも含むPvP条件)でない
function IsNotArena(_target, params)
	Field:FrameUpdate(_target)
	return not Field:IsPvP()
end
SetCondLog('IsNotArena')

-- アリーナ(ギルドバトルも含むPvP条件)且つ防衛側かどうか
function IsArenaDefense(_target, params)
	Field:FrameUpdate(_target)
	return Field:IsPvP() and this:Side()==TARGET_SIDE_OPPONENT
end
SetCondLog('IsArenaDefense')

-- ギルドバトル且つ防衛側かどうか
function IsGvGDefense(_target, params)
	Field:FrameUpdate(_target)
	return Field:IsGvG() and this:Side()==TARGET_SIDE_OPPONENT
end
SetCondLog('IsGvGDefense')

-- バトルグラフ
function IsBattleGraph(_target, params)
	Field:FrameUpdate(_target)
	return Field:IsBattleGraph()
end
SetCondLog('IsBattleGraph')

-- 特定の日時かどうか
-- params[1]:条件種別(bit)
-- params[2]:条件1MIN
-- params[3]:条件1MAX
-- params[4]:条件2MIN
-- params[5]:条件2MAX
function SpecificDateAndTime(_target, params)
local res
local _cnt, _bit
local _min, _max
	Field:FrameUpdate(_target)
	res = {Field:OS_Year(), Field:OS_Month(), Field:OS_Day(), Field:OS_Hour(), Field:OS_Minute(), Field:OS_Second(), Field:OS_Weekday()}
	_cnt, _bit = 0, 0
	_min, _max = 2, 3
	while _cnt < 2 and _bit < 7 do
		if params[1]&(2^_bit)==(2^_bit) then
			_min, _max = 2 + (_cnt * 2), 3 + (_cnt * 2)
			if params[_max]==0 then _max = _min end
			if params[_min]~=0 then
				if Process:Param(params[_min]) <= Process:Param(params[_max]) then
					if res[_bit + 1] < Process:Param(params[_min]) or Process:Param(params[_max]) < res[_bit + 1] then return false end
				else
					if Process:Param(params[_max]) < res[_bit + 1] and res[_bit + 1] < Process:Param(params[_min]) then return false end
				end
			end
			_cnt = _cnt + 1
		end
		_bit = _bit + 1
	end
	return true
end
SetCondLog('SpecificDateAndTime')

-- プロセス内発火_不具合対応用
function TriggerInProc(_target, params)
Field:FrameUpdate(_target)
local keepObj = next(Buff:Parent()) and Buff or Process
local cnt = keepObj:GetKeptParam(1) or 0
	keepObj:KeepParam(1, 1)
	return cnt > 0
end
SetCondLog('TriggerInProc')

-- 特定汎用数値情報_プロセス内発火
-- params[1]:トリガ番号INDEX
-- params[2]:汎用数値情報INDEX
-- params[3]:条件方向
-- params[4]:汎用数値情報閾値
function GeneralCountCond_TriggerInProc(_target, params)
local cond, val
	Field:FrameUpdate(_target)
	if params[2] ~= 0 then
		if params[3] ~= 0 and params[4] ~= 0 then
			cond, val = Process:Param(params[3]), this:GetGeneralCount(Process:Param(params[2]))
			-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
			if cond == 0 and val == 0 then return false end
			if not procCompare(cond, val, Process:Param(params[4])) then return false end
		elseif (this:GetGeneralCount(Process:Param(params[2])) or 0) == 0 then
			return false
		end
	else
		return false
	end
	return true
end
SetCondLog('GeneralCountCond_TriggerInProc')

-- 特定キャラタイプ人数変化_プロセス内発火
-- params[1]:トリガタイプ
-- params[2]:敵・味方
-- params[3]:キャラタイプ
-- params[4]:パラメータタイプ(bit)
-- params[5]:オプション 自分を含む(0)/含まない(1) 増加に反応する(0)/しない(2) 減少に反応する(0)/しない(4) 初回発火しない(0)/する(8)
function CharaTypeCountChange_TriggerInProc(_target, params)
Field:FrameUpdate(_target)
local targetSide, charaType, gender
local cnt = 0
local keepObj = next(Buff:Parent()) and Buff or Process
local beforeCnt = keepObj:GetKeptParam(1)
local flag = true
	if params[4]&1==1 and params[2]~=0 then targetSide = Process:Param(params[2]) else targetSide = params[2] end
	if params[4]&2==2 and params[3]~=0 then charaType = Process:Param(params[3]) else charaType = params[3] end
	for i,u in ipairs(units:GetCondUnitList(targetSide, TARGET_COND_ALIVE, UNIT_COND_NONE)) do
		if (not bitToBoolean(params[5], 1)) or u:ID() ~= this:ID() then
			if charaType ~= 0 then
				flag = false
				for i,j in ipairs(u:Type()) do
					if j == charaType then cnt = cnt + 1 break end
				end
			end
		end
	end
	keepObj:KeepParam(1, cnt)
	keepObj:KeepParam(2, (beforeCnt or 0) - cnt)
	if beforeCnt==nil then return bitToBoolean(params[5], 4) end
	return (cnt < beforeCnt and not bitToBoolean(params[5], 3)) or (cnt > beforeCnt and not bitToBoolean(params[5], 2))
end
SetCondLog('CharaTypeCountChange_TriggerInProc')

-- 特定キャラカテゴリ人数変化_プロセス内発火
-- params[1]:トリガタイプ
-- params[2]:敵・味方
-- params[3]:パラメータタイプ(bit)
-- params[4]:キャラタイプINDEX
-- params[5]:オプション 自分を含む(0)/含まない(1) 増加に反応する(0)/しない(2) 減少に反応する(0)/しない(4) 初回発火しない(0)/する(8)
function CharaCategoryCountChange_TriggerInProc(_target, params)
Field:FrameUpdate(_target)
local targetSide, charaCategory, gender
local cnt = 0
local keepObj = next(Buff:Parent()) and Buff or Process
local beforeCnt = keepObj:GetKeptParam(1)
	if params[3]&1==1 and params[2]~=0 then targetSide = Process:Param(params[2]) else targetSide = params[2] end
	if params[4]~=0 then charaCategory = Process:Param(params[4]) else charaCategory = 0 end
	for i,u in ipairs(units:GetCondUnitList(targetSide, TARGET_COND_ALIVE, UNIT_COND_NONE)) do
		if (not bitToBoolean(params[5], 1)) or u:ID() ~= this:ID() then
			if charaCategory ~= 0 then
				for i,j in ipairs(u:Category()) do
					if j == charaCategory then cnt = cnt + 1 break end
				end
			else
				cnt = cnt + 1
			end
		end
	end
	keepObj:KeepParam(1, cnt)
	keepObj:KeepParam(2, (beforeCnt or 0) - cnt)
	if beforeCnt==nil then return bitToBoolean(params[5], 4) end
	return (cnt < beforeCnt and not bitToBoolean(params[5], 3)) or (cnt > beforeCnt and not bitToBoolean(params[5], 2))
end
SetCondLog('CharaCategoryCountChange_TriggerInProc')

-- 特定汎用トリガ発火
-- params[1]:トリガタイプ
-- params[2]:トリガ番号INDEX
function GeneralTriggerInProc(_target, params)
local trig
	Field:FrameUpdate(_target)
	if params[2] > 0 then trig = Process:Param(params[2]) end
	if trig ~= nil and trig ~= Process:GetProcEventValue(PROC_TRIGGER_GENERAL) then return false end
	return true
end
SetCondLog('GeneralTriggerInProc')

-- 特定汎用トリガ発火特定汎用数値情報
-- params[1]:トリガタイプ
-- params[2]:トリガ番号INDEX
-- params[3]:汎用数値情報INDEX
-- params[4]:条件方向
-- params[5]:汎用数値情報閾値
function GeneralTriggerInProcGeneralCountCond(_target, params)
local trig
local cond, val
	Field:FrameUpdate(_target)
	if params[2] > 0 then trig = Process:Param(params[2]) end
	if trig ~= nil and trig ~= Process:GetProcEventValue(PROC_TRIGGER_GENERAL) then return false end
	if params[3] ~= 0 then
		if params[4] ~= 0 and params[5] ~= 0 then
			cond, val = Process:Param(params[4]), this:GetGeneralCount(Process:Param(params[3]))
			-- 0はOFF扱いとするため、「未満」条件には0を含めないようにする
			if cond == 0 and val == 0 then return false end
			if not procCompare(cond, val, Process:Param(params[5])) then return false end
		elseif (this:GetGeneralCount(Process:Param(params[3])) or 0) == 0 then
			return false
		end
	else
		return false
	end
	return true
end
SetCondLog('GeneralTriggerInProcGeneralCountCond')

-- HPブレイク発生回数条件
-- params[1]:トリガタイプ
-- params[2]:条件方向
-- params[3]:汎用数値情報閾値
function HpBreakCountCond(_target, params)
Field:FrameUpdate(_target)
local before = Process:GetKeptParam(1) or 0
local res =  procCompare(Process:Param(params[2]), (Process:GetProcEventValue(PROC_TRIGGER_HP_BREAK) or 1) - 1, Process:Param(params[3]))
	Process:KeepParam(1, res and 1 or 0)
	Process:KeepParam(2, before)
	return res
end
SetCondLog('HpBreakCountCond')

-- 特定UIDバフ内抽選
function LotteryTargetUidBuff(_target, params)
	Field:FrameUpdate(_target)
	return toBoolean(Buff:GetProcValue(Process:Param(params[1])))
end
SetCondLog('LotteryTargetUidBuff')
