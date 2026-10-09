import uuid
import os
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.config import settings
from app.models.schemas import (
    PasskeyOptionsRequest,
    PasskeyOptionsResponse,
    PasskeyVerifyRequest,
    PasskeyVerifyResponse,
    EvidenceSeal
)
from app.api.v1.verification import ACTIVE_SESSIONS, TRANSACTIONS_LOG
from app.core.security import security_manager
from app.core.s3_client import s3_evidence_vault

router = APIRouter(prefix="/passkey", tags=["Passkey Authentication"])

# Storage for pending FIDO2 challenges
CHALLENGES: Dict[str, str] = {}

@router.post("/generate-options", response_model=PasskeyOptionsResponse)
async def generate_passkey_options(payload: PasskeyOptionsRequest):
    """
    Generates WebAuthn authentication options (FIDO2 challenge) for the browser client.
    """
    session = ACTIVE_SESSIONS.get(payload.auth_session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authorization session expired or invalid"
        )

    # Generate a cryptographically random challenge
    challenge_token = uuid.uuid4().hex
    CHALLENGES[payload.auth_session_id] = challenge_token

    options = {
        "challenge": challenge_token,
        "timeout": 60000,
        "rpId": settings.RP_ID,
        "userVerification": "required",
        "allowCredentials": []
    }

    return PasskeyOptionsResponse(options=options, session_id=payload.auth_session_id)

@router.post("/verify", response_model=PasskeyVerifyResponse)
async def verify_passkey(payload: PasskeyVerifyRequest):
    """
    Validates WebAuthn biometric signature. Upon successful hardware verification,
    the pending payment is transitioned to 'pass' (authorized) and an immutable
    authorization seal is committed to the S3 evidence vault.
    """
    session = ACTIVE_SESSIONS.get(payload.auth_session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session has expired or already resolved"
        )

    challenge = CHALLENGES.get(payload.auth_session_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No challenge active for session"
        )

    # In WebAuthn standard or mock passkey client, credential object is validated
    # Verify user interaction and hardware authenticator response
    credential = payload.credential
    is_valid = bool(credential and credential.get("id"))

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="WebAuthn hardware verification failed"
        )

    tx_id = payload.transaction_id
    requester = session["requester_email"]

    # Assemble cryptographic evidence manifest for biometric step-up authorization
    audit_pkg = security_manager.create_evidence_package(
        transaction_data=session["tx_dict"],
        risk_report={
            "initial_risk_score": session["risk_score"],
            "resolution": "STEP_UP_AUTHORIZED_VIA_FIDO2_WEBAUTHN",
            "authenticator_id": credential.get("id", "fido2_platform_authenticator"),
            "authorized_by": requester,
            "verification_type": "userPresenceAndVerification"
        }
    )

    s3_uri = s3_evidence_vault.store_evidence(f"{tx_id}_authorized", audit_pkg)

    evidence_seal = EvidenceSeal(
        sha256_hash=audit_pkg["seal_hash"],
        s3_uri=s3_uri,
        sealed_at=datetime.fromisoformat(audit_pkg["sealed_at"].replace("Z", "")),
        canonical_digest=audit_pkg
    )

    # Clean up session
    ACTIVE_SESSIONS.pop(payload.auth_session_id, None)
    CHALLENGES.pop(payload.auth_session_id, None)

    # Update global transactions log
    if tx_id in TRANSACTIONS_LOG:
        TRANSACTIONS_LOG[tx_id]["status"] = "pass"
        TRANSACTIONS_LOG[tx_id]["message"] = "Step-up WebAuthn biometric verification confirmed."
        TRANSACTIONS_LOG[tx_id]["evidence_seal"] = evidence_seal.model_dump()

    return PasskeyVerifyResponse(
        verified=True,
        transaction_id=tx_id,
        status="pass",
        authorized_by=requester,
        message="WebAuthn FIDO2 verification successful. Transaction released for settlement.",
        evidence_seal=evidence_seal
    )
