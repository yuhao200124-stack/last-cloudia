// Read-only v0.36 CSV decoder. No DOM, game access, storage, or automatic adoption.
const HEAD = ['event','session','battle','time_ms','state','source_raw','target_raw','panel_atk','panel_int','skill_id','action_id','settlement_atk','settlement_def','base_ratio','final_ratio','base_damage','game_value','log_flags','ck_flags','remain_hp','hp_before','hp_after','address','raw_values','raw_extensions','note'];
const INTEGER = /^(?:0|[1-9]\d*|-[1-9]\d*)$/;
const DECIMAL = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
const integer = s => INTEGER.test(s) && Number.isSafeInteger(Number(s)) ? Number(s) : null;
const number = s => DECIMAL.test(s) && Number.isFinite(Number(s)) ? Number(s) : null;
const unique = xs => [...new Set(xs.filter(x=>x!==null && x!==undefined))];
const counts = xs => [...xs.reduce((m,x)=>m.set(x,(m.get(x)||0)+1),new Map())].map(([value,count])=>({value,count}));

export function parseCsv(text, options={}) {
  const limits={maxChars:25*1024*1024,maxRows:100000,maxColumns:64,maxCellChars:1024*1024,...options};
  if(typeof text!=='string'||text.length>limits.maxChars)throw new Error('CSV文件过大或不是文本');
  if(text.charCodeAt(0)===0xFEFF)text=text.slice(1);
  const rows=[];let row=[],cell='',quoted=false,closed=false;
  const field=()=>{if(row.length>=limits.maxColumns)throw new Error('CSV列数超过限制');row.push(cell);cell='';closed=false;};
  const line=()=>{field();if(row.some(x=>x!=='')){if(rows.length>=limits.maxRows)throw new Error('CSV行数超过限制');rows.push(row);}row=[];};
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;}
    else if(c===',')field();
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;line();}
    else if(c==='"'&&!cell&&!closed)quoted=true;
    else{if(closed||c==='"')throw new Error('CSV引号格式错误');cell+=c;}
    if(cell.length>limits.maxCellChars)throw new Error('CSV单元格超过限制');
  }
  if(quoted)throw new Error('CSV引号未闭合');
  if(cell||closed||row.length)line();
  return rows;
}

export function decodePackedUnit(value) {
  // Native log fields are packed uint16; low four bits are not the identity.
  return Number.isInteger(value)&&value>=0&&value<=65535 ? (value>>>4)&0x3FF : null;
}
function identity(row) {
  const role=row.state;if(!['player','boss'].includes(role))return null;
  const id=integer(role==='player'?row.source_raw:row.target_raw);
  if(id===null)return null;
  const note=row.note||'',name=note.match(/(?:^|;)name=(.*)$/s)?.[1]||'';
  const unitId=integer(note.match(/(?:^|;)log_unit=(-?\d+)(?:;|$)/)?.[1]||'');
  return {id,role,name,unitId,address:row.address,timeMs:row.timeMs};
}
function exactIdentity(identities,id,role) {
  const matches=identities.filter(i=>i.id===id&&(!role||i.role===role));
  const distinct=new Map(matches.map(i=>[`${i.role}:${i.unitId}:${i.name}`,i]));
  return distinct.size===1?[...distinct.values()][0]:null;
}
function readSample(row,identities,issues) {
  const value=integer(row.game_value),sourcePacked=integer(row.source_raw),targetPacked=integer(row.target_raw);
  if(value===null||value<0){issues.push({row:row.rowNumber,message:'伤害记录值无效'});return null;}
  const isLog=row.event==='LOG',sourceId=isLog?decodePackedUnit(sourcePacked):sourcePacked;
  const targetId=isLog?decodePackedUnit(targetPacked):null;
  let remainingHp=integer(row.remain_hp);
  if(isLog){
    const raw=row.raw_values.split('|'),rawRemaining=integer(raw[22]||'');
    if(remainingHp!==null&&rawRemaining!==null&&remainingHp!==rawRemaining){issues.push({row:row.rowNumber,message:'LOG剩余HP列与原始字段冲突，禁止配对'});remainingHp=null;}
    else remainingHp??=rawRemaining;
  }
  const attack=integer(row.settlement_atk),defense=integer(row.settlement_def),baseRatio=number(row.base_ratio),finalRatio=number(row.final_ratio);
  const settlement=attack!==null&&attack>0&&attack<=1e8&&defense!==null&&defense>=0&&defense<=1e8&&baseRatio!==null&&baseRatio>=0&&baseRatio<=1e5&&finalRatio!==null&&finalRatio>=0&&finalRatio<=1e5
    ?{attack,defense,baseRatio,finalRatio,baseDamage:integer(row.base_damage)}:null;
  return {rowNumber:row.rowNumber,event:row.event,timeMs:row.timeMs,state:row.state,sourceId,targetId,
    sourceIdentity:exactIdentity(identities,sourceId,'player'),targetIdentity:isLog?exactIdentity(identities,targetId,'boss'):null,
    workTargetHint:isLog?null:targetPacked,value,remainingHp,panelAttack:integer(row.panel_atk),panelInt:integer(row.panel_int),
    // Only collector-associated LOG skill IDs are accepted, never nearest-time inference.
    logSkillId:isLog?integer(row.skill_id):null,actionId:isLog?integer(row.action_id):null,
    settlement,logFlags:integer(row.log_flags),ckFlags:integer(row.ck_flags),address:row.address,
    rawValues:row.raw_values,rawExtensions:row.raw_extensions,note:row.note,matchedLogRows:[],knownLogSkillIds:[],hpBoundaryTargetIds:[]};
}

function summarizeBattle(rows,key,issues,options) {
  const identities=rows.filter(r=>r.event==='IDENTITY').map(identity).filter(Boolean);
  const hp=[];
  for(const r of rows.filter(r=>r.event==='HP')){
    const before=integer(r.hp_before),after=integer(r.hp_after),value=integer(r.game_value),targetId=integer(r.target_raw);
    if(before===null||after===null||targetId===null||after<0||before<=after||before-after!==value){issues.push({row:r.rowNumber,message:'HP差值记录不一致，未计入合计'});continue;}
    hp.push({rowNumber:r.rowNumber,timeMs:r.timeMs,targetId,before,after,value});
  }
  const samples=rows.filter(r=>r.event==='LOG'||r.event==='CACHE').map(r=>readSample(r,identities,issues)).filter(Boolean);
  const logs=samples.filter(s=>s.event==='LOG'),exactLogs=new Map(),hpEdges=new Map();
  const add=(map,k,v)=>{const a=map.get(k)||[];a.push(v);map.set(k,a);};
  for(const log of logs)if(log.remainingHp!==null&&log.sourceIdentity&&log.targetIdentity)
    add(exactLogs,`${log.sourceId}:${log.value}:${log.remainingHp}`,log);
  for(const h of hp){add(hpEdges,`after:${h.after}`,h);add(hpEdges,`before:${h.before}`,h);}
  for(const s of samples){
    if(s.event==='LOG'&&s.logSkillId!==null)s.knownLogSkillIds=[s.logSkillId];
    if(s.remainingHp===null)continue;
    if(s.event==='CACHE'){
      const matches=(exactLogs.get(`${s.sourceId}:${s.value}:${s.remainingHp}`)||[])
        .filter(l=>Math.abs(l.timeMs-s.timeMs)<=options.exactMatchWindowMs);
      const meanings=unique(matches.map(l=>`${l.targetId}:${l.logSkillId}:${l.actionId}`));
      if(matches.length&&meanings.length===1){s.matchedLogRows=matches.map(l=>l.rowNumber);s.knownLogSkillIds=unique(matches.map(l=>l.logSkillId));s.targetId=matches[0].targetId;s.targetIdentity=matches[0].targetIdentity;}
    }
    // Boundary agreement is target evidence only. It NEVER assigns a skill.
    const boundaries=[...(hpEdges.get(`after:${s.remainingHp}`)||[]),...(hpEdges.get(`before:${s.remainingHp+s.value}`)||[])];
    s.hpBoundaryTargetIds=unique(boundaries.filter(h=>Math.abs(h.timeMs-s.timeMs)<=options.hpBoundaryWindowMs&&h.after<=s.remainingHp&&s.remainingHp+s.value<=h.before).map(h=>h.targetId));
  }
  const grouped=new Map();
  for(const s of samples.filter(s=>s.settlement)){
    const v=s.settlement;
    // Do not split/merge by stale work target; keep every target hint visible.
    const k=JSON.stringify([s.sourceId,v.attack,v.defense,v.baseRatio,v.finalRatio]);
    if(!grouped.has(k))grouped.set(k,[]);grouped.get(k).push(s);
  }
  const settlementGroups=[...grouped.values()].map((ss,index)=>{
    const first=ss[0],verifiedLogSkillIds=unique(ss.flatMap(s=>s.knownLogSkillIds));
    const logTargetIds=unique(ss.map(s=>s.targetId)),boundaryTargetIds=unique(ss.flatMap(s=>s.hpBoundaryTargetIds));
    const directDuplicateKeys=new Set();let duplicateCount=0;
    for(const s of ss){
      // Dedup only directly bound source+target+value+remainingHP, never by ratio or time alone.
      if(s.targetId===null||s.remainingHp===null)continue;
      const d=`${s.sourceId}:${s.targetId}:${s.value}:${s.remainingHp}`;
      if(directDuplicateKeys.has(d))duplicateCount++;else directDuplicateKeys.add(d);
    }
    return {id:`${key}:settlement:${index+1}`,sourceId:first.sourceId,sourceIdentity:first.sourceIdentity,
      attack:first.settlement.attack,defense:first.settlement.defense,baseRatio:first.settlement.baseRatio,finalRatio:first.settlement.finalRatio,
      sampleCount:ss.length,logCount:ss.filter(s=>s.event==='LOG').length,cacheCount:ss.filter(s=>s.event==='CACHE').length,
      exactLogLinkedCacheCount:ss.filter(s=>s.event==='CACHE'&&s.matchedLogRows.length).length,directDuplicateCount:duplicateCount,
      // This is samples after a limited dedupe, NOT a hit count.
      sampledRecordCountAfterDirectDedupe:ss.length-duplicateCount,knownLogSkillIds:verifiedLogSkillIds,
      logTargetIds,hpBoundaryTargetIds:boundaryTargetIds,workTargetHints:unique(ss.map(s=>s.workTargetHint)),
      panelAttackValues:counts(ss.map(s=>s.panelAttack).filter(v=>v!==null)),panelIntValues:counts(ss.map(s=>s.panelInt).filter(v=>v!==null)),
      damageValues:{min:Math.min(...ss.map(s=>s.value)),max:Math.max(...ss.map(s=>s.value))},
      timeRange:[Math.min(...ss.map(s=>s.timeMs)),Math.max(...ss.map(s=>s.timeMs))],rowNumbers:ss.map(s=>s.rowNumber),
      adoption:{requiresExplicitSelection:true,canIdentifyOneSource:!!first.sourceIdentity,canIdentifyOneSkill:verifiedLogSkillIds.length===1&&ss.every(s=>s.knownLogSkillIds.length===1),
        directSettledAttackOnly:true,mustBypassSkillAttackModifiers:true,ratiosAreDiagnosticsOnly:true}};
  });
  const hpTargets=unique(hp.map(h=>h.targetId)).map(targetId=>{
    const rr=hp.filter(h=>h.targetId===targetId).sort((a,b)=>a.timeMs-b.timeMs);
    const continuous=rr.every((h,i)=>i===0||h.before===rr[i-1].after);
    return {targetId,identity:exactIdentity(identities,targetId,'boss'),eventCount:rr.length,totalDecrease:rr.reduce((sum,h)=>sum+h.value,0),
      hpBefore:rr[0].before,hpAfter:rr.at(-1).after,continuous,attributedSkillId:null,attributedSourceId:null};
  });
  return {key,session:rows[0].session,battle:rows[0].battle,eventCounts:counts(rows.map(r=>r.event)),identities,hpTargets,settlementGroups,samples,
    notes:['HP合计属于目标，未自动归属于某个角色或技能。','CACHE工作区目标可能过期；仅显示提示，不作为技能绑定依据。','结算攻击已含技能修正，不可再次乘技能内攻击修正。']};
}

export function parseDamageFormulaCsv(text, supplied={}) {
  const options={exactMatchWindowMs:20,hpBoundaryWindowMs:100,...supplied};
  const csv=parseCsv(text,options);if(!csv.length)throw new Error('CSV为空');
  const header=csv.shift();if(HEAD.some(k=>!header.includes(k))||new Set(header).size!==header.length)throw new Error('不是v0.36 DamageFormulaCapture.csv表头');
  const byBattle=new Map(),issues=[];let repeatedHeaders=0;
  for(let i=0;i<csv.length;i++){
    const fields=csv[i];if(fields.length===header.length&&fields.every((v,j)=>v===header[j])){repeatedHeaders++;continue;}
    if(fields.length!==header.length){issues.push({row:i+2,message:'列数不一致，跳过'});continue;}
    const r=Object.fromEntries(header.map((k,j)=>[k,fields[j]]));r.rowNumber=i+2;r.timeMs=integer(r.time_ms);
    if(!/^\d+$/.test(r.session)||!/^\d+$/.test(r.battle)||r.timeMs===null||r.timeMs<0){issues.push({row:r.rowNumber,message:'会话、战斗或时间字段无效，跳过'});continue;}
    const key=`${r.session}:${r.battle}`;if(!byBattle.has(key))byBattle.set(key,[]);byBattle.get(key).push(r);
  }
  const battles=[...byBattle].map(([key,rows])=>summarizeBattle(rows,key,issues,options));
  return {schema:'last-cloudia-formula-csv-review-v1',battleCount:battles.length,repeatedHeaders,issues,battles};
}
