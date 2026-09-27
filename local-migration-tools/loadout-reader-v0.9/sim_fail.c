#include <stdio.h>
#include <string.h>
#include "loadout_core.h"
static unsigned char mod[0x7700000];
static int rd(void*c,u64 a,void*d,u32 n){(void)c;if(a<0x180000000ull||a+n>0x180000000ull+sizeof mod)return 0;memcpy(d,mod+(a-0x180000000ull),n);return 1;}
static int wf(void*c,const char*n,const void*d,u32 s){(void)c;(void)n;(void)d;(void)s;return 1;}
static void lg(const char*s){fputs(s,stderr);}
int main(void){ static char out[1<<16]; Output o={0};o.buf=out;o.cap=sizeof out;o.moduleBase=0x180000000ull;o.read=rd;o.writeFile=wf;o.log=lg;
 *(unsigned*)(mod+0x3C)=0x100;*(unsigned*)(mod+0x108)=0x12345678; /* updated game, singletons not initialised */
 int ok=loadout_run(&o); fwrite(out,1,o.len,stdout); fprintf(stderr,"ok=%d\n",ok); return 0;}
