"""
Nondual memory loop — Python via REST
The same four-call pattern as the TypeScript example, using only requests.

Requirements:
  pip install requests
  export NONDUAL_API_KEY=nd_...
"""

import os
import json
import requests
from datetime import datetime, timedelta

API = "https://api.nondual.cloud/v1"
KEY = os.environ["NONDUAL_API_KEY"]

HEADERS = {
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "X-Nondual-Agent": "python-example",
}


def get_contact_info(contact: str, enrich: bool = True) -> dict:
    res = requests.post(
        f"{API}/get-contact-info",
        headers=HEADERS,
        json={"contact": contact, "enrich": enrich},
    )
    res.raise_for_status()
    return res.json()


def record_interaction(contact: str, **kwargs) -> dict:
    res = requests.post(
        f"{API}/record-contact-interaction",
        headers=HEADERS,
        json={"contact": contact, **kwargs},
    )
    res.raise_for_status()
    return res.json()


def list_followups(**kwargs) -> dict:
    res = requests.get(f"{API}/list-open-followups", headers=HEADERS, params=kwargs)
    res.raise_for_status()
    return res.json()


def company_activity(domain: str) -> dict:
    res = requests.get(
        f"{API}/get-company-activity",
        headers=HEADERS,
        params={"domain": domain},
    )
    res.raise_for_status()
    return res.json()


def main():
    contact_email = "dario@anthropic.com"

    # 1. Look up before outreach
    print("Getting contact info...")
    info = get_contact_info(contact_email)
    c = info["contact"]

    print(f"\nName:    {c.get('name')}")
    print(f"Role:    {c.get('profile', {}).get('role')}")
    print(f"Company: {c.get('company', {}).get('name')}")

    if c.get("do_not_disturb"):
        print("\n⛔ DO NOT DISTURB — skipping outreach.")
        return

    print(f"\nRelationship: {info.get('relationship_summary')}")
    print(f"Recommended:  {info.get('recommended_next_action')}")

    if info.get("open_followups"):
        print("\nOpen followups:")
        for f in info["open_followups"]:
            due = f.get("due", "")[:10] if f.get("due") else "no date"
            print(f"  {f['action']} (due {due})")

    # 2. Record outreach + create followup
    print("\nRecording outreach...")
    due_date = (datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d")
    recorded = record_interaction(
        contact_email,
        channel="email",
        direction="outbound",
        summary="Sent intro about AI safety research partnership",
        details="Hi Dario, reaching out about a potential research partnership on AI safety. Would love to share what we are building.",
        followup_action="Follow up if no reply in 5 days",
        followup_due=due_date,
    )
    print(f"Interaction: {recorded['interaction']['id']}")
    if recorded.get("followup_created"):
        print(f"Followup:    {recorded['followup_created']['id']}")

    # 3. List open followups for the company
    print("\nOpen followups for anthropic.com:")
    followups = list_followups(company="anthropic.com")
    for f in followups.get("followups", []):
        dnd = " ⛔" if f.get("contact", {}).get("do_not_disturb") else ""
        due = f.get("due", "")[:10] if f.get("due") else "no date"
        print(f"  {f['action']} (due {due}) — {f.get('contact', {}).get('name', '?')}{dnd}")

    # 4. Company-level view
    print("\nCompany activity:")
    activity = company_activity("anthropic.com")
    print(f"  {activity['domain']}: {activity.get('total_contacts', 0)} contact(s)")
    for c in activity.get("contacts", []):
        dnd = " ⛔" if c.get("do_not_disturb") else ""
        role = c.get("profile", {}).get("role", "")
        print(f"  {c.get('name', '?')}{f' · {role}' if role else ''}{dnd}")


if __name__ == "__main__":
    main()
