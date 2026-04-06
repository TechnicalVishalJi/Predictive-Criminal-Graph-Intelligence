import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Allow CORS for React/Flutter frontends
CORS(app)

from routes.graph_routes import graph_bp
from routes.ai_routes import ai_bp

app.register_blueprint(graph_bp, url_prefix="/api/graph")
app.register_blueprint(ai_bp, url_prefix="/api/ai")

@app.route("/", methods=["GET"])
def health_check():
    """Basic health check endpoint"""
    return jsonify({
        "status": "online",
        "service": "Project Nexus API",
        "version": "v1.0.0"
    }), 200

from utils.synthetic_data_gen import generate_synthetic_data

@app.route("/api/admin/initialize_data", methods=["POST"])
def initialize_data():
    """Generates fake crime data and pushes to TigerGraph"""
    result = generate_synthetic_data()
    status_code = 200 if result["status"] == "success" else 500
    return jsonify(result), status_code

if __name__ == "__main__":
    # Run the application (Gunicorn will be used in production)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
