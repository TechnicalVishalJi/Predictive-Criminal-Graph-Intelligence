import os
from dotenv import load_dotenv
load_dotenv()
import pyTigerGraph as tg

hostname = os.environ.get("TG_HOSTNAME")
password = os.environ.get("TG_PASSWORD")

print(f"Connecting to {hostname} ...")
conn = tg.TigerGraphConnection(
    host=hostname,
    username="tigergraph",
    password=password,
    graphname="CriminalGraph"
)
try:
    print(conn.echo())
except Exception as e:
    print("Echo without tgCloud failed: ", e)

conn2 = tg.TigerGraphConnection(
    host=hostname,
    username="tigergraph",
    password=password,
    graphname="CriminalGraph",
    tgCloud=True
)

try:
    print("Echo with tgCloud:")
    print(conn2.echo())
except Exception as e:
    print("Echo with tgCloud failed: ", e)

# Let's inspect the object
print("Attributes of conn2:")
print(dir(conn2))
