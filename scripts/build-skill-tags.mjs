import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),dataPath=new URL('dist/data.js',root),box={window:{}};
vm.runInNewContext(fs.readFileSync(dataPath,'utf8'),box);
const data=box.window.SKILL_DATA,registry=JSON.parse(fs.readFileSync(new URL('docs/skill-tag-registry.json',root),'utf8'));
const primary=new Map(data.sheets['全部技能'].rows.map(row=>[row.id,row]));
const byUrl=new Map(),catalog={};
for(const entry of registry.entries){
 const row=primary.get(entry.id);
 if(!row||row.url!==entry.url||row.effect!==entry.text)throw new Error(`Tag source changed: ${entry.id}`);
 if(catalog[entry.id]||byUrl.has(entry.url))throw new Error(`Duplicate tag identity: ${entry.id}`);
 for(const facet of entry.facets){
  if(!facet.path?.length||!facet.sourceText||!entry.text.includes(facet.sourceText))throw new Error(`Unanchored tag: ${entry.id}`);
  if(!['whole-skill','clause'].includes(facet.scope))throw new Error(`Unknown tag scope: ${entry.id}`);
  if(facet.requirements?.weaponCount?.some(n=>![0,1,2].includes(n)))throw new Error(`Invalid weapon count: ${entry.id}`);
 }
 const labels=[...new Set(entry.facets.map(f=>f.path.join(' / ')))];
 const value={...entry,status:'partial',labels};catalog[entry.id]=value;byUrl.set(entry.url,value);
}
const aliases={};
for(const sheet of Object.values(data.sheets))for(const row of sheet.rows||sheet.lanes.flatMap(l=>l.rows)){
 const entry=byUrl.get(row.url);
 if(entry){aliases[row.id]=entry.id;row.skillTags={catalogId:entry.id,status:'partial',labels:entry.labels,facets:entry.facets};}
 else delete row.skillTags;
}
data.skillCensus.taggedUnique=Object.keys(catalog).length;
fs.writeFileSync(dataPath,`window.SKILL_DATA = ${JSON.stringify(data)};\n`);
fs.writeFileSync(new URL('dist/skill-tag-catalog.mjs',root),`// Generated from docs/skill-tag-registry.json. Tags are NOT executable numeric rules.\nexport const SKILL_TAG_CATALOG = ${JSON.stringify(catalog,null,2)};\nexport const SKILL_TAG_ALIASES = ${JSON.stringify(aliases,null,2)};\n`);
console.log(JSON.stringify({taggedUnique:Object.keys(catalog).length,facets:registry.entries.reduce((sum,e)=>sum+e.facets.length,0)}));
