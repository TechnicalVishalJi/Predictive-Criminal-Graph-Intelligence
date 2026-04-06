
import pyTigerGraph as tg
try:
    conn = tg.TigerGraphConnection(host="http://127.0.0.1", username="tigergraph", password="tigergraph")
    print(conn.gsql("ls"))
except Exception as e:
    print(e)

