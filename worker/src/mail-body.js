import { connect } from "cloudflare:sockets";
export { textBody, htmlBody };
function textBody(SITE) {
  return `Hello and welcome to Deutschklinik!

We're glad you're here. Explore German vocabulary, grammar and practice activities at your own pace.

What to do next:
- Choose an available level, or ask your teacher to unlock it
- Look up any of over 32,000 words, with meanings, examples and pronunciation
- Collect words in lists and practise them as flashcards
- Play games – alone or live with your whole class

Start here: ${SITE}

Enjoy learning!
Your Deutschklinik team`;
}

function htmlBody(SITE) {
  const li = (emoji, b, t) =>
    `<tr><td style="padding:6px 10px 6px 0;font-size:20px;vertical-align:top">${emoji}</td><td style="padding:6px 0;font-size:15px;line-height:1.45;color:#20242b"><b>${b}</b> ${t}</td></tr>`;
  return `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;padding:28px 26px;border:1px solid #e7e3da">
<tr><td style="font-size:24px;font-weight:700;color:#20242b;padding-bottom:6px">Deutsch<span style="color:#1f6feb">klinik</span></td></tr>
<tr><td style="font-size:20px;font-weight:700;color:#20242b;padding:10px 0 6px">Welcome! 👋</td></tr>
<tr><td style="font-size:15px;line-height:1.5;color:#4a5260;padding-bottom:14px">We're glad you're here. Explore German vocabulary, grammar and practice activities at your own pace.</td></tr>
<tr><td style="font-size:13px;font-weight:700;letter-spacing:.06em;color:#6b7482;text-transform:uppercase;padding:4px 0">What to do next</td></tr>
<tr><td><table role="presentation" cellpadding="0" cellspacing="0">
${li("🎓", "Choose your level", "– or ask your teacher to unlock it")}
${li("🔎", "Over 32,000 words", "with meanings, examples and pronunciation")}
${li("🗂️", "Lists and flashcards", "– collect words and practise them")}
${li("🎮", "Games", "– alone or live with your whole class")}
</table></td></tr>
<tr><td style="padding:22px 0 8px"><a href="${SITE}" style="display:inline-block;background:#1f6feb;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 22px;border-radius:999px">Start learning</a></td></tr>
<tr><td style="font-size:14px;color:#6b7482;padding-top:10px">Enjoy learning!<br>Your Deutschklinik team</td></tr>
</table></td></tr></table></body></html>`;
}

// ---------- minimal SMTP client (implicit TLS) ----------
const b64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const encWord = (s) =>
  /^[\x20-\x7e]*$/.test(s) ? s : "=?UTF-8?B?" + b64(s) + "?=";
function wrap76(s) {
  return s.replace(/.{1,76}/g, (m) => m + "\r\n");
}

export async function smtpSend(
  user,
  pass,
  to,
  subject,
  text,
  html,
  messageId,
  open = connect,
) {
  if (![to, user].every((x) => /^[^\s@<>]+@[^\s@<>]+$/.test(x)))
    throw new Error("bad address");
  const sock = open(
    { hostname: "smtp.gmail.com", port: 465 },
    { secureTransport: "on" },
  );
  const timeout = setTimeout(() => {
    sock.close().catch(() => {});
  }, 20000);
  const w = sock.writable.getWriter(),
    rd = sock.readable.getReader(),
    dec = new TextDecoder();
  let buf = "";
  async function reply() {
    // one full (possibly multi-line) reply
    for (;;) {
      const lines = buf.split("\r\n");
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3} /.test(lines[i])) {
          const out = lines.slice(0, i + 1);
          buf = lines.slice(i + 1).join("\r\n");
          return { code: +lines[i].slice(0, 3), text: out.join("\n") };
        }
      }
      const { value, done } = await rd.read();
      if (done) throw new Error("connection closed: " + buf.slice(0, 120));
      buf += dec.decode(value, { stream: true });
    }
  }
  const send = (s) => w.write(new TextEncoder().encode(s + "\r\n"));
  async function step(cmd, ok) {
    if (cmd != null) await send(cmd);
    const r = await reply();
    if (!ok.includes(r.code))
      throw new Error(
        "SMTP " +
          (cmd == null
            ? "greeting"
            : /^(EHLO|AUTH|MAIL|RCPT|DATA)\b/.test(cmd)
              ? cmd.slice(0, 4)
              : "login/message") +
          ": " +
          r.text.slice(0, 160),
      );
    return r;
  }
  try {
    await step(null, [220]);
    await step("EHLO woerterbuch", [250]);
    await step("AUTH LOGIN", [334]);
    await step(b64(user), [334]);
    await step(b64(pass), [235]);
    await step(`MAIL FROM:<${user}>`, [250]);
    await step(`RCPT TO:<${to}>`, [250, 251]);
    await step("DATA", [354]);
    const bnd = "b" + crypto.randomUUID().replace(/-/g, "");
    const msg = [
      `From: ${encWord("Deutschklinik")} <${user}>`,
      `To: <${to}>`,
      `Subject: ${encWord(subject)}`,
      `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
      `Message-ID: <${messageId}@welcome.invalid>`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${bnd}"`,
      "",
      `--${bnd}`,
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      wrap76(b64(text)),
      `--${bnd}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      wrap76(b64(html)),
      `--${bnd}--`,
      ".",
    ].join("\r\n");
    await step(msg, [250]);
    await send("QUIT").catch(() => {});
  } finally {
    clearTimeout(timeout);
    try {
      await w.close();
    } catch (e) {}
    try {
      await sock.close();
    } catch (e) {}
  }
}
