import {SOURCES} from './mayly-data.mjs?v=20260926-mayly';
import {commonSkillRules} from './common-skill-rules.mjs?v=20260926-skill-coverage';
const eq=(field,value)=>({field,op:'eq',value});
const inside=(field,value)=>({field,op:'in',value});
const e=(type,target,value,unit='%')=>({type,target,value,unit});
const d=v=>e('damage','伤害',v),cap=v=>e('cap','伤害上限',v,'');
const r=(effects,conditions=[],extra={})=>({effects,conditions,review:'ready',verification:'description',...extra});
const utility=text=>r([e('utility',text,0,'')]);
const pending=note=>r([],[eq('conditionBuffActive',true)],{review:'pending',note});
const phys=[inside('attackKind',['normal','skill']),eq('damageType','physical')];
const offensive=inside('attackKind',['normal','skill','ultimate']);
const bleed=eq('bleeding',true),ailment=eq('ailment',true),buff=eq('conditionBuffActive',true);
const lightDark=inside('element',['light','dark']);
const nogod={field:'enemyRaces',op:'disjoint',value:['god']};
const weapons=['sword','axe','spear','hammer','bow','machine','claw','staff'];
const defs={
 '魔性祝福':[
  r([cap(20000),e('defense','受到异常敌人伤害',-30)],[ailment]),
  ...['light','dark'].map(element=>r([d(30),cap(20000)],[eq('element',element),{field:'weaponSignatures',op:'intersects',value:weapons.map(w=>`${w}:${element}`)}])),
  utility('装备对应属性武器并发动特技时，概率降低目标疾病／暗闇耐性。'),
 ],
 '邪恶症候群':[utility('开场及每20秒降低基本异常耐性；对出血目标追加异常；自身施加的异常及主动减益延长50%；倒下时赋予两种异常。')],
 '圣邪泛滥':[r([e('attackElement','招式属性','dark','')],[inside('attackKind',['skill','ultimate'])])],
 '创伤':[r([e('utility','特技概率赋予疾病',0,'')],[bleed,eq('attackKind','skill')])],
 '生态研究':[utility('普通攻击概率赋予六种基本异常之一。')],
 '偏执狂':[utility('新赋予基本异常时SCT恢复5秒。')],
 '染血斩裂刃':[r([e('defense','受到出血敌人伤害',-30)],[bleed]),utility('受到物理攻击时概率使攻击者出血。')],
 '无限极限驱动':[r([d(30),cap(2000)],[lightDark,...phys]),r([d(30),cap(2000)],[lightDark,eq('attackKind','ultimate')])],
 '艳美血妆':[r([e('recovery','概率吸收伤害回复HP',7)],[bleed,eq('attackKind','skill')])],
 '噩梦三重奏':[
  r([d(36)],[buff,eq('weakness',true)],{note:'按用户规则，条件BUFF开启时采用六次触发后的最大值。'}),
  r([e('damage','暴击伤害',36)],[buff,eq('critical',true)]),
  r([e('damage','特攻伤害',36)],[buff,eq('killer',true)]),
 ],
 '觉醒2':[pending('已知触发后攻击力、防御力、魔抗+65%；与其他同属性Buff的叠加分组未获确认，需用读取器面板或手动属性层核对，不能把65%当作常驻被动。'),utility('濒死时大量回复HP并提升移动速度；每Wave限一次。')],
 '启明星':[
  r([e('critPermission','超必杀技',true,'')],[eq('attackKind','ultimate')]),
  r([d(20),cap(4000)],[eq('enemyLightWeak',true)]),r([d(20),cap(4000)],[eq('enemyDarkWeak',true)]),
 ],
 '斗志提升极':[r([e('stat','攻击力',15),e('stat','HP',15)])],
 '幻惑之翼':[utility('物理伤害概率变为0，成功后概率使攻击者暗闇。')],
 '女神的神徒':[utility('概率回避暴击；特技、超必杀技概率即死，仅限可即死敌人。')],
 '魔神化':[r([e('damage','特攻伤害',30),cap(3000)],[nogod,eq('killer',true)]),r([e('defense','受到非神类型敌人特攻伤害',-35)],[nogod])],
 '绝命一闪':[
  r([e('critRate','暴击率',5),e('defenseReference','敌方防御力',85)],[bleed,...phys]),
  r([e('critRate','暴击率',5),e('defenseReference','敌方防御力',85)],[bleed,eq('attackKind','ultimate')]),
 ],
 '人类破坏者':[r([e('killer','本次目标',true,'')],[offensive,{field:'enemyRaces',op:'intersects',value:['soldier','knight','sniper','sorcerer']}])],
 '超越·特技上限':[
  r([cap(3000)],[eq('attackKind','skill'),inside('weaponCount',[0,1])]),
  r([cap(1500)],[eq('attackKind','skill'),eq('weaponCount',2)]),
 ],
 '超越·超必杀技上限':[r([cap(5000)],[eq('attackKind','ultimate')])],
 '超越·受到伤害减轻':[utility('减伤10%，来源标题和正文的物理／魔法范围互相矛盾；不影响本次攻击伤害，保留原文待核对。')],
 '祟神狂翼·基加罗亚':[
  r([e('equipmentStat','装备HP',500,''),e('equipmentStat','装备攻击力',379,''),e('stat','攻击力',15)]),
  r([d(40),cap(6000)],[ailment]),utility('普通攻击概率出血；物理攻击概率沉默。'),
 ],
 '魔祸咒翼·加基尔斯':[
  r([e('equipmentStat','装备攻击力',361,''),e('equipmentStat','装备魔抗',68,''),e('critRate','暴击率',7)]),
  r([d(35),cap(5000)],[lightDark]),utility('新赋予基本异常时随机一个特技SCT恢复5秒。'),
 ],
};
export const CATALOG=SOURCES.map(source=>({...source,rules:commonSkillRules(source)||(defs[source.name]||[]).map((rule,i)=>({...rule,id:`${source.id}-r${i+1}`,part:i+1,text:source.text}))}));
