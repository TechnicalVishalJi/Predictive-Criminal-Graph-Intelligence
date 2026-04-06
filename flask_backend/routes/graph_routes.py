from flask import Blueprint, jsonify
from services.tigergraph_client import get_tg_connection

graph_bp = Blueprint("graph", __name__)

@graph_bp.route("/network", methods=["GET"])
def get_full_network():
    """
    Returns the entire CriminalGraph as a force-graph-compatible JSON payload.
    React frontend calls GET /api/network on startup to hydrate the 3D map.
    """
    try:
        conn = get_tg_connection()

        nodes = []
        links = []
        seen_links = set()  # Deduplicate edges

        # --- Fetch all Persons ---
        persons = conn.getVertices("Person")
        for p in persons:
            attrs = p.get("attributes", {})
            nodes.append({
                "id": p["v_id"],
                "type": "Person",
                "label": attrs.get("full_name", p["v_id"]),
                "risk_score": round(attrs.get("risk_score", 0), 1),
            })

        # --- Fetch all Accounts ---
        accounts = conn.getVertices("Account")
        for a in accounts:
            attrs = a.get("attributes", {})
            nodes.append({
                "id": a["v_id"],
                "type": "Account",
                "label": f"{attrs.get('bank_name', 'Bank')} •••{a['v_id'][-6:]}",
                "bank_name": attrs.get("bank_name", ""),
            })

        # --- Fetch all Devices ---
        devices = conn.getVertices("Device")
        for d in devices:
            attrs = d.get("attributes", {})
            nodes.append({
                "id": d["v_id"],
                "type": "Device",
                "label": attrs.get("phone_number", d["v_id"]),
                "phone_number": attrs.get("phone_number", ""),
            })

        # --- Fetch edges by iterating each Person ---
        # getEdges(sourceVertexType, sourceVertexId) returns all edges from that vertex
        for p in persons:
            pid = p["v_id"]
            try:
                edges = conn.getEdges("Person", pid)
                for e in edges:
                    src = pid
                    tgt = e.get("to_id", "")
                    etype = e.get("e_type", "")
                    key = f"{src}-{etype}-{tgt}"
                    if key not in seen_links and tgt:
                        seen_links.add(key)
                        links.append({
                            "source": src,
                            "target": tgt,
                            "type": etype,
                        })
            except Exception:
                pass  # Skip if this person has no edges

        return jsonify({"nodes": nodes, "links": links}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@graph_bp.route("/target/<person_id>", methods=["GET"])
def get_target(person_id):
    """
    Returns 1-hop data for a specific person node.
    """
    try:
        conn = get_tg_connection()
        vertex = conn.getVerticesById("Person", [person_id])
        if not vertex:
            return jsonify({"error": "Person not found"}), 404

        attrs = vertex[0].get("attributes", {})
        edges = conn.getEdges("Person", person_id)

        connections = {"accounts": [], "devices": [], "associates": []}
        for e in edges:
            etype = e.get("e_type", "")
            tgt = e.get("to_id", "")
            if etype == "OWNS_ACCOUNT":
                connections["accounts"].append(tgt)
            elif etype == "USES_DEVICE":
                connections["devices"].append(tgt)
            elif etype == "ASSOCIATES_WITH":
                connections["associates"].append(tgt)

        return jsonify({
            "id": person_id,
            "full_name": attrs.get("full_name", "Unknown"),
            "risk_score": attrs.get("risk_score", 0),
            "connections": connections,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


from services.analytics import predict_future_links, simulate_arrest_disruption, calculate_dynamic_risk

@graph_bp.route("/predict_links/<person_id>", methods=["GET"])
def predict_links(person_id):
    """
    Uses NetworkX Jaccard Similarity graph algorithms
    to predict future associations.
    """
    try:
        predictions = predict_future_links(person_id)
        return jsonify({"status": "success", "predictions": predictions}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@graph_bp.route("/analyze_risk/<person_id>", methods=["GET"])
def analyze_risk(person_id):
    """
    Dynamically recalculates risk score using PageRank centrality mathematics.
    """
    try:
        risk_data = calculate_dynamic_risk(person_id)
        return jsonify({"status": "success", "data": risk_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@graph_bp.route("/simulate_disruption/<person_id>", methods=["GET"])
def simulate_disruption(person_id):
    """
    Calculates Betweenness Centrality on target node and measures the network
    fracture/cascade if this node is removed (arrested).
    """
    try:
        disruption_data = simulate_arrest_disruption(person_id)
        return jsonify({"status": "success", "data": disruption_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
