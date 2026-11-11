// The verbs of the Kapitel 57 workshop (Verben 3 · Trennbar oder untrennbar?).
// This public file holds only verb facts. The example sentences are lesson content: the lesson page (which loaded
// the chapter with the learner's enrolment) sends its own texts, and loadRounds() finds each verb's sentence there.
// In a lesson text {v:…} marks the finite verb, {t:…} the separated prefix and {e:…} the stressed syllable.
export const VERBS = [
  { pre: 'an', stem: 'fangen', fin: 'fängt', sep: true, stress: 'ANfangen' },
  { pre: 'ver', stem: 'stehen', fin: 'verstehe', sep: false, stress: 'verSTEhen' },
  { pre: 'ein', stem: 'kaufen', fin: 'kaufe', sep: true, stress: 'EINkaufen' },
  { pre: 'be', stem: 'stellen', fin: 'bestelle', sep: false, stress: 'beSTELlen' },
  { pre: 'um', stem: 'steigen', fin: 'steigen', sep: true, stress: 'UMsteigen' },
  { pre: 'wieder', stem: 'holen', fin: 'wiederholen', sep: false, stress: 'wiederHOlen' },
  { pre: 'über', stem: 'setzen', fin: 'setzt', sep: true, stress: 'ÜBERsetzen' },
  { pre: 'über', stem: 'setzen', fin: 'übersetzt', sep: false, stress: 'überSETzen' },
];

// Filled in place by loadRounds(), so importers keep one live array.
export const ROUNDS = [];

const plain = (s) => s.replace(/\{e:([^}]*)\}/g, '$1');
// 'wiederHOlen' -> 'wieder{e:HO}len', the way a lesson writes the stress
const stressMarkup = (s) => s.replace(/[A-ZÄÖÜ]+/, (m) => '{e:' + m + '}');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function loadRounds(texts) {
  const list = (Array.isArray(texts) ? texts : []).filter((t) => typeof t === 'string' && t.length < 400);
  const found = [];
  for (const v of VERBS) {
    const needV = '{v:' + v.fin + '}', needT = '{t:' + v.pre + '}';
    let words = null, note = '';
    for (const raw of list) {
      const m = raw.trim().match(/^(.*?[.?!])\s*(\(([^)]*)\))?$/);
      if (!m) continue;
      const toks = m[1].replace(/\s*([.?!])$/, ' $1').split(/\s+/);
      if (toks.filter((w) => w.startsWith('{v:')).length !== 1 || !toks.includes(needV)) continue;
      if (v.sep ? toks.filter((w) => w.startsWith('{t:')).length !== 1 || !toks.includes(needT) : toks.some((w) => w.startsWith('{t:'))) continue;
      if (toks.some((w) => /[{}]/.test(w) && w !== needV && w !== needT)) continue;
      words = toks.map((w) => (w === needV ? (v.sep ? '#F' : '#V') : w === needT ? '#P' : plain(w)));
      const eq = m[3] && m[3].match(/=\s*(.+)$/);
      if (eq) note = plain(eq[1]).trim();
      break;
    }
    if (!words) continue;
    if (!note) {
      const re = new RegExp(esc(stressMarkup(v.stress)) + ' \\(([^)=]+)\\)');
      for (const raw of list) { const m = raw.match(re); if (m) { note = plain(m[1]).trim(); break; } }
    }
    found.push({ ...v, note, words });
  }
  ROUNDS.length = 0;
  ROUNDS.push(...found);
  return ROUNDS.length;
}
