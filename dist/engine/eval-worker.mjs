// A background copy of the battle sandbox for the 配装 gains and the SC 推荐 (2026-09-30, user: 计算器每次选什么都要等一下):
// the page asks for many single evaluations (the build without one skill, the build with one candidate); several of
// these workers run them side by side while the page stays responsive. Each keeps its own Lua VM and master data.
//   {type:'setup', dress, bundles:{monsters, monsterPassives, crests}}   → loads the character (once per character)
//   {type:'eval', id, job:{attackerSpec, targetSpec, moveId, firstBullet, state, assume}} → {type:'result', id, metric} | {type:'error', id, message}
import { Battle } from './battle.mjs?v=20260930-1549';
import { loadEngineData, loadPassives } from './engine-data.mjs?v=20260930-1549';
import { addAttacker, addTarget, runScenario } from './scenario.mjs?v=20260930-1549';
import { metricOf } from '../engine-panel-logic.mjs?v=20260930-1549';

const V = new URL(import.meta.url).search;
const BUNDLES = { monsters: 'monsters.json', monsterPassives: 'monster-passives.json', crests: 'crests.json' };
let battle = null, dress = null, merged = new Set(), ready = Promise.resolve();

async function setup(msg) {
  if (!battle || dress !== msg.dress) {
    const { master, scripts } = await loadEngineData({ unitDressIds: msg.dress ? [msg.dress] : [] });
    battle = new Battle(master, scripts, { probability: 'skip' }); dress = msg.dress; merged = new Set();
  }
  for (const [name, file] of Object.entries(BUNDLES)) if (msg.bundles?.[name] && !merged.has(name)) {
    battle.master.merge(await fetch(new URL(`../game-data/engine/${file}${V}`, import.meta.url)).then(r => r.json())); merged.add(name);
  }
}

async function evaluate({ attackerSpec, targetSpec, moveId, firstBullet, state, assume }) {
  // passives learned from other characters, and the top enhancement stages of the gear, live in id buckets
  await loadPassives(battle.master, [...attackerSpec.passives.map(p => p.id ?? p), ...Object.values(attackerSpec.equipPassiveIds || {}).flat()]);
  battle.reset();
  battle.options.probability = assume.probability;
  const attacker = addAttacker(battle, attackerSpec), target = addTarget(battle, targetSpec);
  return metricOf(runScenario({ battle, attacker, target, skill: { id: moveId, ...(firstBullet ? { bulletId: firstBullet } : {}) }, state, assume, randoms: [0.95] }));
}

self.onmessage = e => {
  const msg = e.data;
  // messages are handled in order: an evaluation waits for the setup sent before it
  ready = ready.then(async () => {
    try {
      if (msg.type === 'setup') { await setup(msg); self.postMessage({ type: 'ready', dress: msg.dress }); }
      else if (msg.type === 'eval') self.postMessage({ type: 'result', id: msg.id, metric: await evaluate(msg.job) });
    } catch (err) { self.postMessage({ type: 'error', id: msg.id, message: err?.message || String(err) }); }
  });
};
