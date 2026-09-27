/* Independent migration tools. No game formulas or existing storage formats are changed. */
(() => {
  'use strict';
  const FORMAT='lastcloudia-local-backup', VERSION=1;
  const utf8=new TextEncoder();
  const fail=message=>{throw new Error(message);};
  const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',utf8.encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
  const b64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s);};
  const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const viewNames=new Set(['Int8Array','Uint8Array','Uint8ClampedArray','Int16Array','Uint16Array','Int32Array','Uint32Array','Float32Array','Float64Array','BigInt64Array','BigUint64Array','DataView']);

  // Graph serialization preserves dates, blobs, maps, binary views, undefined,
  // special numbers and shared/circular references. Unknown types stop export.
  async function pack(root){
    const nodes=[],seen=new Map();
    async function visit(v){
      if(v===undefined)return ['undefined'];
      if(typeof v==='number')return ['number',Object.is(v,-0)?'-0':String(v)];
      if(typeof v==='bigint')return ['bigint',String(v)];
      if(v===null||typeof v==='string'||typeof v==='boolean')return ['value',v];
      if(typeof v!=='object')fail('备份中有不支持的数据类型，已停止，未丢弃该数据。');
      if(seen.has(v))return ['ref',seen.get(v)];
      const id=nodes.length;seen.set(v,id);nodes.push(null);
      let node;
      if(Array.isArray(v))node={type:'array',length:v.length,entries:await entries(v)};
      else if(v instanceof Date)node={type:'date',value:String(v.getTime())};
      else if(v instanceof RegExp)node={type:'regexp',source:v.source,flags:v.flags,lastIndex:v.lastIndex};
      else if(v instanceof Map){node={type:'map',entries:[]};for(const [k,x] of v)node.entries.push([await visit(k),await visit(x)]);}
      else if(v instanceof Set){node={type:'set',entries:[]};for(const x of v)node.entries.push(await visit(x));}
      else if(v instanceof ArrayBuffer)node={type:'buffer',data:b64(new Uint8Array(v))};
      else if(ArrayBuffer.isView(v)){if(!viewNames.has(v.constructor.name))fail('未支持的二进制类型');node={type:'view',name:v.constructor.name,buffer:await visit(v.buffer),offset:v.byteOffset,length:v instanceof DataView?v.byteLength:v.length};}
      else if(v instanceof Blob)node={type:v instanceof File?'file':'blob',data:b64(new Uint8Array(await v.arrayBuffer())),mime:v.type,name:v.name,lastModified:v.lastModified};
      else if(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)node={type:'object',nullPrototype:Object.getPrototypeOf(v)===null,entries:await entries(v)};
      else fail(`未支持的备份类型 ${Object.prototype.toString.call(v)}；已停止，未丢弃数据。`);
      nodes[id]=node;return ['ref',id];
    }
    async function entries(v){const out=[];for(const k of Object.keys(v))out.push([k,await visit(v[k])]);return out;}
    const token=await visit(root);return {root:token,nodes};
  }
  function unpack(graph){
    if(!graph||!Array.isArray(graph.nodes)||graph.nodes.length>1000000)fail('备份数据结构无效');
    const result=new Array(graph.nodes.length),ready=new Set();
    function visit(t){
      if(!Array.isArray(t))fail('备份值无效');
      if(t[0]==='undefined')return undefined;
      if(t[0]==='number')return Number(t[1]);
      if(t[0]==='bigint')return BigInt(t[1]);
      if(t[0]==='value'){if(t[1]!==null&&!['string','boolean'].includes(typeof t[1]))fail('备份基本值无效');return t[1];}
      if(t[0]!=='ref'||!Number.isInteger(t[1])||t[1]<0||t[1]>=graph.nodes.length)fail('备份引用无效');
      const id=t[1];if(ready.has(id))return result[id];
      const n=graph.nodes[id];let out;
      switch(n.type){
        case 'array':out=new Array(n.length);break;
        case 'object':out=n.nullPrototype?Object.create(null):{};break;
        case 'date':out=new Date(Number(n.value));break;
        case 'regexp':out=new RegExp(n.source,n.flags);out.lastIndex=n.lastIndex;break;
        case 'map':out=new Map();break;
        case 'set':out=new Set();break;
        case 'buffer':out=unb64(n.data).buffer;break;
        case 'view':if(!viewNames.has(n.name))fail('二进制类型无效');out=new globalThis[n.name](visit(n.buffer),n.offset,n.length);break;
        case 'blob':out=new Blob([unb64(n.data)],{type:n.mime});break;
        case 'file':out=new File([unb64(n.data)],n.name,{type:n.mime,lastModified:n.lastModified});break;
        default:fail('备份节点类型无效');
      }
      result[id]=out;ready.add(id);
      if(n.type==='array'||n.type==='object')for(const [k,v] of n.entries)Object.defineProperty(out,k,{value:visit(v),writable:true,enumerable:true,configurable:true});
      if(n.type==='map')for(const [k,v] of n.entries)out.set(visit(k),visit(v));
      if(n.type==='set')for(const v of n.entries)out.add(visit(v));
      return out;
    }
    return visit(graph.root);
  }
  const readStorage=storage=>Array.from({length:storage.length},(_,i)=>storage.key(i)).sort().map(k=>[k,storage.getItem(k)]);
  function openDatabase(name,version,create){
    return new Promise((resolve,reject)=>{
      const r=version===undefined?indexedDB.open(name):indexedDB.open(name,version);
      let error;
      r.onupgradeneeded=()=>{try{if(create)create(r.result,r.transaction);else {error=new Error('读取期间数据库发生变化，请停止其他页面操作后重试');r.transaction.abort();}}catch(e){error=e;r.transaction.abort();}};
      r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result);};
      r.onerror=()=>reject(error||r.error);
      r.onblocked=()=>reject(new Error('数据库被其他页面占用，请关闭其他本站标签页后重试。'));
    });
  }
  async function readDatabase(info){
    const db=await openDatabase(info.name,info.version);
    try{
      const names=Array.from(db.objectStoreNames).sort();
      if(!names.length)return {name:db.name,version:db.version,stores:[]};
      const stores=await new Promise((resolve,reject)=>{
        const tx=db.transaction(names,'readonly'),out=[];
        tx.oncomplete=()=>resolve(out);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('数据库读取中断'));
        for(const name of names){
          const store=tx.objectStore(name),entry={name,keyPath:store.keyPath,autoIncrement:store.autoIncrement,indexes:Array.from(store.indexNames).sort().map(key=>{const i=store.index(key);return {name:i.name,keyPath:i.keyPath,unique:i.unique,multiEntry:i.multiEntry};}),entries:[]};out.push(entry);
          const request=store.openCursor();request.onsuccess=()=>{const cursor=request.result;if(cursor){entry.entries.push([cursor.key,cursor.value]);cursor.continue();}};
        }
      });
      for(const store of stores){
        if(store.autoIncrement)fail(`数据库 ${db.name}/${store.name} 使用无法直接读取的自动编号计数器。已停止完整迁移，请保留原站并联系维护者。`);
        store.entries=await pack(store.entries);
      }
      return {name:db.name,version:db.version,stores};
    }finally{db.close();}
  }
  async function captureStorage(){
    if(!indexedDB.databases)fail('请使用支持数据库清单的新版 Edge 或 Chrome，不能省略数据库后继续备份。');
    const local=readStorage(localStorage),session=readStorage(sessionStorage);
    const infos=(await indexedDB.databases()).filter(d=>d.name).sort((a,b)=>a.name.localeCompare(b.name));
    const databases=[];for(const info of infos)databases.push(await readDatabase(info));
    if(JSON.stringify(local)!==JSON.stringify(readStorage(localStorage))||JSON.stringify(session)!==JSON.stringify(readStorage(sessionStorage)))fail('备份期间存档改变，请停止其他页面操作后重试。');
    return {localStorage:local,sessionStorage:session,databases};
  }
  function pageEvidence(){
    const pages=[],errors=[];
    function walk(w){
      try{
        if(w.location.origin!==location.origin)return;
        const doc=w.document;
        pages.push({path:w.location.pathname+w.location.search+w.location.hash,title:doc.title,html:doc.documentElement.outerHTML,
          controls:Array.from(doc.querySelectorAll('input,select,textarea')).map((el,index)=>({index,id:el.id,name:el.name,type:el.type,value:el.type==='file'?null:el.value,checked:el.checked,selected:Array.from(el.selectedOptions||[],o=>o.value)})),
          loadout:w.LC_LOADOUT_CALCULATOR?.snapshot?.()||null});
        for(let i=0;i<w.frames.length;i++)walk(w.frames[i]);
      }catch(e){errors.push(String(e));}
    }
    walk(window);
    return {pages,errors,scope:'current_tab_and_same_origin_frames',note:'网页快照用于核对未保存输入；不能执行快照HTML。其他标签页的临时草稿需分别导出，原始读取报告文件应保留。'};
  }
  async function capture({evidence=true}={}){
    const first=await captureStorage(),second=await captureStorage();
    if(JSON.stringify(first)!==JSON.stringify(second))fail('数据库在备份时发生变化，请暂停其他本站页面操作后重试。');
    const payload={...first,pageEvidence:evidence?pageEvidence():null};
    return {format:FORMAT,version:VERSION,createdAt:new Date().toISOString(),sourceOrigin:location.origin,payload,sha256:await digest(JSON.stringify(payload))};
  }
  async function validate(backup){
    if(backup?.format!==FORMAT||backup.version!==VERSION)fail('请选择完整存档备份，不是战斗读取报告。');
    if(await digest(JSON.stringify(backup.payload))!==backup.sha256)fail('备份校验不一致，文件可能不完整或已被改动，未写入任何数据。');
    const p=backup.payload;
    for(const key of ['localStorage','sessionStorage']){
      if(!Array.isArray(p[key]))fail('缺少浏览器存储');
      const names=new Set();for(const pair of p[key]){if(!Array.isArray(pair)||pair.length!==2||pair.some(x=>typeof x!=='string')||names.has(pair[0]))fail('存储键无效或重复');names.add(pair[0]);}
    }
    if(!Array.isArray(p.databases))fail('缺少数据库列表');
    const dbNames=new Set();
    for(const db of p.databases){
      if(typeof db.name!=='string'||!db.name||dbNames.has(db.name)||!Number.isSafeInteger(db.version)||db.version<1||!Array.isArray(db.stores))fail('数据库清单无效');dbNames.add(db.name);
      const storeNames=new Set();
      for(const s of db.stores){
        if(typeof s.name!=='string'||storeNames.has(s.name)||!Array.isArray(s.indexes)||typeof s.autoIncrement!=='boolean')fail('数据表无效');storeNames.add(s.name);
        if(s.autoIncrement)fail('这份备份包含自动编号计数器，不能保证完整恢复，已停止写入。');
        const rows=unpack(s.entries);if(!Array.isArray(rows)||rows.some(r=>!Array.isArray(r)||r.length!==2))fail('数据表内容无效');
        for(let i=1;i<rows.length;i++)if(indexedDB.cmp(rows[i-1][0],rows[i][0])>=0)fail('数据库键重复或顺序无效');
      }
    }
    return backup;
  }
  function summary(b){return {localKeys:b.payload.localStorage.length,sessionKeys:b.payload.sessionStorage.length,databases:b.payload.databases.length,records:b.payload.databases.reduce((n,d)=>n+d.stores.reduce((m,s)=>m+unpack(s.entries).length,0),0),source:b.sourceOrigin,createdAt:b.createdAt};}
  function sameSchema(a,b){return JSON.stringify([a.keyPath,a.autoIncrement,a.indexes])===JSON.stringify([b.keyPath,b.autoIncrement,b.indexes]);}
  async function plan(backup){
    await validate(backup);
    const current=await capture({evidence:false}),conflicts=[];
    for(const key of ['localStorage','sessionStorage']){
      const existing=new Map(current.payload[key]);
      for(const [k,v] of backup.payload[key])if(existing.has(k)&&existing.get(k)!==v)conflicts.push(`${key}: ${k}`);
    }
    for(const d of backup.payload.databases){
      const before=current.payload.databases.find(x=>x.name===d.name);if(!before)continue;
      if(before.version!==d.version)fail(`数据库 ${d.name} 版本不同。已停止，请保留两份备份后联系维护者。`);
      for(const s of d.stores){
        const old=before.stores.find(x=>x.name===s.name);if(!old)fail(`数据库 ${d.name} 的数据表结构不同。已停止，未写入。`);
        if(!sameSchema(old,s))fail(`数据库 ${d.name}/${s.name} 结构不同。已停止，请保留备份后联系维护者。`);
        const original=unpack(old.entries);
        for(const [key,val] of unpack(s.entries)){
          const match=original.find(r=>indexedDB.cmp(r[0],key)===0);
          if(match&&JSON.stringify(await pack(match[1]))!==JSON.stringify(await pack(val)))conflicts.push(`数据库 ${d.name}/${s.name}: ${String(key)}`);
        }
      }
    }
    return {current,conflicts};
  }
  async function ensureDatabase(d){
    const info=(await indexedDB.databases()).find(x=>x.name===d.name);
    let needsUpgrade=!info,version=info?.version||d.version;
    if(info){const before=await readDatabase(info);needsUpgrade=d.stores.some(s=>!before.stores.some(x=>x.name===s.name));if(needsUpgrade)version=Math.max(d.version,info.version+1);}
    return openDatabase(d.name,version,(db)=>{
      for(const s of d.stores)if(!db.objectStoreNames.contains(s.name)){
        const store=db.createObjectStore(s.name,{keyPath:s.keyPath,autoIncrement:s.autoIncrement});
        for(const i of s.indexes)store.createIndex(i.name,i.keyPath,{unique:i.unique,multiEntry:i.multiEntry});
      }
    });
  }
  async function putDatabase(d){
    const decoded=d.stores.map(s=>({...s,rows:unpack(s.entries)}));
    const db=await ensureDatabase(d);
    try{
      if(!decoded.length)return;
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(decoded.map(s=>s.name),'readwrite');
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('数据库写入中断'));
        try{for(const s of decoded){const store=tx.objectStore(s.name);for(const [key,v] of s.rows)store.keyPath===null?store.put(v,key):store.put(v);}}
        catch(e){tx.abort();reject(e);}
      });
    }finally{db.close();}
  }
  async function verifyApplied(backup){
    const actual=await capture({evidence:false});
    for(const key of ['localStorage','sessionStorage']){
      const map=new Map(actual.payload[key]);for(const [k,v] of backup.payload[key])if(map.get(k)!==v)fail(`恢复后校验失败：${key}/${k}`);
    }
    for(const d of backup.payload.databases)for(const s of d.stores){
      const a=actual.payload.databases.find(x=>x.name===d.name)?.stores.find(x=>x.name===s.name);
      if(!a||!sameSchema(a,s))fail(`恢复后结构校验失败：${d.name}/${s.name}`);
      const rows=unpack(a.entries);for(const [k,v] of unpack(s.entries)){
        const r=rows.find(x=>indexedDB.cmp(x[0],k)===0);
        if(!r||JSON.stringify(await pack(r[1]))!==JSON.stringify(await pack(v)))fail(`恢复后记录校验失败：${d.name}/${s.name}`);
      }
    }
    return summary(backup);
  }
  async function rollback(before,incoming){
    for(const key of ['localStorage','sessionStorage']){
      const storage=window[key],old=new Map(before.payload[key]);
      for(const [k] of incoming.payload[key])storage.removeItem(k);
      for(const [k] of incoming.payload[key])if(old.has(k))storage.setItem(k,old.get(k));
    }
    for(const d of incoming.payload.databases){
      const info=(await indexedDB.databases()).find(x=>x.name===d.name);if(!info)continue;
      const db=await openDatabase(d.name,info.version);
      try{
        const stores=d.stores.filter(s=>db.objectStoreNames.contains(s.name));if(!stores.length)continue;
        await new Promise((resolve,reject)=>{
          const tx=db.transaction(stores.map(s=>s.name),'readwrite');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('回退中断'));
          try{for(const s of stores){
            const old=before.payload.databases.find(x=>x.name===d.name)?.stores.find(x=>x.name===s.name),rows=old?unpack(old.entries):[],store=tx.objectStore(s.name);
            for(const [k] of unpack(s.entries)){const match=rows.find(r=>indexedDB.cmp(r[0],k)===0);if(match){store.keyPath===null?store.put(match[1],k):store.put(match[1]);}else store.delete(k);}
          }}catch(e){tx.abort();reject(e);}
        });
      }finally{db.close();}
    }
    await verifyApplied(before);
  }
  async function persistFile(backup){
    await validate(backup);
    const text=JSON.stringify(backup),health=await fetch('/__local__/health').then(r=>{if(!r.ok)fail('本地服务不可用');return r.json();});
    const response=await fetch('/__local__/backup',{method:'POST',headers:{'Content-Type':'application/json','X-LC-Backup-Token':health.token},body:text});
    const result=await response.json();if(!response.ok||result.error)fail(result.error||'备份未写入磁盘，已停止导入');
    if(result.sha256!==await digest(text))fail('磁盘备份校验失败，已停止导入');return result;
  }
  async function restore(backup,{overwrite=false,onProgress=()=>{}}={}){
    if(location.hostname!=='localhost')fail('请在 localhost 本地版中恢复；不会修改云端存档。');
    return navigator.locks.request('lc-local-backup-restore',{ifAvailable:true},async lock=>{
      if(!lock)fail('另一个页面正在导入，请等待。');
      const prepared=await plan(backup);
      if(prepared.conflicts.length&&!overwrite)fail(`有 ${prepared.conflicts.length} 项与现有数据不同。请确认覆盖选项，或先保留当前备份。`);
      onProgress('正在保存导入前备份及原始导入文件……');
      const savedBefore=await persistFile(prepared.current),savedIncoming=await persistFile(backup);
      const now=await capture({evidence:false});
      if(now.sha256!==prepared.current.sha256)fail('导入前存档发生变化，已保留磁盘备份；未写入。请关闭其他本站标签页后重试。');
      try{
        onProgress('正在恢复并逐项校验……');
        for(const d of backup.payload.databases)await putDatabase(d);
        for(const key of ['localStorage','sessionStorage'])for(const [k,v] of backup.payload[key])window[key].setItem(k,v);
        const counts=await verifyApplied(backup);
        return {counts,savedBefore,savedIncoming,verified:true};
      }catch(e){
        try{await rollback(prepared.current,backup);}catch(r){throw new Error(`恢复失败：${e.message}。自动回退未完成：${r.message}。原始数据已保存在 backups/${savedBefore.saved}，请停止操作并用该备份恢复。`);}
        throw new Error(`恢复失败，已回退导入前的数据：${e.message}。磁盘备份：${savedBefore.saved}`);
      }
    });
  }
  function download(backup){
    const blob=new Blob([JSON.stringify(backup)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`LastCloudia-backup-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  globalThis.LCBackup=Object.freeze({capture,validate,summary,plan,restore,persistFile,download,pack,unpack,digest,verifyApplied});
})();

(async()=>{
  if(location.origin!=='https://last-cloudia-skill-table.yuhao200124.chatgpt.site'){alert('请在原网站页面运行导出脚本。未读取数据。');return;}
  try{
    const backup=await LCBackup.capture();LCBackup.download(backup);const s=LCBackup.summary(backup);
    console.info('完整备份：',s,'SHA256',backup.sha256);
    alert('已发起备份下载：'+s.localKeys+' 项长期存档、'+s.sessionKeys+' 项本标签页草稿、'+s.records+' 条数据库记录。请保留下载的 JSON 文件，并到本地版恢复核对。其他标签页的临时草稿需要分别导出。原数据未删除。');
  }catch(e){console.error(e);alert('备份未完成：'+e.message+'。请保留原网站数据，不要清理浏览器。');}
})();
