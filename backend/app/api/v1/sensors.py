import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.models.schemas import (
    EmailIngestRequest,
    EmailIngestResponse,
    AudioIngestResponse
)
from app.services.pii_redactor import pii_redactor
from app.services.intent_extractor import intent_extractor
from app.services.deepfake_scorer import deepfake_scorer
from app.services.lineage_graph import lineage_graph_service

router = APIRouter(prefix="/sensors", tags=["Sensors"])

@router.post("/email", response_model=EmailIngestResponse)
async def ingest_email(payload: EmailIngestRequest):
    """
    Ingests an email communication event, masks PII, extracts structured intent via
    Amazon Bedrock Claude 3, and persists the node and relationships into the Neo4j Lineage Graph.
    """
    event_id = f"eml_{uuid.uuid4().hex[:8]}"
    ts = payload.timestamp or datetime.now(timezone.utc)

    # 1. PII Redaction
    redacted_body, pii_stats = pii_redactor.redact(payload.body)

    # 2. Bedrock Claude 3 Intent Extraction
    intent_analysis = intent_extractor.analyze_communication(payload.subject, redacted_body)

    # 3. Calculate baseline sensor risk score
    sensor_risk = 0.0
    if payload.spf_result.lower() == "fail":
        sensor_risk += 35.0
    if payload.dkim_result.lower() == "fail":
        sensor_risk += 35.0
    if intent_analysis.financial_action_detected:
        sensor_risk += 20.0
    if intent_analysis.secrecy_detected:
        sensor_risk += 20.0
    sensor_risk += intent_analysis.urgency_score * 30.0
    sensor_risk = min(100.0, sensor_risk)

    # 4. Save into Neo4j Lineage Graph
    node_id = lineage_graph_service.record_email_event({
        "event_id": event_id,
        "sender": payload.sender,
        "recipient": payload.recipient,
        "subject": payload.subject,
        "spf_result": payload.spf_result,
        "dkim_result": payload.dkim_result,
        "urgency_score": intent_analysis.urgency_score,
        "financial_action_detected": intent_analysis.financial_action_detected,
        "secrecy_detected": intent_analysis.secrecy_detected,
        "risk_score": round(sensor_risk, 1),
        "timestamp": ts.isoformat()
    })

    return EmailIngestResponse(
        event_id=event_id,
        status="processed",
        node_id=node_id,
        intent_analysis=intent_analysis,
        pii_redacted_body=redacted_body
    )

@router.post("/audio", response_model=AudioIngestResponse)
async def ingest_audio(
    caller_identity: str = Form(...),
    target_identity: str = Form(...),
    audio_file: UploadFile = File(...),
    timestamp: Optional[str] = Form(None)
):
    """
    Ingests recorded or simulated meeting audio segment (Zoom bot mock), scores
    voice synthesis likelihood using Wav2Vec2 classifier, and links into Neo4j graph.
    """
    try:
        content = await audio_file.read()
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Failed to read audio file: {e}")

    event_id = f"aud_{uuid.uuid4().hex[:8]}"
    ts_str = timestamp or datetime.now(timezone.utc).isoformat()

    # 1. Wav2Vec2 Deepfake classification
    df_score, verdict, details = deepfake_scorer.evaluate_audio(
        filename=audio_file.filename or "sample.wav",
        file_bytes=content,
        caller_identity=caller_identity
    )

    # 2. Persist to Neo4j Lineage Graph
    node_id = lineage_graph_service.record_call_event({
        "event_id": event_id,
        "caller": caller_identity,
        "target": target_identity,
        "deepfake_score": df_score,
        "duration_seconds": round(max(3.0, len(content) / 32000), 1),
        "risk_score": round(df_score * 100, 1),
        "timestamp": ts_str
    })

    return AudioIngestResponse(
        event_id=event_id,
        caller=caller_identity,
        target_identity=target_identity,
        deepfake_score=df_score,
        verdict=verdict,
        node_id=node_id,
        duration_seconds=round(max(3.0, len(content) / 32000), 1)
    )
