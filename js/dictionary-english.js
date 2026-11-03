/* Shared source numbering keeps each English gloss and sentence attached to its
   German original. English is plain text, never executable dictionary markup. */
(function () {
  'use strict';
  const plain = html => String(html).replace(/<[^>]*>/g, ' ').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (_, key) => {
    if (key[0] === '#') { const n = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1)); return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ''; }
    return {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '}[key.toLowerCase()];
  }).replace(/\s+/g, ' ').trim();
  function source(word, definition) {
    let h = definition.replace(/^\s*<span class="core"[^>]*>★<\/span>\s*/, '').replace(/^\s*<b>[^<]*<\/b>\s*/, '');
    if (/abgeleitet von/.test(h)) return [];
    const idiom = h.search(/<span class="sq"><\/span>\s*(?:<small>)?\s*(?:<b>)?\s*ID\b/);
    if (idiom >= 0) h = h.slice(0, idiom);
    const k = h.search(/<span class="sn">\d+<\/span>/);
    if (k >= 0) h = h.slice(k);
    else h = h.replace(/^(\s*(\[[^\]]*\]?|[^\s<]*\]|<i class="g">[^<]*<\/i>|<small>[^<]*<\/small>|\((?:[^()]|\([^()]*\))*\)|[;,]))+/, '');
    const senses = (k >= 0 ? h.split(/(?=<span class="sn">\d+<\/span>)/) : [h]);
    const items = [];
    senses.forEach((sense, index) => {
      let mode = 'definition', meaning = '', examples = [];
      sense = sense.replace(/^<span class="sn">\d+<\/span>/, '');
      sense.split(/(<span class="kb">K<\/span>|<span class="ib">i<\/span>|(?:<small>)?\|(?:<\/small>)?|•\s*(?=hierzu|zu\s*[\d(]))/).forEach(t => {
        if (/^<span class="[ki]b">|^•/.test(t)) { mode = 'other'; return; }
        if (/^(<small>)?\|/.test(t)) { mode = 'example'; examples.push(''); return; }
        if (mode === 'definition') meaning += t;
        else if (mode === 'example') examples[examples.length - 1] += t;
      });
      const definition = plain(meaning), ex = examples.map(t => plain(t.replace(/<a class="exsrc"[\s\S]*?<\/a>/g, ''))).filter(Boolean);
      if (definition) items.push({key:'s'+index,kind:'meaning',text:definition,context:ex[0] || ''});
      ex.forEach((text, i) => items.push({key:'e'+index+':'+i,kind:'example',text,context:definition}));
    });
    return items;
  }
  async function fingerprint(word, definition) {
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([word, definition])));
    return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
  }
  const api = {source, fingerprint};
  globalThis.DictionaryEnglish = api;
  if (typeof document === 'undefined') return;

  const jobs = new Map(), batches = new Map();
  let seeds;
  const tr = (en, de) => globalThis.KONTO?.T(en, de) || en;
  const BATCH = 10;
  const preference = () => { try { return localStorage.getItem('gd_english') !== 'off'; } catch { return true; } };
  const stored = key => { try { return JSON.parse(localStorage.getItem('gd_en_'+key) || 'null'); } catch { return null; } };
  function save(key, value) {
    try {
      localStorage.setItem('gd_en_'+key, JSON.stringify(value));
      const keys = Object.keys(localStorage).filter(k => k.startsWith('gd_en_'));
      keys.slice(0, Math.max(0, keys.length - 80)).forEach(k => localStorage.removeItem(k));
    } catch { /* Browser storage may be full or unavailable. */ }
  }
  async function request(entry, hash, batch, generate) {
    const key = 'v2:'+hash+':'+batch, local = stored(key);
    if (batches.has(key)) return batches.get(key);
    if (local?.version === 1 && Array.isArray(local.items)) { batches.set(key, local); return local; }
    if (!seeds) seeds = fetch('content/dictionary-english.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
    const seed = (await seeds)[hash];
    if (seed) { const result = {version:1,reviewed:true,items:seed.slice(batch*BATCH,(batch+1)*BATCH)}; batches.set(key, result); save(key, result); return result; }
    const jobKey = key+':'+generate;
    if (jobs.has(jobKey)) return jobs.get(jobKey);
    const job = (async () => {
      const url = APP_CONFIG.workerUrl+'/english?source='+hash+'&batch='+batch;
      const options = generate ? {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:entry.i,word:entry.w,definition:entry.df})} : {};
      const response = await fetch(url, {...options, signal:AbortSignal.timeout(30000)});
      if (!response.ok) { const error = new Error('English unavailable'); error.status = response.status; throw error; }
      const result = await response.json();
      if (result.version !== 1 || !Array.isArray(result.items)) throw Error('Invalid translation');
      batches.set(key, result); save(key, result); return result;
    })().finally(() => jobs.delete(jobKey));
    jobs.set(jobKey, job); return job;
  }
  api.mount = async function (entry) {
    const root = document.querySelector('.entry');
    if (!root || entry.ps === 'Info') return;
    const items = source(entry.w, entry.df);
    if (!items.length) return;
    const toolbar = document.createElement('div'); toolbar.className = 'english-toolbar'; toolbar.lang = document.documentElement.lang;
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'english-toggle';
    toggle.textContent = tr('English translations', 'Englische Übersetzungen'); toggle.setAttribute('aria-pressed', String(preference()));
    const exampleToggle = document.createElement('button'); exampleToggle.type = 'button'; exampleToggle.className = 'english-toggle english-examples-toggle'; exampleToggle.setAttribute('aria-pressed','false');
    exampleToggle.textContent = tr('Example translations', 'Beispiele übersetzen');
    const note = document.createElement('span'); note.className = 'english-status'; note.setAttribute('role','status');
    toolbar.append(toggle, exampleToggle, note); root.querySelector('.def').before(toolbar);
    const targets = new Map();
    root.querySelectorAll('.def .ds').forEach(sense => {
      const index = Number(sense.dataset.sense);
      const heading = items.find(x => x.key === 's'+index);
      if (heading) { const line = document.createElement('p'); line.className = 'english-gloss'; line.lang = 'en'; line.hidden = true; sense.querySelector('.dd').before(line); targets.set(heading.key, line); }
      sense.querySelectorAll('.dx>li').forEach((example, i) => {
        const key = 'e'+index+':'+i;
        if (!items.some(x => x.key === key)) return;
        const text = document.createElement('p'); text.className = 'english-example'; text.lang = 'en'; text.hidden = true;
        example.append(text); targets.set(key,text);
      });
    });
    let hash, enabled = preference(), showExamples = false, observer;
    exampleToggle.hidden = !items.some(x => x.kind === 'example');
    const apply = result => {
      for (const item of result.items) {
        const target = targets.get(item.key);
        if (!target || typeof item.en !== 'string' || !item.en.trim()) continue;
        target.textContent = item.en; target.dataset.ready = 'true';
        if (target.classList.contains('english-gloss')) target.hidden = !enabled;
        else target.hidden = !enabled || !showExamples;
      }
      note.textContent = result.reviewed ? '' : tr('Machine translated', 'Maschinell übersetzt');
    };
    async function load(batch, generate, target) {
      if (!hash || !root.isConnected) return;
      if (!note.textContent) note.textContent = tr('Loading English …', 'Englisch wird geladen …');
      try { apply(await request(entry, hash, batch, generate && !APP_CONFIG.readOnly)); }
      catch (error) {
        if (!root.isConnected) return;
        if (!generate && error.status === 404 && !APP_CONFIG.readOnly) return load(batch, true, target);
        note.textContent = error.status === 429 ? tr('Daily translation limit reached', 'Tageslimit für Übersetzungen erreicht') : tr('English temporarily unavailable', 'Englisch gerade nicht verfügbar');
        if (target) { target.textContent = tr('Translation unavailable. Please try again later.', 'Übersetzung nicht verfügbar. Bitte später erneut versuchen.'); target.dataset.ready = ''; }
        const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'english-retry'; retry.textContent = tr('Retry', 'Erneut versuchen');
        retry.onclick = () => { retry.remove(); if (target) target.textContent=''; load(batch, true, target); }; note.append(' ', retry);
      }
    }
    toggle.onclick = () => {
      enabled = !enabled; toggle.setAttribute('aria-pressed', String(enabled)); root.classList.toggle('english-off', !enabled);
      try { localStorage.setItem('gd_english', enabled ? 'on' : 'off'); } catch {}
      root.querySelectorAll('.english-gloss').forEach(line => line.hidden = !enabled || !line.dataset.ready);
      root.querySelectorAll('.english-example').forEach(line => line.hidden = !enabled || !showExamples || !line.dataset.ready);
      if (enabled) load(0, false);
      observe();
    };
    exampleToggle.onclick = () => {
      showExamples = !showExamples; exampleToggle.setAttribute('aria-pressed', String(showExamples));
      root.querySelectorAll('.english-example').forEach(line => line.hidden = !enabled || !showExamples || !line.dataset.ready);
      observe();
    };
    root.classList.toggle('english-off', !enabled);
    hash = await fingerprint(entry.w,entry.df);
    if (!root.isConnected) return;
    // Fetch the first visible group only. Further groups load when a meaning or
    // example comes into view, so long entries do not generate everything at once.
    const seen = new Set();
    function observe() {
      if (!hash || !enabled) return;
      if (typeof IntersectionObserver === 'undefined') return load(0, false);
      observer?.disconnect();
      observer = new IntersectionObserver(changes => changes.forEach(change => {
        if (!root.isConnected) { observer.disconnect(); return; }
        if (!enabled || !change.isIntersecting) return;
        const batch = Number(change.target.dataset.englishBatch);
        if (!seen.has(batch)) { seen.add(batch); load(batch, false); }
      }), {rootMargin:'80px'});
      for (const [key, target] of targets) if (key[0] === 's' || showExamples) {
        const batch = Math.floor(items.findIndex(x=>x.key===key)/BATCH);
        const parent = key[0] === 's' ? target.closest('.ds') : target.parentElement;
        parent.dataset.englishBatch = batch; observer.observe(parent);
      }
    }
    observe();
    if (enabled) { seen.add(0); load(0, false); }
  };
})();
