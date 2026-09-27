import struct
def load(path):
    d=open(path,'rb').read()
    hs,rs,nr,nc,ci,sn=struct.unpack_from('<6I',d,0)
    cols=[]
    for i in range(nc):
        ty,off,no=struct.unpack_from('<HHI',d,ci+8*i)
        cols.append((cstr(d,no),ty,off))
    rows=[]
    for r in range(nr):
        b=hs+r*rs;row={}
        for n,ty,off in cols:
            v=struct.unpack_from('<I',d,b+off)[0]
            row[n]=cstr(d,v) if ty==0x10 else (v if v<0x80000000 else v-(1<<32))
        rows.append(row)
    return cols,rows
def cstr(d,o):
    e=d.index(b'\0',o);return d[o:e].decode('utf-8','replace')
