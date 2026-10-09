# VeriFi AI — Setup & Deployment Guide

This guide details environment configuration, database setup, dependencies, and local development for both the FastAPI backend and Next.js frontend.

---

## 1. Prerequisites

- **Python:** 3.10, 3.11, 3.12, 3.13, or 3.14
- **Node.js:** 18.x, 20.x, or 22.x (with npm 9+)
- **Docker:** (Optional, for running local Neo4j Community Edition container)
- **AWS Account:** (Optional, for Amazon Bedrock Claude 3 and S3 Bucket; seamless local mock fallback is enabled by default)

---

## 2. Neo4j Graph Database Setup

### Option A: Running via Docker (Recommended)
```bash
docker run -d \
  --name verifi-neo4j \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/verifi_secure_password \
  neo4j:5-community
```
- Open `http://localhost:7474` in your browser.
- Default credentials: User `neo4j`, Password `verifi_secure_password`.

### Option B: High-Performance In-Memory Graph Fallback
If Docker or Neo4j is not available, VeriFi AI automatically activates its built-in in-memory graph engine (`neo4j_connector.py`), storing and traversing `User`, `Email`, `Call`, and `Payment` nodes with identical temporal correlation logic.

---

## 3. Backend Setup (FastAPI)

```bash
cd backend

# Create & activate Python virtual environment
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install required packages
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env

# Run FastAPI with live reload
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Swagger UI will be live at: `http://localhost:8000/docs`
- Health check endpoint: `http://localhost:8000/health`

### Run Backend Unit & Integration Tests
```bash
cd backend
python -m pytest tests/ -v
```

---

## 4. Frontend Setup (Next.js)

```bash
cd frontend

# Install Node dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Run Next.js local development server
npm run dev
```

- Web Portal will be live at: `http://localhost:3000`

---

## 5. Environment Variables Reference

### Backend (`backend/.env`)
```env
ENVIRONMENT=development
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# Neo4j
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=verifi_secure_password
NEO4J_DATABASE=neo4j

# AWS Bedrock & S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_EVIDENCE_BUCKET=verifi-evidence-vault
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0

# FIDO2 / WebAuthn
RP_ID=localhost
RP_NAME=VeriFi AI Authorization Gateway
ORIGIN=http://localhost:3000

FALLBACK_TO_MOCK_IF_UNAVAILABLE=true
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_RP_ID=localhost
```
