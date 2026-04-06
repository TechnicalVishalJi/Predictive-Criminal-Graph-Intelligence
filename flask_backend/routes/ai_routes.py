from flask import Blueprint, request, jsonify, make_response
from services.ai_rest import get_gemini_embedding, generate_groq_completion
from services.tigergraph_client import get_tg_connection
from services.dossier_generator import create_dossier_pdf

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/suspects/search", methods=["POST"])
def search_suspects():
    """
    Semantic search: take text, get vector from Gemini, query TigerGraph.
    """
    data = request.json
    description = data.get("description", "")
    if not description:
        return jsonify({"status": "error", "message": "Missing description"}), 400
        
    try:
        # 1. Generate Vector
        embedding = get_gemini_embedding(description)
        
        # 2. Query TG Vector Index (Mocked for now)
        conn = get_tg_connection()
        # result = conn.runInstalledQuery("VectorSearch", {"vec": embedding, "k": 5})
        
        mock_result = [
            {"id": "person_1", "name": "Rahul", "similarity": 0.94},
            {"id": "person_2", "name": "Vikas", "similarity": 0.81}
        ]
        
        return jsonify({"status": "success", "matches": mock_result}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route("/chat", methods=["POST"])
def graphrag_chat():
    """
    GraphRAG Chat — React frontend sends { message } and expects { response, highlight_nodes }.
    """
    data = request.json
    # Accept both 'message' (from React) and 'query' (from other clients)
    user_query = data.get("message") or data.get("query", "")

    if not user_query:
        return jsonify({"response": "Please enter a question.", "highlight_nodes": []}), 200

    try:
        # Step 1: Fetch real graph context from TigerGraph
        conn = get_tg_connection()
        persons = conn.getVertices("Person")
        graph_context = "\n".join([
            f"- {p['v_id']}: {p['attributes'].get('full_name','?')} (risk={p['attributes'].get('risk_score',0):.1f})"
            for p in persons[:30]  # Cap to avoid token overflow
        ])

        schema_info = "Graph: Person(full_name, risk_score), Account(bank_name), Device(phone_number). Edges: ASSOCIATES_WITH, OWNS_ACCOUNT, USES_DEVICE."

        # Step 2: Ask Groq with real context
        system_prompt = (
            "You are NEXUS, an elite criminal intelligence AI analyzing a graph database of suspects, "
            "bank accounts, and devices. Be concise, analytical, and help investigators identify threats. "
            "When referencing suspects, use their person IDs from the context."
        )
        prompt = (
            f"Schema: {schema_info}\n\n"
            f"Current suspects in graph:\n{graph_context}\n\n"
            f"Investigator question: {user_query}"
        )

        answer = generate_groq_completion(prompt=prompt, system_prompt=system_prompt)

        # Step 3: Extract any person IDs mentioned in the answer for node highlighting
        highlight_nodes = [p['v_id'] for p in persons if p['v_id'] in answer]

        return jsonify({"response": answer, "highlight_nodes": highlight_nodes}), 200

    except Exception as e:
        return jsonify({"response": f"Error: {str(e)}", "highlight_nodes": []}), 500

@ai_bp.route("/assess_escalation/<person_id>", methods=["GET"])
def assess_escalation(person_id):
    """
    Temporal Trajectory Assessment using timeline data and Groq.
    """
    try:
        # Fetching dummy timeline data
        timeline = "2023: Petty Theft; 2024: Extortion FIR; Early 2025: Opened 5 hawala accounts."
        
        prompt = f"Suspect timeline: {timeline}. Analyze this escalation and suggest probable next targets/activities based on organized crime patterns."
        
        assessment = generate_groq_completion(prompt=prompt, system_prompt="You are a criminal profiling AI estimating trajectory based on historical network data. Be brief.")
        
        return jsonify({"status": "success", "assessment": assessment}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@ai_bp.route("/dossier/generate/<person_id>", methods=["GET"])
def generate_dossier(person_id):
    try:
        person_data = {"name": f"Suspect_{person_id}"}
        network_data = "This individual is linked to 5 dummy accounts and exhibits high centrality indicative of a money laundering node. Trajectory assesses escalation to offshore wire fraud."
        risk_score = 88.5
        
        pdf_bytes = create_dossier_pdf(person_data, network_data, risk_score)
        
        response = make_response(pdf_bytes)
        response.headers.set('Content-Type', 'application/pdf')
        response.headers.set('Content-Disposition', 'attachment', filename=f"{person_id}_dossier.pdf")
        return response
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
