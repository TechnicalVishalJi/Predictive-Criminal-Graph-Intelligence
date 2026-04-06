from flask import Blueprint, jsonify
from services.tigergraph_client import get_tg_connection

graph_bp = Blueprint("graph", __name__)

@graph_bp.route("/network/<person_id>", methods=["GET"])
def get_network(person_id):
    """
    Hydrates the 3D Dashboard. 
    Fetches 1st and 2nd degree connections for the person.
    """
    try:
        conn = get_tg_connection()
        # In a real scenario, you'd run a parameterized GSQL query here:
        # e.g., result = conn.runInstalledQuery("GetSuspectNetwork", {"p": person_id})
        
        # Mocking the JSON structure that react-force-graph-3d expects
        mock_graph = {
            "nodes": [
                {"id": person_id, "group": 1, "label": "Target Suspect"},
                {"id": "acc_123", "group": 2, "label": "Bank Account (HDFC)"},
                {"id": "device_999", "group": 3, "label": "Burner Phone"}
            ],
            "links": [
                {"source": person_id, "target": "acc_123", "label": "OWNS_ACCOUNT"},
                {"source": person_id, "target": "device_999", "label": "USES_DEVICE"}
            ]
        }
        return jsonify({"status": "success", "data": mock_graph}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@graph_bp.route("/analyze_syndicate/<person_id>", methods=["GET"])
def analyze_syndicate(person_id):
    """
    Runs PageRank and Louvain locally to find Kingpin.
    """
    try:
        conn = get_tg_connection()
        # Mocking the result of a Louvain/PageRank graph algorithm query
        mock_result = {
            "kingpin_detected": True,
            "kingpin_node_id": "person_88",
            "centrality_score": 0.89,
            "community_size": 14
        }
        return jsonify({"status": "success", "data": mock_result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
