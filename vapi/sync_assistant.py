"""
Push assistant_config.json to VAPI.
Creates a new assistant on first run (writes the id back), updates in-place after.

Usage:
    python vapi/sync_assistant.py            # update or create
    python vapi/sync_assistant.py --dry-run  # show diff only
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

API_KEY      = os.environ.get("VAPI_API_KEY")
ASSISTANT_ID = os.environ.get("VAPI_ASSISTANT_ID")
CONFIG       = ROOT / "assistant_config.json"

if not API_KEY:
    sys.exit("VAPI_API_KEY missing in vapi/.env")

cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

if "--dry-run" in sys.argv:
    print(json.dumps(cfg, indent=2))
    sys.exit(0)

if ASSISTANT_ID:
    r = requests.patch(f"https://api.vapi.ai/assistant/{ASSISTANT_ID}", json=cfg, headers=headers, timeout=30)
    if r.status_code >= 300:
        sys.exit(f"PATCH failed {r.status_code}: {r.text}")
    print(f"Updated assistant {ASSISTANT_ID}")
else:
    r = requests.post("https://api.vapi.ai/assistant", json=cfg, headers=headers, timeout=30)
    if r.status_code >= 300:
        sys.exit(f"POST failed {r.status_code}: {r.text}")
    new_id = r.json().get("id")
    print(f"Created assistant {new_id}")
    print("Add this to vapi/.env :")
    print(f"VAPI_ASSISTANT_ID={new_id}")
