import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any

class SecurityManager:
    @staticmethod
    def generate_sha256_hash(payload: Dict[str, Any]) -> str:
        """
        Produces a deterministic SHA-256 cryptographic digest of a dictionary
        by enforcing canonical JSON key ordering and ISO string dates.
        """
        def json_serial(obj):
            if isinstance(obj, (datetime,)):
                return obj.isoformat()
            return str(obj)

        canonical_json = json.dumps(
            payload,
            sort_keys=True,
            default=json_serial,
            separators=(',', ':')
        )
        return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()

    @staticmethod
    def create_evidence_package(transaction_data: Dict[str, Any], risk_report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assembles an immutable audit package sealed with timestamp and SHA-256 digest.
        """
        evidence_manifest = {
            "version": "1.0",
            "type": "VERIFI_AUTHORIZATION_AUDIT_LOG",
            "sealed_at": datetime.now(timezone.utc).isoformat(),
            "transaction": transaction_data,
            "risk_assessment": risk_report
        }
        digest = SecurityManager.generate_sha256_hash(evidence_manifest)
        evidence_manifest["seal_hash"] = digest
        return evidence_manifest

security_manager = SecurityManager()
