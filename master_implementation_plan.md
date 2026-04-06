# Project Nexus: Criminal Network & Link Intelligence (V2)

An upgraded, enterprise-grade architecture for an Aatmanirbhar (homegrown) investigation tool. NEXUS doesn't predict who will commit a crime; instead, it is designed to map and uncover hidden connections between known criminals and suspects using graph intelligence. Given existing data, it reveals a suspect's entire network instantly. This version is specifically optimized to win the **TigerGraph Track** at Devcation Delhi 2026 by leveraging TigerGraph's latest v4.2+ features.

## Goal Description & Competitor Analysis

**What NEXUS actually does:** It is an intelligence and investigation tool, not a predictive policing system. It helps officers connect the dots faster on existing data (FIRs, call records, bank transfers) so they can build a stronger case and uncover hidden links in criminal networks.
**The Problem:** Modern criminal syndicates operate in complex, cross-jurisdictional networks. Current Indian police infrastructure (like CCTNS 1.0) relies on siloed relational databases, making it nearly impossible to uncover hidden connections (like a thief in Delhi sharing a bank account with an arms dealer in Punjab) in real-time.

**The Moat:** While enterprise platforms like **Palantir Gotham** cost hundreds of millions of dollars and require highly specialized training, **Project Nexus** is homegrown (Aatmanirbhar), powered natively by AI Generative reasoning (GraphRAG), and utilizes TigerGraph's sub-second multi-hop traversal to map massive criminal networks instantly for a fraction of the cost.

---

## Suggested Improvements over V1 (The "Winning" Edge)

1. **Native Vector Search with Gemini Embeddings:** We will generate vector embeddings for suspect physical descriptions and MOs. Instead of using heavy SDKs, we will make direct **REST API calls** to Google Gemini to keep the backend lightweight and custom. These vectors are stored directly in TigerGraph.
2. **Advanced Graph Algorithms:** Incorporate **Louvain Modularity** for community detection (automatically discovering isolated criminal sub-rings) and **PageRank / Betweenness Centrality** to identify the most critical nodes ("Kingpins" or money mules).
3. **Custom GraphRAG Architecture:** We will build our own GraphRAG logic from scratch using Flask and raw REST API requests to Groq (using Meta-Llama models) for natural language reasoning, avoiding bloated libraries. This proves to the judges that we understand the raw mechanics of RAG and graph DBs.
4. **Real-Time Data Streaming:** Simulate live intelligence by creating a lightweight event stream that injects new transactions/FIRs into TigerGraph in real-time.
5. **Geospatial Layer integration:** Add a map view where nodes aren't just abstracts in 3D but bound to Delhi's actual geospatial coordinates.
6. **Temporal Crime Escalation Assessment:** Utilizing Meta-Llama (via Groq) to analyze a suspect's historical timeline and structural graph evolution, the system suggests probable future crimes, escalation paths, and likely targets, moving beyond static mapping into proactive threat intelligence.

---

## What are we storing in the Database? (The Graph Schema)

### Vertices (The Entities)
*   **`Person`**: `uuid`, `name`, `age`, `risk_score`, `physical_description_embedding` (List of Floats).
*   **`Account`**: `account_no`, `bank_name`, `branch_ifsc`, `current_balance`.
*   **`Device`**: `imei_number`, `phone_number`, `carrier`.
*   **`Event`**: `fir_number`, `crime_type`, `date`, `description`.

### Edges (The Relationships)
*   **`TRANSFERRED_MONEY` (Account → Account)**: `amount` (Float), `timestamp` (DateTime), `transaction_id`. 
*   **`OWNS_ACCOUNT` (Person → Account)**
*   **`USES_DEVICE` (Person → Device)**
*   **`INVOLVED_IN` (Person → Event)**: `role` (Suspect, Victim, Witness).
*   **`CALLED` (Device → Device)**: `duration`, `timestamp`.

---

## The End-to-End Demo Workflow (The "God-Mode" Pitch)

*   **Phase A: Semantic Mobile Intake:** The Field Officer uses the **Flutter App** to input a suspect's description. The Flask API generates an embedding (via Gemini REST API) and queries TigerGraph for hybrid semantic-graph matches.
*   **Phase B: The Command Center Explosion:** The **ReactJS Dashboard** visualizes the suspect's network in a `react-force-graph-3d` layout with an active map.
*   **Phase C: Algorithmic Kingpin Discovery:** TigerGraph instantly runs community detection and PageRank to single out the syndicate's mastermind, presented in the dashboard.
*   **Phase D: Enterprise GraphRAG Chat:** The Analyst queries the chat: *"Aegis, trace the financial flow..."* The Flask API builds a prompt, queries the Groq REST API (Meta-Llama) for GSQL conversion, and runs it on the TigerGraph Cloud instance.
*   **Phase E: The Takedown (PDF Dossier):** Finally, a formal PDF dossier is generated with mugshot, key stats, and alias accounts.

---

## Technical Stack & Architecture

### 1. Database Layer
*   **TigerGraph Cloud (v4.2+)**: Cloud-hosted instance for effortless demoing and high availability.

### 2. Backend API
*   **Framework**: Python `Flask`.
*   **Integration Approach**: 
    *   No external AI python libraries (e.g., no `google-generativeai`, no `groq`, no `langchain`).
    *   AI queries handled purely via Python's standard `requests` module (targeting Gemini REST APIs for embeddings, and Groq REST APIs with Meta-Llama for chat/GraphRAG).
    *   `pyTigerGraph` for pure graph communication.

### 3. Frontend / User Interfaces
Both UI platforms will reside inside the unified Git repository in separate directories.
*   **Command Center UI (Web)**: Built using **ReactJS** to handle the heavy 3D DOM manipulations (`react-force-graph-3d`) and data analysis rendering.
*   **Field Officer App (Mobile)**: Built using **Flutter** for cross-platform (iOS/Android) mobile native performance.
