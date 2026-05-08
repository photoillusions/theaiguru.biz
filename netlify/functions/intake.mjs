import { json, sendSms, notifyOwner } from "./_helpers.mjs";

// Receives the AI Audit intake form. Stores via owner SMS + email notify.
// Future: write to Airtable / Supabase / Google Sheets.
export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" }, body: "" };
  }
  if (event.httpMethod !== "POST") return json(405, { error: "method not allowed" });

  let data = {};
  try { data = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "bad json" }); }

  const lines = [
    "NEW AI AUDIT INTAKE",
    `Name:       ${data.name || "-"}${data.title ? " (" + data.title + ")" : ""}`,
    `Company:    ${data.company || "-"} | ${data.industry || "-"}`,
    `Contact:    ${data.email || "-"} | ${data.phone || "-"}`,
    `Website:    ${data.website || "-"}`,
    `Team:       ${data.team_size || "-"} | Revenue: ${data.revenue || "-"}`,
    `Needs:      ${Array.isArray(data.needs) ? data.needs.join(", ") : (data.needs || "-")}`,
    `Stack:      ${data.current_stack || "-"}`,
    `Bottleneck: ${data.bottleneck || "-"}  (${data.hours_lost || "?"} hrs/wk lost)`,
    `Budget:     ${data.budget || "-"}`,
    `Timeline:   ${data.timeline || "-"}`,
    `Engagement: ${data.engagement || "-"}`,
    `Notes:      ${data.notes || "-"}`,
    `Page:       ${data.page || "-"}`,
    `Submitted:  ${data.submitted_at || "-"}`,
  ].join("\n");

  console.log(lines);

  // Owner SMS gets a short summary; full body goes to logs / future email.
  await notifyOwner("AUDIT INTAKE", `${data.company || data.name} (${data.industry || "?"}) -- budget ${data.budget || "?"} -- ${data.email || "no email"}`);

  return json(200, { success: true, message: "Intake received" });
};
