"""
Nondual — LinkedIn connections import (Python)

Takes a LinkedIn connections CSV export and bulk-imports every contact.
Uses the /imports endpoint for efficiency (up to 5000 rows per call).

LinkedIn export format:
  First Name, Last Name, URL, Email Address, Company, Position, Connected On

Get your export: LinkedIn → Settings → Data Privacy → Get a copy of your data → Connections

Usage:
  pip install requests
  NONDUAL_API_KEY=nd_... python linkedin-import.py Connections.csv
"""

import os
import sys
import csv
import json
import requests
from pathlib import Path

API = "https://api.nondual.cloud/v1"
KEY = os.environ.get("NONDUAL_API_KEY", "")

if not KEY:
    print("Error: NONDUAL_API_KEY not set")
    sys.exit(1)

HEADERS = {
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
}


def parse_connections_csv(path: str) -> list[dict]:
    rows = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        # LinkedIn CSVs have 3 header lines — skip the first two notes rows
        lines = f.readlines()
        # Find the actual header row (contains "First Name")
        header_idx = next(
            (i for i, l in enumerate(lines) if "First Name" in l or "first name" in l.lower()),
            0
        )
        reader = csv.DictReader(lines[header_idx:])
        for row in reader:
            # Normalise LinkedIn's column names
            email = (
                row.get("Email Address") or
                row.get("Email") or
                row.get("email") or ""
            ).strip()
            linkedin_url = (
                row.get("URL") or
                row.get("Profile URL") or
                row.get("linkedin_url") or ""
            ).strip()

            if not email and not linkedin_url:
                continue  # skip rows with no identifier

            first = (row.get("First Name") or row.get("first_name") or "").strip()
            last = (row.get("Last Name") or row.get("last_name") or "").strip()
            name = f"{first} {last}".strip() or None

            rows.append({
                "email": email or None,
                "linkedin_url": linkedin_url or None,
                "name": name,
                "company": (row.get("Company") or row.get("company") or "").strip() or None,
                "role": (row.get("Position") or row.get("position") or row.get("role") or "").strip() or None,
            })
    return rows


def chunk(lst, size):
    for i in range(0, len(lst), size):
        yield lst[i:i + size]


def import_rows(rows: list[dict]) -> dict:
    # Filter None values from each row
    clean = [{k: v for k, v in r.items() if v} for r in rows]
    res = requests.post(
        f"{API}/imports",
        headers=HEADERS,
        json={"rows": clean},
        timeout=60,
    )
    res.raise_for_status()
    return res.json()


def main():
    if len(sys.argv) < 2:
        print("Usage: NONDUAL_API_KEY=nd_... python linkedin-import.py Connections.csv")
        sys.exit(1)

    path = sys.argv[1]
    if not Path(path).exists():
        print(f"File not found: {path}")
        sys.exit(1)

    print(f"Parsing {path}...")
    rows = parse_connections_csv(path)
    print(f"Found {len(rows)} rows with at least one identifier\n")

    total = {"contacts_created": 0, "contacts_updated": 0,
             "interactions_created": 0, "followups_created": 0}
    all_errors = []

    for i, batch in enumerate(chunk(rows, 500)):
        print(f"Importing batch {i + 1} ({len(batch)} rows)...")
        result = import_rows(batch)
        imp = result.get("imported", {})
        for k in total:
            total[k] += imp.get(k, 0)
        errors = result.get("errors", [])
        all_errors.extend(errors)
        print(f"  created: {imp.get('contacts_created', 0)}  "
              f"updated: {imp.get('contacts_updated', 0)}")

    print(f"\n=== Import complete ===")
    print(f"Contacts created:  {total['contacts_created']}")
    print(f"Contacts updated:  {total['contacts_updated']}")
    print(f"Total rows:        {len(rows)}")

    if all_errors:
        print(f"\nErrors ({len(all_errors)}):")
        for e in all_errors[:10]:
            print(f"  row {e.get('row')}: {e.get('message')}")
        if len(all_errors) > 10:
            print(f"  ... and {len(all_errors) - 10} more")


if __name__ == "__main__":
    main()
