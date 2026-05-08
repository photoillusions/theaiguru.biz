# GURU -- VAPI Voice Agent (dual-brand)

One phone number, two businesses:
- **TheAIGuru.biz** (software & AI development)
- **Photo Illusions** (photography & entertainment)

## Files

| Path | What it does |
|---|---|
| `vapi/assistant_config.json`   | Full assistant definition (model, voice, tools, system prompt). |
| `vapi/sync_assistant.py`       | Push the JSON to VAPI (creates on first run, patches after). |
| `vapi/.env.example`            | Copy to `vapi/.env` and fill in real keys. Never commit `.env`. |
| `netlify/functions/vapi-*.mjs` | Tool webhooks that VAPI calls during a live call. |
| `netlify.toml`                 | Routes `/vapi/<name>` -> `/.netlify/functions/vapi-<name>`. |

## Tools wired

| Tool | Endpoint | Purpose |
|---|---|---|
| `check_availability`  | `/vapi/check-availability`  | Calendar lookup (currently a stub returning sample slots). |
| `book_appointment`    | `/vapi/book-appointment`    | Books slot, SMS-confirms caller, alerts Tony. |
| `send_sms_link`       | `/vapi/send-sms-link`       | Texts a known link (booking, contract, portfolio, packages). |
| `create_payment_link` | `/vapi/create-payment-link` | Stripe Checkout for $500 consult, $1,500 audit, deposits. |
| `log_lead`            | `/vapi/log-lead`            | Always-fire end-of-call lead capture. |

## Deploy steps

1. **Copy env template**
   ```powershell
   Copy-Item vapi/.env.example vapi/.env
   notepad vapi/.env
   ```
2. **Set Netlify env vars** (Site settings -> Environment variables) -- same keys as `.env` minus the VAPI-only ones. The functions read `process.env.*`.
   - `VAPI_WEBHOOK_SECRET`, `TWILIO_*`, `STRIPE_*`, `GCAL_*`, `OWNER_*`
3. **Push the assistant**
   ```powershell
   pip install -r vapi/requirements.txt
   python vapi/sync_assistant.py
   ```
   Copy the printed `VAPI_ASSISTANT_ID` back into `vapi/.env`.
4. **Attach the phone number** in the VAPI dashboard -> Phone Numbers -> select your number -> assign to assistant `Guru`.
5. **Deploy site to Netlify** (`git push` if linked, or `netlify deploy --prod`). The tool URLs in the assistant config (`https://theaiguru.biz/vapi/*`) must resolve to the deployed Netlify functions.
6. **Test call** -- ring the VAPI number, try:
   - "I need a website built" -> should route AIGuru, offer the $500 consult.
   - "I need a photographer for my daughter's wedding" -> Photo Illusions, capture date.
   - "How much for the onsite audit?" -> quotes $1,500 then offers to book.

## Re-syncing after edits
After editing `assistant_config.json`:
```powershell
python vapi/sync_assistant.py
```
Updates in place using the saved `VAPI_ASSISTANT_ID`.

## Stubs to replace with real integrations
- `vapi-check-availability.mjs` -- swap fake slot generator for Google Calendar freebusy.
- `vapi-book-appointment.mjs`   -- swap log-and-SMS for real Calendar event insert.

The SMS + Stripe paths are real -- they just need keys.
