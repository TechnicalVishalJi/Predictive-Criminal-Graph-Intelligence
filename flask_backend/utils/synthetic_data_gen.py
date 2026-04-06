import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import random
from faker import Faker
from services.tigergraph_client import get_tg_connection

fake = Faker('en_IN')


def generate_synthetic_data():
    """
    Purges existing data and generates distinct, realistic criminal syndicates 
    (isolated graph clusters). FIR Event vertices are soft-optional — skipped 
    with a warning if the Event vertex type doesn't exist in TigerGraph yet.
    """
    print("Initiating Native connection to Local TigerGraph...")
    try:
        conn = get_tg_connection()
        print("Authenticated! Purging old graph data...")

        # Purge existing data cleanly
        for vType in ["Person", "Account", "Device", "Event"]:
            try:
                conn.delVertices(vType)
                print(f"  Purged: {vType}")
            except Exception as e:
                print(f"  Skipped purge {vType} (may not exist): {e}")

        print("\nGenerating isolated criminal syndicates...")

        # Strictly isolated gang clusters — NO cross-gang edges
        syndicates = [
            {"id": "GANG_ALPHA",   "name": "Bishnoi Crime Syndicate",  "size": 12, "accounts": 6,  "devices": 8},
            {"id": "GANG_BRAVO",   "name": "Delhi Auto-Theft Ring",     "size": 7,  "accounts": 3,  "devices": 4},
            {"id": "GANG_CHARLIE", "name": "Cyber Hawala Network",      "size": 9,  "accounts": 15, "devices": 5},
            {"id": "LONE_WOLVES",  "name": "Independent Operators",     "size": 5,  "accounts": 4,  "devices": 4},
        ]

        crimes = [
            "Armed Extortion",
            "Vehicle Theft Ring",
            "Wire Fraud & Hawala",
            "Narcotics Distribution",
            "Illegal Arms Trafficking",
            "Cyber Ransom & Data Breach",
            "Land Mafia Operations",
            "Organized Smuggling",
        ]

        total_persons = 0
        total_events = 0
        events_supported = True  # Flips False on first Event schema rejection

        for gang in syndicates:
            persons, accounts, devices, events = [], [], [], []

            # --- 1. Gang Members ---
            print(f"\n  [{gang['name']}] Seeding {gang['size']} suspects...")
            for i in range(gang["size"]):
                p_id = f"person_{gang['id']}_{i}"
                base_risk = round(random.uniform(20, 99), 1)
                conn.upsertVertex("Person", p_id, {
                    "full_name": fake.name(),
                    "risk_score": base_risk
                })
                persons.append(p_id)
                total_persons += 1

            # --- 2. Gang Financial Assets ---
            for i in range(gang["accounts"]):
                acc_id = f"acc_{gang['id']}_{fake.bban()[:6]}"
                conn.upsertVertex("Account", acc_id, {
                    "bank_name": random.choice(["HDFC", "SBI", "ICICI", "Axis", "PNB"])
                })
                accounts.append(acc_id)

            # --- 3. Gang Communication Devices ---
            for i in range(gang["devices"]):
                dev_id = f"imei_{gang['id']}_{fake.msisdn()[:8]}"
                conn.upsertVertex("Device", dev_id, {
                    "phone_number": fake.phone_number()
                })
                devices.append(dev_id)

            # --- 4. FIR Event Vertices (soft-optional) ---
            if events_supported:
                num_events = random.randint(2, 4)
                for i in range(num_events):
                    evt_id = f"fir_{gang['id']}_{random.randint(1000, 9999)}"
                    crime_type = random.choice(crimes)
                    city = fake.city()
                    desc = f"{crime_type} — Active investigation linked to {gang['name']} operations in {city}."
                    try:
                        conn.upsertVertex("Event", evt_id, {
                            "fir_number": evt_id.upper(),
                            "crime_type": crime_type,
                            "date": f"202{random.randint(2,4)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}",
                            "description": desc
                        })
                        events.append(evt_id)
                        total_events += 1
                    except Exception as e:
                        print(f"  ⚠️  Event vertex not in schema. Skipping FIR data.")
                        print(f"     → Add 'Event' vertex type in TigerGraph Studio to enable this.")
                        events_supported = False
                        break

            # --- 5. Intra-Gang Edges (STRICTLY within this gang only) ---
            for p in persons:
                # Own 0–2 accounts from this gang's pool
                for acc in random.sample(accounts, min(len(accounts), random.randint(0, 2))):
                    conn.upsertEdge("Person", p, "OWNS_ACCOUNT", "Account", acc)

                # Use 0–2 devices from this gang's pool
                for dev in random.sample(devices, min(len(devices), random.randint(0, 2))):
                    conn.upsertEdge("Person", p, "USES_DEVICE", "Device", dev)

                # Associate with 1–3 other members of THIS gang only
                others = [x for x in persons if x != p]
                for associate in random.sample(others, min(len(others), random.randint(1, 3))):
                    conn.upsertEdge("Person", p, "ASSOCIATES_WITH", "Person", associate)

                # Link to 0–2 FIR Events (INVOLVED_IN) — only if schema supports it
                if events_supported and events:
                    for evt in random.sample(events, min(len(events), random.randint(0, 2))):
                        try:
                            conn.upsertEdge("Person", p, "INVOLVED_IN", "Event", evt)
                        except Exception:
                            pass

            print(f"  ✅ {gang['name']}: {gang['size']} suspects, {len(accounts)} accounts, {len(devices)} devices, {len(events)} FIRs")

        print(f"\n🚀 SUCCESS! {total_persons} suspects across 4 isolated gangs inserted into TigerGraph.")
        if total_events > 0:
            print(f"   📋 {total_events} FIR Events mapped with INVOLVED_IN edges.")
        else:
            print(f"   ⚠️  FIR Events SKIPPED — 'Event' vertex type not found in schema.")
            print(f"   → Open TigerGraph Studio → Design Schema → Add Vertex 'Event'")
            print(f"   → Attributes: fir_number (STRING), crime_type (STRING), date (STRING), description (STRING)")
            print(f"   → Add Edge: INVOLVED_IN (FROM Person, TO Event)")
            print(f"   → Then re-run this script to backfill FIR records.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ FAILED: {str(e)}")


if __name__ == "__main__":
    generate_synthetic_data()
