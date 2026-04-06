# App Implementation Plan (Field Officer - Mobile)

## Overview
The **Flutter Field Officer App** acts as the tactical execution terminal for boots on the ground. Because field officers operate on 4G/LTE limits, mobile interfaces cannot load millions of 3D WebGL data points. Instead, this app focuses on blazing-fast target dossier lookups, immediate tactical risk scores, and quick AI responses.

## Core Technology Stack
- **Framework:** Flutter (Dart) for native iOS and Android Hackathon demos.
- **Visuals:** Material Design 3 with custom Dark Mode layouts.
- **Location:** `/flutter_app` directory (to be created outside `flask_backend`).

## Page Architecture (3 Core Screens)

### 1. Global Scan UI (Home Page)
- **UI Placement:** Clean, minimalist search screen prioritizing speed.
- **Features:** 
  - A massive universal search bar (Search by Name, IMEI Phone number, or Bank Account).
  - Displays a feed of globally flagged active "Red List" suspects in the immediate grid format below the search.

### 2. The Tactical Dossier (Profile Page)
- **UI Placement:** Opens when an officer taps a suspect from the Search results.
- **Features:**
  - Fast, flattened JSON parsing rendering critical data: Exact Risk Score widget, Phone Numbers (Device vertices fetched 1-hop away), and Bank Accounts.
  - Generates a simple, lightweight 3-hop "Associate Chain" tree using standard Flutter Expansion Tiles (No heavy physics graphs, just clean list structures referencing who this suspect touches).

### 3. The Pocket Co-Pilot (AI Screen)
- **UI Placement:** Bottom navigation bar tab.
- **Features:**
  - A fast SMS-style chat window connected directly to the Groq LLM backend.
  - Officers can type: *"Give me a summary of [Person X]"*, and the Flask backend fetches their targeted graph cluster, summarizes it via AI, and pushes back a clean 2-sentence tactical summary for the officer to read while walking.

---

## Flask API Requirements for Mobile App
The Mobile app absolutely MUST NOT load `/api/network` (Global Structural Payload), otherwise it will crash the phone's memory. Instead it uses targeted micro-endpoints:
1. **`GET /api/target/<id>`:** Fetches exactly 1 suspect and their immediate 1-hop edges.
2. **`GET /api/alerts`:** Pushes real-time new flags to the Home feed.
3. **`POST /api/chat/tactical`:** Specifically compressed LLM responses optimized for reading on small screens without complex UI mapping hooks.
