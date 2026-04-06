# Project Nexus: Criminal Network & Link Intelligence (V2)

An upgraded, enterprise-grade architecture for an Aatmanirbhar (homegrown) investigation tool. NEXUS doesn't predict who will commit a crime; instead, it is designed to map and uncover hidden connections between known criminals and suspects using graph intelligence. Given existing data, it reveals a suspect's entire network instantly. This version is specifically optimized to win the **TigerGraph Track** at Devcation Delhi 2026 by leveraging TigerGraph's latest v4.2+ features.

## Suggested Improvements
4. **Real-Time Data Streaming:** Simulate live intelligence by creating a lightweight event stream that injects new transactions/FIRs into TigerGraph in real-time.
5. **Geospatial Layer integration:** Add a map view where nodes aren't just abstracts in 3D but bound to Delhi's actual geospatial coordinates.
6. **Temporal Crime Escalation Assessment:** Utilizing Meta-Llama (via Groq) to analyze a suspect's historical timeline and structural graph evolution, the system suggests probable future crimes, escalation paths, and likely targets, moving beyond static mapping into proactive threat intelligence.

## Goal Description & Competitor Analysis

**What NEXUS actually does:** It is an intelligence and investigation tool, not a predictive policing system. It helps officers connect the dots faster on existing data (FIRs, call records, bank transfers) so they can build a stronger case and uncover hidden links in criminal networks.
**The Problem:** Modern criminal syndicates operate in complex, cross-jurisdictional networks. Current Indian police infrastructure (like CCTNS 1.0) relies on siloed relational databases, making it nearly impossible to uncover hidden connections (like a thief in Delhi sharing a bank account with an arms dealer in Punjab) in real-time.

**The Moat:** While enterprise platforms like **Palantir Gotham** cost hundreds of millions of dollars and require highly specialized training, **Project Nexus** is homegrown (Aatmanirbhar), powered natively by AI Generative reasoning (GraphRAG), and utilizes TigerGraph's sub-second multi-hop traversal to map massive criminal networks instantly for a fraction of the cost.

---

## Deployment Strategy
To ensure a flawless live demo and professional portfolio presence, the infrastructure will be deployed as follows:
*   **React Dashboard (Frontend):** Deployed on **Vercel** for lightning-fast edge delivery.
*   **Flask API (Backend):** Deployed on **Render** (as a Web Service running Python + Gunicorn).
*   **Flutter Mobile App:** Automatically or manually built into an `.apk` and hosted on **GitHub Releases**.
*   **Database:** Hosted on **TigerGraph Cloud**.

---

## Backend Implementation Plan (Flask Deep-Dive)

This section details exactly how the `/flask_backend` directory will be structured, the required libraries, and the exact API routes to be built.

### 1. Directory Structure (`/flask_backend`)
```text
flask_backend/
│
├── app.py                     # Main Flask application entry point
├── requirements.txt           # Python dependencies for Render deployment
├── .env                       # Environment variables (API Keys, TG Configs)
│
├── routes/                    # API Endpoints (Blueprints)
│   ├── auth_routes.py         # (Optional) Basic login for the app
│   ├── graph_routes.py        # standard TigerGraph fetch routes
│   ├── ai_routes.py           # Gemini (Embeddings), Groq (LLM) & GraphRAG routes
│
├── services/                  # Core Business Logic
│   ├── tigergraph_client.py   # Initializes `pyTigerGraph` connection
│   ├── ai_rest.py             # Raw requests calls to Gemini API for vectors & Groq API for Meta-Llama chat
│   ├── algorithms.py          # Functions calling PageRank/Louvain in TG
│   └── dossier_generator.py   # PDF synthesis using `reportlab`
│
└── utils/                     # Helpers
    └── synthetic_data_gen.py  # Faker script to populate TigerGraph via REST
```

### 2. Core Dependencies (`requirements.txt`)
We will strictly avoid bloated AI SDKs. The core dependencies will be:
*   `Flask` & `Flask-CORS` (for handling API routing and cross-origin Vercel requests)
*   `requests` (For calling the raw Google Gemini & Groq REST Endpoints)
*   `pyTigerGraph` (Official Python driver for TigerGraph)
*   `reportlab` (For generating the formal PDF Intelligence Dossier)
*   `gunicorn` (Production WSGI server required for **Render** deployment)
*   `python-dotenv` (Local environment variable management)

### 3. Environment Variables (`.env`)
These will be securely injected into Render's dashboard.
*   `GEMINI_API_KEY`: Google Gemini Platform Key.
*   `GROQ_API_KEY`: Groq API Key for Meta-Llama models.
*   `TG_HOSTNAME`: e.g., `https://project-nexus.i.tgcloud.io`
*   `TG_USERNAME` & `TG_PASSWORD`
*   `TG_GRAPHNAME`: e.g., `CriminalGraph`

### 4. Detailed API Endpoints to Build

#### A. Synthetic Data Initialization
*   **Endpoint:** `POST /api/admin/initialize_data`
*   **Logic:** Uses `synthetic_data_gen.py` to generate 5,000+ fake records. It will call `gemini_rest.py` to embed standard suspect physical descriptions into vectors, and heavily insert `TRANSFERRED_MONEY` and `CALLED` edges into TigerGraph to artificially create a "Kingpin Ring" for the demo.

#### B. Semantic Suspect Search (The Mobile App Entrypoint)
*   **Endpoint:** `POST /api/suspects/search`
*   **Payload from Flutter:** `{ "description": "Tall man with a scar working in Karol Bagh" }`
*   **Logic:** 
    1. Sends the string to Gemini Embeddings REST API.
    2. Receives a dense vector array (e.g., `[0.012, -0.34, ...]`).
    3. Executes a TigerGraph native hybrid search query passing the embedding to find the top 5 closest `Person` vertices.
*   **Response:** JSON list of suspects with their basic attributes and mugshot URLs.

#### C. Dashboard Graph Hydration
*   **Endpoint:** `GET /api/graph/network/<person_id>`
*   **Logic:** Calls TigerGraph multi-hop logic to fetch all 1st and 2nd degree connections (`Account`, `Device`, `Event`, `Person`) linked to the given `person_id`. Returns standard JSON graph format (`{nodes: [], links: []}`) for `react-force-graph-3d`.

#### D. Algorithmic Kingpin Discovery
*   **Endpoint:** `GET /api/graph/analyze_syndicate/<person_id>`
*   **Logic:** Triggers TigerGraph Cloud to run installed GSQL algorithms: `Louvain` (to outline the immediate criminal cluster) and `PageRank` over the `TRANSFERRED_MONEY` edges. It flags the vertex with the highest PageRank score as the "Syndicate Kingpin".

#### E. Pure REST GraphRAG Chatbot
*   **Endpoint:** `POST /api/ai/chat`
*   **Payload from React:** `{ "query": "Trace the money flow from the Kingpin to off-shore accounts." }`
*   **Logic (No external SDKs):**
    1. Fetches the database Schema string.
    2. Constructs a raw API prompt: `"Given this TigerGraph schema: [SCHEMA]. Write a GSQL query to answer the user's question: [QUERY]."`. Sends this via Python `requests` to Groq REST API (Meta-Llama model).
    3. Extracts the GSQL from the Groq response.
    4. Executes the GSQL via `pyTigerGraph` against the database.
    5. Feeds the JSON result back to Groq REST API (Meta-Llama): `"Here is the raw graph output: [JSON]. Summarize this investigation for the user naturally."`
*   **Response:** Final AI synthesized text answer.

#### F. Dossier Generation
*   **Endpoint:** `GET /api/dossier/generate/<person_id>`
*   **Logic:** Fetches all data (vector similarities, algorithmic scores, real graph edges). Uses `reportlab` to visually format this into a structured `.pdf`. Returns the raw PDF bytes with `Content-Type: application/pdf` to trigger a download window in the browser/app.

#### G. Temporal Timeline Assessment
*   **Endpoint:** `GET /api/ai/assess_escalation/<person_id>`
*   **Logic:** Fetches the chronological list of crimes and transactions linked to `person_id`. Feeds this exact structural timeline into Groq (Meta-Llama) to analyze pattern escalation (e.g., escalating from petty theft to organized racketeering) and suggest probable next actions and targets based on typical syndicate lifecycles.
*   **Response:** JSON structured assessment report (Timeline analysis, Risk Score, Probable Next Activities).

#### H. Predictive NetworkX Analytics Engine (V2 addition)
*   **Module:** `analytics.py` (Powered by NetworkX, Numpy, Scipy)
*   **`GET /api/predict_links/<id>`**: Re-casts TigerGraph topology into NetworkX physics to calculate Jaccard and Adamic-Adar scores across unconnected nodes for temporal forecasting.
*   **`GET /api/analyze_risk/<id>`**: Normalizes global PageRank centrality network influence algorithms strictly bound between 0-100 to map dynamic operational risk independent of explicit criminal records.
*   **`GET /api/simulate_disruption/<id>`**: Processes Betweenness Centrality limits. Simulates Node destruction, recalculates total cluster structural integrity, and returns precise Capacity Loss metric drops and isolated asset IDs.

---

## User Review Required

> [!IMPORTANT]
> The extensive Flask backend specification and deployment strategy (Vercel/Render/APK) has been formulated. 
> Please review the exact routes and directory structure. Are there any other specific endpoints or logic you want to add to the backend before we shift into executing the Task Checklist?
