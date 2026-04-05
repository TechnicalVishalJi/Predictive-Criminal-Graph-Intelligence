# Project Nexus: Predictive Criminal Graph Intelligence

This is the comprehensive architecture and execution plan for an Aatmanirbhar (homegrown) "Palantir-killer" intelligence platform powered by TigerGraph, designed to completely obliterate the competition at the IIT Delhi Devathon.

## 1. Goal Description & Competitor Analysis
**The Problem:** Modern criminal syndicates operate in complex, cross-jurisdictional networks. Current Indian police infrastructure (CCTNS 1.0) relies on siloed relational databases, making it nearly impossible to uncover hidden connections (like a thief in Delhi sharing a bank account with an arms dealer in Punjab) in real-time.
**The Moat:** While enterprise platforms like **Palantir Gotham** cost hundreds of millions and require specialized training, **Project Nexus** is homegrown, powered natively by AI Generative reasoning (GraphRAG), and utilizes TigerGraph's sub-second multi-hop traversal to map criminal networks instantly.

---

## 2. The End-to-End Demo Workflow (The "God-Mode" Pitch)
We have engineered a demo flow that proves full-stack mastery and enterprise readiness:

*   **Phase A: The Mobile Field Scanner:** You (acting as the Field Officer) open a mobile web-app on your phone. You scan a suspect's face and hit "Run Background Check."
*   **Phase B: The Command Center Explosion:** The phone API hits the backend. Instantly, the main projector screen (a dark-themed, cinematic Palantir-style dashboard) reacts. A `react-force-graph-3d` visualization expands on the screen, mapping the suspect to all known associates, bank accounts, and FIRs.
*   **Phase C: The Time Machine (Temporal Slider):** The Pitching Analyst grabs a timeline slider at the bottom of the UI. Dragging it from Jan 2024 to April 2024 physically animates the graph, showing how the criminal syndicate evolved and recruited members over time.
*   **Phase D: Natural Language Graph Query:** Instead of writing SQL, the Analyst uses the sidebar chat: *"Aegis, find the shortest financial link between this suspect and the Lashkar terror cell."* An LLM converts this to native TigerGraph GSQL, returning the 4-hop link, which turns glowing red on the 3D map.
*   **Phase E: The Takedown (Dossier Gen):** The Analyst clicks "Generate Warrant." The LLM synthesizes the graph evidence into a formal PDF Intelligence Dossier. Simultaneously, a concise 2-sentence tactical warning alert is pushed back down to the Officer's mobile phone.

---

## 3. Proposed Architecture & Stack

### [Component 1: TigerGraph Core (The Brain)]
*   **Schema (Temporal Enabled):** 
    *   **Vertices:** `Person` (Suspect/Officer), `Device` (Phone IMEI), `Event` (FIR), `Account` (Bank).
    *   **Edges (With Timestamps):** `CALLED (Timestamp)`, `TRANSFERRED_MONEY`, `ATTENDED_EVENT`.
*   **Built-in Algorithms:** We will leverage TigerGraph's native Shortest Path and Centrality algorithms.

### [Component 2: Backend API (Python FastAPI + GraphRAG)]
*   **TigerGraph Integration:** Connected via `pyTigerGraph`.
*   **Agentic NLP Engine:** Uses OpenAI/Anthropic to translate English text from the frontend chat into executable GSQL graph queries, and back into English summaries for the PDF/Mobile app.
*   **Dossier Generator:** Automates the creation of a downloadable legal PDF using `reportlab`.

### [Component 3: Command Center UI (Frontend)]
*   **Visual Framework:** React + Vite.
*   **3D Graph:** `react-force-graph-3d` for rendering massive, glowing networks.
*   **UI Components:** A dark-mode sidebar with the Agentic Chatbox, a Temporal Slider component, and manual deep-dive node inspectors.
*   **Mobile View:** A responsive React route acting as the "Officer App."

---

## 4. User Review Required

> [!IMPORTANT]
> **This is the final, comprehensive plan.**
> Please provide your final approval. Once confirmed, I will immediately begin initializing the React/Python directories and writing the synthetic Indian crime dataset generator. 

## 5. Verification Plan
*   Run the synthetic data Python logic and ingest 10,000 realistic edges into TigerGraph.
*   Manually test the end-to-end flow: Phone button -> Backend -> Graph retrieval -> Summary alert back to phone.
*   Verify the NLU engine successfully maps a natural language query ("Find connections to John") into a functioning TigerGraph short-path algorithm call.
