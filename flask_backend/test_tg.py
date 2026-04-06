import os
import time
import pyTigerGraph as tg
from dotenv import load_dotenv

load_dotenv()

server_url = os.environ.get("TG_HOSTNAME", "http://127.0.0.1")
username = os.environ.get("TG_USERNAME", "tigergraph")
password = os.environ.get("TG_PASSWORD", "tigergraph")
graph_name = os.environ.get("TG_GRAPHNAME", "CriminalGraph")

print(f"Testing Unrestricted Local Connection to {server_url} ...")

try:
    conn = tg.TigerGraphConnection(
        host=server_url, 
        username=username, 
        password=password,
        graphname=graph_name
    )
    
    # We test an endpoint that doesn't rely on the Graph Schema existing yet
    print("Checking Database Engine Status...")
    endpoints = conn.getEndpoints()
    
    print("---------------------------------------")
    print("✅ LOCAL DATABASE ENGINE CONNECTED FLAWLESSLY!")
    print(f"Engine is Live. Found {len(endpoints)} available REST endpoints.")
    print("---------------------------------------")

except Exception as e:
    print("---------------------------------------")
    print("❌ CONNECTION FAILED:")
    print("If it says '502 Bad Gateway', the Docker Engine is still booting up (Wait 2 mins).")
    print("Error Details:", str(e))
    print("---------------------------------------")