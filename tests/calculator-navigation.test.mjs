import test from 'node:test';
import assert from 'node:assert/strict';
import {unifiedPageUrl,loadoutFrameUrl,captureControls,restoreControls} from '../dist/calculator-navigation.mjs';
import {mountUnifiedCalculator} from '../dist/unified-calculator.mjs';

test('full page route leaves the modal and carries session or saved-plan context',()=>{
 const route=new URL(unifiedPageUrl('https://example.test/damage-calculator.html?embedded=1&character=245','260',{session:'saved-session'}));
 assert.equal(route.pathname,'/damage-calculator.html');assert.equal(route.searchParams.get('character'),'260');
 assert.equal(route.searchParams.get('unified'),'1');assert.equal(route.searchParams.get('session'),'saved-session');assert(!route.searchParams.has('embedded'));
 const frame=new URL(loadoutFrameUrl(unifiedPageUrl(route.href,'260',{editPlan:'plan 1',draft:'1'})));
 assert.equal(frame.pathname,'/index.html');assert.equal(frame.searchParams.get('embeddedLoadout'),'1');assert.equal(frame.searchParams.get('editPlan'),'plan 1');assert.equal(frame.searchParams.get('draft'),'1');assert(!frame.searchParams.has('session'));
});

test('handoff keeps empty/typed values, damage modes and custom boss resistances; never transfers file input',()=>{
 const make=(id,value,extra={})=>({id,value,type:'number',dataset:{},closest(){return null;},...extra});
 const coefficient=make('coefficient','0.52'),pending=make('hits',''),mode=make('criticalEnabled','on',{type:'checkbox',checked:false}),resistance=make('','-40',{dataset:{bossResistance:'ice'}}),file=make('entryReportFile','private.json',{type:'file'});
 const elements=[coefficient,pending,mode,resistance,file],root={querySelectorAll:()=>elements,querySelector:q=>q.startsWith('#')?elements.find(el=>el.id===q.slice(1)):resistance};
 const values=captureControls(root);coefficient.value='1';pending.value='999';mode.checked=true;resistance.value='50';file.value='';
 restoreControls(root,values);
 assert.equal(coefficient.value,'0.52');assert.equal(pending.value,'');assert.equal(mode.checked,false);assert.equal(resistance.value,'-40');assert.equal(file.value,'');
});

test('embedded start requests navigation without ever opening the cramped nested workspace',()=>{
 const elements=new Map(),listeners={};let opened=0,changes=0,toggles=0;
 for(const id of ['unifiedLoadoutFrame','unifiedWorkspace','unifiedStart','unifiedSummary','unifiedSettings','unifiedExit'])elements.set(id,{src:'',hidden:true,addEventListener(type,fn){this[type]=fn;}});
 globalThis.document={getElementById:id=>elements.get(id),body:{classList:{toggle(){toggles++;}}}};
 globalThis.localStorage={getItem(){return null;}};globalThis.window={addEventListener(type,fn){listeners[type]=fn;}};
 try{
  const ui=mountUnifiedCalculator({getContext:()=>({}),onChange(){changes++;},beforeOpen(){opened++;return false;}});
  elements.get('unifiedStart').click();assert.equal(opened,1);assert.equal(ui.active,false);assert.equal(elements.get('unifiedLoadoutFrame').src,'');assert.equal(changes,0);assert.equal(toggles,0);
 }finally{for(const name of ['document','localStorage','window'])delete globalThis[name];}
});
