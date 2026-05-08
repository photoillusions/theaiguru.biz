import { parseToolCall, toolResponse, authOk, json, sendSms, notifyOwner } from "./_helpers.mjs";

// Stub: logs + SMS-confirms. Replace with Google Calendar event insert.
export const handler = async (event) => {
  if (!authOk(event)) return json(401, { error: "unauthorized" });
  const { call, args, callerPhone } = parseToolCall(event);
  if (!call) return json(400, { error: "no tool call" });

  const confirmation = `BK-${Date.now().toString(36).toUpperCase()}`;
  const brandLabel = args.brand === "photo_illusions" ? "Photo Illusions" : "TheAIGuru.biz";
  const when = new Date(args.start_iso).toLocaleString("en-US", { timeZone: "America/New_York" });

  if (callerPhone) {
    await sendSms(
      callerPhone,
      `${brandLabel}: You're booked for ${args.service} on ${when}. Confirmation ${confirmation}. -- Tony`
    ).catch(e => console.error("sms fail", e));
  }
  await notifyOwner("NEW BOOKING", `${brandLabel} | ${args.service} | ${when} | ${args.customer_name} <${args.customer_email}> | ${callerPhone || "?"}`);

  return toolResponse(call.id, {
    success: true,
    confirmation_number: confirmation,
    when_local: when,
    say: `You're all set. Confirmation number ${confirmation}. I just texted you the details.`,
  });
};
