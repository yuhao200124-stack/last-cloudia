"""The skill classification draft (docs/skill-classes-draft.json) as an Excel for the user to review.

  node scripts/build-skill-classes.mjs
  python3 scripts/skill-classes-excel.py export <out.xlsx>        # one row per skill, sorted by main category
  python3 scripts/skill-classes-excel.py by-category <out.xlsx>   # a heading per category, every skill in it listed under it

One sheet, one skill per row, sorted by its main category (the first of its categories in CAT order).
"""
import collections
import json
import sys
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side

ROOT = Path(__file__).resolve().parent.parent
CAT = ['基础属性', '造成伤害', '伤害上限', '特攻', '暴击', '反击', '信仰', '受到伤害', '异常', 'Break值', '魔法·咏唱', '特技充能·必杀', '回复', '移动与行动', '装备·种族', '金钱·经验', '待确认']
DESC = {
    '基础属性': 'HP、MP、攻击力、法强、防御力、魔抗、属性耐性（常驻或开局自动发动的增益）',
    '造成伤害': '对敌人造成的伤害提升（属性、物理／魔法、武器、特技／超必杀、对种族、条件）',
    '伤害上限': '伤害上限提升',
    '特攻': '种族特攻（剋星、斩灭者、爆裂者、凝视者等）',
    '暴击': '暴击率、暴击时伤害、可以暴击',
    '受到伤害': '自己受到的伤害减少（护盾、屏障、壁、格挡等）；也包括“受到伤害增加”的代价',
    '异常': '异常耐性、异常付与、异常恢复、裂伤',
    'Break值': '破防值（对敌人的眩晕值、自己不易眩晕）',
    '魔法·咏唱': '咏唱速度、咏唱不被打断、魔法耗 MP',
    '特技充能·必杀': '特技充能、特技次数、超必杀技槽',
    '回复': '体力／法力恢复、复活、吸收',
    '移动与行动': '移动速度、被敌人瞄准的程度、距离',
    '装备·种族': '可装备的武器种类、追加角色类型（拟态）、二刀流',
    '金钱·经验': '金钱、经验值',
    '待确认': '看不准的，不猜',
}
EDIT = {'大类', '条件标签', '计算器'}
FILLS = {'能算': 'E2EFDA', '看条件': 'FFF2CC', '不影响每段伤害': 'F2F2F2', '待确认': 'FCE4D6'}
F = lambda **k: Font(name='Arial', size=k.pop('size', 10), **k)


def export(out):
    draft = json.loads((ROOT / 'docs/skill-classes-draft.json').read_text(encoding='utf-8'))
    game = {g['gameId']: g for g in json.loads((ROOT / 'docs/game-relic-passives.json').read_text(encoding='utf-8'))}
    layout = json.loads((ROOT / 'docs/game-skill-layout.json').read_text(encoding='utf-8'))
    order = {r['id']: i for i, r in enumerate(r for r in layout['sheets']['全部技能']['rows'] if not r.get('separator'))}
    desc = {**DESC, **draft.get('categories', {})}
    norm = lambda c: '待确认' if c in ('其他', '待确认（脚本数值）') else c
    rows = []
    for s in draft['skills']:
        cats = [c for c in CAT if c in {norm(x) for x in s['cats']}]
        main = cats[0] if cats else '待确认'
        why = '；'.join(f"{norm(c)}←{'+'.join(r)}" for c, r in s['reasons'].items())
        if s.get('userNote'):
            why = f"{s['userNote']}（{why}）"
        rows.append((CAT.index(main), order.get(s['id'], 9999), s, cats or ['待确认'], why))
    rows.sort(key=lambda x: (x[0], x[1]))

    wb = Workbook()
    thin = Side(style='thin', color='BFBFBF')
    bd = Border(left=thin, right=thin, top=thin, bottom=thin)
    ws = wb.active
    ws.title = '全部技能'
    cols = ['游戏编号', '名称', 'SC', '效果说明', '大类', '条件标签', '计算器', '依据']
    for j, (h, w) in enumerate(zip(cols, [10, 20, 5, 58, 26, 22, 14, 44]), 1):
        c = ws.cell(row=1, column=j, value=h)
        c.font = F(bold=True)
        c.fill = PatternFill('solid', fgColor='FFF2CC' if h in EDIT else 'D9D9D9')
        c.border = bd
        c.alignment = Alignment(horizontal='center', vertical='center')
        ws.column_dimensions[c.column_letter].width = w
    for i, (_, _, s, cats, why) in enumerate(rows, 2):
        vals = [s['id'], s['name'], game[s['id']]['sc'], game[s['id']]['effectS'], '、'.join(cats), '、'.join(s['tags']), s['calc'], why]
        for j, v in enumerate(vals, 1):
            c = ws.cell(row=i, column=j, value=v if v != '' else None)
            c.font = F(color='595959' if cols[j - 1] in ('游戏编号', 'SC', '效果说明', '依据') else '000000')
            c.border = bd
            c.alignment = Alignment(vertical='center', wrap_text=j in (4, 5, 6, 8), horizontal='center' if j in (1, 3, 7) else 'left')
            if cols[j - 1] == '计算器':
                c.fill = PatternFill('solid', fgColor=FILLS.get(s['calc'], 'FFFFFF'))
    ws.freeze_panes = 'C2'
    ws.auto_filter.ref = f'A1:H{len(rows) + 1}'

    info = wb.create_sheet('说明')
    lines = [('技能分类初稿（从游戏数据自动分）', True, 12), ('', False, 10),
             ('每个技能按两样游戏数据分类：它在游戏里的“效果种类”，和游戏自带的效果说明文字。一个技能影响几类，就放进几类。', False, 10),
             ('计算一律按游戏编号；这里只决定网页上分在哪一页、配装时怎么筛。你已经决定的写在“依据”里（用户：…）。', False, 10), ('', False, 10),
             ('怎么改（“全部技能”这一页）', True, 10),
             ('· “大类”：可以增删，多个用“、”隔开；排在第一个的是主要大类（表按它排序）', False, 10),
             ('· “条件标签”：从游戏的条件数据读出（不是看说明文字）：属性、物理／魔法／特技／超必杀、装备什么武器、对哪个种族、对 BOSS、HP、暴击时、击杀时等；可以改', False, 10),
             ('　“受·”开头＝受到这种攻击时（防御类），例如“受·火属性”＝受到火属性攻击时；冰壁在游戏数据里就是减少火属性伤害，所以是“受·火属性”', False, 10),
             ('　没有标签＝没有条件（常驻、开局就生效）', False, 10),
             ('· “计算器”：能算＝改变每段伤害；看条件＝要满足满血／濒死／Break 等才有伤害收益；不影响每段伤害＝咏唱速度、防御等，配装里照样列出但不算收益；待确认＝看不准', False, 10),
             ('· “依据”只是给你看为什么这样分，不用改', False, 10), ('', False, 10), ('大类', True, 10)]
    for i, (t, b, sz) in enumerate(lines, 1):
        info.cell(row=i, column=1, value=t).font = F(bold=b, size=sz)
    cnt = collections.Counter(c for r in rows for c in r[3])
    main_cnt = collections.Counter(CAT[r[0]] for r in rows)
    r0 = len(lines) + 1
    for j, h in enumerate(['大类', '技能数（含次要）', '作为主要大类', '包括什么'], 1):
        c = info.cell(row=r0, column=j + 1, value=h)
        c.font = F(bold=True)
        c.fill = PatternFill('solid', fgColor='DDEBF7')
        c.border = bd
    for i, name in enumerate(CAT, 1):
        for j, v in enumerate([name, cnt.get(name, 0), main_cnt.get(name, 0), desc.get(name, '')], 1):
            c = info.cell(row=r0 + i, column=j + 1, value=v)
            c.font = F()
            c.border = bd
    info.column_dimensions['A'].width = 3
    for col, w in zip('BCDE', [14, 16, 14, 70]):
        info.column_dimensions[col].width = w
    calc_cnt = collections.Counter(r[2]['calc'] for r in rows)
    info.cell(row=r0 + len(CAT) + 2, column=2, value='计算器：' + '　'.join(f'{k} {v}' for k, v in calc_cnt.items())).font = F()
    wb.save(out)
    print(f'exported {len(rows)} skills to {out}', dict(main_cnt), dict(calc_cnt))


def export_by_category(out):
    """One sheet: a heading row per category, then every skill in it (a skill in several categories is listed under each)."""
    draft = json.loads((ROOT / 'docs/skill-classes-draft.json').read_text(encoding='utf-8'))
    game = {g['gameId']: g for g in json.loads((ROOT / 'docs/game-relic-passives.json').read_text(encoding='utf-8'))}
    layout = json.loads((ROOT / 'docs/game-skill-layout.json').read_text(encoding='utf-8'))
    order = {r['id']: i for i, r in enumerate(r for r in layout['sheets']['全部技能']['rows'] if not r.get('separator'))}
    desc = {**DESC, **draft.get('categories', {})}
    norm = lambda c: '待确认' if c in ('其他', '待确认（脚本数值）') else c
    members = collections.defaultdict(list)
    for s in draft['skills']:
        cats = [c for c in CAT if c in {norm(x) for x in s['cats']}] or ['待确认']
        for c in cats:
            members[c].append((order.get(s['id'], 9999), s, cats))
    wb = Workbook()
    ws = wb.active
    ws.title = '按分类'
    thin = Side(style='thin', color='BFBFBF')
    bd = Border(left=thin, right=thin, top=thin, bottom=thin)
    cols = ['游戏编号', '名称', 'SC', '效果说明', '也在这些分类', '条件标签', '计算器', '减伤（以后算）']
    note = ws.cell(row=1, column=1, value='大类和条件标签都只从游戏数据读出（效果种类、操作类型、效果参数、所加的增益、条件数据），不看说明文字；“效果说明”一列只是给你对照。“受·”开头＝受到这种攻击时（防御类），例如冰壁在游戏数据里减少火属性伤害，所以是“受·火属性”。没有标签＝没有条件。“减伤”一列是以后算受到伤害时用的，现在先准备好。')
    note.font = F(size=10, color='595959')
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(cols))
    for j, (h, w) in enumerate(zip(cols, [10, 20, 5, 60, 22, 26, 14, 14]), 1):
        c = ws.cell(row=2, column=j, value=h)
        c.font = F(bold=True)
        c.fill = PatternFill('solid', fgColor='D9D9D9')
        c.border = bd
        c.alignment = Alignment(horizontal='center', vertical='center')
        ws.column_dimensions[c.column_letter].width = w
    ws.freeze_panes = 'A3'
    r = 3
    for cat in CAT:
        rows = sorted(members.get(cat, []), key=lambda x: x[0])
        if not rows:
            continue
        head = ws.cell(row=r, column=1, value=f'【{cat}】 {len(rows)} 个技能 — {desc.get(cat, "")}')
        head.font = F(bold=True, size=11, color='FFFFFF')
        for j in range(1, len(cols) + 1):
            ws.cell(row=r, column=j).fill = PatternFill('solid', fgColor='2F5597')
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=len(cols))
        ws.row_dimensions[r].height = 22
        r += 1
        for _, s, cats in rows:
            others = [c for c in cats if c != cat]
            vals = [s['id'], s['name'], game[s['id']]['sc'], game[s['id']]['effectS'], '、'.join(others), '、'.join(s['tags']), s['calc'], (s.get('defense') or {}).get('calc', '')]
            for j, v in enumerate(vals, 1):
                c = ws.cell(row=r, column=j, value=v if v != '' else None)
                c.font = F()
                c.border = bd
                c.alignment = Alignment(vertical='center', wrap_text=j in (4, 5, 6), horizontal='center' if j in (1, 3, 7, 8) else 'left')
                if j in (7, 8) and v:
                    c.fill = PatternFill('solid', fgColor=FILLS.get(v, 'FFFFFF'))
            r += 1
        r += 1
    wb.save(out)
    print(f'exported by category to {out}', {c: len(members.get(c, [])) for c in CAT})


if __name__ == '__main__':
    if len(sys.argv) >= 3 and sys.argv[1] == 'export':
        export(sys.argv[2])
    elif len(sys.argv) >= 3 and sys.argv[1] == 'by-category':
        export_by_category(sys.argv[2])
    else:
        print(__doc__)
        sys.exit(2)
