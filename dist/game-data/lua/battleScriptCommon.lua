-- バトルスクリプト共通に参照する定数等を記述
----------------------------------------------------------------------------------
-- 									定数定義部									--
----------------------------------------------------------------------------------

-- グローバル変数
-- NumPhases  クエストのフェイズ数
-- NumBattleWaves クエストのバトルウェーブ数

-- フェイズタイプ
PHASE_TYPE_ADV = 1
PHASE_TYPE_BATTLE = 2

-- BattleWaveIn situation
BattleWaveInPreStart = 2100  -- フェーダー開け直後の演出カメラ開始時（フェーダーは明けきっていない）
BattleWaveInPostStart = 2110 -- フェーダー明けた後、BattleStart表示後（操作可能になっている）

-- BattleWaveOut situation
BattleWaveOutLastAttack = 2200  -- いずれかのパーティの最後のユニットが死亡
BattleWaveOutPreFade = 2210    -- プレイヤー勝利、フェードアウト直前

----------------------------------------------------------------------------------
-- 									汎用関数									--
----------------------------------------------------------------------------------

----------------------------
-- WAVE開始時のボス登場演出 --
-- ボスをスキルタイムラインで登場させる
function AppearBoss()
	-- バトルをポーズ
	pause(true)

	-- 開始時の演出対象となるエネミーのユニーク識別子を得る
	local targUnit = GetDemoUnitUID(1, true)

	PrepareDemo(targUnit)
	
	-- 設定を反映するためにいったん待つ
	coroutine.yield()
	
	-- 出現演出
	OpeningDemo(targUnit)
	
	pause(false)
end

-- 開始時の演出対象となるエネミーのユニーク識別子を得る
-- monsterIndex モンスターインデックス ※複製ユニットに対しては使えない
-- isBoss 対象がボスゲージオーナーと分かっている場合は true（falseの場合はモンスターインデックスのみ利用）
function GetDemoUnitUID(monsterIndex, isBoss)
	local targUnit

	-- 対象がボスゲージオーナーである場合
	if isBoss then
		targUnit = UnitGetBossGaugeOwner()
		if targUnit and targUnit ~= 0 then
			return targUnit
		end
		print('ボスゲージオーナー不在')
	end

	-- 対象がボスゲージオーナーではないが、モンスターインデックス（エネミーパーティでの順序）が分かっている場合
	-- ※複製ユニットに対しては使えない（が、WAVE開始前に複製することはない認識）
	local enemyUnits = GetUnits(1, 1)

	if monsterIndex <= 0 or monsterIndex > #enemyUnits then
		error('Invalid monsterIndex ', monsterIndex)
		-- ダミー
		return 101
	end

	targUnit = enemyUnits[monsterIndex]
	print('<color=yellow>エネミー 敵配列[', monsterIndex, ']=',targUnit, '</color>')

	return targUnit
end

function PrepareDemo(unitUid)
	if not unitUid or unitUid == 0 then
		error('ユニーク識別子が無効')
	end
	
	-- UIを非表示
	BattleControl(521, 1, 1)
	
	-- 開始時カメラをスキルモードにする
	BattleControl(521, 21, 3)
	
	-- ボスだけすぐに表示（スキルオーナーはスキル再生前に表示しておく必要があります）
	BattleControl(521, 1000 + 42, 1, unitUid)
	
	-- フェーダーを遅延させたいので保留にする
	BattleControl(521, 11, 0)

	-- スキルで登場させる場合は登場シーンのキャンセル無効（キャンセルしても問題ない場合はコメントアウトしてください）
	BattleControl(521, 1000 + 2, false)
end

function OpeningDemo(unitUid)
	if not unitUid or unitUid == 0 then
		error('ユニーク識別子が無効')
	end

	local skillPuid
	-- ターゲットは操作ユニット（ボスから見て敵）
	local targUid = GetOperationUnit() -- unitUid
	
	-- ボスユニットの表示を待つ
	print('ユニット表示待ち')
	while not UnitControl(unitUid, 10) do
		coroutine.yield()
	end
	
	-- 開始演出のスキル再生
	skillPuid = UnitPlaySkillDirect(unitUid, 21219123, targUid)
	print('スキル開始 ', skillPuid)
	
	coroutine.yield()
	
	-- フェーダーを解除
	BattleControl(521, 1000 + 11, 2)
	
	-- スキルの終了を待つ
	repeat
		wait(1.0)
	until not UnitControl(unitUid, 500, 0, skillPuid)
	
	wait(1.0)
end
