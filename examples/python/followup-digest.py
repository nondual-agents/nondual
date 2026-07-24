"""
Nondual — Daily followup digest (Python)

Fetches today's open followups and prints a prioritised digest.
Run on a schedule (cron, GitHub Actions, Hermes cron, etc.)

Usage:
  pip install requests
  NONDUAL_API_KEY=nd_... python followup-digest.py

Cron (daily 8am):
  0 8 * * * NONDUAL_API_KEY=nd_... python /path/to/followup-digest.py
"""

import os
import sys
import requests
from datetime import date
from collections import defaultdict

API = "https://api.nondual.cloud/v1"
KEY = os.environ.get("NONDUAL_API_KEY", "")
HEADERS = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}

today = date.today().isoformat()


def get_followups(due_before=today):
    r = requests.get(
        f"{API}/list-open-followups",
        headers=HEADERS,
        params={"due_before": due_before},
        timeout=15,
    )
    r.raise_for_status()
    return r.json().get("followups", [])


def main():
    if not KEY:
        print("Error: NONDUAL_API_KEY not set")
        sys.exit(1)

    followups = get_followups()

    print(f"=== Followup digest — {today} ===\n")

    if not followups:
        print("Nothing due today. ✅")
        return

    print(f"{len(followups)} open followup(s):\n")

    # Group by company domain
    by_company = defaultdict(list)
    for f in followups:
        domain = (f.get("contact") or {}).get("company", {}).get("domain") or "no company"
        by_company[domain].append(f)

    overdue = [f for f in followups if f.get("due") and f["due"] < today]

    for domain, items in sorted(by_company.items()):
        print(f"── {domain} ──")
        for f in items:
            c = f.get("contact") or {}
            name = c.get("name") or (c.get("identifiers") or {}).get("emails", ["?"])[0]
            dnd = " ⛔ DND" if c.get("do_not_disturb") else ""
            due_str = (f.get("due") or "no date")[:10]
            late = " ⚠️ OVERDUE" if f.get("due") and f["due"] < today else ""
            owner = f"  owner: {f['owner']}" if f.get("owner") else ""
            print(f"  {name}{dnd}{late}")
            print(f"  → {f['action']} (due {due_str}){owner}")
            print()

    if overdue:
        print(f"⚠️  {len(overdue)} overdue — act today.")


if __name__ == "__main__":
    main()
