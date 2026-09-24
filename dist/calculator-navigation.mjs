// The full-page calculator and its internal skill picker share one route/state.
export function unifiedPageUrl(href,characterId,{session='',editPlan='',draft=''}={}) {
 const url=new URL('./damage-calculator.html',href);
 if(characterId)url.searchParams.set('character',characterId);
 url.searchParams.set('unified','1');
 for(const [key,value] of Object.entries({session,editPlan,draft}))if(value)url.searchParams.set(key,value);
 return url.href;
}
export function loadoutFrameUrl(href) {
 const current=new URL(href),url=new URL('./index.html',current);
 url.searchParams.set('embeddedLoadout','1');url.searchParams.set('v','20260924-fullpage');
 for(const key of ['editPlan','draft'])if(current.searchParams.has(key))url.searchParams.set(key,current.searchParams.get(key));
 return url.href;
}
export function captureControls(root) {
 return [...root.querySelectorAll('input,select,textarea')].filter(el=>(el.id||el.dataset.bossResistance||el.closest('.choices'))&&el.type!=='file').map(el=>({id:el.id,bossResistance:el.dataset.bossResistance,choice:!el.id&&!el.dataset.bossResistance?el.value:null,value:el.value,checked:el.checked,disabled:el.disabled,readOnly:el.readOnly}));
}
export function restoreControls(root,values=[]) {
 for(const value of values){const selector=value.id?`#${value.id}`:value.bossResistance?`[data-boss-resistance="${value.bossResistance}"]`:`.choices input[value="${value.choice}"]`;const el=root.querySelector(selector);if(!el||el.type==='file')continue;el.value=value.value;for(const key of ['checked','disabled','readOnly'])if(typeof value[key]==='boolean')el[key]=value[key];}
}
function sessionDatabase(){return new Promise((resolve,reject)=>{
 const request=indexedDB.open('lc-calculator-navigation-v1',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('sessions');
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});}
export async function saveCalculatorSession(data) {
 const key=crypto.randomUUID(),db=await sessionDatabase();
 try{await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readwrite');tx.objectStore('sessions').put({version:1,createdAt:Date.now(),...data},key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});return key;}finally{db.close();}
}
export async function loadCalculatorSession(key,characterId) {
 if(!/^[a-z0-9-]{1,80}$/.test(key||''))return null;
 const db=await sessionDatabase();
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readonly'),request=tx.objectStore('sessions').get(key);request.onsuccess=()=>{const data=request.result;resolve(data?.version===1&&String(data.characterId||'')===String(characterId||'')?data:null);};request.onerror=()=>reject(request.error);});}finally{db.close();}
}
export async function removeCalculatorSession(key){const db=await sessionDatabase();try{await new Promise((resolve,reject)=>{const tx=db.transaction('sessions','readwrite');tx.objectStore('sessions').delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
