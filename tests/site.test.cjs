const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { JSDOM, ResourceLoader, VirtualConsole } = require("jsdom");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file));
const core = zlib.gunzipSync(read("core.bin")),
  defs = zlib.gunzipSync(read("defs.bin"));
async function until(check) {
  for (let i = 0; i < 100; i++) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 15));
  }
  throw new Error("page did not reach the expected state");
}
async function site(hash = "", options = {}) {
  const calls = [],
    errors = [];
  class Resources extends ResourceLoader {
    fetch(url) {
      calls.push(new URL(url).pathname);
      return Promise.resolve(
        new URL(url).hostname === "site.test"
          ? (options.catalog && new URL(url).pathname === "/grammatik/catalog.js"
            ? Buffer.from(options.catalog)
            : read(decodeURIComponent(new URL(url).pathname.slice(1))))
          : Buffer.from(""),
      );
    }
  }
  const dom = new JSDOM(read("index.html"), {
    url: "https://site.test/" + hash,
    runScripts: "dangerously",
    resources: new Resources(),
    virtualConsole: new VirtualConsole().on("jsdomError", (e) => {
      if (!e.message.includes("HTMLCanvasElement")) errors.push(e.message);
    }),
    beforeParse(w) {
      w.requestAnimationFrame = (callback) =>
        w.setTimeout(() => callback(Date.now()), 16);
      w.cancelAnimationFrame = w.clearTimeout;
      w.scrollTo = () => {};
      w.matchMedia = () => ({ matches: false });
      w.TextDecoder = TextDecoder;
      w.TextEncoder = TextEncoder;
      w.crypto.randomUUID = require("node:crypto").randomUUID;
      Object.defineProperty(w.crypto, 'subtle', {value:require('node:crypto').webcrypto.subtle});
      w.AbortSignal.timeout = AbortSignal.timeout;
      w.structuredClone = structuredClone;
      w.fetch = async (url, request = {}) => {
        const u = new URL(url, w.location.href);
        calls.push(u.pathname);
        if(options.request){const result=await options.request(u,request);if(result)return result;}
        if (u.hostname === "site.test") {
          if (u.pathname === '/content/dictionary-english.json') return new Response(read('content/dictionary-english.json'));
          if (u.pathname.endsWith("core.bin")) return new Response(core);
          if (u.pathname.endsWith("defs.bin"))
            return options.definitions?.() || new Response(defs);
        }
        if (u.pathname === '/english') return options.english?.(u, request) || new Response('{}', {status:404});
        if (u.pathname === "/entries") return new Response("[]");
        if (u.pathname === "/entry")
          return (
            options.entry?.(request) || new Response("{}", { status: 404 })
          );
        if (u.pathname.includes("site_settings"))
          return new Response(
            JSON.stringify([{ features: options.features || {}, welcome: {} }]),
          );
        if (u.pathname.includes("profiles"))
          return (
            options.profile?.() ||
            new Response(
              JSON.stringify([
                {
                  user_id: "fixture",
                  role: "learner",
                  unlocked: ["B1"],
                  level: "B1",
                },
              ]),
            )
          );
        if (u.pathname.includes("grammar_results"))
          return options.results?.(u) || new Response("[]");
        if (u.pathname.includes("user_data")) return new Response("[]");
        if (u.pathname.includes("/functions/v1/lessons")) return new Response("Unavailable", { status: 503 });
        return new Response("[]");
      };
      if (options.features)
        w.localStorage.setItem(
          "gd_site",
          JSON.stringify({ features: options.features }),
        );
      if (options.account)
        w.localStorage.setItem(
          "gd_session",
          JSON.stringify({
            expires_at: Date.now() / 1000 + 3600,
            access_token: "offline",
            user: { id: "fixture", email: "fixture@example.invalid" },
          }),
        );
    },
  });
  await new Promise((resolve) =>
    dom.window.addEventListener("load", resolve, { once: true }),
  );
  await until(() => dom.window.KONTO);
  return {
    window: dom.window,
    document: dom.window.document,
    calls,
    errors,
    close: async () => {
      await new Promise((r) => setTimeout(r, 30));
      dom.window.close();
    },
  };
}
test("welcome skips dictionary and grammar and a slow search preserves the typed word", async () => {
  const s = await site();
  try {
    await until(() => s.document.querySelector(".kd-look"));
    assert.ok(!s.calls.some((p) => /\.bin$|grammatik\//.test(p)));
    s.window.KONTO.lookup("Haus");
    await until(() => s.document.querySelector("#q")?.value === "Haus");
    assert.ok(s.document.querySelector("#sug li"));
    assert.ok(s.calls.includes("/core.bin"));
    assert.ok(!s.calls.includes("/defs.bin"));
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
test('editorial word illustrations use a safe absolute asset URL',async()=>{
 const s=await site('#/start');try{const list=await s.window.eval("findImgs({w:'erwerben',ps:'v'})");assert.equal(list[0].src,'https://site.test/assets/words/erwerben.svg');assert.equal(s.window.safeLink(list[0].src),list[0].src);}finally{await s.close()}
});
test('home suggestions open a word directly without a search-page detour',async()=>{
 const s=await site('#/start');try{
 await until(()=>s.document.querySelector('#home-word'));
 const input=s.document.querySelector('#home-word');input.value='erwerben';input.dispatchEvent(new s.window.Event('input'));
 await until(()=>s.document.querySelector('#home-suggestions a'));
 assert.equal(s.window.location.hash,'#/start');assert.equal(input.getAttribute('aria-expanded'),'true');
 assert.ok(!s.calls.includes('/defs.bin'));
 input.dispatchEvent(new s.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
 await until(()=>s.window.location.hash.includes('/w/erwerben'));
 assert.deepEqual(s.errors,[]);
 }finally{await s.close()}
});
test("the homepage live-class link opens the class catalogue without loading the dictionary", async () => {
  const s = await site("#/start");
  try {
    await until(() => s.document.querySelector('.kd-home-link'));
    s.document.querySelector('.kd-home-link').click();
    await until(() => s.document.querySelector('h1')?.textContent === 'Live instructor-led German classes');
    assert.ok(s.calls.includes('/rest/v1/rpc/live_class_catalog'));
    assert.ok(!s.calls.some((p) => /\.bin$|grammatik\//.test(p)));
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
test('English meanings follow their senses, examples stay folded and the German-only choice persists', async () => {
  const s = await site('#/w/lernen');
  try {
    await until(()=>s.document.querySelector('.english-gloss')?.textContent);
    const meanings = [...s.document.querySelectorAll('.english-gloss')];
    assert.equal(meanings[0].textContent,'to learn');
    assert.ok([...s.document.querySelectorAll('.dictionary-extra summary')].every(summary=>!summary.closest('i')));
    assert.ok(Object.keys(s.window.localStorage).some(key=>key.startsWith('gd_en_')));
    assert.ok(meanings.some(line=>line.textContent==='to learn; to study'));
    const examples = [...s.document.querySelectorAll('.english-example')];
    assert.ok(examples.every(line=>line.hidden));
    s.document.querySelector('.english-examples-toggle').click();
    assert.equal(examples[0].hidden,false);
    assert.equal(examples[0].textContent,'I've been learning German at the adult education centre for two years.');
    assert.ok(examples[0].parentElement.textContent.includes('Ich lerne seit zwei Jahren Deutsch'));
    s.document.querySelector('.english-toggle').click();
    assert.ok([...meanings,...examples].every(line=>line.hidden));
    assert.equal(s.window.localStorage.getItem('gd_english'),'off');
    s.window.route();
    await until(()=>s.document.querySelector('.english-toggle'));
    assert.equal(s.document.querySelector('.english-toggle').getAttribute('aria-pressed'),'false');
    assert.deepEqual(s.errors,[]);
  } finally {await s.close();}
});
test('generated translations render as text and a failed request can be retried', async () => {
  let failing=true;
  const s=await site('#/w/Garten',{english:(_url,request)=> {
    if (!request.method) return new Response('{}',{status:404});
    return failing ? new Response('{}',{status:503}) : Response.json({version:1,reviewed:false,items:[{key:'s0',en:'garden; park <img src=x onerror=bad()>'},{key:'e0:0',en:'The children are playing in the garden.'}]});
  }});
  try {
    await until(()=>s.document.querySelector('.english-retry'));
    failing=false; s.document.querySelector('.english-retry').click();
    await until(()=>s.document.querySelector('.english-gloss')?.textContent.includes('garden; park'));
    assert.equal(s.document.querySelector('.english-gloss img'),null);
    assert.match(s.document.querySelector('.english-status').textContent,/Machine translated/);
    assert.deepEqual(s.errors,[]);
  } finally {await s.close();}
});
test("the sign-in dialog has labels, traps focus and restores focus on Escape", async () => {
  const s = await site("#/start");
  try {
    const opener = s.document.querySelector("#acct");
    opener.focus();
    opener.click();
    const sheet = s.document.querySelector("#sheet");
    assert.equal(sheet.getAttribute("role"), "dialog");
    assert.ok(s.document.querySelector('label[for="ac_em"]'));
    assert.ok(s.document.querySelector('label[for="ac_pw"]'));
    const buttons = sheet.querySelectorAll("button");
    buttons[buttons.length - 1].focus();
    s.document.dispatchEvent(
      new s.window.KeyboardEvent("keydown", {
        key: "Tab",
        bubbles: true,
        cancelable: true,
      }),
    );
    assert.equal(s.document.activeElement, sheet.querySelector("button"));
    s.document.dispatchEvent(
      new s.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    assert.equal(
      s.document.querySelector("#modal").getAttribute("aria-hidden"),
      "true",
    );
    assert.equal(s.document.activeElement, opener);
    assert.equal(s.document.documentElement.lang, "en");
  } finally {
    await s.close();
  }
});
test("signup blocks malformed addresses and typos before making an Auth request", async () => {
  const s = await site("#/start");
  try {
    s.window.ACCT.sheet("up");
    const input = s.document.querySelector("#ac_em");
    s.document.querySelector("#ac_pw").value = "fixture-password";
    input.value = "eddymulindwa03@hmail.com";
    await s.window.ACCT.submit("up");
    assert.ok(!s.calls.includes("/auth/v1/signup"));
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.match(s.document.querySelector("#ac_email_feedback").textContent, /eddymulindwa03@gmail.com/);
    assert.equal(input.checkValidity(), false);
    s.document.querySelector("#ac_email_feedback button").click();
    assert.equal(input.value, "eddymulindwa03@gmail.com");
    assert.equal(input.checkValidity(), true);
    input.value = "person@company";
    await s.window.ACCT.submit("up");
    assert.ok(!s.calls.includes("/auth/v1/signup"));
    assert.match(input.validationMessage, /complete email address/);
    input.value = "student@deutschklinik.com";
    input.dispatchEvent(new s.window.Event("blur"));
    assert.equal(input.checkValidity(), true);
    input.value = "intentional@hmail.com";
    input.dispatchEvent(new s.window.Event("blur"));
    s.document.querySelectorAll("#ac_email_feedback button")[1].click();
    assert.equal(input.checkValidity(), true);
    await s.window.ACCT.submit("up");
    assert.ok(s.calls.includes("/auth/v1/signup"));
  } finally {
    await s.close();
  }
});
test("failed definitions settle, show retry and recover on the next click", async () => {
  let n = 0;
  const s = await site("#/w/Haus", {
    definitions: () =>
      new Response(++n === 1 ? "" : defs, { status: n === 1 ? 503 : 200 }),
  });
  try {
    await until(() => s.document.querySelector("#view .empty button"));
    s.document.querySelector("#view .empty button").click();
    await until(() => s.document.querySelector(".entry"));
    assert.equal(n, 2);
    assert.ok(s.document.querySelector(".def").textContent.includes("Haus"));
    assert.equal(
      s.document.querySelector(".entry h1").textContent.replace(/·/g, ""),
      "Haus",
    );
    assert.match(s.document.title, /Haus/);
    assert.equal(s.document.querySelectorAll(".def > ol > li.ds").length, 3);
    assert.ok(s.document.querySelector(".more-senses summary"));
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
test("course overview, contents and progress need no full chapter or dictionary", async () => {
  const s = await site("#/v", { account: true, features: { vocab: "everyone" }, profile: () => new Response('[{"user_id":"fixture","role":"learner","unlocked":["A1"],"level":"A1"}]') });
  try {
    await until(() => s.document.querySelector("#grlist .gr-row[data-n]"));
    s.document.querySelector(".gr-exp").click();
    assert.ok(s.document.querySelector(".gr-cl a"));
    assert.ok(!s.calls.some((p) => /k\d+\.js$|\.bin$/.test(p)));
    s.window.location.hash = "#/v/fortschritt";
    await until(() => s.document.querySelector(".gr-ptab"));
    assert.ok(!s.calls.some((p) => /k\d+\.js$|\.bin$/.test(p)));
    s.window.location.hash = "#/v/201";
    await until(() => s.document.querySelector("#view .empty"));
    assert.ok(s.calls.includes("/functions/v1/lessons"));
    assert.deepEqual(s.calls.filter((p) => /k\d+\.js$/.test(p)), []);
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
test("a missing catalogue entry leaves that chapter coming soon without breaking the overview", async () => {
  const catalog = read("grammatik/catalog.js").toString().replace(/^  "201":.*\n/m, "");
  const s = await site("#/v", { catalog, account: true, features: { vocab: "everyone" }, profile: () => new Response('[{"user_id":"fixture","role":"learner","unlocked":["A1"],"level":"A1"}]') });
  try {
    await until(() => s.document.querySelector('.gr-row[data-n="202"]'));
    assert.equal(s.document.querySelector('.gr-row[data-n="201"]'), null);
    assert.ok(s.document.querySelector('.gr-row[data-n="202"]'));
    assert.ok(s.document.querySelector('#grlist .gr-card.soon[title="Kommt bald"]'));
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
test("result history follows stable cursors even when the API caps each response", async () => {
  const rows = Array.from({ length: 5010 }, (_, i) => ({
    id: i + 1,
    chapter: 1,
    exercise: "u1",
    score: 1,
    total: 1,
  }));
  const s = await site("#/settings", {
    account: true,
    results: (url) => {
      const after = Number(url.searchParams.get("id").slice(3));
      return new Response(
        JSON.stringify(rows.filter((row) => row.id > after).slice(0, 100)),
      );
    },
  });
  try {
    const all = await s.window.ACCT.resultRows("&user_id=eq.fixture");
    assert.equal(all.length, 5010);
    assert.equal(all[5009].id, 5010);
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
test("an AI suggestion awaiting review stays off the public dictionary", async () => {
  const s = await site("#/", {
    account: true,
    entry: (request) => {
      assert.match(request.headers.Authorization, /^Bearer /);
      return new Response('{"pending":true}', { status: 202 });
    },
  });
  try {
    await until(() => s.document.querySelector("#q"));
    await s.window.createAI("Testvorschlag");
    assert.match(
      s.document.querySelector("#view").textContent,
      /Submitted for review/,
    );
    assert.equal(s.document.querySelector(".entry"), null);
  } finally {
    await s.close();
  }
});
test("failed profiles close enrolled content and retry restores only enrolled levels", async () => {
  let broken = true;
  const s = await site("#/v", {
    account: true,
    profile: () =>
      broken
        ? new Response('{"message":"offline"}', { status: 503 })
        : new Response(
            '[{"user_id":"fixture","role":"learner","unlocked":["B1"],"level":"B1"}]',
          ),
  });
  try {
    await until(() => s.document.querySelector(".kd-gate button"));
    assert.equal(s.window.KONTO.can("vocab"), false);
    assert.equal(s.window.KONTO.canOpen("A1"), false);
    broken = false;
    await s.window.KONTO.reload();
    await until(() => s.document.querySelector("#grlist"));
    assert.equal(s.window.KONTO.canOpen("B1"), true);
    assert.equal(s.window.KONTO.canOpen("A1"), false);
    assert.deepEqual(s.errors, []);
  } finally {
    await s.close();
  }
});
test("a late account language updates the games page without navigation", async () => {
  let release;
  const profile = new Promise(resolve => release = resolve);
  const s = await site("#/play", { account: true, profile: () => profile });
  try {
    await until(() => s.document.querySelector(".play-heading h1"));
    assert.equal(s.document.querySelector(".play-heading h1").textContent, "Ready, set, play.");
    release(new Response('[{"user_id":"fixture","role":"learner","level":"A1","unlocked":["A1"],"ui_lang":"de"}]'));
    await until(() => s.document.querySelector(".play-heading h1")?.textContent.includes("Auf die Plätze."));
    assert.ok(s.document.querySelector('a[href="#/play/solo"]').textContent.includes("Schnelles Quiz"));
    assert.deepEqual(s.errors, []);
  } finally { await s.close(); }
});
test('visitor navigation stays at three destinations on dictionary and games routes', async()=>{
  const s=await site('#/start');
  const visible=()=>[...s.document.querySelectorAll('#tabs a')].filter(a=>!a.hidden).map(a=>a.dataset.t);
  try {
    await until(()=>s.document.querySelector('.kd-home'));
    assert.deepEqual(visible(),['start','home','play']);
    s.window.location.hash='#/';
    await until(()=>s.document.querySelector('.topic-gallery'));
    assert.deepEqual(visible(),['start','home','play']);
    assert.equal(s.document.querySelector('#dictionary-topics').open,false);
    s.window.location.hash='#/play';
    await until(()=>s.document.querySelector('.play-shelf'));
    assert.deepEqual(visible(),['start','home','play']);
    assert.equal(s.document.querySelectorAll('.play-tile').length,3);
    assert.equal(s.document.querySelector('.play-more').open,false);
    assert.deepEqual(s.errors,[]);
  } finally {await s.close();}
});
test('dictionary collections render a small first page and filter without losing their words',async()=>{
  const s=await site('#/cat/essen');
  try {
    await until(()=>s.document.querySelector('#cat-words .wrow'));
    assert.equal(s.document.querySelectorAll('#cat-words .wrow').length,60);
    const word=s.document.querySelector('#cat-words .hw').textContent;
    s.document.querySelector('#cat-more').click();
    assert.equal(s.document.querySelectorAll('#cat-words .wrow').length,120);
    const input=s.document.querySelector('#cat-filter'); input.value=word; input.dispatchEvent(new s.window.Event('input',{bubbles:true}));
    assert.ok(s.document.querySelector('#cat-words').textContent.includes(word));
    assert.ok(s.document.querySelectorAll('#cat-words .wrow').length<60);
    assert.deepEqual(s.errors,[]);
  } finally {await s.close();}
});
test('word-map taps and Enter only preview; the explicit link opens an entry and English stays with the preview',async()=>{
  const s=await site('#/w/lernen',{english:(_url,request)=>!request.method?new Response('{}',{status:404}):Response.json({version:1,reviewed:false,items:[{key:'s0',en:'a related meaning'}]})});
  try {
    await until(()=>s.document.querySelector('.word-space g.node'));
    const node=s.document.querySelector('.word-space g.node');
    s.document.dispatchEvent(new s.window.Event('touchstart',{bubbles:true}));
    const click=()=>node.dispatchEvent(new s.window.MouseEvent('click',{bubbles:true}));
    click();click();
    assert.equal(s.window.location.hash,'#/w/lernen');
    assert.equal(s.document.querySelectorAll('.wmpop').length,1);
    assert.equal(node.getAttribute('aria-expanded'),'true');
    node.focus();
    node.dispatchEvent(new s.window.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));
    assert.equal(s.window.location.hash,'#/w/lernen');
    await until(()=>s.document.querySelector('.wmpop .wm-en')?.textContent);
    assert.equal(s.document.querySelector('.wmpop .wm-en').lang,'en');
    const link=s.document.querySelector('.wmpop .wmgo'),href=link.getAttribute('href');
    link.click();await until(()=>s.window.location.hash===href);
    assert.deepEqual(s.errors,[]);
  } finally {await s.close();}
});
test('the first mobile pointer tap opens a word preview and compatibility mouse events do not hide it',async()=>{
 const s=await site('#/w/lernen');try{
  await until(()=>s.document.querySelector('.word-space g.node'));const node=s.document.querySelector('.word-space g.node');
  const event=(type,pointerType)=>{const e=new s.window.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerType,clientX:80,clientY:90});return e;};
  node.dispatchEvent(event('pointerdown','touch'));node.dispatchEvent(event('pointerup','touch'));
  assert.equal(node.getAttribute('aria-expanded'),'true');assert.ok(s.document.querySelector('.wmpop.on'));
  node.dispatchEvent(event('pointerout','mouse'));
  await new Promise(r=>setTimeout(r,260));
  assert.ok(s.document.querySelector('.wmpop.on'));assert.equal(s.window.location.hash,'#/w/lernen');
  assert.deepEqual(s.errors,[]);
 }finally{await s.close();}
});

test('unchanged school refresh keeps the hero, logo and favicon mounted',async()=>{
 const org={id:'00000000-0000-4000-ab00-000000000081',owner:'fixture',name:'Das Berliner Language Centre',theme:'#ac8935',kind:'school',logo_url:'https://site.test/icon-64.png',pass_mark:70};let loads=0;
 const s=await site('#/start/'+org.id,{account:true,profile:()=>Response.json([{user_id:'fixture',role:'school',unlocked:[],org_id:org.id}]),request:async u=>{
 if(u.pathname==='/rest/v1/orgs')return Response.json([org]);if(u.pathname==='/rest/v1/rpc/my_org')return Response.json(org);if(u.pathname==='/rest/v1/classes'){loads++;return Response.json([])}
 }});try{await until(()=>s.document.querySelector('.kd-hero'));
 const hero=s.document.querySelector('.kd-hero'),logo=s.document.querySelector('#orgbrand img'),favicon=s.document.querySelector('link[rel=icon]'),before=loads;
 s.window.KONTO.refresh();assert.equal(s.document.querySelector('.kd-hero'),hero);await until(()=>loads>before);await new Promise(r=>setTimeout(r,100));assert.equal(s.document.querySelector('.kd-hero'),hero);
 await s.window.KONTO.reload();await new Promise(r=>setTimeout(r,100));assert.equal(s.document.querySelector('#orgbrand img'),logo);assert.equal(s.document.querySelector('link[rel=icon]'),favicon);assert.equal(s.document.querySelector('.kd-hero'),hero);assert.deepEqual(s.errors,[]);
 }finally{await s.close()}
});
for(const kind of ['teacher','school'])test(`a ${kind} gets its own favicon and can send an addressed invitation`,async()=>{
 const org={id:'00000000-0000-4000-ab00-000000000081',owner:'fixture',name:'Gold classroom',theme:'#ac8935',kind,pass_mark:70},course={id:'00000000-0000-4000-ab00-000000000082',name:'German A1',level:'A1',term_name:'Spring',starts_on:'2027-02-01',ends_on:'2027-02-28',schedule:'Mon 18:00 EAT'};let sends=0;
 const s=await site('#/klasse',{account:true,profile:()=>Response.json([{user_id:'fixture',role:kind,unlocked:[],org_id:null}]),request:async(u,r)=>{
 if(u.pathname==='/rest/v1/orgs')return Response.json([org]);if(u.pathname==='/rest/v1/classes')return Response.json([course]);
 if(u.pathname==='/rest/v1/invites'&&r.method==='POST')return Response.json([{code:'abcdef123456'}]);
 if(u.pathname==='/course-invitation'){sends++;return Response.json({sent:true})}
 if(u.pathname==='/course-invitation/status')return Response.json({invitations:[{code:'abcdef123456',state:'sent'}]});
 }});try{await until(()=>s.document.querySelector('.ks-cls'));
 assert.equal(s.document.querySelectorAll('link[rel=icon]').length,1);assert.ok(decodeURIComponent(s.document.querySelector('link[rel=icon]').href).includes('#ac8935'));
 s.window.KONTO.sendClassInvite(course.id);s.document.querySelector('#ci_email').value='learner@example.invalid';await s.window.KONTO.sendClassInviteNow(course.id);assert.equal(sends,1);
 await until(()=>s.document.querySelector('#mail_status_'+course.id));await s.window.KONTO.checkInvitationMail(course.id);assert.match(s.document.querySelector('#mail_status_'+course.id).textContent,/Accepted by mail provider/);
 assert.deepEqual(s.errors,[]);
 }finally{await s.close()}
});
test('a teacher can preview and retry an addressed term email without creating more invitations',async()=>{
 const org={id:'00000000-0000-4000-ab00-000000000081',owner:'fixture',name:'Teacher studio',kind:'teacher',pass_mark:70},course={id:'00000000-0000-4000-ab00-000000000082',name:'Evening German',level:'A1',term_name:'Spring',starts_on:'2027-02-01',ends_on:'2027-02-28',schedule:'Mon 18:00 EAT'};let inserts=0,sends=0,body;
 const s=await site('#/klasse',{account:true,profile:()=>Response.json([{user_id:'fixture',role:'teacher',unlocked:[],org_id:null}]),request:async(u,r)=>{
  if(u.pathname==='/rest/v1/orgs')return Response.json([org]);
  if(u.pathname==='/rest/v1/classes')return Response.json([course]);
  if(u.pathname==='/rest/v1/invites'&&r.method==='POST'){inserts++;body=JSON.parse(r.body);return Response.json([{code:'abcdef123456'}]);}
  if(u.pathname==='/course-invitation/preview')return Response.json({html:'<h1>Spring invitation</h1>'});
  if(u.pathname==='/course-invitation'){sends++;return sends===1?Response.json({error:'Please retry this saved invitation.'},{status:502}):Response.json({sent:true});}
 }});
 try{
  await until(()=>s.document.querySelector('.ks-cls'));
  s.window.KONTO.sendClassInvite(course.id);
  assert.ok(s.document.querySelector('.invite-summary').textContent.includes('Spring'));
  s.document.querySelector('#ci_name').value='Learner';s.document.querySelector('#ci_email').value='learner@example.invalid';
  await s.window.KONTO.previewInvite(course.id);assert.ok(s.document.querySelector('#ci_preview').srcdoc.includes('Spring invitation'));assert.equal(sends,0);
  await s.window.KONTO.sendClassInviteNow(course.id);assert.ok(s.document.querySelector('#ci_status').textContent.includes('retry'));assert.equal(s.document.querySelector('#ci_send').disabled,false);
  await s.window.KONTO.sendClassInviteNow(course.id);assert.equal(inserts,1);assert.equal(sends,2);assert.equal(body.recipient_email,'learner@example.invalid');assert.equal(body.class_id,course.id);
  assert.deepEqual(s.errors,[]);
 }finally{await s.close();}
});
test('a late class load cannot erase the current dashboard invitation choices',async()=>{
 const org={id:'00000000-0000-4000-ab00-000000000091',owner:'fixture',name:'Teacher studio',kind:'teacher',pass_mark:70},course={id:'00000000-0000-4000-ab00-000000000092',name:'Evening class',level:'A1',term_name:'Spring',starts_on:'2027-02-01',ends_on:'2027-02-28',schedule:'Mon 18:00 EAT'};let release,loads=0;
 const held=new Promise(r=>release=r);
 const s=await site('#/klasse',{account:true,profile:()=>Response.json([{user_id:'fixture',role:'teacher',unlocked:[],org_id:null}]),request:async(u)=>{
  if(u.pathname==='/rest/v1/orgs')return Response.json([org]);
  if(u.pathname==='/rest/v1/classes'){loads++;if(loads===1)return held;return Response.json([course]);}
 }});
 try{
  await until(()=>loads>=1);s.window.location.hash='#/start/'+org.id;
  await until(()=>s.document.querySelector('[onclick="KONTO.inviteLearner()"]'));
  release(Response.json([]));await new Promise(r=>setTimeout(r,30));
  await s.window.KONTO.inviteLearner();assert.ok(s.document.querySelector('#ci_class').textContent.includes('Evening class'));
  assert.deepEqual(s.errors,[]);
 }finally{release(Response.json([]));await s.close();}
});
test('an ended session opens sign-in and restores the invitation draft after the same user signs in',async()=>{
 const org={id:'00000000-0000-4000-ab00-0000000000a1',owner:'fixture',name:'Teacher studio',kind:'teacher',pass_mark:70},course={id:'00000000-0000-4000-ab00-0000000000a2',name:'German',level:'A1',term_name:'Spring',starts_on:'2027-02-01',ends_on:'2027-02-28',schedule:'Mon 18:00 EAT'};
 const s=await site('#/klasse',{account:true,profile:()=>Response.json([{user_id:'fixture',role:'teacher',unlocked:[],org_id:null}]),request:async(u)=>{
  if(u.pathname==='/rest/v1/orgs')return Response.json([org]);if(u.pathname==='/rest/v1/classes')return Response.json([course]);
  if(u.pathname==='/course-invitation/preview')return Response.json({error:'session_not_found'},{status:401});
 }});
 try{
  await until(()=>s.document.querySelector('.ks-cls'));s.window.KONTO.sendClassInvite(course.id);
  s.document.querySelector('#ci_name').value='A learner';s.document.querySelector('#ci_email').value='learner@example.invalid';
  await s.window.KONTO.previewInvite(course.id);
  assert.equal(s.document.querySelector('#ac_em').value,'fixture@example.invalid');assert.ok(s.document.querySelector('#ac_msg').textContent.includes('session has ended'));
  s.window.dispatchEvent(new s.window.CustomEvent('acct:in',{detail:{fresh:false}}));
  await until(()=>s.document.querySelector('#ci_email'));
  assert.equal(s.document.querySelector('#ci_email').value,'learner@example.invalid');assert.equal(s.document.querySelector('#ci_name').value,'A learner');
  assert.deepEqual(s.errors,[]);
 }finally{await s.close();}
});
