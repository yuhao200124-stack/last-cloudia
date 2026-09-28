# Game description text, exactly as the game builds it: PROCESS_EXPLAIN holds {0},{1},... and
# PROCESS_EXPLAIN_QUOTE says, for each placeholder, which process argument to show and how:
#   "p:a[:fmt]"          argument a of process p; fmt 0 → ÷100, 2 → ÷1000, otherwise as is
#   "p:a:op:n[:op:n…]"   the raw argument combined with n, left to right (op * / + -); n may be "[k]",
#                        argument k of the same process. E.g. "1:3:*:2" shows twice the first cap
#                        (single-weapon doubling), "1:1:/:-100" turns -3000 into 30, "2:7:/:100:+:10"
#                        turns 1000 into 20, "2:10:/:[5]" divides the 4-member total by the member count
# The first export only understood the first form and wrote "?" for the rest; this module is the
# shared implementation for fulldata.py and the refresh_texts.py backfill.
import re

def clean(s):
    return re.sub(r'<[^>]+>', '', str(s or '')).replace('\r', '').strip()

OPS = {'*': lambda a, b: a * b, '/': lambda a, b: a / b, '+': lambda a, b: a + b, '-': lambda a, b: a - b}

def quote_value(procs, quote):
    parts = quote.split(':')
    pi, ai = int(parts[0]), int(parts[1])
    proc = procs[pi - 1]
    v = int(proc[ai + 1] or 0)
    rest = parts[2:]
    if rest and rest[0] in OPS:
        # a lone trailing field after the operations ("1:2:/:-100:0", "1:3:/:60:1") is a display
        # format, not a further scaling: -3000/-100 is shown as 30 (casting speed +30%), 1200/60 as 20 s
        pairs = rest[:len(rest) - len(rest) % 2]
        val = v
        for op, n in zip(pairs[::2], pairs[1::2]):
            if op not in OPS:
                raise ValueError('unknown operator in ' + quote)
            ref = n.startswith('[') and n.endswith(']')
            b = int(proc[int(n[1:-1]) + 1] or 0) if ref else float(n)
            val = OPS[op](val, b)
    else:
        fmt = int(rest[0]) if rest and rest[0] else 1
        val = v / 100 if fmt == 0 else v / 1000 if fmt == 2 else v
    val = round(val, 4)
    return int(val) if val == int(val) else val

def filled(r, text_key='PROCESS_EXPLAIN', quote_key='PROCESS_EXPLAIN_QUOTE'):
    procs = [seg.split(':') for seg in str(r['PROCESS_INFO']).split('@')]
    txt = r.get(text_key) or ''
    for i, q in enumerate([q for q in (r.get(quote_key) or '').split(',') if q]):
        try:
            val = quote_value(procs, q)
        except Exception:
            val = '?'
        txt = txt.replace('{%d}' % i, str(val))
    return clean(txt)

def max_enhanced(passive_id, by_name, names):
    """An exclusive gear passive and its enhanced (神装) stages share the passive's NAME and sit just
    above its id (e.g. 1020480 → 1020482, 1010790 → 1010793/1010794). The highest one is the gear
    at its maximum."""
    name = names.get(passive_id)
    stages = [p for p in by_name.get(name, []) if 0 < p - passive_id < 10]
    return max(stages) if stages else passive_id
