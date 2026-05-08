import { parseToolCall, toolResponse, authOk, json } from "./_helpers.mjs";

// Stub: returns 3 plausible slots. Replace with Google Calendar freebusy query.
function fakeSlots(date_from, duration_minutes = 60) {
  const base = new Date(`${date_from}T13:00:00-05:00`);
  const slots = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(base.getTime() + i * 24 * 60 * 60 * 1000);
    slots.push({ start: d.toISOString(), duration_minutes });
  }
  return slots;
}

export const handler = async (event) => {
  if (!authOk(event)) return json(401, { error: "unauthorized" });
  const { call, args } = parseToolCall(event);
  if (!call) return json(400, { error: "no tool call" });

  const slots = fakeSlots(args.date_from, args.duration_minutes || 60);
  return toolResponse(call.id, {
    brand: args.brand,
    service: args.service,
    available_slots: slots,
    note: "These are example slots. Confirm one with the caller.",
  });
};
