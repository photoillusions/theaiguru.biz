import { parseToolCall, toolResponse, authOk, json, sendSms } from "./_helpers.mjs";

const LINKS = {
  booking:                   "https://theaiguru.biz/book",
  consult_payment:           "https://theaiguru.biz/pay/consult-500",
  audit_payment:             "https://theaiguru.biz/pay/audit-1500",
  portfolio_aiguru:          "https://theaiguru.biz/results",
  portfolio_photo_illusions: "https://photoillusions.com/portfolio",
  contract:                  "https://theaiguru.biz/contract",
  schools_packages:          "https://photoillusions.com/schools",
};

export const handler = async (event) => {
  if (!authOk(event)) return json(401, { error: "unauthorized" });
  const { call, args, callerPhone } = parseToolCall(event);
  if (!call) return json(400, { error: "no tool call" });

  const url = LINKS[args.link_kind];
  if (!url) return toolResponse(call.id, { success: false, error: "unknown link_kind" });

  const body = `${args.label || "From Tony"}: ${url}`;
  if (callerPhone) {
    try { await sendSms(callerPhone, body); }
    catch (e) { return toolResponse(call.id, { success: false, error: String(e.message) }); }
  }
  return toolResponse(call.id, {
    success: true,
    say: `Sent. You should see the text any second now.`,
  });
};
