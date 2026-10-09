# VeriFi AI — API Documentation Specification

> **Base URL:** `http://localhost:8000/api/v1`  
> **Interactive Swagger UI:** `http://localhost:8000/docs`  
> **OpenAPI JSON:** `http://localhost:8000/openapi.json`

---

## 1. Sensor Ingestion Endpoints

### 1.1 Ingest Email Sensor Event
* **Endpoint:** `POST /api/v1/sensors/email`
* **Content-Type:** `application/json`
* **Description:** Ingests email metadata and body, masks sensitive PII, extracts intent vectors via Amazon Bedrock Claude 3, and persists the `(:Email)` node in the Neo4j Lineage Graph linked to the target `(:User)`.

#### Request Body
```json
{
  "sender": "ceo-cfo-urgent@partner-consultancy.net",
  "recipient": "finance-director@enterprise.com",
  "subject": "STRICT CONFIDENTIAL: Urgent Acquisition Escrow Transfer",
  "body": "Please immediately wire $420,000 to the attached vendor account GB29NWBK60161331926819 for the undisclosed Q3 merger. Do not discuss over standard channels.",
  "spf_result": "fail",
  "dkim_result": "fail",
  "timestamp": "2026-10-08T10:15:00Z"
}
```

#### Response Body (`200 OK`)
```json
{
  "event_id": "eml_89f02c4b",
  "status": "processed",
  "node_id": "Email_eml_89f02c4b",
  "intent_analysis": {
    "intent": "wire_transfer_request",
    "urgency_score": 0.95,
    "financial_action_detected": true,
    "secrecy_detected": true,
    "key_extracted_entities": {
      "urgency_cues": ["immediately", "urgent"],
      "secrecy_cues": ["confidential", "undisclosed"],
      "financial_cues": ["wire", "escrow"]
    }
  },
  "pii_redacted_body": "Please immediately wire [REDACTED_AMOUNT] to the attached vendor account [REDACTED_IBAN] for the undisclosed Q3 merger. Do not discuss over standard channels."
}
```

---

### 1.2 Ingest Audio Sensor Event (Zoom Bot Mock)
* **Endpoint:** `POST /api/v1/sensors/audio`
* **Content-Type:** `multipart/form-data`
* **Description:** Ingests meeting audio segment, processes acoustic features through Wav2Vec2 deepfake detector, and persists `(:Call)` node in Neo4j linked to the target approver.

#### Form Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `caller_identity` | string | Yes | Name or claimed title of caller (e.g. `Robert Thorne (CEO)`) |
| `target_identity` | string | Yes | Email of target approver |
| `audio_file` | file | Yes | Binary audio file (`.wav`, `.mp3`) |
| `timestamp` | string | No | ISO-8601 timestamp string |

#### Response Body (`200 OK`)
```json
{
  "event_id": "aud_18742a8b",
  "caller": "Robert Thorne (CEO)",
  "target_identity": "finance-director@enterprise.com",
  "deepfake_score": 0.88,
  "verdict": "suspicious_synthetic",
  "node_id": "Call_aud_18742a8b",
  "duration_seconds": 18.4
}
```

---

## 2. Payment Verification & Gatekeeper Endpoints

### 2.1 Verify Transaction Gate
* **Endpoint:** `POST /api/v1/verify-transaction`
* **Content-Type:** `application/json`
* **Description:** Main transaction authorization gate called by ERP systems prior to settlement. Correlates payment data against the 72-hour sliding window in Neo4j.

#### Request Body
```json
{
  "transaction_id": "tx_90182",
  "requester_email": "finance-director@enterprise.com",
  "beneficiary_name": "Apex Holdings Offshore Ltd",
  "beneficiary_iban": "GB29NWBK60161331926819",
  "amount": 420000.00,
  "currency": "USD",
  "reference": "Acquisition Escrow Q3",
  "timestamp": "2026-10-08T11:00:00Z"
}
```

#### Response (Low Risk - Pass)
```json
{
  "transaction_id": "tx_90182",
  "status": "pass",
  "risk_score": 14.5,
  "risk_factors": [],
  "message": "Transaction authorized. Low anomaly threshold.",
  "challenge_required": null,
  "auth_session_id": null,
  "evidence_seal": null
}
```

#### Response (Medium Risk - Step-Up)
```json
{
  "transaction_id": "tx_90182",
  "status": "step-up",
  "risk_score": 58.2,
  "risk_factors": [
    "Substantial transaction ($65,000.00) above daily baseline"
  ],
  "message": "Medium anomaly detected. Step-up hardware passkey verification required.",
  "challenge_required": "fido2_passkey",
  "auth_session_id": "auth_sess_tx_90182_a8f9b2",
  "evidence_seal": null
}
```

#### Response (High Risk - Hold)
```json
{
  "transaction_id": "tx_90182",
  "status": "hold",
  "risk_score": 89.4,
  "risk_factors": [
    "High-value transaction ($420,000.00) exceeding risk threshold",
    "High-risk beneficiary nomenclature: 'Apex Holdings Offshore Ltd'",
    "Correlated email with authentication failure (SPF: fail, DKIM: fail) targeting requester",
    "Correlated email exhibits coercive secrecy and urgency (score: 0.95)",
    "Correlated audio call with 88.0% synthetic voice probability from 'Robert Thorne (CEO)'",
    "CRITICAL: Coordinated multimodal BEC assault detected (simultaneous spoofed email & synthetic call)"
  ],
  "message": "High-risk fraud pattern detected. Transaction frozen and sealed for fraud analyst review.",
  "challenge_required": null,
  "auth_session_id": null,
  "evidence_seal": {
    "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "s3_uri": "s3://verifi-evidence-vault/evidence/tx_90182_hold.json",
    "sealed_at": "2026-10-08T11:00:02Z",
    "canonical_digest": { ... }
  }
}
```

---

## 3. FIDO2 / WebAuthn Passkey Endpoints

### 3.1 Generate Passkey Challenge Options
* **Endpoint:** `POST /api/v1/passkey/generate-options`
* **Request:**
```json
{
  "user_email": "finance-director@enterprise.com",
  "auth_session_id": "auth_sess_tx_90182_a8f9b2",
  "transaction_id": "tx_90182"
}
```
* **Response:** Returns challenge token, rpId, timeout (60000ms), and userVerification parameters compatible with `@simplewebauthn/browser`.

### 3.2 Verify Passkey Assertion
* **Endpoint:** `POST /api/v1/passkey/verify`
* **Request:**
```json
{
  "auth_session_id": "auth_sess_tx_90182_a8f9b2",
  "transaction_id": "tx_90182",
  "credential": {
    "id": "passkey_cred_172838",
    "type": "public-key",
    "response": {
      "clientDataJSON": "eyJjaGFsbGVuZ2UiOi...",
      "authenticatorData": "YXV0aERhdGE...",
      "signature": "c2lnbmF0dXJl..."
    }
  }
}
```
* **Response:** Updates transaction to authorized `pass`, creates immutable SHA-256 authorization seal, and saves into AWS S3.

---

## 4. Audit & Lineage Endpoints

### 4.1 Get Evaluated Transactions Ledger
* **Endpoint:** `GET /api/v1/audit/transactions`
* **Response:** Array of transaction verification objects with status, scores, and seals.

### 4.2 Get Lineage Subgraph for Transaction
* **Endpoint:** `GET /api/v1/audit/lineage/{transaction_id}`
* **Response:** Returns nodes (User, Email, Call, Payment) and edges (SENT_TO, CALLED, INITIATED) for the visualizer.

### 4.3 Get Raw Cryptographic Evidence
* **Endpoint:** `GET /api/v1/audit/evidence/{transaction_id}`
* **Response:** Canonical JSON evidence manifest sealed in S3.
