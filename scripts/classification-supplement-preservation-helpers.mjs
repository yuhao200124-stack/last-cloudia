import fs from 'node:fs';
const m=JSON.parse(fs.readFileSync(new URL('../docs/classification-supplement-preservation-2026-09-25.json',import.meta.url),'utf8'));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function partsBeforeClassificationSupplements(e){
 const x=m.entries.find(x=>x.id===e.id);if(!x||equal(e.parts,x.before.parts))return e.parts;
 if(!equal(e.parts,x.after.parts))throw Error('Classification supplement part drift: '+e.name);
 return structuredClone(x.before.parts);
}
export function entryBeforeClassificationSupplements(e){
 const x=m.entries.find(x=>x.id===e.id);if(!x||equal(e,x.before))return e;
 // Catalog-derived records carry judgment fields; validate the complete persisted source fields.
 for(const k of Object.keys(x.after))if(!equal(e[k],x.after[k]))throw Error('Classification supplement entry drift: '+e.name+'/'+k);
 return {...e,...structuredClone(x.before)};
}
export function passBeforeClassificationSupplements(p){
 const x=m.passes.find(x=>x.tag===p?.tag);if(!x||equal(p,x.before))return p;
 if(!equal(p,x.after))throw Error('Classification supplement pass drift: '+p?.tag);
 return structuredClone(x.before);
}
export function registryBeforeClassificationSupplements(r){
 const views={...r.views};for(const[k,v]of Object.entries(m.views)){if(v.before===null)delete views[k];else views[k]=structuredClone(v.before);}
 return {...r,entries:r.entries.map(entryBeforeClassificationSupplements),tagPasses:r.tagPasses.map(passBeforeClassificationSupplements).filter(Boolean),views};
}
