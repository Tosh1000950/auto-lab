'use strict';
/* エニグマ工房 Stage 1：エニグマI 暗号機コア（DOM非依存）
   ローターI〜V、反射器UKW-B/C、リング設定、プラグボード、ダブルステッピング再現。
   配線は歴史的資料に基づく既知のもの。 */
const ROTORS = {
  I:   { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  II:  { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
  IV:  { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 'J' },
  V:   { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 'Z' }
};
const REFLECTORS = {
  B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT',
  C: 'FVPJIAOYEDRZXWGCTKUQSBNMHL'
};
const A2I = c => c.charCodeAt(0) - 65;
const I2A = i => String.fromCharCode(65 + ((i % 26) + 26) % 26);

class Enigma {
  /* config: { rotors:['I','II','III'], reflector:'B', rings:[0,0,0], positions:[0,0,0], plugs:'AZ BY' or {A:'Z'} } */
  constructor(config = {}) {
    this.rotorNames = config.rotors || ['I', 'II', 'III'];
    this.reflectorName = config.reflector || 'B';
    this.rings = (config.rings || [0, 0, 0]).slice();
    this.positions = (config.positions || [0, 0, 0]).slice();
    this.plugMap = Array.from({ length: 26 }, (_, i) => i);
    const plugs = config.plugs || '';
    const pairs = typeof plugs === 'string' ? plugs.trim().split(/\s+/).filter(Boolean)
      : Object.entries(plugs).map(([a, b]) => a + b);
    for (const p of pairs) {
      if (p.length !== 2) throw new Error('plug pair must be 2 letters: ' + p);
      const a = A2I(p[0].toUpperCase()), b = A2I(p[1].toUpperCase());
      if (a === b) throw new Error('cannot plug a letter into itself');
      if (this.plugMap[a] !== a || this.plugMap[b] !== b) throw new Error('letter already plugged: ' + p);
      this.plugMap[a] = b; this.plugMap[b] = a;
    }
    this.rotors = this.rotorNames.map(name => {
      const r = ROTORS[name];
      if (!r) throw new Error('unknown rotor ' + name);
      const fwd = r.wiring.split('').map(A2I);
      const rev = new Array(26);
      fwd.forEach((v, i) => { rev[v] = i; });
      return { name, fwd, rev, notch: A2I(r.notch) };
    });
    this.reflector = REFLECTORS[this.reflectorName].split('').map(A2I);
  }
  step() {
    const [L, M, R] = this.rotors;
    const p = this.positions;
    const mAtNotch = p[1] === M.notch;
    const rAtNotch = p[2] === R.notch;
    if (mAtNotch) { p[1] = (p[1] + 1) % 26; p[0] = (p[0] + 1) % 26; }
    if (rAtNotch) { p[1] = (p[1] + 1) % 26; }
    p[2] = (p[2] + 1) % 26;
  }
  encipherLetter(ch) {
    let c = A2I(ch.toUpperCase());
    if (c < 0 || c > 25) return ch;
    this.step();
    const path = [{ stage: 'plug-in', letter: I2A(c) }];
    c = this.plugMap[c]; path.push({ stage: 'plugboard', letter: I2A(c) });
    for (let i = 2; i >= 0; i--) {
      const shift = this.positions[i] - this.rings[i];
      c = ((this.rotors[i].fwd[((c + shift) % 26 + 26) % 26] - shift) % 26 + 26) % 26;
      path.push({ stage: 'rotor-' + this.rotors[i].name, letter: I2A(c) });
    }
    c = this.reflector[c]; path.push({ stage: 'reflector', letter: I2A(c) });
    for (let i = 0; i <= 2; i++) {
      const shift = this.positions[i] - this.rings[i];
      c = ((this.rotors[i].rev[((c + shift) % 26 + 26) % 26] - shift) % 26 + 26) % 26;
      path.push({ stage: 'rotor-' + this.rotors[i].name + '-rev', letter: I2A(c) });
    }
    c = this.plugMap[c]; path.push({ stage: 'lamp', letter: I2A(c) });
    return { letter: I2A(c), path, positions: this.positions.slice() };
  }
  encipher(text) {
    let out = '';
    for (const ch of text.toUpperCase()) {
      if (ch >= 'A' && ch <= 'Z') out += this.encipherLetter(ch).letter;
      else if (ch === ' ') out += ' ';
    }
    return out;
  }
  windowString() { return this.positions.map(I2A).join(''); }
}

/* ===== Stage 3：設定コードと日替わりキーシート ===== */
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
const ROMAN_R = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };
function plugsToString(plugMap) {
  const seen = new Set(), pairs = [];
  for (let i = 0; i < 26; i++) {
    const j = plugMap[i];
    if (j !== i && !seen.has(i) && !seen.has(j)) { pairs.push(I2A(i) + I2A(j)); seen.add(i); seen.add(j); }
  }
  return pairs.sort().join('');
}
function encodeConfig(cfg) {
  const m = new Enigma(cfg); /* 検証を兼ねる */
  const rot = cfg.rotors.map(r => ROMAN[r]).join('');
  const rings = (cfg.rings || [0, 0, 0]).map(I2A).join('');
  const pos = (cfg.positions || [0, 0, 0]).map(I2A).join('');
  const plugs = plugsToString(m.plugMap) || '-';
  return 'ENI1-' + rot + '-' + (cfg.reflector || 'B') + '-' + rings + '-' + pos + '-' + plugs;
}
function decodeConfig(code) {
  const parts = String(code).trim().toUpperCase().split('-');
  if (parts.length !== 6 || parts[0] !== 'ENI1') return null;
  const rotDigits = parts[1];
  if (!/^[1-5]{3}$/.test(rotDigits)) return null;
  const rotors = rotDigits.split('').map(d => ROMAN_R[+d]);
  if (new Set(rotors).size !== 3) return null;
  if (!/^[BC]$/.test(parts[2])) return null;
  if (!/^[A-Z]{3}$/.test(parts[3]) || !/^[A-Z]{3}$/.test(parts[4])) return null;
  const plugs = parts[5] === '-' ? '' : parts[5];
  if (plugs && (!/^[A-Z]+$/.test(plugs) || plugs.length % 2 !== 0)) return null;
  const plugStr = plugs ? plugs.match(/.{2}/g).join(' ') : '';
  const cfg = { rotors, reflector: parts[2], rings: parts[3].split('').map(A2I), positions: parts[4].split('').map(A2I), plugs: plugStr };
  try { new Enigma(cfg); } catch (e) { return null; }
  return cfg;
}
function hashSeed(str) { let h = 2166136261; for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function dailyConfig(dateStr) {
  let a = hashSeed('enigma-koubou:' + dateStr);
  const rng = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const names = ['I', 'II', 'III', 'IV', 'V'];
  const order = names.slice();
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const pool = letters.slice();
  const pairs = [];
  for (let k = 0; k < 10; k++) {
    const x = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    const y = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    pairs.push(x + y);
  }
  return {
    rotors: order.slice(0, 3), reflector: rng() < 0.5 ? 'B' : 'C',
    rings: [0, 0, 0].map(() => Math.floor(rng() * 26)),
    positions: [0, 0, 0].map(() => Math.floor(rng() * 26)),
    plugs: pairs.join(' ')
  };
}


/* ===== Stage 4：crib探索（解読ワークベンチ） =====
   既知平文（crib）が暗号文のどこかにあると仮定し、ローター順と開始位置を総当たりする。
   前提：リング・反射器・プラグ盤は現在の設定のものを使う（未知のプラグがあると一致しない）。
   高速化：自己非暗号化ルールで配置を事前に除外し、配線は生配列で直接計算する。 */
function permutations(arr) {
  if (arr.length <= 1) return [arr];
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permutations(rest)) out.push([arr[i]].concat(p));
  }
  return out;
}
function cribSearch(ciphertext, crib, base, opts = {}) {
  const cipher = String(ciphertext).toUpperCase().replace(/[^A-Z]/g, '');
  const cribT = String(crib).toUpperCase().replace(/[^A-Z]/g, '');
  if (!cipher || !cribT || cribT.length > cipher.length) return { hits: [], tested: 0, skipped: 0, error: 'input' };
  const orders = opts.allOrders ? permutations(['I', 'II', 'III', 'IV', 'V']).filter(p => true).flatMap(p => [p]) : [base.rotors];
  const orderList = opts.allOrders ? allRotorOrders() : [base.rotors];
  const reflector = REFLECTORS[base.reflector || 'B'].split('').map(A2I);
  const plugMap = new Enigma({ rotors: base.rotors, reflector: base.reflector, plugs: base.plugs || '' }).plugMap;
  const rings = base.rings || [0, 0, 0];
  const hits = [];
  let tested = 0, skipped = 0;
  for (const order of orderList) {
    const rots = order.map(name => {
      const fwd = ROTORS[name].wiring.split('').map(A2I);
      const rev = new Array(26); fwd.forEach((v, i) => { rev[v] = i; });
      return { fwd, rev, notch: A2I(ROTORS[name].notch) };
    });
    for (let offset = 0; offset + cribT.length <= cipher.length; offset++) {
      let impossible = false;
      for (let j = 0; j < cribT.length; j++) if (cipher[offset + j] === cribT[j]) { impossible = true; break; }
      if (impossible) { skipped++; continue; }
      for (let s0 = 0; s0 < 26; s0++) for (let s1 = 0; s1 < 26; s1++) for (let s2 = 0; s2 < 26; s2++) {
        tested++;
        const pos = [s0, s1, s2];
        let ok = true;
        for (let j = 0; j < cribT.length; j++) {
          /* ステップ（ダブルステッピング含む） */
          const mAt = pos[1] === rots[1].notch, rAt = pos[2] === rots[2].notch;
          if (mAt) { pos[1] = (pos[1] + 1) % 26; pos[0] = (pos[0] + 1) % 26; }
          if (rAt) { pos[1] = (pos[1] + 1) % 26; }
          pos[2] = (pos[2] + 1) % 26;
          let c = A2I(cipher[offset + j]);
          c = plugMap[c];
          for (let i = 2; i >= 0; i--) { const sh = pos[i] - rings[i]; c = ((rots[i].fwd[((c + sh) % 26 + 26) % 26] - sh) % 26 + 26) % 26; }
          c = reflector[c];
          for (let i = 0; i <= 2; i++) { const sh = pos[i] - rings[i]; c = ((rots[i].rev[((c + sh) % 26 + 26) % 26] - sh) % 26 + 26) % 26; }
          c = plugMap[c];
          if (I2A(c) !== cribT[j]) { ok = false; break; }
        }
        if (ok) {
          /* 開始位置は「暗号文の先頭」基準に直す：offset分進んだ位置から逆算できないため、
             ヒットした開始位置は crib 開始時点のもの。先頭位置は別途、offset文字進めた先として記録する */
          hits.push({ rotors: order.slice(), startAtCrib: [s0, s1, s2], offset });
          if (hits.length >= 20) return { hits, tested, skipped };
        }
      }
    }
  }
  return { hits, tested, skipped };
}
function allRotorOrders() {
  const names = ['I', 'II', 'III', 'IV', 'V'], out = [];
  for (const a of names) for (const b of names) for (const c of names) if (a !== b && b !== c && a !== c) out.push([a, b, c]);
  return out;
}

/* crib開始時点の位置から、文頭の開始位置を復元する（offset回ステップして一致する開始位置を探す） */
function recoverStart(cfg, startAtCrib, offset) {
  for (let a = 0; a < 26; a++) for (let b = 0; b < 26; b++) for (let c = 0; c < 26; c++) {
    const m = new Enigma({ rotors: cfg.rotors, reflector: cfg.reflector, rings: cfg.rings, positions: [a, b, c], plugs: cfg.plugs || '' });
    for (let i = 0; i < offset; i++) m.encipherLetter('A');
    if (m.positions[0] === startAtCrib[0] && m.positions[1] === startAtCrib[1] && m.positions[2] === startAtCrib[2]) return [a, b, c];
  }
  return null;
}
if (typeof module !== 'undefined') module.exports = { Enigma, ROTORS, REFLECTORS, encodeConfig, decodeConfig, dailyConfig, plugsToString, cribSearch, allRotorOrders, recoverStart };
