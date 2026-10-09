import re
from typing import Tuple, List, Dict

class PIIRedactorService:
    """
    Enterprise PII & Financial Sensitive Data Redaction Utility (Presidio-aligned).
    Safeguards corporate credentials, account numbers, and personal info before AI model ingestion.
    """

    PATTERNS: List[Tuple[str, str, str]] = [
        # IBAN pattern (e.g. GB29NWBK60161331926819 or generic IBANs)
        (r"\b[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}\b", "[REDACTED_IBAN]", "IBAN"),
        # Credit Card Numbers
        (r"\b(?:\d{4}[-\s]?){3}\d{4}\b", "[REDACTED_CARD]", "CREDIT_CARD"),
        # Bank Account & Routing numbers (8-12 digits standalone)
        (r"\b(?:acct|account|acc)\s*[:#]?\s*\d{6,14}\b", "[REDACTED_ACCOUNT_NO]", "BANK_ACCOUNT"),
        # US SSN / National IDs
        (r"\b\d{3}-\d{2}-\d{4}\b", "[REDACTED_SSN]", "GOV_ID"),
        # Phone numbers
        (r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", "[REDACTED_PHONE]", "PHONE_NUMBER"),
        # Currency amounts (keeps currency symbol but masks magnitude if critical)
        (r"(?:\$|€|£|USD|EUR|GBP)\s*[\d,]+(?:\.\d{2})?", "[REDACTED_AMOUNT]", "FINANCIAL_AMOUNT")
    ]

    @classmethod
    def redact(cls, text: str) -> Tuple[str, Dict[str, int]]:
        """
        Redacts sensitive tokens and returns masked text alongside detection statistics.
        """
        redacted_text = text
        detected_counts: Dict[str, int] = {}

        for pattern, replacement, label in cls.PATTERNS:
            matches = list(re.finditer(pattern, redacted_text, flags=re.IGNORECASE))
            if matches:
                detected_counts[label] = detected_counts.get(label, 0) + len(matches)
                redacted_text = re.sub(pattern, replacement, redacted_text, flags=re.IGNORECASE)

        return redacted_text, detected_counts

pii_redactor = PIIRedactorService()
