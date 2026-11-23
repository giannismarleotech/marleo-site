import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const FROM = "Marleo <info@marleo.tech>";
const FROM_GIANNIS = "Giannis Baert <giannis@marleo.tech>";
const OWNER = "77f6201e-8836-46b8-9c7a-0c118c4db61e";
const SBURL = Deno.env.get("SUPABASE_URL")!;
const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const DAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const dateLong = (d: string) => { const x = new Date(d + "T12:00:00Z"); return `${DAYS[x.getUTCDay()]} ${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`; };
const endTime = (t: string, dur: number) => { const [h, m] = t.split(":").map(Number); const e = h * 60 + m + dur; return String(Math.floor(e / 60) % 24).padStart(2, "0") + ":" + String(e % 60).padStart(2, "0"); };

async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(msg)));
  return Array.from(s).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

const logoCache: Record<string, string> = {};
async function logo(name: string) {
  if (logoCache[name]) return logoCache[name];
  const r = await fetch("https://marleo.tech/" + name); if (!r.ok) throw new Error("logo");
  const buf = new Uint8Array(await r.arrayBuffer()); let bin = ""; for (let i = 0; i < buf.length; i += 8192) bin += String.fromCharCode(...buf.subarray(i, i + 8192));
  return (logoCache[name] = btoa(bin));
}

type Mail = { to: string; subject: string; html: string; text?: string; attach?: { name: string; type?: string; b64: string }; unsubUrl?: string; personal?: boolean };
async function resendSend(m: Mail) {
  const key = Deno.env.get("RESEND_API_KEY"); if (!key) throw new Error("RESEND_API_KEY ontbreekt");
  let html = m.html; const attachments: any[] = [];
  const re = /https:\/\/marleo\.tech\/(marleo-(?:logo-mail(?:-dark)?|mail-[a-z]+)\.png)/g; const names = new Set<string>(); let x;
  while ((x = re.exec(m.html))) names.add(x[1]);
  let i = 0;
  for (const n of names) { try { const cid = `logo${i++}@marleo.tech`; attachments.push({ filename: n, content: await logo(n), content_id: cid }); html = html.split("https://marleo.tech/" + n).join("cid:" + cid); } catch (_) { /* laat de URL staan */ } }
  if (m.attach?.b64) attachments.push({ filename: m.attach.name, content: m.attach.b64, content_type: m.attach.type || "application/octet-stream" });
  const headers: Record<string, string> = {};
  if (m.unsubUrl) { headers["List-Unsubscribe"] = `<${m.unsubUrl}>, <mailto:info@marleo.tech?subject=afmelden>`; headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"; }
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify({ from: m.personal ? FROM_GIANNIS : FROM, to: [m.to], reply_to: m.personal ? "giannis@marleo.tech" : "info@marleo.tech", subject: m.subject, html, text: m.text || undefined, headers: Object.keys(headers).length ? headers : undefined, attachments: attachments.length ? attachments : undefined }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.message || ("Resend " + r.status));
  return j;
}

function shell(tag: string, title: string, intro: string, card: string, after: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f4f9"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f9"><tr><td align="center" style="padding:28px 14px"><table width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-radius:18px;overflow:hidden;background:#ffffff">`
    + `<tr><td bgcolor="#12131c" style="background:#12131c;padding:22px 32px"><table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#12131c"><tr><td bgcolor="#12131c"><img src="https://marleo.tech/marleo-logo-mail-dark.png" width="190" height="48" alt="marleo.tech" style="display:block;border:0;width:190px;height:48px;font-family:Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff"></td><td align="right" bgcolor="#12131c" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;color:#9aa0b8;text-transform:uppercase">${esc(tag)}</td></tr></table></td></tr>`
    + `<tr><td style="height:4px;line-height:4px;font-size:0;background:#ef4056;background-image:linear-gradient(90deg,#f97c1f,#ef4056,#e91e7b)">&nbsp;</td></tr>`
    + `<tr><td style="padding:34px 32px 8px;font-family:Arial,Helvetica,sans-serif;color:#1a1a22"><div style="font-size:26px;font-weight:800;line-height:1.2;color:#14141c;margin:0 0 14px">${title}</div><div style="font-size:15px;line-height:1.65;color:#3d3f52">${intro}</div>${card}${after}</td></tr>`
    + `<tr><td style="padding:8px 32px 30px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#3d3f52"><div style="border-top:1px solid #e6e7ef;padding-top:18px"><b style="color:#14141c">Giannis Baert</b><br>Founder · Marleo<br>T +32 456 92 00 25 · <a href="mailto:info@marleo.tech" style="color:#ef4056;text-decoration:none">info@marleo.tech</a> · <a href="https://marleo.tech" style="color:#ef4056;text-decoration:none">marleo.tech</a></div></td></tr>`
    + `</table><div style="font-family:Arial,sans-serif;font-size:11px;color:#9aa0b8;padding:14px">Marleo · Graaf van Hoornestraat 2B, 9850 Nevele · BTW BE 1041.196.713</div></td></tr></table></body></html>`;
}

function recvMail(b: any) {
  const first = esc(String(b.naam || "").split(" ")[0]);
  const wat = b.kind === "meet" ? "📹 Videogesprek via Google Meet" : b.kind === "tel" ? "📞 Telefonisch gesprek" : "📍 Op afspraak";
  const note = b.kind === "meet" ? "De Meet-link stuur ik je bij de bevestiging." : b.kind === "tel" ? "Ik bel je op het nummer dat je opgaf." : "";
  const t = dateLong(b.d); const T = t.charAt(0).toUpperCase() + t.slice(1);
  const card = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px;background:#f7f7fb;border-radius:12px"><tr><td width="5" style="width:5px;background:#ef4056;background-image:linear-gradient(180deg,#f97c1f,#ef4056,#e91e7b)">&nbsp;</td><td style="padding:18px 22px;font-family:Arial,Helvetica,sans-serif"><table cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#8a8ca0;padding-bottom:4px">Afspraak</td></tr><tr><td style="font-size:20px;font-weight:800;color:#14141c">${esc(T)}</td></tr><tr><td style="font-size:17px;font-weight:700;color:#ef4056;padding-top:2px">${esc(b.t)} – ${endTime(b.t, b.dur || 30)}</td></tr><tr><td style="font-size:14px;color:#3d3f52;padding-top:10px">${wat}</td></tr>${note ? `<tr><td style="padding:6px 0 0;font-size:13px;color:#6a6a7e">${note}</td></tr>` : ""}</table></td></tr></table>`;
  const after = `<div style="font-size:13px;line-height:1.6;color:#6a6a7e;margin-top:14px">Past dit toch niet? Kies gerust een ander moment via <a href="https://marleo.tech/afspraak/" style="color:#ef4056">marleo.tech/afspraak</a> of antwoord op deze mail.</div>`;
  const d = new Date(b.d + "T12:00:00Z");
  return {
    subject: `Aanvraag ontvangen – ${DAYS[d.getUTCDay()]} ${b.d.split("-").reverse().join("/")} om ${b.t}`,
    html: shell("Aanvraag", "Bedankt, ik heb je aanvraag ontvangen", `Hallo${first ? " " + first : ""},<br><br>Leuk dat je een afspraak wil! Dit moment is voor jou gereserveerd. Ik bevestig het zo snel mogelijk, meestal binnen één werkdag.`, card, after),
    text: `Hallo${first ? " " + first : ""},\n\nBedankt, ik heb je aanvraag ontvangen voor ${t} om ${b.t}. Ik bevestig zo snel mogelijk.\n\nGiannis Baert\nMarleo · marleo.tech`,
  };
}

async function unsubUrl(email: string) {
  const sr = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return `${SBURL}/functions/v1/unsub?e=${encodeURIComponent(email)}&t=${await hmac(sr, email.toLowerCase().trim())}`;
}
const unsubFooter = (u: string) => `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#8a8ca0;margin-top:22px;padding-top:12px;border-top:1px solid #e6e7ef">Je ontvangt deze e-mail omdat we denken dat Marleo interessant kan zijn voor jouw zaak. Geen interesse? <a href="${u}" style="color:#8a8ca0">Meld je hier af</a> en we mailen je niet meer.<br>Marleo · Graaf van Hoornestraat 2B, 9850 Nevele</div>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST" }, 405);
  let b: any = {}; try { b = await req.json(); } catch { /* leeg */ }
  const ready = !!Deno.env.get("RESEND_API_KEY");
  if (b.ping) return json({ ready });
  if (!ready) return json({ ready: false });
  const sb = createClient(SBURL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (b.action === "send") {
    const tok = (req.headers.get("authorization") || "").replace(/^Bearer /i, "");
    const { data: u } = await sb.auth.getUser(tok);
    if (u?.user?.id !== OWNER) return json({ error: "Niet toegestaan" }, 401);
    const m = b.mail || {}; if (!m.to || !m.subject || !m.html) return json({ error: "Onvolledige mail" }, 400);
    try { await resendSend({ to: String(m.to), subject: String(m.subject), html: String(m.html), text: m.text ? String(m.text) : undefined, attach: m.attach, personal: m.from === "giannis" }); return json({ ok: true }); }
    catch (e) { return json({ ok: false, error: String((e as Error).message) }, 502); }
  }

  const { data: cr } = await sb.from("booking_config").select("data").eq("id", 1).maybeSingle();
  let recv = 0;
  if ((cr?.data as any)?.mail?.recv !== false) {
    const { data: nw } = await sb.from("bookings").select("*").eq("status", "aangevraagd").eq("mail_recv", false)
      .lte("created_at", new Date(Date.now() - 20000).toISOString()).gte("created_at", new Date(Date.now() - 3600000).toISOString()).limit(10);
    for (const bk of nw || []) {
      const { data: cl } = await sb.from("bookings").update({ mail_recv: true }).eq("id", bk.id).eq("mail_recv", false).select("id");
      if (!cl?.length) continue;
      try { await resendSend({ to: bk.email, ...recvMail(bk) }); recv++; }
      catch (_) { await sb.from("bookings").update({ mail_recv: false }).eq("id", bk.id); }
    }
  }

  const { data: due } = await sb.from("mail_queue").select("id").eq("status", "pending").lte("send_at", new Date().toISOString()).order("send_at").limit(20);
  let sent = 0, failed = 0;
  for (const q of due || []) {
    const { data: c } = await sb.from("mail_queue").update({ status: "sending" }).eq("id", q.id).eq("status", "pending").select("*");
    if (!c?.length) continue; const m = c[0];
    if (Date.now() - new Date(m.send_at).getTime() > (m.campaign_id ? 20 * 3600000 : 45 * 60000)) { await sb.from("mail_queue").update({ status: "cancelled", error: "te laat" }).eq("id", m.id); continue; }
    try {
      let html = m.html, uu: string | undefined;
      if (m.campaign_id) {
        const em = String(m.to_email).toLowerCase().trim();
        const { data: un } = await sb.from("mail_unsub").select("email").eq("email", em).maybeSingle();
        if (un) { await sb.from("mail_queue").update({ status: "cancelled", error: "afgemeld" }).eq("id", m.id); continue; }
        uu = await unsubUrl(em);
        html = html.includes("</body>") ? html.replace("</body>", unsubFooter(uu) + "</body>") : html + unsubFooter(uu);
      }
      const res = await resendSend({ to: m.to_email, subject: m.subject, html, text: m.body_text || undefined, unsubUrl: uu });
      const saved = await sb.from("mail_queue").update({ status: "sent", sent_at: new Date().toISOString(), resend_id: res?.id || null }).eq("id", m.id);
      if (!saved.error && res?.id) await sb.rpc("hq_mail_reconcile", {p_provider:res.id});
      sent++;
    } catch (e) { await sb.from("mail_queue").update({ status: "failed", error: String((e as Error).message).slice(0, 300) }).eq("id", m.id); failed++; }
  }
  return json({ ready: true, recv, sent, failed });
});

