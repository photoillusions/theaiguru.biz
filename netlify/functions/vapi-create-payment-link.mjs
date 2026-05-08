import { parseToolCall, toolResponse, authOk, json, sendSms } from "./_helpers.mjs";

const PRODUCT_PRICE_ID = {
  consult_500: process.env.STRIPE_PRICE_CONSULT_500,
  audit_1500:  process.env.STRIPE_PRICE_AUDIT_1500,
};
const PRODUCT_LABEL = {
  consult_500:      "$500 -- 90-min AI Consultation",
  audit_1500:       "$1,500 -- 2-Day Onsite Audit",
  event_deposit:    "Event Photography Deposit",
  portrait_session: "Portrait Session",
  custom:           "Custom Service",
};

async function stripeCheckout({ price_id, amount_usd, description, customer_email }) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { url: "https://theaiguru.biz/book", stub: true };

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("success_url", "https://theaiguru.biz/book?paid=1");
  params.append("cancel_url",  "https://theaiguru.biz/book?canceled=1");
  if (customer_email) params.append("customer_email", customer_email);
  if (price_id) {
    params.append("line_items[0][price]", price_id);
    params.append("line_items[0][quantity]", "1");
  } else {
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][product_data][name]", description || "Service");
    params.append("line_items[0][price_data][unit_amount]", String(Math.round((amount_usd || 0) * 100)));
    params.append("line_items[0][quantity]", "1");
  }
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`Stripe ${r.status}: ${data.error?.message}`);
  return { url: data.url };
}

export const handler = async (event) => {
  if (!authOk(event)) return json(401, { error: "unauthorized" });
  const { call, args, callerPhone } = parseToolCall(event);
  if (!call) return json(400, { error: "no tool call" });

  const label = PRODUCT_LABEL[args.product] || "Service";
  let session;
  try {
    session = await stripeCheckout({
      price_id: PRODUCT_PRICE_ID[args.product],
      amount_usd: args.amount_usd,
      description: args.description || label,
      customer_email: args.customer_email,
    });
  } catch (e) {
    return toolResponse(call.id, { success: false, error: e.message });
  }

  if (callerPhone) {
    await sendSms(callerPhone, `${label} -- secure checkout: ${session.url}`).catch(e => console.error("sms", e));
  }
  return toolResponse(call.id, {
    success: true,
    say: `Payment link is on the way to your phone. Pay when you're ready -- I'll text the receipt.`,
  });
};
