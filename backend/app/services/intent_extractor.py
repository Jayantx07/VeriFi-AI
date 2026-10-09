import re
from typing import Dict, Any
from app.core.bedrock_client import bedrock_client
from app.models.schemas import IntentAnalysisResult

class IntentExtractorService:
    """
    Extracts structured intent, urgency vectors, financial action indicators,
    and secrecy flags using Amazon Bedrock Claude 3 or structured heuristic analysis.
    """

    SYSTEM_PROMPT = """You are a specialized Cybersecurity & Financial Fraud Analysis AI.
Your objective is to inspect corporate communications (emails, meeting transcripts) and extract high-precision fraud vectors.
Always output purely valid JSON with the following exact schema:
{
  "intent": "wire_transfer_request" | "invoice_update" | "credential_probe" | "routine_communication",
  "urgency_score": float between 0.0 and 1.0,
  "financial_action_detected": boolean,
  "secrecy_detected": boolean,
  "key_extracted_entities": {
    "urgency_cues": list of strings,
    "financial_cues": list of strings,
    "evasion_cues": list of strings
  }
}
Do NOT include markdown formatting or explanations outside the JSON.
"""

    @classmethod
    def analyze_communication(cls, subject: str, redacted_body: str) -> IntentAnalysisResult:
        full_text = f"Subject: {subject}\n\nBody:\n{redacted_body}"
        prompt = f"Analyze the following communication for BEC (Business Email Compromise) indicators:\n\n{full_text}"

        # 1. Try Bedrock Claude 3
        bedrock_result = bedrock_client.invoke_claude_json(prompt, cls.SYSTEM_PROMPT)
        if bedrock_result and "intent" in bedrock_result and "urgency_score" in bedrock_result:
            return IntentAnalysisResult(
                intent=bedrock_result.get("intent", "routine_communication"),
                urgency_score=float(bedrock_result.get("urgency_score", 0.0)),
                financial_action_detected=bool(bedrock_result.get("financial_action_detected", False)),
                secrecy_detected=bool(bedrock_result.get("secrecy_detected", False)),
                key_extracted_entities=bedrock_result.get("key_extracted_entities", {})
            )

        # 2. High-precision rule-based heuristic fallback (for offline/standalone hackathon execution)
        return cls._heuristic_analysis(subject, redacted_body)

    @classmethod
    def _heuristic_analysis(cls, subject: str, body: str) -> IntentAnalysisResult:
        content = (subject + " " + body).lower()

        urgency_terms = ["urgent", "immediately", "asap", "end of day", "eod", "time-sensitive", "critical", "quick turnaround"]
        secrecy_terms = ["confidential", "strict", "do not discuss", "off the record", "private", "bypass", "personal cell", "secret", "undisclosed"]
        financial_terms = ["wire", "transfer", "escrow", "invoice", "payment", "bank", "settlement", "remittance", "routing", "[redacted_iban]", "[redacted_amount]"]

        found_urgency = [term for term in urgency_terms if term in content]
        found_secrecy = [term for term in secrecy_terms if term in content]
        found_financial = [term for term in financial_terms if term in content]

        # Calculate urgency score
        urgency_score = min(1.0, 0.25 * len(found_urgency) + (0.3 if "urgent" in content or "immediately" in content else 0.0))
        if found_secrecy and found_urgency:
            urgency_score = min(1.0, urgency_score + 0.2)

        # Determine Intent
        if found_financial and ("wire" in content or "transfer" in content or "escrow" in content):
            intent = "wire_transfer_request"
        elif found_financial and "invoice" in content:
            intent = "invoice_update"
        elif found_financial:
            intent = "financial_inquiry"
        else:
            intent = "routine_communication"

        financial_action_detected = len(found_financial) > 0
        secrecy_detected = len(found_secrecy) > 0

        return IntentAnalysisResult(
            intent=intent,
            urgency_score=round(urgency_score, 2),
            financial_action_detected=financial_action_detected,
            secrecy_detected=secrecy_detected,
            key_extracted_entities={
                "urgency_cues": found_urgency,
                "secrecy_cues": found_secrecy,
                "financial_cues": found_financial
            }
        )

intent_extractor = IntentExtractorService()
