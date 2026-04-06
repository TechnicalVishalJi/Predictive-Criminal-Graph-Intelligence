from flask import Blueprint, jsonify
from services.tigergraph_client import get_tg_connection
import math, random

graph_bp = Blueprint("graph", __name__)

# Spatial zone centers for each gang cluster (units in 3D space).
# Keeps isolated graph components from all initializing at origin.
GANG_ZONES = {
    "GANG_ALPHA":   {"cx":  350, "cy":  150, "cz":  0},
    "GANG_BRAVO":   {"cx": -350, "cy":  150, "cz":  0},
    "GANG_CHARLIE": {"cx":    0, "cy": -350, "cz":  0},
    "LONE_WOLVES":  {"cx":    0, "cy":  350, "cz":  200},
}
JITTER = 80  # Random spread within each zone so nodes don't stack

def get_initial_position(node_id: str) -> dict:
    """Derive a spatial starting position from the node's gang prefix."""
    for gang_key, zone in GANG_ZONES.items():
        if gang_key in node_id:
            return {
                "x": zone["cx"] + random.uniform(-JITTER, JITTER),
                "y": zone["cy"] + random.uniform(-JITTER, JITTER),
                "z": zone["cz"] + random.uniform(-JITTER, JITTER),
            }
    # Fallback for any unknown node — place randomly near centre
    return {
        "x": random.uniform(-100, 100),
        "y": random.uniform(-100, 100),
        "z": random.uniform(-100, 100),
    }

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
            pos = get_initial_position(p["v_id"])
            nodes.append({
                "id": p["v_id"],
                "type": "Person",
                "label": attrs.get("full_name", p["v_id"]),
                "risk_score": round(attrs.get("risk_score", 0), 1),
                **pos,
            })

        # --- Fetch all Accounts ---
        accounts = conn.getVertices("Account")
        for a in accounts:
            attrs = a.get("attributes", {})
            pos = get_initial_position(a["v_id"])
            nodes.append({
                "id": a["v_id"],
                "type": "Account",
                "label": f"{attrs.get('bank_name', 'Bank')} •••{a['v_id'][-6:]}",
                "bank_name": attrs.get("bank_name", ""),
                **pos,
            })

        # --- Fetch all Devices ---
        devices = conn.getVertices("Device")
        for d in devices:
            attrs = d.get("attributes", {})
            pos = get_initial_position(d["v_id"])
            nodes.append({
                "id": d["v_id"],
                "type": "Device",
                "label": attrs.get("phone_number", d["v_id"]),
                "phone_number": attrs.get("phone_number", ""),
                **pos,
            })

        # --- Fetch edges by iterating each Person ---
        # getEdges(sourceVertexType, sourceVertexId) returns all edges from that vertex
        # NOTE: INVOLVED_IN edges (to Event nodes) are excluded here because Event vertices
        # are not rendered in the 3D graph — they are fetched separately via /api/target/<id>.
        # Including them would create 29 ghost origin-pinned nodes breaking the visualization.
        VISUAL_EDGE_TYPES = {"OWNS_ACCOUNT", "USES_DEVICE", "ASSOCIATES_WITH"}
        for p in persons:
            pid = p["v_id"]
            try:
                edges = conn.getEdges("Person", pid)
                for e in edges:
                    src = pid
                    tgt = e.get("to_id", "")
                    etype = e.get("e_type", "")
                    if etype not in VISUAL_EDGE_TYPES:
                        continue  # Skip INVOLVED_IN and any future non-visual edges
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
    Returns 1-hop data for a specific person node, including criminal FIR records.
    """
    try:
        conn = get_tg_connection()
        vertex = conn.getVerticesById("Person", [person_id])
        if not vertex:
            return jsonify({"error": "Person not found"}), 404

        attrs = vertex[0].get("attributes", {})
        edges = conn.getEdges("Person", person_id)

        connections = {"accounts": [], "devices": [], "associates": []}
        fir_event_ids = []

        for e in edges:
            etype = e.get("e_type", "")
            tgt = e.get("to_id", "")
            if etype == "OWNS_ACCOUNT":
                connections["accounts"].append(tgt)
            elif etype == "USES_DEVICE":
                connections["devices"].append(tgt)
            elif etype == "ASSOCIATES_WITH":
                connections["associates"].append(tgt)
            elif etype == "INVOLVED_IN":
                fir_event_ids.append(tgt)

        # Fetch criminal record details from Event vertices
        criminal_records = []
        for evt_id in fir_event_ids:
            try:
                evt_vertices = conn.getVerticesById("Event", [evt_id])
                if evt_vertices:
                    ev = evt_vertices[0].get("attributes", {})
                    criminal_records.append({
                        "fir_number": ev.get("fir_number", evt_id.upper()),
                        "crime_type": ev.get("crime_type", "Unknown"),
                        "date": ev.get("date", "N/A"),
                        "description": ev.get("description", ""),
                    })
            except Exception:
                pass

        return jsonify({
            "id": person_id,
            "full_name": attrs.get("full_name", "Unknown"),
            "risk_score": attrs.get("risk_score", 0),
            "connections": connections,
            "criminal_records": criminal_records,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@graph_bp.route("/timeline/<person_id>", methods=["GET"])
def get_timeline(person_id):
    """
    Generates a realistic 12-month activity timeline for a suspect,
    derived from their existing TigerGraph connections.
    """
    import random
    from datetime import datetime, timedelta

    MEANS_BY_EDGE = {
        "OWNS_ACCOUNT": ["Bank Account Opened", "Financial Transaction Detected", "Wire Transfer Flagged"],
        "USES_DEVICE": ["IMEI Registration", "Burner Phone Activity", "SIM Card Swap Detected"],
        "ASSOCIATES_WITH": ["Surveillance Sighting", "Known Contact Established", "Call Record Match"],
        "INVOLVED_IN": ["FIR Filed", "Arrested & Released", "Named in Chargesheet"],
    }

    try:
        conn = get_tg_connection()
        vertex = conn.getVerticesById("Person", [person_id])
        if not vertex:
            return jsonify({"error": "Person not found"}), 404

        edges = conn.getEdges("Person", person_id)

        now = datetime.now()
        one_year_ago = now - timedelta(days=365)
        events = []

        # Seed random with person_id so timeline is deterministic per suspect
        rng = random.Random(hash(person_id) % (2**32))

        for e in edges:
            etype = e.get("e_type", "")
            tgt = e.get("to_id", "")
            if etype not in MEANS_BY_EDGE:
                continue

            means = rng.choice(MEANS_BY_EDGE[etype])
            days_ago = rng.randint(0, 365)
            event_date = one_year_ago + timedelta(days=days_ago)

            events.append({
                "date": event_date.strftime("%Y-%m-%d"),
                "edge_type": etype,
                "means": means,
                "target_id": tgt,
                "note": _generate_note(etype, tgt, means),
            })

        # Sort chronologically
        events.sort(key=lambda x: x["date"])
        return jsonify({"status": "success", "timeline": events}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _generate_note(etype, target_id, means):
    short_id = target_id.split("_")[-1] if "_" in target_id else target_id
    if etype == "OWNS_ACCOUNT":
        return f"{means} — linked to account •••{short_id[:6]}"
    if etype == "USES_DEVICE":
        return f"{means} — IMEI/phone {short_id[:8]}"
    if etype == "ASSOCIATES_WITH":
        return f"{means} — with suspect ID {short_id}"
    if etype == "INVOLVED_IN":
        return f"{means} — Case No. {target_id.split('_')[-1].upper()}"
    return means


from flask import request as flask_request
import uuid

@graph_bp.route("/add_target", methods=["POST"])
def add_target():
    """
    Dynamically inserts a new suspect into TigerGraph from the FIR Intake form.
    Optionally links them to an existing gang member.
    """
    try:
        data = flask_request.json or {}
        full_name = data.get("full_name", "Unknown Suspect").strip()
        risk_score = float(data.get("risk_score", 30))
        gang_id = data.get("gang_id", "")
        intake_note = data.get("intake_note", "")

        # Generate deterministic-looking ID
        new_id = f"person_INTAKE_{uuid.uuid4().hex[:8].upper()}"

        conn = get_tg_connection()
        conn.upsertVertex("Person", new_id, {
            "full_name": full_name,
            "risk_score": round(risk_score, 1),
        })

        # If a known gang was specified, link to one existing member of that gang
        if gang_id:
            try:
                existing = conn.getVertices("Person")
                gang_members = [p["v_id"] for p in existing if gang_id in p["v_id"] and p["v_id"] != new_id]
                if gang_members:
                    import random
                    anchor = random.choice(gang_members[:5])
                    conn.upsertEdge("Person", new_id, "ASSOCIATES_WITH", "Person", anchor)
            except Exception:
                pass

        return jsonify({
            "status": "success",
            "id": new_id,
            "full_name": full_name,
            "risk_score": risk_score,
            "type": "Person",
            "label": full_name,
            "intake_note": intake_note,
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

from flask import send_file
from services.dossier_generator import generate_dossier_pdf

@graph_bp.route("/dossier/generate/<person_id>", methods=["GET"])
def download_dossier(person_id):
    """
    Synthesizes a full formal law enforcement PDF document containing the node's profile,
    threat levels, and mathematical 1-hop dependencies.
    """
    try:
        pdf_buffer = generate_dossier_pdf(person_id)
        return send_file(
            pdf_buffer,
            as_attachment=True,
            download_name=f"NEXUS_DOSSIER_{person_id}.pdf",
            mimetype="application/pdf"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
