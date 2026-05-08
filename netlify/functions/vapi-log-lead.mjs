import { parseToolCall, toolResponse, authOk, json, notifyOwner } from "./_helpers.mjs";

export const handler = async (event) => {
  if (!authOk(event)) return json(401, { error: "unauthorized" });
  const { call, args, callerPhone } = parseToolCall(event);
  if (!call) return json(400, { error: "no tool call" });

  const brandLabel = args.brand === "photo_illusions" ? "Photo Illusions"
                   : args.brand === "aiguru"          ? "TheAIGuru.biz"
                   : "Unknown";
  const line = [
    brandLabel,
    args.intent,
    args.customer_name || "(no name)",
    args.customer_email || "(no email)",
    callerPhone || "(no phone)",
    args.follow_up_needed ? "FOLLOW-UP" : "no f/u",
    args.summary,
  ].join(" | ");
  console.log("LEAD", line);
  await notifyOwner("LEAD", line);

  return toolResponse(call.id, { success: true });
};
