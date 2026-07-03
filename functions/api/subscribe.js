// The Walkthrough launch-list signup → Cloudflare KV (self-hosted, no third party).
// Subscribers stored as key=email, value=JSON metadata.
export async function onRequestPost(context) {
  const { request, env } = context;
  const json = (obj, status) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });

  try {
    let email = "";
    let honeypot = "";
    const ct = request.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = await request.json();
      email = (body.email || "").toString();
      honeypot = (body.company || "").toString();
    } else {
      const form = await request.formData();
      email = (form.get("email") || "").toString();
      honeypot = (form.get("company") || "").toString();
    }
    email = email.trim().toLowerCase();

    // Honeypot: the "company" field is visually hidden — humans never fill it.
    // Bots that do get a fake success and nothing is stored.
    if (honeypot.trim() !== "") return json({ ok: true }, 200);

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
    if (!valid) return json({ ok: false, error: "invalid email" }, 400);

    // Idempotent: re-subscribing just updates the record, no duplicate.
    const meta = JSON.stringify({
      ts: new Date().toISOString(),
      site: "thewalkthrough.ai",
      ref: request.headers.get("referer") || "",
      ua: (request.headers.get("user-agent") || "").slice(0, 200),
    });
    await env.EMAILS.put(email, meta);
    return json({ ok: true }, 200);
  } catch (e) {
    return json({ ok: false, error: "server error" }, 500);
  }
}
