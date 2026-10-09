import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.pii_redactor import pii_redactor
from app.services.intent_extractor import intent_extractor
from app.services.deepfake_scorer import deepfake_scorer
from app.services.risk_fusion_engine import risk_fusion_engine
from app.core.security import security_manager

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_pii_redaction():
    sample_text = "Please send funds to IBAN GB29NWBK60161331926819 or account 987654321 for $450,000.00 immediately."
    redacted, stats = pii_redactor.redact(sample_text)
    assert "[REDACTED_IBAN]" in redacted
    assert "[REDACTED_AMOUNT]" in redacted
    assert "GB29NWBK" not in redacted

def test_intent_extraction_urgency():
    subject = "URGENT: Escrow Wire Required by EOD"
    body = "Strictly confidential transaction. Do not discuss over standard channels. Wire $500,000."
    result = intent_extractor.analyze_communication(subject, body)
    assert result.intent == "wire_transfer_request"
    assert result.urgency_score > 0.5
    assert result.secrecy_detected is True
    assert result.financial_action_detected is True

def test_deepfake_scorer():
    score, verdict, details = deepfake_scorer.evaluate_audio("ceo_deepfake_synthetic.wav", b"fake audio content bytes", "CEO")
    assert score >= 0.70
    assert verdict == "suspicious_synthetic"

def test_security_sha256_sealing():
    manifest = security_manager.create_evidence_package(
        transaction_data={"tx_id": "test_1", "amount": 1000},
        risk_report={"score": 85.0}
    )
    assert "seal_hash" in manifest
    assert len(manifest["seal_hash"]) == 64 # valid 64-char hex SHA-256

def test_sensor_ingestion_and_gatekeeper_workflow():
    # 1. Ingest suspicious spoofed email
    email_payload = {
        "sender": "attacker-spoof@executive-channel.com",
        "recipient": "treasurer@enterprise.com",
        "subject": "CRITICAL: Urgent Escrow Transfer Required",
        "body": "Confidential acquisition. Wire $350,000 to offshore escrow account GB29NWBK60161331926819 immediately.",
        "spf_result": "fail",
        "dkim_result": "fail"
    }
    email_res = client.post("/api/v1/sensors/email", json=email_payload)
    assert email_res.status_code == 200
    email_data = email_res.json()
    assert email_data["status"] == "processed"
    assert "event_id" in email_data

    # 2. Ingest suspicious audio call
    fake_wav_content = b"RIFF....WAVEfmt ...." + b"\x00" * 4000
    audio_res = client.post(
        "/api/v1/sensors/audio",
        data={"caller_identity": "CEO Clone", "target_identity": "treasurer@enterprise.com"},
        files={"audio_file": ("deepfake_ceo_voice.wav", fake_wav_content, "audio/wav")}
    )
    assert audio_res.status_code == 200
    audio_data = audio_res.json()
    assert audio_data["deepfake_score"] >= 0.70

    # 3. Trigger Payment Verification for the targeted treasurer
    payment_payload = {
        "transaction_id": "tx_test_hold_001",
        "requester_email": "treasurer@enterprise.com",
        "beneficiary_name": "Apex Offshore Holdings",
        "beneficiary_iban": "GB29NWBK60161331926819",
        "amount": 350000.0,
        "currency": "USD",
        "reference": "Acquisition Escrow Q3"
    }
    tx_res = client.post("/api/v1/verify-transaction", json=payment_payload)
    assert tx_res.status_code == 200
    tx_data = tx_res.json()
    # High risk expected due to correlated spoofed email and synthetic call
    assert tx_data["risk_score"] > 70.0
    assert tx_data["status"] == "hold"
    assert tx_data["evidence_seal"] is not None
    assert len(tx_data["evidence_seal"]["sha256_hash"]) == 64

def test_nominal_pass_transaction():
    payment_payload = {
        "transaction_id": "tx_clean_pass_002",
        "requester_email": "routine-employee@enterprise.com",
        "beneficiary_name": "Standard Office Supplies LLC",
        "beneficiary_iban": "US1234567890",
        "amount": 1200.0,
        "currency": "USD",
        "reference": "Monthly Printer Paper"
    }
    tx_res = client.post("/api/v1/verify-transaction", json=payment_payload)
    assert tx_res.status_code == 200
    tx_data = tx_res.json()
    assert tx_data["status"] == "pass"
    assert tx_data["risk_score"] < 30.0
