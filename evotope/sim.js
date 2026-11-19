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
    for(let i=0;i<70;i++) this.spawnCreature(randomGenes(this.rng));
    for(let i=0;i<260;i++) this.spawnFood();
  }
  spawnCreature(genes,x,y,energy){
    const d=derived(genes);
    this.creatures.push({genes, d, x:x??this.rng()*WORLD.w, y:y??this.rng()*WORLD.h,
      energy:energy??d.capacity*0.55, age:0, gen:0, dir:this.rng()*Math.PI*2});
  }
  spawnFood(){
    this.foods.push({x:this.rng()*WORLD.w, y:this.rng()*WORLD.h, e:9+this.rng()*7});
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
        if(dx*dx+dy*dy<144 && rng()>prey.genes.spikes*0.55){
          c.energy=Math.min(c.d.capacity,c.energy+prey.energy*0.6+14);
          eatenCreatures.add(prey); this.stats.predation++;
        }
      }
      if(tx!==null){ const a=Math.atan2(ty-c.y,tx-c.x); c.dir=a; }
      else if(rng()<0.06){ c.dir=rng()*Math.PI*2; }
      const sp=c.d.moveSpeed;
      c.x=Math.min(WORLD.w,Math.max(0,c.x+Math.cos(c.dir)*sp));
      c.y=Math.min(WORLD.h,Math.max(0,c.y+Math.sin(c.dir)*sp));
      c.energy-=c.d.upkeep*upkeepMul*0.16 + sp*0.012;
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
if(typeof module!=='undefined') module.exports={EvoSim,mulberry32,randomGenes,mutateGenes,derived};
