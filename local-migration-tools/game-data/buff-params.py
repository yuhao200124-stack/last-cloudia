# Buff script parameter labels for the calculator's 辅助魔法 descriptions (2026-09-30, user: “看看还有哪些机制没搞明白”):
#   python3 local-migration-tools/game-data/buff-params.py   → dist/game-data/engine/buff-params.json
# A buff whose effect only applies when damage is dealt has no control entries yet when the magic is cast; its
# parameters are named by the comment block above `function buffNNN` in process.lua (“-- params[1]:ダメージ倍率補正”).
# The buff's parameters as the engine keeps them are the SetBuff list without the leading duration, i.e. params[1..].
import os, re, json
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'dist', 'game-data', 'lua', 'process.lua')
OUT = os.path.join(HERE, '..', '..', 'dist', 'game-data', 'engine', 'buff-params.json')
lines = open(SRC, encoding='utf-8').read().split('\n')
out = {}
for i, l in enumerate(lines):
    m = re.match(r'^function buff(\d+)\(', l)
    if not m: continue
    j, block = i - 1, []
    while j >= 0 and lines[j].startswith('--'): block.insert(0, lines[j]); j -= 1
    title, params = '', {}
    for b in block:
        mm = re.match(r'^--\s*params\[(\d+)\]\s*[:：]\s*(.*)$', b)
        if mm: params[int(mm.group(1))] = mm.group(2).strip()
        elif not params: title = b.lstrip('- ').strip()
    if params: out[m.group(1)] = [title, [params.get(k, '') for k in range(1, max(params) + 1)]]
with open(OUT, 'w', encoding='utf-8') as f: json.dump(out, f, ensure_ascii=False, separators=(',', ':'))
print(len(out), os.path.getsize(OUT))
