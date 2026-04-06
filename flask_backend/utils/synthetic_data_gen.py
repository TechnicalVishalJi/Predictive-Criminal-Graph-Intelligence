import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import random
from faker import Faker
from services.tigergraph_client import get_tg_connection

fake = Faker('en_IN') 

def generate_synthetic_data():
    """
    Now that we are on Unrestricted Local Docker, we can blitz the Engine
    with native pyTigerGraph functions at maximum speed!
    """
    print("Initiating Native connection to Local TigerGraph...")
    try:
        conn = get_tg_connection()
        print("Authenticated! Upserting vertices into CriminalGraph...")
        
        persons, accounts, devices = [], [], []

        for i in range(20):
            p_id = f"person_{i}"
            # Notice: Changed 'Name' to 'full_name' to bypass TigerGraph reserved keyword restrictions
            conn.upsertVertex("Person", p_id, {"full_name": fake.name(), "risk_score": round(random.uniform(10, 99), 1)})
            persons.append(p_id)

        for i in range(30):
            acc_id = f"acc_{fake.bban()}"
            conn.upsertVertex("Account", acc_id, {"bank_name": random.choice(["HDFC", "SBI", "ICICI", "Axis"])})
            accounts.append(acc_id)

        for i in range(15):
            dev_id = f"imei_{fake.msisdn()}"
            conn.upsertVertex("Device", dev_id, {"phone_number": fake.phone_number()})
            devices.append(dev_id)

        for p in persons:
            for acc in random.sample(accounts, random.randint(1, 3)):
                conn.upsertEdge("Person", p, "OWNS_ACCOUNT", "Account", acc)
            for dev in random.sample(devices, random.randint(0, 2)):
                conn.upsertEdge("Person", p, "USES_DEVICE", "Device", dev)
            for associate in random.sample(persons, random.randint(0, 2)):
                if p != associate:
                    conn.upsertEdge("Person", p, "ASSOCIATES_WITH", "Person", associate)

        print("🚀 SUCCESS! Network locally mapped into TigerGraph!!")
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")

if __name__ == "__main__":
    generate_synthetic_data()
