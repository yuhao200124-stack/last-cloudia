/*
 * Last Cloudia Loadout Reader - core logic (platform neutral).
 *
 * Reads, out of battle, the player's own character loadouts from the game
 * client's memory. READ-ONLY: the platform layer only calls ReadProcessMemory
 * on a handle opened with PROCESS_QUERY_INFORMATION | PROCESS_VM_READ.
 *
 * Every address below was derived statically from the user-supplied
 * GameAssembly.dll (TimeDateStamp 0x6AA0E182) + global-metadata.dat (v39):
 *   - Aidis.Singleton`1<T> GenericClass records; +0x18 is Il2CppGenericClass
 *     cached_class, which the runtime fills with the live Il2CppClass*.
 *   - Field offsets come from Il2CppMetadataRegistration.fieldOffsets and were
 *     cross-checked against offsets the battle reader already verified live
 *     (BattleManager.PlayerParty 0x198, EnemyParty 0x1A0, LogMng 0x1C8).
 * Nothing is guessed at run time: every hop validates the class name first.
 */
#include "loadout_core.h"

/* ---------------------------------------------------------------- anchors */
#define EXPECTED_TIMESTAMP 0x6AA0E182u

#define RVA_SINGLETON_DATAMANAGER_CACHED   0x7669988ull /* Singleton<DataManager>   */
#define RVA_SINGLETON_MASTERMANAGER_CACHED 0x766A148ull /* Singleton<MasterManager> */

typedef struct { const char *name; u64 rva; } SheetAnchor;
static const SheetAnchor kSheets[] = {
    {"PassiveSkillMst",  0x7618468ull},
    {"SkillMst",         0x76224D8ull},
    {"UnitDressMst",     0x762E1B8ull},
    {"ArkMst",           0x75CF7D8ull},
    {"ArkPartyTraitMst", 0x75CFC78ull},
    {"ArkSkillLvMst",    0x75D08B8ull},
    {"ItemEquipMst",     0x75FE8C8ull},
    {"CrestMst",         0x75DE878ull},
    {"ProcessMst",       0x761A3A8ull},
    {"ProcessCondMst",   0x7619B38ull},
    {"BuffMst",          0x75D8C38ull},
    /* v0.8: active-skill bullets and supporting tables */
    {"BulletMst",                0x75D94B8ull},
    {"BulletLvInfoMst",          0x75D9078ull},
    {"ProcessOpeTypeMst",        0x761A7D8ull},
    {"ProcessTypeMst",           0x761AB28ull},
    {"ProcessGroupMst",          0x7619F38ull},
    {"UnitDressAbilityPieceMst", 0x762BBD8ull},
    {"UnitDressLimitbreakMst",   0x762D428ull},
    {"UnitDressAwakeMst",        0x762C158ull},
    {"UnitDressLvMst",           0x762D998ull},
    {"SacredSkillMst",           0x7620F98ull},
    {"TabooRelicMst",            0x7626E98ull},
    {"BadStatusMst",             0x75D2E68ull},
    {"CharacterTypeMst",         0x75DBFE8ull},
    {"SkillExplainMst",          0x7622068ull},
    {"PassiveSkillExplainMst",   0x7618058ull},
    {"BuffExplainMst",           0x75D8828ull},
    {"FreeSkillMst",             0x75EB5F8ull},
    {"TerrainEffectMst",         0x7627B28ull},
    {"MonsterMst",               0x7614278ull},
    {"MonsterPassiveSkillMst",   0x7614838ull},
    /* v0.10: level growth curve (GROWTH_RATE per level, all dresses use GROWTH_ID 2) and equipment
       enhancement curve, so the out-of-battle panel can be computed from master data alone. */
    {"GrowthMst",                0x75F18B8ull},
    {"ItemEquipParameterGrowthMst", 0x75FECF8ull},
    /* v0.11: crest trait masters (a crest instance's traits are passive skills drawn from
       CrestTraitParameterGroupMst; the loadout only stores the passive ids per slot). */
    {"CrestTraitParameterGroupMst", 0x75DF4F8ull},
    {"CrestTraitLotteryMst",        0x75DF0B8ull},
    {"CrestTraitRankLotteryMst",    0x75DF908ull},
    {"CrestSlotLotteryMst",         0x75DED88ull},
    {"CrestLevelMst",               0x75DE488ull},
    /* v0.12 (2026-09-30, the calculator's 添加圣物): an ark's stats at its purity / level (CalcArkStatus reads
       ArkPurityMst) and its ark-skill growth. Anchors found like the others: Il2CppGenericClass of
       Accessor`1<T> + 0x18 (ArkMst resolves to its known 0x75CF7D8 the same way). */
    {"ArkPurityMst",                0x75D0068ull},
    {"ArkSkillGrowthMst",           0x75D04A8ull},
    /* v0.13: the table UnitUtil.CalcArkStatus actually reads — ArkLvMst (ark id, level) → HP/MP/ATK/DEF/MATK/MDEF and
       PROCESS_INFO; found by disassembling CalcArkStatus (GetArkLvMstAccessor / GetArkLvMst). */
    {"ArkLvMst",                    0x75CF3A8ull},
    /* v0.14 (2026-09-30, 异常状态的效果): the battle constants (DEFINE_KEY → DEFINE_VALUE) BattleConstants.LoadDefineMst
       reads — BATTLE_DEFINE_POISON_DAMAGE_RATIO / _DOT_INTERVAL, DEADLY_POISON_*, RAGE_ATK/DEF_EDIT_RATIO,
       KILLER_DAMAGE_RATIO, DAMAGE_LIMIT, RATIO_IN_BREAK …; anchor found like the others (Accessor`1<T> + 0x18). */
    {"BattleDefineMst",             0x75D3BF8ull},
};
#define SHEET_COUNT (sizeof(kSheets) / sizeof(kSheets[0]))

/* Il2Cpp runtime layout (matches the battle reader's verified constants). */
#define CLASS_NAME          0x10
#define CLASS_NAMESPACE     0x18
#define CLASS_STATIC_FIELDS 0xB8
#define OBJ_KLASS           0x00
#define STR_LEN             0x10
#define STR_CHARS           0x14
#define ARR_LEN             0x18
#define ARR_DATA            0x20
#define LIST_ITEMS          0x10
#define LIST_SIZE           0x18
#define DICT_ENTRIES        0x18
#define DICT_COUNT          0x20
#define DENTRY_KEY          0x08
#define DENTRY_VALUE        0x10
#define DENTRY_STRIDE_KOBJ  0x18 /* Entry<int|uint, object> */

/* Field offsets (instance fields include the 0x10 object header). */
#define DM_USERINFO   0x18
#define DM_USERUNIT   0x310
#define DM_USERITEM   0x318 /* DataManager.UserItem : World.Data.UserItem */
/* UserItem (v0.11): Dictionary<int, struct> fields, all value types stored inline in the entries. */
#define UI_ARKINFO    0x10 /* Dictionary<int, ArkInfo>             ArkInfo raw 0x30: ArkID@0 Lv@4 Purity@8 CreateDate@10 skillLvInfo@18 NewRecord@20 IsFavorite@24 ArkIconType@28 */
#define UI_ARKCUSTOM  0x18 /* Dictionary<int, UserArkCustomizeInfo> raw 0x70 */
#define UI_CRESTS     0x28 /* Dictionary<int, CrestInfo>           CrestInfo raw 0x18: CrestID@0 UserCrestID@4 Favorite@8 Slots@10 (Slot[] of 5 ints) */
#define UI_EQUIPITEMS 0x30 /* Dictionary<int, ItemEquipInfo>       ItemEquipInfo raw 0x20: ItemEquipID@0 Possession@4 NewRecord@8 AlchemyLevel@C Favorite@10 CreateDate@18 */
#define UI_HANDLENAME 0x20
#define UU_DECKLIST   0x10
#define UU_PASSIVES   0xD8
#define UU_PUBLIC     0xE8
#define PU_DRESSINFO  0x18
#define PU_DRESSEQUIP 0x20
#define MM_MASTERSET  0x10
#define MS_ACCESSORS  0x28
#define ACC_BINARY    0x10

/* ------------------------------------------------------------- utilities */
static Output *g;

static void *mset(void *d, int c, u64 n) { u8 *p = d; while (n--) *p++ = (u8)c; return d; }
static u64 slen(const char *s) { u64 n = 0; while (s[n]) n++; return n; }
static int seq(const char *a, const char *b) { while (*a && *a == *b) { a++; b++; } return *a == *b; }

static void put(const char *s) {
    u64 n = slen(s);
    if (g->len + n >= g->cap) { g->overflow = 1; return; }
    for (u64 i = 0; i < n; i++) g->buf[g->len++] = s[i];
}
static void putc1(char c) { if (g->len + 1 >= g->cap) { g->overflow = 1; return; } g->buf[g->len++] = c; }
static void putu(u64 v) { char t[24]; int n = 0; do { t[n++] = (char)('0' + v % 10); v /= 10; } while (v); while (n) putc1(t[--n]); }
static void puti(i64 v) { if (v < 0) { putc1('-'); putu((u64)(-v)); } else putu((u64)v); }
static void puthex(u64 v) { const char *h = "0123456789abcdef"; char t[18]; int n = 0; do { t[n++] = h[v & 15]; v >>= 4; } while (v); put("\"0x"); while (n) putc1(t[--n]); putc1('"'); }

/* JSON string from UTF-8/ASCII bytes. */
static void putjs(const char *s) {
    putc1('"');
    for (; *s; s++) {
        u8 c = (u8)*s;
        if (c == '"' || c == '\\') { putc1('\\'); putc1((char)c); }
        else if (c < 0x20) { const char *h = "0123456789abcdef"; put("\\u00"); putc1(h[c >> 4]); putc1(h[c & 15]); }
        else putc1((char)c);
    }
    putc1('"');
}

static int rd(u64 addr, void *buf, u32 n) { return addr && g->read(g->ctx, addr, buf, n); }
static u64 rp(u64 addr) { u64 v = 0; return rd(addr, &v, 8) ? v : 0; }
static i32 ri(u64 addr) { i32 v = 0; rd(addr, &v, 4); return v; }

/* Reads a NUL-terminated ASCII string (class names). */
static int rcstr(u64 addr, char *out, int cap) {
    out[0] = 0;
    if (!addr) return 0;
    for (int i = 0; i < cap - 1; i++) {
        char c;
        if (!rd(addr + (u64)i, &c, 1)) { out[i] = 0; return 0; }
        out[i] = c;
        if (!c) return 1;
    }
    out[cap - 1] = 0;
    return 1;
}

/* Class-name check of a managed object: guards every pointer hop. */
static int klass_is(u64 obj, const char *ns, const char *name) {
    char buf[96];
    u64 k = rp(obj + OBJ_KLASS);
    if (!k || !rcstr(rp(k + CLASS_NAME), buf, sizeof buf) || !seq(buf, name)) return 0;
    if (ns && (!rcstr(rp(k + CLASS_NAMESPACE), buf, sizeof buf) || !seq(buf, ns))) return 0;
    return 1;
}
static void klass_name(u64 obj, char *buf, int cap) {
    u64 k = rp(obj + OBJ_KLASS);
    if (!k || !rcstr(rp(k + CLASS_NAME), buf, cap)) { buf[0] = '?'; buf[1] = 0; }
}

/* Managed System.String -> JSON (UTF-16 -> UTF-8), or null. */
static u16 g_wbuf[8192];
static void put_mstring(u64 s) {
    if (!s) { put("null"); return; }
    i32 n = ri(s + STR_LEN);
    if (n < 0 || n > 8000 || !rd(s + STR_CHARS, g_wbuf, (u32)n * 2)) { put("null"); return; }
    putc1('"');
    for (i32 i = 0; i < n; i++) {
        u32 c = g_wbuf[i];
        if (c >= 0xD800 && c <= 0xDBFF && i + 1 < n && g_wbuf[i + 1] >= 0xDC00 && g_wbuf[i + 1] <= 0xDFFF) {
            c = 0x10000 + ((c - 0xD800) << 10) + (g_wbuf[i + 1] - 0xDC00); i++;
        }
        if (c == '"' || c == '\\') { putc1('\\'); putc1((char)c); }
        else if (c < 0x20) { const char *h = "0123456789abcdef"; put("\\u00"); putc1(h[c >> 4]); putc1(h[c & 15]); }
        else if (c < 0x80) putc1((char)c);
        else if (c < 0x800) { putc1((char)(0xC0 | (c >> 6))); putc1((char)(0x80 | (c & 63))); }
        else if (c < 0x10000) { putc1((char)(0xE0 | (c >> 12))); putc1((char)(0x80 | ((c >> 6) & 63))); putc1((char)(0x80 | (c & 63))); }
        else { putc1((char)(0xF0 | (c >> 18))); putc1((char)(0x80 | ((c >> 12) & 63))); putc1((char)(0x80 | ((c >> 6) & 63))); putc1((char)(0x80 | (c & 63))); }
    }
    putc1('"');
}

/* ----------------------------------------------------------- diagnostics */
/* Diagnostics go to their own buffer and are appended as "steps" at the end,
   so data sections can report problems without breaking the JSON nesting. */
static char g_steps[65536];
static u64 g_stepsLen;
static void step(const char *name, int ok, const char *detail, u64 addr) {
    Output *main = g;
    /* reuse the JSON helpers by temporarily redirecting into g_steps */
    Output tmp = *main; tmp.buf = g_steps + g_stepsLen; tmp.cap = sizeof g_steps - g_stepsLen; tmp.len = 0; tmp.overflow = 0;
    g = &tmp;
    put(g_stepsLen ? ",\n    {" : "\n    {");
    put("\"step\":"); putjs(name);
    put(",\"ok\":"); put(ok ? "true" : "false");
    if (detail) { put(",\"detail\":"); putjs(detail); }
    if (addr) { put(",\"address\":"); puthex(addr); }
    put("}");
    g_stepsLen += tmp.len;
    g = main;
    if (g->log) { g->log(ok ? "[OK]   " : "[FAIL] "); g->log(name); if (detail) { g->log(" - "); g->log(detail); } g->log("\n"); }
}

/* Resolve Singleton<T>.sInstance through the GenericClass cached_class slot. */
static u64 singleton_instance2(u64 slotRva, const char *genericName, const char *ns, const char *name, const char *label);
static u64 singleton_instance(u64 slotRva, const char *ns, const char *name, const char *label) {
    return singleton_instance2(slotRva, "Singleton`1", ns, name, label);
}
static u64 singleton_instance2(u64 slotRva, const char *genericName, const char *ns, const char *name, const char *label) {
    char msg[160];
    u64 cls = rp(g->moduleBase + slotRva);
    if (!cls) { step(label, 0, "class not initialised yet (open the character screen, then retry)", 0); return 0; }
    char cname[64];
    if (!rcstr(rp(cls + CLASS_NAME), cname, sizeof cname) || !seq(cname, genericName)) {
        step(label, 0, "Anchor does not point at Singleton`1: game build differs from the analysed one", cls); return 0;
    }
    u64 statics = rp(cls + CLASS_STATIC_FIELDS);
    u64 inst = rp(statics + 0); /* sInstance is the first static field */
    if (!inst || !klass_is(inst, ns, name)) {
        char got[64]; got[0] = 0; if (inst) klass_name(inst, got, sizeof got);
        int n = 0; const char *a = "sInstance is not "; while (*a) msg[n++] = *a++;
        a = name; while (*a && n < 120) msg[n++] = *a++;
        a = " (got "; while (*a && n < 130) msg[n++] = *a++;
        a = got; while (*a && n < 150) msg[n++] = *a++;
        msg[n++] = ')'; msg[n] = 0;
        step(label, 0, msg, inst); return 0;
    }
    step(label, 1, 0, inst);
    return inst;
}

/* Iterate Dictionary<int|uint, object>. Returns entries visited. */
typedef void (*DictVisitor)(u32 key, u64 value, void *user);
static int dict_each(u64 dict, DictVisitor fn, void *user, int limit) {
    u64 entries = rp(dict + DICT_ENTRIES);
    i32 count = ri(dict + DICT_COUNT);
    i32 alen = ri(entries + ARR_LEN);
    if (!entries || count < 0 || count > limit || alen < count) return -1;
    int visited = 0;
    for (i32 i = 0; i < count; i++) {
        u64 e = entries + ARR_DATA + (u64)i * DENTRY_STRIDE_KOBJ;
        u8 raw[DENTRY_STRIDE_KOBJ];
        if (!rd(e, raw, sizeof raw)) continue;
        i32 next = *(i32 *)(raw + 4);
        u64 value = *(u64 *)(raw + DENTRY_VALUE);
        if (next < -1 || !value) continue; /* free-list slot */
        fn(*(u32 *)(raw + DENTRY_KEY), value, user);
        visited++;
    }
    return visited;
}

/* ------------------------------------------------------------ user units */
/* UnitDressEquipInfo, UnitDressInfo and DeckInfo are VALUE TYPES (parent
   System.ValueType). Dictionaries/lists store them inline, so a field at
   registration offset F lives at (struct start + F - 0x10). */
#define EQ_RAW   0x90u   /* sizeof(UnitDressEquipInfo) unboxed */
#define UDI_RAW  0x890u  /* sizeof(UnitDressInfo) unboxed      */
#define DECK_RAW 0x70u   /* sizeof(DeckInfo) unboxed           */
#define SF(off) ((off) - 0x10u)
#define UDI_EQUIPINFO 0x198u /* UnitDressInfo.equipInfo (inline UnitDressEquipInfo) */

static const struct { const char *k; u32 off; } kEqFields[] = {
    {"passiveSkillInfo", 0x20}, {"passiveSkillString", 0x30}, {"freeSkillInfoPassive", 0x48},
    {"equipInfo", 0x18}, {"equipLvInfo", 0x68}, {"magicInfo", 0x28}, {"magicString", 0x38},
    {"freeSkillInfo", 0x40}, {"savedPassiveSkillInfo", 0x58}, {"savedEquipInfo", 0x50}, {"savedMagicInfo", 0x60},
};

/* Emits an inline UnitDressEquipInfo starting at address s. */
static void put_equip(u64 s) {
    put("{\"unitDressId\":"); puti(ri(s + SF(0x10)));
    for (u32 i = 0; i < sizeof kEqFields / sizeof kEqFields[0]; i++) {
        putc1(','); putjs(kEqFields[i].k); putc1(':'); put_mstring(rp(s + SF(kEqFields[i].off)));
    }
    put("}");
}

/* Dictionary<int, struct>: Entry = {int hash; int next; int key; pad; TValue value} */
static u64 vdict_entries(u64 dict, i32 *count, u32 stride) {
    u64 entries = rp(dict + DICT_ENTRIES);
    *count = ri(dict + DICT_COUNT);
    i32 alen = ri(entries + ARR_LEN);
    if (!entries || *count < 0 || *count > 20000 || alen < *count) return 0;
    (void)stride;
    return entries + ARR_DATA;
}

static void put_count_step(const char *name, int n, const char *what, u64 addr) {
    char d[80]; int k = 0; u64 v = (u64)(n < 0 ? 0 : n); char t[24]; int m = 0;
    do { t[m++] = (char)('0' + v % 10); v /= 10; } while (v);
    while (m) d[k++] = t[--m];
    while (*what && k < 78) d[k++] = *what++;
    d[k] = 0;
    step(name, n > 0, d, addr);
}


/* List<int> -> [a,b,...] */
static void put_int_list(u64 list) {
    if (!list) { put("null"); return; }
    u64 items = rp(list + LIST_ITEMS); i32 n = ri(list + LIST_SIZE);
    if (!items || n < 0 || n > 100000) { put("null"); return; }
    putc1('[');
    for (i32 i = 0; i < n; i++) { if (i) putc1(','); puti(ri(items + ARR_DATA + (u64)i * 4)); }
    putc1(']');
}

/* List<struct of int fields>: emits [[f0,f1,..],...] reading `nints` ints per element. */
static int put_struct_int_list(u64 list, u32 stride, u32 nints, const char *label) {
    int written = 0;
    putc1('[');
    if (klass_is(list, "System.Collections.Generic", "List`1")) {
        u64 items = rp(list + LIST_ITEMS); i32 n = ri(list + LIST_SIZE);
        for (i32 i = 0; items && n > 0 && n < 500000 && i < n; i++) {
            u64 e = items + ARR_DATA + (u64)i * stride;
            put(written ? ",[" : "\n    [");
            for (u32 k = 0; k < nints; k++) { if (k) putc1(','); puti(ri(e + 4u * k)); }
            putc1(']'); written++;
        }
    }
    put("\n  ]");
    put_count_step(label, written, " rows", list);
    return written;
}

static void read_units(u64 dm) {
    u64 userInfo = rp(dm + DM_USERINFO);
    put(",\n  \"player\": ");
    if (userInfo && klass_is(userInfo, "World.Data", "UserInfo")) { put("{\"handleName\":"); put_mstring(rp(userInfo + UI_HANDLENAME)); put("}"); }
    else put("null");

    u64 uu = rp(dm + DM_USERUNIT);
    if (!klass_is(uu, "World.Data", "UserUnit")) { step("DataManager.UserUnit", 0, "not a World.Data.UserUnit", uu); put(",\n  \"units\": null,\n  \"decks\": null"); return; }
    step("DataManager.UserUnit", 1, 0, uu);
    u64 pub = rp(uu + UU_PUBLIC);
    if (!klass_is(pub, "World.Data", "PublicUserUnit")) { step("UserUnit.PublicInfo", 0, "not a PublicUserUnit", pub); put(",\n  \"units\": null,\n  \"decks\": null"); return; }
    step("UserUnit.PublicInfo", 1, 0, pub);

    /* 1) Characters: Dictionary<int, UnitDressInfo>, each with inline equipInfo. */
    u64 udiDict = rp(pub + PU_DRESSINFO);
    i32 n = 0; int written = 0;
    u64 base = klass_is(udiDict, "System.Collections.Generic", "Dictionary`2") ? vdict_entries(udiDict, &n, 0x10 + UDI_RAW) : 0;
    put(",\n  \"units\": [");
    for (i32 i = 0; base && i < n; i++) {
        u64 e = base + (u64)i * (0x10 + UDI_RAW);
        if (ri(e + 4) < -1) continue;           /* free slot */
        u64 v = e + 0x10;                         /* inline UnitDressInfo */
        i32 id = ri(v + SF(0x10));
        if (id <= 0) continue;
        put(written ? ",\n    {" : "\n    {"); written++;
        put("\"unitDressId\":"); puti(id);
        put(",\"name\":"); put_mstring(rp(v + SF(0x38)));
        put(",\"typeName\":"); put_mstring(rp(v + SF(0x58)));
        put(",\"lv\":"); puti(ri(v + SF(0x14)));
        put(",\"limitbreakLv\":"); puti(ri(v + SF(0x1C)));
        put(",\"awakeLv\":"); puti(ri(v + SF(0x24)));
        put(",\"characterType\":"); puti(ri(v + SF(0x44)));
        put(",\"baseStats\":{\"hp\":"); puti(ri(v + SF(0x60))); put(",\"mp\":"); puti(ri(v + SF(0x64)));
        put(",\"atk\":"); puti(ri(v + SF(0x68))); put(",\"def\":"); puti(ri(v + SF(0x6C)));
        put(",\"matk\":"); puti(ri(v + SF(0x70))); put(",\"mdef\":"); puti(ri(v + SF(0x74))); put("}");
        put(",\"abilityPieceInfo\":"); put_mstring(rp(v + SF(0x88)));
        put(",\"costGrowthSkill\":"); puti(ri(v + SF(0xA4)));
        put(",\"additionalSkillCost\":"); puti(ri(v + SF(0xAC)));
        put(",\"bonusSkillCostItemUseCount\":"); puti(ri(v + SF(0xB0)));
        put(",\"abilityPassiveIds\":"); put_int_list(rp(v + SF(0x860)));
        put(",\"abilityMagicIds\":"); put_int_list(rp(v + SF(0x858)));
        put(",\"equip\":"); put_equip(v + SF(UDI_EQUIPINFO));
        put("}");
    }
    put("\n  ]");
    put_count_step("PublicUserUnit.UnitDressInfoList", written, " characters read", udiDict);

    /* 2) Cross-check: Dictionary<int, UnitDressEquipInfo> (inline). */
    u64 eqDict = rp(pub + PU_DRESSEQUIP);
    n = 0; written = 0;
    base = klass_is(eqDict, "System.Collections.Generic", "Dictionary`2") ? vdict_entries(eqDict, &n, 0x10 + EQ_RAW) : 0;
    put(",\n  \"equipList\": [");
    for (i32 i = 0; base && i < n; i++) {
        u64 e = base + (u64)i * (0x10 + EQ_RAW);
        if (ri(e + 4) < -1) continue;
        put(written ? ",\n    " : "\n    "); written++;
        put_equip(e + 0x10);
    }
    put("\n  ]");
    put_count_step("PublicUserUnit.UnitDressEquipInfoList", written, " entries", eqDict);

    /* 3) Decks: List<DeckInfo> (inline structs). */
    u64 decks = rp(uu + UU_DECKLIST);
    written = 0;
    put(",\n  \"decks\": [");
    if (klass_is(decks, "System.Collections.Generic", "List`1")) {
        u64 items = rp(decks + LIST_ITEMS); i32 size = ri(decks + LIST_SIZE);
        for (i32 i = 0; items && size > 0 && size < 2000 && i < size; i++) {
            u64 d = items + ARR_DATA + (u64)i * DECK_RAW;
            put(written ? ",\n    {" : "\n    {"); written++;
            put("\"deckType\":"); puti(ri(d + SF(0x10))); put(",\"deckNo\":"); puti(ri(d + SF(0x14)));
            put(",\"name\":"); put_mstring(rp(d + SF(0x18)));
            put(",\"unitInfo\":"); put_mstring(rp(d + SF(0x20)));
            put(",\"unitDressInfo\":"); put_mstring(rp(d + SF(0x78)));
            put(",\"arkInfo\":"); put_mstring(rp(d + SF(0x28)));
            put(",\"arkLv\":"); put_mstring(rp(d + SF(0x48)));
            put(",\"subUnitInfo\":"); put_mstring(rp(d + SF(0x68)));
            put(",\"subArkInfo\":"); put_mstring(rp(d + SF(0x60)));
            put(",\"formationId\":"); puti(ri(d + SF(0x40)));
            put("}");
        }
    }
    put("\n  ]");
    put_count_step("UserUnit.DeckInfoList", written, " decks read", decks);

    /* 4) v0.3: learned passives (UnitID, PassiveSkillID, Ap) and specials (UnitID, SkillID, Lv, Ap). */
    put(",\n  \"learnedPassives\": ");
    put_struct_int_list(rp(uu + 0xD8), 0x0C, 3, "UserUnit.UnitPassiveSkillInfoList");
    put(",\n  \"learnedSkills\": ");
    put_struct_int_list(rp(uu + 0xE0), 0x10, 4, "UserUnit.UnitSkillInfoList");

    /* 5) v0.3: per-unit learning bitmasks: Dictionary<int, UnitLearningSkillInfo> (raw 0x28). */
    {
        u64 ld = rp(uu + 0xD0); i32 cnt = 0; int w = 0;
        u64 b = klass_is(ld, "System.Collections.Generic", "Dictionary`2") ? vdict_entries(ld, &cnt, 0x38) : 0;
        put(",\n  \"learning\": [");
        for (i32 i = 0; b && i < cnt; i++) {
            u64 e = b + (u64)i * 0x38;
            if (ri(e + 4) < -1) continue;
            u64 v = e + 0x10;
            put(w ? ",\n    {" : "\n    {"); w++;
            put("\"unitId\":"); puti(ri(v + SF(0x10)));
            put(",\"skillInfo\":"); put_mstring(rp(v + SF(0x18)));
            put(",\"passiveSkillInfo\":"); put_mstring(rp(v + SF(0x20)));
            put("}");
        }
        put("\n  ]");
        put_count_step("UserUnit.UnitLearningSkillInfoList", w, " units", ld);
    }

    /* 6) v0.3: current form per character: Dictionary<int, UnitInfo> (raw 0xA0). */
    {
        u64 ud = rp(pub + 0x10); i32 cnt = 0; int w = 0;
        u64 b = klass_is(ud, "System.Collections.Generic", "Dictionary`2") ? vdict_entries(ud, &cnt, 0xB0) : 0;
        put(",\n  \"unitCurrent\": [");
        for (i32 i = 0; b && i < cnt; i++) {
            u64 e = b + (u64)i * 0xB0;
            if (ri(e + 4) < -1) continue;
            u64 v = e + 0x10;
            put(w ? ",[" : "\n    ["); w++;
            puti(ri(v + SF(0x10))); putc1(','); puti(ri(v + SF(0x14))); putc1(','); puti(ri(v + SF(0x1C)));
            putc1(','); puti(ri(v + SF(0x20))); putc1(','); puti(ri(v + SF(0x2C)));
            putc1(']');
        }
        put("\n  ]");
        put(",\n  \"unitCurrentColumns\": [\"unitId\",\"unitDressId\",\"level\",\"arkId\",\"arkSlotArkId\"]");
        put_count_step("PublicUserUnit.UnitInfoList", w, " units", ud);
    }
}

/* ------------------------------------------------- v0.11: owned items */
/* Dictionary<int, struct>: entry = {int hash; int next; int key; pad; TValue value(@0x10)}; returns
   the entry array base or 0. `raw` is the unboxed struct size, so the stride is 0x10 + raw. */
static u64 vdict_base(u64 dict, i32 *count, int limit) {
    if (!dict || !klass_is(dict, "System.Collections.Generic", "Dictionary`2")) { *count = 0; return 0; }
    u64 entries = rp(dict + DICT_ENTRIES);
    *count = ri(dict + DICT_COUNT);
    i32 alen = ri(entries + ARR_LEN);
    if (!entries || *count < 0 || *count > limit || alen < *count) { *count = 0; return 0; }
    return entries + ARR_DATA;
}

static void read_items(u64 dm) {
    u64 ui = rp(dm + DM_USERITEM);
    if (!klass_is(ui, "World.Data", "UserItem")) {
        step("DataManager.UserItem", 0, "not a World.Data.UserItem", ui);
        put(",\n  \"crests\": null,\n  \"equipItems\": null,\n  \"arks\": null,\n  \"arkCustomize\": null");
        return;
    }
    step("DataManager.UserItem", 1, 0, ui);

    /* 1) Crest instances with their rolled traits: slots are [rank, maxRank, locked, lotteryNumber, passiveId]. */
    i32 n = 0; int written = 0;
    u64 base = vdict_base(rp(ui + UI_CRESTS), &n, 20000);
    put(",\n  \"crests\": [");
    for (i32 i = 0; base && i < n; i++) {
        u64 e = base + (u64)i * (0x10 + 0x18);
        if (ri(e + 4) < -1) continue;                 /* free slot */
        u64 v = e + 0x10;
        i32 crestId = ri(v);
        if (crestId <= 0) continue;
        put(written ? ",\n    {" : "\n    {"); written++;
        put("\"key\":"); puti(ri(e + 8));
        put(",\"crestId\":"); puti(crestId);
        put(",\"userCrestId\":"); puti(ri(v + 4));
        put(",\"favorite\":"); puti(ri(v + 8));
        put(",\"slots\":[");
        u64 slots = rp(v + 0x10); i32 ns = slots ? ri(slots + ARR_LEN) : 0;
        if (ns < 0 || ns > 16) ns = 0;
        for (i32 s = 0; s < ns; s++) {
            u64 sl = slots + ARR_DATA + (u64)s * 0x14;
            if (s) putc1(',');
            putc1('['); for (u32 k = 0; k < 5; k++) { if (k) putc1(','); puti(ri(sl + 4u * k)); } putc1(']');
        }
        put("]}");
    }
    put("\n  ]");
    put(",\n  \"crestSlotColumns\": [\"rank\",\"maxRank\",\"locked\",\"lotteryNumber\",\"passiveId\"]");
    put_count_step("UserItem.CrestInfoList", written, " crests", rp(ui + UI_CRESTS));

    /* 2) Owned equipment: enhancement level (AlchemyLevel) is per item id. */
    n = 0; written = 0;
    base = vdict_base(rp(ui + UI_EQUIPITEMS), &n, 50000);
    put(",\n  \"equipItems\": [");
    for (i32 i = 0; base && i < n; i++) {
        u64 e = base + (u64)i * (0x10 + 0x20);
        if (ri(e + 4) < -1) continue;
        u64 v = e + 0x10;
        i32 id = ri(v);
        if (id <= 0) continue;
        put(written ? ",[" : "\n    ["); written++;
        puti(id); putc1(','); puti(ri(v + 4)); putc1(','); puti(ri(v + 8)); putc1(','); puti(ri(v + 0xC)); putc1(','); puti(ri(v + 0x10));
        putc1(']');
    }
    put("\n  ]");
    put(",\n  \"equipItemColumns\": [\"itemEquipId\",\"possession\",\"newRecord\",\"alchemyLevel\",\"favorite\"]");
    put_count_step("UserItem.ItemEquipInfoList", written, " equipment ids", rp(ui + UI_EQUIPITEMS));

    /* 3) Arks (聖物): level, purity and skill levels; plus the customisation record. */
    n = 0; written = 0;
    base = vdict_base(rp(ui + UI_ARKINFO), &n, 20000);
    put(",\n  \"arks\": [");
    for (i32 i = 0; base && i < n; i++) {
        u64 e = base + (u64)i * (0x10 + 0x30);
        if (ri(e + 4) < -1) continue;
        u64 v = e + 0x10;
        i32 id = ri(v);
        if (id <= 0) continue;
        put(written ? ",\n    {" : "\n    {"); written++;
        put("\"key\":"); puti(ri(e + 8));
        put(",\"arkId\":"); puti(id); put(",\"lv\":"); puti(ri(v + 4)); put(",\"purity\":"); puti(ri(v + 8));
        put(",\"skillLvInfo\":"); put_mstring(rp(v + 0x18));
        put(",\"newRecord\":"); puti(ri(v + 0x20)); put(",\"favorite\":"); puti((i32)(u8)ri(v + 0x24)); put(",\"iconType\":"); puti(ri(v + 0x28));
        put("}");
    }
    put("\n  ]");
    put_count_step("UserItem.ArkInfoList", written, " arks", rp(ui + UI_ARKINFO));

    n = 0; written = 0;
    base = vdict_base(rp(ui + UI_ARKCUSTOM), &n, 20000);
    put(",\n  \"arkCustomize\": [");
    for (i32 i = 0; base && i < n; i++) {
        u64 e = base + (u64)i * (0x10 + 0x70);
        if (ri(e + 4) < -1) continue;
        u64 v = e + 0x10;
        i32 id = ri(v + 8);
        if (id <= 0) continue;
        put(written ? ",\n    {" : "\n    {"); written++;
        put("\"key\":"); puti(ri(e + 8));
        put(",\"arkId\":"); puti(id); put(",\"arkSkillLv\":"); puti(ri(v + 0xC)); put(",\"arkSkillExp\":"); puti(ri(v + 0x10));
        put(",\"duplicateCount\":"); puti(ri(v + 0x14)); put(",\"extendPointAmount\":"); puti(ri(v + 0x18));
        put(",\"extended\":["); for (u32 k = 0; k < 7; k++) { if (k) putc1(','); puti(ri(v + 0x1C + 4u * k)); } put("]");
        put(",\"skillApExtendedInfo\":"); put_mstring(rp(v + 0x40));
        put(",\"equipOpenCount\":"); puti(ri(v + 0x48));
        put(",\"equipInfo\":"); put_mstring(rp(v + 0x50));
        put(",\"completeFlag\":"); puti(ri(v + 0x58));
        put(",\"arkSkillOffInfo\":"); put_mstring(rp(v + 0x60));
        put(",\"partyTraitLv\":"); puti(ri(v + 0x68));
        put("}");
    }
    put("\n  ]");
    put(",\n  \"arkCustomizeExtendedColumns\": [\"hp\",\"mp\",\"atk\",\"def\",\"matk\",\"mdef\",\"arkSkill\"]");
    put_count_step("UserItem.ArkCustomizeInfoList", written, " arks", rp(ui + UI_ARKCUSTOM));
}

/* --------------------------------------------------------- master sheets */
typedef struct { u64 cls[SHEET_COUNT]; int dumped[SHEET_COUNT]; u32 size[SHEET_COUNT]; int accessors; int listed; } SheetCtx;

static void visit_accessor(u32 key, u64 acc, void *user) {
    SheetCtx *c = user;
    c->accessors++;
    u64 k = rp(acc + OBJ_KLASS);
    char kn[64]; klass_name(acc, kn, sizeof kn);
    u64 bin = rp(acc + ACC_BINARY);
    i32 blen = bin ? ri(bin + ARR_LEN) : -1;
    int matched = -1;
    for (u32 i = 0; i < SHEET_COUNT; i++) if (c->cls[i] && k == c->cls[i]) matched = (int)i;
    if (c->listed < 400) {
        put(c->listed ? ",\n    {" : "\n    {"); c->listed++;
        put("\"key\":"); putu(key); put(",\"class\":"); putjs(kn); put(",\"klass\":"); puthex(k);
        put(",\"binaryBytes\":"); puti(blen);
        if (matched >= 0) { put(",\"sheet\":"); putjs(kSheets[matched].name); }
        put("}");
    }
    if (matched < 0 || c->dumped[matched] || blen <= 0 || (u64)blen > g->scratchCap) return;
    if (!rd(bin + ARR_DATA, g->scratch, (u32)blen)) return;
    char fname[64]; int j = 0; const char *s = kSheets[matched].name; while (*s) fname[j++] = *s++;
    s = ".bin"; while (*s) fname[j++] = *s++; fname[j] = 0;
    if (g->writeFile(g->ctx, fname, g->scratch, (u32)blen)) { c->dumped[matched] = 1; c->size[matched] = (u32)blen; }
}

/* ConcurrentDictionary<uint, object>: _tables +0x10 -> Tables._buckets +0x10 (Node[]);
   Node<uint,object>: _key +0x10, _value +0x18, _next +0x20. */
static int cdict_each(u64 cd, DictVisitor fn, void *user) {
    u64 tables = rp(cd + 0x10);
    u64 buckets = rp(tables + 0x10);
    i32 nb = ri(buckets + ARR_LEN);
    if (!buckets || nb <= 0 || nb > 1000000) return -1;
    int visited = 0;
    for (i32 i = 0; i < nb; i++) {
        u64 node = rp(buckets + ARR_DATA + (u64)i * 8);
        for (int guard = 0; node && guard < 10000; guard++) {
            u32 key = (u32)ri(node + 0x10);
            u64 val = rp(node + 0x18);
            if (val) { fn(key, val, user); visited++; }
            node = rp(node + 0x20);
        }
    }
    return visited;
}

static void read_sheets(void) {
    SheetCtx c; mset(&c, 0, sizeof c);
    for (u32 i = 0; i < SHEET_COUNT; i++) c.cls[i] = rp(g->moduleBase + kSheets[i].rva);
    u64 mm = singleton_instance(RVA_SINGLETON_MASTERMANAGER_CACHED, "World.Master", "MasterManager", "Singleton<MasterManager>.sInstance");
    u64 set = mm ? rp(mm + MM_MASTERSET) : 0;
    char setName[64]; setName[0] = 0; if (set) klass_name(set, setName, sizeof setName);
    put(",\n  \"masterSetClass\": "); putjs(setName);
    put(",\n  \"accessors\": [");
    int total = 0;
    /* (a) MasterSet.lazyAccessorManager : Dictionary<uint, object> */
    if (set && seq(setName, "MasterSet")) {
        u64 d = rp(set + MS_ACCESSORS);
        if (d && klass_is(d, "System.Collections.Generic", "Dictionary`2")) {
            int n = dict_each(d, visit_accessor, &c, 100000);
            step("MasterSet.lazyAccessorManager", n >= 0, n >= 0 ? 0 : "dictionary unreadable", d);
            if (n > 0) total += n;
        } else step("MasterSet.lazyAccessorManager", 0, d ? "not a Dictionary`2" : "null (not used by this build)", d);
    }
    /* (b) BaseMasterSet.accessorManager -> AccessorManager.accessors : ConcurrentDictionary */
    if (set) {
        u64 am = rp(set + 0x18);
        if (am && klass_is(am, "Aidis.BinarySheet", "AccessorManager")) {
            u64 cd = rp(am + 0x10);
            int n = (cd && klass_is(cd, "System.Collections.Concurrent", "ConcurrentDictionary`2")) ? cdict_each(cd, visit_accessor, &c) : -1;
            step("AccessorManager.accessors", n > 0, n >= 0 ? 0 : "ConcurrentDictionary unreadable", cd);
            if (n > 0) total += n;
        } else step("BaseMasterSet.accessorManager", 0, am ? "not an AccessorManager" : "null", am);
    }
    put("\n  ]");
    put(",\n  \"masterSheets\": [");
    int dumped = 0;
    for (u32 i = 0; i < SHEET_COUNT; i++) {
        put(i ? ",\n    {" : "\n    {");
        put("\"name\":"); putjs(kSheets[i].name);
        put(",\"classResolved\":"); put(c.cls[i] ? "true" : "false");
        put(",\"dumped\":"); put(c.dumped[i] ? "true" : "false");
        if (c.dumped[i]) { dumped++; put(",\"file\":\""); put(kSheets[i].name); put(".bin\",\"bytes\":"); putu(c.size[i]); }
        put("}");
    }
    put("\n  ]");
    put_count_step("Master sheets dumped", dumped, " of 38 target sheets", 0);
    (void)total;
}


/* ------------------------------------------------ v0.4: open character page */
#define RVA_UIUNITDETAIL_PAGEBASE_CACHED 0x772CD28ull /* UISingletonPageBase<UIUnitDetail> */
static u64 tmp_text(u64 tmp) { return tmp ? rp(tmp + 0xE0) : 0; } /* TMP_Text.m_text */
static void put_int_array(u64 arr) {
    i32 n = arr ? ri(arr + ARR_LEN) : -1;
    if (!arr || n < 0 || n > 1000) { put("null"); return; }
    putc1('[');
    for (i32 i = 0; i < n; i++) { if (i) putc1(','); puti(ri(arr + ARR_DATA + (u64)i * 4)); }
    putc1(']');
}
static void put_enhance(u64 s) { /* inline UIUnitDressEnhanceParameter */
    put("{\"status\":"); put_int_array(rp(s + SF(0x10)));
    put(",\"resistElements\":"); put_int_array(rp(s + SF(0x18)));
    put(",\"resistBadstatus\":"); put_int_array(rp(s + SF(0x20)));
    put(",\"magicCostMaxLimit\":"); puti(ri(s + SF(0x28)));
    put(",\"skillCostMaxLimit\":"); puti(ri(s + SF(0x2C)));
    put("}");
}
#define RVA_UIUNITDETAIL_TYPEINFO 0x751FFD8ull /* TypeInfo cell of World.UI.Unit.UIUnitDetail */
/* Heap scan: objects whose klass == UIUnitDetail; prefer a live Unity object
   (m_CachedPtr at +0x10 non-null) whose myUnitData is a UIUnitData. */
static char g_diag[16384]; static u64 g_diagLen; static int g_diagN;
static void dput(const char *t) { while (*t && g_diagLen + 1 < sizeof g_diag) g_diag[g_diagLen++] = *t++; }
static void dputu(u64 v) { char t[24]; int n = 0; do { t[n++] = (char)('0' + v % 10); v /= 10; } while (v); while (n && g_diagLen + 1 < sizeof g_diag) g_diag[g_diagLen++] = t[--n]; }
static void dputh(u64 v) { const char *h = "0123456789abcdef"; char t[18]; int n = 0; do { t[n++] = h[v & 15]; v >>= 4; } while (v); dput("\"0x"); while (n && g_diagLen + 1 < sizeof g_diag) g_diag[g_diagLen++] = t[--n]; dput("\""); }
static void diag_candidate(u64 obj) {
    if (g_diagN >= 40) return;
    char kn[64]; u64 ud = rp(obj + 0x4B0); kn[0] = 0; if (ud) klass_name(ud, kn, sizeof kn);
    dput(g_diagN ? ",\n      {" : "\n      {"); g_diagN++;
    dput("\"addr\":"); dputh(obj); dput(",\"cached\":"); dputh(rp(obj + 0x10));
    dput(",\"curDressId\":"); dputu((u64)(u32)ri(obj + 0xD48)); dput(",\"curCharacterId\":"); dputu((u64)(u32)ri(obj + 0xD4C));
    dput(",\"myUnitData\":"); dputh(ud); dput(",\"myUnitDataClass\":\"");
    for (char *c = kn; *c; c++) if ((unsigned char)*c >= 0x20 && (unsigned char)*c < 0x7F && *c != '"' && *c != '\\') { char b[2] = {*c, 0}; dput(b); }
    dput("\",\"descTabs\":"); dputh(rp(obj + 0x348)); dput("}");
}
static u64 find_page_by_scan(u64 klass, int *candidates) {
    *candidates = 0; g_diagLen = 0; g_diagN = 0;
    if (!g->nextRegion || !g->scratch || !klass) return 0;
    u64 best = 0, bestScore = 0, addr = 0x10000, scanned = 0;
    const u64 chunk = 16ull << 20;
    while (scanned < (6ull << 30)) {
        u64 size = 0, base = g->nextRegion(g->ctx, addr, &size);
        if (!base || !size) break;
        addr = base + size;
        for (u64 off = 0; off < size; off += chunk) {
            u64 n = size - off < chunk ? size - off : chunk;
            if (n > g->scratchCap) n = g->scratchCap;
            if (!rd(base + off, g->scratch, (u32)n)) {
                for (u64 p = 0; p < n; p += 0x10000) {
                    u64 m = n - p < 0x10000 ? n - p : 0x10000;
                    if (!rd(base + off + p, g->scratch + p, (u32)m)) mset(g->scratch + p, 0, m);
                }
            }
            scanned += n;
            for (u64 i = 0; i + 8 <= n; i += 8) {
                if (*(u64 *)(g->scratch + i) != klass) continue;
                u64 obj = base + off + i;
                (*candidates)++;
                /* score: live native object, UIUnitData-named data, plausible ids, tabs present */
                u64 score = 0;
                u64 ud = rp(obj + 0x4B0);
                char kn[64]; kn[0] = 0; if (ud) klass_name(ud, kn, sizeof kn);
                i32 did = ri(obj + 0xD48), cid = ri(obj + 0xD4C);
                if (rp(obj + 0x10)) score += 8;
                if (seq(kn, "UIUnitData")) score += 4;
                if (did > 0 && did < 100000000) score += 2;
                if (cid > 0 && cid < 100000000) score += 1;
                if (rp(obj + 0x348)) score += 1;
                if (score >= 8) diag_candidate(obj);
                if (score > bestScore) { bestScore = score; best = obj; }
            }
        }
    }
    return bestScore >= 12 ? best : 0;
}
static void read_current_page(void) {
    put(",\n  \"currentCharacter\": ");
    u64 page = 0;
    {
        u64 pb = rp(g->moduleBase + RVA_UIUNITDETAIL_PAGEBASE_CACHED);
        u64 st = pb ? rp(pb + CLASS_STATIC_FIELDS) : 0;
        u64 inst = st ? rp(st) : 0;
        if (inst && klass_is(inst, "World.UI.Unit", "UIUnitDetail")) { page = inst; step("UIUnitDetail via page singleton", 1, 0, inst); }
    }
    if (!page) {
        u64 k = rp(g->moduleBase + RVA_UIUNITDETAIL_TYPEINFO);
        char kn[64]; kn[0] = 0; if (k && !(k & 1)) rcstr(rp(k + CLASS_NAME), kn, sizeof kn);
        if (!k || (k & 1) || !seq(kn, "UIUnitDetail")) { step("UIUnitDetail class", 0, "class not loaded yet (open a character detail page first)", k); put("null"); return; }
        int cands = 0;
        page = find_page_by_scan(k, &cands);
        char msg[64]; int m = 0; const char *t = "candidates seen: "; while (*t) msg[m++] = *t++;
        { char tb[16]; int q = 0; u64 v = (u64)cands; do { tb[q++] = (char)('0' + v % 10); v /= 10; } while (v); while (q) msg[m++] = tb[--q]; }
        msg[m] = 0;
        step("UIUnitDetail via memory scan", page != 0, msg, page);
        if (!page) { put("null"); return; }
    }
    put("{\"curDressId\":"); puti(ri(page + 0xD48));
    put(",\"curCharacterId\":"); puti(ri(page + 0xD4C));
    u64 ud = rp(page + 0x4B0);
    if (ud && klass_is(ud, "World.UI.Data", "UIUnitData")) {
        put(",\"unitData\":{\"skillCost\":"); puti(ri(ud + 0x40));
        put(",\"magicCost\":"); puti(ri(ud + 0x44));
        put(",\"nowDressId\":"); puti(ri(ud + 0x48));
        put(",\"numLearnedMagics\":"); puti(ri(ud + 0x144));
        put(",\"numLearnedPassives\":"); puti(ri(ud + 0x148));
        put(",\"equippedAutoSkills\":"); put_int_list(rp(ud + 0x88));
        put(",\"equippedMagics\":"); put_int_list(rp(ud + 0x80));
        put("}");
        step("UIUnitDetail.myUnitData", 1, 0, ud);
    } else step("UIUnitDetail.myUnitData", 0, "not a UIUnitData", ud);
    u64 di = page + 0x4B8; /* inline UnitDressInfo */
    put(",\"dressInfo\":{\"unitDressId\":"); puti(ri(di + SF(0x10)));
    put(",\"lv\":"); puti(ri(di + SF(0x14)));
    put(",\"hp\":"); puti(ri(di + SF(0x60))); put(",\"mp\":"); puti(ri(di + SF(0x64)));
    put(",\"atk\":"); puti(ri(di + SF(0x68))); put(",\"def\":"); puti(ri(di + SF(0x6C)));
    put(",\"matk\":"); puti(ri(di + SF(0x70))); put(",\"mdef\":"); puti(ri(di + SF(0x74)));
    put(",\"vit\":"); puti(ri(di + SF(0x78)));
    put(",\"costGrowthSkill\":"); puti(ri(di + SF(0xA4)));
    put(",\"additionalSkillCost\":"); puti(ri(di + SF(0xAC)));
    put("}");
    put(",\"abilityStatusParameter\":"); put_enhance(page + 0x410);
    put(",\"equipStatusParameter\":"); put_enhance(page + 0x450);
    /* Summary tab: displayed stat panel and SC */
    u64 tabs = rp(page + 0x348);
    u64 descs = tabs ? rp(tabs + 0x78) : 0;
    i32 nd = descs ? ri(descs + ARR_LEN) : 0;
    int found = 0;
    for (i32 i = 0; nd > 0 && nd < 32 && i < nd && !found; i++) {
        u64 d = rp(descs + ARR_DATA + (u64)i * 8);
        if (!d || !klass_is(d, "World.UI.Unit", "UIUnitDetailDescriptionSummary")) continue;
        found = 1;
        put(",\"summary\":{\"unitDressId\":"); puti(ri(d + 0xC0));
        u64 sp = rp(d + 0x98); u64 vals = sp ? rp(sp + 0x58) : 0; i32 nv = vals ? ri(vals + ARR_LEN) : 0;
        put(",\"statusPanel\":[");
        for (i32 k = 0; nv > 0 && nv < 32 && k < nv; k++) {
            u64 sv = rp(vals + ARR_DATA + (u64)k * 8);
            if (k) putc1(',');
            put("{\"base\":"); puti(ri(sv + 0x48)); put(",\"diff\":"); puti(ri(sv + 0x4C));
            put(",\"text\":"); put_mstring(tmp_text(rp(sv + 0x28))); put("}");
        }
        put("]");
        u64 sc = rp(d + 0xA8);
        put(",\"skillCostText\":"); put_mstring(sc ? tmp_text(rp(sc + 0x58)) : 0);
        put(",\"bonusSkillCostText\":"); put_mstring(sc ? tmp_text(rp(sc + 0x60)) : 0);
        put(",\"bonusSkillCost\":"); puti(sc ? ri(sc + 0x78) : 0);
        put("}");
    }
    step("UIUnitDetail summary tab", found, found ? 0 : "summary tab not created yet (open the status tab once)", tabs);
    put("}");
}

/* ------------------------------------------------------------------ entry */

/* ------------------------------------------------ v0.9: Lua script dump */
/* World.Battle.Common.LuaGlobal / ScriptManager TypeInfo cells and field offsets
   (global-metadata field layout of the analysed build). Scripts are only
   present while a battle is loaded; outside battle the dictionary is empty. */
#define RVA_LUAGLOBAL_TYPEINFO     0x7516190ull
#define RVA_SCRIPTMANAGER_TYPEINFO 0x757CBD0ull
#define LG_S_INSTANCE      0x00 /* static LuaGlobal.Instance */
#define LG_SCRIPTMNG       0x40 /* LuaGlobal.ScriptMng */
#define SM_SCRIPTLIST      0x10 /* ScriptManager.scriptList : Dictionary<string, sbyte[]> */
#define SM_S_PROCESS_LUA   0x18 /* static ScriptManager.PROCESS_LUA */
#define SM_S_CONDITION_LUA 0x20 /* static ScriptManager.CONDITION_LUA */
#define SM_S_LIBS          0x28 /* static ScriptManager.libs : string[] */
#define SDENTRY_STRIDE     0x18 /* Entry<string, sbyte[]>: hash@0 next@4 key@8 value@16 */
#define LUA_MAX_SCRIPT     (16u << 20)

static int mstr_ascii(u64 s, char *out, int cap) { /* Il2Cpp string -> ASCII (non-ASCII -> '_') */
    i32 n = s ? ri(s + STR_LEN) : 0; int o = 0;
    if (!s || n < 0 || n > 512) { out[0] = 0; return 0; }
    for (i32 i = 0; i < n && o + 1 < cap; i++) { u16 c = 0; rd(s + STR_CHARS + (u64)i * 2, &c, 2); out[o++] = (c >= 0x20 && c < 0x7F) ? (char)c : '_'; }
    out[o] = 0; return 1;
}
static void put_mstring_list(u64 arr) { /* string[] */
    put("[");
    i32 n = arr ? ri(arr + ARR_LEN) : 0; if (n < 0 || n > 64) n = 0;
    for (i32 i = 0; i < n; i++) { if (i) put(","); put_mstring(rp(arr + ARR_DATA + (u64)i * 8)); }
    put("]");
}
static void read_lua_scripts(void) {
    put(",\n  \"luaScripts\": {");
    u64 lgClass = rp(g->moduleBase + RVA_LUAGLOBAL_TYPEINFO), smClass = rp(g->moduleBase + RVA_SCRIPTMANAGER_TYPEINFO);
    char kn[64]; kn[0] = 0;
    if (lgClass) rcstr(rp(lgClass + CLASS_NAME), kn, sizeof kn);
    int lgOk = lgClass && seq(kn, "LuaGlobal");
    kn[0] = 0; if (smClass) rcstr(rp(smClass + CLASS_NAME), kn, sizeof kn);
    int smOk = smClass && seq(kn, "ScriptManager");
    step("LuaGlobal TypeInfo", lgOk, lgOk ? 0 : "class cell empty or renamed (game never entered battle, or build changed)", lgClass);
    step("ScriptManager TypeInfo", smOk, smOk ? 0 : "class cell empty or renamed", smClass);
    u64 smStatic = smOk ? rp(smClass + CLASS_STATIC_FIELDS) : 0;
    put("\n    \"processKey\": "); put_mstring(smStatic ? rp(smStatic + SM_S_PROCESS_LUA) : 0);
    put(",\n    \"conditionKey\": "); put_mstring(smStatic ? rp(smStatic + SM_S_CONDITION_LUA) : 0);
    put(",\n    \"libraries\": "); put_mstring_list(smStatic ? rp(smStatic + SM_S_LIBS) : 0);
    u64 lgStatic = lgOk ? rp(lgClass + CLASS_STATIC_FIELDS) : 0;
    u64 global = lgStatic ? rp(lgStatic + LG_S_INSTANCE) : 0;
    u64 manager = global && klass_is(global, "World.Battle.Common", "LuaGlobal") ? rp(global + LG_SCRIPTMNG) : 0;
    u64 dict = manager && klass_is(manager, "World.Battle.Common", "ScriptManager") ? rp(manager + SM_SCRIPTLIST) : 0;
    int dictOk = dict && klass_is(dict, "System.Collections.Generic", "Dictionary`2");
    step("LuaGlobal.Instance.ScriptMng.scriptList", dictOk, dictOk ? 0 : (!global ? "LuaGlobal.Instance is null: enter a battle first" : !manager ? "ScriptMng is null" : "scriptList is not a Dictionary`2"), dict);
    put(",\n    \"entries\": [");
    int total = 0, saved = 0;
    if (dictOk) {
        u64 entries = rp(dict + DICT_ENTRIES); i32 count = ri(dict + DICT_COUNT);
        i32 capacity = entries ? ri(entries + ARR_LEN) : 0;
        if (count < 0 || count > 4096 || capacity < count) count = 0;
        for (i32 i = 0; i < count; i++) {
            u64 row = entries + ARR_DATA + (u64)i * SDENTRY_STRIDE;
            i32 hash = ri(row); u64 key = rp(row + 8), value = rp(row + 16);
            if (hash < 0 || !key || !klass_is(key, "System", "String")) continue; /* free slot */
            char name[128]; mstr_ascii(key, name, sizeof name);
            put(total ? ",\n      {" : "\n      {"); total++;
            put("\"key\": "); put_mstring(key);
            const char *state = "not_loaded"; u32 len = 0;
            if (value) {
                i32 n = ri(value + ARR_LEN);
                if (n <= 0 || (u32)n > LUA_MAX_SCRIPT || (u64)n > g->scratchCap || !g->scratch) state = "script_bounds_invalid";
                else if (!rd(value + ARR_DATA, g->scratch, (u32)n)) state = "script_unreadable";
                else {
                    char file[160]; int o = 0; const char *pre = "LuaScript_";
                    while (*pre) file[o++] = *pre++;
                    for (int k = 0; name[k] && o < 140; k++) { char c = name[k]; int okc = (c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c == '_' || c == '-' || c == '.'; file[o++] = okc ? c : '_'; }
                    const char *ext = ".lua"; while (*ext) file[o++] = *ext++; file[o] = 0;
                    if (g->writeFile(g->ctx, file, g->scratch, (u32)n)) { state = "ok"; len = (u32)n; saved++; put(",\"file\": "); putjs(file); }
                    else state = "write_failed";
                }
            }
            put(",\"bytes\": "); putu(len); put(",\"state\": "); putjs(state); put("}");
        }
    }
    put("\n    ],\n    \"dictionaryCount\": "); puti(total); put(",\n    \"saved\": "); puti(saved);
    put("\n  }");
    put_count_step("Lua scripts saved", saved, " scripts from the battle script cache", dict);
}

int loadout_run(Output *o) {
    g = o; g_stepsLen = 0;
    put("{\n  \"tool\": \"LastCloudiaLoadoutReader\",\n  \"version\": \"0.11\",");
    put("\n  \"note\": \"read-only snapshot of the player's own out-of-battle data; raw game strings are kept verbatim\",");
    put("\n  \"moduleBase\": "); puthex(o->moduleBase);

    u32 ts = 0; i32 lfanew = ri(o->moduleBase + 0x3C);
    rd(o->moduleBase + (u64)lfanew + 8, &ts, 4);
    step("GameAssembly build check", ts == EXPECTED_TIMESTAMP,
         ts == EXPECTED_TIMESTAMP ? "TimeDateStamp matches the analysed build" : "TimeDateStamp differs: game was updated, anchors may be stale", 0);

    int unitsOk = 0;
    u64 dm = singleton_instance(RVA_SINGLETON_DATAMANAGER_CACHED, "World.Data", "DataManager", "Singleton<DataManager>.sInstance");
    if (dm) { read_units(dm); read_items(dm); unitsOk = 1; }
    else put(",\n  \"player\": null,\n  \"units\": null,\n  \"decks\": null,\n  \"crests\": null,\n  \"equipItems\": null,\n  \"arks\": null,\n  \"arkCustomize\": null");
    read_current_page();
    put(",\n  \"pageScanDiagnostics\": ["); for (u64 z = 0; z < g_diagLen; z++) putc1(g_diag[z]); put("\n  ]");
    read_sheets();
    read_lua_scripts();

    put(",\n  \"steps\": [");
    for (u64 i = 0; i < g_stepsLen; i++) putc1(g_steps[i]);
    put("\n  ],\n  \"overflow\": "); put(o->overflow ? "true" : "false");
    put("\n}\n");
    return unitsOk && !o->overflow;
}
