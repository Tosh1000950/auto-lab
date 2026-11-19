'use strict';
/* エボトープ Stage 1: シミュレーション核（DOM非依存）
   遺伝子・生活・繁殖・突然変異・環境キャパシティ弁。描画とUIは Stage 2 以降。 */
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

const WORLD={w:1200,h:800};
const SOFT_CAP=260, HARD_CAP=420;

function randomGenes(rng){
  return {
    size:0.6+rng()*1.0, speed:0.5+rng()*1.5, sense:20+rng()*70, metab:0.6+rng()*1.2,
    hue:Math.floor(rng()*360), legs:Math.floor(rng()*4), legLen:0.4+rng()*1.2,
    head:Math.floor(rng()*3), tail:Math.floor(rng()*3), spikes:rng()<0.2?1:0,
    appetite:rng()*0.5
  };
}
function mutateGenes(g,rng,stats){
  const c={...g}; let big=false;
  const cont=(v,lo,hi,amt)=>Math.min(hi,Math.max(lo,v+(rng()*2-1)*amt));
  c.size=cont(c.size,0.4,2.2,0.12); c.speed=cont(c.speed,0.2,3.2,0.18);
  c.sense=cont(c.sense,10,140,8); c.metab=cont(c.metab,0.3,2.6,0.14);
  c.legLen=cont(c.legLen,0.2,2.2,0.14); c.appetite=cont(c.appetite,0,1,0.08);
  if(rng()<0.25) c.hue=(c.hue+Math.floor((rng()*2-1)*40)+360)%360;
  if(rng()<0.10) c.legs=Math.min(6,Math.max(0,c.legs+(rng()<0.5?-1:1)));
  if(rng()<0.06) c.head=Math.floor(rng()*3);
  if(rng()<0.06) c.tail=Math.floor(rng()*4);
  if(rng()<0.05) c.spikes=c.spikes?0:1;
  if(rng()<0.02){ /* 大変異：形態が跳ぶ（突然変異ログ対象） */
    big=true;
    const which=Math.floor(rng()*4);
    if(which===0) c.legs=Math.min(6,c.legs+2);
    else if(which===1) c.head=Math.floor(rng()*3);
    else if(which===2) c.spikes=1;
    else c.size=Math.min(2.2,c.size*1.4);
  }
  if(big&&stats) stats.bigMutations++;
  return c;
}
function derived(g){
  return {
    moveSpeed: g.speed*(0.55+0.09*g.legs*g.legLen)*(2-g.size*0.35),
    upkeep: g.metab*(0.35+g.size*0.45)*(1+0.25*g.spikes+0.06*g.legs),
    capacity: 55*g.size+25,
    bite: g.size*(0.6+g.appetite)
  };
}

class EvoSim{
  constructor(seed){
    this.rng=mulberry32(seed); this.tick=0;
    this.creatures=[]; this.foods=[];
    this.stats={births:0,deaths:0,bigMutations:0,eaten:0,predation:0,peakPop:0};
    this.tracker=new SpeciesTracker(this.rng);
    this.zones=[]; for(let i=0;i<12;i++) this.zones.push(0.6); /* 4x3 grid moisture */
    this.sanctuary=null; this.seeds=[];
    for(let i=0;i<70;i++) this.spawnCreature(randomGenes(this.rng));
    for(let i=0;i<260;i++) this.spawnFood();
  }
  spawnCreature(genes,x,y,energy){
    const d=derived(genes);
    this.creatures.push({genes, d, x:x??this.rng()*WORLD.w, y:y??this.rng()*WORLD.h,
      energy:energy??d.capacity*0.55, age:0, gen:0, dir:this.rng()*Math.PI*2});
  }
  zoneAt(x,y){ const ix=Math.min(3,Math.max(0,(x/(WORLD.w/4))|0)), iy=Math.min(2,Math.max(0,(y/(WORLD.h/3))|0)); return iy*4+ix; }
  spawnFood(){
    for(let t=0;t<3;t++){ const x=this.rng()*WORLD.w, y=this.rng()*WORLD.h;
      if(this.rng()<this.zones[this.zoneAt(x,y)]+0.25){ this.foods.push({x,y,e:9+this.rng()*7}); return; } }
    this.foods.push({x:this.rng()*WORLD.w, y:this.rng()*WORLD.h, e:9+this.rng()*7});
  }
  setZoneAt(x,y,delta){ const i=this.zoneAt(x,y); this.zones[i]=Math.min(1,Math.max(0.05,this.zones[i]+delta)); return this.zones[i]; }
  setSanctuary(x,y){ this.sanctuary={x,y,r:110}; this.tracker.log(this.tick,'tool','保護区が設置された'); }
  triggerEvent(kind,x,y){
    if(kind==='bloom'){ for(let i=0;i<150;i++) this.spawnFood(); this.tracker.log(this.tick,'event','🌸 豊作！ 餌が大量に増えた'); }
    if(kind==='plague'){
      let target=null; for(const sp of this.tracker.species){ if(!sp.extinct&&(!target||sp.count>target.count)) target=sp; }
      if(target){ let killed=0; this.creatures=this.creatures.filter(c=>{ if(c.speciesId===target.id&&this.rng()<0.35){killed++;return false;} return true; });
        this.tracker.log(this.tick,'event','☠ 疫病が「'+target.name+'」を襲った（'+killed+'匹死亡）'); }
    }
    if(kind==='meteor'){
      const mx=x??this.rng()*WORLD.w, my=y??this.rng()*WORLD.h; let killed=0;
      this.creatures=this.creatures.filter(c=>{ const dx=c.x-mx,dy=c.y-my; if(dx*dx+dy*dy<250*250&&this.rng()<0.75){killed++;return false;} return true; });
      this.foods=this.foods.filter(f=>{ const dx=f.x-mx,dy=f.y-my; return dx*dx+dy*dy>=250*250; });
      this.tracker.log(this.tick,'event','☄ 隕石が落下（'+killed+'匹死亡）');
    }
  }
  saveSeed(speciesId){
    const sp=this.tracker.species.find(v=>v.id===speciesId); if(!sp) return false;
    if(this.seeds.length>=5) this.seeds.shift();
    this.seeds.push({name:sp.name, genes:{...(sp.meanGenes||sp.founderGenes)}});
    this.tracker.log(this.tick,'tool','休眠シードに「'+sp.name+'」の遺伝子を保存');
    return true;
  }
  sowSeed(i){
    const sd=this.seeds[i]; if(!sd) return false;
    const x=this.rng()*WORLD.w, y=this.rng()*WORLD.h;
    for(let k=0;k<8;k++){ const g=mutateGenes(sd.genes,this.rng,this.stats); this.spawnCreature(g,x+(this.rng()*60-30),y+(this.rng()*60-30)); }
    this.tracker.log(this.tick,'tool','休眠シードから「'+sd.name+'」の末裔が芽吹いた');
    return true;
  }
  step(){
    const rng=this.rng, pop=this.creatures.length;
    this.tick++;
    /* 環境キャパシティ弁：個体数が上限へ近づくと餌の再生が細り、維持コストが漸増する */
    const pressure=Math.max(0,(pop-SOFT_CAP)/(HARD_CAP-SOFT_CAP)); // 0..1+
    const foodRate=0.9*(1-Math.min(0.85,pressure*0.9));
    if(rng()<foodRate) this.spawnFood();
    if(this.foods.length>520) this.foods.splice(0,this.foods.length-520);
    const upkeepMul=1+pressure*0.8;

    /* 餌の空間グリッド（近傍探索用） */
    const cell=100, grid=new Map();
    this.foods.forEach((f,i)=>{const k=((f.x/cell)|0)+':'+((f.y/cell)|0); if(!grid.get(k))grid.set(k,[]); grid.get(k).push(i);});
    const nearFood=(x,y,r)=>{
      let best=-1,bd=r*r;
      const cx=(x/cell)|0, cy=(y/cell)|0;
      for(let gx=cx-1;gx<=cx+1;gx++)for(let gy=cy-1;gy<=cy+1;gy++){
        const arr=grid.get(gx+':'+gy); if(!arr)continue;
        for(const i of arr){const f=this.foods[i]; if(!f)continue; const dx=f.x-x,dy=f.y-y,d2=dx*dx+dy*dy; if(d2<bd){bd=d2;best=i;}}
      }
      return best;
    };

    const newborns=[];
    const eatenFood=new Set(), eatenCreatures=new Set();
    for(const c of this.creatures){
      c.age++;
      const sense=c.genes.sense;
      let tx=null,ty=null,prey=null;
      if(c.genes.appetite>0.55){
        for(const o of this.creatures){
          if(o===c||eatenCreatures.has(o))continue;
          if(o.genes.size<c.genes.size*0.8){const dx=o.x-c.x,dy=o.y-c.y; if(dx*dx+dy*dy<sense*sense){prey=o;tx=o.x;ty=o.y;break;}}
        }
      }
      if(!prey){
        const fi=nearFood(c.x,c.y,sense);
        if(fi>=0){const f=this.foods[fi]; tx=f.x; ty=f.y;
          const dx=f.x-c.x, dy=f.y-c.y;
          if(dx*dx+dy*dy<100){ c.energy=Math.min(c.d.capacity,c.energy+f.e); eatenFood.add(fi); this.stats.eaten++; }
        }
      } else {
        const dx=prey.x-c.x, dy=prey.y-c.y;
        const inSanc=this.sanctuary && ((prey.x-this.sanctuary.x)**2+(prey.y-this.sanctuary.y)**2 < this.sanctuary.r*this.sanctuary.r);
        if(dx*dx+dy*dy<144 && !inSanc && rng()>prey.genes.spikes*0.55){
          c.energy=Math.min(c.d.capacity,c.energy+prey.energy*0.6+14);
          eatenCreatures.add(prey); this.stats.predation++;
        }
      }
      if(tx!==null){ const a=Math.atan2(ty-c.y,tx-c.x); c.dir=a; }
      else if(rng()<0.06){ c.dir=rng()*Math.PI*2; }
      const sp=c.d.moveSpeed;
      c.x=Math.min(WORLD.w,Math.max(0,c.x+Math.cos(c.dir)*sp));
      c.y=Math.min(WORLD.h,Math.max(0,c.y+Math.sin(c.dir)*sp));
      const moist=this.zones[this.zoneAt(c.x,c.y)];
      const dryCost=1+(0.6-moist)*Math.max(0,c.genes.size-0.6)*0.9;
      const sancMul=(this.sanctuary && ((c.x-this.sanctuary.x)**2+(c.y-this.sanctuary.y)**2 < this.sanctuary.r*this.sanctuary.r))?0.8:1;
      c.energy-=c.d.upkeep*upkeepMul*dryCost*sancMul*0.16 + sp*0.012;
      if(c.energy>c.d.capacity*0.92 && pop+newborns.length<HARD_CAP && rng()<0.25){
        const childGenes=mutateGenes(c.genes,rng,this.stats);
        const child={genes:childGenes, d:derived(childGenes), x:c.x+(rng()*20-10), y:c.y+(rng()*20-10),
          energy:c.d.capacity*0.34, age:0, gen:c.gen+1, dir:rng()*Math.PI*2};
        c.energy-=c.d.capacity*0.34;
        newborns.push(child); this.stats.births++;
      }
    }
    this.foods=this.foods.filter((f,i)=>!eatenFood.has(i));
    const before=this.creatures.length;
    this.creatures=this.creatures.filter(c=>!eatenCreatures.has(c) && c.energy>0 && c.age<5200/c.genes.metab);
    this.stats.deaths+=before-this.creatures.length;
    for(const n of newborns) this.creatures.push(n);
    this.stats.peakPop=Math.max(this.stats.peakPop,this.creatures.length);
    if(this.tick%60===0) this.tracker.update(this);
  }
  geneMeans(){
    const n=this.creatures.length||1, m={};
    const keys=['size','speed','sense','metab','hue','legs','legLen','head','tail','spikes','appetite'];
    for(const k of keys) m[k]=0;
    for(const c of this.creatures) for(const k of keys) m[k]+=c.genes[k];
    for(const k of keys) m[k]=+(m[k]/n).toFixed(3);
    return m;
  }
}

/* ===== Stage 3：種の追跡（自動命名・系統・絶滅・祖先比較） ===== */
function morphVec(g){
  const hueD=Math.min(g.hue,360-g.hue)/180;
  return [g.legs/6, g.legLen/2.2, g.head/2, g.tail/3, g.spikes, g.size/2.2, hueD, g.appetite];
}
function vecDist(a,b){ let s=0; for(let i=0;i<a.length;i++){ const d=a[i]-b[i]; s+=d*d; } return Math.sqrt(s); }
const NAME_A=['ア','カ','サ','タ','ナ','ハ','マ','ヤ','ラ','ワ','ギ','ジ','ヅ','ビ','ピ','ル','レ','ロ','モ','ケ','セ','テ','ネ','ヘ','メ'];
const NAME_B=['','ン','ク','ス','ト','プ','ム','ユ','ラ','キ','ゴ','ザ','ド','バ','ポ'];
function speciesName(g,rng){
  let pre='';
  if(g.spikes>=0.5) pre='トゲ';
  else if(g.legs>=3.5) pre='ムカデ';
  else if(g.size>=1.5) pre='オオ';
  else if(g.appetite>=0.6) pre='ガブリ';
  else if(g.tail>=2) pre='フサ';
  else if(g.speed>=1.9) pre='ハヤ';
  let core=''; const n=2+Math.floor(rng()*2);
  for(let i=0;i<n;i++) core+=NAME_A[Math.floor(rng()*NAME_A.length)]+(i===0&&rng()<0.5?NAME_B[Math.floor(rng()*NAME_B.length)]:'');
  const stem=g.head===1?'ドン':(g.head===2?'マル':'ポン');
  return (pre?pre+'・':'')+core+stem;
}
function causalTags(before,after){
  const tags=[];
  const d=(k)=>after[k]-before[k];
  if(d('legs')>=0.8||d('legLen')>=0.25||d('speed')>=0.35) tags.push('速く動くための変化');
  if(d('spikes')>=0.3) tags.push('捕食者への対抗');
  if(d('size')>=0.25) tags.push('大型化');
  if(d('appetite')>=0.2) tags.push('肉食への傾斜');
  if(d('sense')>=15) tags.push('索餌範囲の拡大');
  if(d('metab')<=-0.25) tags.push('省エネ化');
  if(Math.abs(d('hue'))>=60) tags.push('体色の変化');
  return tags.length?tags:['目立った変化なし（漸進的な適応）'];
}
class SpeciesTracker{
  constructor(rng){ this.rng=rng; this.species=[]; this.nextId=1; this.events=[]; }
  log(tick,type,text){ this.events.push({tick,type,text}); if(this.events.length>60) this.events.shift(); }
  update(sim){
    const groups=new Map();
    for(const c of sim.creatures){ if(c.speciesId==null) c.speciesId=0; }
    /* 既存種への割当て：重心に近い個体を集める */
    const alive=new Set();
    for(const sp of this.species){ if(!sp.extinct) alive.add(sp.id); }
    const buckets=new Map();
    for(const c of sim.creatures){
      let best=null,bd=1e9;
      for(const sp of this.species){ if(sp.extinct) continue; const d=vecDist(morphVec(c.genes),sp.centroid); if(d<bd){bd=d;best=sp;} }
      if(best&&bd<0.52){ c.speciesId=best.id; }
      if(!buckets.get(c.speciesId)) buckets.set(c.speciesId,[]);
      buckets.get(c.speciesId).push(c);
    }
    /* 未割当て（speciesId=0）や既存種から遠い集団を新種として分岐させる */
    const zeros=buckets.get(0)||[];
    if(zeros.length>=6){
      const cent=zeros[0].genes; let parent=null,pd=1e9;
      for(const sp of this.species){ if(sp.extinct) continue; const d=vecDist(morphVec(cent),sp.centroid); if(d<pd){pd=d;parent=sp;} }
      const genesMean={}; const keys=['size','speed','sense','metab','hue','legs','legLen','head','tail','spikes','appetite'];
      for(const k of keys) genesMean[k]=zeros.reduce((a,c)=>a+c.genes[k],0)/zeros.length;
      const sp={id:this.nextId++, name:speciesName(genesMean,this.rng), centroid:morphVec(genesMean),
        founderGenes:{...genesMean}, bornTick:sim.tick, parentId:parent?parent.id:null, extinct:false, extinctTick:null, peak:zeros.length};
      this.species.push(sp);
      for(const c of zeros) c.speciesId=sp.id;
      this.log(sim.tick,'species','新種「'+sp.name+'」が分岐'+(parent?'（'+parent.name+' から）':''));
    }
    /* 重心と個体数の更新、絶滅判定 */
    for(const sp of this.species){
      const members=sim.creatures.filter(c=>c.speciesId===sp.id);
      if(members.length>0){
        sp.extinct=false; sp.count=members.length; sp.peak=Math.max(sp.peak||0,members.length);
        const keys=['size','speed','sense','metab','hue','legs','legLen','head','tail','spikes','appetite'];
        const mean={}; for(const k of keys) mean[k]=members.reduce((a,c)=>a+c.genes[k],0)/members.length;
        sp.meanGenes=mean; sp.centroid=morphVec(mean);
      } else if(!sp.extinct && sp.id!==0){
        sp.extinct=true; sp.extinctTick=sim.tick; sp.count=0;
        this.log(sim.tick,'extinct','「'+sp.name+'」が絶滅（最盛期 '+sp.peak+' 匹）');
      }
    }
  }
}


/* ===== Stage 5：遺伝子コード（種の交換） ===== */
const GENE_SPEC=[
  ['size',0.4,2.2,19],['speed',0.2,3.2,21],['sense',10,140,21],['metab',0.3,2.6,21],
  ['hue',0,360,30],['legs',0,6,7],['legLen',0.2,2.2,21],['head',0,2,3],['tail',0,3,4],
  ['spikes',0,1,2],['appetite',0,1,21]
];
function encodeGenes(g){
  let n=0n;
  for(const [k,lo,hi,steps] of GENE_SPEC){
    const q=Math.min(steps-1,Math.max(0,Math.round((g[k]-lo)/(hi-lo)*(steps-1))));
    n=n*BigInt(steps)+BigInt(q);
  }
  return 'EVO-'+n.toString(36).toUpperCase().padStart(7,'0');
}
function decodeGenes(code){
  const str=String(code).trim().toUpperCase().replace(/^EVO-/,'');
  if(!/^[0-9A-Z]+$/.test(str)) return null;
  let n=BigInt('0'); for(const ch of str){ const v=parseInt(ch,36); if(Number.isNaN(v)) return null; n=n*36n+BigInt(v); }
  const vals={};
  for(let i=GENE_SPEC.length-1;i>=0;i--){
    const [k,lo,hi,steps]=GENE_SPEC[i];
    const q=Number(n%BigInt(steps)); n=n/BigInt(steps);
    vals[k]=lo+(q/(steps-1))*(hi-lo);
  }
  if(n!==0n) return null;
  vals.legs=Math.round(vals.legs); vals.head=Math.round(vals.head); vals.tail=Math.round(vals.tail);
  vals.spikes=Math.round(vals.spikes); vals.hue=Math.round(vals.hue)%360;
  return vals;
}

if(typeof module!=='undefined') module.exports={EvoSim,mulberry32,randomGenes,mutateGenes,derived,SpeciesTracker,speciesName,causalTags,encodeGenes,decodeGenes};
