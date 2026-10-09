# Glossary

| Term | Meaning in VeriFi |
|---|---|
| **Authority** | A person entitled to approve a class of payments (CFO, Treasurer…), per the authority matrix |
| **Authority matrix** | Tenant-configured table: amount band × payment type × entity → roles that must confirm |
| **Authority claim** | A statement in a communication that someone *is* an authority ("Rajesh Mehta (CFO)"); may be false |
| **BEC** | Business Email Compromise: fraud using email impersonation to divert payments |
| **Canonical transaction** | The exact JSON object (RFC 8785 canonicalized) that is shown to and signed by the confirmer |
| **Checkpoint** | A KMS-signed snapshot of the evidence chain head, stored under S3 Object Lock |
| **Confirmer** | A person asked to approve/deny a held payment; never the requester |
| **Cooling-off** | T2 waiting period between final approval and release |
| **Degraded decision** | A decision made while a dependency was unavailable; triggers the fail-safe rule R7 |
| **DKIM / SPF / DMARC** | Email authentication standards. Passing them proves the domain is genuine, **not** that it is the right domain |
| **Evidence chain** | Append-only, hash-linked log of every decision and action |
| **External provenance** | A beneficiary account that first entered the organisation through an external message |
| **IFSC** | Indian Financial System Code: identifies the bank branch for NEFT/RTGS/IMPS |
| **Incident pack** | PDF + JSON with everything needed for 1930 / cybercrime.gov.in and a bank recall request |
| **Lineage graph** | The Neo4j graph linking domains, identities, messages, meetings, claims, accounts, and payments |
| **Lookalike domain** | A domain imitating a legitimate one (`arup-group.co` vs `arup.com`) |
| **Materiality floor** | Amount below which the score alone never triggers a step-up (default ₹1,00,000) |
| **Mode A / B / C** | Integration modes: ERP API hook / bank-file gate / bank-side checker |
| **Passkey** | A FIDO2/WebAuthn credential: a private key on the user's device, unlocked by biometrics |
| **Policy rule (R1–R7)** | Deterministic condition that sets a minimum tier |
| **Provenance** | Where and how a beneficiary account first entered the organisation |
| **Requester / maker** | The employee who initiates or releases the payment in the ERP |
| **RP ID** | WebAuthn Relying Party ID; must match the domain serving the app |
| **Shadow mode** | VeriFi evaluates and alerts but does not hold payments (pilot entry mode) |
| **Short code** | First 8 hex characters of the canonical-transaction hash, shown on both ERP and phone |
| **SIMULATED** | Label for any component that is not real in the current build (ADR-014) |
| **T0 / T1 / T2** | Tiers: pass / one confirmation / two confirmations + cooling-off |
| **Token (`ACCT_…`)** | HMAC of an identifier; lets the system match accounts without exposing the number |
| **WYSIWYS** | "What you see is what you sign": the prompt is rendered from the signed object |
