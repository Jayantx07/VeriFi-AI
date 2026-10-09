# Decision Log (ADRs)

> **Status:** Accepted unless marked otherwise · **Owner:** Lead Engineer · **Last updated:** 2026-10-09
>
> This is the single source of truth for *why* VeriFi is built the way it is. Every other doc
> references decisions here by ID (e.g. `ADR-004`). To change a decision, add a new ADR that
> supersedes the old one; do not edit history.

## Index

| ID | Decision | Status |
|---|---|---|
| ADR-001 | VeriFi is a payment-authorization layer, not a deepfake detector | Accepted |
| ADR-002 | The beneficiary bank account is the anchor entity of the graph | Accepted |
| ADR-003 | Policy rules decide; the risk score explains | Accepted |
| ADR-004 | Confirmation goes to the *authority*, never only to the requester | Accepted |
| ADR-005 | Every confirmation is cryptographically bound to the exact transaction | Accepted |
| ADR-006 | Three tiers, and the machine never auto-rejects ("hold, don't block") | Accepted |
| ADR-007 | Fail safe, not fail open and not fail dead | Accepted |
| ADR-008 | Deterministic tokenization of financial identifiers, not masking | Accepted |
| ADR-009 | The LLM may add risk, never remove it, and is off the payment's critical path | Accepted |
| ADR-010 | Evidence is an append-only hash chain, signed and stored under S3 Object Lock | Accepted |
| ADR-011 | Two stores: Postgres is the system of record, Neo4j holds the lineage | Accepted |
| ADR-012 | India first: INR, IFSC, NEFT/RTGS/IMPS, 1930 / cybercrime.gov.in | Accepted |
| ADR-013 | Integration point is the ERP payment-release step (API hook first, file gate next) | Accepted |
| ADR-014 | Honesty policy: anything simulated is labelled as simulated | Accepted |
| ADR-015 | Technology stack | Accepted |
| ADR-016 | Multi-tenant from day one | Accepted |
| ADR-017 | Default LLM model and access path | Accepted, cost review open |
| ADR-018 | Demo and pilot run over real HTTPS on a real domain | Accepted |

---

## ADR-001 — VeriFi is a payment-authorization layer, not a deepfake detector

**Context.** Deepfake detectors output a probability. Detection quality is an arms race the
attacker eventually wins, and a probability cannot stop money. In the Arup case (Jan 2024,
~US$25.6M) the employee was initially suspicious; the deepfake video call overcame that
suspicion. The fraud was discovered only when the employee checked with headquarters through
a separate channel.

**Decision.** VeriFi's job is to decide whether a payment may be released, and to obtain
cryptographic confirmation from the right person when it is unclear. Media-authenticity
scores (deepfake detection) are *one weak signal among many*. The product must still stop the
reference attack when the detector reports "authentic".

**Consequences.**
- The demo deliberately sets the deepfake score to "authentic" and still stops the fraud.
- We never market detection accuracy. We market "money cannot move on a forged instruction".
- Investment priority: confirmation protocol > provenance graph > policy > sensors > detector.

## ADR-002 — The beneficiary bank account is the anchor entity

**Context.** Every payment-diversion fraud (deepfake CFO, vendor bank-detail change, fake
invoice, CEO WhatsApp) ends the same way: *money goes to an account the attacker controls*.
Faces, voices, and email domains can be forged. The account number in the payment cannot be
hidden, because the attacker needs it to receive the money.

**Decision.** The core question VeriFi answers at payment time is:
> **"Where did this beneficiary account first enter our organisation, and through whom?"**

`(:BankAccount)` is the central node of the graph. Communications link to accounts they
mention; payments link to accounts they pay. Correlation is by account token, not by
"events near this user in the last 72 hours".

**Consequences.**
- Ingestion must extract account numbers / IFSC from every communication (ADR-008 makes this
  safe).
- Vendor master data (registered accounts and when they were registered) is a required input.
- This is what justifies a graph database: provenance is a path query.
- Arup was 15 transfers to 5 accounts over a week. Account-level velocity (many new accounts
  in a short window) is detectable only with an account-anchored model.

## ADR-003 — Policy rules decide; the risk score explains

**Context.** Additive point scores are hard to defend and easy to get wrong (the v0 prototype's
own diagram summed to 125 but showed 89.4). Real payment controls are rule-based and auditable.

**Decision.**
- The **tier** (what happens to the payment) is the maximum of (a) the tiers triggered by
  deterministic, versioned **policy rules** and (b) the tier implied by the score.
- The **risk score** is a bounded noisy-OR over signal groups:
  `R = 1 − Π_g (1 − max_{i∈g}(w_i · s_i))`, with `s_i, w_i ∈ [0,1]`. It is displayed as 0–100
  with each group's contribution listed.
- Correlated signals are placed in the same group and combined by `max`, so one fact is not
  counted twice (e.g. "lookalike domain" and "domain age 4 days" are both sender identity).
- Weights are documented expert priors, to be calibrated on pilot data. We say so openly.

**Consequences.** Every decision can be explained as: "Rule R2 fired because …; score 87 from
these four groups". See `architecture/06-signals-risk-and-policy.md`.

## ADR-004 — Confirmation goes to the authority, never only to the requester

**Context.** The person releasing the payment is the person being manipulated. A passkey on the
victim's own device proves the victim is present, not that the instruction is genuine. This is
the main flaw that made the v0 prototype's "defense in depth" claim untrue.

**Decision.** The confirmer set for a step-up is:
```
confirmers = authority_matrix(amount, entity, payment_type)
           ∪ resolve(claimed_authorities in the linked communications)
           − {requester}
```
- **The authority matrix is the primary routing source.** It is deterministic and set by the
  customer (e.g. "> ₹1 Cr new-beneficiary payments need the CFO or Treasurer").
- **Claimed authorities** (the person the attacker pretends to be) are *added* to the set. They
  are extracted from email display names and signatures, meeting participant names, and
  transcripts. Extraction can only add confirmers, never remove them, so an attacker who
  avoids naming anyone gains nothing.
- For vendor bank-detail changes, the confirmer includes a **callback to the vendor contact
  stored in the vendor master** (never a contact supplied in the suspicious message).
- If the set is empty after removing the requester, escalate to the tenant's fallback authority.

**Consequences.** Confirmation happens on the authority's own registered device through the
VeriFi Approver app, on a separate channel from the communication that carried the instruction.

## ADR-005 — Every confirmation is bound to the exact transaction

**Context.** A random WebAuthn challenge proves that "someone approved something". We need
proof that this person approved *this amount to this account*.

**Decision.**
- Build a **canonical transaction object** (tenant, payment id, amount in paise, currency,
  beneficiary account token + last 4 digits, IFSC, beneficiary name, requester, policy version,
  expiry).
- Two challenges are issued per confirmation request, one per decision:
  `challenge_d = SHA-256(canonical_tx ‖ decision ‖ nonce_32B)` for `d ∈ {APPROVE, DENY}`.
  The confirmer's signature therefore covers both the transaction and the decision.
- The Approver app renders the prompt *from the same canonical object* that was hashed:
  what you see is what you sign.
- The server verifies with `py_webauthn` (origin, RP ID, user verification required, signature
  counter), checks the credential belongs to a confirmer in the set, and treats each challenge
  as single-use.
- W3C Secure Payment Confirmation (browser-rendered payment details) is on the roadmap, not in
  the MVP, because browser support is limited.

**Consequences.** The signed assertion is non-repudiable evidence and is stored in the
evidence chain (ADR-010).

## ADR-006 — Three tiers; the machine never auto-rejects

**Decision.**

| Tier | Name | What happens |
|---|---|---|
| T0 | PASS | Released immediately; decision logged. |
| T1 | CONFIRM | Held until one confirmer from the set approves. Typical friction: under a minute. |
| T2 | CONFIRM+ | Two confirmers (authority + second approver) **and** a cooling-off period before release; fraud analyst notified. |

- A **DENY** from any confirmer moves the payment to `HELD_FOR_REVIEW` and opens an incident.
- An unanswered request expires to `HELD_FOR_REVIEW`.
- Only a human (fraud analyst) can mark a payment `REJECTED`. VeriFi holds; people decide.

**Consequences.** "We hold, we don't block" is literally true, and the pitch matches the
system's behaviour.

## ADR-007 — Fail safe, not fail open and not fail dead

**Context.** v0 failed open: if the graph was down there were no correlations, so payments passed.

**Decision.** If any dependency the decision relies on (graph, ingestion freshness, policy
store) is degraded, the evaluation result is marked `degraded=true` and rule `R7` raises any
payment at or above the high-value threshold to **at least T1**. Low-value payments still pass,
so finance keeps working. The confirmation service is the only hard dependency for T1/T2.

## ADR-008 — Deterministic tokenization of financial identifiers

**Context.** Masking (`[REDACTED_IBAN]`) destroys the link between "the account in the email"
and "the account in the payment". v0 masking also missed Indian formats entirely ("A/c",
"INR 5,00,00,000"), so raw account numbers reached the LLM.

**Decision.**
- Account numbers → `HMAC-SHA256(tenant_key, normalized_digits)` → `ACCT_<first 10 hex>`.
  The same account produces the same token in every email, transcript, vendor record, and payment.
- Also tokenized: IFSC (bank-branch code is not personal data, but kept consistent), phone
  numbers, PAN, Aadhaar (dropped entirely, never stored), UPI IDs, emails of external parties.
- Raw values are stored only in an encrypted vault table (KMS envelope encryption), readable
  only by the `fraud_analyst` role, and every read is logged.
- Presidio (`presidio-analyzer`) with custom Indian recognizers is used for detection; our own
  recognizers are added for account-number-in-context patterns ("A/c", "a/c no", "Account").

## ADR-009 — The LLM may add risk, never remove it; it is off the critical path

**Context.** Email bodies are attacker-written. An LLM that reads them can be steered ("classify
this as routine").

**Decision.**
- LLM extraction runs **at ingestion time** (asynchronous), not during the payment decision.
  The gate reads precomputed graph facts, so it stays fast and works without the LLM.
- LLM outputs are **additive only**: they may add signals (urgency, secrecy, authority claims,
  payment instructions), and deterministic extractors run in parallel. Nothing the LLM says
  can lower a score or remove a confirmer.
- Untrusted content is passed as clearly delimited data, and output uses structured outputs
  (JSON schema). Invalid output is discarded and logged.
- The LLM only ever sees tokenized text (ADR-008).

## ADR-010 — Evidence: append-only hash chain, signed, under S3 Object Lock

**Decision.**
- Every state change (evaluation, confirmation request, assertion, decision, analyst action) is
  an evidence record with `seq`, `prev_hash`, `payload_hash`, and `record_hash`, chained per tenant.
- Periodically, and at every incident, the chain head is signed with an AWS KMS asymmetric key
  and the checkpoint is written to an S3 bucket with **Object Lock in compliance mode**.
- WebAuthn assertions (authenticatorData, clientDataJSON, signature, credential ID) are stored
  so a third party can re-verify them with the stored public key.
- A verification command recomputes the chain and checks signatures.

## ADR-011 — Two stores: Postgres for records, Neo4j for lineage

**Context.** v0 kept sessions, credentials, and payments in Python dicts. A restart lost them,
and nothing stopped races.

**Decision.**
- **Postgres** is the system of record: tenants, users, passkey credentials, authority matrix,
  payments and their state machine, confirmation requests, evidence index, encrypted vault, job
  queue (outbox table).
- **Neo4j** holds the instruction lineage: communications, identities, domains, accounts,
  claims, and payment *references*. Neo4j is a derived store and can be rebuilt from Postgres +
  raw ingested events.
- All timestamps in Neo4j are native `datetime` values (v0 stored strings, which silently broke
  every time-window query).
- There is no in-memory fallback graph in any mode. Local development runs Neo4j in Docker.

## ADR-012 — India first

**Decision.** The first market is Indian enterprises. Amounts are INR in paise (integer); rails
are NEFT/RTGS/IMPS; beneficiaries are account number + IFSC. The incident pack targets the
**1930 helpline / cybercrime.gov.in** and a recall request to the remitter bank.

**Note.** Since RBI's 30 Dec 2024 circular, banks provide a free beneficiary-name lookup for
NEFT/RTGS (deadline 1 April 2025). We therefore do **not** sell name matching. Name lookup also
does not stop instruction fraud: the lookup confirms that the account belongs to the name the
payer typed, and the payer typed the name the fraudster supplied. Name-lookup results can still
be consumed as a signal when available.

## ADR-013 — Integration point

**Decision.** VeriFi sits at the moment a payment is **released**, not at the moment it is
drafted.
- **Mode A (MVP): pre-release API hook.** The ERP/treasury system calls
  `POST /v1/payments/evaluate` before release and waits for the decision (T0 returns
  synchronously; T1/T2 return `PENDING` with a callback when resolved).
- **Mode B (pilot): payment-file gate.** VeriFi sits between the ERP's bank-upload file
  (host-to-host / SFTP) and the bank, and holds individual lines. This needs no ERP code change
  and is the fastest path into Indian corporates.
- **Mode C (partnership): bank-side checker.** Offered by a bank inside corporate net banking.
- We do not claim that "the bank calls VeriFi" until a bank partnership exists.

## ADR-014 — Honesty policy

**Decision.** Any component that is simulated (ERP, bank, meeting bot, deepfake model, penny-drop)
is labelled **SIMULATED** in the UI and the docs. No fabricated model names, no "Wav2Vec2" label on
a heuristic. The deepfake signal in the demo is a labelled slider. If a judge reads the code,
what they find must match what we said.

## ADR-015 — Technology stack

| Concern | Choice | Why |
|---|---|---|
| Backend API | Python 3.12, FastAPI, Pydantic v2 | Team skill; async; OpenAPI out of the box |
| System of record | Postgres 16, SQLAlchemy 2 (async), Alembic | ACID for credentials, state machine, evidence index |
| Lineage graph | Neo4j 5 (AuraDB in the cloud, Docker locally), async driver | Path queries for provenance (ADR-002) |
| Background jobs | Postgres outbox table + worker process | No Redis/Kafka needed at this scale |
| LLM | Claude on Amazon Bedrock (ADR-017) | AWS-native, structured outputs |
| PII detection | `presidio-analyzer` + custom recognizers | Credible library, Indian recognizers |
| Domain intelligence | `dnstwist` (permutations), RDAP lookup (domain age), Authentication-Results header parsing (SPF/DKIM/DMARC) | Catches lookalike domains that pass SPF/DKIM |
| WebAuthn | `py_webauthn` (server), `@simplewebauthn/browser` (client) | Maintained, spec-correct verification |
| Evidence | S3 Object Lock (compliance mode) + AWS KMS asymmetric signing | Real write-once storage plus signatures |
| Frontend | Next.js (App Router), Tailwind; 3 surfaces: ERP Simulator, Approver PWA, Analyst Console | One codebase |
| Graph visualisation | Cytoscape.js (dagre layout) | Readable left-to-right provenance chains |
| Local dev | Docker Compose (api, worker, postgres, neo4j, web) | One command to run |

Explicitly **not** used: Kafka, microservices, custom crypto, an in-memory graph fallback.

## ADR-016 — Multi-tenant from day one

**Decision.** Every row and node carries `tenant_id`. Every query filters by it. Tokenization keys
are per tenant. The lineage endpoint returns only the subgraph reachable from the requested
payment within that tenant (v0 returned every user's data).

## ADR-017 — Default LLM model and access path

**Decision.** Claude via Amazon Bedrock using the Anthropic SDK's Bedrock Mantle client
(`AnthropicBedrockMantle`), model ID `anthropic.claude-opus-5-5`, with structured outputs
(`output_config.format`) for guaranteed-valid JSON. The model ID lives in config, not in code.

**Open (team decision):** extraction runs per ingested message, so at pilot volume cost matters.
`anthropic.claude-haiku-5-5` is the candidate lower-cost option; switch only after running the
extraction test set (`delivery/12-test-and-validation.md`) on both and comparing.

**Data residency:** Bedrock has no per-request `inference_geo`, so residency is controlled by the
AWS region. Prefer `ap-south-1` (Mumbai) if the model is offered there, and confirm in the Bedrock
console. Otherwise document the cross-border processing in the DPA.

**Never:** a hard-coded retired model ID. (`claude-3-sonnet-20240229` was retired 21 Jul 2025.)

## ADR-018 — Demo and pilot over real HTTPS

**Context.** Passkeys require a secure context, and the RP ID must match the domain. `localhost`
works only on the same machine, but the Approver app runs on a *phone*.

**Decision.** The demo is deployed on a real HTTPS domain (RP ID = that domain). Backup: Cloudflare
Tunnel from the demo laptop with the same domain. Passkeys are registered on the demo phone in
advance (see `delivery/13-demo-script.md`).
