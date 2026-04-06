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

        # --- Persons ---
        persons = conn.getVertices("Person")
        for p in persons:
            attrs = p.get("attributes", {})
            nodes.append({
                "id": p["v_id"],
                "type": "Person",
                "label": attrs.get("full_name", p["v_id"]),
                "risk_score": attrs.get("risk_score", 0),
            })

        # --- Accounts ---
        accounts = conn.getVertices("Account")
        for a in accounts:
            attrs = a.get("attributes", {})
            nodes.append({
                "id": a["v_id"],
                "type": "Account",
                "label": f"{attrs.get('bank_name', 'Bank')} • {a['v_id'][-6:]}",
                "bank_name": attrs.get("bank_name", ""),
            })

        # --- Devices ---
        devices = conn.getVertices("Device")
        for d in devices:
            attrs = d.get("attributes", {})
            nodes.append({
                "id": d["v_id"],
                "type": "Device",
                "label": attrs.get("phone_number", d["v_id"]),
                "phone_number": attrs.get("phone_number", ""),
            })

        # --- Edges: ASSOCIATES_WITH ---
        aw_edges = conn.getEdges("Person", sourceEdgeType="ASSOCIATES_WITH")
        for e in aw_edges:
            links.append({"source": e["from_id"], "target": e["to_id"], "type": "ASSOCIATES_WITH"})

        # --- Edges: OWNS_ACCOUNT ---
        oa_edges = conn.getEdges("Person", sourceEdgeType="OWNS_ACCOUNT")
        for e in oa_edges:
            links.append({"source": e["from_id"], "target": e["to_id"], "type": "OWNS_ACCOUNT"})

        # --- Edges: USES_DEVICE ---
        ud_edges = conn.getEdges("Person", sourceEdgeType="USES_DEVICE")
        for e in ud_edges:
            links.append({"source": e["from_id"], "target": e["to_id"], "type": "USES_DEVICE"})

        return jsonify({"nodes": nodes, "links": links}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@graph_bp.route("/target/<person_id>", methods=["GET"])
def get_target(person_id):
    """
    Returns 1-hop data for a specific person node (used by mobile app).
    """
    try:
        conn = get_tg_connection()
        vertex = conn.getVerticesById("Person", [person_id])
        if not vertex:
            return jsonify({"error": "Person not found"}), 404

        attrs = vertex[0].get("attributes", {})
        return jsonify({
            "id": person_id,
            "full_name": attrs.get("full_name", "Unknown"),
            "risk_score": attrs.get("risk_score", 0),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@graph_bp.route("/analyze_syndicate/<person_id>", methods=["GET"])
def analyze_syndicate(person_id):
    """
    Mock syndicate analysis endpoint - real PageRank GSQL query to be installed.
    """
    return jsonify({
        "status": "success",
        "data": {
            "kingpin_detected": True,
            "kingpin_node_id": person_id,
            "centrality_score": 0.89,
            "community_size": 14,
        }
    }), 200
