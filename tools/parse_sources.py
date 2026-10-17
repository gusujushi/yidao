import re, json, sys
from opencc import OpenCC
_cc = OpenCC('t2s')
class _CC:
    def convert(self,s): return _cc.convert(s.replace('乾','\uE000')).replace('\uE000','乾').replace('緜','绵').replace('谿','溪').replace('闚','窥')
cc=_CC()
FIRST={'磐|盤','取|娶','褫|拕','拇|母','鼫|碩','墉|庸','國|邦','它|他','能|而','蹢躅|𨅙𨄃','輹|腹'}

import os
S=os.environ.get('SRC','/tmp/claude-0/src/')
def clean(s):
    s=re.sub(r'<ref[^>]*/>','',s); s=re.sub(r'<ref.*?</ref>','',s)
    s=re.sub(r'\{\{另\|([^|}]*)\|([^}]*)\}\}',lambda m: m.group(1) if m.group(1)+'|'+m.group(2) in FIRST else m.group(2).split('、')[-1],s)
    s=re.sub(r'\{\{\*\|[^}]*\}\}','',s)
    s=re.sub(r'-\{([^}]*)\}-',r'\1',s)
    s=re.sub(r'\{\{[^}]*\}\}','',s)
    s=re.sub(r'<[^>]+>','',s); s=s.replace("'''",'').replace("''",'')
    s=re.sub(r'\[\[[^|\]]*\|([^\]]*)\]\]',r'\1',s); s=re.sub(r'\[\[([^\]]*)\]\]',r'\1',s)
    return s.strip()
cn='一二三四五六七八九'
def cnum(t):
    t=t.replace('章','')
    if t=='十':return 10
    if t.startswith('十'): return 10+cn.index(t[1])+1
    if '十' in t:
        a,b=t.split('十'); return (cn.index(a)+1)*10+((cn.index(b)+1) if b else 0)
    return cn.index(t)+1
ddj={}; cur=None
for line in open(S+'ddj.txt',encoding='utf8'):
    line=line.rstrip('\n')
    m=re.match(r'^==([一二三四五六七八九十]+章)==$',line)
    if m: cur=cnum(m.group(1)); ddj[cur]=[]; continue
    if line.startswith('='): cur=None if line.startswith('=跋') or '跋' in line else cur; continue
    if cur is None or not line.strip() or line.startswith(':') or line.startswith('{{'): continue
    ddj[cur].append(clean(line))
assert len(ddj)==81, len(ddj)
out_ddj=[]
for i in range(1,82):
    t=''.join(ddj[i]); out_ddj.append({'n':i,'t':t,'s':cc.convert(t)})
gua=[]
for i in range(1,65):
    L=open(S+f'gua/{i:02d}.txt',encoding='utf8').read().split('\n')
    g={'n':i,'yao':[],'xx':[]}
    sec=None
    for line in L:
        c=clean(line.lstrip('*#:;'))
        if line.startswith(';'): g['name']=clean(line[1:])
        elif re.search(r'\[\[(File|Image):',line): g['xg']=clean(re.sub(r'\[\[(File|Image):[^\]]*\]\]','',line))
        elif '易經：' in line: sec='j'
        elif '彖曰' in line: sec='t'
        elif line.startswith("*'''象曰"): sec='x'
        elif '文言曰' in line: sec='w'
        elif line.startswith('*') and "'''" in line and sec not in ('j',): sec='o'
        elif sec=='j' and line.startswith('***'): g['gc']+=c
        elif sec=='j' and line.startswith('**'): g['gc']=c.split('：',1)[1] if '：' in c[:6] else c
        elif sec=='j' and line.startswith('*#'): g['yao'].append(c)
        elif sec=='t' and line.startswith('**'): g['tuan']=g.get('tuan','')+c
        elif sec=='x' and line.startswith('**'): g['dx']=c
        elif sec=='x' and line.startswith('*#'): g['xx'].append(c)
    gua.append(g)
for g in gua:
    assert len(g['yao']) in (6,7) and g.get('gc') and g.get('dx'), (g['n'],g)
xu=None


# ---- 输出 data/texts.js ----
TRI={'乾':'乾','坤':'坤','震':'震','巽':'巽','坎':'坎','離':'离','艮':'艮','兌':'兑'}
G=[]
for g in gua:
    d,u=re.match(r'(.+)下(.+)上',g['xg']).groups()
    G.append({'n':g['n'],'name':cc.convert(g['name']),'nameT':g['name'],'down':TRI[d],'up':TRI[u],
      'gc':cc.convert(g['gc']),'gcT':g['gc'],'yao':[cc.convert(y) for y in g['yao']],'yaoT':g['yao'],
      'tuan':cc.convert(g.get('tuan','')),'dx':cc.convert(g['dx']),'dxT':g['dx'],'xx':[cc.convert(x) for x in g['xx']]})
D=[{'n':c['n'],'s':c['s'],'t':c['t']} for c in out_ddj]
import os
dst=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','data','texts.js')
with open(dst,'w',encoding='utf8') as f:
    f.write('// 原文：《道德经》王弼本、《周易》通行本（来源：维基文库），由 tools/parse_sources.py 生成\n')
    f.write('window.DDJ='+json.dumps(D,ensure_ascii=False)+';\n')
    f.write('window.GUA='+json.dumps(G,ensure_ascii=False)+';\n')
print('wrote',dst)
