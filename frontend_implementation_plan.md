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
