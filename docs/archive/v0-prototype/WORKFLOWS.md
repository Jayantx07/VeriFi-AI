# VeriFi AI — Core Workflows & Business Logic

This document specifies the business rules and computational workflows executed by VeriFi AI.

---

## Workflow 1: Sensor Ingestion & AI Processing

1. **Email Sensor Ingestion (`POST /api/v1/sensors/email`)**:
   - Parses RFC-5322 metadata: SPF, DKIM, Sender, Recipient, Subject, Body.
   - Text is passed through `PIIRedactorService` to mask account numbers, IBANs, and currency amounts.
   - Masked text is dispatched to Amazon Bedrock Claude 3 Sonnet (`anthropic.claude-3-sonnet-20240229-v1:0`).
   - Bedrock extracts structured JSON vectors:
     - `intent`: `"wire_transfer_request"` / `"invoice_update"` / `"routine_communication"`
     - `urgency_score`: `0.0 - 1.0`
     - `financial_action_detected`: boolean
     - `secrecy_detected`: boolean
   - An `(:Email)` node is minted in Neo4j and connected via `(:Email)-[:SENT_TO]->(:User)`.

2. **Audio Sensor Ingestion (`POST /api/v1/sensors/audio`)**:
   - Simulates meeting audio ingress (Zoom bot, SIP telephony).
   - Audio file is evaluated by `DeepfakeScorerService` (Wav2Vec2 classifier).
   - Classifies synthetic vocoder artifacts, acoustic phase jitter, and frequency anomalies.
   - Produces deepfake score (`0.0 - 1.0`) and verdict (`"authentic_human"`, `"ambiguous_quality"`, `"suspicious_synthetic"`).
   - A `(:Call)` node is created in Neo4j and connected via `(:Call)-[:CALLED]->(:User)`.

---

## Workflow 2: Lineage Graph (Temporal Correlation)

- Graph entity nodes: `(:User)`, `(:Email)`, `(:Call)`, `(:Payment)`.
- When an ERP settlement is evaluated, Neo4j runs a Cypher traversal targeting the 72-hour sliding window:
  ```cypher
  MATCH (u:User {email: $email})
  OPTIONAL MATCH (e:Email)-[:SENT_TO]->(u)
  WHERE e.timestamp >= datetime($cutoff) 
    AND (e.risk_score >= 40.0 OR e.spf_result = 'fail' OR e.urgency_score > 0.7)
  OPTIONAL MATCH (c:Call)-[:CALLED]->(u)
  WHERE c.timestamp >= datetime($cutoff) 
    AND c.deepfake_score >= 0.50
  RETURN collect(DISTINCT e) AS emails, collect(DISTINCT c) AS calls
  ```
- Subgraph edges and nodes are exposed to the Fraud Analyst visualizer.

---

## Workflow 3: Payment Gate & Risk Fusion

- **Endpoint**: `POST /api/v1/verify-transaction`
- Evaluates composite risk score (0 to 100):
  - **Base Value Analysis**: Amounts ≥ $250k contribute +25 pts; ≥ $50k contribute +15 pts.
  - **Beneficiary Anomaly**: Offshore/unknown entities contribute +15 pts.
  - **Correlated Email BEC**: SPF/DKIM fail contributes +35 pts; Urgency/Secrecy contributes +20 pts.
  - **Correlated Deepfake Call**: Audio synthetic score ≥ 0.65 contributes +45 pts.
  - **Compounding BEC Multiplier**: Simultaneous spoofed email and synthetic call adds +20 pts.
- **Three-Tier Action Decision**:
  - **Score < 30 (Pass)**: Automatic settlement approval.
  - **Score 30 - 70 (Step-Up)**: Quarantine pending FIDO2 WebAuthn Passkey biometric challenge.
  - **Score > 70 (Hold)**: Fraud freeze, alert generation, and evidence sealing.

---

## Workflow 4: Evidence Sealing & Analyst Dashboard

- When a transaction enters `hold` or passes `step-up`, an immutable audit manifest is created.
- Formats canonical JSON and hashes with SHA-256.
- Stores envelope into AWS S3 (`s3://verifi-evidence-vault/evidence/{tx_id}.json`).
- Broadcasts real-time state to Next.js Analyst Dashboard for investigation.
