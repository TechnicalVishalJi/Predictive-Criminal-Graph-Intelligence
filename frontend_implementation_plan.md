# Frontend Implementation Plan (Command Center - Web)

## Overview
The **ReactJS Command Center** serves as the omniscient strategic headquarters for high-level analysts. It is designed to handle heavy DOM processing, complex WebGL 3D physics, and infinite-canvas data manipulations that would be too intensive for a mobile device.

## Core Technology Stack
- **Framework:** React.js (via Vite for maximum compilation speed)
- **Visuals:** Vanilla CSS (Glassmorphism), `react-force-graph-3d`
- **Location:** `/frontend` directory

## Page Architecture (1-Page SPA)
To ensure zero loading delays during high-stakes investigations, the entire Web Command Center is built as a Single Page Application with dynamic, hovering glass components.

---

### Central Hub: The 3D Intelligence Matrix
- **UI Placement:** Full-screen background layout.
- **Functionality:** 
  - Physically renders the entire `CriminalGraph` in a 3D WebGL space.
  - Color-codes nodes dynamically (Red = High Risk, Blue = Low Risk Person, Green = Bank Account).
  - Infinite scroll zoom, target tracking, and 60fps physics drag.

### Left Glass Overlay: Entity Inspector
- **UI Placement:** Frosted glass panel locked to the Left edge of the screen.
- **Features:**
  - **Global Search Bar:** Type a name or phone number to instantly snap the 3D camera to that node.
  - **Dossier Manifest:** When a node in the 3D space is clicked, this panel expands to show exact details (Risk Score, Full Name, Connected Bank Accounts, Known Associates). It fetches targeted 1-hop data from Flask APIs.

### Right Glass Overlay: Groq AI Co-Pilot (GraphRAG)
- **UI Placement:** Frosted glass panel locked to the Right edge.
- **Features:**
  - **Interrogation Terminal:** A chat interface specifically designed to talk to the Groq LLM. Analysts can ask complex intelligence questions ("Who is the main link between Person A and Person B?").
  - **Interactive Responses:** The AI not only returns text but can trigger the 3D map to highlight the exact suspects it is discussing.

---

## Flask API Requirements for Frontend
1. **`GET /api/network`:** Pulls the global structural nodes to render the 3D sphere.
2. **`POST /api/chat`:** Tunnels the web chat into the Groq API pipeline.

---

## Implemented Features & Test Guide

> Status as of build completion. All features below are LIVE at `http://localhost:5173`.

### Domain Glossary (for evaluators)
| Term | Meaning |
|---|---|
| **Risk Score (0–100)** | How dangerous this person IS to society. High = kingpin/gang leader actively threatening others. NOT danger to the person themselves. |
| **Suspect (Person node)** | Individual under criminal investigation (money laundering, organized crime, drug trafficking, etc.) |
| **Bank Account (Account node)** | Financial account linked to a suspect — used to track hawala transactions and money laundering flows |
| **Device (Device node)** | A mobile phone tracked by IMEI or number. A single burner phone shared by multiple suspects reveals secret communication networks |

---

### Feature 1: 3D Physics Graph Engine
- **Location:** Full-screen background
- **What it does:** Renders all TigerGraph suspects, accounts, and devices as glowing 3D orbs in a live WebGL physics simulation
- **Color coding:**
  - 🔴 **Red** = Critical threat (risk > 75) — Suspected kingpin / gang leader
  - 🟠 **Orange** = Elevated threat (risk 40–75) — Known criminal associate
  - 🔵 **Cyan** = Person of interest (risk < 40) — Fringe connection
  - 🟡 **Amber** = Bank Account node
  - 🟣 **Purple** = Communication Device (Phone / IMEI)
- **Controls:** Click + drag rotates, scroll wheel zooms, right-click drag pans
- **Data source:** Live from TigerGraph via `GET /api/network`

### Feature 2: Suspect Dossier Inspector (Left Panel)
- **Location:** Slides in from left edge when a node is clicked
- **What it does:** Shows a full intelligence dossier:
  - Node type badge (Suspect / Bank Account / Communication Device)
  - Full name and internal ID
  - **Threat score** with animated color-coded progress bar
  - Plain-English threat description ("Suspected kingpin or gang leader")
  - **Known Associates** — other suspects directly connected
  - **Bank Accounts** this suspect owns
  - **Devices** this suspect uses
- **Trigger:** Click any node in the 3D graph

### Feature 2.5: Intelligence Analytics Controls
- **Location:** Inside the Suspect Dossier (Left Panel), physically positioned natively inside the `EntityInspector.jsx` component below the known connections limit.
- **What it does:** Adds three core interactive Buttons firing Axios requests directly to the mathematical Flask analytical endpoints:
  - **Predict Future Links** triggers temporal Jaccard math and alters the `GraphMap` to spawn pulsating, glowing 1.6x sized yellow prediction targets.
  - **Dynamic Risk Recalculate** triggers PageRank influence parsing and drops math state directly back to the visual renderer to update the selected orb's active Threat Level / Color without reloading.
  - **Simulate Target Arrest** triggers Betweenness Centrality mathematics. The UI traps the `capacityLoss` response to render a Red Alert UI block cleanly in the DOM without using a browser alert, while the 3D WebGL engine shatters the targeted node into a dark wireframe simulation mode.

### Feature 3: Global Search (Top Navigation Bar)
- **Location:** Center of top navigation bar
- **What it does:** Type a suspect name → the 3D camera **smoothly flies** to that node and centers on it
- **Test with:** Type any first name from the graph (e.g. "Arjun", "Priya")

### Feature 4: Live Statistics Bar (Bottom)
- **Location:** Bottom center of screen
- **What it does:** Real-time entity count badges showing:
  - Total Suspects in database
  - Total Bank Accounts tracked
  - Total Communication Devices flagged
  - Total connections (graph edges) mapped
- **Data source:** Computed from `GET /api/network` response

### Feature 5: High-Risk Alert Counter (Top Navigation)
- **Location:** Top-right of navigation bar
- **What it does:** Shows a live count of suspects with risk score > 75 (critical threats)
- **Updates:** Automatically when graph data loads

### Feature 6: Groq AI Co-Pilot (Right Panel)
- **Location:** Right floating glass panel (always visible)
- **What it does:** Full criminal intelligence chat powered by **Groq Meta-Llama 3.3 70B**
  - Receives the real suspect list from TigerGraph as context
  - Answers complex investigation questions in natural language
  - Highlights mentioned suspects as **white nodes** in the 3D graph
- **Hint chips available:** "Who is highest risk?", "Find all syndicates", "Map financial flows"
- **Backend:** `POST /api/chat` → TigerGraph context fetch → Groq LLM → response

### Feature 7: Hover Tooltips
- **Location:** Appears when hovering over any node in the 3D graph
- **What it shows:**
  - Node type (Suspect / Bank Account / Communication Device)
  - Name or account label
  - Threat level (CRITICAL / ELEVATED / LOW) with numeric score
  - Plain-English explanation of what that level means
