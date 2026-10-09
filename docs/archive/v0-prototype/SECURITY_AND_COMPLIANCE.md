# VeriFi AI — Security & Compliance Architecture

This document describes the cryptographic, biometric, and privacy defense-in-depth principles implemented in **VeriFi AI**.

---

## 1. Zero Raw PII to LLMs (Presidio Redaction)

Prior to sending any communication content (email bodies, meeting transcripts) to Amazon Bedrock Claude 3 or external cloud LLMs, all text passes through the local `PIIRedactorService` (`pii_redactor.py`):

1. **International Bank Account Numbers (IBAN):**
   - Pattern: `\b[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}\b`
   - Masked with: `[REDACTED_IBAN]`
2. **Credit Card PANs:**
   - Pattern: `\b(?:\d{4}[-\s]?){3}\d{4}\b`
   - Masked with: `[REDACTED_CARD]`
3. **Domestic Bank Account / Routing Numbers:**
   - Pattern: `\b(?:acct|account|acc)\s*[:#]?\s*\d{6,14}\b`
   - Masked with: `[REDACTED_ACCOUNT_NO]`
4. **Financial Magnitudes:**
   - Pattern: `(?:\$|€|£|USD|EUR|GBP)\s*[\d,]+(?:\.\d{2})?`
   - Masked with: `[REDACTED_AMOUNT]`

This prevents credential leakage and ensures compliance with GDPR, SOC 2, and PCI-DSS requirements before third-party cloud inference.

---

## 2. Phishing-Resistant FIDO2 WebAuthn Passkeys

Traditional multi-factor authentication (SMS OTP, Email codes, Push prompts) is vulnerable to real-time Adversary-in-the-Middle (AiTM) reverse proxy phishing.

VeriFi AI mandates **FIDO2 / WebAuthn hardware passkeys** for medium-risk step-up authorizations:
* **Origin & RP ID Binding:** Challenges are cryptographically bound to `rp_id` (`localhost` or the enterprise domain). Even if an employee is tricked into entering credentials on a spoofed portal, the browser enforces that the passkey private key is never unlocked for the rogue domain.
* **Hardware User Presence & Verification:** Requires platform authenticator verification (Apple Touch ID / Face ID, Windows Hello, YubiKey biometric sensor).
* **Asymmetric Public-Key Cryptography:** The server only holds the public key. The private key resides exclusively within the hardware enclave (Secure Enclave / TPM).

---

## 3. Cryptographic Evidence Sealing (SHA-256 & AWS S3)

Every transaction placed on hold or released via step-up authentication generates an immutable audit package:

```
                  ┌──────────────────────────────┐
                  │ Transaction + Risk Report    │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Canonical JSON Serialization │
                  │  (Alphabetical keys,         │
                  │   ISO UTC datetimes)         │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ SHA-256 Cryptographic Hash   │
                  │ (64-character deterministic) │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Immutable AWS S3 Storage     │
                  │ (s3://evidence-vault/...)    │
                  └──────────────────────────────┘
```

1. **Deterministic Serialization:** Enforces alphabetical key sorting and normalized delimiters `(',', ':')` to guarantee reproducible hashes across different platforms.
2. **SHA-256 Digest:** Formulates a tamper-evident digital seal. Any post-event tampering with the transaction details or risk assessment invalidates the hash.
3. **Immutable S3 Object Vault:** Uploaded to AWS S3 with the hash embedded in object metadata (`x-amz-meta-sha256`), providing a verifiable chain of custody for fraud examiners and regulatory audits.
