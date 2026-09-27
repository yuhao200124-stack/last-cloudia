/* Linux harness: fake process memory laid out exactly as the analysed build. */
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <assert.h>
#include "loadout_core.h"
#define BASE 0x180000000ull
#define HEAP 0x200000000ull
static unsigned char mod[0x7800000]; static unsigned char heap[1<<20]; static u64 hp=0x100;
static void *at(u64 a){ if(a>=BASE&&a<BASE+sizeof mod) return mod+(a-BASE); if(a>=HEAP&&a<HEAP+sizeof heap) return heap+(a-HEAP); return 0; }
static int rd(void*c,u64 a,void*d,u32 n){(void)c; void*p=at(a); void*q=at(a+n-1); if(!p||!q) return 0; memcpy(d,p,n); return 1;}
static u64 alloc(u64 n){ u64 a=HEAP+hp; hp+=(n+15)&~15ull; return a; }
static void w64(u64 a,u64 v){memcpy(at(a),&v,8);} static void w32(u64 a,u32 v){memcpy(at(a),&v,4);}
static u64 cstr(const char*s){u64 a=alloc(strlen(s)+1);strcpy(at(a),s);return a;}
static u64 klass(const char*ns,const char*n){u64 k=alloc(0x100);w64(k+0x10,cstr(n));w64(k+0x18,cstr(ns));return k;}
static u64 obj(u64 k,u64 size){u64 o=alloc(size);w64(o,k);return o;}
static u64 kStr;
static u64 mstr(const char*utf8){ /* ascii + a few CJK via \u escapes not needed: store UTF-16 */
  unsigned short w[256];int n=0;const unsigned char*s=(const unsigned char*)utf8;
  while(*s){unsigned c=*s++; if(c>=0xE0){c=((c&15)<<12)|((s[0]&63)<<6)|(s[1]&63);s+=2;} else if(c>=0xC0){c=((c&31)<<6)|(s[0]&63);s++;} w[n++]=c;}
  u64 o=obj(kStr,0x14+n*2+2);w32(o+0x10,n);memcpy(at(o+0x14),w,n*2);return o;}
static u64 kDict;
static u64 dict(int n,const u32*keys,const u64*vals){u64 d=obj(kDict,0x50);u64 e=obj(0,0x20+n*0x18);w32(e+0x18,n);
  for(int i=0;i<n;i++){u64 x=e+0x20+i*0x18;w32(x,1);w32(x+4,-1);w32(x+8,keys[i]);w64(x+0x10,vals[i]);}
  w64(d+0x18,e);w32(d+0x20,n);return d;}
static char files[8][64];static u32 fsz[8];static int nf;
static int wf(void*c,const char*n,const void*d,u32 sz){(void)c;(void)d;strcpy(files[nf],n);fsz[nf++]=sz;return 1;}
static u64 nr(void*c,u64 a,u64*sz){(void)c; if(a<=HEAP){*sz=sizeof heap;return HEAP;} return 0;}
static void lg(const char*s){fputs(s,stderr);}
int main(int argc,char**argv){
  int breakBuild=argc>1;
  /* PE header timestamp */
  w32(BASE+0x3C,0x100); w32(BASE+0x108, breakBuild?0x11111111u:0x6AA0E182u);
  kStr=klass("System","String");kDict=klass("System.Collections.Generic","Dictionary`2");
  u64 kList=klass("System.Collections.Generic","List`1");
  /* DataManager singleton */
  u64 kSingDM=klass("Aidis","Singleton`1"),kDM=klass("World.Data","DataManager");
  w64(BASE+0x7669988,kSingDM); u64 sf=alloc(0x10); w64(kSingDM+0xB8,sf);
  u64 dm=obj(kDM,0x400); w64(sf,dm);
  u64 ui=obj(klass("World.Data","UserInfo"),0x100); w64(dm+0x18,ui); w64(ui+0x20,mstr("测试玩家"));
  u64 uu=obj(klass("World.Data","UserUnit"),0x100); w64(dm+0x310,uu);
  u64 pu=obj(klass("World.Data","PublicUserUnit"),0x100); w64(uu+0xE8,pu);
  /* Dictionary<int,UnitDressInfo> with inline structs (stride 0x10+0x890) */
  u64 kD=kDict; int n=2; u64 d=obj(kD,0x50); u64 e=obj(0,0x20+n*0x8A0); w32(e+0x18,n); w64(d+0x18,e); w32(d+0x20,n);
  const char* names[2]={"洛琪希·米格路迪亚","艾莉丝"}; int ids[2]={260,259};
  for(int i=0;i<n;i++){u64 x=e+0x20+i*0x8A0; w32(x,1);w32(x+4,-1);w32(x+8,ids[i]); u64 v=x+0x10;
    w32(v+0x0,ids[i]); w32(v+0x4,120); w64(v+0x28,mstr(names[i])); w32(v+0x60,2512+i);
    u64 eq=v+0x188; w32(eq,ids[i]); w64(eq+0x10,mstr(i?"327,1744":"106,1073,\"q\"")); w64(eq+0x8,mstr("5001"));}
  w64(pu+0x18,d);
  /* Dictionary<int,UnitDressEquipInfo> inline (stride 0xA0) with one free slot */
  u64 d2=obj(kD,0x50); u64 e2=obj(0,0x20+2*0xA0); w32(e2+0x18,2); w64(d2+0x18,e2); w32(d2+0x20,2);
  w32(e2+0x20+4,-1); w32(e2+0x20+0x10,260); w64(e2+0x20+0x10+0x10,mstr("106"));
  w32(e2+0x20+0xA0+4,-5); /* free slot */
  w64(pu+0x20,d2);
  /* List<DeckInfo> inline (0x70 each) */
  u64 dl=obj(kList,0x20); u64 arr=obj(0,0x20+2*0x70); w32(arr+0x18,2); w64(dl+0x10,arr); w32(dl+0x18,2);
  w32(arr+0x20,1); w64(arr+0x20+0x10,mstr("260,259,0,0")); w32(arr+0x20+0x70,1); w32(arr+0x20+0x70+4,1);
  w64(uu+0x10,dl);
  /* v0.3 sections */
  { u64 l=obj(kList,0x20); u64 a=obj(0,0x20+3*0xC); w64(l+0x10,a); w32(l+0x18,3);
    for(int i=0;i<3;i++){w32(a+0x20+i*0xC,100640);w32(a+0x20+i*0xC+4,200+10*i);w32(a+0x20+i*0xC+8,i*100);} w64(uu+0xD8,l);
    u64 l2=obj(kList,0x20); u64 a2=obj(0,0x20+0x10); w64(l2+0x10,a2); w32(l2+0x18,1); w32(a2+0x20,100640); w32(a2+0x24,1006423); w32(a2+0x28,5); w64(uu+0xE0,l2);
    u64 d3=obj(kD,0x50); u64 e3=obj(0,0x20+0x38); w32(e3+0x18,1); w64(d3+0x18,e3); w32(d3+0x20,1);
    w32(e3+0x20+4,-1); w32(e3+0x20+0x10,100640); w64(e3+0x20+0x10+0x10,mstr("00ff")); w64(uu+0xD0,d3);
    u64 d4=obj(kD,0x50); u64 e4=obj(0,0x20+0xB0); w32(e4+0x18,1); w64(d4+0x18,e4); w32(d4+0x20,1);
    w32(e4+0x20+4,-1); w32(e4+0x20+0x10,100640); w32(e4+0x20+0x10+4,100642); w32(e4+0x20+0x10+0xC,120); w64(pu+0x10,d4);
    u64 il=obj(kList,0x20); u64 ia=obj(0,0x20+8); w64(il+0x10,ia); w32(il+0x18,2); w32(ia+0x20,11); w32(ia+0x24,22); w64(e+0x20+0x10+0x850,il); }
  /* v0.4 UIUnitDetail page */
  { u64 kPB=klass("World.UI.Common","UISingletonPageBase`1"); w64(BASE+0x772CD28,kPB); u64 sfp=alloc(0x10); w64(kPB+0xB8,sfp);
    u64 kUD=klass("World.UI.Unit","UIUnitDetail"); w64(BASE+0x751FFD8,kUD); u64 stale=obj(kUD,0xEC0); (void)stale; u64 page=obj(kUD,0xEC0); w64(page+0x10,0x1234); (void)sfp; w32(page+0xD48,100642); w32(page+0xD4C,100640);
    u64 ud=obj(klass("World.UI.Data","UIUnitData"),0x260); w64(page+0x4B0,ud); w32(ud+0x40,114); w32(ud+0x148,714);
    u64 il=obj(kList,0x20); u64 ia=obj(0,0x20+8); w64(il+0x10,ia); w32(il+0x18,2); w32(ia+0x20,230); w32(ia+0x24,800); w64(ud+0x88,il);
    w32(page+0x4B8,100642); w32(page+0x4B8+0x60,31000);
    u64 st=obj(0,0x20+6*4); w32(st+0x18,6); for(int i=0;i<6;i++) w32(st+0x20+4*i,100*i); w64(page+0x450,st);
    u64 tabs=obj(klass("World.UI.Unit","UIUnitDetailDescriptionTabs"),0xB0); w64(page+0x348,tabs);
    u64 da=obj(0,0x20+2*8); w32(da+0x18,2); w64(tabs+0x78,da);
    u64 other=obj(klass("World.UI.Unit","UIUnitDetailDescriptionEquipment"),0xD0); w64(da+0x20,other);
    u64 sm=obj(klass("World.UI.Unit","UIUnitDetailDescriptionSummary"),0xC8); w64(da+0x28,sm); w32(sm+0xC0,100642);
    u64 pane=obj(klass("World.UI.Unit","UIUnitDetailStatusPane"),0x60); w64(sm+0x98,pane);
    u64 va=obj(0,0x20+2*8); w32(va+0x18,2); w64(pane+0x58,va);
    for(int i=0;i<2;i++){u64 sv=obj(klass("World.UI.Unit","UIStatusValue"),0x50); w32(sv+0x48,54321+i); w32(sv+0x4C,1000); u64 tmp=obj(klass("TMPro","TextMeshProUGUI"),0x100); w64(tmp+0xE0,mstr(i?"12,345":"54,321")); w64(sv+0x28,tmp); w64(va+0x20+8*i,sv);}
    u64 scp=obj(klass("World.UI.Unit","UIUnitDetailSkillCostPane"),0x80); w64(sm+0xA8,scp); u64 t2=obj(klass("TMPro","TextMeshProUGUI"),0x100); w64(t2+0xE0,mstr("114/114")); w64(scp+0x58,t2); }
  /* MasterManager -> BinaryMasterSet -> AccessorManager -> ConcurrentDictionary */
  u64 kSingMM=klass("Aidis","Singleton`1"),kMM=klass("World.Master","MasterManager");
  w64(BASE+0x766A148,kSingMM); u64 sf2=alloc(0x10); w64(kSingMM+0xB8,sf2);
  u64 mm=obj(kMM,0x20); w64(sf2,mm); u64 ms=obj(klass("World.Master","BinaryMasterSet"),0x40); w64(mm+0x10,ms);
  u64 am=obj(klass("Aidis.BinarySheet","AccessorManager"),0x20); w64(ms+0x18,am);
  u64 cd=obj(klass("System.Collections.Concurrent","ConcurrentDictionary`2"),0x40); w64(am+0x10,cd);
  u64 tb=obj(0,0x28); w64(cd+0x10,tb); u64 bk=obj(0,0x20+4*8); w32(bk+0x18,4); w64(tb+0x10,bk);
  u64 kAcc=klass("Aidis.BinarySheet","Accessor`1"); w64(BASE+0x7618468,kAcc);
  u64 acc=obj(kAcc,0x100); u64 bin=obj(0,0x20+100); w32(bin+0x18,100); w64(acc+0x10,bin);
  u64 other=obj(klass("Aidis.BinarySheet","Accessor`1"),0x100);
  u64 kNode=klass("","Node"); u64 n1=obj(kNode,0x30),n2=obj(kNode,0x30); w32(n1+0x10,7); w64(n1+0x18,other); w64(n1+0x20,n2); w32(n2+0x10,9); w64(n2+0x18,acc);
  w64(bk+0x20+8*2,n1);
  static char out[1<<20]; static unsigned char scratch[1<<20];
  Output o={0}; o.buf=out;o.cap=sizeof out;o.moduleBase=BASE;o.read=rd;o.writeFile=wf;o.log=lg;o.nextRegion=nr;o.scratch=scratch;o.scratchCap=sizeof scratch;
  /* v0.9: LuaGlobal.Instance.ScriptMng.scriptList : Dictionary<string, sbyte[]> */
  { u64 kLG=klass("World.Battle.Common","LuaGlobal"), kSM=klass("World.Battle.Common","ScriptManager");
    w64(BASE+0x7516190,kLG); w64(BASE+0x757CBD0,kSM);
    u64 lgS=alloc(0x20), smS=alloc(0x40); w64(kLG+0xB8,lgS); w64(kSM+0xB8,smS);
    u64 gl=obj(kLG,0x80); w64(lgS,gl); u64 sm=obj(kSM,0x40); w64(gl+0x40,sm);
    w64(smS+0x18,mstr("process")); w64(smS+0x20,mstr("procCond"));
    u64 libs=obj(0,0x20+2*8); w32(libs+0x18,2); w64(libs+0x20,mstr("luaCommon")); w64(libs+0x28,mstr("procCondCommon")); w64(smS+0x28,libs);
    const char* keys[3]={"process","procCond","luaCommon"}; const char* bodies[3]={"function process1() end","function IsValidSkill() return true end",0};
    int n=3; u64 dd=obj(kDict,0x50); u64 ee=obj(0,0x20+n*0x18); w32(ee+0x18,n); w64(dd+0x18,ee); w32(dd+0x20,n);
    for(int i=0;i<n;i++){u64 x=ee+0x20+i*0x18; w32(x,7); w32(x+4,-1); w64(x+8,mstr(keys[i]));
      if(bodies[i]){ u64 a=obj(0,0x20+64); w32(a+0x18,(u32)strlen(bodies[i])); memcpy(at(a+0x20),bodies[i],strlen(bodies[i])); w64(x+0x10,a);} }
    w64(sm+0x10,dd); }
  int ok=loadout_run(&o); fwrite(out,1,o.len,stdout);
  fprintf(stderr,"ok=%d files=%d first=%s(%u)\n",ok,nf,nf?files[0]:"",nf?fsz[0]:0);
  return 0;
}
