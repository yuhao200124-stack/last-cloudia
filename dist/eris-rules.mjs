// Source descriptions and IDs preserved from the existing Eris page.
const sources = [
  {
    "id": "259-traits-1",
    "name": "我会保护你",
    "text": "只装备1件武器时，无属性伤害+40%、伤害上限+140,000。战斗开始时及其后每40秒，为战斗开始时法强最高的1名男性队友赋予相当于自身最大HP 200%的伤害无效效果。目标队友存活时，自身受到的伤害-50%。",
    "group": "traits"
  },
  {
    "id": "259-traits-2",
    "name": "你要干什么！",
    "text": "自身濒死，或“我会保护你”指定的队友死亡时，赋予自身激昂Buff和激怒。HP低于80%时，HP越少，受到伤害越低，最多-70%。激昂Buff期间，特技和超必杀技每1,000攻击力伤害+5%、伤害上限+3,000。击败敌人时解除自身全部异常，并恢复随机1个特技1次使用量。“激怒”的具体数值未在来源页注明。",
    "group": "traits"
  },
  {
    "id": "259-exclusive-3",
    "name": "斗志提升极",
    "text": "攻击力、HP+15%",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-4",
    "name": "刚坚提升4",
    "text": "防御力、魔抗+10%",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-5",
    "name": "勇士提升极",
    "text": "攻击力、防御力、HP+15%",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-6",
    "name": "人类破坏者",
    "text": "物理、超必杀技与反击对人类系触发特攻",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-7",
    "name": "自动EX勇气",
    "text": "始终保持EX勇气效果；来源页未给出该状态数值",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-8",
    "name": "无属性攻击提升4",
    "text": "无属性伤害+30%、伤害上限+5,000",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-9",
    "name": "无属性攻击提升5",
    "text": "无属性伤害+30%、伤害上限+10,000",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-10",
    "name": "近身战斗2",
    "text": "对距离最近的敌人物理伤害+25%、上限+5,000",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-11",
    "name": "一天真刃·二之型",
    "text": "只装备1件武器时，物理伤害+30%、物理伤害上限+30,000",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-12",
    "name": "一天真刃之极意",
    "text": "“一天真刃”的效果量+50%；只装备1件武器时，物理暴击有概率使伤害+150%、上限+15,000",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-13",
    "name": "双手剑增幅4",
    "text": "只装备1把剑时，物理与超必杀技伤害+30%、上限+12,000",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-14",
    "name": "服装究极增幅",
    "text": "装备服装时，防御力、魔抗+10%，受到伤害-10%，物理伤害+15%",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-15",
    "name": "沉睡的狮子",
    "text": "濒死时大量恢复HP，攻击力+100%、SCT回复速度+50%、移动速度提升；每Wave限1次",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-16",
    "name": "鲁迪乌斯很厉害的！",
    "text": "战斗开始时，随机1名男性法师队友的魔法攻击伤害+50%，直到其无法战斗",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-17",
    "name": "剑神流",
    "text": "只装备1把剑时，无属性伤害+30%、伤害上限+100,000；发动特技时部分攻击无法打断",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-18",
    "name": "拜托了喵☆",
    "text": "战斗开始时，有概率麻痹全体敌人；来源页实测约28/100次，非保证触发",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-19",
    "name": "Dead End的头巾",
    "text": "已装备饰品的HP、攻击力、防御力+100%；HP归零时满血复活，每Wave限1次",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-20",
    "name": "守护的力量",
    "text": "我方至少2人且全员存活时，自身伤害+50%、受到伤害-50%；激昂Buff期间受到伤害-50%",
    "group": "exclusive"
  },
  {
    "id": "259-exclusive-21",
    "name": "反杀",
    "text": "攻击力+50%；对正在进行物理、魔法或反击动作的敌人伤害+50%；受到特技及反击伤害-35%",
    "group": "exclusive"
  },
  {
    "id": "259-common-22",
    "name": "HP提升2",
    "text": "HP+8%",
    "group": "common"
  },
  {
    "id": "259-common-23",
    "name": "攻击提升极",
    "text": "攻击力+15%",
    "group": "common"
  },
  {
    "id": "259-common-24",
    "name": "要害攻击·改",
    "text": "暴击伤害+50%",
    "group": "common"
  },
  {
    "id": "259-common-25",
    "name": "要害防御",
    "text": "受到暴击伤害-10%",
    "group": "common"
  },
  {
    "id": "259-common-26",
    "name": "骄傲之力",
    "text": "暴击时回复HP",
    "group": "common"
  },
  {
    "id": "259-common-27",
    "name": "魔法生物破坏者",
    "text": "物理、超必杀技及反击对魔法生物系触发特攻",
    "group": "common"
  },
  {
    "id": "259-common-28",
    "name": "特攻增幅",
    "text": "触发特攻时伤害+50%",
    "group": "common"
  },
  {
    "id": "259-common-29",
    "name": "自动加速",
    "text": "始终保持加速效果；来源页未给出具体SCT数值",
    "group": "common"
  },
  {
    "id": "259-common-30",
    "name": "无属性超阶驱动",
    "text": "无属性物理与超必杀技伤害+30%",
    "group": "common"
  },
  {
    "id": "259-common-31",
    "name": "无属性暴击增幅",
    "text": "无属性攻击暴击率+5%、暴击伤害+50%",
    "group": "common"
  },
  {
    "id": "259-common-32",
    "name": "弱肉强食2",
    "text": "对非BOSS敌人的特技伤害+20%",
    "group": "common"
  },
  {
    "id": "259-common-33",
    "name": "王者威装2",
    "text": "受到非BOSS敌人的伤害-15%",
    "group": "common"
  },
  {
    "id": "259-common-34",
    "name": "意识集中",
    "text": "气绝持续时间缩短",
    "group": "common"
  },
  {
    "id": "259-transcend-35",
    "name": "超越·一刀极致",
    "text": "只装备1件武器时，物理上限+60,000",
    "group": "transcend"
  },
  {
    "id": "259-transcend-36",
    "name": "超越·受到伤害减轻",
    "text": "受到伤害-20%",
    "group": "transcend"
  },
  {
    "id": "259-transcend-37",
    "name": "超越·斗志提升",
    "text": "攻击力、HP+20%",
    "group": "transcend"
  },
  {
    "id": "259-transcend-38",
    "name": "超越·剑精通2",
    "text": "装备剑时物理伤害+20%、上限+7,500；只装备1把剑时上限变为+15,000",
    "group": "transcend"
  },
  {
    "id": "259-transcend-39",
    "name": "超越·服装精通2",
    "text": "装备服装时，服装防御力与魔抗+50%、受到伤害-15%",
    "group": "transcend"
  },
  {
    "id": "259-transcend-40",
    "name": "超越·弱肉强食2",
    "text": "对非BOSS敌人的特技伤害+30%",
    "group": "transcend"
  },
  {
    "id": "259-transcend-41",
    "name": "超越·韦驮天",
    "text": "移动速度提升；移动时有概率使所受物理、魔法伤害变为0",
    "group": "transcend"
  },
  {
    "id": "259-equipment-42",
    "name": "艾莉丝之剑",
    "text": "最高属性：HP+500 / 攻击力+311 / 防御力+92；最高效果：单武器物理伤害+35%、上限+7,000；攻击力+15%；自身处于异常状态时物理上限+8,000",
    "group": "equipment"
  },
  {
    "id": "259-equipment-43",
    "name": "艾莉丝的服装",
    "text": "最高属性：HP+1,000 / 攻击力+117 / 防御力+234 / 魔抗+179；最高效果：HP、攻击力+10%；受到物理、魔法攻击伤害-30%；自身存活时，“我会保护你”的目标受到伤害-10%",
    "group": "equipment"
  }
];
const eq=(field,value)=>({field,op:'eq',value});
const inside=(field,value)=>({field,op:'in',value});
const effect=(type,target,value,unit='%')=>({type,target,value,unit});
const damage=(target,value)=>effect('damage',target,value);
const cap=(target,value)=>effect('cap',target,value,'');
const stats=(names,value)=>names.map(name=>effect('stat',name,value));
const neutral=eq('element','none'),single=eq('weaponCount',1),sword=eq('sword',true),physical=inside('attackKind',['normal','skill']),clothes=eq('clothes',true),buff=eq('conditionBuffActive',true);
const rule=(effects,conditions=[],extra={})=>({effects,conditions:conditions.includes(physical)?[...conditions,eq('damageType','physical')]:conditions,review:'ready',verification:'description',...extra});
const pending=(note,conditions=[])=>rule([],conditions,{review:'pending',note});
const utility=text=>rule([effect('utility','其他效果',text,'')]);
sources.push(
 {id:'259-specials-s1',name:'波瑞阿斯拳',text:'对中范围敌人连续攻击；本特技暴击率+20%',group:'specials'},
 {id:'259-specials-ultimate',name:'无声之太刀',text:'【超必杀技】对单体敌人强力连续攻击，伤害上限+300,000',group:'specials'}
);
const defs={
 '波瑞阿斯拳':[rule([effect('critRate','暴击率',20)],[eq('attack','s1')])],
 '无声之太刀':[rule([cap('超必杀技伤害上限',300000)],[eq('attack','ultimate')])],
 '我会保护你':[
  rule([damage('无属性伤害',40),cap('无属性伤害上限',140000)],[single,neutral]),
  utility('战斗开始及每40秒保护指定男性队友；目标存活时自身受到伤害-50%。'),
 ],
 '你要干什么！':[
  pending('激昂期间的每1,000攻击力增伤及上限，需要对应战斗攻击力与该效果的取整规则；使用读取器或手动确认数值。',[buff,inside('attackKind',['skill','ultimate'])]),
  utility('濒死或指定队友倒下时获得激昂和激怒；低HP减伤、击败敌人解除异常并恢复SCT。'),
 ],
 '斗志提升极':[rule(stats(['攻击力','HP'],15))],
 '刚坚提升4':[rule(stats(['防御力','魔抗'],10))],
 '勇士提升极':[rule(stats(['攻击力','防御力','HP'],15))],
 '人类破坏者':[rule([effect('killer','本次目标',true,'')],[inside('attackKind',['normal','skill','ultimate']),{field:'enemyRaces',op:'intersects',value:['soldier','knight','sniper','sorcerer']}])],
 '自动EX勇气':[pending('现有角色资料未记录EX勇气的准确攻击力数值，不能从状态名称补猜。',[eq('openingBuffActive',true)])],
 '无属性攻击提升4':[rule([damage('无属性伤害',30),cap('无属性伤害上限',5000)],[neutral])],
 '无属性攻击提升5':[rule([damage('无属性伤害',30),cap('无属性伤害上限',10000)],[neutral])],
 '近身战斗2':[rule([damage('物理伤害',25),cap('物理伤害上限',5000)],[physical,eq('nearestEnemy',true)])],
 '一天真刃·二之型':[rule([damage('物理伤害',30),cap('物理伤害上限',30000)],[single,physical])],
 '一天真刃之极意':[
  rule([damage('物理伤害',15),cap('物理伤害上限',15000)],[single,physical,eq('erisBladeEquipped',true)]),
  rule([damage('物理暴击伤害',150),cap('物理暴击伤害上限',15000)],[single,physical,buff,eq('critical',true)],{note:'条件BUFF开启时按该概率效果已触发试算，非触发概率平均值。'}),
 ],
 '双手剑增幅4':[rule([damage('伤害',30),cap('伤害上限',12000)],[single,sword,inside('attackKind',['normal','skill','ultimate'])])],
 '服装究极增幅':[rule(stats(['防御力','魔抗'],10),[clothes]),rule([damage('物理伤害',15)],[clothes,physical]),rule([effect('defense','受到伤害',-10)],[clothes])],
 '沉睡的狮子':[
  pending('已知攻击力+100%；该角色状态与其他攻击力Buff的叠加分组尚未记录，按读取器面板或手动属性层确认。',[buff]),
  utility('濒死触发后大量恢复HP，SCT回复速度+50%，移动速度提升；每Wave限1次。'),
 ],
 '鲁迪乌斯很厉害的！':[utility('战斗开始时为随机1名男性法师队友提供魔法伤害+50%，不是艾莉丝自身增伤。')],
 '剑神流':[rule([damage('无属性伤害',30),cap('无属性伤害上限',100000)],[single,sword,neutral]),utility('发动特技时部分攻击无法打断。')],
 '拜托了喵☆':[utility('战斗开始时概率麻痹全体敌人，不计作直接伤害。')],
 'Dead End的头巾':[utility('已装备饰品的HP、攻击力、防御力+100%；需提供饰品固定属性后才能换算面板。HP归零时满血复活，每Wave限1次。')],
 '守护的力量':[rule([damage('伤害',50),effect('defense','受到伤害',-50)],[eq('partyAllAlive',true)]),rule([effect('defense','受到伤害',-50)],[buff])],
 '反杀':[rule(stats(['攻击力'],50)),rule([damage('伤害',50)],[eq('enemyAttacking',true)]),rule([effect('defense','受到特技及反击伤害',-35)])],
 'HP提升2':[rule(stats(['HP'],8))],
 '攻击提升极':[rule(stats(['攻击力'],15))],
 '要害攻击·改':[rule([damage('暴击伤害',50)],[eq('critical',true)])],
 '要害防御':[rule([effect('defense','受到暴击伤害',-10)])],
 '骄傲之力':[rule([effect('recovery','HP','暴击时回复','')],[eq('critical',true)])],
 '魔法生物破坏者':[rule([effect('killer','本次目标',true,'')],[inside('attackKind',['normal','skill','ultimate']),{field:'enemyRaces',op:'intersects',value:['creature']}])],
 '特攻增幅':[rule([effect('killerPower','特攻威力修正',50)],[eq('killer',true)])],
 '自动加速':[utility('始终保持加速效果，SCT数值未记录。')],
 '无属性超阶驱动':[rule([damage('无属性伤害',30)],[neutral,inside('attackKind',['normal','skill','ultimate'])])],
 '无属性暴击增幅':[rule([effect('critRate','暴击率',5)],[neutral]),rule([damage('暴击伤害',50)],[neutral,eq('critical',true)])],
 '弱肉强食2':[rule([damage('特技伤害',20)],[eq('boss',false),eq('attackKind','skill')])],
 '王者威装2':[rule([effect('defense','受到非BOSS伤害',-15)],[eq('boss',false)])],
 '意识集中':[utility('缩短气绝持续时间。')],
 '超越·一刀极致':[rule([cap('物理伤害上限',60000)],[single,physical])],
 '超越·受到伤害减轻':[rule([effect('defense','受到伤害',-20)])],
 '超越·斗志提升':[rule(stats(['攻击力','HP'],20))],
 '超越·剑精通2':[
  rule([damage('物理伤害',20)],[sword,physical]),
  rule([cap('物理伤害上限',15000)],[sword,single,physical]),
  rule([cap('物理伤害上限',7500)],[sword,eq('weaponCount',2),physical]),
 ],
 '超越·服装精通2':[rule([effect('equipmentStat','衣服自身防御力',50),effect('equipmentStat','衣服自身魔抗',50),effect('defense','受到伤害',-15)],[clothes])],
 '超越·弱肉强食2':[rule([damage('特技伤害',30)],[eq('boss',false),eq('attackKind','skill')])],
 '超越·韦驮天':[utility('移动速度提升；移动时有概率使所受物理、魔法伤害为0。')],
 '艾莉丝之剑':[
  rule([effect('equipmentStat','装备HP',500,''),effect('equipmentStat','装备攻击力',311,''),effect('equipmentStat','装备防御力',92,''),...stats(['攻击力'],15)]),
  rule([damage('物理伤害',35),cap('物理伤害上限',7000)],[single,physical]),
  rule([cap('物理伤害上限',8000)],[physical,eq('selfAilment',true)]),
 ],
 '艾莉丝的服装':[
  rule([effect('equipmentStat','装备HP',1000,''),effect('equipmentStat','装备攻击力',117,''),effect('equipmentStat','装备防御力',234,''),effect('equipmentStat','装备魔抗',179,''),...stats(['HP','攻击力'],10)]),
  utility('受到物理和魔法伤害-30%；自身存活时，指定队友受到伤害-10%。'),
 ],
};
export const CATALOG=sources.map(source=>({...source,rules:(defs[source.name]||[pending('尚未完成角色专属规则。')]).map((r,i)=>({...r,id:`${source.id}-r${i+1}`,part:i+1,text:source.text}))}));
export const ERIS_PENDING=CATALOG.flatMap(s=>s.rules.filter(r=>r.review==='pending').map(r=>({sourceId:s.id,name:s.name,note:r.note})));
