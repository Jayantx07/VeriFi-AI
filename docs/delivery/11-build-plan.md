# Build Plan

> **Audience:** the build team · **Owner:** Lead Engineer · **Status:** Draft. **Open inputs: hours to submission and team size.** Estimates assume 4 people; adjust the cut line in §5 when the deadline is known.

## 1. Principles
1. **Build the spine first.** The confirmation protocol (passkey on the authority's phone, bound to
   the transaction) is the product. It has the highest technical risk (HTTPS, RP ID, a real phone),
   so it is built and tested on a phone **in the first working block**.
2. **Rebuild, don't patch.** The v0 code is reference only. New code follows `04-system-architecture.md`.
3. **Every milestone ends demoable.** If time runs out, the last finished milestone is what we show.
4. **Fixtures are fine if labelled.** Domain-age lookups, the meeting feed, and the deepfake score can
   come from labelled fixtures (ADR-014). The protocol, policy, graph, and evidence must be real.

## 2. Milestones

| # | Milestone | Scope | Est. (person-hours) | Depends on | Owner |
|---|---|---|---|---|---|
| M0 | Foundations | New repo layout; Docker Compose (api, worker, web, postgres, neo4j); Alembic; Neo4j constraints; config; HMAC auth; CI running tests; `.gitignore` cleanup; seed script (tenant, people, authority matrix, vendors) | 5 | — | A |
| M1 | **Confirmation spine** | Enrollment link → passkey registration; passkey login; canonical tx (JCS); dual challenges; `py_webauthn` verification; state machine; Approver PWA pending/decide screens; **deployed on HTTPS and tested on a real phone** | 10 | M0 | A + C |
| M2 | Provenance ingest | `.eml` parsing + Authentication-Results; recognizers + tokenizer + vault; domain intel (dnstwist, RDAP, fixtures); graph writer; meeting ingest; Q1/Q2/Q3 | 10 | M0 | B |
| M3 | Decision | Policy engine (pure function) + YAML; R1–R7; score + contributions; fail-safe; `/payments/evaluate`; webhook | 6 | M0, M2 (facts interface can be stubbed first) | A |
| M4 | Evidence & response | Evidence records + chain; checkpoints (KMS + Object Lock, or `LOCAL_DEV`); verifier (API + CLI); incident pack PDF/JSON | 7 | M1, M3 | D |
| M5 | Surfaces | ERP Simulator (release a payment, see state + short code); Analyst Console (queue, decision, Cytoscape lineage, actions); RiskScoreMeter with contributions | 10 | M3 API contract | C |
| M6 | LLM extraction | Bedrock via Mantle client, structured outputs, additive merge, extraction test set (40 emails) | 4 | M2 | B |
| M7 | Demo hardening | Scenario seeding (S1, S3), rehearsal ×3, backup video, tunnel fallback, judge Q&A drill | 5 | all | D + all |
| | **Total** | | **~57** | | |

Workstreams: **A** backend core · **B** graph & ingest · **C** frontend · **D** evidence, demo & pitch.

## 3. Critical path
`M0 → M1 (phone works over HTTPS) → M3 → M5 (ERP + Approver minimal) → M7`.
If the phone passkey flow does not work by the end of the first working block, stop and fix it
before anything else. Everything in the pitch depends on it.

## 4. Task breakdown (first block, so work can start immediately)

**A: Backend core**
- [ ] A1 New `backend/` skeleton per §6 of the architecture; settings via pydantic-settings; `.env.example` only
- [ ] A2 Postgres models + Alembic: tenants, persons, credentials, authority_matrix, vendors, vault, payments, confirmation_requests, evidence_records, jobs
- [ ] A3 HMAC service auth + session auth middleware; role guard
- [ ] A4 Canonical tx + JCS + challenge generation (unit-tested for determinism)
- [ ] A5 Enrollment + login + decision endpoints with `py_webauthn`
- [ ] A6 State machine `transition()` with row locks + evidence append

**B: Graph & ingest**
- [ ] B1 Neo4j constraints/indexes script; async driver wrapper (native datetimes)
- [ ] B2 `.eml` parser + Authentication-Results parser (RFC 8601) with test fixtures
- [ ] B3 Indian recognizers (A/c, IFSC, lakh/crore amounts, UPI, PAN; Aadhaar detect-and-drop) + Presidio integration + tokenizer
- [ ] B4 Domain intel with cached fixtures for the demo domains
- [ ] B5 Graph writer + Q1 provenance query + tests on a seeded graph

**C: Frontend**
- [ ] C1 Next.js app with route groups `(erp)`, `(approve)`, `(console)`; auth pages (enroll, login)
- [ ] C2 Approver PWA: pending list → detail (rendered from `canonical_tx`) → Approve/Deny via `@simplewebauthn/browser`. **No fallback credential, ever.**
- [ ] C3 ERP Simulator: payment form (INR, IFSC), release, live state + short code

**D: Evidence, demo, pitch**
- [ ] D1 HTTPS deploy target + domain + Cloudflare Tunnel fallback (unblocks M1 on the phone)
- [ ] D2 Demo fixtures: `.eml` for S1 (arup-group.co) and S3 (routine vendor), meeting JSON, vendor master
- [ ] D3 Pitch deck skeleton from `14-pitch-narrative.md`

## 5. Cut lines (decide once the deadline is known)

| Time available | Build | Show without building (clearly labelled) |
|---|---|---|
| **≤ 24 h** | M0, M1, M3, M2 (fixture-heavy: real `.eml` parsing, domain intel from fixtures), M5 minimal (ERP + Approver + a basic lineage view), M4 with `LOCAL_DEV` anchor | LLM extraction (deterministic keywords instead, labelled), KMS/Object Lock (architecture slide), incident-pack PDF (JSON + a mock PDF) |
| **24–48 h** | Everything above + M4 with KMS/S3 Object Lock + incident pack PDF + M6 | Mode B file gate, Web Push |
| **> 48 h** | All milestones + tamper-demo polish + velocity scenario S5 | — |

## 6. Definition of done (per task)
- Code merged with tests; the relevant FM-/S- tests in `12-test-and-validation.md` pass.
- No raw identifiers in logs (log-scrub test passes).
- Docs updated if behaviour differs from the doc (the doc changes in the same PR).
- Simulated parts labelled in the UI.

## 7. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Passkey on phone fails (RP ID / HTTPS / browser) | Demo collapses | D1 first; test on the actual demo phone early; backup: laptop platform authenticator in a second browser profile (still a real passkey) |
| Venue Wi-Fi | Demo collapses | Phone hotspot; Cloudflare Tunnel; pre-recorded video |
| Bedrock access or quota | Extraction missing | LLM is off the critical path; seed extraction results before the demo |
| Neo4j AuraDB limits / latency | Slow decisions | Local Neo4j in Docker for the demo machine if needed; Q1 timeout + fail-safe |
| Scope creep | Nothing finished | Cut lines in §5; Lead Engineer owns scope |
