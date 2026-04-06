
import os
from dotenv import load_dotenv
load_dotenv()
import pyTigerGraph as tg
from requests.auth import HTTPBasicAuth

hostname = os.environ.get("TG_HOSTNAME")
password = os.environ.get("TG_PASSWORD")

conn = tg.TigerGraphConnection(
    host=hostname,
    username="tigergraph",
    password=password,
    graphname="CriminalGraph",
    tgCloud=True
)
conn._cached_token_auth = HTTPBasicAuth("tigergraph", password)

try:
    print(conn.echo())
except Exception as e:
    print("Echo failed: ", e)

