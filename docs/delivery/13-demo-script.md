# Demo Script

> **Audience:** presenters and the demo operator · **Owner:** Demo owner (workstream D) · **Status:** v1, rehearse 3× before the event
> The demo proves one thing: **the deepfake detector fails, and the money still doesn't move.**

## 1. Setup

| Device | Role | Shows |
|---|---|---|
| Laptop (projected) | Operator | Tab 1: Sensor intake · Tab 2: ERP Simulator (Priya, AP) · Tab 3: Analyst Console |
| Phone A (screen-mirrored) | **CFO Rajesh Mehta** | Approver PWA, passkey enrolled in advance |
| Phone B (optional) | Treasurer | Approver PWA (not needed: one DENY holds) |

**Pre-demo checklist (T-30 min)**
- [ ] Demo domain resolves over HTTPS; `/ready` is green (Postgres, Neo4j, KMS, S3)
- [ ] Phone A logged in to the Approver PWA; Face ID tested on a dummy request
- [ ] Seed loaded: tenant "Arup Demo", people, authority matrix, vendor master (incl. "Meridian" **not** a vendor)
- [ ] S1 `.eml` and meeting JSON ingested **in advance** (shows real processing results; avoids waiting on the LLM live)
- [ ] Phone hotspot ready; Cloudflare Tunnel command ready; backup video on the desktop
- [ ] Screen mirroring tested; notifications from other apps silenced

## 2. The 3-minute run

| Time | Screen | Say | Do |
|---|---|---|---|
| 0:00 | Title | "In 2024, Arup lost 25 million dollars. An employee joined a video call with their CFO and colleagues, all deepfakes, and made 15 transfers to 5 accounts in a week. It was caught only when they called headquarters." | — |
| 0:20 | Sensor intake: the email | "Here's the email. SPF, DKIM, DMARC all pass, because the attacker owns the domain. Email security says it's fine." | Open S1 email card |
| 0:35 | Same card, VeriFi panel | "VeriFi sees what matters: `arup-group.co` imitates `arup.com` and was registered 4 days ago. And this email contains a bank account." | Point to *Lookalike* + *Registered 4 days ago* + *Account ••••7812* |
| 0:50 | Meeting card | "Then the Zoom call. Let's assume the deepfake is perfect. Our detector says **authentic**: 0.12." | Show slider at 0.12, labelled SIMULATED |
| 1:05 | ERP Simulator | "Priya does exactly what she was told: ₹5 crore to Meridian Advisory." | Fill and **Release** |
| 1:15 | ERP result | "VeriFi holds it for confirmation. Notice *who* it asks: not Priya, the person being deceived. It asks the CFO, the person the instruction claims to come from." | Show T2, confirmers, short code 7F3A-91C2 |
| 1:30 | Phone A (mirrored) | "The real CFO's phone. Amount, account, and *why*: this account appeared two hours ago in an email from a 4-day-old lookalike domain." | Show prompt; point at the matching short code |
| 1:45 | Phone A | "He never asked for this." | Tap **Deny**, Face ID |
| 1:55 | ERP | "Held. The fraudster has the CFO's face and voice. They don't have the CFO's phone." | State flips to HELD_FOR_REVIEW |
| 2:05 | Console: lineage | "Here's the whole story in one graph: lookalike domain, email, meeting, fake CFO, account, payment. Score 87.5, and the deepfake detector contributed almost nothing." | Show Cytoscape chain + RiskScoreMeter contributions |
| 2:25 | Console: incident pack | "One click: a 1930 / cybercrime.gov.in pack with the attacker's domain, the mule account, and timestamps, plus a bank recall draft." | Generate pack, open PDF |
| 2:40 | Console: verify | "Every step is signed and chained. Change one byte and verification breaks." | Click **Verify** → VALID (optional: tamper → BROKEN at seq N) |
| 2:50 | ERP: routine payment | "And a normal vendor payment? Straight through. No friction." | Release S3 → T0 instantly |
| 3:00 | Close | "**The detector failed. The money didn't move.**" | — |

**90-second cut:** 0:00 → 0:35 → 1:05 → 1:15 → 1:30 → 1:45 → 1:55 → 2:05 → close.

## 3. Fallbacks

| Failure | Fallback |
|---|---|
| Phone passkey fails | Approver PWA on the laptop in a second browser profile (laptop's own platform authenticator, still a real passkey). Say so. |
| Network | Phone hotspot → Cloudflare Tunnel to the same domain |
| Anything else | Backup video of the full run (recorded at the final rehearsal); keep talking over it |
| LLM slow | Nothing to do: ingestion was done in advance and the payment decision never calls the LLM |

## 4. Judge Q&A

| Question | Answer |
|---|---|
| What if the CFO is unreachable? | The request expires to a hold, and the matrix escalates to the next authority or a registered delegate. Money waits; it doesn't leave. |
| What if the CFO really did ask for it? | They tap Approve: about 5 seconds, signed and on record. Normal payments see no prompt at all. |
| What if the attacker controls the CFO's email? | Email doesn't give them the passkey, which lives on the CFO's phone behind biometrics. Scenario S6. |
| Can't the attacker register their own passkey as the CFO? | Enrollment needs a one-time admin link, the user's identity login, and notifies the user; replacing an authority's passkey needs two admins. |
| Aren't banks already doing name lookup? | Yes, since April 2025 for NEFT/RTGS, and we welcome it. It checks the account matches the name you typed, but the fraudster gave you that name. We check who gave the instruction. |
| How is this different from Eftsure / payee verification? | They verify where money goes. We verify who instructed it and get cryptographic confirmation from that person. |
| False positives? | Rules only trigger on new or changed accounts with risky provenance. Pilots start in shadow mode to measure on the customer's own data before holding anything. |
| Why a graph database? | The core question is a path: domain → message → meeting → claim → account → payment. One query instead of a dozen joins, and it shows the analyst the story. |
| Your weights look arbitrary. | They're documented priors ordered by how hard each signal is to fake, and the decision is made by explicit rules, not by the score. Shadow-mode pilots calibrate the weights. |
| Privacy: you read our emails? | Only finance-relevant mailboxes; account numbers are tokenized before the LLM or the graph see them; raw values stay in an encrypted vault. Built for the DPDP Act. |
| How do you integrate with SAP / Tally? | A pre-release API hook first; then a gate on the bank-upload file, which needs no ERP change. |
| Is the deepfake detector real? | In the demo it's a labelled simulated input, deliberately: our point is that we don't depend on it. Any detector plugs in as one signal. |
