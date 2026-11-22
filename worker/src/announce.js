// Branded announcement emails: new features, sneak peeks and calls to test. Sent only by the founder through the
// composer (js/course-mail.js → POST /messages/send with `design`), one recipient at a time like every message.
// A design is data: add an entry to DESIGNS for the next announcement and it appears in the composer's picker.
// The founder's own text (the composer's message field) becomes the opening paragraphs; everything else comes from
// the design. Artwork lives in assets/mail/ (made with tools/mail/kit.html, see tools/mail/README.md).
//
// Brand (keep in step with the site): paper #f6f4ef, ink #20242b, muted #6b7482, line #e7e2d7, blue #1f6feb,
// light blue #e9f1ff, the round cat logo with the wordmark Deutsch + klinik (assets/mail/brand-lockup.png).
const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const C = { paper: '#f6f4ef', ink: '#20242b', mut: '#6b7482', line: '#e7e2d7', blue: '#1f6feb', salt: '#e9f1ff', sun: '#fdf3d8' };

export const DESIGNS = {
  pilots: {
    label: 'Call to test · animated grammar pilots',
    subject: 'Sneak peek: two animated German lessons – please test them',
    body: 'We have built something new, and you are among the very first to see it: two grammar lessons that play like a short animated film. The characters act out the grammar, a board explains each rule while you listen, and then you practise straight away.\n\nThey are not finished yet – and that is exactly why we are writing to you. Your feedback will decide how every future lesson is made.',
    preheader: 'Two animated grammar lessons are ready for you. Watch, play, and tell us what to improve.',
    eyebrow: 'Neu · Please test',
    hero: { src: 'assets/mail/pilots-hero.png', w: 1024, h: 624, alt: 'Two scenes from the new animated lessons: Liv in the workshop and Max with his dog' },
    itemsTitle: 'Try both lessons',
    items: [
      { img: 'assets/mail/pilots-k18.png', w: 1024, h: 576, label: 'A1 · Kapitel 18', title: 'Modalverben – Die Klammer-Werkstatt', text: 'Liv wants to cook, Max must get up early: können, müssen, wollen and friends, and where the second verb goes.', href: '#/g/5', cta: 'Open Kapitel 18' },
      { img: 'assets/mail/pilots-k13.png', w: 1024, h: 576, label: 'A1 · Kapitel 13', title: 'Der Akkusativ – Wer jagt wen?', text: 'Does the dog chase the ball, or the ball the dog? Learn to see who does what – with den, einen and keinen.', href: '#/g/17', cta: 'Open Kapitel 13' },
    ],
    tip: { title: 'DE | EN – two versions of each lesson', text: 'Watch the explanations in German, or in English with German examples. Switch with DE | EN under the film, try both, and tell us which one helps you more.' },
    questions: {
      title: 'What we would love to hear',
      intro: 'Tap ★ Feedback under the film. The form follows the lesson, part by part – answer what you like, or just write freely.',
      list: [
        ['Understanding', 'Where did you get lost? Which sentence or rule should be explained more simply, more slowly, or with another example?'],
        ['Pictures & animation', 'What should we draw or animate to make a sentence clearer? Wild, creative ideas are very welcome.'],
        ['Practice', 'How could the exercises be more fun and engaging – games, challenges, rewards, anything?'],
        ['Bugs', 'Anything broken, slow, cut off or odd? Tell us which part and which device.'],
        ['Anything else', 'What did you like? What would make you come back every day?'],
      ],
    },
    cta: { label: '★  Watch & give feedback', href: '#/g/5' },
    closing: 'Constructive criticism is exactly what we need – please be honest and detailed. Without you, we cannot build an awesome product.\n\nDanke schön!',
  },
  news: {
    label: 'New feature · short announcement',
    subject: 'Neu bei Deutschklinik',
    body: 'Write what is new and why it helps.',
    preheader: 'Something new at Deutschklinik.',
    eyebrow: 'Neu bei Deutschklinik',
    cta: { label: 'Open Deutschklinik', href: '#/start' },
  },
};

export const designList = () => Object.entries(DESIGNS).map(([id, d]) => ({ id, label: d.label, subject: d.subject, body: d.body }));

const button = (href, label, primary = true) => `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:999px;background:${primary ? C.blue : '#ffffff'};${primary ? '' : `border:1.5px solid ${C.blue};`}"><a href="${esc(href)}" style="display:inline-block;padding:${primary ? '15px 26px' : '11px 18px'};font:bold ${primary ? 15 : 14}px/1 Arial,Helvetica,sans-serif;color:${primary ? '#ffffff' : C.blue};text-decoration:none;border-radius:999px">${esc(label)}</a></td></tr></table>`;
const paras = (text, style) => String(text || '').split(/\n{2,}/).map((p) => `<p style="${style}">${esc(p).replace(/\n/g, '<br>')}</p>`).join('');

export function announceContent({ design, subject, body, name, site = 'https://deutschklinik.com/' }) {
  const d = DESIGNS[design]; if (!d) return null;
  const at = (p) => new URL(p, site).href, greeting = name ? `Hallo ${name},` : 'Hallo,';
  const P = `margin:0 0 16px;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.ink}`;
  const items = (d.items || []).map((it) => `<tr><td style="padding:0 0 22px"><a href="${esc(at(it.href))}" style="text-decoration:none"><img src="${esc(at(it.img))}" width="464" alt="${esc(it.title)}" style="display:block;width:100%;max-width:464px;height:auto;border:0;border-radius:16px"></a>
<p style="margin:14px 0 4px;font:bold 11px/1 Arial,Helvetica,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:${C.blue}">${esc(it.label)}</p>
<p style="margin:0 0 6px;font:bold 20px/1.3 Georgia,'Times New Roman',serif;color:${C.ink}">${esc(it.title)}</p>
<p style="margin:0 0 14px;font:14px/1.6 Arial,Helvetica,sans-serif;color:${C.mut}">${esc(it.text)}</p>${button(at(it.href), it.cta + '  →', false)}</td></tr>`).join('');
  const qs = d.questions ? `<tr><td style="padding:6px 0 8px"><p style="margin:0 0 6px;font:bold 22px/1.3 Georgia,'Times New Roman',serif;color:${C.ink}">${esc(d.questions.title)}</p><p style="margin:0 0 14px;font:14px/1.6 Arial,Helvetica,sans-serif;color:${C.mut}">${esc(d.questions.intro)}</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${d.questions.list.map(([h, t], i) => `<tr><td width="38" valign="top" style="padding:0 0 14px"><div style="width:28px;height:28px;border-radius:50%;background:${C.salt};color:${C.blue};font:bold 14px/28px Arial,Helvetica,sans-serif;text-align:center">${i + 1}</div></td><td valign="top" style="padding:3px 0 14px;font:14px/1.6 Arial,Helvetica,sans-serif;color:${C.ink}"><b>${esc(h)}</b><br><span style="color:${C.mut}">${esc(t)}</span></td></tr>`).join('')}</table></td></tr>` : '';
  const tip = d.tip ? `<tr><td style="padding:0 0 24px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="background:${C.salt};border-radius:16px;padding:16px 18px;font:14px/1.6 Arial,Helvetica,sans-serif;color:${C.ink}"><b>${esc(d.tip.title)}</b><br>${esc(d.tip.text)}</td></tr></table></td></tr>` : '';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.paper};-webkit-text-size-adjust:100%"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.paper}">${esc(d.preheader || '')}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${C.paper}"><tr><td align="center" style="padding:24px 12px 8px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px">
<tr><td style="padding:0 4px 18px"><a href="${esc(at('#/start'))}"><img src="${esc(at('assets/mail/brand-lockup.png'))}" width="196" height="43" alt="Deutschklinik" style="display:block;border:0;height:auto"></a></td></tr>
<tr><td style="background:#ffffff;border:1px solid ${C.line};border-radius:24px;padding:28px 28px 8px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
${d.hero ? `<tr><td style="padding:0 0 24px"><img src="${esc(at(d.hero.src))}" width="464" alt="${esc(d.hero.alt)}" style="display:block;width:100%;max-width:464px;height:auto;border:0"></td></tr>` : ''}
<tr><td style="padding:0 0 12px"><span style="display:inline-block;background:${C.salt};color:${C.blue};font:bold 11px/1 Arial,Helvetica,sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:7px 12px;border-radius:999px">${esc(d.eyebrow)}</span></td></tr>
<tr><td><h1 style="margin:0 0 18px;font:normal 30px/1.2 Georgia,'Times New Roman',serif;letter-spacing:-.5px;color:${C.ink}">${esc(subject)}</h1>
<p style="margin:0 0 14px;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.mut}">${esc(greeting)}</p>${paras(body, P)}</td></tr>
${d.items ? `<tr><td style="padding:12px 0 18px"><div style="height:1px;background:${C.line}"></div><p style="margin:22px 0 0;font:bold 22px/1.3 Georgia,'Times New Roman',serif;color:${C.ink}">${esc(d.itemsTitle || '')}</p></td></tr>${items}` : ''}
${tip}${qs}
${d.cta ? `<tr><td align="center" style="padding:10px 0 22px">${button(at(d.cta.href), d.cta.label)}</td></tr>` : ''}
${d.closing ? `<tr><td style="padding:0 0 8px">${paras(d.closing, P)}<p style="margin:0 0 22px;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.ink}">Your Deutschklinik team</p></td></tr>` : `<tr><td style="padding:0 0 22px;font:15px/1.7 Arial,Helvetica,sans-serif;color:${C.ink}">Your Deutschklinik team</td></tr>`}
</table></td></tr>
<tr><td style="padding:20px 8px 28px;font:12px/1.8 Arial,Helvetica,sans-serif;color:${C.mut}">You are receiving this because you have a Deutschklinik account. Just reply to this email to answer us.<br><a href="mailto:support@deutschklinik.com" style="color:${C.mut}">support@deutschklinik.com</a> · <a href="${esc(at(''))}" style="color:${C.mut}">deutschklinik.com</a></td></tr>
</table></td></tr></table></body></html>`;
  const text = [greeting, '', subject, '', body, ...(d.items || []).flatMap((it) => ['', `${it.label}: ${it.title}`, it.text, at(it.href)]),
    ...(d.tip ? ['', d.tip.title, d.tip.text] : []), ...(d.questions ? ['', d.questions.title, d.questions.intro, ...d.questions.list.map(([h, t], i) => `${i + 1}. ${h}: ${t}`)] : []),
    ...(d.cta ? ['', `${d.cta.label.replace(/^★\s*/, '')}: ${at(d.cta.href)}`] : []), ...(d.closing ? ['', d.closing] : []), '', 'Your Deutschklinik team', 'support@deutschklinik.com'].join('\n');
  return { subject, text, html };
}
