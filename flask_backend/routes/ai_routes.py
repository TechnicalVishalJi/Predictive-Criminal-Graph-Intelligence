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
    Enterprise GraphRAG Chat using Groq Meta-Llama
    """
    data = request.json
    user_query = data.get("query", "")
    
    try:
        # Step 1: Translate Question to GSQL
        schema_dump = "Vertices: Person, Account, Device. Edges: TRANSFERRED_MONEY, CALLED"
        gsql_prompt = f"Given schema: {schema_dump}. Write a GSQL logic approach to: {user_query}. Only return the concept."
        gsql_plan = generate_groq_completion(prompt=gsql_prompt)
        
        # Step 2: In a real app we run the resulting logic across TigerGraph DB
        mock_db_result = "{'transfers': 5, 'origin': 'person_1', 'dest': 'acc_99'}"
        
        # Step 3: Summarize via Groq
        summary_prompt = f"Graph returned: {mock_db_result}. Summarize this for the investigator naturally."
        final_answer = generate_groq_completion(prompt=summary_prompt)
        
        return jsonify({"status": "success", "answer": final_answer}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

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
