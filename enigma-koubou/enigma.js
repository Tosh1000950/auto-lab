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
if (typeof module !== 'undefined') module.exports = { Enigma, ROTORS, REFLECTORS };
