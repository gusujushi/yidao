(function(){
"use strict";
const DDJ=window.DDJ, GUA=window.GUA, DN=window.DDJ_NOTES, GN=window.GUA_NOTES, PLAN=window.PLAN, SEAS=window.SEAS, CODES=window.CODE_PAIRS;
const main=document.getElementById('main');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CN='零一二三四五六七八九';
const cnum=n=>n<=10?(n===10?'十':CN[n]):n<20?'十'+(n%10?CN[n%10]:''):CN[Math.floor(n/10)]+'十'+(n%10?CN[n%10]:'');

// ---------- 八卦 ----------
const TRI={
 '乾':{b:[1,1,1],x:'天',de:'健',song:'乾三连',fam:'父',sym:'☰'},
 '坤':{b:[0,0,0],x:'地',de:'顺',song:'坤六断',fam:'母',sym:'☷'},
 '震':{b:[1,0,0],x:'雷',de:'动',song:'震仰盂',fam:'长男',sym:'☳'},
 '巽':{b:[0,1,1],x:'风',de:'入',song:'巽下断',fam:'长女',sym:'☴'},
 '坎':{b:[0,1,0],x:'水',de:'陷',song:'坎中满',fam:'中男',sym:'☵'},
 '离':{b:[1,0,1],x:'火',de:'丽',song:'离中虚',fam:'中女',sym:'☲'},
 '艮':{b:[0,0,1],x:'山',de:'止',song:'艮覆碗',fam:'少男',sym:'☶'},
 '兑':{b:[1,1,0],x:'泽',de:'说（悦）',song:'兑上缺',fam:'少女',sym:'☱'}
};
const TRI_NAMES=Object.keys(TRI);
const bits=g=>[...TRI[g.down].b,...TRI[g.up].b];          // 从下往上
const fullName=g=>g.up===g.down?g.name+'为'+TRI[g.up].x:TRI[g.up].x+TRI[g.down].x+g.name;
function hexSVG(b,w=86){const h=b.length*14+(b.length-1)*0;const lw=w,lh=8,gap=14;let r='';
  b.forEach((v,i)=>{const y=(b.length-1-i)*gap;r+=v?`<rect x="0" y="${y}" width="${lw}" height="${lh}" rx="1"/>`:`<rect x="0" y="${y}" width="${lw*0.42}" height="${lh}" rx="1"/><rect x="${lw*0.58}" y="${y}" width="${lw*0.42}" height="${lh}" rx="1"/>`;});
  return `<svg class="hexa" width="${w}" viewBox="0 0 ${lw} ${(b.length-1)*gap+lh}" role="img" aria-label="卦象">${r}</svg>`;}

// ---------- 进度存储 ----------
const KEY='yidao-island-v1';
const fresh=()=>({xp:0,days:{},seen:{},mistakes:[],dates:[],trad:false,rate:0.85,unlockAll:false,trainerBest:0});
let S=fresh();
try{const raw=localStorage.getItem(KEY);if(raw)S=Object.assign(fresh(),JSON.parse(raw));}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
function markStudy(){const t=today();if(!S.dates.includes(t)){S.dates.push(t);save();}}
function streak(){const set=new Set(S.dates);let n=0;const d=new Date();if(!set.has(today()))d.setDate(d.getDate()-1);
  for(;;){const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(set.has(k)){n++;d.setDate(d.getDate()-1);}else break;}return n;}
const LEVELS=[[0,'童生'],[300,'秀才'],[900,'举人'],[1800,'进士'],[3000,'翰林'],[4500,'大儒'],[6500,'悟道者']];
function level(){let i=0;while(i+1<LEVELS.length&&S.xp>=LEVELS[i+1][0])i++;const cur=LEVELS[i],nx=LEVELS[i+1];
  return {name:cur[1],pct:nx?(S.xp-cur[0])/(nx[0]-cur[0]):1,next:nx?nx[0]:null};}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2200);}

// ---------- 计划 ----------
const dayCh=d=>d<=21?[3*d-2,3*d-1,3*d]:[64+2*(d-22),65+2*(d-22)];
const dayGua=d=>d<=26?[2*d-1,2*d]:[53+3*(d-27),54+3*(d-27),55+3*(d-27)];
const unlocked=d=>S.unlockAll||d===1||!!(S.days[d-1]&&S.days[d-1].stars>0);
const nextDay=()=>{for(let d=1;d<=30;d++)if(!(S.days[d]&&S.days[d].stars>0))return d;return 30;};
const learnedCh=new Set(),learnedGua=new Set();
function refreshLearned(){learnedCh.clear();learnedGua.clear();for(let d=1;d<=30;d++)if(S.days[d]&&S.days[d].stars>0){dayCh(d).forEach(n=>learnedCh.add(n));dayGua(d).forEach(n=>learnedGua.add(n));}}

// ---------- 朗读 ----------
function speak(text){
  if(!('speechSynthesis' in window)){toast('当前浏览器不支持朗读');return;}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text.replace(/[“”]/g,''));u.lang='zh-CN';u.rate=S.rate||0.85;
  const v=speechSynthesis.getVoices().find(v=>/zh[-_]CN/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u);}

// ---------- 顶栏 ----------
const NAV=[['map','学习地图'],['lib','经典库'],['trainer','卦象训练营'],['review','错题本'],['code','编号对读'],['basics','入门须知'],['settings','设置']];
let curView='map';
function renderTop(){
  const L=level();
  document.getElementById('stats').innerHTML=`<span class="lv"><i>${L.name}</i><span class="xpbar" title="经验值"><div style="width:${Math.round(L.pct*100)}%"></div></span><span>${S.xp} 经验</span></span><span>连续 ${streak()} 天</span>`;
  document.getElementById('tabs').innerHTML=NAV.map(([k,t])=>`<button data-nav="${k}" class="${curView===k||(curView==='day'&&k==='map')?'on':''}">${t}${k==='review'&&S.mistakes.length?` (${S.mistakes.length})`:''}</button>`).join('');
}
document.getElementById('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-nav]');if(b)go(b.dataset.nav);});
document.getElementById('logo').addEventListener('click',()=>go('map'));
function go(v,arg){curView=v;if(window.speechSynthesis)speechSynthesis.cancel();refreshLearned();
  ({map:renderMap,day:renderDay,lib:renderLib,trainer:renderTrainer,review:renderReview,code:renderCode,basics:renderBasics,settings:renderSettings})[v](arg);
  renderTop();window.scrollTo(0,0);}

// ---------- 地图 ----------
function renderMap(){
  const nd=nextDay(),p=PLAN[nd-1],done=Object.values(S.days).filter(x=>x.stars>0).length;
  const stars=Object.values(S.days).reduce((a,x)=>a+(x.stars||0),0);
  main.innerHTML=`<section class="view">
   <div class="today">
    <div class="panel">
      <div class="eyebrow">今日航程 · 第 ${nd} 天 / 30</div>
      <div class="big">${p.isle}</div>
      <div>${esc(p.theme)}</div>
      <ul class="sans" style="font-size:14px">
        <li>读经：《道德经》第 ${dayCh(nd).join('、')} 章</li>
        <li>观象：${dayGua(nd).map(n=>'第'+n+'卦 '+GUA[n-1].name).join('、')}</li>
        <li>对读：道德经第 ${p.pair[0]} 章 × ${GUA[p.pair[1]-1].name}卦，然后闯关 12 题</li>
      </ul>
      <div class="row"><button class="btn" data-day="${nd}">登岛学习</button><span class="note">约 40–60 分钟</span></div>
    </div>
    <div class="panel tiles">
      <div class="tile"><span class="eyebrow">已登岛</span><b>${done} / 30</b></div>
      <div class="tile"><span class="eyebrow">朱印</span><b>${stars} / 90</b></div>
      <div class="tile"><span class="eyebrow">已学章节</span><b>${learnedCh.size} / 81</b></div>
      <div class="tile"><span class="eyebrow">已学卦</span><b>${learnedGua.size} / 64</b></div>
    </div>
   </div>
   <div class="head2"><h2 class="brush">五海三十岛</h2><span class="note">通过前一座岛的闯关（至少一枚朱印）即可解锁下一座</span></div>
   <div class="map" id="map"></div>
  </section>`;
  main.querySelector('[data-day]').onclick=()=>go('day',{d:nd});
  drawMap();
}
function drawMap(){
  const box=document.getElementById('map');if(!box)return;
  const cols=box.clientWidth<640?3:6,W=cols===3?520:1000,rowH=cols===3?190:250,top=70,sfs=cols===3?24:26;
  const rowsPerSea=6/cols,rows=30/cols,H=top+rows*rowH+40*SEAS.length;
  let pts=[],svg='',path='';
  for(let d=1;d<=30;d++){const i=d-1,r=Math.floor(i/cols),c=i%cols,sea=Math.floor(i/6);
    const cc=r%2?cols-1-c:c;const x=(W/cols)*(cc+.5);const y=top+r*rowH+sea*40+rowH*.45+((d*37)%5-2)*8;pts.push([x,y]);}
  // 海名与波纹
  SEAS.forEach((s,k)=>{const y=top+k*rowsPerSea*rowH+k*40-18;svg+=`<text class="seaname" x="20" y="${y}" font-size="${sfs}">${s.name}</text><text x="${26+s.name.length*sfs*1.05}" y="${y}" fill="var(--muted)" font-size="${cols===3?14:15}" font-family="var(--f-sans)">第${s.days[0]}–${s.days[1]}天${cols===3?'':' · '+s.desc}</text>`;});
  for(let k=0;k<26;k++){const x=(k*173)%W,y=(k*97)%H;svg+=`<path class="wave" d="M${x} ${y} q12 -8 24 0 t24 0"/>`;}
  path='M'+pts.map(p=>p.join(' ')).join(' L');
  svg+=`<path class="path" d="${path}"/>`;
  const nd=nextDay(),R=cols===3?62:58,fs=cols===3?26:24;
  pts.forEach(([x,y],i)=>{const d=i+1,p=PLAN[i],st=S.days[d],lock=!unlocked(d);
    let blob='';const n=9;for(let k=0;k<n;k++){const a=k/n*Math.PI*2,rr=R*(0.82+0.18*Math.sin(d*3.1+k*2.3));blob+=(k?'L':'M')+(x+Math.cos(a)*rr*1.25).toFixed(1)+' '+(y+Math.sin(a)*rr*.8).toFixed(1);}
    const seals=st&&st.stars?Array.from({length:3},(_,k)=>`<rect x="${x-27+k*20}" y="${y+R*.8-6}" width="14" height="14" rx="2" fill="${k<st.stars?'var(--seal)':'none'}" stroke="var(--seal)" stroke-width="1.5"/>`).join(''):'';
    svg+=`<g class="isle${lock?' lock':''}${d===nd&&!S.unlockAll?' cur':''}" data-d="${d}" tabindex="${lock?-1:0}" role="button" aria-label="第${d}天 ${p.isle}${lock?'（未解锁）':''}">
      <path class="land" d="${blob}Z"/>
      <text x="${x}" y="${y-6}" text-anchor="middle" font-size="${fs*.55}" font-family="var(--f-sans)">第${d}天</text>
      <text x="${x}" y="${y+fs*.8}" text-anchor="middle" font-size="${fs}" style="font-family:var(--f-brush)">${p.isle}</text>${seals}</g>`;});
  box.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="学习地图">${svg}</svg>`;
  box.querySelectorAll('.isle').forEach(g=>{const f=()=>{const d=+g.dataset.d;if(!unlocked(d)){toast('先完成第'+(d-1)+'天的闯关，才能登上这座岛');return;}go('day',{d});};
    g.addEventListener('click',f);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();f();}});});
}
let rsz;window.addEventListener('resize',()=>{clearTimeout(rsz);rsz=setTimeout(()=>{if(curView==='map')drawMap();},200);});

// ---------- 章节 / 卦 渲染 ----------
function chapterHTML(n){const t=DDJ[n-1],no=DN[n-1];const txt=S.trad?t.t:t.s;
  return `<article class="page" data-ch="${n}">
   <div class="ph"><span class="eyebrow">《道德经》第${cnum(n)}章</span><h3>${esc(no.ti)}</h3>
    <span class="tools"><button class="btn ghost small" data-speak="${n}">朗读</button><button class="btn ghost small" data-recite="${n}">背诵</button></span></div>
   <div class="yw" id="yw-${n}">${esc(txt)}</div>
   <div class="key"><div class="lab">必背名句</div>${esc(no.key)}</div>
   <div class="bh"><div class="lab">白话精讲</div>${esc(no.bh)}</div>
   <div class="cases"><div class="case"><div class="lab">古代案例</div>${esc(no.gu)}</div><div class="case"><div class="lab">近现代案例</div>${esc(no.jin)}</div></div>
   <div class="yong">今日一用：${esc(no.yong)}</div></article>`;}
function guaHTML(n){const g=GUA[n-1],no=GN[n-1],tr=S.trad;
  const pos=g.yao.map((y,i)=>{const t=tr?g.yaoT[i]:y;const k=t.indexOf('：')>-1?t.indexOf('：'):t.indexOf('，');return [t.slice(0,k),t.slice(k+1)];});
  return `<article class="page" data-gua="${n}">
   <div class="ph"><span class="eyebrow">《易经》第${cnum(n)}卦 · ${TRI[g.up].x}${'（'+g.up+'）'}上 ${TRI[g.down].x}${'（'+g.down+'）'}下</span><h3>${fullName(g)} · ${esc(no.ti)}</h3>
    <span class="tools"><button class="btn ghost small" data-speakg="${n}">朗读</button></span></div>
   <div class="gtop">${hexSVG(bits(g),96)}<div style="min-width:0;flex:1 1 260px"><div class="lab">卦辞</div><div class="yw" style="font-size:19px">${esc(tr?g.nameT:g.name)}：${esc(tr?g.gcT:g.gc)}</div>
     <div class="lab" style="margin-top:6px">大象传</div><div>${esc(tr?g.dxT:g.dx)}</div></div></div>
   <div class="bh"><div class="lab">白话精讲</div>${esc(no.bh)}</div>
   <div><div class="lab">六爻（从下往上读）</div><div class="yao">${pos.map((p,i)=>`<div><div><span class="p">${esc(p[0])}</span>：${esc(p[1])}</div><div class="w">${i<6?esc(no.yao[i]):(n===1?'群龙无首：刚而不为首，吉':'利永贞：柔顺而长守正道')}</div></div>`).join('')}</div></div>
   <details><summary>彖传原文</summary><div style="margin-top:6px">${esc(g.tuan)}</div></details>
   <div class="cases"><div class="case"><div class="lab">古代案例</div>${esc(no.gu)}</div><div class="case"><div class="lab">近现代案例</div>${esc(no.jin)}</div></div>
   <div class="yong">今日一用：${esc(no.yong)}</div></article>`;}
function bindText(root){
  root.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>speak(DDJ[b.dataset.speak-1].s));
  root.querySelectorAll('[data-speakg]').forEach(b=>b.onclick=()=>{const g=GUA[b.dataset.speakg-1];speak(g.name+'。'+g.gc+g.yao.join('')+'象曰：'+g.dx);});
  root.querySelectorAll('[data-recite]').forEach(b=>{let lv=0;b.onclick=()=>{lv=(lv+1)%4;const n=+b.dataset.recite,el=document.getElementById('yw-'+n);const txt=S.trad?DDJ[n-1].t:DDJ[n-1].s;
    if(!lv){el.textContent=txt;b.textContent='背诵';return;}
    const ratio=[0,.3,.6,1][lv];let k=0;el.innerHTML=[...txt].map(c=>/[，。；：、？！“”‘’,]/.test(c)?c:`<span class="c${((k++*7919)%100)/100<ratio?' h':''}">${esc(c)}</span>`).join('');
    el.querySelectorAll('.c.h').forEach(s=>s.onclick=()=>s.classList.remove('h'));b.textContent=['背诵','遮30%','遮60%','全遮'][lv];};});
}

// ---------- 对读（竖排书页） ----------
function pairHTML(c,gn,an,head){const g=GUA[gn-1];
  return `<div class="bookwrap"><div class="book" id="book">
   <p class="hd">${head||''}《道德经》第${cnum(c)}章 · 《易经》第${cnum(gn)}卦${fullName(g)}</p>
   <p class="q">道德经：${esc(DN[c-1].key)}</p>
   <p class="q">易经：${esc(g.name)}，${esc(g.gc)}　象曰：${esc(g.dx)}</p>
   <p class="an">${esc(an)}</p></div></div>
   <div class="row"><button class="btn ghost small" id="flip">改为横排阅读</button><button class="btn ghost small" id="spk">朗读对读</button></div>`;}
function bindPair(an){const b=document.getElementById('flip');if(!b)return;b.onclick=()=>{const k=document.getElementById('book');k.classList.toggle('h');b.textContent=k.classList.contains('h')?'改为竖排阅读':'改为横排阅读';};
  document.getElementById('spk').onclick=()=>speak(an);}

// ---------- 课程页 ----------
function renderDay({d,step}){
  const p=PLAN[d-1];S.seen[d]=S.seen[d]||[];
  const steps=[...(d===1?[['intro','入门']]:[]),['ddj','读经'],['gua','观象'],['pair','对读'],['quiz','闯关']];
  step=step||steps[0][0];if(!S.seen[d].includes(step)){S.seen[d].push(step);save();}
  markStudy();
  const nav=`<div class="head2"><div><div class="eyebrow">第 ${d} 天 · ${SEAS.find(s=>d>=s.days[0]&&d<=s.days[1]).name}</div><h2 class="brush">${p.isle} · ${esc(p.theme)}</h2></div>
    <div class="steps">${steps.map(([k,t])=>`<button data-step="${k}" class="${k===step?'on':''} ${S.seen[d].includes(k)&&k!==step?'seen':''}">${t}</button>`).join('')}</div></div>`;
  let body='';
  if(step==='intro')body=basicsHTML();
  if(step==='ddj')body=dayCh(d).map(chapterHTML).join('');
  if(step==='gua')body=dayGua(d).map(guaHTML).join('');
  if(step==='pair')body=`<div class="pairlabel"><span>今日对读</span><span class="muted">像书中那样：把一章《道德经》和一卦《易经》放在一起看，找它们的共同点。</span></div>`+pairHTML(p.pair[0],p.pair[1],p.an,'第'+cnum(d)+'天　')+
     (d===21?`<div class="panel"><div class="lab">加读：4841</div>${esc(CODES['4841'])}</div>`:'');
  const idx=steps.findIndex(s=>s[0]===step),nx=steps[idx+1];
  main.innerHTML=`<section class="view">${nav}${step==='quiz'?'<div id="qz"></div>':body}
   ${step!=='quiz'&&nx?`<div class="row"><button class="btn" id="nx">下一步：${nx[1]}</button></div>`:''}</section>`;
  main.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>go('day',{d,step:b.dataset.step}));
  if(nx&&step!=='quiz')document.getElementById('nx').onclick=()=>go('day',{d,step:nx[0]});
  bindText(main);if(step==='pair')bindPair(p.an);if(step==='intro')bindBasics();
  if(step==='quiz')runQuiz(document.getElementById('qz'),dayQuestions(d),res=>finishDay(d,res));
}
function finishDay(d,{right,total}){
  const pct=right/total,stars=pct>=.9?3:pct>=.75?2:pct>=.6?1:0;const old=S.days[d]||{stars:0};
  let gain=right*10;if(stars>old.stars)gain+=(stars-old.stars)*50;
  S.xp+=gain;S.days[d]={stars:Math.max(stars,old.stars),best:Math.max(right,old.best||0),date:today()};save();renderTop();
  return {stars,gain,pass:stars>0,next:d<30?()=>go('day',{d:d+1}):null,retry:()=>go('day',{d,step:'quiz'})};
}

// ---------- 题目生成 ----------
const rnd=n=>Math.floor(Math.random()*n);
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const pick=a=>a[rnd(a.length)];
function others(n,max,k,near){const s=new Set();let guard=0;while(s.size<k&&guard++<500){const c=near?Math.min(max,Math.max(1,n+rnd(21)-10)):1+rnd(max);if(c!==n)s.add(c);}return [...s];}
function mk(q,correct,wrongs,exp,sub){const opts=shuffle([correct,...wrongs.slice(0,3)]);return {q,sub:sub||'',opts,a:opts.indexOf(correct),exp};}
const chLabel=n=>`《道德经》第${n}章「${DN[n-1].ti}」`;
const guaLabel=n=>`第${n}卦 ${fullName(GUA[n-1])}「${GN[n-1].ti}」`;
const Q={
 chKey(n){const key=DN[n-1].key.split('……')[0];return mk(`“${key}”出自《道德经》第几章？`,`第${n}章`,others(n,81,3,true).map(k=>`第${k}章`),`出自${chLabel(n)}。`);},
 chTheme(n){return mk(`哪一章讲的是「${DN[n-1].ti}」？`,chLabel(n),others(n,81,3).map(chLabel),DN[n-1].key);},
 chCloze(n){const sents=DDJ[n-1].s.split(/[。；？！]/).map(s=>s.trim()).filter(s=>s.includes('，'));
   const cands=[];sents.forEach(s=>{const parts=s.split('，');parts.forEach((p,i)=>{const c=p.replace(/[“”：、]/g,'');if(c.length>=2&&c.length<=7&&parts.length>1)cands.push([s,i,p]);});});
   if(!cands.length)return Q.chKey(n);const [s,i,p]=pick(cands);const L=p.length;
   const pool=[];DDJ.forEach((d,k)=>{if(k!==n-1)d.s.split(/[，。；？！]/).forEach(x=>{x=x.trim();if(x.length===L&&!/[“”：]/.test(x)&&x!==p)pool.push(x);});});
   const wr=shuffle([...new Set(pool)]).slice(0,3);if(wr.length<3)return Q.chKey(n);
   const parts=s.split('，');parts[i]='＿＿＿＿';return mk(`填空（第${n}章）：“${parts.join('，')}”`,p,wr,`原句：“${s}。”`);},
 caseQ(ref){const isG=ref[0]==='g',n=ref[1],no=isG?GN[n-1]:DN[n-1],txt=pick([no.gu,no.jin]);
   const lab=isG?guaLabel(n):chLabel(n);const wr=isG?others(n,64,3,true).map(guaLabel):others(n,81,3,true).map(chLabel);
   return mk('下面这个案例，最能说明哪一个道理？',lab,wr,lab+'：'+no.ti,`<div class="qsub">${esc(txt)}</div>`);},
 guaShape(n){const g=GUA[n-1];return mk('看卦象：这是哪一卦？（爻从下往上数）',fullName(g),others(n,64,3).map(k=>fullName(GUA[k-1])),`${fullName(g)}：${TRI[g.up].x}在上，${TRI[g.down].x}在下。`,`<div class="qsub" style="display:flex;justify-content:center">${hexSVG(bits(g),110)}</div>`);},
 guaTri(n){const g=GUA[n-1];return mk(`上卦是${g.up}（${TRI[g.up].x}），下卦是${g.down}（${TRI[g.down].x}），这是哪一卦？`,g.name,others(n,64,3).map(k=>GUA[k-1].name),`${fullName(g)}，第${n}卦。`);},
 guaDx(n){const g=GUA[n-1];const nm=[...g.name];let dx=g.dx;nm.forEach(c=>{dx=dx.split(c).join('○');});
   return mk(`《象传》说：“${dx}”（○为卦名）这是哪一卦？`,g.name,others(n,64,3,true).map(k=>GUA[k-1].name),`象曰：${g.dx}`);},
 guaTi(n){return mk(`哪一卦的核心是「${GN[n-1].ti}」？`,guaLabel(n),others(n,64,3).map(guaLabel),GN[n-1].bh.slice(0,60)+'……');},
 yaoPos(n){const g=GUA[n-1],i=rnd(6),t=g.yao[i],k=t.indexOf('：')>-1?t.indexOf('：'):t.indexOf('，');const posAll=g.yao.slice(0,6).map(y=>y.slice(0,y.search(/[：，]/)));
   const correct=posAll[i];const wr=shuffle(posAll.filter(x=>x!==correct));return mk(`${g.name}卦中，“${t.slice(k+1)}”是哪一爻？`,correct,wr,`${correct}：${GN[n-1].yao[i]}`);},
 tri(){const name=pick(TRI_NAMES),t=TRI[name];return mk('这是八卦中的哪一卦？',`${name}（${t.x}）`,shuffle(TRI_NAMES.filter(x=>x!==name)).slice(0,3).map(x=>`${x}（${TRI[x].x}）`),`${t.song}：${name}为${t.x}，性质“${t.de}”。`,`<div class="qsub" style="display:flex;justify-content:center">${hexSVG(t.b,90)}</div>`);}
};
const BASIC_Q=[
 ()=>mk('《易经》的爻是从哪里开始数的？','从最下面一爻往上数',['从最上面一爻往下数','从中间往两边数','没有固定顺序'],'第一爻叫“初”，在最下；第六爻叫“上”，在最上。'),
 ()=>mk('爻辞中的“九”和“六”分别代表什么？','九是阳爻，六是阴爻',['九是阴爻，六是阳爻','九是第九爻，六是第六爻','都表示吉凶'],'阳爻（—）称九，阴爻（- -）称六，例如“初九”“六二”。'),
 ()=>mk('《道德经》一共有多少章？','81章',['64章','100章','72章'],'通行本《道德经》分81章，前37章为“道经”，后44章为“德经”。'),
 ()=>mk('一个六爻卦由什么组成？','上下两个三爻的八卦',['六个八卦','两个六爻卦','一阴一阳'],'六十四卦 = 8 × 8，每卦由下卦（内卦）和上卦（外卦）组成。'),
 ()=>mk('“离（火）上 坎（水）下”的卦叫什么？','火水未济',['水火既济','火天大有','水火相济'],'读卦名时先读上卦之象，再读下卦之象，最后是卦名：火水未济。')
];
function dayQuestions(d){
  const ch=dayCh(d),gu=dayGua(d),pool=[];
  ch.forEach(n=>{pool.push(Q.chKey(n),Q.chCloze(n),Q.chTheme(n));});
  gu.forEach(n=>{pool.push(Q.guaShape(n),pick([Q.guaTri,Q.guaDx])(n),Q.yaoPos(n),Q.guaTi(n));});
  const items=[...ch.map(n=>['c',n]),...gu.map(n=>['g',n])];
  shuffle(items).slice(0,2).forEach(r=>pool.push(Q.caseQ(r)));
  let qs=shuffle(pool).slice(0,d===1?9:10);
  if(d===1)qs=qs.concat(shuffle(BASIC_Q).slice(0,3).map(f=>f()));
  else{const prev=[];for(let k=1;k<d;k++){dayCh(k).forEach(n=>prev.push(()=>Q.chKey(n)));dayGua(k).forEach(n=>prev.push(()=>Q.guaShape(n)));}
    shuffle(prev).slice(0,2).forEach(f=>{const q=f();q.review=true;qs.push(q);});}
  return shuffle(qs);
}

// ---------- 测验引擎 ----------
function runQuiz(box,qs,onDone,opts={}){
  let i=0,right=0;
  function show(){
    const q=qs[i];
    box.innerHTML=`<div class="quiz"><div class="row" style="justify-content:space-between"><span class="eyebrow">第 ${i+1} / ${qs.length} 题${q.review?' · 温故':''}</span><span class="eyebrow">答对 ${right}</span></div>
      <div class="qbar"><div style="width:${i/qs.length*100}%"></div></div>
      <div class="qq">${esc(q.q)}</div>${q.sub}
      <div class="opts">${q.opts.map((o,k)=>`<button class="opt" data-k="${k}">${'ABCD'[k]}. ${esc(o)}</button>`).join('')}</div><div id="fb"></div></div>`;
    box.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(+b.dataset.k));
  }
  function answer(k){
    const q=qs[i],ok=k===q.a;if(ok)right++;
    box.querySelectorAll('.opt').forEach((b,j)=>{b.disabled=true;if(j===q.a)b.classList.add('ok');else if(j===k)b.classList.add('no');});
    const id=q.q+'|'+q.opts[q.a];
    if(!ok&&!S.mistakes.some(m=>m.id===id)){S.mistakes.push(Object.assign({id},q));}
    if(ok&&opts.fromReview)S.mistakes=S.mistakes.filter(m=>m.id!==id);
    save();
    document.getElementById('fb').innerHTML=`<div class="fb"><b class="${ok?'ok':'no'}">${ok?'答对了':'记下了，已加入错题本'}</b>　${esc(q.exp)}</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="go">${i+1<qs.length?'下一题':'看结果'}</button></div>`;
    const g=document.getElementById('go');g.focus();g.onclick=()=>{i++;if(i<qs.length)show();else end();};
  }
  function end(){
    const r=onDone({right,total:qs.length})||{};
    const st=r.stars;
    box.innerHTML=`<div class="quiz"><div class="panel result">
      <div class="eyebrow">闯关结果</div>
      <div style="font-size:22px">答对 <b>${right}</b> / ${qs.length}</div>
      ${st!==undefined?`<div class="seals">${[0,1,2].map(k=>`<div class="sealmark${k<st?' on':''}" style="animation-delay:${k*.25}s">印</div>`).join('')}</div>`:''}
      ${r.gain!==undefined?`<div class="sans">获得 ${r.gain} 经验</div>`:''}
      <div class="note">${r.pass===false?'至少答对 60% 才能获得朱印并解锁下一座岛。看看错题再来一次。':r.msg||'错题已自动收进错题本，方便以后复习。'}</div>
      <div class="row" style="justify-content:center">${r.retry?'<button class="btn ghost" id="rt">再闯一次</button>':''}${r.next&&r.pass?'<button class="btn" id="nd">前往下一座岛</button>':''}<button class="btn ghost" id="bk">回到地图</button></div>
    </div></div>`;
    if(r.retry)document.getElementById('rt').onclick=r.retry;
    if(r.next&&r.pass)document.getElementById('nd').onclick=r.next;
    document.getElementById('bk').onclick=()=>go('map');
  }
  show();
}

// ---------- 经典库 ----------
let libTab='ddj',libQ='';
function renderLib(arg){
  if(arg&&arg.tab)libTab=arg.tab;
  main.innerHTML=`<section class="view"><div class="head2"><h2 class="brush">经典库</h2>
    <div class="steps"><button data-t="ddj" class="${libTab==='ddj'?'on':''}">道德经 81 章</button><button data-t="gua" class="${libTab==='gua'?'on':''}">易经 64 卦</button></div></div>
    <div class="row"><input class="search" id="q" placeholder="搜索原文、主题或案例，例如：水、谦、范蠡" value="${esc(libQ)}"><span class="note">青框 = 已学过</span></div>
    <div class="grid-n" id="grid"></div><div id="detail" style="display:grid;gap:16px"></div></section>`;
  main.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{libTab=b.dataset.t;renderLib();});
  const q=document.getElementById('q');q.oninput=()=>{libQ=q.value.trim();grid();};
  function grid(){const isD=libTab==='ddj',N=isD?81:64;let h='';
    for(let n=1;n<=N;n++){const no=isD?DN[n-1]:GN[n-1],tx=isD?DDJ[n-1].s:GUA[n-1].name+GUA[n-1].gc+GUA[n-1].yao.join('')+GUA[n-1].dx;
      if(libQ&&!(tx+no.ti+no.bh+no.gu+no.jin).includes(libQ))continue;
      h+=`<button data-n="${n}" class="${(isD?learnedCh:learnedGua).has(n)?'learned':''}"><b>${n}</b><span>${isD?esc(no.ti):esc(GUA[n-1].name)}</span></button>`;}
    const g=document.getElementById('grid');g.innerHTML=h||'<span class="note">没有找到，换个关键词试试。</span>';
    g.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{const d=document.getElementById('detail');d.innerHTML=isD?chapterHTML(+b.dataset.n):guaHTML(+b.dataset.n);bindText(d);d.scrollIntoView({behavior:'smooth'});});}
  grid();
}

// ---------- 卦象训练营 ----------
function renderTrainer(){
  main.innerHTML=`<section class="view"><div class="head2"><div><div class="eyebrow">最佳成绩 ${S.trainerBest} / 20</div><h2 class="brush">卦象训练营</h2></div></div>
   <div class="panel" style="display:grid;gap:12px"><div>20 道速认题：看线条认八卦、看卦象认六十四卦、看上下卦说卦名。记住口诀，越练越快。</div>
   <div class="tri">${TRI_NAMES.map(k=>`<div>${hexSVG(TRI[k].b,50)}<b>${k}</b><span class="sans" style="font-size:13px">${TRI[k].x} · ${TRI[k].song}</span></div>`).join('')}</div>
   <div class="row"><button class="btn" id="st">开始训练</button><span class="note">只练已学过的卦？已学 ${learnedGua.size} 卦</span><label class="note"><input type="checkbox" id="only" ${learnedGua.size>=4?'':'disabled'}> 只练已学</label></div></div><div id="qz"></div></section>`;
  document.getElementById('st').onclick=()=>{
    const only=document.getElementById('only').checked,pool=only?[...learnedGua]:Array.from({length:64},(_,i)=>i+1);
    const qs=Array.from({length:20},(_,k)=>k<5?Q.tri():pick([Q.guaShape,Q.guaTri])(pick(pool)));
    const t0=Date.now();main.querySelector('.panel').hidden=true;
    runQuiz(document.getElementById('qz'),qs,({right})=>{const sec=Math.round((Date.now()-t0)/1000);const nb=right>S.trainerBest;if(nb)S.trainerBest=right;S.xp+=right*3;save();renderTop();
      return {gain:right*3,msg:`用时 ${sec} 秒${nb?'，刷新了最佳成绩':''}。`,retry:()=>renderTrainer()};});
  };
}

// ---------- 错题本 ----------
function renderReview(){
  const m=S.mistakes;
  main.innerHTML=`<section class="view"><div class="head2"><h2 class="brush">错题本</h2><span class="note">重练时答对的题会自动移出</span></div>
   ${m.length?`<div class="row"><button class="btn" id="go">重练错题（${Math.min(m.length,15)} 题）</button><button class="btn ghost" id="mix">综合复习已学内容</button></div>
   <div class="panel" style="display:grid;gap:10px">${m.slice(-30).reverse().map(x=>`<div style="border-bottom:1px solid var(--line);padding-bottom:8px"><div>${esc(x.q)}</div><div class="note">正确答案：${esc(x.opts[x.a])}　${esc(x.exp)}</div></div>`).join('')}</div>`
   :`<div class="panel">还没有错题。闯关时答错的题会自动收进这里。<div class="row" style="margin-top:10px"><button class="btn ghost" id="mix" ${learnedCh.size?'':'disabled'}>综合复习已学内容</button></div></div>`}
   <div id="qz"></div></section>`;
  const b=document.getElementById('go');
  if(b)b.onclick=()=>{const qs=shuffle(m).slice(0,15).map(x=>{const o=shuffle(x.opts.map((t,k)=>[t,k===x.a]));return Object.assign({},x,{opts:o.map(z=>z[0]),a:o.findIndex(z=>z[1])});});
    main.querySelector('.row').hidden=true;runQuiz(document.getElementById('qz'),qs,({right})=>{S.xp+=right*5;save();renderTop();return {gain:right*5,retry:()=>renderReview()};},{fromReview:true});};
  const mx=document.getElementById('mix');
  if(mx)mx.onclick=()=>{const c=[...learnedCh],g=[...learnedGua];if(!c.length){toast('先完成第一座岛');return;}
    const qs=Array.from({length:12},(_,k)=>k%2||!g.length?pick([Q.chKey,Q.chCloze,Q.chTheme])(pick(c)):pick([Q.guaShape,Q.guaDx,Q.yaoPos])(pick(g)));
    main.querySelectorAll('.row,.panel').forEach(e=>e.hidden=true);runQuiz(document.getElementById('qz'),qs,({right})=>{S.xp+=right*5;save();renderTop();return {gain:right*5,retry:()=>renderReview()};});};
}

// ---------- 编号对读 ----------
function renderCode(){
  main.innerHTML=`<section class="view"><div class="head2"><h2 class="brush">编号对读</h2></div>
   <div class="panel" style="display:grid;gap:12px">
    <div>输入四位编号：<b>前两位</b>是《道德经》章数（01–81），<b>后两位</b>是《易经》卦序（01–64）。例如书中的 4841 = 第48章 × 第41卦（损）。系统会把这一章与这一卦并排展开，供你对照学习。</div>
    <div class="row"><input class="code-in" id="ci" inputmode="numeric" maxlength="4" value="4841" aria-label="四位编号"><button class="btn" id="cb">展开对读</button>
     ${Object.keys(CODES).map(k=>`<button class="btn ghost small" data-c="${k}">${k}</button>`).join('')}</div>
    <div class="note">这里只把编号当作“一章配一卦”的学习索引。经文的价值在于理解与践行，默念编号本身不能代替看病、心理咨询或做决定。</div>
   </div><div id="out" style="display:grid;gap:16px"></div></section>`;
  const ci=document.getElementById('ci');
  const run=()=>{const v=ci.value.replace(/\D/g,'');const c=+v.slice(0,2),g=+v.slice(2,4),o=document.getElementById('out');
    if(v.length!==4||c<1||c>81||g<1||g>64){o.innerHTML='<div class="panel">编号要是四位数字：前两位 01–81，后两位 01–64。</div>';return;}
    const an=CODES[v]||`把《道德经》第${c}章「${DN[c-1].ti}」与《易经》第${g}卦${fullName(GUA[g-1])}「${GN[g-1].ti}」放在一起读：先找出两者共同的关键词（比如“柔”“止”“信”“损”），再想一想：老子的这句话，能不能解释这一卦的某一爻？这一卦的处境，又能不能用这一章的智慧来应对？把你的答案写在本子上。`;
    o.innerHTML=pairHTML(c,g,an,'编号'+v+'　')+`<div class="two">${chapterHTML(c)}${guaHTML(g)}</div>`;bindText(o);bindPair(an);};
  document.getElementById('cb').onclick=run;ci.onkeydown=e=>{if(e.key==='Enter')run();};
  main.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{ci.value=b.dataset.c;run();});run();
}

// ---------- 入门须知 ----------
function basicsHTML(){return `<div class="page basics">
  <div class="ph"><span class="eyebrow">第一天先读这一页</span><h3>两部书，怎么读</h3></div>
  <div><div class="lab">《道德经》</div>春秋时期老子所著，约五千字，通行本（王弼本）分 81 章：第 1–37 章为“道经”，讲宇宙规律；第 38–81 章为“德经”，讲做人做事。核心词：道、德、无为、不争、柔弱、知足。</div>
  <div><div class="lab">《易经》（周易）</div>由 64 卦组成，每卦有卦辞和 6 条爻辞，后来又有孔子一派写的《易传》（如《彖传》《象传》）来解释。核心思想是“变”：处境不断变化，人要看清处境、顺势而为。</div>
  <div><div class="lab">读卦的四个要点</div>
   <ol style="margin:4px 0;padding-left:1.3em">
    <li>阳爻是一条长线 —，阴爻是中间断开的 - -。</li>
    <li>六爻<b>从下往上</b>数：初、二、三、四、五、上。</li>
    <li>阳爻称“九”，阴爻称“六”。所以“初六”是最下面一爻且为阴，“九五”是第五爻且为阳。</li>
    <li>下面三爻叫下卦（内卦），上面三爻叫上卦（外卦）。卦名全称先读上卦之象、再读下卦之象：离（火）上坎（水）下 → <b>火水未济</b>。</li>
   </ol></div>
  <div><div class="lab">八卦口诀：乾三连，坤六断；震仰盂，艮覆碗；离中虚，坎中满；兑上缺，巽下断。</div>
   <div class="tri" style="margin-top:8px">${TRI_NAMES.map(k=>`<div>${hexSVG(TRI[k].b,50)}<b>${k}</b><span class="sans" style="font-size:13px">${TRI[k].x} · ${TRI[k].de} · ${TRI[k].fam}</span></div>`).join('')}</div></div>
  <div><div class="lab">每天怎么学（40–60 分钟）</div>
   <div class="tablewrap"><table class="t"><tr><th>步骤</th><th>做什么</th><th>时间</th></tr>
   <tr><td>读经</td><td>朗读当天 2–3 章原文，看白话和古今案例，用“背诵”按钮遮字自测</td><td>15–20 分钟</td></tr>
   <tr><td>观象</td><td>认卦象、读卦辞和六爻，看每一爻的白话</td><td>15–20 分钟</td></tr>
   <tr><td>对读</td><td>读一章一卦的对读分析（竖排，像书一样）</td><td>5 分钟</td></tr>
   <tr><td>闯关</td><td>12 道题，答对 60% 得朱印、解锁下一岛</td><td>5–10 分钟</td></tr>
   <tr><td>践行</td><td>完成“今日一用”里的一件小事</td><td>全天</td></tr></table></div></div>
  <div class="note">原文：《道德经》用王弼本，《周易》用通行本（均据维基文库整理）。可在“设置”里切换繁体原文。</div>
 </div>`;}
function bindBasics(){}
function renderBasics(){main.innerHTML=`<section class="view"><div class="head2"><h2 class="brush">入门须知</h2></div>${basicsHTML()}</section>`;}

// ---------- 设置 ----------
function renderSettings(){
  main.innerHTML=`<section class="view"><div class="head2"><h2 class="brush">设置</h2></div>
   <div class="panel" style="display:grid;gap:14px;max-width:640px">
    <label class="row"><input type="checkbox" id="trad" ${S.trad?'checked':''}> 原文显示繁体（同书中排版）</label>
    <label class="row">朗读语速 <input type="range" id="rate" min="0.5" max="1.3" step="0.05" value="${S.rate}"> <span id="rv">${S.rate}</span> <button class="btn ghost small" id="tst">试听</button></label>
    <label class="row"><input type="checkbox" id="ul" ${S.unlockAll?'checked':''}> 解锁全部 30 座岛（可跳着学）</label>
    <div><div class="lab">备份进度</div><div class="note">进度保存在这台电脑的浏览器里。换电脑或清理浏览器前，复制下面的进度码保存起来；导入时粘贴回来。</div>
     <textarea id="bk" readonly></textarea><div class="row"><button class="btn ghost small" id="cp">复制进度码</button></div></div>
    <div><div class="lab">导入进度</div><textarea id="im" placeholder="把进度码粘贴到这里"></textarea><div class="row"><button class="btn ghost small" id="imb">导入</button></div></div>
    <div><div class="lab">重新开始</div><div class="row"><button class="btn ghost small" id="rs">清空全部进度</button><span id="rsc"></span></div></div>
   </div></section>`;
  const $=id=>document.getElementById(id);
  $('trad').onchange=e=>{S.trad=e.target.checked;save();toast(S.trad?'原文改为繁体':'原文改为简体');};
  $('rate').oninput=e=>{S.rate=+e.target.value;$('rv').textContent=S.rate;save();};
  $('tst').onclick=()=>speak('上善若水。水善利万物而不争。');
  $('ul').onchange=e=>{S.unlockAll=e.target.checked;save();toast(S.unlockAll?'已解锁全部岛屿':'恢复按顺序解锁');};
  const code=btoa(unescape(encodeURIComponent(JSON.stringify(S))));$('bk').value=code;
  $('cp').onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(code).then(()=>toast('进度码已复制'),()=>{$('bk').select();toast('请按 Ctrl+C 复制');})||($('bk').select(),toast('请按 Ctrl+C 复制'));};
  $('imb').onclick=()=>{try{const o=JSON.parse(decodeURIComponent(escape(atob($('im').value.trim()))));if(typeof o.xp!=='number')throw 0;S=Object.assign(fresh(),o);save();renderTop();toast('进度已导入');}catch(e){toast('进度码不正确，请检查是否复制完整');}};
  $('rs').onclick=()=>{$('rsc').innerHTML='<span class="note">确定清空？</span> <button class="btn small" id="rsy">确定清空</button>';$('rsy').onclick=()=>{S=fresh();save();renderTop();toast('已清空');go('map');};};
}

if('speechSynthesis' in window)speechSynthesis.getVoices();
go('map');
})();
