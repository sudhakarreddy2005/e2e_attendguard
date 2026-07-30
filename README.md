# 🎓 AttendGuard
## Enterprise Campus Intelligence & Administrative Copilot Platform

AttendGuard is an enterprise-grade Campus Intelligence Platform combining real-time computer vision surveillance, deep learning face recognition, multi-turn AI administrative copilot workflows, and executive analytics for higher education institutions.

---

## 🚀 Executive Summary

AttendGuard replaces fragmented university monitoring tools with a unified operating system capable of:

- **Automated Face Recognition**: Real-time multi-face recognition, embedding extraction, and quality diagnostics.
- **10-Stage Agentic AI Administrative Copilot**: Powered by LangGraph and Ollama (Qwen 3), presenting clean executive insights with zero internal tool transparency.
- **Institutional Policy RAG Engine**: Grounded policy search via FAISS vector store for student handbooks, circulars, and leave regulations.
- **Executive Analytics & Reporting**: Comparative KPI context, incident hotspot tracking, and exportable PDF/CSV reports.
- **Role-Based Access Control (RBAC)**: Secure access policies for SuperAdmin, Admin, DEO, Faculty, and Security roles.

---

## 🏛️ System Architecture

```text
                                ┌──────────────────────────────────────┐
                                │             React 18 SPA             │
                                │   (TailwindCSS v4, Framer Motion)    │
                                └──────────────────┬───────────────────┘
                                                   │
                                            HTTP / REST API
                                                   │
                                ┌──────────────────▼───────────────────┐
                                │            FastAPI Backend           │
                                │          (Python 3.10 ASGI)          │
                                └──────┬───────────────────────┬───────┘
                                       │                       │
                       ┌───────────────▼────────┐     ┌────────▼──────────────┐
                       │ Vision Pipeline        │     │ 10-Stage Agentic AI   │
                       │ (InsightFace / OpenCV) │     │ (LangGraph / Qwen 3)  │
                       └───────────────┬────────┘     └────────┬──────────────┘
                                       │                       │
                                ┌──────▼───────────────────────▼───────┐
                                │     MongoDB (GuardDB) & FAISS        │
                                └──────────────────────────────────────┘
```

---

## 🤖 10-Stage Agentic AI Pipeline

AttendGuard features an enterprise administrative copilot built on a 10-stage execution graph:

```text
User Query
   │
   ▼
Stage 1: Intent Classifier (intent_classifier_node)
   │
   ▼
Stage 2: Planner (planner_node)
   │
   ▼
Stage 3: Conversation Memory (memory_node)
   │
   ▼
Stage 4: Entity Extractor (entity_extractor_node)
   │
   ▼
Stage 5: Tool Router (tool_router_node)
   │
   ▼
Stage 6: Tool Execution (tool_exec_node)
   │
   ▼
Stage 7: Response Synthesizer (response_synthesizer_node)
   │
   ▼
Stage 8: Response Validator (response_validator_node)
   │
   ▼
Stage 9: Natural Language Formatter (natural_language_formatter_node)
   │
   ▼
Stage 10: Chat UI
```

### 🛠️ The 11 Enterprise AI Tools
Each tool performs one specialized responsibility and returns structured data internally:
1. `AttendanceTool` — Student attendance statistics & bunk audits.
2. `ViolationTool` — Incident records, hotspots, and peak violation hours.
3. `AnalyticsTool` — Departmental performance rankings & bunk anomaly alerts.
4. `StudentTool` — Student academic profile, history, and status lookup.
5. `FacultyTool` — Faculty directory & department HOD contacts.
6. `ReportTool` — Generates formal administrative report templates.
7. `ExportTool` — Prepares PDF/CSV report export metadata.
8. `NotificationTool` — Drafts advisory warning alerts for parents/HODs.
9. `PolicyRAGTool` — FAISS vector search strictly for institutional policy rules.
10. `VisionTool` — Explains face recognition thresholds and detection metrics.
11. `RecommendationTool` — Data-backed administrative action items.

---

## 👁️ Computer Vision Pipeline

```text
Image Input ➔ Preprocessing ➔ Quality Assessment ➔ Detector ➔ Aligner ➔ 128D Embedding ➔ Similarity Engine ➔ Diagnostic Match
```

### Key Capabilities
- **Model Architecture**: InsightFace 128D embedding extraction with L2 Euclidean distance matching.
- **Configured Threshold**: `0.45` distance cutoff for positive verification.
- **Rich Diagnostic Return**:
  - `confidence`: Percentage matching score.
  - `distance`: Cosine & Euclidean similarity distance.
  - `quality_score`: Laplacian variance blur rating + resolution check.
  - `lighting`: Luminance assessment ("Good" vs. "Low Light").
  - `reason`: Explanatory statement for match outcomes.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS v4, Framer Motion, TanStack Query, Recharts |
| **Backend** | FastAPI, Python 3.10, Uvicorn, Motor (Async MongoDB), PyPDF2 |
| **AI / Agentic** | LangGraph, Ollama (Qwen 3), FAISS, SentenceTransformers (`all-MiniLM-L6-v2`) |
| **Computer Vision** | InsightFace, OpenCV, PyTorch, NumPy |
| **Database** | MongoDB 6.0 (`GuardDB`), Redis 7 |
| **Containerization** | Docker, Docker Compose, Nginx |

---

## 📂 Repository Layout

```text
e2e_v3/
├── backend/
│   ├── app/
│   │   ├── ai/            # LangGraph Agentic Engine & 11 Tools
│   │   ├── api/           # FastAPI Routers & Security Endpoints
│   │   ├── core/          # Config, Security, Audit Logging
│   │   ├── repositories/  # Repository Layer for GuardDB
│   │   ├── services/      # Service Layer (Student, Analytics, AI)
│   │   └── vision/        # Face Recognition & Quality Pipeline
│   ├── scripts/           # AI & Database Verification Test Suite
│   ├── storage/           # Training Images, Uploads, Vector Store
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Apple Human Interface Reusable Components
│   │   ├── pages/         # Dashboard, Detect, Violations, Students, Reports
│   │   └── services/      # Axios API Client & State Hooks
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml     # Production Multi-Container Orchestration
├── nginx.conf             # Production Reverse Proxy Config
└── README.md
```

---

## ⚡ Quick Start & Installation

### 1️⃣ Local Development Setup

#### Backend Setup
```bash
cd backend
python3.10 -m venv venv310
source venv310/bin/activate
pip install -r requirements.txt

# Start FastAPI App Server
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- App UI: `http://localhost:5173`
- API Docs: `http://localhost:5000/docs`

---

### 2️⃣ Production Docker Deployment

```bash
docker-compose up -d --build
```

---

## 🧪 Verification Suite

Run the comprehensive AI Layer test suite:

```bash
cd backend
./venv310/bin/python scripts/test_ai_layer.py
```

---

## 🛡️ License & Institutional Governance

Built for higher education administrative surveillance and academic governance.  
© AttendGuard Enterprise.
