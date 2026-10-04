// A few background copies of the battle sandbox (engine/eval-worker.mjs) for the many single evaluations of the 配装
// gains and the SC 推荐 (2026-09-30, faster calculator): jobs are queued and handed to whichever worker is free;
// `cancel()` drops the queue (a new main run or a changed build) and the caller ignores late results by its own
// generation. Without Worker support `available` is false and the caller computes on the page as before.
const WORKER_URL = new URL('./engine/eval-worker.mjs?v=20261005-0001', import.meta.url);

export function createEvalPool(size = Math.max(1, Math.min(4, (globalThis.navigator?.hardwareConcurrency || 2) - 1))) {
  let workers = [];
  try { workers = Array.from({ length: size }, () => ({ w: new Worker(WORKER_URL, { type: 'module' }), busy: null, failed: false })); }
  catch { workers = []; }
  const queue = [];
  let nextId = 1, setupMsg = null, broken = !workers.length;
  const pump = () => {
    for (const k of workers) {
      if (k.busy || k.failed || !queue.length) continue;
      const job = queue.shift();
      k.busy = job; k.w.postMessage({ type: 'eval', id: job.id, job: job.job });
    }
  };
  for (const k of workers) {
    k.w.onmessage = e => {
      const m = e.data;
      if (m.type === 'ready') return;
      const job = k.busy; k.busy = null;
      if (job && job.id === m.id) { if (m.type === 'result') job.resolve(m.metric); else job.reject(new Error(m.message)); }
      pump();
    };
    k.w.onerror = e => { e.preventDefault?.(); k.failed = true; const job = k.busy; k.busy = null; if (job) job.reject(new Error(e.message || '后台计算失败')); if (workers.every(x => x.failed)) { broken = true; for (const j of queue.splice(0)) j.reject(new Error('后台计算不可用')); } pump(); };
  }
  return {
    get available() { return !broken; },
    size: workers.length,
    // the character and the extra data every evaluation needs; sent again only when it changes
    setup(msg) {
      const text = JSON.stringify(msg); if (text === setupMsg) return; setupMsg = text;
      for (const k of workers) if (!k.failed) k.w.postMessage({ type: 'setup', ...msg });
    },
    eval(job, tag = '') {
      if (broken) return Promise.reject(new Error('后台计算不可用'));
      return new Promise((resolve, reject) => { queue.push({ id: nextId++, job, tag, resolve, reject }); pump(); });
    },
    // drops the queued jobs (all, or those of one tag); their promises never settle — the caller has moved on
    cancel(tag) { for (let i = queue.length - 1; i >= 0; i--) if (tag == null || queue[i].tag === tag) queue.splice(i, 1); },
  };
}
