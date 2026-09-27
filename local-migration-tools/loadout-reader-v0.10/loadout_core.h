#ifndef LOADOUT_CORE_H
#define LOADOUT_CORE_H
typedef unsigned char u8;
typedef unsigned short u16;
typedef unsigned int u32;
typedef int i32;
typedef unsigned long long u64;
typedef long long i64;

typedef struct Output {
    char *buf; u64 cap; u64 len; int overflow;
    u64 moduleBase;                                   /* GameAssembly.dll base */
    void *ctx;
    int (*read)(void *ctx, u64 addr, void *dst, u32 n);  /* read-only */
    int (*writeFile)(void *ctx, const char *name, const void *data, u32 n);
    void (*log)(const char *utf8);
    u8 *scratch; u64 scratchCap;
    /* next committed read-write private region at or after addr; returns 0 when none */
    u64 (*nextRegion)(void *ctx, u64 addr, u64 *size);                      /* for master-sheet dumps */
} Output;

int loadout_run(Output *o);
#endif
