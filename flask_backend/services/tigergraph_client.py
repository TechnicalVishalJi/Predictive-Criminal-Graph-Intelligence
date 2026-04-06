import os
import pyTigerGraph as tg
import requests
from dotenv import load_dotenv

# Load .env variables locally
load_dotenv()

class BearerAuth(requests.auth.AuthBase):
    """ Custom Auth Interceptor to bypass pyTigerGraph Token bugs """
    def __init__(self, token):
        self.token = token
    def __call__(self, r):
        r.headers["Authorization"] = "Bearer " + self.token
        return r

def get_tg_connection():
    """
    Initializes and returns a pyTigerGraph connection using modern Cloud API Tokens 
    while natively patching the _cached_token_auth exception.
    """
    hostname = os.environ.get("TG_HOSTNAME")
    graphname = os.environ.get("TG_GRAPHNAME", "CriminalGraph")
    
    # We will use the TG_TOKEN variable!
    token = os.environ.get("TG_TOKEN") 
    
    if not hostname or not token:
        raise ValueError("Missing TG_HOSTNAME or TG_TOKEN in environment variables.")

    # Setup connection
    conn = tg.TigerGraphConnection(
        host=hostname,
        graphname=graphname,
        apiToken=token
    )
    
    # 🔴 FIX FOR pyTigerGraph Attribute Error 🔴
    # We natively inject the valid Bearer authentication HTTP structure so conn.echo() and 
    # conn.upsertVertex() do not crash looking for the legacy missing attribute.
    conn._cached_token_auth = BearerAuth(token)
    
    return conn
