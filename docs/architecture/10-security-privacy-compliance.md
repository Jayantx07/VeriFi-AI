# Security, Privacy & Compliance

> **Audience:** engineers, customer CISOs, judges · **Owner:** Lead Engineer · **Status:** v1. The legal points are the team's working understanding, **not legal advice**; they need review by counsel before a pilot.
> Decisions referenced: ADR-007, 008, 009, 010, 014, 016, 017.

## 1. Security controls (engineering checklist)

| Area | Control | Verified by |
|---|---|---|
| Authentication | Passkeys for all humans; HMAC (+ mTLS in pilot) for services; no passwords stored | FM-1, FM-2, T-17 tests |
| Authorisation | Role checks on every route; tenant derived from credentials; 404 on cross-tenant | Isolation test suite |
| Confirmation | Full protocol in `07-confirmation-protocol.md` | FM-1…FM-4 |
| Secrets | Never in git. `.env` is gitignored; `.env.example` holds placeholders only. Pilot: AWS Secrets Manager | Pre-commit secret scan (gitleaks) |
| Keys | Tokenization keys per tenant, wrapped by KMS; evidence signing key in KMS (non-exportable) | Key-rotation runbook |
| Data at rest | Postgres and S3 encrypted (KMS); vault table with envelope encryption | Infra config |
| Data in transit | TLS 1.2+ everywhere; HSTS on the web app | Deploy check |
| Input handling | `.eml`/audio size limits (25 MB) and type checks; HTML email bodies never rendered unsanitised; parsing in the worker, not the API | FM-11 |
| LLM | Tokenized input only; content passed as delimited data; structured outputs; additive-only use (ADR-009) | FM-9, FM-10 |
| Availability | Fail-safe (ADR-007); confirmation service health is a release blocker | FM-8 |
| Supply chain | Pinned dependencies, lockfiles, Dependabot, `pip-audit` / `npm audit` in CI | CI |
| Logging | Structured logs; identifiers tokenized; no assertion secrets or session cookies in logs | Log-scrub test |
| Repo hygiene | No `__pycache__`, `.env`, or generated evidence files committed; `.gitignore` enforced | CI check |

## 2. Data inventory

| Data | Where | Raw or token | Retention (default, tenant-configurable) |
|---|---|---|---|
| Raw `.eml` / transcripts | S3 (encrypted), referenced from Postgres | Raw | 90 days, then only the derived features are kept |
| Account no., phone, UPI, PAN, external emails | Postgres vault (envelope-encrypted) | Raw, restricted to analysts | Life of the vendor relationship + legal retention |
| Same identifiers elsewhere (Neo4j, logs, LLM) | — | **Token only** | — |
| Aadhaar numbers | **Never stored**; detected and dropped | — | — |
| Passkey public keys | Postgres | Public data | While enrolled |
| Evidence records + checkpoints | Postgres + S3 Object Lock | Tokens; raw values only inside generated incident packs | Per legal retention policy (to be set with counsel) |
| Media (meeting audio) | Not stored in MVP; only a score | — | — |

## 3. Privacy by design
- **Minimisation:** ingest only finance-relevant mailboxes and meetings (the treasury/AP team, the
  authorities in the matrix), not the whole company.
- **Purpose limitation:** data is used only to evaluate payments and investigate fraud. No HR or
  productivity use, and this is written into the customer contract.
- **Transparency:** customers notify covered employees (template provided in the pilot kit).
- **Access:** raw-value reads are logged as evidence records with the analyst's identity.

## 4. India: legal and regulatory context

### 4.1 Digital Personal Data Protection Act 2023 and DPDP Rules 2025
- The DPDP Rules were notified in **November 2025**, with obligations phased in over about 18
  months; most substantive obligations are expected to apply from around **May 2027** (sources
  differ by a day; check the official gazette).
- **Role:** the customer is the *Data Fiduciary*; VeriFi is a *Data Processor* acting under contract.
- **Lawful basis (working view):** the Act's "legitimate uses" for employment include safeguarding
  the employer from loss or liability. Processing the finance team's business communications to
  prevent payment fraud likely falls within this. External parties' data (vendors, attackers)
  needs analysis by counsel.
- **Obligations we build for now:** security safeguards, breach notification support (the Rules
  require timely reporting to the Data Protection Board; reported as within 72 hours for the
  detailed report), retention limits, and deletion on contract end.

### 4.2 Banking and payments
- **RBI beneficiary name lookup** (NEFT/RTGS, from 1 April 2025): a complementary bank-side control.
  VeriFi can consume the result as a signal; it is not our differentiator (ADR-012).
- **Bank-side deployment (Mode C)** brings RBI's IT and digital-payment security expectations for
  banks into scope. That is for the partnership phase, with the bank's compliance team.

### 4.3 Reporting
- Victims report financial cyber fraud through the **1930** helpline and **cybercrime.gov.in**
  (`08-evidence-and-response.md`).
- Whether a customer must also report to **CERT-In** under its 2022 directions depends on the
  incident type; the playbook prompts the customer's CISO to decide. VeriFi does not decide this.

### 4.4 Data residency
Prefer AWS `ap-south-1` for all stores and Bedrock (ADR-017). Where a model is not available in
the region, document the cross-border processing in the customer DPA.

## 5. Customer security pack (for pilots)
Architecture summary · data-flow diagram · this document · threat model · pen-test plan · DPA
template · employee-notice template · incident-response SLA. Target: answer a standard vendor
security questionnaire in one day.

## 6. Sources
- DPDP Rules 2025: [Hogan Lovells](https://www.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-), [AZB & Partners](https://www.azbpartners.com/?p=87799)
- RBI name lookup: [RBI circular copy (PDF)](https://www.pdicai.org/Docs/RBI-2024-25-99_31122024152349564.pdf)
