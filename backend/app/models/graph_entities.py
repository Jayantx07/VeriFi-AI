from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class UserNode(BaseModel):
    email: str
    name: Optional[str] = None
    role: Optional[str] = "Corporate Approver"
    baseline_risk: float = 0.0

class EmailNode(BaseModel):
    event_id: str
    sender: str
    recipient: str
    subject: str
    spf_result: str
    dkim_result: str
    urgency_score: float
    financial_action_detected: bool
    secrecy_detected: bool
    risk_score: float
    timestamp: datetime

class CallNode(BaseModel):
    event_id: str
    caller: str
    target: str
    deepfake_score: float
    duration_seconds: float
    risk_score: float
    timestamp: datetime

class PaymentNode(BaseModel):
    transaction_id: str
    requester_email: str
    beneficiary_name: str
    beneficiary_iban: str
    amount: float
    currency: str
    reference: str
    risk_score: float
    status: str
    timestamp: datetime
