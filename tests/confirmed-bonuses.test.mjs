import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {defaultInput,calculate} from '../dist/damage-engine.mjs';
const js=fs.readFileSync(new URL('../dist/damage-calculator.mjs',import.meta.url),'utf8');
// DOM event adapter, not a browser/rendering test. Exercise the production
// reader against grouped rows, whose visual order differs from damage order.
test('confirmation grouping preserves adopted execution order and a cleared ark value means zero',()=>{
 const native={id:1,importId:'native:one',kind:'all',percent:10,enabled:true,target:'无',stage:'post',name:'角色'},ark={id:2,bonusGroup:'ark',kind:'all',percent:20,enabled:true,target:'无',stage:'post',name:'圣物'};
 const row=e=>({dataset:{id:String(e.id)},querySelector(q){const key=q.match(/data-field=(\w+)/)[1];return {value:String(e[key]),valueAsNumber:Number(e[key]),checked:e[key]};}});
 const box={effects:[native,ark],document:{querySelectorAll:()=>[row(ark),row(native)]}};
 const fn=js.slice(js.indexOf('function readEffects() {'),js.indexOf('function arkValues()'));
 vm.createContext(box);vm.runInContext(fn+';result=readEffects()',box);
 assert.deepEqual(Array.from(box.result,e=>e.id),[1,2]);
 assert.deepEqual(calculate({...defaultInput(),effects:JSON.parse(JSON.stringify(box.result))}),calculate({...defaultInput(),effects:[native,ark]}));
 box.document.querySelectorAll=()=>[row({...ark,percent:''}),row(native)];
 vm.runInContext('result=readEffects()',box);assert.equal(box.result[1].percent,0);
 box.document.querySelectorAll=()=>[row({...ark,enabled:false}),row(native)];
 vm.runInContext('result=readEffects()',box);assert.equal(box.result[1].enabled,false);
 assert.equal(calculate({...defaultInput(),effects:JSON.parse(JSON.stringify(box.result))}).normal.mean,calculate({...defaultInput(),effects:[native]}).normal.mean);
});
