/* Feedback (F) and the practice format (P) for every scene (plan §1.5).
   One round = one item from the chapter's private lines file. Three kinds:
     order   { kind:'order', tiles:[…], roles:[…], ok:[sentence…], end:'.', q? }       tiles onto the sentence strip
     choice  { kind:'choice', q:'… ___ …', options:[…], right:i, why:{ i: text } }     tap the right form
     type    { kind:'type', q, ok:[…], bad:{ sentence: why }, chips:[…], end:'.' }     write (or tap chips into) a sentence
   The hint ladder: 1st miss = the reason (and the machine's failure animation), 2nd miss = a hint (seats fixed,
   options struck out), 3rd miss = "Richtig ist …" and on to the next round. Only first tries count for the score.
   Feedback is neutral ("passt nicht" + why) unless the chapter stages a Folge (the wrong sentence's real meaning). */
import { $, rich, plain, esc } from './stage.js';
import { play } from './sfx.js';

export const norm = (s) => plain(s).replace(/[„“"«»]/g, '').replace(/\s+/g, ' ').replace(/\s*([.!?,])\s*$/, '').trim();
const fold = (s) => norm(s).toLowerCase();

export function createPractice(B, strip, hooks = {}) {
  const miss = async (item, tries) => { if (hooks.miss) { try { await hooks.miss(item, tries); } catch (e) { if (e instanceof B.Abort) throw e; } } };
  const P = { score: 0, asked: 0 };
  let lead = '';                              // the part's instruction, kept above every item
  const prompt = (html) => { $('prompt').innerHTML = (lead ? `<small>${lead}</small>` : '') + html; };
  const setLead = (html) => { lead = html || ''; };
  const busy = (on) => $('panel').classList.toggle('busy', on);
  const tell = (cls, html) => { $('verdict').className = cls; $('verdict').innerHTML = html; };
  const why = (k) => (B.data('why')[k] || '');
  function reset() { lead = ''; P.score = 0; P.asked = 0; $('score').textContent = ''; tell('', ''); prompt('&nbsp;'); $('answers').replaceChildren(); $('say').style.display = 'none'; strip.clear(); }
  function count(firstTry) { P.asked++; if (firstTry) P.score++; $('score').textContent = `${P.score} / ${P.asked}`; }

  /* order: where is the mistake? The strip shows the learner's own order, then the machine reacts */
  function diagnose(item, order) {
    const roles = order.map((t) => item.roles[t] || 'x'), n = roles.length;
    const vWant = item.q === 'yn' ? 0 : 1, iv = roles.indexOf('v'), it = roles.lastIndexOf('t');
    if (it >= 0 && it !== n - 1) return { k: 't_end', anim: 'slip' };
    if (iv >= 0 && iv !== vWant) return { k: vWant === 0 ? 'v_1' : 'v_2', anim: 'stall', at: iv };
    if (item.first != null && order[0] !== item.first && vWant === 1) return { k: 'first', anim: 'mark', at: 0 };
    return { k: 'mid', anim: 'mark', at: Math.max(0, Math.min(n - 2, 2)) };
  }
  async function askOrder(item) {
    let tries = 0, fixed = {};
    while (true) {
      busy(false); const order = await strip.tiles(item.tiles, { fixed, end: item.end || '', roles: item.roles }); busy(true); tries++;
      const said = order.map((t) => plain(item.tiles[t])).join(' ') + (item.end || '');
      const right = item.ok.some((s) => norm(s) === norm(said));
      strip.settle(item.tiles, item.roles, order);
      if (right) { await strip.setClamp(true); play.right(); tell('ok', `<b>Richtig!</b> ${rich(said)}`); count(tries === 1); return { right: true, tries, said }; }
      const d = diagnose(item, order); play.wrong();
      if (d.anim === 'slip') await strip.slip(); else if (d.anim === 'stall') { strip.shake(d.at); strip.mark(d.at, 'bad'); await B.wait(0.5); } else { strip.mark(d.at, 'bad'); await B.wait(0.4); }
      if (tries >= 3) { const good = item.ok[0] + (item.end || ''); tell('no', `Richtig ist: <b>${rich(good)}</b>`); count(false); return { right: false, tries, said, good }; }
      tell('no', `<b>Noch nicht.</b> ${rich(item.why && item.why[d.k] || why(d.k))}`); await miss(item, tries);
      if (tries === 2) {        // the hint: the verb engine and the last wagon are put in place
        const good = item.ok[0].split(' '); fixed = {};
        item.roles.forEach((r, t) => { if (r === 'v' || r === 't') { const s = locate(item.tiles, good, t); if (s >= 0) fixed[s] = t; } });
      }
      await B.wait(1.1);
    }
  }
  // the seat of tile t in the right sentence: walk the sentence, matching whole tiles (a tile can be several words)
  function locate(tiles, words, t) {
    let rest = norm(words.join(' ')); const left = tiles.map((_, k) => k), order = [];
    while (rest && left.length) {
      const k = left.find((j) => (rest + ' ').startsWith(norm(tiles[j]) + ' ')); if (k == null) break;
      order.push(k); left.splice(left.indexOf(k), 1); rest = rest.slice(norm(tiles[k]).length).trim();
    }
    return order.indexOf(t);
  }

  /* choice: tap the right form; the gap in the sentence shows each try */
  function askChoice(item) {
    return new Promise((done) => {
      let tries = 0; busy(false); $('say').style.display = 'none';
      const [pre, post = ''] = item.q.split('___');
      const fill = (w) => `${rich(pre)}<u>${w ? rich(w) : '&emsp;&emsp;'}</u>${rich(post)}`;
      prompt(fill(''));
      const box = $('answers'); box.replaceChildren();
      item.options.forEach((o, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.innerHTML = rich(o);
        b.onclick = async () => {
          tries++; busy(true);
          if (i === item.right) { play.right(); prompt(fill(o)); tell('ok', '<b>Richtig!</b>'); count(tries === 1); box.replaceChildren(); done({ right: true, tries, said: item.q.replace('___', o) }); return; }
          play.wrong(); b.disabled = true; b.classList.add('out'); prompt(fill(o));
          if (tries >= 2 && item.options.length <= 3 || tries >= 3) { tell('no', `Richtig ist: <b>${rich(item.q.replace('___', item.options[item.right]))}</b>`); count(false); box.replaceChildren(); done({ right: false, tries }); return; }
          tell('no', `<b>Passt nicht.</b> ${rich((item.why && item.why[i]) || why('form'))}`); await miss(item, tries); busy(false);
        };
        box.appendChild(b);
      });
      box.querySelector('button').focus({ preventScroll: true });
    });
  }

  /* type: write the sentence (chips help on a phone); known wrong forms get their own reason */
  function askType(item) {
    return new Promise((done) => {
      let tries = 0; busy(false); const inp = $('inp'), ok = $('ok'), box = $('answers'); $('say').style.display = 'flex'; inp.value = ''; box.replaceChildren();
      // pre: the fixed start of the answer ("Doch, ich habe …"); the learner writes the rest
      let pre = $('say').querySelector('.pre'); if (!pre) { pre = document.createElement('span'); pre.className = 'pre'; $('say').prepend(pre); }
      pre.textContent = item.pre || ''; pre.style.display = item.pre ? '' : 'none';
      const whole = (x) => (item.pre ? item.pre + ' ' : '') + x;
      for (const c of item.chips || []) { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = rich(c); b.onclick = () => { inp.value = (inp.value.trim() + ' ' + plain(c)).trim(); inp.focus(); }; box.appendChild(b); }
      const check = () => {
        const v = inp.value.trim(); if (!v) { inp.focus(); return; }
        tries++; const said = norm(v), right = item.ok.some((s) => norm(s) === said);
        if (right) { play.right(); ok.onclick = null; inp.onkeydown = null; tell('ok', `<b>Richtig!</b> ${esc(whole(said))}${item.end || '.'}`); count(tries === 1); box.replaceChildren(); $('say').style.display = 'none'; done({ right: true, tries, said }); return; }
        play.wrong();
        const known = Object.entries(item.bad || {}).find(([s]) => fold(s) === fold(v));
        if (tries >= 3) { ok.onclick = null; inp.onkeydown = null; tell('no', `Richtig ist: <b>${rich(whole(item.ok[0]))}${item.end || '.'}</b>`); count(false); box.replaceChildren(); $('say').style.display = 'none'; done({ right: false, tries }); return; }
        const close = item.ok.some((s) => fold(s) === fold(v));       // only the capital letters differ
        tell('no', `<b>Noch nicht.</b> ${rich(close ? why('caps') : known ? known[1] : tries === 2 && item.hint ? item.hint : why('type'))}`);
        inp.select(); miss(item, tries);
      };
      ok.onclick = check; inp.onkeydown = (e) => { if (e.key === 'Enter') check(); };
      inp.focus({ preventScroll: true });
    });
  }
  const ask = (item) => (item.kind === 'order' ? askOrder(item) : item.kind === 'choice' ? askChoice(item) : askType(item));
  return { P, ask, askOrder, askChoice, askType, reset, prompt, setLead, tell, busy, count };
}
