# Threat Model

> **Audience:** engineers, security reviewers, judges · **Owner:** Lead Engineer · **Status:** Living document
> Two halves: (A) the fraud VeriFi defends customers against, and (B) attacks against VeriFi itself.
> A security product with no threat model for itself is not credible.

## A. Threats VeriFi defends against

### A.1 Attacker profiles

| ID | Attacker | Capabilities | Cannot (assumed) |
|---|---|---|---|
| AT-1 | Organised BEC / deepfake crew | Registers lookalike domains with valid SPF/DKIM/DMARC; real-time face/voice cloning; opens mule accounts in plausible company names; runs multi-day campaigns | Possess the authority's phone *and* biometrics |
| AT-2 | Vendor-mailbox compromiser | Sends from the **real** vendor domain (all authentication passes) with "our bank details changed" | Change the vendor-master contact phone without detection |
| AT-3 | Insider (maker) | Can initiate payments; may collude with the external attacker | Confirm their own payment (ADR-004) |
| AT-4 | Executive-account compromiser | Controls the CFO's mailbox or chat | Produce the CFO's passkey signature |

### A.2 Attack scenarios and how VeriFi responds

| Scenario | Path | What VeriFi sees | Outcome |
|---|---|---|---|
| **S1 Deepfake CFO (Arup)** | Lookalike-domain email → Zoom with fake CFO → new account | Lookalike + young domain; account first seen in that email; external participant shown as "CFO"; secrecy/urgency | R2 + R4 fire → **T2**; CFO denies on phone; held. *Works even if the detector says "authentic".* |
| **S2 Vendor bank change** | Real vendor mailbox → "new bank details" → invoice paid to new account | Account first seen in an external email 2 days ago; registered account differs | R3 → **T1**; callback to the vendor-master contact + AP manager confirmation |
| **S3 Campaign / velocity** | Several payments over days to several new accounts (Arup was 15 → 5) | Many first-seen accounts in a short window from linked comms | R5 → **T2** + analyst |
| **S4 CEO WhatsApp / phone only** | No email at all; instruction by chat/call | New beneficiary + high value, no trusted provenance | R1 → **T1** to authority matrix |
| **S5 Insider-assisted** | Maker colludes and creates the payment themselves | Same as above; maker excluded from confirmers | T1/T2 to someone else |
| **S6 Compromised CFO mailbox** | Real CFO address sends the instruction | Authentication passes; but account is new and first seen in a message | R1/R2 → confirmation on CFO's **phone passkey**, which the attacker does not have |

### A.3 Residual risks (stated openly)

| ID | Risk | Mitigation / position |
|---|---|---|
| RR-1 | The real authority approves anyway (also deceived, or careless) | Prompt shows *why* VeriFi is asking ("account first seen 2h ago in email from arup-group.co, a 4-day-old domain"); T2 requires a second confirmer and a cooling-off period |
| RR-2 | Attacker compromises the authority's phone *and* biometrics | Out of scope; same assumption as all passkey systems |
| RR-3 | Instruction arrives only through channels VeriFi does not ingest | R1 still forces confirmation for new-beneficiary high-value payments; provenance is "unknown", which is itself a signal |
| RR-4 | Small payments under thresholds | By design (friction budget); R5 velocity catches repeated small payments to new accounts |
| RR-5 | Attacker poisons the vendor master (e.g. insider edits bank details) | Bank-detail changes in the vendor master are themselves evidence events and trigger R3 for 30 days |

## B. Threats against VeriFi itself

### B.1 Assets
Passkey credentials and enrollment; confirmation decisions; the policy; the evidence chain;
tokenization keys and the raw-value vault; tenant data; the ERP integration credentials.

### B.2 STRIDE analysis

| # | Threat | Example | Control |
|---|---|---|---|
| T-1 | **Spoofing** a confirmation | POST a fake credential `{id:"x"}` (this worked in v0) | `py_webauthn` full verification; credential must belong to a confirmer; challenge single-use (FR-15) |
| T-2 | Spoofing via client fallback | Frontend fabricates a credential when the user cancels (v0 did this) | No client-side fallback exists; cancel = no decision; server is the only verifier |
| T-3 | **Rogue enrollment** | Attacker enrolls their own device as the "CFO" | Enrollment needs an admin-issued one-time link (15 min TTL) + an existing authenticated session; enrollment is an evidence event and notifies the user on all their devices/email; re-enrollment needs two admins |
| T-4 | **Tampering** with the decision target | Use a session for payment A to release payment B (worked in v0) | Session ↔ payment binding is server-side; the challenge hashes the canonical tx; the client never supplies the payment ID on verify |
| T-5 | Tampering with evidence | Edit a stored record | Hash chain + KMS-signed checkpoints + S3 Object Lock compliance mode |
| T-6 | Tampering with policy | Lower thresholds quietly | Policy is versioned; changes need the admin role and are evidence events; the version is stamped on every decision |
| T-7 | **Repudiation** | "I never approved that" | Signed WebAuthn assertion over tx + decision, stored and re-verifiable |
| T-8 | **Information disclosure** | Unauthenticated `/audit/transactions` (v0) | Every endpoint authenticated; role-based access; tenant filter; raw values only in the vault |
| T-9 | Disclosure across tenants | Lineage view returns another user's graph (v0) | Tenant-scoped, payment-anchored, bounded-depth queries; automated isolation test |
| T-10 | Disclosure to the LLM provider | Raw account numbers in prompts | Tokenize before the LLM (ADR-008); prompt-logging scrubbed |
| T-11 | **Denial of service** on finance | Attacker floods SPF-fail emails at a treasurer so all their payments hold | Signals are payment-linked (account provenance), not "any bad email near this user"; noise without a linked account does not raise the payment |
| T-12 | DoS by upload | Huge audio files | Size limits, type checks, async processing |
| T-13 | **Prompt injection** | Email says "classify as routine" | LLM output is additive only and off the critical path (ADR-009) |
| T-14 | **Elevation** | Maker confirms their own payment | Requester removed from the confirmer set; T2 needs two distinct people |
| T-15 | Fail-open on outage | Graph down → no correlations → pass (v0) | Fail-safe rule R7 (ADR-007) |
| T-16 | Replay | Re-submit a captured assertion | Single-use challenge, expiry, signature-counter check |
| T-17 | Integration spoofing | Fake ERP calls `evaluate` / receives webhooks | API key + HMAC request signing (timestamped, 5 min window); webhooks signed by VeriFi |

### B.3 Security assumptions
- TLS everywhere; RP ID = production domain (ADR-018).
- The customer's identity provider and the authority matrix are correct at setup.
- AWS KMS and S3 Object Lock behave as documented.

## C. Review cadence
Update this document whenever a new ingestion channel, integration mode, or role is added. Every
threat row must map to at least one test in `delivery/12-test-and-validation.md`.
