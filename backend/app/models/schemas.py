from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class IntentAnalysisResult(BaseModel):
    intent: str = Field(..., description="Categorized intent, e.g. wire_transfer_request, invoice_update, routine_communication")
    urgency_score: float = Field(..., ge=0.0, le=1.0, description="Urgency index from 0.0 to 1.0")
    financial_action_detected: bool = Field(..., description="Whether payment or wire demands are detected")
    secrecy_detected: bool = Field(..., description="Whether confidentiality or channel evasion is requested")
    key_extracted_entities: Dict[str, Any] = Field(default_factory=dict)

class EmailIngestRequest(BaseModel):
    sender: str
    recipient: str
    subject: str
    body: str
    spf_result: str = Field(default="pass", description="SPF verification result: pass, fail, softfail, neutral")
    dkim_result: str = Field(default="pass", description="DKIM verification result: pass, fail, none")
    timestamp: Optional[datetime] = None

class EmailIngestResponse(BaseModel):
    event_id: str
    status: str = "processed"
    node_id: str
    intent_analysis: IntentAnalysisResult
    pii_redacted_body: str

class AudioIngestResponse(BaseModel):
    event_id: str
    caller: str
    target_identity: str
    deepfake_score: float = Field(..., ge=0.0, le=1.0)
    verdict: str
    node_id: str
    duration_seconds: float

class TransactionVerifyRequest(BaseModel):
    transaction_id: str
    requester_email: str
    beneficiary_name: str
    beneficiary_iban: str
    amount: float
    currency: str = "USD"
    reference: Optional[str] = "Vendor Settlement"
    timestamp: Optional[datetime] = None

class EvidenceSeal(BaseModel):
    sha256_hash: str
    s3_uri: str
    sealed_at: datetime
    canonical_digest: Optional[Dict[str, Any]] = None

class TransactionVerifyResponse(BaseModel):
    transaction_id: str
    status: str = Field(..., description="'pass', 'step-up', or 'hold'")
    risk_score: float = Field(..., ge=0.0, le=100.0)
    risk_factors: List[str] = Field(default_factory=list)
    message: Optional[str] = None
    challenge_required: Optional[str] = None
    auth_session_id: Optional[str] = None
    evidence_seal: Optional[EvidenceSeal] = None

class PasskeyOptionsRequest(BaseModel):
    user_email: str
    auth_session_id: str
    transaction_id: str

class PasskeyOptionsResponse(BaseModel):
    options: Dict[str, Any]
    session_id: str

class PasskeyVerifyRequest(BaseModel):
    auth_session_id: str
    transaction_id: str
    credential: Dict[str, Any]

class PasskeyVerifyResponse(BaseModel):
    verified: bool
    transaction_id: str
    status: str
    authorized_by: str
    message: str
    evidence_seal: Optional[EvidenceSeal] = None

class GraphNode(BaseModel):
    id: str
    type: str # User, Email, Call, Payment
    label: str
    risk: float = 0.0
    properties: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str
    properties: Dict[str, Any] = Field(default_factory=dict)

class LineageGraphResponse(BaseModel):
    transaction_id: str
    risk_score: float
    status: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    evidence_seal: Optional[EvidenceSeal] = None
