"""
backfill_firs.py
Backfills criminal FIR Event records for all existing Person vertices
based on their risk score, without touching any other data.

Risk-based rules:
  > 75 (Critical)  → 2-4 serious FIR records guaranteed
  40-75 (Elevated) → 1-2 FIR records
  < 40 (Low)       → 0-1 FIR records (minor/none)
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import random
import uuid
from datetime import datetime, timedelta
from services.tigergraph_client import get_tg_connection

# Realistic FIR templates per severity tier
CRITICAL_CRIMES = [
    ("Organized Arms Trafficking", "Suspect arrested transporting unlicensed firearms across state borders. Linked to multiple extortion cases filed in 2023-2024."),
    ("Narcotics Distribution Network", "Suspect identified as mid-to-senior distributor in heroin supply chain. Multiple seizures at known addresses."),
    ("Extortion & Kidnapping", "Two FIRs filed by local businesses under Protection of Money Act. Victim testimonies recorded at district court."),
    ("Contract Murder Conspiracy", "Named in chargesheet as co-conspirator in contract killing. Currently out on bail while trial pending."),
    ("Money Laundering (PMLA)", "ED investigation under PMLA for channeling ₹3.2Cr through shell hawala accounts. Chargesheet filed."),
    ("Illegal Land Seizure", "Multiple land mafia complaints; forcible property occupation with armed associates in Haryana and UP."),
    ("Gang Warfare & Assault", "Booked under Section 307 IPC for attempted murder during gang rivalry clash. Prior convictions for assault."),
]

ELEVATED_CRIMES = [
    ("Vehicle Theft Ring", "Identified member of organized auto-theft network. Vehicle registration fraud documented in 3 states."),
    ("Wire Fraud & Cyber Crime", "Complaint filed for UPI spoofing and phishing operation targeting senior citizens. Case under investigation."),
    ("Hawala Transaction", "Flagged by banking authorities for suspicious cross-border transfers totaling ₹78L without source declaration."),
    ("Cheating & Forgery", "Named in FIR for forged documentation and impersonation to obtain loans. Case under CRPC 420."),
    ("Liquor Trafficking", "Seized during a raid on illicit liquor operation. Prior history of bootlegging in restricted districts."),
]

LOW_CRIMES = [
    ("Petty Theft", "Single FIR for store theft. Released on bail. No repeat offenses in recent record."),
    ("Public Disturbance", "Complaint filed for breach of peace at a public gathering. Case settled via compromise."),
]


def random_past_date(rng, max_days_ago=730):
    """Random date within the past max_days_ago days."""
    days_ago = rng.randint(30, max_days_ago)
    return (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")


def backfill_firs():
    print("Connecting to TigerGraph...")
    try:
        conn = get_tg_connection()
        persons = conn.getVertices("Person")
        print(f"Found {len(persons)} persons. Analyzing risk tiers...\n")

        total_added = 0
        skipped = 0

        for p in persons:
            pid = p["v_id"]
            attrs = p.get("attributes", {})
            risk = attrs.get("risk_score", 0)
            name = attrs.get("full_name", pid)

            # Check how many FIRs this person already has
            try:
                existing_edges = conn.getEdges("Person", pid)
                existing_firs = sum(1 for e in existing_edges if e.get("e_type") == "INVOLVED_IN")
            except Exception:
                existing_firs = 0

            # Determine how many FIRs to add
            if risk > 75:
                needed = max(0, random.randint(2, 4) - existing_firs)
                pool = CRITICAL_CRIMES
            elif risk > 40:
                needed = max(0, random.randint(1, 2) - existing_firs)
                pool = ELEVATED_CRIMES
            else:
                needed = max(0, random.randint(0, 1) - existing_firs)
                pool = LOW_CRIMES

            if needed == 0:
                skipped += 1
                continue

            # Seed RNG per person for determinism
            rng = random.Random(hash(pid) % (2**32) + 999)
            selected = rng.sample(pool, min(needed, len(pool)))

            for crime_type, description in selected:
                fir_id = f"fir_BACKFILL_{uuid.uuid4().hex[:8].upper()}"
                date = random_past_date(rng)
                try:
                    conn.upsertVertex("Event", fir_id, {
                        "fir_number": fir_id,
                        "crime_type": crime_type,
                        "date": date,
                        "description": description,
                    })
                    conn.upsertEdge("Person", pid, "INVOLVED_IN", "Event", fir_id)
                    total_added += 1
                except Exception as e:
                    print(f"  ⚠️  Could not add FIR for {name}: {e}")

            tier = "🔴 CRITICAL" if risk > 75 else "🟠 ELEVATED" if risk > 40 else "🔵 LOW"
            print(f"  {tier}  {name} (risk={risk:.0f}) → +{len(selected)} FIR(s) [had {existing_firs}]")

        print(f"\n✅ Backfill complete! Added {total_added} FIR records. ({skipped} persons already had enough.)")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ FAILED: {e}")


if __name__ == "__main__":
    backfill_firs()
