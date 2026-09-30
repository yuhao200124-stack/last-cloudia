/*
 * Windows front-end. No C runtime; only the kernel32 calls declared below.
 * Access rights requested: PROCESS_QUERY_INFORMATION | PROCESS_VM_READ.
 * The program never writes to, injects into, or suspends the game process.
 */
#include "loadout_core.h"

typedef void *HANDLE; typedef unsigned long DWORD; typedef int BOOL; typedef unsigned short WCHAR;
typedef unsigned long long SIZE_T;
#define WINAPI __stdcall
#define IMP __declspec(dllimport)
#define INVALID_HANDLE_VALUE ((HANDLE)(long long)-1)
#define TH32CS_SNAPPROCESS 0x2
#define TH32CS_SNAPMODULE 0x8
#define TH32CS_SNAPMODULE32 0x10
#define PROCESS_VM_READ 0x10
#define PROCESS_QUERY_INFORMATION 0x400
#define GENERIC_WRITE 0x40000000
#define CREATE_ALWAYS 2
#define FILE_ATTRIBUTE_NORMAL 0x80

typedef struct { DWORD dwSize, cntUsage, th32ProcessID; unsigned long long th32DefaultHeapID; DWORD th32ModuleID, cntThreads, th32ParentProcessID; long pcPriClassBase; DWORD dwFlags; WCHAR szExeFile[260]; } PROCESSENTRY32W;
typedef struct { DWORD dwSize, th32ModuleID, th32ProcessID, GlblcntUsage, ProccntUsage; unsigned char *modBaseAddr; DWORD modBaseSize; HANDLE hModule; WCHAR szModule[256]; WCHAR szExePath[260]; } MODULEENTRY32W;

IMP HANDLE WINAPI GetStdHandle(DWORD);
IMP BOOL WINAPI WriteFile(HANDLE, const void *, DWORD, DWORD *, void *);
IMP BOOL WINAPI WriteConsoleW(HANDLE, const void *, DWORD, DWORD *, void *);
IMP int WINAPI MultiByteToWideChar(unsigned, DWORD, const char *, int, WCHAR *, int);
IMP void WINAPI ExitProcess(unsigned);
IMP HANDLE WINAPI CreateToolhelp32Snapshot(DWORD, DWORD);
IMP BOOL WINAPI Process32FirstW(HANDLE, PROCESSENTRY32W *);
IMP BOOL WINAPI Process32NextW(HANDLE, PROCESSENTRY32W *);
IMP BOOL WINAPI Module32FirstW(HANDLE, MODULEENTRY32W *);
IMP BOOL WINAPI Module32NextW(HANDLE, MODULEENTRY32W *);
IMP HANDLE WINAPI OpenProcess(DWORD, BOOL, DWORD);
IMP BOOL WINAPI ReadProcessMemory(HANDLE, const void *, void *, SIZE_T, SIZE_T *);
IMP BOOL WINAPI CloseHandle(HANDLE);
IMP HANDLE WINAPI CreateFileW(const WCHAR *, DWORD, DWORD, void *, DWORD, DWORD, HANDLE);
IMP void *WINAPI VirtualAlloc(void *, SIZE_T, DWORD, DWORD);
typedef struct { unsigned long long BaseAddress, AllocationBase; DWORD AllocationProtect; DWORD pad0; unsigned long long RegionSize; DWORD State, Protect, Type, pad1; } MBI64;
IMP SIZE_T WINAPI VirtualQueryEx(HANDLE, const void *, MBI64 *, SIZE_T);

/* Freestanding helpers the compiler may emit calls to. */
void *memset(void *d, int c, SIZE_T n) { unsigned char *p = d; while (n--) *p++ = (unsigned char)c; return d; }
void *memcpy(void *d, const void *s, SIZE_T n) { unsigned char *a = d; const unsigned char *b = s; while (n--) *a++ = *b++; return d; }
int _fltused;

static HANDLE gProc;
static int rpm(void *ctx, u64 addr, void *dst, u32 n) {
    (void)ctx; SIZE_T got = 0;
    return ReadProcessMemory(gProc, (const void *)addr, dst, n, &got) && got == n;
}
/* Committed, private, plain read-write regions only (the managed heap). */
static u64 next_region(void *ctx, u64 addr, u64 *size) {
    (void)ctx; MBI64 m;
    while (addr < 0x7FFFFFFF0000ull) {
        memset(&m, 0, sizeof m);
        if (VirtualQueryEx(gProc, (const void *)addr, &m, sizeof m) != sizeof m) return 0;
        u64 next = m.BaseAddress + m.RegionSize;
        if (next <= addr) return 0;
        if (m.State == 0x1000 /*MEM_COMMIT*/ && m.Type == 0x20000 /*MEM_PRIVATE*/ && m.Protect == 0x04 /*PAGE_READWRITE*/) { *size = m.RegionSize; return m.BaseAddress; }
        addr = next;
    }
    return 0;
}
static int wfile(void *ctx, const char *name, const void *data, u32 n) {
    (void)ctx; WCHAR w[128]; int i = 0;
    for (; name[i] && i < 127; i++) w[i] = (WCHAR)(unsigned char)name[i];
    w[i] = 0;
    HANDLE h = CreateFileW(w, GENERIC_WRITE, 0, 0, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, 0);
    if (h == INVALID_HANDLE_VALUE) return 0;
    DWORD wr = 0; BOOL ok = WriteFile(h, data, n, &wr, 0) && wr == n;
    CloseHandle(h);
    return ok;
}
static void say(const char *utf8) {
    static WCHAR w[2048];
    int n = MultiByteToWideChar(65001, 0, utf8, -1, w, 2047);
    DWORD d; if (n > 1) WriteConsoleW(GetStdHandle((DWORD)-11), w, (DWORD)(n - 1), &d, 0);
}
static int wieq(const WCHAR *a, const char *b) {
    for (; *a && *b; a++, b++) { WCHAR x = *a, y = (WCHAR)*b; if (x >= 'A' && x <= 'Z') x += 32; if (y >= 'A' && y <= 'Z') y += 32; if (x != y) return 0; }
    return *a == 0 && *b == 0;
}

static char gOut[32u << 20];

void mainCRTStartup(void) {
    say("Last Cloudia Loadout Reader v0.12 (只读)\n提示：在战斗中运行可额外导出游戏 Lua 脚本（LuaScript_*.lua）。\n");
    DWORD pid = 0;
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    PROCESSENTRY32W pe; memset(&pe, 0, sizeof pe); pe.dwSize = sizeof pe;
    if (snap != INVALID_HANDLE_VALUE && Process32FirstW(snap, &pe)) {
        do { if (wieq(pe.szExeFile, "LastCloudia.exe")) { pid = pe.th32ProcessID; break; } } while (Process32NextW(snap, &pe));
    }
    if (snap != INVALID_HANDLE_VALUE) CloseHandle(snap);
    if (!pid) { say("找不到 LastCloudia.exe。请先启动游戏并进入角色页面。\n"); ExitProcess(2); }

    u64 base = 0;
    snap = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE | TH32CS_SNAPMODULE32, pid);
    MODULEENTRY32W me; memset(&me, 0, sizeof me); me.dwSize = sizeof me;
    if (snap != INVALID_HANDLE_VALUE && Module32FirstW(snap, &me)) {
        do { if (wieq(me.szModule, "GameAssembly.dll")) { base = (u64)me.modBaseAddr; break; } } while (Module32NextW(snap, &me));
    }
    if (snap != INVALID_HANDLE_VALUE) CloseHandle(snap);
    if (!base) { say("找不到 GameAssembly.dll 模块。\n"); ExitProcess(3); }

    gProc = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, pid);
    if (!gProc) { say("无法以只读权限打开游戏进程。\n"); ExitProcess(4); }

    Output o; memset(&o, 0, sizeof o);
    o.buf = gOut; o.cap = sizeof gOut; o.moduleBase = base;
    o.read = rpm; o.writeFile = wfile; o.log = say; o.nextRegion = next_region;
    o.scratchCap = 64u << 20;
    o.scratch = VirtualAlloc(0, o.scratchCap, 0x3000, 0x04);
    if (!o.scratch) o.scratchCap = 0;

    int ok = loadout_run(&o);
    CloseHandle(gProc);
    if (!wfile(0, "LoadoutReport.json", o.buf, (u32)o.len)) { say("写入 LoadoutReport.json 失败。\n"); ExitProcess(5); }
    say(ok ? "\n已保存 LoadoutReport.json（以及 *.bin 主数据表、LuaScript_*.lua 脚本）。\n"
           : "\n部分读取失败，诊断信息已写入 LoadoutReport.json，请把它发回。\n");
    ExitProcess(ok ? 0 : 1);
}
