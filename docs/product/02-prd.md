# Product Requirements Document (PRD)

> **Audience:** engineers, designers, demo owner · **Owner:** Product lead · **Status:** v1.0 for hackathon MVP
> Requirement IDs (`FR-x`, `NFR-x`) are referenced by the build plan and the test suite.

## 1. Goal

Stop payment-diversion fraud *at release time* by tracing the provenance of the beneficiary
account and, when the instruction can't be trusted, obtaining a transaction-bound passkey
confirmation from the real authority.

**MVP success = the reference demo works end to end on real infrastructure**: the deepfake
detector is fooled, and the payment is still held because the CFO denies it on their own phone
(`delivery/13-demo-script.md`).

## 2. Personas

| ID | Persona | Surface | Core job |
|---|---|---|---|
| P1 | **Priya, AP/Treasury maker** (requester) | ERP Simulator | Release payments without friction on normal days |
| P2 | **Rajesh, CFO** (authority / confirmer) | Approver PWA (phone) | Confirm or deny instructions given in their name, in seconds |
| P3 | **Anil, Treasurer** (second approver) | Approver PWA | Second confirmation on T2 payments |
| P4 | **Meera, Fraud analyst** | Analyst Console | Investigate held payments, release/reject, report fast |
| P5 | **Tenant admin** | Analyst Console (admin) | Configure the authority matrix, enroll passkeys, manage vendors |

## 3. Scope

| Capability | MVP (hackathon) | Pilot | Later |
|---|---|---|---|
| Email ingestion | `.eml` upload + real header parsing | Microsoft Graph / Gmail API | Other mail systems |
| Meeting ingestion | Meeting metadata + transcript (upload); deepfake score as **labelled slider** | Zoom/Teams metadata APIs, Amazon Transcribe | Real-time bot |
| Chat (WhatsApp etc.) | No | Forwarded-message ingestion | Business API |
| Vendor master | Seeded + CRUD | ERP sync | — |
| Provenance graph | Yes (core) | Yes | Consortium tokens |
| Policy + score | Yes, YAML policy v1 | Tenant-tunable | Calibrated weights |
| Authority confirmation (passkey) | Yes, on a real phone | Yes + push notifications | Secure Payment Confirmation |
| Integration | Mode A API hook + ERP Simulator | Mode B payment-file gate | Mode C bank-side |
| Evidence chain | Hash chain + KMS-signed checkpoints + Object Lock | Same + verifier CLI shipped to customers | — |
| Incident pack | PDF + JSON for 1930 / cybercrime.gov.in + bank recall draft | Same | Direct bank APIs |
| Analyst console | Queue, lineage graph, decision, pack | + SLA timers, notes | Case management |
| Shadow mode | Flag only | Yes (pilot entry mode) | — |

## 4. User stories (MVP)

**Requester (P1)**
- US-1. As a maker, when I release a payment to a known vendor's registered account, it goes
  through immediately and I see nothing extra.
- US-2. As a maker, when my payment needs confirmation, I see *who* has been asked and a
  plain-language summary of why, and I am not asked to approve it myself. Detailed signals go
  only to confirmers and analysts, so an insider cannot learn how to evade them.

**Authority (P2, P3)**
- US-3. As the CFO, I get a prompt on my phone that shows the exact amount, beneficiary name,
  last 4 digits of the account, IFSC, the requester, and the reason VeriFi is asking.
- US-4. As the CFO, I can Approve or Deny ("I didn't ask for this") with my phone's biometrics,
  and my decision is final and signed.
- US-5. As the CFO, if I deny, I immediately see that the payment is held and the fraud team has
  been alerted.

**Analyst (P4)**
- US-6. As an analyst, I see a queue of held and pending payments ordered by risk and value.
- US-7. As an analyst, for a payment I see the provenance chain: domain → sender → message →
  meeting → claimed authority → account → payment, with every signal and its contribution.
- US-8. As an analyst, I can generate an incident pack (PDF + JSON) in one click.
- US-9. As an analyst, I can release (with a reason) or reject a held payment; both are recorded
  in the evidence chain.
- US-10. As an auditor, I can verify the evidence chain for any payment independently.

**Admin (P5)**
- US-11. As an admin, I define the authority matrix (amount bands × payment types → roles).
- US-12. As an admin, I issue one-time enrollment links so authorities register passkeys on their
  own phones.

## 5. Functional requirements

### Ingestion & extraction
- **FR-1** Accept an email as RFC 5322 (`.eml`). Parse `From`, display name, `Reply-To`,
  `Return-Path`, `Received` chain, and the `Authentication-Results` header (SPF, DKIM, DMARC
  results and alignment). Never accept SPF/DKIM values as user-supplied form fields.
- **FR-2** Extract financial identifiers (account no., IFSC, UPI ID, amounts in INR formats
  including lakh/crore notation) with deterministic recognizers; tokenize per ADR-008.
- **FR-3** Run LLM extraction (intent, urgency, secrecy, authority claims, payment instructions)
  on tokenized text asynchronously; results are additive only (ADR-009).
- **FR-4** Domain intelligence for every external sender domain: lookalike match against the
  tenant's own and vendors' domains (dnstwist permutations + edit distance + homoglyphs), and
  domain age via RDAP. Results are cached; demo fixtures are allowed and labelled.
- **FR-5** Accept a meeting record: platform, title, scheduled time, invite link (to join to the
  inviting email), participants (display name, account email/domain, internal/external flag),
  optional transcript, optional media-authenticity score (MVP: slider, labelled SIMULATED).
- **FR-6** Resolve authority claims to internal people (`Person`) by name/role/email; unresolved
  claims are kept as `AuthorityClaim` with `resolved=false`.

### Graph
- **FR-7** Write all entities and relations of `architecture/05-graph-data-model.md`, tenant-scoped,
  with native datetimes.
- **FR-8** Maintain `BankAccount.first_seen_at` and `first_seen_via` (vendor onboarding | ERP |
  external message | internal message | manual).

### Decision
- **FR-9** `POST /v1/payments/evaluate` returns a decision (tier, state, score, fired rules,
  per-group contributions, confirmers) for a payment. Idempotent on `(tenant, external_payment_id)`.
- **FR-10** Policy rules R1–R7 of `architecture/06-signals-risk-and-policy.md`, loaded from a
  versioned YAML file; the policy version is recorded on every decision.
- **FR-11** Fail-safe behaviour per ADR-007; `degraded` flag on the decision.

### Confirmation
- **FR-12** Compute the confirmer set per ADR-004; never include the requester.
- **FR-13** Create a confirmation request with two transaction-bound challenges per ADR-005;
  default expiry 30 minutes (tenant-configurable).
- **FR-14** Approver PWA: list pending requests for the logged-in authority; render from the
  canonical transaction; Approve/Deny with WebAuthn (user verification required).
- **FR-15** Verify assertions with `py_webauthn`; reject on wrong origin, RP ID, credential not
  owned by a confirmer, reused challenge, counter regression, or expiry.
- **FR-16** State machine per `architecture/07-confirmation-protocol.md`; T2 enforces two
  distinct confirmers and the cooling-off period.
- **FR-17** Callback to the ERP (webhook, signed) when a pending payment is released or held.

### Evidence & response
- **FR-18** Append an evidence record for every state transition; chain per ADR-010.
- **FR-19** Sign and anchor checkpoints (on incident, and every N records/minutes).
- **FR-20** Incident pack generation (PDF + JSON) per `architecture/08-evidence-and-response.md`.
- **FR-21** Chain verification endpoint and CLI.

### Analyst & admin
- **FR-22** Queue of `PENDING_CONFIRMATION` and `HELD_FOR_REVIEW` payments.
- **FR-23** Lineage view returns **only** the subgraph reachable from the payment within the tenant
  (bounded depth), rendered with Cytoscape.js.
- **FR-24** Release/reject with mandatory reason; reject opens/updates the incident.
- **FR-25** Authority matrix CRUD; vendor master CRUD; passkey enrollment links.

## 6. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | Evaluate latency p95 ≤ 300 ms (precomputed graph facts; no LLM call on the path) |
| NFR-2 | All APIs authenticated: service API key + HMAC request signing for ERP; passkey sessions for humans |
| NFR-3 | Tenant isolation enforced in every query; automated test for cross-tenant access |
| NFR-4 | No raw account numbers, phones, PAN, or Aadhaar in logs, LLM prompts, or Neo4j |
| NFR-5 | Survives restart with no lost state (all state in Postgres) |
| NFR-6 | Deterministic: same inputs + same policy version → same decision |
| NFR-7 | Every simulated component labelled (ADR-014) |
| NFR-8 | Runs locally with one `docker compose up`; demo deploy on HTTPS (ADR-018) |
| NFR-9 | Audio/file uploads size-limited (default 25 MB) and type-checked |
| NFR-10 | Accessibility: Approver PWA usable one-handed; amounts formatted in Indian notation (₹5,00,00,000) |

## 7. Out of scope (MVP)

Real ERP/bank connections, real-time meeting bots, WhatsApp ingestion, consortium intelligence,
ML-calibrated weights, mobile push notifications (the Approver PWA polls), multi-currency FX
beyond a static rate table.

## 8. Acceptance criteria (MVP is "done" when…)

1. Scenario S1 (Arup-style) in `delivery/12-test-and-validation.md` lands in T2 **with the deepfake
   slider at 0.12**, routes to the CFO's phone, and a DENY holds the payment and produces an
   incident pack.
2. Scenario S3 (routine vendor payment) passes as T0 with no prompt.
3. Every failure-mode regression test (FM-1 … FM-14 in `delivery/12-test-and-validation.md`) passes.
4. The evidence chain for S1 verifies with the CLI, and tampering with one record breaks it.
5. A judge can read any file and find nothing that contradicts the pitch.
