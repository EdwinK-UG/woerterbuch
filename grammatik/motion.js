/* Deutschklinik – motion: living, explaining and interactive versions of the grammar scene pictures.
   The lesson pages and the video player both draw scenes through window.GRAM_ART.draw(K, scene). Loading this file wraps that
   function: every scene gets a "life layer" (people breathe, speech bubbles pop in, clouds drift) and the key grammar ideas get
   their own animated explainer (a story) that can also be played with: tap, build, switch.
   No lesson text lives here. Words, sentences and captions always come from the scene the private lesson supplies. */
(function (root) {
'use strict';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- 1. text helpers (pure) ---------- */
// "Ich *möchte* ans Meer *fahren*." → [{t:'Ich'},{t:'möchte',hl:true},{t:'ans Meer'},{t:'fahren.',hl:true}]
function chunks(bubble) {
  const out = [];
  String(bubble || '').split('*').forEach((p, i) => {
    let t = p.replace(/\s+/g, ' ').trim(); if (!t) return;
    let m; while (out.length && (m = /^([.,;:!?…]+)\s*(.*)$/.exec(t))) { out[out.length - 1].t += m[1]; t = m[2]; }   // punctuation sticks to the word before it
    if (t) out.push({ t, hl: i % 2 === 1 });
  });
  return out;
}
const chipW = t => Math.round(String(t).length * 8.1 + 26);
const range = n => Array.from({ length: n }, (_, i) => i);
// small deterministic "random" so a scene looks the same every time it is drawn
const jig = (i, k) => { const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
const lang = () => (root.KONTO && root.KONTO.lang && root.KONTO.lang() === 'de' ? 'de' : 'en');
const L = (e, d) => (lang() === 'de' ? d : e);
const tr = f => `translate(${+f.x.toFixed(1)}px,${+f.y.toFixed(1)}px) rotate(${+(f.r || 0).toFixed(1)}deg) scale(${+(f.s == null ? 1 : f.s).toFixed(3)})`;
const labelStrip = label => {
  if (!label) return '';
  const lines = ['']; label.split(' ').forEach(w => { const i = lines.length - 1; if (lines[i] && (lines[i] + ' ' + w).length > 45) lines.push(w); else lines[i] += (lines[i] ? ' ' : '') + w; });
  const top = lines.length > 1 ? 296 : 311;
  return `<g class="gm-label"><rect x="55" y="${top}" width="410" height="${lines.length * 19 + 16}" rx="12" fill="var(--card)"/><text x="260" y="${top + 23}" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="15" fill="var(--fg)">${lines.map((l, i) => `<tspan x="260" dy="${i ? 19 : 0}">${esc(l)}</tspan>`).join('')}</text></g>`;
};
const chipSVG = (c, i, f, cls, extra) => `<g class="gm-chip ${cls || ''}" data-i="${i}" style="transform:${tr(f)}" role="button" tabindex="-1" aria-label="${esc(c.t)}"><rect x="${-c.w / 2}" y="-17" width="${c.w}" height="34" rx="11" class="${c.hl ? 'hl' : ''}"/><text y="5.5" text-anchor="middle">${esc(c.t)}</text>${extra || ''}</g>`;
const badge = (x, y, t, cls) => `<g class="gm-tag ${cls || ''}" transform="translate(${x} ${y})"><rect x="${-(t.length * 3.6 + 9)}" y="-10" width="${t.length * 7.2 + 18}" height="20" rx="10"/><text y="4" text-anchor="middle">${esc(t)}</text></g>`;


// loose words float in tidy, shuffled rows (never on top of each other): positions for chips that are not placed yet
function looseRows(chips, k, ys, seed) {
  const order = range(chips.length).sort((a, b) => jig(a, seed || 5) - jig(b, seed || 5)), rows = ys.map(() => []), out = chips.map(() => null);
  order.forEach((ci, j) => rows[j % ys.length].push(ci));
  rows.forEach((row, ri) => {
    const wid = row.reduce((a, ci) => a + chips[ci].w + 14, -14), sc = Math.min(.95 * k, 470 / (wid || 1));
    let cx = 260 - row.reduce((a, ci) => a + chips[ci].w * sc + 14, -14) / 2;
    row.forEach(ci => { out[ci] = { x: cx + chips[ci].w * sc / 2, y: ys[ri] + (jig(ci, 2) - .5) * 10, r: (jig(ci, 3) - .5) * 12, s: sc }; cx += chips[ci].w * sc + 14; });
  });
  return out;
}

/* ---------- 2. stories: one animated explainer per kind of scene ---------- */
const STORIES = {};

/* The sentence bridge: first word group, then the verb on position 2, the middle words, the second verb part at the end. */
STORIES.bridge = {
  plan(scene) {
    const c = chunks(scene.bubble); if (c.length < 2) return null;
    const hi = c.map((x, i) => (x.hl ? i : -1)).filter(i => i >= 0); if (hi.length < 2) return null;
    const role = c.map(() => 'x'); let v1, v2 = -1;
    if (hi[0] === 0) { role[0] = 'p1'; v1 = hi[1]; v2 = hi.length > 2 ? hi[hi.length - 1] : -1; }
    else { v1 = hi[0]; v2 = hi[hi.length - 1]; for (let i = 0; i < v1; i++) role[i] = 'p1'; }
    role[v1] = 'v1'; if (v2 > v1) role[v2] = 'v2';
    for (let i = v1 + 1; i < (v2 > v1 ? v2 : c.length); i++) role[i] = 'mid';
    const chips = c.map((x, i) => ({ t: x.t, hl: !!x.hl, role: role[i], w: chipW(x.t) }));
    const gap = 9, total = chips.reduce((a, x) => a + x.w, 0) + gap * (chips.length - 1), k = Math.min(1, 478 / total);
    let cur = 260 - total * k / 2; const Y = 236;
    chips.forEach(x => { x.fx = cur + x.w * k / 2; cur += (x.w + gap) * k; });
    const stepOf = { p1: 1, v1: 2, mid: 3, v2: 4, x: 4 };
    const loose = looseRows(chips, k, [52, 100]);
    const frames = range(5).map(s => chips.map((x, i) => (stepOf[x.role] <= s ? { x: x.fx, y: Y, r: 0, s: k } : loose[i])));
    const iv1 = chips.findIndex(x => x.role === 'v1'), iv2 = chips.findIndex(x => x.role === 'v2');
    const x1 = chips[iv1].fx, x2 = iv2 >= 0 ? chips[iv2].fx : chips[chips.length - 1].fx;
    return { n: 5, dur: [900, 1200, 1500, 1400, 2300], chips, frames, Y, k, x1, x2, hasV2: iv2 >= 0, game: true };
  },
  draw(K, scene, p) {
    const post = (x, t, cls) => `<g class="gm-post ${cls}"><rect x="${x - 5}" y="132" width="10" height="136" rx="4"/><circle cx="${x}" cy="130" r="${t.length > 2 ? 22 : 15}"/><text x="${x}" y="${t.length > 2 ? 135 : 136}" text-anchor="middle">${t}</text></g>`;
    const mid = (p.x1 + p.x2) / 2, spanX = p.x2 - p.x1;
    return K.sky() + `<path class="gm-wave" d="M-20 306q30-14 60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0V360H-20Z" fill="var(--akk)" opacity=".22"/>`
      + `<g class="gm-deck"><rect x="26" y="266" width="468" height="13" rx="5" fill="var(--wood)"/><path d="M26 281h468" stroke="var(--ink)" stroke-width="3" opacity=".13"/>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${66 + i * 58} 266v13" stroke="var(--ink)" opacity=".15"/>`).join('')}</g>`
      + `<path class="gm-arch" d="M${p.x1} 128Q${mid} ${128 - Math.min(78, 28 + spanX * .22)} ${p.x2} 128" fill="none" stroke="var(--wood)" stroke-width="8" stroke-linecap="round" pathLength="1"/>`
      + post(p.x1, '2', 'v1') + (p.hasV2 ? post(p.x2, 'Ende', 'v2') : '')
      + `<g class="gm-hero" transform="translate(${mid} ${128 - Math.min(78, 28 + spanX * .22) * .5 - 1})"><g class="gm-hop">${K.person({ x: 0, y: 1, s: .33, skin: 3, hair: 'curly', shirt: 'var(--akk)', armR: 'wave', armL: 'hip', face: 'open' })}</g></g>`
      + p.chips.map((c, i) => chipSVG(c, i, p.frames[4][i], 'r-' + c.role)).join('')
      + p.chips.map((c, i) => (c.role === 'p1' ? badge(c.fx, 206, '1', 'r-p1 t-' + i) : c.role === 'mid' ? badge(c.fx, 206, 'Mitte', 'r-mid t-' + i) : '')).join('')
      + p.chips.map((c, i) => `<g class="gm-slot" data-i="${i}" role="button" tabindex="-1" aria-label="${c.role === 'p1' ? 'Position 1' : c.role === 'v1' ? 'Position 2' : c.role === 'v2' ? 'Ende' : 'Mitte'}"><rect x="${c.fx - c.w * p.k / 2 - 3}" y="${p.Y - 20}" width="${c.w * p.k + 6}" height="40" rx="13"/></g>`).join('')
      + labelStrip(scene.label);
  },
  // sets the picture to a given step (0 = words scattered … 4 = bridge complete)
  apply(svg, p, i) {
    svg.querySelectorAll('.gm-chip').forEach((el, k) => { el.style.transform = tr(p.frames[i][k]); });
    const on = (sel, v) => svg.querySelectorAll(sel).forEach(el => el.classList.toggle('on', v));
    on('.gm-post.v1', i >= 2); on('.gm-post.v2', i >= 4); on('.gm-arch', i >= 4); on('.gm-hero', i >= 4);
    p.chips.forEach((c, k) => svg.querySelectorAll('.t-' + k).forEach(el => el.classList.toggle('on', (c.role === 'p1' && i >= 1) || (c.role === 'mid' && i >= 3))));
    svg.querySelectorAll('.gm-chip').forEach((el, k) => el.classList.toggle('set', (({ p1: 1, v1: 2, mid: 3, v2: 4, x: 4 })[p.chips[k].role]) <= i));
  },
  resetGame(svg) { svg.querySelectorAll('.gm-tag,.gm-post,.gm-arch,.gm-hero').forEach(el => el.classList.remove('on')); },
  place(svg, p, k) { const r = p.chips[k].role; svg.querySelectorAll('.t-' + k).forEach(t => t.classList.add('on')); if (r === 'v1') svg.querySelector('.gm-post.v1').classList.add('on'); if (r === 'v2') { const v = svg.querySelector('.gm-post.v2'); if (v) v.classList.add('on'); } },
  finish(svg) { svg.querySelector('.gm-arch').classList.add('on'); svg.querySelector('.gm-hero').classList.add('on'); },
  win: ['Well done! The sentence bridge stands.', 'Geschafft! Die Satzbrücke steht.']
};

/* Valency: the verb decides how many partners it needs, and in which case each one stands. */
const VAL = { N: { c: 'var(--nom)', n: 'Nominativ', q: 'Wer?' }, A: { c: 'var(--akk)', n: 'Akkusativ', q: 'Wen? Was?' }, D: { c: 'var(--dat)', n: 'Dativ', q: 'Wem?' }, G: { c: 'var(--ac)', n: 'Genitiv', q: 'Wessen?' }, P: { c: 'var(--mut)', n: '', q: '' } };
const VPOS = [[94, 153], [426, 153], [260, 262]];
STORIES.valency = {
  plan(scene) {
    const roles = scene.roles; if (!roles || !roles.length || roles.length > 3 || roles.some(r => !VAL[r.case])) return null;
    const chips = roles.map(r => { const w = chipW(r.text); return { t: r.text, w, cs: r.case, hl: false, role: 'r' }; });
    const sk = chips.map(c => Math.min(1, 146 / c.w)), n = roles.length + 1;
    const loose = looseRows(chips.map((c, i) => ({ ...c })), 1, [44, 88], 7);
    const frames = range(n).map(st => chips.map((c, i) => (i < st ? { x: VPOS[i][0], y: VPOS[i][1] + 10, r: 0, s: sk[i] } : loose[i])));
    return { n, dur: [1200].concat(range(roles.length).map(() => 1500)), chips, frames, game: true, roles, sk, verb: scene.verb || '' };
  },
  draw(K, scene, p) {
    const vw = Math.max(138, chipW(p.verb) + 44), arm = (i) => { const [x, y] = VPOS[i]; return `<path class="gm-arm a-${i}" d="M260 188Q${(260 + x) / 2} ${(188 + y) / 2 - 30} ${x} ${y}" fill="none" stroke="${VAL[p.roles[i].case].c}" stroke-width="5" stroke-linecap="round" pathLength="1"/>`; };
    const sock = (r, i) => { const [x, y] = VPOS[i], v = VAL[r.case], cap = r.label || (v.n ? v.n + ' · ' + v.q : 'Präposition'); return `<g class="gm-sock s-${i}"><rect x="${x - 80}" y="${y - 36}" width="160" height="72" rx="20" fill="var(--card)" stroke="${v.c}" stroke-width="2.4" stroke-dasharray="7 5"/><text x="${x}" y="${y - 15}" text-anchor="middle" fill="${v.c}">${esc(cap)}</text></g>`; };
    return K.grad() + p.roles.map((r, i) => arm(i)).join('') + p.roles.map(sock).join('')
      + `<g class="gm-verb"><rect x="${260 - vw / 2}" y="162" width="${vw}" height="52" rx="26" fill="var(--ink)"/><text x="260" y="195" text-anchor="middle">${esc(p.verb)}</text><g class="gm-eyes"><circle cx="243" cy="159" r="8" fill="var(--card)"/><circle cx="277" cy="159" r="8" fill="var(--card)"/><circle cx="245" cy="160" r="3.4" fill="var(--ink)"/><circle cx="279" cy="160" r="3.4" fill="var(--ink)"/></g></g>`
      + p.chips.map((c, i) => chipSVG(c, i, p.frames[p.n - 1][i], 'c-' + c.cs)).join('')
      + p.chips.map((c, i) => `<g class="gm-slot" data-i="${i}" role="button" tabindex="-1" aria-label="${esc(VAL[c.cs].n || 'Präposition')}"><rect x="${VPOS[i][0] - 82}" y="${VPOS[i][1] - 38}" width="164" height="76" rx="21"/></g>`).join('')
      + (scene.bubble ? `<g class="gm-say">${K.bubble(260, 44, scene.bubble, { tail: 'c', w: 440 })}</g>` : '') + labelStrip(scene.label);
  },
  apply(svg, p, i) {
    svg.querySelectorAll('.gm-chip').forEach((el, k) => { el.style.transform = tr(p.frames[i][k]); el.classList.toggle('set', k < i); });
    svg.querySelectorAll('.gm-arm').forEach((el, k) => el.classList.toggle('on', k < i));
    svg.querySelectorAll('.gm-sock').forEach((el, k) => el.classList.toggle('full', k < i));
    svg.querySelectorAll('.gm-say').forEach(el => el.classList.toggle('on', i === p.n - 1)); svg.classList.toggle('gm-happy', i === p.n - 1);
  },
  same: (p, i, k) => p.chips[i].cs === p.chips[k].cs,
  at: (p, i, k) => ({ x: VPOS[k][0], y: VPOS[k][1] + 10, r: 0, s: p.sk[i] }),
  resetGame(svg) { svg.querySelectorAll('.gm-arm,.gm-say').forEach(el => el.classList.remove('on')); svg.querySelectorAll('.gm-sock').forEach(el => el.classList.remove('full')); svg.classList.remove('gm-happy'); },
  place(svg, p, k) { svg.querySelectorAll('.gm-arm')[k].classList.add('on'); svg.querySelectorAll('.gm-sock')[k].classList.add('full'); },
  finish(svg) { svg.querySelectorAll('.gm-say').forEach(el => el.classList.add('on')); svg.classList.add('gm-happy'); },
  win: ['Well done! The verb has all its partners.', 'Geschafft! Das Verb hat alle seine Partner.']
};



/* Place prepositions: the same crate, the same ball. "Wohin?" the ball moves (accusative), "Wo?" it rests (dative). */
const SP = { in: [260, 207, 1, 'in'], auf: [260, 143, 1], an: [338, 205, 1], 'über': [260, 96, 1], unter: [260, 272, 1, 'ground'], vor: [282, 280, 1.3, 'front'], hinter: [270, 162, .95, 'back'], neben: [392, 272, 1, 'ground'], zwischen: [260, 272, 1] };
const SP_START = [54, 272, 1];
function arcPath(a, b, ground) {
  const pts = [];
  const c = ground ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] : [(a[0] + b[0]) / 2, Math.min(a[1], b[1], 150) - 120];
  for (let i = 0; i <= 14; i++) { const t = i / 14, u = 1 - t; pts.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], a[2] + (b[2] - a[2]) * t]); }
  return pts;
}
STORIES.spatial = {
  plan(scene) {
    const r = SP[scene.relation]; if (!r) return null;
    const ground = r[3] === 'ground' || r[3] === 'front';
    return { n: 2, dur: [2700, 1800], r, path: arcPath(SP_START, r, ground), modes: [{ k: 0, label: 'Wohin?' }, { k: 1, label: 'Wo?' }], rel: scene.relation };
  },
  draw(K, scene, p) {
    const [bx, by, bs, layer] = p.r, two = p.rel === 'zwischen', cw = two ? 104 : 120;
    const crate = cx => `<g class="gm-crate"><rect x="${cx - cw / 2}" y="160" width="${cw}" height="90" rx="9" fill="var(--wood)"/><path d="M${cx - cw / 2 + 8} 190H${cx + cw / 2 - 8}M${cx - cw / 2 + 8} 220H${cx + cw / 2 - 8}" stroke="var(--ink)" stroke-opacity=".16" stroke-width="3"/><rect x="${cx - cw / 2}" y="160" width="${cw}" height="9" rx="4" fill="var(--ink)" opacity=".14"/><rect x="${cx - cw / 2}" y="250" width="11" height="38" rx="3" fill="var(--wood)"/><rect x="${cx + cw / 2 - 11}" y="250" width="11" height="38" rx="3" fill="var(--wood)"/></g>`;
    const front = layer === 'in' ? `<g class="gm-crate"><rect x="${260 - cw / 2}" y="200" width="${cw}" height="50" rx="9" fill="var(--wood)" stroke="var(--ink)" stroke-opacity=".18" stroke-width="2"/><path d="M${260 - cw / 2 + 8} 226H${260 + cw / 2 - 8}" stroke="var(--ink)" stroke-opacity=".16" stroke-width="3"/></g>` : '';
    const bodies = two ? crate(140) + crate(380) : crate(260);
    const ball = `<g class="gm-ball" style="transform:${tr({ x: bx, y: by, r: 0, s: bs })}"><circle r="17" fill="var(--die)"/><circle cx="-5.5" cy="-6" r="5" fill="#fff" opacity=".45"/></g>`;
    const trail = `<path class="gm-trail" d="M${p.path.map(q => q[0].toFixed(0) + ' ' + q[1].toFixed(0)).join('L')}" fill="none" stroke="var(--akk)" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/>`;
    const tag = (cls, x, t, c) => `<g class="gm-mtag ${cls}"><rect x="${x - 86}" y="318" width="172" height="30" rx="15" fill="${c}"/><text x="${x}" y="338" text-anchor="middle">${t}</text></g>`;
    return K.grad() + `<rect y="288" width="520" height="72" fill="var(--floor)"/><rect y="285" width="520" height="5" fill="var(--wood)" opacity=".5"/><ellipse cx="${two ? 260 : 260}" cy="292" rx="${two ? 190 : 78}" ry="6" fill="var(--ink)" opacity=".12"/>`
      + trail + (layer === 'back' ? ball + bodies : bodies + ball) + front
      + (scene.bubble ? `<g class="gm-say">${K.bubble(260, 38, scene.bubble, { tail: 'c', w: 380 })}</g>` : '')
      + tag('m0', 260, 'Wohin? → Akkusativ', 'var(--akk)') + tag('m1', 260, 'Wo? → Dativ', 'var(--dat)');
  },
  apply(svg, p, i) {
    const ball = svg.querySelector('.gm-ball'); if (ball._a) { ball._a.cancel(); ball._a = null; }
    const end = tr({ x: p.r[0], y: p.r[1], r: 0, s: p.r[2] });
    ball.style.transform = end;
    if (i === 0 && ball.animate && !(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      ball._a = ball.animate(p.path.map(q => ({ transform: tr({ x: q[0], y: q[1], r: 0, s: q[2] }) })), { duration: 1700, easing: 'ease-in-out', fill: 'forwards', delay: 350 });
    }
    svg.querySelector('.gm-trail').classList.toggle('on', i === 0);
    svg.querySelector('.m0').classList.toggle('on', i === 0); svg.querySelector('.m1').classList.toggle('on', i === 1);
    svg.querySelectorAll('.gm-say').forEach(el => el.classList.toggle('on', i === 1));
  }
};


/* Wishes and "what if" sentences (Konjunktiv II): reality on the ground, the wish in a thought cloud above. */
const SPARK = (x, y, r, d) => `<g transform="translate(${x} ${y}) scale(${r})"><path class="gm-spark" style="animation-delay:${d}s" d="M0-9L2.5-2.5L9 0L2.5 2.5L0 9L-2.5 2.5L-9 0L-2.5-2.5Z" fill="var(--sun)"/></g>`;
STORIES.wish = {
  plan(scene) {
    const c = chunks(scene.bubble); if (!c.length) return null;
    const chips = c.map(x => ({ t: x.t, hl: !!x.hl, w: chipW(x.t), role: 'w' }));
    // pack the sentence into tidy rows inside the cloud
    const rows = [[]]; let cur = 0;
    chips.forEach((x, i) => { if (rows[rows.length - 1].length && cur + x.w + 8 > 290) { rows.push([]); cur = 0; } rows[rows.length - 1].push(i); cur += x.w + 8; });
    if (rows.length > 3) return null;
    const widest = Math.max(...rows.map(r => r.reduce((a, i) => a + chips[i].w + 8, -8))), k = Math.min(1, 290 / widest), CX = 335, CY = 108;
    const pos = chips.map(() => null);
    rows.forEach((row, ri) => { const wid = row.reduce((a, i) => a + (chips[i].w + 8) * k, -8 * k); let x = CX - wid / 2; row.forEach(i => { pos[i] = { x: x + chips[i].w * k / 2, y: CY + (ri - (rows.length - 1) / 2) * 40 * Math.max(k, .8), r: 0, s: k }; x += (chips[i].w + 8) * k; }); });
    const hid = pos.map(q => ({ ...q, s: .3 }));
    return { n: 3, dur: [1400, 1900, 2400], chips, frames: [hid, pos, pos], modes: [{ k: 0, label: 'Realität' }, { k: 2, label: 'Wunsch' }], past: scene.kind === 'past-wish', CX, CY };
  },
  draw(K, scene, p) {
    const sh = (r) => [[0, 0, 150, 50], [-100, -8, 38, 38], [-34, -38, 42, 42], [34, -36, 42, 42], [96, -6, 34, 34]].map(([dx, dy, rx, ry]) => `<ellipse cx="${p.CX + dx}" cy="${p.CY + dy + 6}" rx="${rx + r}" ry="${ry + r}"/>`).join('');
    const reality = K.person({ x: 112, y: 318, s: .92, skin: 3, hair: 'curly', shirt: 'var(--akk)', face: 'flat', armL: 'down', armR: 'chest' });
    const dream = K.person({ x: 112, y: 318, s: .92, skin: 3, hair: 'curly', shirt: 'var(--akk)', face: p.past ? 'flat' : 'open', armL: 'down', armR: p.past ? 'chest' : 'up' });
    return (p.past ? K.sky(false) + '<rect width="520" height="360" fill="var(--ink)" opacity=".1"/>' : K.sky())
      + `<g class="gm-dots3"><circle cx="150" cy="152" r="5"/><circle cx="170" cy="138" r="8"/><circle cx="196" cy="124" r="11"/></g>`
      + `<g class="gm-cloud"><g fill="var(--line)">${sh(2.5)}</g><g fill="var(--card)">${sh(0)}</g></g>`
      + (p.past ? `<g class="gm-rewind" transform="translate(468 52)"><circle r="22" fill="var(--card)" stroke="var(--line)" stroke-width="2"/><path d="M0-12V0L-8 6" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-20-8A22 22 0 1 1-18 8M-24-4l4-6 6 5" stroke="var(--ac)" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>` : SPARK(212, 70, 1.1, 0) + SPARK(470, 62, 1.5, .5) + SPARK(440, 160, 1, 1) + SPARK(250, 160, .8, 1.5))
      + `<g class="gm-real">${reality}</g><g class="gm-want">${dream}</g>`
      + p.chips.map((c, i) => chipSVG(c, i, p.frames[2][i], 'w')).join('') + labelStrip(scene.label);
  },
  apply(svg, p, i) {
    svg.classList.toggle('gm-dream', i >= 1); svg.classList.toggle('gm-wow', i >= 2);
    svg.querySelectorAll('.gm-chip').forEach((el, k) => { el.style.transform = tr(p.frames[i][k]); el.style.setProperty('--d', (i >= 1 ? 0.35 + k * 0.28 : 0) + 's'); el.classList.toggle('set', i >= 1); });
  }
};
STORIES['past-wish'] = STORIES.conditional = STORIES.wish;

/* Passive: the doer or the one it happens to? Aktiv puts the spotlight on the doer, Passiv on the thing that happens. */
STORIES.passive = {
  plan(scene) {
    const c = chunks(scene.bubble); if (!c.length) return null;
    const chips = c.map(x => ({ t: x.t, hl: !!x.hl, w: chipW(x.t), role: 'w' }));
    const gap = 9, total = chips.reduce((a, x) => a + x.w, 0) + gap * (chips.length - 1), k = Math.min(1, 470 / total); let cur = 260 - total * k / 2;
    chips.forEach(x => { x.fx = cur + x.w * k / 2; cur += (x.w + gap) * k; });
    const shown = chips.map(x => ({ x: x.fx, y: 40, r: 0, s: k })), hidden = chips.map(x => ({ x: x.fx, y: 20, r: 0, s: k * .8 }));
    return { n: 2, dur: [1900, 2600], chips, frames: [hidden, shown], modes: [{ k: 0, label: 'Aktiv' }, { k: 1, label: 'Passiv' }] };
  },
  draw(K, scene, p) {
    const crowd = [380, 432, 484].map((x, i) => K.person({ x, y: 306 - (i === 1 ? 4 : 0), s: .62, skin: [1, 4, 2][i], hair: ['long', 'short', 'curly'][i], shirt: ['var(--nom)', 'var(--dat)', 'var(--akk)'][i], armL: i === 1 ? 'up' : 'down', face: 'open' })).join('');
    const doer = K.person({ x: 110, y: 310, s: .95, skin: 3, hair: 'curly', shirt: 'var(--ac)', armR: 'out', armL: 'hip', face: 'open', extra: '<path d="M66 -112l30 -14v38l-30 -12z" fill="var(--sun)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/><rect x="58" y="-110" width="10" height="20" rx="3" fill="var(--ink)"/>' });
    return K.room(false)
      + `<path class="gm-beam b-do" d="M110 20L40 300H180Z"/><path class="gm-beam b-it" d="M430 20L340 300H520Z"/>`
      + `<g class="gm-doer">${doer}</g><g class="gm-crowd">${crowd}</g>`
      + `<path class="gm-flow" d="M178 226Q270 176 358 214" fill="none" stroke="var(--ac)" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 11"/><path class="gm-flow2" d="M340 204l22 10-20 12" fill="none" stroke="var(--ac)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
      + badge(110, 128, 'Subjekt', 'ta') + badge(432, 150, 'Objekt', 'ta') + badge(432, 150, 'Subjekt', 'tp') + badge(110, 128, 'optional', 'tp')
      + p.chips.map((c, i) => chipSVG(c, i, p.frames[1][i], 'w')).join('') + labelStrip(scene.label);
  },
  apply(svg, p, i) {
    svg.classList.toggle('gm-passiv', i >= 1);
    svg.querySelectorAll('.gm-chip').forEach((el, k) => { el.style.transform = tr(p.frames[i][k]); el.style.setProperty('--d', (i >= 1 ? 0.3 + k * 0.3 : 0) + 's'); });
    svg.querySelectorAll('.ta').forEach(el => el.classList.toggle('on', i === 0)); svg.querySelectorAll('.tp').forEach(el => el.classList.toggle('on', i >= 1));
  }
};


/* Word order on rails: the sentence is a train. Waggons roll in, the verb waggons drop into their gaps, the station says "Ende". */
const TRAIN_KINDS = ['token-path', 'verb-cluster', 'clause-end', 'clause-zero', 'clause-compare', 'tekamolo'];
const normW = t => String(t).toLowerCase().replace(/[.,!?…:;"„“]/g, ' ').replace(/\s+/g, ' ').trim();
function trainList(scene) {
  const c = chunks(scene.bubble);
  if (Array.isArray(scene.tokens) && scene.tokens.length >= 2 && scene.tokens.length <= 7) {
    const marked = new Set(c.filter(x => x.hl).flatMap(x => normW(x.t).split(' ')));
    return scene.tokens.map(t => ({ t: String(t), hl: !!normW(t) && normW(t).split(' ').every(w => marked.has(w)) }));
  }
  return c.length >= 2 && c.length <= 7 ? c.map(x => ({ t: x.t, hl: !!x.hl })) : null;
}
const TRAIN = {
  cls: 'gm-hidechips',
  plan(scene) {
    const list = trainList(scene); if (!list) return null;
    const chips = list.map(x => ({ t: x.t, hl: x.hl, w: chipW(x.t), role: x.hl ? 'k' : 'o' }));
    const gap = 16, total = chips.reduce((a, x) => a + x.w, 0) + gap * (chips.length - 1), k = Math.min(1, 400 / total); if (k < .55) return null;
    let cur = 232 - total * k / 2; const Y = 244;
    chips.forEach(x => { x.fx = cur + x.w * k / 2; cur += (x.w + gap) * k; });
    const hover = chips.map((x, i) => ({ x: x.fx, y: 96 + (jig(i, 4) - .5) * 14, r: (jig(i, 3) - .5) * 14, s: k * .92 }));
    const frames = [0, 1, 2].map(st => chips.map((x, i) => (st === 2 ? { x: x.fx, y: Y, r: 0, s: k } : x.role === 'o' ? (st === 1 ? { x: x.fx, y: Y, r: 0, s: k } : { x: x.fx - 540, y: Y, r: 0, s: k }) : (st === 1 ? hover[i] : { ...hover[i], y: -50 }))));
    return { n: 3, dur: [900, 2000, 2400], chips, frames, loose: looseRows(chips, k, [48, 96], 11), Y, k, game: true };
  },
  draw(K, scene, p) {
    const wag = (c, i) => chipSVG(c, i, p.frames[2][i], 'r-' + c.role, `<circle class="wh" cx="${-c.w * .27}" cy="22" r="6.5"/><circle class="wh" cx="${c.w * .27}" cy="22" r="6.5"/>` + (i < p.chips.length - 1 ? `<path class="cp" d="M${c.w / 2} 6h16"/>` : ''));
    return K.sky() + `<path d="M0 268H520" stroke="var(--ink)" stroke-width="4" opacity=".55"/><path d="M0 281H520" stroke="var(--wood)" stroke-width="7" stroke-dasharray="6 11" opacity=".75"/>`
      + `<g class="gm-station"><rect x="468" y="212" width="46" height="56" rx="4" fill="var(--card)" stroke="var(--wood)" stroke-width="3"/><path d="M462 214L491 190L520 214Z" fill="var(--die)"/><rect x="484" y="238" width="14" height="30" rx="3" fill="var(--wood)"/><path d="M491 190V162" stroke="var(--ink)" stroke-width="3"/><path class="gm-flag" d="M491 162l22 7-22 7Z" fill="var(--sun)"/></g>`
      + badge(491, 146, 'Ende', 'on t-end')
      + p.chips.map((c, i) => (c.role === 'k' ? `<g class="gm-gap g-${i}"><rect x="${c.fx - c.w * p.k / 2 - 3}" y="${p.Y - 21}" width="${c.w * p.k + 6}" height="42" rx="12"/></g>` : '')).join('')
      + p.chips.map(wag).join('')
      + p.chips.map((c, i) => badge(c.fx, 296, String(i + 1), 't-' + i)).join('')
      + `<g class="gm-hero" transform="translate(452 270)"><g class="gm-hop">${K.person({ x: 0, y: 1, s: .34, skin: 4, hair: 'bun', shirt: 'var(--die)', armR: 'wave', armL: 'hip', face: 'open' })}</g></g>`
      + p.chips.map((c, i) => `<g class="gm-slot" data-i="${i}" role="button" tabindex="-1" aria-label="${i + 1}"><rect x="${c.fx - c.w * p.k / 2 - 4}" y="${p.Y - 22}" width="${c.w * p.k + 8}" height="44" rx="13"/></g>`).join('')
      + labelStrip(scene.label);
  },
  apply(svg, p, i) {
    svg.querySelectorAll('.gm-chip').forEach((el, k) => { el.style.transform = tr(p.frames[i][k]); el.classList.toggle('set', i >= 1); });
    svg.querySelectorAll('.gm-gap').forEach(el => el.classList.toggle('on', i === 1));
    p.chips.forEach((c, k) => svg.querySelectorAll('.t-' + k).forEach(el => el.classList.toggle('on', c.role === 'o' ? i >= 1 : i >= 2)));
    svg.querySelectorAll('.gm-hero').forEach(el => el.classList.toggle('on', i >= 2)); svg.classList.toggle('gm-wow', i >= 2);
  },
  resetGame(svg) { svg.querySelectorAll('.gm-gap,.gm-hero').forEach(el => el.classList.remove('on')); svg.querySelectorAll('[class*="t-"]').forEach(el => { if (el.classList.contains('gm-tag') && !el.classList.contains('t-end')) el.classList.remove('on'); }); svg.classList.remove('gm-wow'); },
  place(svg, p, k) { svg.querySelectorAll('.t-' + k).forEach(el => el.classList.add('on')); },
  finish(svg) { svg.querySelectorAll('.gm-hero').forEach(el => el.classList.add('on')); svg.classList.add('gm-wow'); },
  win: ['Well done! The train is in the right order.', 'Geschafft! Der Zug steht in der richtigen Reihenfolge.']
};
TRAIN_KINDS.forEach(k => { STORIES[k] = TRAIN; });

/* der / die / das: three friendly word-eating monsters. Each word is fed to the monster that wears its article. */
const ART = ['var(--der,#2563eb)', 'var(--die,#e11d48)', 'var(--das,#0f9d6b)'], MONX = [100, 260, 420];
STORIES.gender = {
  cls: 'gm-hidechips',
  plan(scene) {
    const words = scene.words || [['der', 'Apfel'], ['die', 'Banane'], ['das', 'Haus']];
    if (!Array.isArray(words) || words.length !== 3 || words.some(w => !Array.isArray(w) || w.length < 2)) return null;
    const chips = words.map(([a, w]) => ({ t: String(w), w: chipW(w), art: String(a), hl: false, role: 'w' }));
    const loose = looseRows(chips, 1, [46, 92], 9);
    return { n: 4, dur: [1100, 1500, 1500, 1700], chips, frames: range(4).map(st => chips.map((c, i) => (i < st ? { x: MONX[i], y: 190, r: 0, s: .5 } : loose[i]))), game: true };
  },
  draw(K, scene, p) {
    const mon = (c, i) => { const x = MONX[i], col = ART[i]; return `<g class="gm-mon m-${i}"><ellipse cx="${x}" cy="304" rx="62" ry="9" fill="var(--ink)" opacity=".12"/><rect x="${x - 60}" y="178" width="120" height="124" rx="34" fill="${col}"/><ellipse cx="${x}" cy="182" rx="38" ry="12" fill="var(--ink)"/><ellipse cx="${x}" cy="180" rx="38" ry="9" fill="#000" opacity=".35"/><g class="gm-eyes"><circle cx="${x - 20}" cy="214" r="10" fill="#fff"/><circle cx="${x + 20}" cy="214" r="10" fill="#fff"/><circle class="gm-pupil" cx="${x - 18}" cy="216" r="4.5" fill="var(--ink)"/><circle class="gm-pupil" cx="${x + 22}" cy="216" r="4.5" fill="var(--ink)"/></g><text class="art" x="${x}" y="262" text-anchor="middle">${esc(c.art)}</text><text class="bw" x="${x}" y="286" text-anchor="middle">${esc(c.t)}</text></g>`; };
    return K.grad() + p.chips.map(mon).join('')
      + p.chips.map((c, i) => chipSVG(c, i, p.frames[3][i], 'set')).join('')
      + p.chips.map((c, i) => `<g class="gm-slot" data-i="${i}" role="button" tabindex="-1" aria-label="${esc(c.art)}"><rect x="${MONX[i] - 64}" y="170" width="128" height="138" rx="34"/></g>`).join('')
      + (scene.bubble ? `<g class="gm-say on">${K.bubble(260, 40, scene.bubble, { tail: 'c', w: 440 })}</g>` : '') + labelStrip(scene.label);
  },
  apply(svg, p, i) {
    svg.querySelectorAll('.gm-chip').forEach((el, k) => { el.style.transform = tr(p.frames[i][k]); el.classList.toggle('set', k < i); });
    svg.querySelectorAll('.gm-mon').forEach((el, k) => { el.classList.toggle('full', k < i); if (i === k + 1) { el.classList.remove('chomp'); void el.getBoundingClientRect(); el.classList.add('chomp'); } else el.classList.remove('chomp'); });
    svg.querySelectorAll('.gm-say').forEach(el => el.classList.toggle('on', i === 0 || i === p.n - 1));
  },
  resetGame(svg) { svg.querySelectorAll('.gm-mon').forEach(el => el.classList.remove('full', 'chomp')); },
  place(svg, p, k) { const el = svg.querySelectorAll('.gm-mon')[k]; el.classList.add('full'); el.classList.remove('chomp'); void el.getBoundingClientRect(); el.classList.add('chomp'); },
  at: (p, i, k) => ({ x: MONX[k], y: 190, r: 0, s: .5 }),
  win: ['Well done! Every word has its article.', 'Geschafft! Jedes Wort hat seinen Artikel.']
};

/* Time spans: a walk along a road from the beginning to the end; the bracket above is the span the preposition talks about. */
STORIES['time-span'] = {
  plan(scene) {
    const t = scene.tokens; let labels;
    if (Array.isArray(t) && t.length === 3) labels = t.map(String);
    else { const hl = chunks(scene.bubble).filter(x => x.hl); if (!hl.length) return null; labels = ['Beginn', hl.map(x => x.t.replace(/[.,!?…]+$/, '')).join(' · '), 'Ende']; }
    return { n: 4, dur: [900, 1300, 3000, 1800], labels, X0: 86, X1: 434 };
  },
  draw(K, scene, p) {
    const pill = (x, y, t, cls, col) => { const w = chipW(t); return `<g class="gm-pill ${cls}" transform="translate(${x} ${y})"><rect x="${-w / 2}" y="-16" width="${w}" height="32" rx="16" fill="${col}"/><text y="5" text-anchor="middle">${esc(t)}</text></g>`; };
    const flag = (x, col, cls) => `<g class="gm-fl ${cls}"><path d="M${x} 292V226" stroke="var(--ink)" stroke-width="4" stroke-linecap="round"/><path d="M${x} 226l30 10-30 10Z" fill="${col}"/></g>`;
    const mid = (p.X0 + p.X1) / 2, [a, b, c] = p.labels;
    return K.sky() + `<path d="M0 292H520V320H0Z" fill="var(--metal)" opacity=".55"/><path d="M0 306H520" stroke="var(--card)" stroke-width="3" stroke-dasharray="22 18" opacity=".8"/>`
      + flag(p.X0, 'var(--akk)', 'f0') + flag(p.X1, 'var(--die)', 'f1') + pill(p.X0 + 6, 206, a, 'f0', 'var(--akk)') + pill(p.X1 + 6, 206, c, 'f1', 'var(--die)')
      + `<path class="gm-span" d="M${p.X0} 176V162H${p.X1}V176" fill="none" stroke="var(--ac)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>` + pill(mid, 140, b, 'span', 'var(--ac)')
      + `<g class="gm-walker" style="transform:translate(${p.X1}px,296px)"><g class="gm-p">${K.person({ x: 0, y: 1, s: .4, skin: 3, hair: 'curly', shirt: 'var(--nom)', armR: 'wave', armL: 'down', face: 'open' })}</g></g>`
      + (scene.bubble ? `<g class="gm-say">${K.bubble(260, 40, scene.bubble, { tail: 'c', w: 440 })}</g>` : '') + labelStrip(scene.label);
  },
  apply(svg, p, i) {
    const w = svg.querySelector('.gm-walker'), on = (sel, v) => svg.querySelectorAll(sel).forEach(el => el.classList.toggle('on', v));
    w.style.transform = `translate(${i >= 2 ? p.X1 : p.X0}px,296px)`; w.classList.toggle('on', i >= 1);
    on('.f0', i >= 1); on('.gm-span', i >= 2); on('.span', i >= 2); on('.f1', i >= 3); on('.gm-say', i >= 3);
  }
};

/* Certainty: how sure am I? A gauge with the modal verbs from "very sure" (muss) to "possible" (kann / könnte / mag). */
const CERT = [['kann / könnte / mag', /k[öo]nnt|\bkann\b|\bmag\b|\bk[öo]nnen\b/i], ['dürfte', /d[üu]rft/i], ['müsste', /m[üu]sst/i], ['muss', /\bmuss\b|\bm[üu]ssen\b/i]];
const polar = (r, deg) => [260 + r * Math.sin(deg * Math.PI / 180), 232 - r * Math.cos(deg * Math.PI / 180)];
STORIES.certainty = {
  plan(scene) {
    const hl = chunks(scene.bubble).filter(x => x.hl).map(x => x.t).join(' ');
    let z = CERT.findIndex((q, i) => i !== 0 && q[1].test(hl)); if (z < 0 && CERT[0][1].test(hl)) z = 0;
    return { n: 3, dur: [1100, 1700, 2200], zone: z, game: false };
  },
  draw(K, scene, p) {
    const sector = i => { const a0 = -90 + i * 45 + 1.5, a1 = -90 + (i + 1) * 45 - 1.5, [x0, y0] = polar(132, a0), [x1, y1] = polar(132, a1), [x2, y2] = polar(66, a1), [x3, y3] = polar(66, a0); return `<path class="gm-zone-arc z-${i}" d="M${x0} ${y0}A132 132 0 0 1 ${x1} ${y1}L${x2} ${y2}A66 66 0 0 0 ${x3} ${y3}Z" fill="var(--ac)" opacity="${[.28, .5, .72, 1][i]}"/>`; };
    const ws = CERT.map(q => chipW(q[0]) - 8), tot = ws.reduce((a, b) => a + b, 0) + 10 * 3; let x = 260 - tot / 2;
    const pills = CERT.map((q, i) => { const w = ws[i], cx = x + w / 2; x += w + 10; return `<g class="gm-zone z-${i}" data-z="${i}" role="button" tabindex="0" aria-label="${esc(q[0])}"><rect x="${cx - w / 2}" y="246" width="${w}" height="28" rx="14"/><text x="${cx}" y="265" text-anchor="middle">${esc(q[0])}</text></g>`; }).join('');
    const target = p.zone >= 0 ? -67.5 + 45 * p.zone : 0;
    return K.grad() + range(4).map(sector).join('') + `<g transform="translate(260 232)"><g class="gm-needle" style="transform:rotate(${target}deg)"><path d="M-6 0L0-112L6 0Z" fill="var(--ink)"/></g><circle r="10" fill="var(--ink)"/><circle r="4" fill="var(--card)"/></g>`
      + `<text class="gm-end" x="104" y="232" text-anchor="middle">?</text><text class="gm-end" x="416" y="232" text-anchor="middle">!</text>` + pills
      + (scene.bubble ? `<g class="gm-say on">${K.bubble(260, 44, scene.bubble, { tail: 'c', w: 440 })}</g>` : '') + labelStrip(scene.label);
  },
  needle(svg, z) { const n = svg.querySelector('.gm-needle'); n.style.transform = `rotate(${z < 0 ? 0 : -67.5 + 45 * z}deg)`; svg.querySelectorAll('.gm-zone').forEach(el => el.classList.toggle('on', +el.dataset.z === z)); svg.querySelectorAll('.gm-zone-arc').forEach(el => el.classList.toggle('on', +el.dataset.z === z || el.classList.contains('z-' + z))); },
  apply(svg, p, i) { STORIES.certainty.needle(svg, i === 0 ? -9 : i === 1 ? 3.6 : p.zone); if (i === 0) svg.querySelector('.gm-needle').style.transform = 'rotate(-86deg)'; if (i === 1) svg.querySelector('.gm-needle').style.transform = 'rotate(86deg)'; svg.querySelectorAll('.gm-zone').forEach(el => el.classList.toggle('on', i === 2 && +el.dataset.z === p.zone)); },
  tap(svg, p, e) { const z = e.target.closest && e.target.closest('.gm-zone'); if (z) STORIES.certainty.needle(svg, +z.dataset.z); }
};

/* Cause and effect: the highlighted part is what sets something off, the rest is what follows. */
STORIES.cause = {
  cls: 'gm-hidechips',
  plan(scene) {
    const c = chunks(scene.bubble), pairs = [], used = new Set();
    c.forEach((x, i) => { if (!x.hl) return; const e = c[i + 1] && !c[i + 1].hl && !used.has(i + 1) ? i + 1 : c[i - 1] && !c[i - 1].hl && !used.has(i - 1) ? i - 1 : -1; if (e >= 0) { used.add(e); pairs.push([i, e]); } });
    if (!pairs.length || pairs.length > 3) return null;
    const ys = pairs.length === 1 ? [140] : pairs.length === 2 ? [100, 176] : [84, 140, 196], chips = [], rows = [];
    pairs.forEach(([ci, ei], r) => {
      const a = { t: c[ci].t, w: chipW(c[ci].t), hl: true, role: 'cause' }, b = { t: c[ei].t, w: chipW(c[ei].t), hl: false, role: 'effect' };
      const total = a.w + 74 + b.w, k = Math.min(1, 450 / total); let x = 250 - total * k / 2;
      a.fx = x + a.w * k / 2; x += (a.w + 74) * k; b.fx = x + b.w * k / 2; a.k = b.k = k; a.y = b.y = ys[r]; a.bx = (a.fx + a.w * k / 2 + b.fx - b.w * k / 2) / 2;
      chips.push(a, b); rows.push({ a: chips.length - 2, b: chips.length - 1 });
    });
    const frames = [0, 1, 2].map(st => chips.map(x => (x.role === 'cause' ? (st >= 1 ? { x: x.fx, y: x.y, r: 0, s: x.k } : { x: x.fx, y: x.y - 46, r: -6, s: x.k * .8 }) : (st >= 2 ? { x: x.fx, y: x.y, r: 0, s: x.k } : { x: x.fx + 70, y: x.y, r: 4, s: x.k * .8 }))));
    return { n: 3, dur: [900, 1500, 2600], chips, rows, frames };
  },
  draw(K, scene, p) {
    const calm = K.person({ x: 0, y: 1, s: .5, skin: 1, hair: 'long', shirt: 'var(--nom)', face: 'flat', armL: 'down', armR: 'down' }), shock = K.person({ x: 0, y: 1, s: .5, skin: 1, hair: 'long', shirt: 'var(--nom)', face: 'o', armL: 'up', armR: 'up' });
    return K.room() + p.rows.map(r => `<g class="gm-bolt" transform="translate(${p.chips[r.a].bx} ${p.chips[r.a].y})"><path d="M2-17L-9 3H-1L-5 18L10-5H2L7-17Z" fill="var(--sun)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round"/></g>`).join('')
      + `<g transform="translate(452 330)"><g class="gm-calm">${calm}</g><g class="gm-shock">${shock}</g></g>`
      + p.chips.map((c, i) => chipSVG(c, i, p.frames[2][i], 'r-' + c.role)).join('') + labelStrip(scene.label);
  },
  apply(svg, p, i) {
    svg.querySelectorAll('.gm-chip').forEach((el, k) => { el.style.transform = tr(p.frames[i][k]); el.classList.toggle('set', p.chips[k].role === 'cause' ? i >= 1 : i >= 2); });
    svg.classList.toggle('gm-hit', i >= 2); svg.classList.toggle('gm-wow', i >= 2);
  }
};

/* Word parts: little bricks that snap together into one word (prefix, ge / zu, stem). */
STORIES.prefix = {
  cls: 'gm-hidechips',
  plan(scene) {
    const parts = scene.parts; if (!Array.isArray(parts) || parts.length !== 3) return null;
    const chips = parts.map((t, i) => ({ t: String(t), w: Math.max(52, chipW(t) + 10), hl: false, role: 'b' + i }));
    const form = chunks(scene.bubble).filter(x => x.hl).map(x => normW(x.t)).join('|'), plainParts = parts.map(normW);
    const gap1 = form.includes(plainParts[0] + ' ' + plainParts[1]) ? 22 : 3;
    const total = chips.reduce((a, x) => a + x.w, 0) + gap1 + 3, k = Math.min(1.6, 470 / total); let cur = 260 - total * k / 2;
    chips.forEach((x, i) => { x.fx = cur + x.w * k / 2; cur += (x.w + (i === 0 ? gap1 : 3)) * k; });
    const loose = looseRows(chips, k, [50, 98], 13);
    return { n: 4, dur: [1000, 1400, 1400, 2200], chips, k, Y: 232 - 17 * k, loose, frames: range(4).map(st => chips.map((x, i) => (i < st ? { x: x.fx, y: 232 - 17 * k, r: 0, s: k } : loose[i]))), game: true };
  },
  draw(K, scene, p) {
    const stud = c => `<rect class="stud" x="${-c.w / 2 + 9}" y="-23" width="13" height="7" rx="2.5"/><rect class="stud" x="${c.w / 2 - 22}" y="-23" width="13" height="7" rx="2.5"/>`;
    return K.grad() + `<rect x="0" y="236" width="520" height="124" fill="var(--wood)" opacity=".28"/><rect x="0" y="232" width="520" height="8" fill="var(--wood)" opacity=".55"/>`
      + p.chips.map((c, i) => chipSVG(c, i, p.frames[3][i], 'b' + i + ' set', stud(c))).join('')
      + p.chips.map((c, i) => `<g class="gm-slot" data-i="${i}" role="button" tabindex="-1" aria-label="${i + 1}"><rect x="${c.fx - c.w * p.k / 2 - 3}" y="${p.Y - 22 * p.k}" width="${c.w * p.k + 6}" height="${44 * p.k}" rx="11"/></g>`).join('')
      + p.chips.map((c, i) => badge(c.fx, 236 + 28, String(i + 1), 't-' + i)).join('')
      + (scene.bubble ? `<g class="gm-say on">${K.bubble(260, 150, scene.bubble, { tail: 'c', w: 440 })}</g>` : '') + labelStrip(scene.label);
  },
  apply(svg, p, i) {
    svg.querySelectorAll('.gm-chip').forEach((el, k) => { el.style.transform = tr(p.frames[i][k]); el.classList.toggle('set', true); el.classList.toggle('in', k < i); });
    p.chips.forEach((c, k) => svg.querySelectorAll('.t-' + k).forEach(el => el.classList.toggle('on', k < i)));
    svg.querySelectorAll('.gm-say').forEach(el => el.classList.toggle('on', i === p.n - 1));
  },
  resetGame(svg) { svg.querySelectorAll('.gm-chip').forEach(el => el.classList.remove('in')); svg.querySelectorAll('.gm-tag').forEach(el => el.classList.remove('on')); svg.querySelectorAll('.gm-say').forEach(el => el.classList.remove('on')); },
  place(svg, p, k) { svg.querySelectorAll('.t-' + k).forEach(el => el.classList.add('on')); svg.querySelectorAll('.gm-chip')[k].classList.add('in'); },
  finish(svg) { svg.querySelectorAll('.gm-say').forEach(el => el.classList.add('on')); },
  win: ['Well done! The word is complete.', 'Geschafft! Das Wort ist vollständig.']
};

/* ---------- 3. the life layer: every picture gets a little movement ---------- */
function life(K, scene, orig) {
  const K2 = Object.create(K);
  K2.person = o => `<g class="gm-p">${K.person(o)}</g>`;
  K2.bubble = (...a) => `<g class="gm-b">${K.bubble(...a)}</g>`;
  K2.svg = (inner, label) => K.svg(inner, label).replace('<svg ', '<svg class="gm gm-life" data-gm="life" ')
    .replace('<g fill="var(--cloud)">', '<g class="gm-cl" fill="var(--cloud)">').replace('<circle cx="446" cy="66" r="25" fill="var(--sun)"/>', '<circle class="gm-sun" cx="446" cy="66" r="25" fill="var(--sun)"/>');
  return orig(K2, scene);
}

function story(K, scene, st, p) {
  const alt = scene.alt || scene.bubble || scene.label || '';
  const svg = K.svg(st.draw(K, scene, p), alt);
  return svg.replace('<svg ', `<svg class="${['gm', 'gm-' + esc(scene.kind), 'gm-story', st.cls].filter(Boolean).join(' ')}" data-gm="${esc(scene.kind)}" data-steps="${p.n}" data-scene="${esc(JSON.stringify(scene))}" `);
}
let ORIG = null, LAST_K = null;
// the one entry point: markup for a scene (a story when there is one for its kind, the life layer otherwise)
function html(K, scene, opt) {
  opt = opt || {}; LAST_K = K;
  const st = STORIES[scene && scene.kind];
  if (st && !opt.plain) { let p = null; try { p = st.plan(scene); } catch (e) { p = null; } if (p) return story(K, scene, st, p); }
  const orig = opt.orig || ORIG || (root.GRAM_ART && root.GRAM_ART.draw);
  return life(K, scene, orig);
}
const has = kind => !!STORIES[kind];

/* ---------- 4. controller: plays a story, lets people step through it and play with it ---------- */
const CTL = new WeakMap();
function mountOne(svg, opt) {
  opt = opt || {};
  if (CTL.has(svg)) return CTL.get(svg);
  const kind = svg.dataset.gm, st = STORIES[kind]; if (!st || !svg.dataset.scene) return null;
  let scene; try { scene = JSON.parse(svg.dataset.scene); } catch (e) { return null; }
  // graded exercises keep their picture exactly as it was drawn before (only the gentle life layer): the explainers are for learning, not for answering
  if (svg.closest && svg.closest('.gr-it') && LAST_K && ORIG) { const t = document.createElement('div'); t.innerHTML = life(LAST_K, scene, ORIG); if (t.firstElementChild) svg.replaceWith(t.firstElementChild); return null; }
  const p = st.plan(scene); if (!p) return null;
  const host = svg.parentNode, bar = document.createElement('div'); bar.className = 'gm-bar';
  const ctl = { svg, plan: p, i: p.n - 1, timer: 0, game: null, bar };
  const dots = () => { bar.querySelectorAll('.gm-dot').forEach((d, k) => d.classList.toggle('on', k === ctl.i)); bar.querySelectorAll('.gm-mode').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.k === ctl.i))); };
  ctl.set = (i, instant) => {
    ctl.i = Math.max(0, Math.min(p.n - 1, i));
    if (instant) svg.classList.add('gm-instant');
    svg.dataset.step = ctl.i; st.apply(svg, p, ctl.i); dots();
    if (instant) { svg.getBoundingClientRect(); svg.classList.remove('gm-instant'); }
  };
  ctl.stop = () => { clearTimeout(ctl.timer); ctl.timer = 0; bar.classList.remove('playing'); const b = bar.querySelector('.gm-b-play'); if (b) { b.textContent = '▶'; b.setAttribute('aria-label', L('Play', 'Abspielen')); } };
  ctl.play = from => {
    ctl.stop(); leaveGame(); bar.classList.add('playing');
    { const b = bar.querySelector('.gm-b-play'); if (b) { b.textContent = '■'; b.setAttribute('aria-label', L('Stop', 'Anhalten')); } }
    ctl.set(from == null ? 0 : from, true);
    const next = () => { if (ctl.i >= p.n - 1) { ctl.stop(); return; } ctl.timer = setTimeout(() => { ctl.set(ctl.i + 1); next(); }, (p.dur && p.dur[ctl.i + 1]) || 1500); };
    ctl.timer = setTimeout(next, (p.dur && p.dur[0]) || 1000);
  };
  const leaveGame = () => { if (ctl.game) { svg.classList.remove('gm-game', 'gm-done'); ctl.game = null; bar.classList.remove('gaming'); } };
  ctl.startGame = () => {
    ctl.stop(); ctl.game = { sel: -1, placed: new Set(), filled: new Set(), p }; svg.classList.remove('gm-done'); svg.classList.add('gm-game'); bar.classList.add('gaming');
    ctl.set(0, true);
    svg.querySelectorAll('.gm-chip').forEach((el, k) => { el.style.transform = tr((p.loose || p.frames[0])[k]); el.classList.remove('set', 'sel', 'in'); el.setAttribute('tabindex', '0'); });
    svg.querySelectorAll('.gm-slot').forEach(el => { el.classList.remove('done'); el.setAttribute('tabindex', '0'); });
    if (st.resetGame) st.resetGame(svg, p);
  };
  bar.innerHTML = `<button type="button" class="gm-b-prev" aria-label="${L('Previous step', 'Voriger Schritt')}">◀</button><button type="button" class="gm-b-play" aria-label="${L('Play', 'Abspielen')}">▶</button><button type="button" class="gm-b-next" aria-label="${L('Next step', 'Nächster Schritt')}">▶|</button>`
    + (p.modes ? `<span class="gm-modes" role="group">${p.modes.map(m => `<button type="button" class="gm-mode" data-k="${m.k}" aria-pressed="false">${esc(m.label)}</button>`).join('')}</span>`
      : `<span class="gm-dots" aria-hidden="true">${range(p.n).map(() => '<i class="gm-dot"></i>').join('')}</span>`)
    + (p.game ? `<button type="button" class="gm-b-game">${L('Build it yourself', 'Selbst bauen')}</button>` : '')
    + `<span class="gm-hint" role="status" aria-live="polite"></span>`;
  if (opt.bar === false) bar.hidden = true;
  host.appendChild(bar);
  bar.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('gm-b-play')) { if (ctl.timer) ctl.stop(); else ctl.play(0); }
    else if (b.classList.contains('gm-b-prev')) { ctl.stop(); leaveGame(); ctl.set(ctl.i - 1); }
    else if (b.classList.contains('gm-b-next')) { ctl.stop(); leaveGame(); ctl.set(ctl.i + 1); }
    else if (b.classList.contains('gm-b-game')) ctl.startGame();
    else if (b.classList.contains('gm-mode')) { ctl.stop(); leaveGame(); ctl.set(+b.dataset.k); }
  });
  // playing with the picture
  const say = t => { const h = bar.querySelector('.gm-hint'); if (h) h.textContent = t || ''; };
  const act = e => {
    if (!ctl.game) { if (st.tap) { ctl.stop(); st.tap(svg, p, e, ctl); } return; }
    const chip = e.target.closest('.gm-chip'), slot = e.target.closest('.gm-slot'), g = ctl.game;
    if (chip) {
      const k = +chip.dataset.i; if (g.placed.has(k)) return;
      g.sel = g.sel === k ? -1 : k; svg.querySelectorAll('.gm-chip').forEach((el, j) => el.classList.toggle('sel', j === g.sel));
      say(g.sel >= 0 ? L('Now tap the place where it belongs.', 'Tippe jetzt auf den passenden Platz.') : ''); return;
    }
    if (slot) {
      const k = +slot.dataset.i; if (g.filled.has(k)) return;
      if (g.sel < 0) { say(L('Tap a word first.', 'Tippe zuerst ein Wort an.')); return; }
      const picked = g.sel, el = svg.querySelectorAll('.gm-chip')[picked];
      if (picked === k || (st.same && st.same(p, picked, k))) {          // right place (or an equally right one: same case, same kind of place)
        g.placed.add(picked); g.filled.add(k); g.sel = -1; el.style.transform = tr(st.at ? st.at(p, picked, k) : p.frames[p.n - 1][k]); el.classList.remove('sel'); el.classList.add('set'); slot.classList.add('done');
        if (st.place) st.place(svg, p, k, picked);
        say('');
        if (g.placed.size === p.chips.length) { svg.classList.add('gm-done'); if (st.finish) st.finish(svg, p); say(L(st.win[0], st.win[1])); }
      } else { el.classList.remove('shake'); void el.getBoundingClientRect(); el.classList.add('shake'); say(L('Not there. Try another place.', 'Nicht dort. Versuche einen anderen Platz.')); }
    }
  };
  svg.addEventListener('click', act);
  svg.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.gm-chip,.gm-slot')) { e.preventDefault(); act(e); } });
  CTL.set(svg, ctl);
  const reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  ctl.set(p.n - 1, true);                          // the finished picture is what people see first and what stays if nothing moves
  if (!reduced && opt.auto !== false && 'IntersectionObserver' in root) {
    const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); ctl.play(0); } }, { threshold: .55 }); io.observe(svg);
  }
  return ctl;
}
function mount(rootEl, opt) { const out = []; (rootEl || document).querySelectorAll('svg.gm-story').forEach(s => { const c = mountOne(s, opt); if (c) out.push(c); }); return out; }
// the lesson pages insert scene markup as text, so new pictures are found and brought to life as they appear
function watch() {
  if (typeof MutationObserver === 'undefined' || !document.body) return;
  new MutationObserver(ms => { if (ms.some(m => m.addedNodes.length)) mount(document); }).observe(document.body, { childList: true, subtree: true });
  mount(document);
}

/* ---------- 5. styles ---------- */
function css() {
  if (typeof document === 'undefined' || document.getElementById('gm-css')) return;
  const s = document.createElement('style'); s.id = 'gm-css';
  s.textContent = `
.gm-p{transform-box:fill-box;transform-origin:50% 100%;animation:gm-bob 3.4s ease-in-out infinite}.gm-p:nth-of-type(2n){animation-delay:-1.3s}
@keyframes gm-bob{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-2.5px) scaleY(1.014)}}
.gm-b{transform-box:fill-box;transform-origin:50% 100%;animation:gm-pop .75s cubic-bezier(.3,1.5,.5,1) .15s both}
@keyframes gm-pop{from{opacity:0;transform:scale(.6) translateY(10px)}to{opacity:1;transform:none}}
.gm-b tspan[font-weight="800"]{animation:gm-hl 2.6s ease-in-out 1s infinite}
@keyframes gm-hl{0%,100%{opacity:1}50%{opacity:.55}}
.gm-cl{animation:gm-drift 14s ease-in-out infinite alternate}@keyframes gm-drift{to{transform:translateX(26px)}}
.gm-sun{transform-box:fill-box;transform-origin:center;animation:gm-sun 4s ease-in-out infinite}@keyframes gm-sun{50%{transform:scale(1.08)}}
.gm-wave{animation:gm-wave 6s linear infinite}@keyframes gm-wave{to{transform:translateX(60px)}}
.gm-story{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.gm-chip{transition:transform .95s cubic-bezier(.3,1.35,.4,1);cursor:default;outline:none}
.gm-chip rect{fill:var(--card);stroke:var(--line);stroke-width:1.6}.gm-chip rect.hl{fill:var(--ac);stroke:none}
.gm-chip text{font:700 15px Inter,system-ui,sans-serif;fill:var(--ink);pointer-events:none}.gm-chip rect.hl+text{fill:var(--card)}
.gm-instant .gm-chip,.gm-instant .gm-post,.gm-instant .gm-arch,.gm-instant .gm-hero,.gm-instant .gm-tag{transition:none!important}
.gm-tag{opacity:0;transition:opacity .5s}.gm-tag.on{opacity:1}.gm-tag rect{fill:var(--ink);opacity:.82}.gm-tag text{font:700 11px Inter,system-ui,sans-serif;fill:var(--card)}
.gm-post{opacity:.5;transition:opacity .5s}.gm-post.on{opacity:1}.gm-post rect{fill:var(--wood)}.gm-post circle{fill:var(--card);stroke:var(--wood);stroke-width:3}.gm-post text{font:800 13px Inter,system-ui,sans-serif;fill:var(--ink)}
.gm-post.on circle{fill:var(--ac);stroke:var(--ac)}.gm-post.on text{fill:var(--card)}
.gm-arch{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.3s ease-in-out .1s}.gm-arch.on{stroke-dashoffset:0}
.gm-hero{opacity:0;transform-box:fill-box;transition:opacity .4s .9s}.gm-hero.on{opacity:1}.gm-hero.on .gm-hop{transform-box:fill-box;transform-origin:50% 100%;animation:gm-hop 1.1s ease-out 1s both}@keyframes gm-hop{0%{transform:translateY(-24px) scale(.6)}60%{transform:translateY(2px) scale(1.05)}100%{transform:none}}
.gm-slot{opacity:0;pointer-events:none;outline:none}.gm-slot rect{fill:var(--ac-salt,rgba(31,111,235,.1));stroke:var(--ac);stroke-width:2;stroke-dasharray:6 5}
.gm-game .gm-slot{opacity:1;pointer-events:auto;cursor:pointer}.gm-game .gm-slot.done{opacity:0;pointer-events:none}
.gm-game .gm-chip{cursor:pointer}.gm-game .gm-chip.set{cursor:default}.gm-chip.sel rect{stroke:var(--die);stroke-width:3;filter:drop-shadow(0 3px 5px rgba(0,0,0,.25))}
.gm-game .gm-chip:focus-visible rect,.gm-game .gm-slot:focus-visible rect{stroke:var(--die);stroke-width:3}
.gm-chip.shake{animation:gm-shake .4s}@keyframes gm-shake{20%,60%{translate:-5px 0}40%,80%{translate:5px 0}}
.gm-bar[hidden]{display:none}.gm-bar{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;padding:.5rem .6rem;background:var(--card);border-top:1px solid var(--line);font:600 .82rem Inter,system-ui,sans-serif;color:var(--fg)}
.gm-bar button{min-width:38px;min-height:38px;padding:0 .7rem;border-radius:999px;border:1px solid var(--line);background:var(--card);color:inherit;font:700 .8rem Inter,system-ui,sans-serif;cursor:pointer}
.gm-bar button:hover{border-color:var(--ac)}.gm-bar button:focus-visible{outline:3px solid var(--ac);outline-offset:2px}
.gm-b-game{background:var(--ac)!important;border-color:var(--ac)!important;color:#fff!important}.gm-bar.gaming .gm-b-game{display:none}
.gm-dots{display:inline-flex;gap:5px;margin:0 .3rem}.gm-dot{width:8px;height:8px;border-radius:50%;background:var(--line)}.gm-dot.on{background:var(--ac)}
.gm-bar.gaming .gm-dots{display:none}.gm-hint{color:var(--mut);font-weight:600;flex:1 1 10rem;min-width:0}

.gm-arm{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .9s ease-in-out}.gm-arm.on{stroke-dashoffset:0}
.gm-sock text{font:700 12px Inter,system-ui,sans-serif}.gm-sock rect{transition:fill .4s,stroke-dasharray .4s}.gm-sock.full rect{stroke-dasharray:none}
.gm-verb text{font:800 18px Inter,system-ui,sans-serif;fill:var(--card)}
.gm-eyes{transform-box:fill-box;transform-origin:center;animation:gm-blink 4.6s infinite}@keyframes gm-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
.gm-happy .gm-verb{transform-box:fill-box;transform-origin:50% 100%;animation:gm-hop2 .8s ease-out}@keyframes gm-hop2{0%{transform:translateY(0)}35%{transform:translateY(-14px) scale(1.04)}70%{transform:translateY(2px)}100%{transform:none}}
.gm-say{opacity:0;transition:opacity .5s}.gm-say.on{opacity:1}
.gm-chip.set.c-N rect{stroke:var(--nom);fill:var(--nom-s)}.gm-chip.set.c-N text{fill:var(--nom)}
.gm-chip.set.c-A rect{stroke:var(--akk);fill:var(--akk-s)}.gm-chip.set.c-A text{fill:var(--akk)}
.gm-chip.set.c-D rect{stroke:var(--dat);fill:var(--dat-s)}.gm-chip.set.c-D text{fill:var(--dat)}
.gm-chip.set.c-G rect{stroke:var(--ac);fill:var(--ac-salt)}.gm-chip.set.c-G text{fill:var(--ac)}
.gm-ball{transform-origin:0 0}
.gm-trail{opacity:0;transition:opacity .4s}.gm-trail.on{opacity:.8}
.gm-mtag{opacity:0;transition:opacity .4s}.gm-mtag.on{opacity:1}.gm-mtag text{font:800 14px Inter,system-ui,sans-serif;fill:#fff}
.gm-modes{display:inline-flex;gap:.3rem}.gm-mode[aria-pressed="true"]{background:var(--ac-salt)!important;border-color:var(--ac)!important;color:var(--ac)!important}

.gm-chip{transition:transform .95s cubic-bezier(.3,1.35,.4,1) var(--d,0s),opacity .5s var(--d,0s)}
.gm-wish .gm-chip,.gm-past-wish .gm-chip,.gm-conditional .gm-chip,.gm-passive .gm-chip{opacity:0}.gm-dream .gm-chip,.gm-passiv .gm-chip{opacity:1}
.gm-cloud{transform-box:fill-box;transform-origin:20% 90%;opacity:0;transform:scale(.3);transition:opacity .5s,transform .8s cubic-bezier(.3,1.4,.5,1)}.gm-dream .gm-cloud{opacity:1;transform:scale(1)}
.gm-dots3{opacity:.7;transition:opacity .4s}.gm-dots3 circle{fill:var(--card);stroke:var(--line);stroke-width:2}.gm-dream .gm-dots3{opacity:1}
.gm-real,.gm-want{transition:opacity .5s}.gm-want{opacity:0}.gm-dream .gm-want{opacity:1}.gm-dream .gm-real{opacity:0}
.gm-want{transform-box:fill-box;transform-origin:50% 100%}.gm-dream .gm-want{animation:gm-float 3.2s ease-in-out .8s infinite}@keyframes gm-float{50%{transform:translateY(-7px)}}
.gm-spark{opacity:0;transform-box:fill-box;transform-origin:center}.gm-dream .gm-spark{animation:gm-twinkle 1.8s ease-in-out infinite}@keyframes gm-twinkle{0%,100%{opacity:.15;scale:.6}50%{opacity:1;scale:1.15}}
.gm-rewind{opacity:0;transition:opacity .5s .6s}.gm-dream .gm-rewind{opacity:1}.gm-dream .gm-rewind path:last-child{animation:gm-spin 3s linear infinite;transform-box:fill-box;transform-origin:center}@keyframes gm-spin{to{transform:rotate(-360deg)}}
.gm-wow .gm-chip rect.hl{animation:gm-glow 1.4s ease-in-out infinite}@keyframes gm-glow{50%{filter:drop-shadow(0 0 7px var(--ac))}}
.gm-beam{fill:var(--sun);opacity:0;transition:opacity .7s}.gm-beam.b-do{opacity:.32}.gm-passiv .gm-beam.b-do{opacity:0}.gm-passiv .gm-beam.b-it{opacity:.32}
.gm-doer{transition:opacity .7s}.gm-passiv .gm-doer{opacity:.28;filter:grayscale(1)}
.gm-crowd{transform-box:fill-box;transform-origin:50% 100%;transition:transform .7s cubic-bezier(.3,1.4,.5,1)}.gm-passiv .gm-crowd{transform:scale(1.14)}
.gm-flow{animation:gm-march 1.2s linear infinite}@keyframes gm-march{to{stroke-dashoffset:-12}}.gm-flow,.gm-flow2{transition:opacity .5s}.gm-passiv .gm-flow,.gm-passiv .gm-flow2{opacity:.25}

.gm-hidechips .gm-chip{opacity:0}.gm-hidechips .gm-chip.set{opacity:1}.gm-game .gm-chip{opacity:1}
.gm-chip circle.wh{fill:var(--ink)}.gm-chip path.cp{stroke:var(--ink);stroke-width:4;opacity:.6;fill:none}
.gm-gap{opacity:0;transition:opacity .4s}.gm-gap.on{opacity:1}.gm-gap rect{fill:none;stroke:var(--ac);stroke-width:2.5;stroke-dasharray:6 5}
.gm-flag{transform-box:fill-box;transform-origin:0 50%;animation:gm-flagw 1.6s ease-in-out infinite}@keyframes gm-flagw{50%{transform:skewY(-9deg) scaleX(.88)}}
.gm-gender .gm-chip{transition:transform .95s cubic-bezier(.3,1.35,.4,1) var(--d,0s),opacity .3s .7s}.gm-gender .gm-chip.set{opacity:0}.gm-game.gm-gender .gm-chip{opacity:1}.gm-game.gm-gender .gm-chip.set{opacity:0}
.gm-mon .art{font:800 30px Inter,system-ui,sans-serif;fill:#fff}.gm-mon .bw{font:700 15px Inter,system-ui,sans-serif;fill:#fff;opacity:0;transition:opacity .4s .6s}.gm-mon.full .bw{opacity:1}
.gm-mon{transform-box:fill-box;transform-origin:50% 100%}.gm-mon.chomp{animation:gm-chomp .6s .55s}@keyframes gm-chomp{0%,100%{transform:none}35%{transform:scale(1.09,.9)}65%{transform:scale(.96,1.06)}}
.gm-pill{opacity:0;transition:opacity .5s}.gm-pill.on{opacity:1}.gm-pill text{font:700 14px Inter,system-ui,sans-serif;fill:#fff}
.gm-fl{opacity:0;transition:opacity .4s}.gm-fl.on{opacity:1}
.gm-span{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 2.6s linear .2s}.gm-span.on{stroke-dashoffset:0}
.gm-walker{opacity:0;transition:transform 2.8s ease-in-out .2s,opacity .4s}.gm-walker.on{opacity:1}
.gm-needle{transform-origin:0 0;transition:transform 1.1s cubic-bezier(.3,1.5,.5,1)}
.gm-zone{cursor:pointer;outline:none}.gm-zone rect{fill:var(--card);stroke:var(--line);stroke-width:1.6}.gm-zone text{font:700 13px Inter,system-ui,sans-serif;fill:var(--ink);pointer-events:none}.gm-zone.on rect{fill:var(--ac);stroke:var(--ac)}.gm-zone.on text{fill:#fff}.gm-zone:focus-visible rect{stroke:var(--die);stroke-width:3}
.gm-end{font:800 22px Inter,system-ui,sans-serif;fill:var(--mut)}.gm-zone-arc{transition:filter .4s}.gm-zone-arc.on{filter:drop-shadow(0 0 5px var(--ac))}
.gm-bolt{opacity:.22;transition:opacity .3s}.gm-hit .gm-bolt{opacity:1}.gm-hit .gm-bolt path{transform-box:fill-box;transform-origin:center;animation:gm-zap .8s ease-out}@keyframes gm-zap{0%{scale:.3}50%{scale:1.45}100%{scale:1}}
.gm-calm,.gm-shock{transition:opacity .4s}.gm-shock{opacity:0}.gm-hit .gm-shock{opacity:1}.gm-hit .gm-calm{opacity:0}
.gm-chip rect.stud{stroke:none}.gm-chip.b0 rect,.gm-chip.b0 rect.stud{fill:var(--ac)}.gm-chip.b1 rect,.gm-chip.b1 rect.stud{fill:var(--dat)}.gm-chip.b2 rect,.gm-chip.b2 rect.stud{fill:var(--akk)}
.gm-chip.b0 text,.gm-chip.b1 text,.gm-chip.b2 text{fill:#fff}.gm-chip.b0 rect,.gm-chip.b1 rect,.gm-chip.b2 rect{stroke:none}.gm-chip.in rect:not(.stud){filter:drop-shadow(0 2px 0 rgba(0,0,0,.22))}
@media(prefers-reduced-motion:reduce){.gm *,.gm{animation:none!important}.gm-chip,.gm-post,.gm-arch,.gm-hero,.gm-tag{transition:none!important}}`;
  document.head.appendChild(s);
}

const api = { get original() { return ORIG; }, chunks, html, has, mount, mountOne, kinds: () => Object.keys(STORIES), stories: STORIES, plan: (scene) => { const st = STORIES[scene.kind]; return st ? st.plan(scene) : null; } };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof document === 'undefined') return;
root.GRAM_MOTION = api; css();
// wrap the lesson-page drawing function so every scene picture moves
if (root.GRAM_ART && root.GRAM_ART.draw && !root.GRAM_ART.motion) {
  ORIG = root.GRAM_ART.draw; root.GRAM_ART.motion = true;
  root.GRAM_ART.draw = (K, scene) => html(K, scene, { orig: ORIG });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
}
})(typeof window !== 'undefined' ? window : globalThis);
