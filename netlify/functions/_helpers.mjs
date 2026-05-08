// Shared helpers for VAPI tool webhooks.

export const json = (status, body) => ({
  statusCode: status,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

// VAPI tool-call request shape:
// { message: { type: "tool-calls", toolCalls: [{ id, function: { name, arguments } }] } }
// VAPI expects: { results: [{ toolCallId, result: <stringified or string> }] }
export function parseToolCall(event) {
  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch { /* noop */ }
  const msg = body.message || {};
  const call = (msg.toolCalls || msg.toolCallList || [])[0];
  if (!call) return { call: null, args: {} };
  let args = call.function?.arguments;
  if (typeof args === "string") {
    try { args = JSON.parse(args); } catch { args = {}; }
  }
  return {
    call,
    callerPhone: msg.call?.customer?.number || body.callerPhone || null,
    args: args || {},
  };
}

export function toolResponse(callId, result) {
  return json(200, {
    results: [{ toolCallId: callId, result: typeof result === "string" ? result : JSON.stringify(result) }],
  });
}

export function authOk(event) {
  const expect = process.env.VAPI_WEBHOOK_SECRET;
  if (!expect) return true; // dev mode -- no secret set
  const got = event.headers["x-vapi-secret"] || event.headers["X-Vapi-Secret"];
  return got === expect;
}

export async function sendSms(toPhone, body) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from || !toPhone) {
    console.warn("Twilio env not set or no phone, skipping SMS:", body);
    return { skipped: true };
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: toPhone, From: from, Body: body });
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Twilio ${r.status}: ${data.message}`);
  return { sid: data.sid };
}

export async function notifyOwner(subject, text) {
  const phone = process.env.OWNER_PHONE;
  if (phone) await sendSms(phone, `[${subject}] ${text}`).catch(e => console.error("owner sms fail", e));
}
