(function(){
"use strict";
const DDJ=window.DDJ, GUA=window.GUA, DN=window.DDJ_NOTES, GN=window.GUA_NOTES, PLAN=window.PLAN, SEAS=window.SEAS, CODES=window.CODE_PAIRS;
const main=document.getElementById('main');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CN='零一二三四五六七八九';
const cnum=n=>n<=10?(n===10?'十':CN[n]):n<20?'十'+(n%10?CN[n%10]:''):CN[Math.floor(n/10)]+'十'+(n%10?CN[n%10]:'');

// ---------- 八卦与五行配色 ----------
const TRI={
 '乾':{b:[1,1,1],x:'天',de:'健',song:'乾三连',fam:'父',wx:'jin',wn:'金'},
 '坤':{b:[0,0,0],x:'地',de:'顺',song:'坤六断',fam:'母',wx:'tu',wn:'土'},
 '震':{b:[1,0,0],x:'雷',de:'动',song:'震仰盂',fam:'长男',wx:'mu',wn:'木'},
 '巽':{b:[0,1,1],x:'风',de:'入',song:'巽下断',fam:'长女',wx:'mu',wn:'木'},
 '坎':{b:[0,1,0],x:'水',de:'陷',song:'坎中满',fam:'中男',wx:'shui',wn:'水'},
 '离':{b:[1,0,1],x:'火',de:'丽',song:'离中虚',fam:'中女',wx:'huo',wn:'火'},
 '艮':{b:[0,0,1],x:'山',de:'止',song:'艮覆碗',fam:'少男',wx:'tu',wn:'土'},
 '兑':{b:[1,1,0],x:'泽',de:'说（悦）',song:'兑上缺',fam:'少女',wx:'jin',wn:'金'}
};
const TRI_NAMES=Object.keys(TRI);
const tc=t=>`var(--${TRI[t].wx})`;
const bits=g=>[...TRI[g.down].b,...TRI[g.up].b];          // 从下往上
const gcols=g=>[tc(g.down),tc(g.down),tc(g.down),tc(g.up),tc(g.up),tc(g.up)];
const fullName=g=>g.up===g.down?g.name+'为'+TRI[g.up].x:TRI[g.up].x+TRI[g.down].x+g.name;
function hexSVG(b,w,cols){const lh=w*0.1,gap=w*0.17;let r='';
  b.forEach((v,i)=>{const y=(b.length-1-i)*gap,c=cols?cols[i]:'var(--ink)',half=w*0.42;
    r+=v?`<rect x="0" y="${y}" width="${w}" height="${lh}" rx="${lh/3}" fill="${c}"/>`:`<rect x="0" y="${y}" width="${half}" height="${lh}" rx="${lh/3}" fill="${c}"/><rect x="${w-half}" y="${y}" width="${half}" height="${lh}" rx="${lh/3}" fill="${c}"/>`;});
  return `<svg class="hexa" width="${w}" viewBox="0 0 ${w} ${(b.length-1)*gap+lh}" role="img" aria-label="卦象">${r}</svg>`;}
const guaSVG=(g,w)=>hexSVG(bits(g),w,gcols(g));
const triSVG=(t,w)=>hexSVG(TRI[t].b,w,[tc(t),tc(t),tc(t)]);
const SEA_C=['var(--s1)','var(--s2)','var(--s3)','var(--s4)','var(--s5)'];
const seaIdx=d=>Math.floor((d-1)/6);

// ---------- 吉祥物“易宝” ----------
function mascot(mood,size,cls){const m=mood==='sad'?'M40 66 Q50 58 60 66':mood==='happy'?'M38 60 Q50 74 62 60':'M42 63 Q50 68 58 63';
  return `<svg class="mascot ${cls||''}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
   <ellipse cx="36" cy="94" rx="10" ry="5" fill="#F5A623"/><ellipse cx="64" cy="94" rx="10" ry="5" fill="#F5A623"/>
   <circle cx="50" cy="50" r="42" fill="#fff" stroke="#18263A" stroke-width="3"/>
   <path d="M50 8 A42 42 0 0 1 50 92 A21 21 0 0 1 50 50 A21 21 0 0 0 50 8Z" fill="#18263A"/>
   <circle cx="50" cy="29" r="6" fill="#18263A"/><circle cx="50" cy="71" r="6" fill="#fff"/>
   <g class="eye"><circle cx="35" cy="44" r="9" fill="#fff" stroke="#18263A" stroke-width="2"/><circle cx="37" cy="45" r="4.5" fill="#18263A"/></g>
   <g class="eye"><circle cx="65" cy="44" r="9" fill="#fff" stroke="#18263A" stroke-width="2"/><circle cx="67" cy="45" r="4.5" fill="#18263A"/></g>
   <circle cx="26" cy="58" r="5" fill="#FF8FA3" opacity=".8"/><circle cx="74" cy="58" r="5" fill="#FF8FA3" opacity=".8"/>
   <path d="${m}" fill="none" stroke="#E5484D" stroke-width="4" stroke-linecap="round"/></svg>`;}
const CHEER=['答得漂亮！','一点就通！','对啦，继续！','妙哉！','学而时习之，不亦说乎！','好眼力！'];
const COMFORT=['没关系，错题已收好。','失之东隅，收之桑榆。','知不知，上——再看一遍就记住了。','曲则全，下一题加油！'];

// ---------- 进度存储 ----------
const KEY='yidao-island-v1';
const fresh=()=>({xp:0,days:{},seen:{},mistakes:[],dates:[],trad:false,rate:0.85,unlockAll:false,trainerBest:0,sound:true,badges:{},bestCombo:0});
let S=fresh();
try{const raw=localStorage.getItem(KEY);if(raw)S=Object.assign(fresh(),JSON.parse(raw));}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
const dkey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>dkey(new Date());
function markStudy(){const t=today();if(!S.dates.includes(t)){S.dates.push(t);save();}}
function streak(){const set=new Set(S.dates);let n=0;const d=new Date();if(!set.has(today()))d.setDate(d.getDate()-1);
  while(set.has(dkey(d))){n++;d.setDate(d.getDate()-1);}return n;}
const LEVELS=[[0,'童生'],[300,'秀才'],[900,'举人'],[1800,'进士'],[3000,'翰林'],[4500,'大儒'],[6500,'悟道者']];
function level(){let i=0;while(i+1<LEVELS.length&&S.xp>=LEVELS[i+1][0])i++;const cur=LEVELS[i],nx=LEVELS[i+1];
  return {name:cur[1],pct:nx?(S.xp-cur[0])/(nx[0]-cur[0]):1};}
function toast(m){const t=document.getElementById('toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2400);}

// ---------- 音效与彩带 ----------
let AC=null;
function tone(notes,type){if(!S.sound)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();
  notes.forEach(([f,t,d])=>{const o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.value=f;o.connect(g);g.connect(AC.destination);
    const s=AC.currentTime+t;g.gain.setValueAtTime(0.0001,s);g.gain.exponentialRampToValueAtTime(0.18,s+0.02);g.gain.exponentialRampToValueAtTime(0.0001,s+d);o.start(s);o.stop(s+d+0.02);});}catch(e){}}
const SFX={ok:()=>tone([[660,0,.15],[990,.1,.25]],'triangle'),no:()=>tone([[220,0,.25],[180,.12,.3]],'sawtooth'),
  win:()=>tone([[523,0,.2],[659,.15,.2],[784,.3,.2],[1047,.45,.45]],'triangle'),stamp:()=>tone([[140,0,.15]],'square'),click:()=>tone([[880,0,.06]],'sine')};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const cvs=document.getElementById('fx'),ctx=cvs.getContext('2d');let parts=[],raf=0;
function confetti(n,x,y){if(reduce)return;const cs=getComputedStyle(document.documentElement);
  const cols=['--s1','--s2','--s3','--s4','--s5','--gold','--huo'].map(k=>cs.getPropertyValue(k).trim());
  cvs.width=innerWidth;cvs.height=innerHeight;x=x??innerWidth/2;y=y??innerHeight/3;
  for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=3+Math.random()*7;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-4,r:3+Math.random()*4,c:cols[i%cols.length],l:60+Math.random()*40,rot:Math.random()*6});}
  if(!raf)raf=requestAnimationFrame(tick);}
function tick(){ctx.clearRect(0,0,cvs.width,cvs.height);parts=parts.filter(p=>p.l-->0);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.vx*=.98;p.rot+=.2;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore();});
  raf=parts.length?requestAnimationFrame(tick):0;if(!raf)ctx.clearRect(0,0,cvs.width,cvs.height);}

// ---------- 成就 ----------
const BADGES=[
 ['first','初登岛','完成第一座岛','var(--s1)','登'],
 ['full','满朱印','一次闯关拿满三颗星','var(--gold)','满'],
 ['combo5','五连对','测验中连续答对5题','var(--s5)','连'],
 ['combo10','十全十美','连续答对10题','var(--huo)','十'],
 ['streak3','三日不辍','连续学习3天','var(--s2)','恒'],
 ['streak7','七日来复','连续学习7天（复卦“七日来复”）','var(--mu)','复'],
 ['sea1','启航成功','完成启航海6座岛','var(--s1)','航'],
 ['half','半程','完成15座岛','var(--s3)','半'],
 ['trainer','卦象达人','卦象训练营答对18题以上','var(--shui)','卦'],
 ['review','知错能改','在错题本中答对10题','var(--tu)','改'],
 ['all','既济未济','完成全部30座岛','var(--s5)','道']
];
function award(id){if(S.badges[id])return;S.badges[id]=today();save();const b=BADGES.find(x=>x[0]===id);setTimeout(()=>{toast('获得成就：'+b[1]+'！');SFX.win();confetti(80);},700);}
function checkBadges(){const done=Object.values(S.days).filter(x=>x.stars>0).length;
  if(done>=1)award('first');if(done>=15)award('half');if(done>=30)award('all');
  if([1,2,3,4,5,6].every(d=>S.days[d]&&S.days[d].stars>0))award('sea1');
  const st=streak();if(st>=3)award('streak3');if(st>=7)award('streak7');
  if(S.bestCombo>=5)award('combo5');if(S.bestCombo>=10)award('combo10');}

// ---------- 计划 ----------
const dayCh=d=>d<=21?[3*d-2,3*d-1,3*d]:[64+2*(d-22),65+2*(d-22)];
const dayGua=d=>d<=26?[2*d-1,2*d]:[53+3*(d-27),54+3*(d-27),55+3*(d-27)];
const unlocked=d=>S.unlockAll||d===1||!!(S.days[d-1]&&S.days[d-1].stars>0);
const nextDay=()=>{for(let d=1;d<=30;d++)if(!(S.days[d]&&S.days[d].stars>0))return d;return 30;};
const learnedCh=new Set(),learnedGua=new Set();
function refreshLearned(){learnedCh.clear();learnedGua.clear();for(let d=1;d<=30;d++)if(S.days[d]&&S.days[d].stars>0){dayCh(d).forEach(n=>learnedCh.add(n));dayGua(d).forEach(n=>learnedGua.add(n));}}
const chDay=n=>{for(let d=1;d<=30;d++)if(dayCh(d).includes(n))return d;};
const guaDay=n=>{for(let d=1;d<=30;d++)if(dayGua(d).includes(n))return d;};

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
  document.getElementById('logomas').innerHTML=mascot('idle',34);
  document.getElementById('stats').innerHTML=`<span class="chip lv">${L.name}</span><span class="chip xp"><span class="xpbar"><div style="width:${Math.round(L.pct*100)}%"></div></span>${S.xp} 经验</span><span class="chip fire">连续 ${streak()} 天</span><button class="chip snd" id="snd" aria-label="音效开关">${S.sound?'音效 开':'音效 关'}</button>`;
  document.getElementById('snd').onclick=()=>{S.sound=!S.sound;save();renderTop();SFX.click();};
  document.getElementById('tabs').innerHTML=NAV.map(([k,t])=>`<button data-nav="${k}" class="${curView===k||(curView==='day'&&k==='map')?'on':''}">${t}${k==='review'&&S.mistakes.length?` · ${S.mistakes.length}`:''}</button>`).join('');
}
document.getElementById('tabs').addEventListener('click',e=>{const b=e.target.closest('[data-nav]');if(b){SFX.click();go(b.dataset.nav);}});
document.getElementById('logo').addEventListener('click',()=>go('map'));
function go(v,arg){curView=v;if(window.speechSynthesis)speechSynthesis.cancel();refreshLearned();
  ({map:renderMap,day:renderDay,lib:renderLib,trainer:renderTrainer,review:renderReview,code:renderCode,basics:renderBasics,settings:renderSettings})[v](arg);
  renderTop();window.scrollTo(0,0);}

// ---------- 地图 ----------
function renderMap(){
  checkBadges();
  const nd=nextDay(),p=PLAN[nd-1],done=Object.values(S.days).filter(x=>x.stars>0).length;
  const stars=Object.values(S.days).reduce((a,x)=>a+(x.stars||0),0);
  const tipN=1+Math.floor(Date.now()/864e5)%81,tip=DN[tipN-1];
  main.innerHTML=`<section class="view">
   <div class="today">
    <div class="hero" style="background:linear-gradient(135deg,${SEA_C[seaIdx(nd)]},var(--s4))">
      <div class="eyebrow">今日航程 · 第 ${nd} 天 / 30 · ${SEAS[seaIdx(nd)].name}</div>
      <div class="big">${p.isle}</div>
      <div class="fun" style="font-size:18px">${esc(p.theme)}</div>
      <ul>
        <li>读经：《道德经》第 ${dayCh(nd).join('、')} 章</li>
        <li>观象：${dayGua(nd).map(n=>GUA[n-1].name+'卦').join('、')}</li>
        <li>对读：第 ${p.pair[0]} 章 × ${GUA[p.pair[1]-1].name}卦，再闯关 12 题</li>
      </ul>
      <div class="row"><button class="btn" data-day="${nd}">出发登岛 →</button><span class="note">约 40–60 分钟</span></div>
    </div>
    <div class="panel" style="display:grid;gap:14px">
      <div class="talk">${mascot('happy',64)}<div class="bubble"><b>易宝每日一句</b><br>“${esc(tip.key.split('……')[0])}”<span class="note">（第${tipN}章）</span></div></div>
      <div class="tiles">
        <div class="tile" style="--c:var(--s1)"><span class="eyebrow">已登岛</span><b>${done}/30</b></div>
        <div class="tile" style="--c:var(--gold)"><span class="eyebrow">金星</span><b>${stars}/90</b></div>
        <div class="tile" style="--c:var(--s3)"><span class="eyebrow">已学章节</span><b>${learnedCh.size}/81</b></div>
        <div class="tile" style="--c:var(--s5)"><span class="eyebrow">已学卦</span><b>${learnedGua.size}/64</b></div>
      </div>
    </div>
   </div>
   <div class="head2"><h2 class="fun">五海三十岛</h2><span class="note">闯关拿到至少一颗星，就能解锁下一座岛</span></div>
   <div class="map" id="map"></div>
   <div class="head2"><h2 class="fun">成就徽章 <span class="note">${Object.keys(S.badges).length}/${BADGES.length}</span></h2></div>
   <div class="badges">${BADGES.map(b=>`<div class="badge${S.badges[b[0]]?'':' off'}" style="--c:${b[3]}" title="${esc(b[2])}"><i>${b[4]}</i><div><b>${b[1]}</b><div class="note">${esc(b[2])}</div></div></div>`).join('')}</div>
  </section>`;
  main.querySelector('[data-day]').onclick=()=>{SFX.click();go('day',{d:nd});};
  drawMap();
}
function drawMap(){
  const box=document.getElementById('map');if(!box)return;
  const cols=box.clientWidth<640?3:6,W=cols===3?520:1000,rowH=cols===3?190:240,top=80,sfs=cols===3?24:28;
  const rowsPerSea=6/cols,rows=30/cols,H=top+rows*rowH+44*SEAS.length;
  let pts=[],svg='';
  for(let d=1;d<=30;d++){const i=d-1,r=Math.floor(i/cols),c=i%cols,sea=seaIdx(d);
    const cc=r%2?cols-1-c:c;pts.push([(W/cols)*(cc+.5),top+r*rowH+sea*44+rowH*.45+((d*37)%5-2)*7]);}
  SEAS.forEach((s,k)=>{const y0=top+k*rowsPerSea*rowH+k*44-50;
    svg+=`<rect x="0" y="${y0+10}" width="${W}" height="${rowsPerSea*rowH+44}" fill="${SEA_C[k]}" opacity=".13"/>`;
    svg+=`<g transform="translate(16 ${y0+16})"><rect width="${s.name.length*sfs+(cols===3?96:300)}" height="${sfs+14}" rx="${(sfs+14)/2}" fill="${SEA_C[k]}"/>
      <text x="14" y="${sfs}" font-size="${sfs}" fill="#fff" style="font-family:var(--f-brush)">${s.name}</text>
      <text x="${s.name.length*sfs+22}" y="${sfs-4}" font-size="${cols===3?13:15}" fill="#fff" style="font-family:var(--f-fun)">第${s.days[0]}–${s.days[1]}天${cols===3?'':' · '+s.desc}</text></g>`;});
  for(let k=0;k<22;k++){const x=(k*173)%W,y=top+(k*131)%(H-top);svg+=`<path class="wave" style="animation-delay:-${k%6}s" d="M${x} ${y} q10 -8 20 0 t20 0"/>`;}
  svg+=`<path class="path" d="M${pts.map(p=>p.join(' ')).join(' L')}"/>`;
  const nd=nextDay(),R=cols===3?60:56,fs=cols===3?24:23;
  pts.forEach(([x,y],i)=>{const d=i+1,p=PLAN[i],st=S.days[d],lock=!unlocked(d),col=SEA_C[seaIdx(d)];
    let blob='',rim='';const n=10;for(let k=0;k<n;k++){const a=k/n*Math.PI*2,rr=R*(0.84+0.16*Math.sin(d*3.1+k*2.3));
      blob+=(k?'L':'M')+(x+Math.cos(a)*rr*1.2).toFixed(1)+' '+(y+Math.sin(a)*rr*.72).toFixed(1);
      rim+=(k?'L':'M')+(x+Math.cos(a)*(rr+9)*1.2).toFixed(1)+' '+(y+6+Math.sin(a)*(rr+9)*.72).toFixed(1);}
    const trees=lock?'':[[-0.55,-0.5],[0.6,-0.45]].map(([a,b],k)=>`<circle class="tree" cx="${x+a*R}" cy="${y+b*R}" r="${R*.16}" fill="${k?'var(--mu)':'#3FC07A'}"/><rect x="${x+a*R-2}" y="${y+b*R+R*.12}" width="4" height="${R*.14}" fill="var(--tu)"/>`).join('');
    const starRow=st&&st.stars?Array.from({length:3},(_,k)=>`<path transform="translate(${x-30+k*22} ${y+R*.58}) scale(.9)" d="${STAR_D}" fill="${k<st.stars?'var(--gold)':'#ffffff88'}" stroke="#fff" stroke-width="1.5"/>`).join(''):'';
    const lockI=lock?`<g transform="translate(${x-9} ${y+R*.42})"><rect y="7" width="18" height="13" rx="3" fill="#fff"/><path d="M4 8V5a5 5 0 0 1 10 0v3" stroke="#fff" stroke-width="2.5" fill="none"/></g>`:'';
    const boat=d===nd?`<g class="boat"><path d="M${x+R*1.05} ${y-R*.55} l34 0 l-6 10 l-22 0z" fill="var(--huo)"/><path d="M${x+R*1.05+17} ${y-R*.55} v-26 l14 18z" fill="#fff" stroke="var(--ink)" stroke-width="1"/></g>`:'';
    svg+=`<g class="isle${lock?' lock':''}" data-d="${d}" tabindex="${lock?-1:0}" role="button" aria-label="第${d}天 ${p.isle}${lock?'（未解锁）':''}"><g class="grp">
      <path class="rim" d="${rim}Z"/><path class="land" d="${blob}Z" fill="${col}"/>${trees}
      <text x="${x}" y="${y-R*.05}" text-anchor="middle" font-size="${fs*.6}" fill="#fff">第${d}天</text>
      <text x="${x}" y="${y+fs*.85}" text-anchor="middle" font-size="${fs}" fill="#fff" style="font-family:var(--f-brush)">${p.isle}</text>${starRow}${lockI}</g>${boat}</g>`;});
  box.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="学习地图">${svg}</svg>`;
  box.querySelectorAll('.isle').forEach(g=>{const f=()=>{const d=+g.dataset.d;if(!unlocked(d)){SFX.no();toast('先完成第'+(d-1)+'天的闯关，才能登上这座岛');return;}SFX.click();go('day',{d});};
    g.addEventListener('click',f);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();f();}});});
}
const STAR_D='M10 0 L12.9 6.2 L19.5 6.9 L14.5 11.4 L15.9 18 L10 14.6 L4.1 18 L5.5 11.4 L0.5 6.9 L7.1 6.2Z';
let rsz;window.addEventListener('resize',()=>{clearTimeout(rsz);rsz=setTimeout(()=>{if(curView==='map')drawMap();},200);});

// ---------- 章节 / 卦 渲染 ----------
function chapterHTML(n){const t=DDJ[n-1],no=DN[n-1];const txt=S.trad?t.t:t.s;
  return `<article class="page" style="--pc:${n<=37?'var(--s3)':'var(--s2)'}">
   <div class="ph"><span class="tag">${n<=37?'道经':'德经'} · 第${cnum(n)}章</span><h3>${esc(no.ti)}</h3>
    <span class="tools"><button class="btn small" data-speak="${n}">朗读</button><button class="btn small" data-recite="${n}">背诵</button></span></div>
   <div class="yw" id="yw-${n}">${esc(txt)}</div>
   <div class="key"><div class="lab" style="--lc:var(--jin)">必背名句</div>${esc(no.key)}</div>
   <div class="bh"><div class="lab">白话精讲</div>${esc(no.bh)}</div>
   <div class="cases"><div class="case gu"><div class="lab">古代案例</div>${esc(no.gu)}</div><div class="case jin"><div class="lab">近现代案例</div>${esc(no.jin)}</div></div>
   <div class="yong">今日一用：${esc(no.yong)}</div></article>`;}
function guaHTML(n){const g=GUA[n-1],no=GN[n-1],tr=S.trad,b=bits(g),cl=gcols(g);
  const pos=g.yao.map((y,i)=>{const t=tr?g.yaoT[i]:y;const k=t.indexOf('：')>-1?t.indexOf('：'):t.indexOf('，');return [t.slice(0,k),t.slice(k+1)];});
  const rows=pos.map((p,i)=>`<div><span class="bar${i<6&&!b[i]?' yin':''}" style="--c:${i<6?cl[i]:'var(--muted)'}"></span><div class="t"><span class="p">${esc(p[0])}</span>：${esc(p[1])}</div><div class="w">${i<6?esc(no.yao[i]):(n===1?'群龙无首：刚而不为首，吉':'利永贞：柔顺而长守正道')}</div></div>`);
  return `<article class="page" style="--pc:${tc(g.up)}">
   <div class="ph"><span class="tag">第${cnum(n)}卦</span><h3>${fullName(g)} · ${esc(no.ti)}</h3>
    <span class="tools"><button class="btn small" data-speakg="${n}">朗读</button></span></div>
   <div class="gtop">${guaSVG(g,100)}
     <div class="trilegend"><span><i style="--c:${tc(g.up)}"></i>上卦 ${g.up}（${TRI[g.up].x} · 五行属${TRI[g.up].wn}）</span><span><i style="--c:${tc(g.down)}"></i>下卦 ${g.down}（${TRI[g.down].x} · 五行属${TRI[g.down].wn}）</span></div>
     <div style="min-width:0;flex:1 1 260px"><div class="lab">卦辞</div><div class="yw" style="font-size:19px">${esc(tr?g.nameT:g.name)}：${esc(tr?g.gcT:g.gc)}</div>
     <div class="lab" style="margin-top:6px">大象传</div><div style="font-family:var(--f-serif)">${esc(tr?g.dxT:g.dx)}</div></div></div>
   <div class="bh"><div class="lab">白话精讲</div>${esc(no.bh)}</div>
   <div><div class="lab">六爻（从下往上：先读最下面的初爻）</div><div class="yao">${rows.join('')}</div></div>
   <details><summary>彖传原文</summary><div style="margin-top:6px;font-family:var(--f-serif)">${esc(g.tuan)}</div></details>
   <div class="cases"><div class="case gu"><div class="lab">古代案例</div>${esc(no.gu)}</div><div class="case jin"><div class="lab">近现代案例</div>${esc(no.jin)}</div></div>
   <div class="yong">今日一用：${esc(no.yong)}</div></article>`;}
function bindText(root){
  root.querySelectorAll('[data-speak]').forEach(b=>b.onclick=()=>speak(DDJ[b.dataset.speak-1].s));
  root.querySelectorAll('[data-speakg]').forEach(b=>b.onclick=()=>{const g=GUA[b.dataset.speakg-1];speak(g.name+'。'+g.gc+g.yao.join('')+'象曰：'+g.dx);});
  root.querySelectorAll('[data-recite]').forEach(b=>{let lv=0;b.onclick=()=>{lv=(lv+1)%4;SFX.click();const n=+b.dataset.recite,el=document.getElementById('yw-'+n);const txt=S.trad?DDJ[n-1].t:DDJ[n-1].s;
    if(!lv){el.textContent=txt;b.textContent='背诵';return;}
    const ratio=[0,.3,.6,1][lv];let k=0;el.innerHTML=[...txt].map(c=>/[，。；：、？！“”‘’,]/.test(c)?c:`<span class="c${((k++*7919)%100)/100<ratio?' h':''}">${esc(c)}</span>`).join('');
    el.querySelectorAll('.c.h').forEach(s=>s.onclick=()=>{s.classList.remove('h');SFX.click();});b.textContent=['背诵','遮30%','遮60%','全遮'][lv];};});
}

// ---------- 对读 ----------
function pairHTML(c,gn,an,head){const g=GUA[gn-1];
  return `<div class="vs"><div class="side" style="background:var(--s3)"><div class="eyebrow" style="color:#fff">道德经</div><b class="fun" style="font-size:20px;font-weight:400">第${c}章 ${esc(DN[c-1].ti)}</b></div><span class="x">×</span>
    <div class="side" style="background:${tc(g.up)}"><div class="eyebrow" style="color:#fff">易经</div><b class="fun" style="font-size:20px;font-weight:400">${fullName(g)}</b></div></div>
   <div class="bookwrap"><div class="book" id="book">
   <p class="hd">${head||''}《道德经》第${cnum(c)}章 · 《易经》第${cnum(gn)}卦${fullName(g)}</p>
   <p class="q1">道德经：${esc(DN[c-1].key)}</p>
   <p class="q2">易经：${esc(g.name)}，${esc(g.gc)}　象曰：${esc(g.dx)}</p>
   <p class="an">${esc(an)}</p></div></div>
   <div class="row"><button class="btn small" id="flip">改为横排阅读</button><button class="btn small" id="spk">朗读对读</button></div>`;}
function bindPair(an){const b=document.getElementById('flip');if(!b)return;b.onclick=()=>{const k=document.getElementById('book');k.classList.toggle('h');b.textContent=k.classList.contains('h')?'改为竖排阅读':'改为横排阅读';};
  document.getElementById('spk').onclick=()=>speak(an);}

// ---------- 课程页 ----------
function renderDay({d,step}){
  const p=PLAN[d-1];S.seen[d]=S.seen[d]||[];
  const steps=[...(d===1?[['intro','入门']]:[]),['ddj','读经'],['gua','观象'],['pair','对读'],['quiz','闯关']];
  step=step||steps[0][0];if(!S.seen[d].includes(step)){S.seen[d].push(step);save();}
  markStudy();
  const nav=`<div class="dayhead" style="--sc:${SEA_C[seaIdx(d)]}"><div><div class="eyebrow">第 ${d} 天 · ${SEAS[seaIdx(d)].name}</div><h2>${p.isle} · ${esc(p.theme)}</h2></div>
    <div class="steps">${steps.map(([k,t])=>`<button data-step="${k}" class="${k===step?'on':''} ${S.seen[d].includes(k)?'seen':''}">${t}</button>`).join('')}</div></div>`;
  let body='';
  if(step==='intro')body=basicsHTML();
  if(step==='ddj')body=dayCh(d).map(chapterHTML).join('');
  if(step==='gua')body=dayGua(d).map(guaHTML).join('');
  if(step==='pair')body=`<div class="talk">${mascot('happy',56)}<div class="bubble">今天的对读：把一章《道德经》和一卦《易经》放在一起看，找找它们说的是不是同一个道理。</div></div>`+pairHTML(p.pair[0],p.pair[1],p.an,'第'+cnum(d)+'天　')+
     (d===21?`<div class="panel"><div class="lab">加读：4841</div>${esc(CODES['4841'])}</div>`:'');
  const idx=steps.findIndex(s=>s[0]===step),nx=steps[idx+1];
  main.innerHTML=`<section class="view">${nav}${step==='quiz'?'<div id="qz"></div>':body}
   ${step!=='quiz'&&nx?`<div class="row"><button class="btn ${nx[0]==='quiz'?'warm':'go'}" id="nx">下一步：${nx[1]} →</button></div>`:''}</section>`;
  main.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{SFX.click();go('day',{d,step:b.dataset.step});});
  if(nx&&step!=='quiz')document.getElementById('nx').onclick=()=>{SFX.click();go('day',{d,step:nx[0]});};
  bindText(main);if(step==='pair')bindPair(p.an);
  if(step==='quiz')runQuiz(document.getElementById('qz'),dayQuestions(d),res=>finishDay(d,res));
}
function finishDay(d,{right,total,bonus}){
  const pct=right/total,stars=pct>=.9?3:pct>=.75?2:pct>=.6?1:0;const old=S.days[d]||{stars:0};
  let gain=right*10+bonus;if(stars>old.stars)gain+=(stars-old.stars)*50;
  S.xp+=gain;S.days[d]={stars:Math.max(stars,old.stars),best:Math.max(right,old.best||0),date:today()};save();renderTop();
  if(stars===3)award('full');checkBadges();
  const cards=stars?[...dayCh(d).map(n=>({c:n<=37?'var(--s3)':'var(--s2)',t:'第'+n+'章 '+DN[n-1].ti,s:DN[n-1].key.split('……')[0]})),...dayGua(d).map(n=>({c:tc(GUA[n-1].up),t:fullName(GUA[n-1]),s:GN[n-1].ti}))]:[];
  return {stars,gain,pass:stars>0,cards,next:d<30?()=>go('day',{d:d+1}):null,retry:()=>go('day',{d,step:'quiz'})};
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
 guaShape(n){const g=GUA[n-1];return mk('看卦象：这是哪一卦？（爻从下往上数，颜色代表上下卦的五行）',fullName(g),others(n,64,3).map(k=>fullName(GUA[k-1])),`${fullName(g)}：${TRI[g.up].x}在上，${TRI[g.down].x}在下。`,`<div class="qsub" style="display:flex;justify-content:center">${guaSVG(g,110)}</div>`);},
 guaTri(n){const g=GUA[n-1];return mk(`上卦是${g.up}（${TRI[g.up].x}），下卦是${g.down}（${TRI[g.down].x}），这是哪一卦？`,g.name,others(n,64,3).map(k=>GUA[k-1].name),`${fullName(g)}，第${n}卦。`);},
 guaDx(n){const g=GUA[n-1];let dx=g.dx;[...g.name].forEach(c=>{dx=dx.split(c).join('○');});
   return mk(`《象传》说：“${dx}”（○为卦名）这是哪一卦？`,g.name,others(n,64,3,true).map(k=>GUA[k-1].name),`象曰：${g.dx}`);},
 guaTi(n){return mk(`哪一卦的核心是「${GN[n-1].ti}」？`,guaLabel(n),others(n,64,3).map(guaLabel),GN[n-1].bh.slice(0,60)+'……');},
 yaoPos(n){const g=GUA[n-1],i=rnd(6),t=g.yao[i],k=t.indexOf('：')>-1?t.indexOf('：'):t.indexOf('，');const posAll=g.yao.slice(0,6).map(y=>y.slice(0,y.search(/[：，]/)));
   const correct=posAll[i];const wr=shuffle(posAll.filter(x=>x!==correct));return mk(`${g.name}卦中，“${t.slice(k+1)}”是哪一爻？`,correct,wr,`${correct}：${GN[n-1].yao[i]}`);},
 tri(){const name=pick(TRI_NAMES),t=TRI[name];return mk('这是八卦中的哪一卦？',`${name}（${t.x}）`,shuffle(TRI_NAMES.filter(x=>x!==name)).slice(0,3).map(x=>`${x}（${TRI[x].x}）`),`${t.song}：${name}为${t.x}，性质“${t.de}”，五行属${t.wn}。`,`<div class="qsub" style="display:flex;justify-content:center">${triSVG(name,90)}</div>`);}
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
const OC=['var(--s1)','var(--s3)','var(--s5)','var(--s2)'];
function runQuiz(box,qs,onDone,opts={}){
  let i=0,right=0,combo=0,bonus=0,reviewOk=0;
  function show(){
    const q=qs[i];
    box.innerHTML=`<div class="quiz"><div class="qtop">${mascot('idle',44)}<div class="qbar"><div style="width:${i/qs.length*100}%"></div></div><span class="combo" id="cb">${combo>=2?'连对×'+combo:''}</span></div>
      <div class="qcard"><div class="eyebrow">第 ${i+1} / ${qs.length} 题${q.review?' · 温故知新':''} · 答对 ${right}</div>
      <div class="qq">${esc(q.q)}</div>${q.sub}
      <div class="opts">${q.opts.map((o,k)=>`<button class="opt" data-k="${k}" style="--oc:${OC[k]}"><b>${'ABCD'[k]}</b><span>${esc(o)}</span></button>`).join('')}</div><div id="fb"></div></div></div>`;
    box.querySelectorAll('.opt').forEach(b=>b.onclick=e=>answer(+b.dataset.k,e));
  }
  function answer(k,e){
    const q=qs[i],ok=k===q.a;
    if(ok){right++;combo++;const add=combo>=3?combo*2:0;bonus+=add;S.bestCombo=Math.max(S.bestCombo,combo);
      SFX.ok();confetti(combo>=3?50:25,e.clientX,e.clientY);
      const pl=document.createElement('div');pl.className='plus';pl.textContent='+'+(10+add);box.querySelector('.qcard').appendChild(pl);
      const cb=document.getElementById('cb');if(combo>=2){cb.textContent='连对×'+combo;cb.classList.add('pop');}
    }else{combo=0;SFX.no();document.getElementById('cb').textContent='';}
    const m=box.querySelector('.mascot');m.outerHTML=mascot(ok?'happy':'sad',44,ok?'happy':'sad');
    box.querySelectorAll('.opt').forEach((b,j)=>{b.disabled=true;if(j===q.a)b.classList.add('ok');else if(j===k)b.classList.add('no');});
    const id=q.q+'|'+q.opts[q.a];
    if(!ok&&!S.mistakes.some(x=>x.id===id))S.mistakes.push(Object.assign({id},q));
    if(ok&&opts.fromReview){S.mistakes=S.mistakes.filter(x=>x.id!==id);reviewOk++;}
    save();
    document.getElementById('fb').innerHTML=`<div class="fb" style="--c:${ok?'var(--good)':'var(--bad)'}"><b>${ok?pick(CHEER):pick(COMFORT)}</b><br>${esc(q.exp)}</div>
      <div class="row" style="margin-top:12px"><button class="btn ${i+1<qs.length?'':'warm'}" id="go">${i+1<qs.length?'下一题 →':'看结果'}</button></div>`;
    const g=document.getElementById('go');g.focus({preventScroll:true});g.onclick=()=>{i++;if(i<qs.length)show();else end();};
  }
  function end(){
    if(opts.fromReview&&reviewOk){S.reviewOk=(S.reviewOk||0)+reviewOk;if(S.reviewOk>=10)award('review');}
    checkBadges();
    const r=onDone({right,total:qs.length,bonus})||{};
    const st=r.stars;
    box.innerHTML=`<div class="quiz"><div class="panel result">
      ${mascot(r.pass===false?'sad':'happy',90,r.pass===false?'sad':'happy')}
      <div class="fun" style="font-size:26px">${r.pass===false?'差一点点！':'闯关成功！'}</div>
      <div style="font-size:18px">答对 <b>${right}</b> / ${qs.length}</div>
      ${st!==undefined?`<div class="seals">${[0,1,2].map(k=>`<svg class="star${k<st?' on':''}" viewBox="0 0 20 19" style="animation-delay:${.2+k*.3}s"><path d="${STAR_D}"/></svg>`).join('')}</div>`:''}
      ${r.gain!==undefined?`<div class="chip xp" style="font-size:16px">+${r.gain} 经验${bonus?`（含连对奖励 ${bonus}）`:''}</div>`:''}
      ${r.cards&&r.cards.length?`<div class="note">收集到今天的锦囊卡：</div><div class="cards">${r.cards.map((c,k)=>`<div class="jn" style="--c:${c.c};animation-delay:${.8+k*.12}s"><b>${esc(c.t)}</b>${esc(c.s)}</div>`).join('')}</div>`:''}
      <div class="note">${r.pass===false?'答对 60% 就能拿到星星、解锁下一座岛。错题已收进错题本，看一眼再来！':r.msg||'错题已自动收进错题本，方便以后复习。'}</div>
      <div class="row" style="justify-content:center">${r.retry?'<button class="btn ghost" id="rt">再闯一次</button>':''}${r.next&&r.pass?'<button class="btn go" id="nd">前往下一座岛 →</button>':''}<button class="btn ghost" id="bk">回到地图</button></div>
    </div></div>`;
    if(r.pass!==false){SFX.win();setTimeout(()=>confetti(st===3?160:90),300);if(st)for(let k=0;k<st;k++)setTimeout(SFX.stamp,500+k*300);}
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
  main.innerHTML=`<section class="view"><div class="head2"><h2 class="fun">经典库</h2>
    <div class="seg"><button data-t="ddj" class="${libTab==='ddj'?'on':''}">道德经 81 章</button><button data-t="gua" class="${libTab==='gua'?'on':''}">易经 64 卦</button></div></div>
    <div class="row"><input class="search" id="q" placeholder="搜索原文、主题或案例，例如：水、谦、范蠡" value="${esc(libQ)}"><span class="note">彩色 = 已学过</span></div>
    <div class="grid-n" id="grid"></div><div id="detail" style="display:grid;gap:16px"></div></section>`;
  main.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{libTab=b.dataset.t;renderLib();});
  const q=document.getElementById('q');q.oninput=()=>{libQ=q.value.trim();grid();};
  function grid(){const isD=libTab==='ddj',N=isD?81:64;let h='';
    for(let n=1;n<=N;n++){const no=isD?DN[n-1]:GN[n-1],tx=isD?DDJ[n-1].s:GUA[n-1].name+GUA[n-1].gc+GUA[n-1].yao.join('')+GUA[n-1].dx;
      if(libQ&&!(tx+no.ti+no.bh+no.gu+no.jin).includes(libQ))continue;
      const c=isD?SEA_C[seaIdx(chDay(n))]:tc(GUA[n-1].up);
      h+=`<button data-n="${n}" style="--c:${c}" class="${(isD?learnedCh:learnedGua).has(n)?'learned':''}"><b>${n}</b>${isD?'':guaSVG(GUA[n-1],30)}<span>${isD?esc(no.ti):esc(GUA[n-1].name)}</span></button>`;}
    const g=document.getElementById('grid');g.innerHTML=h||'<span class="note">没有找到，换个关键词试试。</span>';
    g.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{SFX.click();const d=document.getElementById('detail');d.innerHTML=isD?chapterHTML(+b.dataset.n):guaHTML(+b.dataset.n);bindText(d);d.scrollIntoView({behavior:reduce?'auto':'smooth'});});}
  grid();
}

// ---------- 卦象训练营 ----------
function renderTrainer(){
  main.innerHTML=`<section class="view"><div class="head2"><div><div class="eyebrow">最佳成绩 ${S.trainerBest} / 20</div><h2 class="fun">卦象训练营</h2></div></div>
   <div class="panel" style="display:grid;gap:14px"><div class="talk">${mascot('happy',56)}<div class="bubble">20 道速认题：看线条认八卦、看卦象认六十四卦、看上下卦说卦名。颜色就是五行：<b style="color:var(--jin)">金</b> <b style="color:var(--mu)">木</b> <b style="color:var(--shui)">水</b> <b style="color:var(--huo)">火</b> <b style="color:var(--tu)">土</b>，记住颜色更好认！</div></div>
   <div class="tri">${TRI_NAMES.map(k=>`<div style="--c:${tc(k)}">${triSVG(k,54)}<b>${k}</b><span style="font-size:13px">${TRI[k].x} · ${TRI[k].song}</span></div>`).join('')}</div>
   <div class="row"><button class="btn warm" id="st">开始训练</button><label class="note"><input type="checkbox" id="only" ${learnedGua.size>=4?'':'disabled'}> 只练已学过的卦（已学 ${learnedGua.size} 卦）</label></div></div><div id="qz"></div></section>`;
  document.getElementById('st').onclick=()=>{
    const only=document.getElementById('only').checked,pool=only?[...learnedGua]:Array.from({length:64},(_,i)=>i+1);
    const qs=Array.from({length:20},(_,k)=>k<5?Q.tri():pick([Q.guaShape,Q.guaTri])(pick(pool)));
    const t0=Date.now();main.querySelector('.panel').hidden=true;
    runQuiz(document.getElementById('qz'),qs,({right,bonus})=>{const sec=Math.round((Date.now()-t0)/1000);const nb=right>S.trainerBest;if(nb)S.trainerBest=right;if(right>=18)award('trainer');
      const gain=right*3+bonus;S.xp+=gain;save();renderTop();
      return {gain,msg:`用时 ${sec} 秒${nb?'，刷新了最佳成绩！':'。'}`,retry:()=>renderTrainer()};});
  };
}

// ---------- 错题本 ----------
function renderReview(){
  const m=S.mistakes;
  main.innerHTML=`<section class="view"><div class="head2"><h2 class="fun">错题本</h2><span class="note">重练时答对的题会自动移出</span></div>
   ${m.length?`<div class="row" id="rrow"><button class="btn warm" id="go">重练错题（${Math.min(m.length,15)} 题）</button><button class="btn ghost" id="mix">综合复习已学内容</button></div>
   <div class="panel" id="rlist" style="display:grid;gap:10px">${m.slice(-30).reverse().map(x=>`<div style="border-bottom:2px solid var(--line);padding-bottom:8px"><div>${esc(x.q)}</div><div class="note">正确答案：<b style="color:var(--good)">${esc(x.opts[x.a])}</b>　${esc(x.exp)}</div></div>`).join('')}</div>`
   :`<div class="panel talk" id="rlist">${mascot('happy',64)}<div class="bubble">还没有错题，真棒！闯关时答错的题会自动收进这里。<div class="row" style="margin-top:10px"><button class="btn ghost" id="mix" ${learnedCh.size?'':'disabled'}>综合复习已学内容</button></div></div></div>`}
   <div id="qz"></div></section>`;
  const hide=()=>{['rrow','rlist'].forEach(id=>{const e=document.getElementById(id);if(e)e.hidden=true;});};
  const b=document.getElementById('go');
  if(b)b.onclick=()=>{const qs=shuffle(m).slice(0,15).map(x=>{const o=shuffle(x.opts.map((t,k)=>[t,k===x.a]));return Object.assign({},x,{opts:o.map(z=>z[0]),a:o.findIndex(z=>z[1])});});
    hide();runQuiz(document.getElementById('qz'),qs,({right,bonus})=>{const gain=right*5+bonus;S.xp+=gain;save();renderTop();return {gain,retry:()=>renderReview()};},{fromReview:true});};
  const mx=document.getElementById('mix');
  if(mx)mx.onclick=()=>{const c=[...learnedCh],g=[...learnedGua];if(!c.length){toast('先完成第一座岛');return;}
    const qs=Array.from({length:12},(_,k)=>k%2||!g.length?pick([Q.chKey,Q.chCloze,Q.chTheme])(pick(c)):pick([Q.guaShape,Q.guaDx,Q.yaoPos])(pick(g)));
    hide();runQuiz(document.getElementById('qz'),qs,({right,bonus})=>{const gain=right*5+bonus;S.xp+=gain;save();renderTop();return {gain,retry:()=>renderReview()};});};
}

// ---------- 编号对读 ----------
function renderCode(){
  main.innerHTML=`<section class="view"><div class="head2"><h2 class="fun">编号对读</h2></div>
   <div class="panel" style="display:grid;gap:12px">
    <div>输入四位编号：<b style="color:var(--s3)">前两位</b>是《道德经》章数（01–81），<b style="color:var(--s5)">后两位</b>是《易经》卦序（01–64）。例如书中的 4841 = 第48章 × 第41卦（损）。系统会把这一章与这一卦并排展开，供你对照学习。</div>
    <div class="row"><input class="code-in" id="ci" inputmode="numeric" maxlength="4" value="4841" aria-label="四位编号"><button class="btn" id="cb">展开对读</button>
     ${Object.keys(CODES).map(k=>`<button class="btn small" data-c="${k}">${k}</button>`).join('')}</div>
    <div class="note">这里只把编号当作“一章配一卦”的学习索引。经文的价值在于理解与践行，默念编号本身不能代替看病、心理咨询或做决定。</div>
   </div><div id="out" style="display:grid;gap:16px"></div></section>`;
  const ci=document.getElementById('ci');
  const run=()=>{const v=ci.value.replace(/\D/g,'');const c=+v.slice(0,2),g=+v.slice(2,4),o=document.getElementById('out');
    if(v.length!==4||c<1||c>81||g<1||g>64){o.innerHTML='<div class="panel">编号要是四位数字：前两位 01–81，后两位 01–64。</div>';return;}
    const an=CODES[v]||`把《道德经》第${c}章「${DN[c-1].ti}」与《易经》第${g}卦${fullName(GUA[g-1])}「${GN[g-1].ti}」放在一起读：先找出两者共同的关键词（比如“柔”“止”“信”“损”），再想一想：老子的这句话，能不能解释这一卦的某一爻？这一卦的处境，又能不能用这一章的智慧来应对？把你的答案写在本子上。`;
    o.innerHTML=pairHTML(c,g,an,'编号'+v+'　')+`<div class="two">${chapterHTML(c)}${guaHTML(g)}</div>`;bindText(o);bindPair(an);};
  document.getElementById('cb').onclick=()=>{SFX.click();run();};ci.onkeydown=e=>{if(e.key==='Enter')run();};
  main.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{ci.value=b.dataset.c;SFX.click();run();});run();
}

// ---------- 入门须知 ----------
function basicsHTML(){return `<div class="page basics" style="--pc:var(--s1)">
  <div class="ph"><span class="tag">第一天先读这一页</span><h3>两部书，怎么读</h3></div>
  <div class="talk">${mascot('happy',60)}<div class="bubble">我是易宝，一个太极。黑白两半就是阴和阳，接下来30天我陪你一起闯岛！</div></div>
  <div><div class="lab" style="--lc:var(--s3)">《道德经》</div>春秋时期老子所著，约五千字，通行本（王弼本）分 81 章：第 1–37 章为“道经”，讲宇宙规律；第 38–81 章为“德经”，讲做人做事。核心词：道、德、无为、不争、柔弱、知足。</div>
  <div><div class="lab" style="--lc:var(--s5)">《易经》（周易）</div>由 64 卦组成，每卦有卦辞和 6 条爻辞，后来又有孔子一派写的《易传》（如《彖传》《象传》）来解释。核心思想是“变”：处境不断变化，人要看清处境、顺势而为。</div>
  <div><div class="lab">读卦的四个要点</div>
   <ol style="margin:4px 0;padding-left:1.3em">
    <li>阳爻是一条长线 —，阴爻是中间断开的 - -。</li>
    <li>六爻<b>从下往上</b>数：初、二、三、四、五、上。</li>
    <li>阳爻称“九”，阴爻称“六”。所以“初六”是最下面一爻且为阴，“九五”是第五爻且为阳。</li>
    <li>下面三爻叫下卦（内卦），上面三爻叫上卦（外卦）。卦名全称先读上卦之象、再读下卦之象：离（火）上坎（水）下 → <b>火水未济</b>。</li>
   </ol></div>
  <div><div class="lab" style="--lc:var(--huo)">八卦口诀：乾三连，坤六断；震仰盂，艮覆碗；离中虚，坎中满；兑上缺，巽下断。</div>
   <div class="note">颜色按五行：乾兑属金，震巽属木，坎属水，离属火，坤艮属土。</div>
   <div class="tri" style="margin-top:8px">${TRI_NAMES.map(k=>`<div style="--c:${tc(k)}">${triSVG(k,50)}<b>${k}</b><span style="font-size:13px">${TRI[k].x} · ${TRI[k].de} · ${TRI[k].fam}</span></div>`).join('')}</div></div>
  <div><div class="lab">每天怎么学（40–60 分钟）</div>
   <div class="tablewrap"><table class="t"><tr><th>步骤</th><th>做什么</th><th>时间</th></tr>
   <tr><td>读经</td><td>朗读当天 2–3 章原文，看白话和古今案例，用“背诵”按钮遮字自测</td><td>15–20 分钟</td></tr>
   <tr><td>观象</td><td>认卦象、读卦辞和六爻，看每一爻的白话</td><td>15–20 分钟</td></tr>
   <tr><td>对读</td><td>读一章一卦的对读分析（竖排，像书一样）</td><td>5 分钟</td></tr>
   <tr><td>闯关</td><td>12 道题，答对 60% 得星、解锁下一岛；连对有额外奖励</td><td>5–10 分钟</td></tr>
   <tr><td>践行</td><td>完成“今日一用”里的一件小事</td><td>全天</td></tr></table></div></div>
  <div class="note">原文：《道德经》用王弼本，《周易》用通行本（均据维基文库整理）。可在“设置”里切换繁体原文。</div>
 </div>`;}
function renderBasics(){main.innerHTML=`<section class="view"><div class="head2"><h2 class="fun">入门须知</h2></div>${basicsHTML()}</section>`;}

// ---------- 设置 ----------
function renderSettings(){
  main.innerHTML=`<section class="view"><div class="head2"><h2 class="fun">设置</h2></div>
   <div class="panel" style="display:grid;gap:16px;max-width:640px">
    <label class="row"><input type="checkbox" id="trad" ${S.trad?'checked':''}> 原文显示繁体（同书中排版）</label>
    <label class="row"><input type="checkbox" id="sd" ${S.sound?'checked':''}> 答题音效</label>
    <label class="row">朗读语速 <input type="range" id="rate" min="0.5" max="1.3" step="0.05" value="${S.rate}"> <span id="rv">${S.rate}</span> <button class="btn small" id="tst">试听</button></label>
    <label class="row"><input type="checkbox" id="ul" ${S.unlockAll?'checked':''}> 解锁全部 30 座岛（可跳着学）</label>
    <div><div class="lab">备份进度</div><div class="note">进度保存在这台电脑的浏览器里。换电脑或清理浏览器前，复制下面的进度码保存起来；导入时粘贴回来。</div>
     <textarea id="bk" readonly></textarea><div class="row"><button class="btn small" id="cp">复制进度码</button></div></div>
    <div><div class="lab">导入进度</div><textarea id="im" placeholder="把进度码粘贴到这里"></textarea><div class="row"><button class="btn small" id="imb">导入</button></div></div>
    <div><div class="lab" style="--lc:var(--bad)">重新开始</div><div class="row"><button class="btn small" id="rs">清空全部进度</button><span id="rsc"></span></div></div>
   </div></section>`;
  const $=id=>document.getElementById(id);
  $('trad').onchange=e=>{S.trad=e.target.checked;save();toast(S.trad?'原文改为繁体':'原文改为简体');};
  $('sd').onchange=e=>{S.sound=e.target.checked;save();renderTop();SFX.click();};
  $('rate').oninput=e=>{S.rate=+e.target.value;$('rv').textContent=S.rate;save();};
  $('tst').onclick=()=>speak('上善若水。水善利万物而不争。');
  $('ul').onchange=e=>{S.unlockAll=e.target.checked;save();toast(S.unlockAll?'已解锁全部岛屿':'恢复按顺序解锁');};
  const code=btoa(unescape(encodeURIComponent(JSON.stringify(S))));$('bk').value=code;
  $('cp').onclick=()=>{const fb=()=>{$('bk').select();toast('请按 Ctrl+C 复制');};try{navigator.clipboard.writeText(code).then(()=>toast('进度码已复制'),fb);}catch(e){fb();}};
  $('imb').onclick=()=>{try{const o=JSON.parse(decodeURIComponent(escape(atob($('im').value.trim()))));if(typeof o.xp!=='number')throw 0;S=Object.assign(fresh(),o);save();renderTop();toast('进度已导入');}catch(e){toast('进度码不正确，请检查是否复制完整');}};
  $('rs').onclick=()=>{$('rsc').innerHTML='<span class="note">确定清空？</span> <button class="btn small" id="rsy">确定清空</button>';$('rsy').onclick=()=>{S=fresh();save();renderTop();toast('已清空');go('map');};};
}

if('speechSynthesis' in window)speechSynthesis.getVoices();
go('map');
})();
