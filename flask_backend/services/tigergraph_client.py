import os
import pyTigerGraph as tg
from dotenv import load_dotenv

load_dotenv()

def get_tg_connection():
    """
    Connects flawlessly to the unrestricted Local TigerGraph Docker Engine.
    Because it runs locally, we DO NOT need Secrets, Tokens, or API Keys.
    Pure localhost connectivity.
    """
    hostname = os.environ.get("TG_HOSTNAME", "http://127.0.0.1")
    username = os.environ.get("TG_USERNAME", "tigergraph")
    password = os.environ.get("TG_PASSWORD", "tigergraph")
    graphname = os.environ.get("TG_GRAPHNAME", "CriminalGraph")

    conn = tg.TigerGraphConnection(
        host=hostname,
        username=username,
        password=password,
        graphname=graphname
    )
    
    # Notice: NO conn.getToken() and NO conn.createSecret() required!
    # Local docker natively bypasses RESTPP auth until you manually enable it.
    
    return conn
