import { connect } from "cloudflare:sockets";
// SMTP transport is shared by role-specific welcome mail and term invitations.

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
  smtpHost = "smtppro.zoho.com",
  smtpPort = 465,
  open = connect,
  replyTo = "",
  options = {},
) {
  if (
    ![to, user, options.from || user].every((x) => /^[^\s@<>]+@[^\s@<>]+$/.test(x)) ||
    (replyTo && !/^[^\s@<>]+@[^\s@<>]+$/.test(replyTo)) ||
    !/^[a-z0-9.-]+$/i.test(smtpHost) ||
    !Number.isInteger(smtpPort) ||
    smtpPort < 1 ||
    smtpPort > 65535
  )
    throw new Error("bad address");
  const sock = open(
    { hostname: smtpHost, port: smtpPort },
    { secureTransport: "on" },
  );
  const timeout = setTimeout(() => {
    sock.close().catch(() => {});
  }, 20000);
  const w = sock.writable.getWriter(),
    rd = sock.readable.getReader(),
    dec = new TextDecoder();
  let buf = "";
  let transportStage = "greeting";
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
    transportStage = cmd == null ? "greeting" : /^(EHLO|AUTH|MAIL|RCPT|DATA)\b/.test(cmd) ? cmd.split(" ")[0] : "login_message";
    if (cmd != null) await send(cmd);
    const r = await reply();
    if (!ok.includes(r.code)) {
      const stage = cmd == null ? "greeting" : /^(EHLO|AUTH|MAIL|RCPT|DATA)\b/.test(cmd) ? cmd.split(" ")[0] : "login_message";
      const error = new Error("SMTP " + stage + " " + r.code);
      error.smtpCode = r.code;
      error.smtpStage = stage;
      throw error;
    }
    return r;
  }
  try {
    await step(null, [220]);
    await step("EHLO woerterbuch", [250]);
    await step("AUTH LOGIN", [334]);
    await step(b64(user), [334]);
    await step(b64(pass), [235]);
    await step(`MAIL FROM:<${options.from || user}>`, [250]);
    await step(`RCPT TO:<${to}>`, [250, 251]);
    await step("DATA", [354]);
    const bnd = "b" + crypto.randomUUID().replace(/-/g, "");
    const msg = [
      `From: ${"=?UTF-8?B?"+b64(String(options.fromName || "Deutschklinik").replace(/[\r\n]/g," "))+"?="} <${options.from || user}>`,
      ...(replyTo ? [`Reply-To: <${replyTo}>`] : []),
      `To: <${to}>`,
      `Subject: ${encWord(subject)}`,
      `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
      `Message-ID: <${messageId}@${(options.from || user).split("@")[1]}>`,
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
  } catch (error) {
    error.smtpStage ||= transportStage;
    throw error;
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
