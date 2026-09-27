(() => {
  'use strict';
  const $=id=>document.getElementById(id),B=window.LCBackup;
  let selected=null,conflicts=[],busy=false;
  function status(id,text,error=false){$(id).textContent=text;$(id).className=error?'error':'';}
  const enable=()=>{$('restore').disabled=busy||!selected||!$('closedTabs').checked||(conflicts.length>0&&!$('overwrite').checked);};
  async function list(){
    const r=await fetch('/__local__/backups');if(!r.ok)throw new Error('本地服务不可用，请通过启动网站.cmd 打开。');
    const {files}=await r.json();$('backupList').replaceChildren();
    for(const name of files.reverse()){const li=document.createElement('li'),a=document.createElement('a');a.textContent=name;a.href=`/__local__/backup/${encodeURIComponent(name)}`;a.download=name;li.append(a);$('backupList').append(li);}
    if(!files.length)$('backupList').textContent='尚未生成磁盘备份。';
  }
  $('copyExporter').onclick=async()=>{
    try{const r=await fetch('./export-old-site.js');if(!r.ok)throw new Error('导出脚本未加载');const text=await r.text();$('exporterText').value=text;
      try{await navigator.clipboard.writeText(text);status('copyStatus','已复制。请到原网站的控制台运行，下载后回到本页导入。');}
      catch{$('scriptFallback').hidden=false;$('scriptFallback').open=true;$('exporterText').select();status('copyStatus','浏览器未允许自动复制，请复制下方完整脚本。');}
    }catch(e){status('copyStatus',e.message,true);}
  };
  function counts(backup){
    const s=B.summary(backup);$('counts').replaceChildren();
    for(const [key,value] of [['来源',s.source],['备份时间',s.createdAt],['长期存档',`${s.localKeys} 项`],['本标签页草稿',`${s.sessionKeys} 项`],['数据库',`${s.databases} 个／${s.records} 条记录`],['文件校验','SHA-256 一致']]){
      const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=value;$('counts').append(dt,dd);
    }
  }
  $('backupFile').onchange=async()=>{
    selected=null;conflicts=[];$('inspection').hidden=true;$('sessionLinks').hidden=true;$('overwrite').checked=false;enable();
    const file=$('backupFile').files[0];if(!file)return;
    try{if(file.size>256*1024*1024)throw new Error('备份超过 256 MB，请保留文件并联系维护者。');status('importStatus','正在读取、校验并检查差异……');const backup=JSON.parse(await file.text());await B.validate(backup);const info=await B.plan(backup);selected=backup;conflicts=info.conflicts;counts(backup);$('inspection').hidden=false;$('overwriteLabel').hidden=!conflicts.length;
      $('conflicts').textContent=conflicts.length?`有 ${conflicts.length} 项同名数据不同。恢复会先备份当前原值；其他本地记录保留。`:'未发现同名数据冲突。已有相同记录会保持一致，其他本地记录保留。';
      const s=B.summary(backup);status('importStatus',!s.localKeys&&!s.records?'这份备份没有已保存的长期记录。如果原站曾保存过配装，请确认导出时使用了正确的浏览器和原网址。':'文件检查通过。恢复后还会逐项读回校验。');enable();
    }catch(e){selected=null;status('importStatus',e.message,true);enable();}
  };
  $('overwrite').onchange=enable;$('closedTabs').onchange=enable;
  $('restore').onclick=async()=>{
    if(!selected||busy)return;busy=true;enable();$('backupFile').disabled=true;
    try{const result=await B.restore(selected,{overwrite:$('overwrite').checked,onProgress:text=>status('importStatus',text)});
      status('importStatus',`恢复并校验成功：${result.counts.localKeys} 项长期存档、${result.counts.sessionKeys} 项草稿、${result.counts.records} 条数据库记录。导入前备份：${result.savedBefore.saved}。请打开网站核对配装与计算结果；核对完成前保留原网站数据。`);
      $('importStatus').className='success';renderSessions(selected);await list();
    }catch(e){status('importStatus',e.message,true);}finally{busy=false;$('backupFile').disabled=false;enable();}
  };
  function renderSessions(backup){
    const db=backup.payload.databases.find(d=>d.name==='lc-calculator-navigation-v1'),store=db?.stores.find(s=>s.name==='sessions'),ul=$('sessionLinks').querySelector('ul');ul.replaceChildren();if(!store)return;
    for(const [key,value] of B.unpack(store.entries)){if(!/^[a-z0-9-]{1,80}$/.test(String(key))||!/^\d+$/.test(String(value?.characterId)))continue;
      const a=document.createElement('a'),li=document.createElement('li');a.href=`./damage-calculator.html?character=${encodeURIComponent(value.characterId)}&session=${encodeURIComponent(key)}&unified=1`;a.textContent=`角色 ${value.characterId} · ${key}`;li.append(a);ul.append(li);
    }$('sessionLinks').hidden=!ul.children.length;
  }
  $('exportLocal').onclick=async()=>{
    if(busy)return;busy=true;$('exportLocal').disabled=true;enable();
    try{status('exportStatus','正在读取全部存档并保存……');const backup=await B.capture();const saved=await B.persistFile(backup);B.download(backup);status('exportStatus',`已保存并校验：backups/${saved.saved}。同时已发起下载。`);await list();}
    catch(e){status('exportStatus',e.message,true);}finally{busy=false;$('exportLocal').disabled=false;enable();}
  };
  $('refreshBackups').onclick=()=>list().catch(e=>status('exportStatus',e.message,true));
  list().catch(e=>status('exportStatus',e.message,true));
})();
