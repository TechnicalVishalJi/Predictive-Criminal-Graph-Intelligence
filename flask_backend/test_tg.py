import os
from dotenv import load_dotenv

# Load the keys from .env
load_dotenv()

from services.tigergraph_client import get_tg_connection

def test_connection():
    print("--------------------------------------------------")
    print(f"Testing connection to: {os.environ.get('TG_HOSTNAME')}")
    print(f"Graph Name: {os.environ.get('TG_GRAPHNAME')}")
    print("--------------------------------------------------")
    
    try:
        conn = get_tg_connection()
        print("✅ SUCCESS! Authentication passed and Token received.")
        
        # Ping the server to ensure active communication
        ping_res = conn.echo()
        print(f"✅ SUCCESS! Server responded with: {ping_res}")
        print("--------------------------------------------------")
        print("TigerGraph is ready for Project Nexus!")
        
    except Exception as e:
        print("❌ FAILED to connect.")
        print("Error details:")
        print(str(e))
        print("--------------------------------------------------")
        print("Check your .env file to ensure TG_HOSTNAME has https://, and username/password are perfectly correct.")

if __name__ == "__main__":
    test_connection()
