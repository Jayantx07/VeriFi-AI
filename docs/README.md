# VeriFi Documentation

This folder is the single source of truth for the product, the build, and the pitch. Code,
slides, and demo all follow these docs. When they disagree, fix the doc first, then the code.

## Start here
1. [Decision Log (ADRs)](00-decision-log.md): the 18 key decisions and why. **Read first.**
2. [Vision & Strategy](product/01-vision-and-strategy.md): problem, insight, positioning, business.

## Reading paths

| If you are… | Read |
|---|---|
| **Building the backend** | ADRs → [System Architecture](architecture/04-system-architecture.md) → [Graph Model](architecture/05-graph-data-model.md) → [Signals & Policy](architecture/06-signals-risk-and-policy.md) → [Confirmation Protocol](architecture/07-confirmation-protocol.md) → [Evidence](architecture/08-evidence-and-response.md) → [API](architecture/09-api-contract.md) |
| **Building the frontend** | [PRD](product/02-prd.md) → [Confirmation Protocol](architecture/07-confirmation-protocol.md) §4.3 → [API](architecture/09-api-contract.md) → [Demo Script](delivery/13-demo-script.md) |
| **Making the deck / presenting** | [Vision](product/01-vision-and-strategy.md) → [Pitch Narrative](delivery/14-pitch-narrative.md) → [Demo Script](delivery/13-demo-script.md) (incl. judge Q&A) |
| **Reviewing security** | [Threat Model](product/03-threat-model.md) → [Security, Privacy & Compliance](architecture/10-security-privacy-compliance.md) → [Confirmation Protocol](architecture/07-confirmation-protocol.md) |
| **Planning the work** | [Build Plan](delivery/11-build-plan.md) → [Test & Validation](delivery/12-test-and-validation.md) |

## Full index

| # | Document | Purpose |
|---|---|---|
| 00 | [Decision Log](00-decision-log.md) | Architecture & product decisions (ADR-001 … ADR-018) |
| 01 | [Vision & Strategy](product/01-vision-and-strategy.md) | Problem, insight, competitors, ICP, business model, metrics |
| 02 | [PRD](product/02-prd.md) | Personas, scope, user stories, FR/NFR, acceptance criteria |
| 03 | [Threat Model](product/03-threat-model.md) | Fraud we stop; attacks on VeriFi itself (STRIDE) |
| 04 | [System Architecture](architecture/04-system-architecture.md) | Components, flows, trust boundaries, deployment, failure modes |
| 05 | [Graph Data Model](architecture/05-graph-data-model.md) | Nodes, edges, constraints, core Cypher queries |
| 06 | [Signals, Risk & Policy](architecture/06-signals-risk-and-policy.md) | Signal catalog, bounded score, rules R1–R7, worked examples |
| 07 | [Confirmation Protocol](architecture/07-confirmation-protocol.md) | Routing, transaction-bound passkeys, state machine, enrollment |
| 08 | [Evidence & Response](architecture/08-evidence-and-response.md) | Hash chain, checkpoints, verification, incident pack, playbook |
| 09 | [API Contract](architecture/09-api-contract.md) | Endpoints, auth, schemas, errors |
| 10 | [Security, Privacy & Compliance](architecture/10-security-privacy-compliance.md) | Controls, data inventory, DPDP, RBI, reporting |
| 11 | [Build Plan](delivery/11-build-plan.md) | Milestones, owners, critical path, cut lines, risks |
| 12 | [Test & Validation](delivery/12-test-and-validation.md) | Red-team regressions FM-1…14, scenarios S1…S7, LLM eval |
| 13 | [Demo Script](delivery/13-demo-script.md) | Minute-by-minute demo, fallbacks, judge Q&A |
| 14 | [Pitch Narrative](delivery/14-pitch-narrative.md) | Slide-by-slide content for the PPT |
| — | [Glossary](glossary.md) | Shared vocabulary |
| — | [archive/v0-prototype](archive/v0-prototype/) | Superseded prototype docs. Reference only, do not build from them |

## How we maintain these docs
- **One owner per doc** (named in its header). The owner approves changes.
- **Decisions change only through a new ADR** that supersedes the old one.
- **Docs change in the same PR as the code** that changes the behaviour.
- **Numbers are tested:** the worked examples in doc 06 are asserted by scenario tests in doc 12.
- **Sources:** any external fact (incidents, regulation, market) is cited in doc 01 §9 or doc 10 §6.
- **Open items** are marked *Open* or *TBD* and listed below.

## Open items
| Item | Where | Needed from |
|---|---|---|
| Hours to submission and team size → choose the cut line | [Build Plan §5](delivery/11-build-plan.md) | Team |
| Cheaper extraction model vs default | ADR-017, [Test §5](delivery/12-test-and-validation.md) | Run the eval |
| Bedrock model availability in `ap-south-1` | ADR-017 | AWS console check |
| Demo domain name (RP ID) | ADR-018 | Team |
| Legal review of DPDP basis and retention | [Doc 10 §4](architecture/10-security-privacy-compliance.md) | Counsel (pre-pilot) |
| Market-size figures with sources | [Vision §9](product/01-vision-and-strategy.md) | Pitch lead |
