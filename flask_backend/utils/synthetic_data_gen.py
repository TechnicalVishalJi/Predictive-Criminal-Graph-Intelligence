import sys, os
import requests
import json
import random
from faker import Faker
from dotenv import load_dotenv

# Ensure we read the local .env
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

fake = Faker('en_IN') # Indian localized fake data for realism

def generate_synthetic_data():
    """
    Generates synthetic suspect, account, and event data.
    Pushes it to TigerGraph dynamically using ultra-reliable Native HTTP Requests
    to completely bypass the pyTigerGraph bugs.
    """
    hostname = os.environ.get("TG_HOSTNAME")
    token = os.environ.get("TG_TOKEN") # Uses your Cloud API Token
    graphname = os.environ.get("TG_GRAPHNAME", "CriminalGraph")

    if not hostname or not token:
        print("FAILED: Missing TG_HOSTNAME or TG_TOKEN in .env")
        return

    # Modern TigerGraph Cloud endpoint mapping
    # Drops the /restpp depending on Cloud V4 architecture, but usually it's /graph
    target_url = f"{hostname}/graph/{graphname}"
    if not hostname.endswith("/"):
        target_url = f"{hostname}/restpp/graph/{graphname}"
        
    print(f"Initiating connection to TigerGraph via Native REST...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Initialize the master Upsert Graph Dictionary
    payload = {
        "vertices": {"Person": {}, "Account": {}, "Device": {}},
        "edges": {"Person": {}}
    }

    persons = []
    accounts = []
    devices = []

    # 1. Create 20 Fake Gang Members
    for i in range(20):
        p_id = f"person_{i}"
        name = fake.name()
        risk = round(random.uniform(10, 99), 1)
        payload["vertices"]["Person"][p_id] = {
            "Name": {"value": name},
            "risk_score": {"value": risk}
        }
        payload["edges"]["Person"][p_id] = {"OWNS_ACCOUNT": {}, "USES_DEVICE": {}, "ASSOCIATES_WITH": {}}
        persons.append(p_id)

    # 2. Create 30 Fake Bank Accounts
    bank_names = ["HDFC", "SBI", "ICICI", "Axis", "Yes Bank"]
    for i in range(30):
        acc_id = f"acc_{fake.bban()}"
        bank = random.choice(bank_names)
        payload["vertices"]["Account"][acc_id] = {
            "bank_name": {"value": bank}
        }
        accounts.append(acc_id)

    # 3. Create 15 Fake Devices
    for i in range(15):
        dev_id = f"imei_{fake.msisdn()}"
        phone = fake.phone_number()
        payload["vertices"]["Device"][dev_id] = {
            "phone_number": {"value": phone}
        }
        devices.append(dev_id)

    print("Vertices built. Mapping Hidden Network Links...")

    # 4. Map the Network (Edges)
    for p in persons:
        # Each person owns accounts
        for acc in random.sample(accounts, random.randint(1, 3)):
            payload["edges"]["Person"][p]["OWNS_ACCOUNT"]["Account"] = {acc: {}}

        # Each person uses devices
        for dev in random.sample(devices, random.randint(0, 2)):
            payload["edges"]["Person"][p]["USES_DEVICE"]["Device"] = {dev: {}}

        # Criminal associations
        for associate in random.sample(persons, random.randint(0, 2)):
            if p != associate:
                payload["edges"]["Person"][p]["ASSOCIATES_WITH"]["Person"] = {associate: {}}

    print("Firing massive payload into the Cloud...")
    try:
        response = requests.post(target_url, headers=headers, json=payload, timeout=20)
        if response.status_code == 200:
            print("---------------------------------------------------------")
            print("🚀 SUCCESS! Network mapped and flooded into TigerGraph!!")
            print("---------------------------------------------------------")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Server rejected the payload. Status Code {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Critical HTTP Failure: {str(e)}")

if __name__ == "__main__":
    generate_synthetic_data()
