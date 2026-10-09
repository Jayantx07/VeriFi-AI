import uuid
from datetime import datetime
from typing import Dict, Any, List, Tuple
from app.services.lineage_graph import lineage_graph_service

class RiskFusionEngine:
    """
    Composite Multi-Vector Risk Fusion Engine.
    Correlates financial transaction parameters with the temporal Neo4j Lineage Graph,
    assessing email BEC vectors and acoustic deepfake indicators.
    """

    BASELINE_AMOUNT_THRESHOLD = 50000.00
    HIGH_VALUE_THRESHOLD = 250000.00

    @classmethod
    def evaluate_transaction(cls, tx: Dict[str, Any]) -> Tuple[float, str, List[str], str]:
        """
        Calculates composite risk score (0-100), status ('pass' | 'step-up' | 'hold'),
        and list of human-readable risk factors.
        """
        score = 5.0 # baseline nominal risk
        factors: List[str] = []

        requester = tx["requester_email"]
        amount = float(tx.get("amount", 0.0))
        beneficiary = tx.get("beneficiary_name", "")
        iban = tx.get("beneficiary_iban", "")

        # 1. Transaction Amount Analysis
        if amount >= cls.HIGH_VALUE_THRESHOLD:
            score += 25.0
            factors.append(f"High-value transaction (${amount:,.2f}) exceeding risk threshold")
        elif amount >= cls.BASELINE_AMOUNT_THRESHOLD:
            score += 15.0
            factors.append(f"Substantial transaction (${amount:,.2f}) above daily baseline")

        # 2. Beneficiary Risk Check
        if "offshore" in beneficiary.lower() or "holdings" in beneficiary.lower() or "consultancy" in beneficiary.lower():
            score += 15.0
            factors.append(f"High-risk beneficiary nomenclature: '{beneficiary}'")

        # 3. Query Neo4j Lineage Graph for 72-Hour Temporal Correlations
        correlations = lineage_graph_service.query_recent_correlations_72h(requester, window_hours=72)

        has_spoofed_email = False
        has_deepfake_call = False

        for event in correlations:
            etype = event["type"]
            edata = event["data"]

            if etype == "Email":
                spf_fail = edata.get("spf_result", "").lower() == "fail"
                dkim_fail = edata.get("dkim_result", "").lower() == "fail"
                urgency = float(edata.get("urgency_score", 0.0))
                secrecy = bool(edata.get("secrecy_detected", False))

                if spf_fail or dkim_fail:
                    score += 35.0
                    has_spoofed_email = True
                    factors.append(
                        f"Correlated email with authentication failure (SPF: {edata.get('spf_result', 'FAIL')}, DKIM: {edata.get('dkim_result', 'FAIL')}) targeting requester"
                    )

                if urgency >= 0.70 or secrecy:
                    score += 20.0
                    factors.append(
                        f"Correlated email exhibits coercive secrecy and urgency (score: {urgency:.2f})"
                    )

            elif etype == "Call":
                df_score = float(edata.get("deepfake_score", 0.0))
                if df_score >= 0.65:
                    score += 45.0
                    has_deepfake_call = True
                    factors.append(
                        f"Correlated audio call with {df_score*100:.1f}% synthetic voice probability from '{edata.get('caller', 'Unknown')}'"
                    )

        # 4. Compounding Multimodal Attack Multiplier
        if has_spoofed_email and has_deepfake_call:
            score += 20.0
            factors.append("CRITICAL: Coordinated multimodal BEC assault detected (simultaneous spoofed email & synthetic call)")

        # Cap score between 0.0 and 100.0
        final_score = round(min(100.0, max(0.0, score)), 1)

        # 5. Determine Tier
        if final_score < 30.0:
            status = "pass"
            message = "Transaction authorized. Low anomaly threshold."
        elif 30.0 <= final_score <= 70.0:
            status = "step-up"
            message = "Medium anomaly detected. Step-up hardware passkey verification required."
        else:
            status = "hold"
            message = "High-risk fraud pattern detected. Transaction frozen and sealed for fraud analyst review."

        return final_score, status, factors, message

risk_fusion_engine = RiskFusionEngine()
