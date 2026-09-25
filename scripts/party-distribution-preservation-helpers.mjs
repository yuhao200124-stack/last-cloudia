import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(new URL('../docs/party-distribution-preservation-2026-09-25.json',import.meta.url),'utf8'));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function entryBeforePartyDistribution(entry){
 const x=manifest.entries.find(x=>x.id===entry.id);if(!x)return entry;
 if(equal(entry.tagDetails,x.before))return entry;
 if(!equal(entry.tagDetails,x.after))throw Error('Party distribution detail drift');
 return {...entry,tagDetails:structuredClone(x.before)};
}
export function passBeforePartyDistribution(pass){
 const x=manifest.passes.find(x=>x.tag===pass?.tag);if(!x)return pass;
 if(equal(pass,x.before))return pass;
 if(!equal(pass,x.after))throw Error('Party distribution pass drift');
 return structuredClone(x.before);
}
export function registryBeforePartyDistribution(registry){
 const passes=registry.tagPasses.map(passBeforePartyDistribution);
 for(const x of manifest.passes.filter(x=>x.after===null))passes.push(structuredClone(x.before));
 return {...registry,entries:registry.entries.map(entryBeforePartyDistribution),tagPasses:passes};
}
