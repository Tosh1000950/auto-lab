// DOMスタブでアプリのロジックを検証（ハンドラや結果が「無ければ失敗」する厳格方式）
const fs = require("fs");
class El {
  constructor(tag){ this.tagName=tag; this.children=[]; this.style={}; this._cls=""; this.listeners={}; this.value=""; this.textContent=""; this._html=""; }
  set className(v){ this._cls=v; } get className(){ return this._cls; }
  get classList(){ const s=this; return { add(c){ if(!s._cls.includes(c)) s._cls += " "+c; }, remove(c){ s._cls = s._cls.replace(c,"").trim(); }, contains(c){ return s._cls.includes(c); } }; }
  set innerHTML(v){ this._html=v; this.children=[]; } get innerHTML(){ return this._html; }
  appendChild(c){ this.children.push(c); return c; }
  addEventListener(ev, fn){ (this.listeners[ev] ||= []).push(fn); }
  click(){ (this.listeners.click||[]).forEach(f => f()); }
  getContext(){ return { fillRect(){}, fillText(){}, set fillStyle(v){}, set font(v){}, set textAlign(v){} }; }
  toBlob(cb){ cb(new Blob(["x"])); }
  toDataURL(){ return "data:image/png;base64,x"; }
}
const ids = {};
const documentStub = {
  getElementById(id){ if(!ids[id]) ids[id] = new El("div"); return ids[id]; },
  createElement(tag){ return new El(tag); },
};
const store = {};
global.localStorage = { getItem:k => store[k] ?? null, setItem:(k,v)=>{ store[k]=v; } };
global.document = documentStub;
global.window = global;
global.location = { href: "https://tosh1000950.github.io/auto-lab/gattai-craft/" };
global.navigator = {};
global.Blob = class {}; global.File = class { constructor(){} };
global.confirm = () => true;

eval(fs.readFileSync("app/data.js","utf8"));
const html = fs.readFileSync("app/index.html","utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
eval(script);

const C = global.__craft;
if (!C) throw new Error("test hook missing");
const R = C.RECIPES, ELM = C.EL;
// 1) 既知レシピ：データにあるペアは必ずその結果を返すこと
const knownKey = Object.keys(R)[0];
const [ka, kb] = knownKey.split("|");
const r1 = C.combine(ka, kb);
if (!r1.real || r1.name !== R[knownKey]) throw new Error("known recipe mismatch: " + JSON.stringify(r1));
// 2) 未知ペア：フォールバック要素のいずれかを返すこと
let unknown = null;
const names = Object.keys(ELM);
outer: for (const a of names) for (const b of names) {
  const k = [a,b].sort().join("|");
  if (!R[k]) { unknown = [a,b]; break outer; }
}
if (!unknown) throw new Error("no unknown pair found for fallback test");
const r2 = C.combine(unknown[0], unknown[1]);
if (r2.real) throw new Error("fallback marked real");
if (!["蒸気","煙","氷","泡","光","影","炎","泥"].includes(r2.name)) throw new Error("fallback not in set: " + r2.name);
// 3) pick フロー：開始要素2つを選ぶと合体が起き、結果が found に入ること
const before = C.found().size;
C.pick("水"); C.pick("火");
const after = C.found();
const expect = C.combine("水","火").name;
if (!after.has(expect)) throw new Error("pick flow did not discover " + expect);
console.log("found size:", before, "->", after.size, "| 水+火 =", expect);
// 4) localStorage に保存されていること
if (!store["gattai-craft-v1"]) throw new Error("progress not saved");
console.log("app logic tests: OK");
