from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from app.api.v1.verification import TRANSACTIONS_LOG
from app.services.lineage_graph import lineage_graph_service
from app.core.s3_client import s3_evidence_vault
from app.models.schemas import LineageGraphResponse

router = APIRouter(prefix="/audit", tags=["Audit & Lineage"])

@router.get("/transactions")
async def list_transactions() -> List[Dict[str, Any]]:
    """
    Returns list of all evaluated transactions for the ERP and Fraud Analyst views.
    """
    return list(TRANSACTIONS_LOG.values())

@router.get("/lineage/{transaction_id}", response_model=LineageGraphResponse)
async def get_transaction_lineage(transaction_id: str):
    """
    Fetches the correlated graph lineage (nodes and edges) and cryptographic seal
    for the Fraud Analyst Dashboard.
    """
    subgraph = lineage_graph_service.get_transaction_subgraph(transaction_id)
    tx_meta = TRANSACTIONS_LOG.get(transaction_id, {})

    evidence_seal = tx_meta.get("evidence_seal")
    risk_score = tx_meta.get("risk_score", 65.0)
    status_val = tx_meta.get("status", "hold")

    return LineageGraphResponse(
        transaction_id=transaction_id,
        risk_score=risk_score,
        status=status_val,
        nodes=subgraph["nodes"],
        edges=subgraph["edges"],
        evidence_seal=evidence_seal
    )

@router.get("/evidence/{transaction_id}")
async def get_raw_evidence(transaction_id: str):
    """
    Retrieves the raw JSON evidence manifest sealed in S3 / Vault.
    """
    evidence = s3_evidence_vault.get_evidence(f"{transaction_id}_hold")
    if not evidence:
        evidence = s3_evidence_vault.get_evidence(f"{transaction_id}_authorized")
    if not evidence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sealed evidence artifact found for this transaction"
        )
    return evidence
