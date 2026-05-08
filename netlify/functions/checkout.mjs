// Direct Stripe Checkout from the intake form (no VAPI envelope).
// POST { product: 'consult_500'|'audit_1500'|'custom', customer_email?, customer_name?, company?, amount_usd?, description? }
// Returns { url }
import { json } from "./_helpers.mjs";

const PRODUCT_PRICE_ID = {
  consult_500: process.env.STRIPE_PRICE_CONSULT_500,
  audit_1500:  process.env.STRIPE_PRICE_AUDIT_1500,
};
const PRODUCT_FALLBACK = {
  consult_500: { name: "90-min AI Consultation",                amount_cents: 50000  },
  audit_1500:  { name: "2-Day Onsite AI Infrastructure Audit",  amount_cents: 150000 },
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }, body: "" };
  }
  if (event.httpMethod !== "POST") return json(405, { error: "method not allowed" });

  let data = {};
  try { data = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "bad json" }); }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json(500, { error: "Stripe not configured (STRIPE_SECRET_KEY missing)" });

  const origin = event.headers.origin || event.headers.Origin || "https://theaiguru.biz";
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", `${origin}/book.html?paid=1&session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url",  `${origin}/contact.html?canceled=1`);
  if (data.customer_email) params.append("customer_email", data.customer_email);
  params.append("billing_address_collection", "auto");
  params.append("phone_number_collection[enabled]", "true");

  if (data.company)        params.append("metadata[company]",        data.company);
  if (data.customer_name)  params.append("metadata[customer_name]",  data.customer_name);
  if (data.product)        params.append("metadata[product]",        data.product);

  const priceId = PRODUCT_PRICE_ID[data.product];
  if (priceId) {
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
  } else {
    const fb = PRODUCT_FALLBACK[data.product];
    const name   = data.description || (fb && fb.name) || "Service";
    const amount = data.amount_usd ? Math.round(data.amount_usd * 100) : (fb && fb.amount_cents) || 0;
    if (!amount) return json(400, { error: "amount_usd required when product is custom" });
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", name);
    params.append("line_items[0][price_data][unit_amount]", String(amount));
    params.append("line_items[0][quantity]", "1");
  }

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const out = await r.json();
  if (!r.ok) return json(r.status, { error: out.error?.message || "Stripe error" });
  return json(200, { url: out.url, id: out.id });
};
