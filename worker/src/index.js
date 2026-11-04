import {drainVerification,verificationWake,verificationHook} from './email-verification.js';
import { handleWelcome, welcomeHook, drainMail } from "./welcome.js";
import { sendCourseInvitation, previewCourseInvitation, courseInvitationStatus, sendSiteInvitation, requestLiveClass } from "./invitations.js";
import { english } from "./english.js";
import {
  authenticated,
  reserve,
  settle,
  pending,
  personalSeed,
  correction,
} from "./control.js";
// Wörterbuch picture service (Cloudflare Worker, free Workers AI allowance)
// GET /img?w=Wort&pos=Verb&en=peel&def=...&ex=...&seed=123  ->  JPEG
// 1) a text model turns the dictionary meaning into one clear picture description
// 2) FLUX draws it; the result is stored in KV so every word is generated only once

const SCENE_RULES = `You turn a German dictionary entry into the description of ONE picture that makes the meaning instantly clear to a language learner.
Reply with a single English sentence of at most 35 words describing only what is visible: who or what, doing what, where.
Depict exactly this meaning of the word, nothing else.
For verbs: show a person (or animal, if typical) in the middle of the action.
For adjectives: show a person, animal or thing that obviously has this quality.
For nouns: show the thing itself as the main subject; for abstract nouns show one typical everyday situation.
Never mention text, letters, words, signs, labels, books or the German word. Output only the sentence.`;

function cors(origin, allowed) {
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "null",
    "Access-Control-Expose-Headers": "X-Scene, X-Seed",
    Vary: "Origin",
  };
}
function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(Promise.allSettled([drainMail(env),drainVerification(env)]));
  },
  async fetch(req, env, ctx) {
    try {
      return await route(req, env, ctx);
    } catch (error) {
      if(new URL(req.url).pathname.includes('invitation')){
        // Retain code locations only, never bodies, headers or SMTP replies.
        const detail=JSON.stringify({type:error?.name||'Error',reference:error?.name==='ReferenceError'&&/^[\w$]+ is not defined$/.test(error.message)?error.message:undefined,frames:String(error?.stack||'').split('\n').slice(1,3).map(x=>x.trim())});
        try{await env.DB.prepare("INSERT INTO invitation_mail(id,sender,day,state,updated_at,attempts,last_error) VALUES(?1,'diagnostic',?2,'failed',?3,0,?4) ON CONFLICT(id) DO UPDATE SET updated_at=?3,last_error=?4").bind('diagnostic-'+new URL(req.url).pathname.split('/').pop(),new Date().toISOString().slice(0,10),Date.now(),detail).run();}catch{}
      }
      return json({ error: "Service temporarily unavailable" }, 503, {
        "Cache-Control": "no-store",
        ...cors(req.headers.get("Origin"), origins(env)),
      });
    }
  },
};
const origins = (env) =>
  String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
async function route(req, env, ctx) {
  const ALLOWED = origins(env);
  const url = new URL(req.url);
  const origin = req.headers.get("Origin") || "";
  const h = cors(origin, ALLOWED);
  if(url.pathname==="/hooks/email-verification")return verificationHook(req,env,h);
  if(url.pathname==="/email-verification/send"){if(!ALLOWED.includes(origin))return json({error:"Forbidden"},403,h);return verificationWake(req,env,h);}
  if (url.pathname === "/hooks/welcome") return welcomeHook(req, env, h);
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...h,
        "Access-Control-Allow-Methods": "GET, POST",
        "Access-Control-Allow-Headers": "content-type, authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  if (url.pathname === "/correction") {
    if (!ALLOWED.includes(origin)) return json({ error: "Forbidden" }, 403, h);
    return correction(req, url, env, h);
  }
  if (url.pathname === "/english") {
    if (!ALLOWED.includes(origin)) return json({error:'Forbidden'},403,h);
    return english(req,url,env,h);
  }
  if (url.pathname === "/photos") {
    if (req.method !== "GET") return json({ error: "GET only" }, 405, h);
    if (!ALLOWED.includes(origin))
      return json({ error: "only for the Wörterbuch site" }, 403, h);
    return stockPhotos(url, env, h);
  }
  if (url.pathname === "/entries" || url.pathname === "/entry") {
    if (!ALLOWED.includes(origin))
      return json({ error: "only for the Wörterbuch site" }, 403, h);
    return handleEntries(req, url, env, ctx, h);
  }
  if (url.pathname === "/welcome") {
    if (!ALLOWED.includes(origin))
      return json({ error: "only for the Wörterbuch site" }, 403, h);
    return handleWelcome(req, env, h);
  }
  if(url.pathname==="/site-invitation"){
    if(!ALLOWED.includes(origin))return json({error:"Forbidden"},403,h);
    return sendSiteInvitation(req,env,h);
  }
  if (url.pathname === "/course-invitation/preview") {
    if (!ALLOWED.includes(origin)) return json({error:"Forbidden"},403,h);
    return previewCourseInvitation(req,env,h);
  }
  if (url.pathname === "/course-invitation/status") {
    if (!ALLOWED.includes(origin)) return json({error:"Forbidden"},403,h);
    return courseInvitationStatus(req,env,h);
  }
  if (url.pathname === "/course-invitation") {
    if (!ALLOWED.includes(origin)) return json({ error: "only for the Deutschklinik site" }, 403, h);
    return sendCourseInvitation(req, env, h);
  }
  if (url.pathname === "/live-class-request") {
    if (!ALLOWED.includes(origin)) return json({ error: "only for the Deutschklinik site" }, 403, h);
    return requestLiveClass(req, env, h);
  }
  if (url.pathname === "/pic")
    return req.method === "GET"
      ? storedPic(url, env, ctx, h)
      : json({ error: "GET only" }, 405, h);
  if (url.pathname !== "/img")
    return new Response("Dictionary image service", {
      status: url.pathname === "/" ? 200 : 404,
      headers: h,
    });
  if (req.method !== "GET") return json({ error: "GET only" }, 405, h);
  if (!ALLOWED.includes(origin))
    return json({ error: "only for the Wörterbuch site" }, 403, h); // CORS controls browser access; authentication and D1 enforce capacity.

  const q = (k, n) => (url.searchParams.get(k) || "").slice(0, n).trim();
  const w = q("w", 60),
    pos = q("pos", 30),
    en = q("en", 60),
    def = q("def", 320),
    ex = q("ex", 200);
  if (!w) return json({ error: "missing word" }, 400, h);
  // seed=latest -> the picture most recently generated for this word by anyone (seed 1 if none yet)
  const seedParam = url.searchParams.get("seed") || "latest";
  const latestKey = `latest|${w}|${pos}`;
  const isLatest = seedParam === "latest";
  let seed = isLatest
    ? +(await env.IMG.get(latestKey)) || 1
    : Math.abs(parseInt(seedParam, 10)) % 1000000 || 1;
  // Clients cannot write a shared latest pointer, even on cache hits.
  const cacheCtl = isLatest
    ? "public, max-age=120"
    : "public, max-age=31536000, immutable";

  let key = `v2|${w}|${pos}|${seed}`;
  const stored = await env.IMG.getWithMetadata(key, { type: "arrayBuffer" });
  if (stored && stored.value) {
    const sm = await small(env, ctx, key, stored.value);
    return new Response(sm.body, {
      headers: {
        ...h,
        "Content-Type": sm.type,
        "Cache-Control": cacheCtl,
        "X-Seed": String(seed),
        "X-Scene": encodeURIComponent(
          (stored.metadata && stored.metadata.scene) || "",
        ),
      },
    });
  }

  const identity = await authenticated(req, env, h);
  if (identity instanceof Response) return identity;
  // A guest or learner cannot create seed 1, fill an empty published pointer or change latest.
  const current = Number(await env.IMG.get(latestKey)) || 1;
  if (isLatest || seed === 1 || seed === current) {
    seed = await personalSeed(identity.id, w, pos, current);
    key = `v2|${w}|${pos}|${seed}`;
    const cached = await env.IMG.getWithMetadata(key, { type: "arrayBuffer" });
    if (cached?.value) {
      const sm = await small(env, ctx, key, cached.value);
      return new Response(sm.body, {
        headers: {
          ...h,
          "Content-Type": sm.type,
          "Cache-Control": "private, no-store",
          "X-Seed": String(seed),
        },
      });
    }
  }
  const job = await reserve(env, identity.id, "image", key, h);
  if (job instanceof Response) return job;
  let cachedSuccessfully = false;
  try {
    // 1) picture description from the meaning
    let scene = "",
      sceneErr = "";
    const msgs = [
      { role: "system", content: SCENE_RULES },
      {
        role: "user",
        content: `German word: ${w}\nWord type: ${pos || "unknown"}\nEnglish translation: ${en || "unknown"}\nGerman definition: ${def || "—"}\nExample sentence: ${ex || "—"}`,
      },
    ];
    try {
      let out;
      for (const model of [
        "@cf/meta/llama-3.1-8b-instruct-fp8",
        "@cf/mistralai/mistral-small-3.1-24b-instruct",
      ]) {
        try {
          out = await env.AI.run(model, {
            messages: msgs,
            max_tokens: 90,
            temperature: seed === 1 ? 0.3 : 0.9,
          });
          if (out) break;
        } catch (e) {
          sceneErr = String((e && e.message) || e).slice(0, 200);
        }
      }
      const txt =
        (out &&
          (out.response ||
            (out.choices &&
              out.choices[0] &&
              out.choices[0].message &&
              out.choices[0].message.content))) ||
        "";
      scene = String(typeof txt === "string" ? txt : JSON.stringify(txt))
        .replace(/^["'\s]+|["'\s]+$/g, "")
        .split("\n")[0]
        .slice(0, 300);
    } catch (e) {
      sceneErr = String((e && e.message) || e).slice(0, 200);
    }

    if (!scene)
      scene = en
        ? `A clear everyday scene that shows what it means to ${en}, without any writing.`
        : `A clear everyday scene showing this meaning: ${def.slice(0, 120)}`;

    // 2) the picture
    const prompt = `${scene} Friendly flat editorial illustration, soft natural colours, clean shapes, gentle shading, plain light background, one clear subject, no text, no letters, no words.`;
    let bytes;
    try {
      const r = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
        prompt,
        steps: 4,
      });
      const b64 = r && r.image;
      if (!b64) throw new Error("no image returned");
      bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    } catch (e) {
      const msg = String((e && e.message) || e);
      const limited =
        /4006|limit|quota|neuron|capacity|429|exceeded|allocation/i.test(msg);
      return json(
        {
          error: limited
            ? "daily free allowance used up"
            : "Image provider unavailable",
        },
        limited ? 429 : 502,
        h,
      );
    }

    await env.IMG.put(key, bytes, { metadata: { scene } });
    cachedSuccessfully = true;
    const sm = await small(env, ctx, key, bytes);
    return new Response(sm.body, {
      headers: {
        ...h,
        "Content-Type": sm.type,
        "Cache-Control": "private, no-store",
        "X-Seed": String(seed),
        "X-Scene": encodeURIComponent(scene),
      },
    });
  } finally {
    await settle(env, job, cachedSuccessfully);
  }
}

// GET /pic?w=Wort&pos=Substantiv&seed=latest|123 -> a stored picture as a small WebP (never generates, so it is safe
// to serve to any <img> tag). 404 when the word has no picture yet; the site then asks /img to make one.
// Speed: the small WebP copy is looked up first, so the large original is only read once per picture.
// cacheTtl keeps KV values at the Cloudflare location near the reader (default is only 60 s). KV also caches
// "not found" for that long, so the long time is only used when the picture is known to exist ("hot").
async function small(env, ctx, key, bytes, hot) {
  const opt = hot
    ? { type: "arrayBuffer", cacheTtl: 86400 }
    : { type: "arrayBuffer" };
  const sk = "s1|" + key;
  const have = await env.IMG.get(sk, opt);
  if (have) return { body: have, type: "image/webp" };
  bytes = bytes || (await env.IMG.get(key, opt));
  if (!bytes) return null;
  if (!env.IMAGES || env.IMAGE_TRANSFORM_ENABLED !== "true")
    return { body: bytes, type: "image/jpeg" };
  try {
    const out = await env.IMAGES.input(new Blob([bytes]).stream())
      .transform({ width: 640 })
      .output({ format: "image/webp", quality: 78 });
    const buf = await out.response().arrayBuffer();
    if (!buf.byteLength) throw new Error("empty");
    ctx.waitUntil(env.IMG.put(sk, buf));
    return { body: buf, type: "image/webp" };
  } catch (e) {
    return { body: bytes, type: "image/jpeg" };
  } // e.g. monthly free transformations used up
}
async function storedPic(url, env, ctx, h) {
  const w = (url.searchParams.get("w") || "").slice(0, 60).trim(),
    pos = (url.searchParams.get("pos") || "").slice(0, 30).trim();
  if (!w) return new Response("missing word", { status: 400, headers: h });
  const sp = url.searchParams.get("seed") || "latest",
    isLatest = sp === "latest";
  // the "latest" pointer may be up to an hour old at a location; a word without one uses seed 1 (as /img does)
  const ptr = isLatest
    ? +(await env.IMG.get(`latest|${w}|${pos}`, { cacheTtl: 3600 }))
    : 0;
  const seed = isLatest ? ptr || 1 : Math.abs(parseInt(sp, 10)) % 1000000 || 1;
  const key = `v2|${w}|${pos}|${seed}`;
  const s = await small(env, ctx, key, null, !isLatest || !!ptr);
  if (!s)
    return new Response("no picture yet", {
      status: 404,
      headers: { ...h, "Cache-Control": "no-store" },
    });
  return new Response(s.body, {
    headers: {
      ...h,
      "Content-Type": s.type,
      "X-Seed": String(seed),
      "Cache-Control": isLatest
        ? "public, max-age=86400, stale-while-revalidate=2592000"
        : "public, max-age=31536000, immutable",
    },
  });
}

// ===================== AI dictionary entries for words the book does not have =====================
// Examples are never invented: they are real sentences from the Leipzig Corpora Collection
// (German news sites and Wikipedia), chosen by the model only by number and copied verbatim.
const CORPORA = [
  ["deu_news_2012_3M", 30],
  ["deu_wikipedia_2010_1M", 10],
];
const ENTRY_RULES = `You write entries for a German learner's dictionary (level B1). You get a word and numbered real sentences from German newspapers and Wikipedia.
Return ONLY a JSON object, no other text:
{"is_german_word": true|false, "lemma": "base form as in a dictionary (nouns capitalised)", "article": "der|die|das|der/die|", "pos": "Substantiv|Verb|Adjektiv|Adverb|Präposition|Konjunktion|Pronomen|Partikel|Interjektion|Abkürzung",
 "forms": "dictionary notation only: nouns '(-s, -e)' style genitive and plural endings, e.g. Lieferkette -> '(-, -n)', Haus -> '(-es, Häuser)'; verbs '(ging, ist gegangen)'; otherwise empty",
 "english": "1-3 word English translation",
 "senses": [{"definition": "...", "examples": [sentence numbers]}]}
Rules:
- is_german_word is false for typos, random letters, names of single persons, or non-German words not used in German.
- Most words have exactly ONE sense. Add a second or third sense only if it is a clearly different meaning (not a rewording or a narrower case of the first). Most common first.
- Each definition: simple, clear German that a B1 learner understands, 6-22 words, no rare words, never uses the word itself or its family, starts lowercase unless a noun.
- examples: choose 1-2 sentence numbers per sense that clearly show that sense and are easy to understand; use [] if none fits. Never write your own sentences.`;

async function sentencesFor(word) {
  const variants = [
    ...new Set([
      word,
      word.charAt(0).toUpperCase() + word.slice(1),
      word.toLowerCase(),
    ]),
  ];
  const out = [];
  const seen = new Set();
  for (const v of variants) {
    for (const [corpus, limit] of CORPORA) {
      try {
        const r = await fetch(
          `https://api.wortschatz-leipzig.de/ws/sentences/${corpus}/sentences/${encodeURIComponent(v)}?offset=0&limit=${limit}`,
        );
        if (!r.ok) continue;
        const d = await r.json();
        for (const x of d.sentences || []) {
          const t = String(x.sentence || "").trim();
          if (
            t.length < 30 ||
            t.length > 190 ||
            seen.has(t) ||
            /https?:|@|\|/.test(t)
          )
            continue;
          seen.add(t);
          out.push({
            t,
            url: (x.source && x.source.url) || "",
            date: (x.source && x.source.date) || "",
            corpus,
          });
        }
      } catch (e) {}
    }
    if (out.length >= 8) break;
  }
  return out;
}
function srcLabel(u, corpus) {
  try {
    const host = new URL(u).hostname.replace(/^www\.|^feeds\./, "");
    return host;
  } catch (e) {
    return corpus.includes("wikipedia") ? "wikipedia.org" : "Nachrichtenkorpus";
  }
}
async function readIndex(env) {
  const { results } = await env.DB.prepare(
    "SELECT data, queries FROM entry_publications ORDER BY lemma",
  ).all();
  return (results || []).map((r) => {
    const x = JSON.parse(r.data);
    x.q = r.queries ? r.queries.split("|") : x.q || [];
    return x;
  });
}

async function handleEntries(req, url, env, ctx, h) {
  if (req.method !== "GET" && req.method !== "POST")
    return json({ error: "GET or POST only" }, 405, h);
  if (url.pathname === "/entries") {
    if (req.method !== "GET") return json({ error: "GET only" }, 405, h);
    const idx = await readIndex(env);
    return new Response(JSON.stringify(idx), {
      headers: {
        ...h,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60",
      },
    });
  }
  const w = (url.searchParams.get("w") || "").trim().slice(0, 40);
  if (!w || !/^[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß\- ]{1,39}$/.test(w))
    return json({ error: "Bitte ein einzelnes Wort eingeben." }, 400, h);
  const lowered = w.toLowerCase();
  const row = await env.DB.prepare(
    "SELECT data, queries FROM entry_publications WHERE lemma = ?1 OR ('|' || queries || '|') LIKE ?2 LIMIT 1",
  )
    .bind(w, `%|${lowered}|%`)
    .first();
  if (row) {
    const x = JSON.parse(row.data);
    x.q = row.queries.split("|");
    return json({ entry: x }, 200, h);
  }
  if (req.method !== "POST") return json({ error: "not found" }, 404, h);

  const identity = await authenticated(req, env, h);
  if (identity instanceof Response) return identity;
  const draft = await env.DB.prepare(
    "SELECT state FROM entry_drafts WHERE lemma=?1 OR ('|'||queries||'|') LIKE ?2 LIMIT 1",
  )
    .bind(w, `%|${lowered}|%`)
    .first();
  if (draft)
    return draft.state === "rejected"
      ? json({ error: "This suggestion was not accepted." }, 422, h)
      : pending(h);
  const job = await reserve(env, identity.id, "entry", lowered, h);
  if (job instanceof Response) return job;
  let saved = false;
  try {
    const sents = await sentencesFor(w);
    if (sents.length < 2)
      return json(
        {
          error: `Zu „${w}“ wurden keine echten deutschen Belegsätze gefunden – vermutlich ein Tippfehler oder kein gebräuchliches deutsches Wort.`,
          reason: "no-evidence",
        },
        404,
        h,
      );
    const list = sents
      .slice(0, 22)
      .map((x, i) => `${i + 1}. ${x.t}`)
      .join("\n");
    let data = null,
      raw = "",
      lastErr = "";
    for (const model of [
      "@cf/mistralai/mistral-small-3.1-24b-instruct",
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    ]) {
      try {
        const out = await env.AI.run(model, {
          messages: [
            { role: "system", content: ENTRY_RULES },
            { role: "user", content: `Word: ${w}\n\nSentences:\n${list}` },
          ],
          max_tokens: 700,
          temperature: 0.2,
        });
        raw = String(
          (out &&
            (out.response ||
              (out.choices && out.choices[0].message.content))) ||
            "",
        );
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) data = JSON.parse(m[0]);
        if (data) break;
      } catch (e) {
        data = null;
        lastErr = model + ": " + String((e && e.message) || e).slice(0, 200);
      }
    }
    if (!data && /4006|allocation|neurons/i.test(lastErr))
      return json(
        {
          error:
            "Das kostenlose KI-Kontingent für heute ist aufgebraucht. Ab morgen (03:00 Uhr in Uganda, 01:00/02:00 Uhr in Deutschland) können wieder Einträge erstellt werden.",
          reason: "quota",
        },
        429,
        h,
      );
    if (!data || !Array.isArray(data.senses))
      return json(
        {
          error:
            "Der Eintrag konnte gerade nicht erstellt werden. Bitte später noch einmal versuchen.",
        },
        502,
        h,
      );
    if (data.is_german_word === false)
      return json(
        {
          error: `„${w}“ scheint kein gebräuchliches deutsches Wort zu sein.`,
          reason: "not-german",
        },
        404,
        h,
      );

    let lemma =
      String(data.lemma || w)
        .trim()
        .slice(0, 40) || w;
    if (
      !/^Substantiv/i.test(String(data.pos || "")) &&
      /^[A-ZÄÖÜ][a-zäöüß]/.test(lemma) &&
      w[0] === w[0].toLowerCase()
    )
      lemma = lemma[0].toLowerCase() + lemma.slice(1);
    const senses = data.senses
      .slice(0, 3)
      .map((sn) => ({
        d: String(sn.definition || "")
          .trim()
          .slice(0, 240),
        ex: [
          ...new Set(
            (sn.examples || [])
              .map((n) => parseInt(n, 10))
              .filter((n) => n >= 1 && n <= sents.length),
          ),
        ]
          .slice(0, 2)
          .map((n) => ({
            t: sents[n - 1].t,
            src: srcLabel(sents[n - 1].url, sents[n - 1].corpus),
            url: safeSource(sents[n - 1].url),
            y: String(sents[n - 1].date).slice(0, 4),
          })),
      }))
      .filter((sn) => sn.d);
    if (!senses.length)
      return json(
        { error: "Der Eintrag konnte gerade nicht erstellt werden." },
        502,
        h,
      );
    const entry = {
      w: lemma,
      q: [...new Set([lowered, lemma.toLowerCase()])],
      ar: /^(der|die|das|der\/die)$/.test(data.article || "")
        ? data.article
        : "",
      ps: String(data.pos || "").slice(0, 20),
      forms: String(data.forms || "").slice(0, 60),
      en: String(data.english || "").slice(0, 40),
      senses,
      created: new Date().toISOString(),
    };
    // A candidate never changes the shared reference index; the editor publishes a reviewed copy.
    await env.DB.prepare(
      "INSERT INTO entry_drafts(lemma,queries,data,created) VALUES (?1,?2,?3,?4) ON CONFLICT(lemma) DO NOTHING",
    )
      .bind(lemma, entry.q.join("|"), JSON.stringify(entry), entry.created)
      .run();
    saved = true;
    return pending(h);
  } finally {
    await settle(env, job, saved);
  }
}
function safeSource(raw) {
  try {
    const u = new URL(raw);
    return ["http:", "https:"].includes(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}

// ===================== stock photos for verbs, adjectives and abstract words =====================
// Pexels and Pixabay, each only when its (free) key is set up as a secret. Without keys the list is empty
// and the site uses Wikipedia / Wikimedia Commons instead. (Openverse was dropped: slow and rarely on topic.)
async function stockPhotos(url, env, h) {
  const q = (url.searchParams.get("q") || "").trim().slice(0, 60);
  if (!q || (!env.PEXELS_KEY && !env.PIXABAY_KEY)) return json([], 200, h);
  const out = [];
  const jobs = [];
  if (env.PEXELS_KEY)
    jobs.push(
      (async () => {
        try {
          const r = await fetch(
            "https://api.pexels.com/v1/search?per_page=10&orientation=landscape&query=" +
              encodeURIComponent(q),
            { headers: { Authorization: env.PEXELS_KEY } },
          );
          const d = await r.json();
          return (d.photos || []).map((p) => ({
            src: p.src && (p.src.medium || p.src.large),
            url: p.url,
            cap: "Pexels · " + (p.photographer || ""),
            w: p.width,
            h: p.height,
          }));
        } catch (e) {
          return [];
        }
      })(),
    );
  if (env.PIXABAY_KEY)
    jobs.push(
      (async () => {
        try {
          const r = await fetch(
            "https://pixabay.com/api/?safesearch=true&per_page=10&orientation=horizontal&key=" +
              env.PIXABAY_KEY +
              "&q=" +
              encodeURIComponent(q),
          );
          const d = await r.json();
          return (d.hits || []).map((p) => ({
            src: p.webformatURL,
            url: p.pageURL,
            cap: "Pixabay · " + (p.user || ""),
            w: p.webformatWidth,
            h: p.webformatHeight,
          }));
        } catch (e) {
          return [];
        }
      })(),
    );
  for (const list of await Promise.all(jobs)) out.push(...list);
  const good = out.filter(
    (p) => p.src && (!p.w || !p.h || (p.w / p.h >= 0.6 && p.w / p.h <= 2.0)),
  );
  return new Response(JSON.stringify(good.slice(0, 16)), {
    headers: {
      ...h,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
