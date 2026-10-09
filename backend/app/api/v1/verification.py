import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    TransactionVerifyRequest,
    TransactionVerifyResponse,
    EvidenceSeal
)
from app.services.risk_fusion_engine import risk_fusion_engine
from app.services.lineage_graph import lineage_graph_service
from app.core.security import security_manager
from app.core.s3_client import s3_evidence_vault

router = APIRouter(tags=["Verification"])

# In-memory session tracking for step-up passkey verification
ACTIVE_SESSIONS: dict = {}
TRANSACTIONS_LOG: dict = {}

@router.post("/verify-transaction", response_model=TransactionVerifyResponse)
async def verify_transaction(payload: TransactionVerifyRequest):
    """
    Core Payment Gatekeeper: Correlates transaction against 72-hour Neo4j graph lineage,
    calculates composite risk, and either permits settlement (pass), triggers FIDO2 WebAuthn
    biometric step-up challenge, or freezes and seals the transaction (hold).
    """
    tx_id = payload.transaction_id or f"tx_{uuid.uuid4().hex[:6]}"
    ts = payload.timestamp or datetime.now(timezone.utc)

    tx_dict = {
        "transaction_id": tx_id,
        "requester_email": payload.requester_email,
        "beneficiary_name": payload.beneficiary_name,
        "beneficiary_iban": payload.beneficiary_iban,
        "amount": payload.amount,
        "currency": payload.currency,
        "reference": payload.reference or "Settlement",
        "timestamp": ts.isoformat()
    }

    # 1. Evaluate Risk Fusion Engine
    risk_score, gate_status, risk_factors, message = risk_fusion_engine.evaluate_transaction(tx_dict)

    # 2. Record Payment in Neo4j Lineage Graph
    lineage_graph_service.record_payment_event({
        **tx_dict,
        "risk_score": risk_score,
        "status": gate_status
    })

    evidence_seal = None
    auth_session_id = None
    challenge_required = None

    # 3. Handle Status Branches
    if gate_status == "hold":
        # Assemble cryptographic evidence manifest
        audit_pkg = security_manager.create_evidence_package(
            transaction_data=tx_dict,
            risk_report={
                "risk_score": risk_score,
                "status": "hold",
                "risk_factors": risk_factors,
                "reason": "Automated fraud hold due to high risk multi-vector correlation"
            }
        )
        s3_uri = s3_evidence_vault.store_evidence(f"{tx_id}_hold", audit_pkg)
        evidence_seal = EvidenceSeal(
            sha256_hash=audit_pkg["seal_hash"],
            s3_uri=s3_uri,
            sealed_at=datetime.fromisoformat(audit_pkg["sealed_at"].replace("Z", "")),
            canonical_digest=audit_pkg
        )

    elif gate_status == "step-up":
        auth_session_id = f"auth_sess_{tx_id}_{uuid.uuid4().hex[:6]}"
        challenge_required = "fido2_passkey"
        ACTIVE_SESSIONS[auth_session_id] = {
            "transaction_id": tx_id,
            "requester_email": payload.requester_email,
            "tx_dict": tx_dict,
            "risk_score": risk_score,
            "risk_factors": risk_factors
        }

    response_payload = TransactionVerifyResponse(
        transaction_id=tx_id,
        status=gate_status,
        risk_score=risk_score,
        risk_factors=risk_factors,
        message=message,
        challenge_required=challenge_required,
        auth_session_id=auth_session_id,
        evidence_seal=evidence_seal
    )

    # Store in memory for transaction log inspection
    TRANSACTIONS_LOG[tx_id] = response_payload.model_dump()

    return response_payload
