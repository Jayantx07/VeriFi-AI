# Signals, Risk Score & Policy

> **Audience:** backend engineers, pitch team (worked examples), judges · **Owner:** Lead Engineer · **Status:** Policy v1
> Decisions referenced: ADR-003 (rules decide, score explains), ADR-006 (tiers), ADR-007 (fail-safe), ADR-009 (LLM additive).

## 1. Two separate questions

VeriFi answers two different questions and keeps them separate:

1. **How trustworthy is the instruction behind this payment?** This is the **risk score** (0–100).
   It is built from signals about the sender, the account's provenance, the content, and the
   meeting.
2. **How much assurance does this payment need?** This is decided by **policy rules**. They
   combine the facts with the amount, the beneficiary history, and the tenant's thresholds.

`final_tier = max(tier from fired rules, tier from score)`. The score tier applies only to
payments at or above the **materiality floor** (default ₹1,00,000), so a suspicious ₹2,000
payment does not page the CFO. R5 (velocity) catches repeated small payments.

## 2. Signal catalog

Each signal has a strength `s ∈ [0,1]` and a weight `w ∈ (0,1)`. Signals that describe the
same underlying fact share a **group**. Within a group the contribution is `max(w·s)`, so one
fact is never counted twice.

| Group | Signal | `s` (strength) | `w` | Source |
|---|---|---|---|---|
| **G1 Sender identity** | Lookalike of a tenant or vendor domain | 1 if matched (dnstwist / homoglyph / edit distance ≤ 2) | 0.45 | Domain intel |
| | Young domain | 1 if < 7 days, 0.6 if < 30 days, else 0 | 0.35 | RDAP |
| | DMARC fail or not aligned | 1 / 0 | 0.40 | Authentication-Results |
| | Reply-To differs from From domain | 1 / 0 | 0.20 | Headers |
| **G2 Beneficiary provenance** | Account first seen in an external message ≤ 30 days ago | 1 (exact match), 0.7 (number-only match) | 0.50 | Graph Q1 |
| | Vendor's registered account changed ≤ 30 days ago | 1 / 0 | 0.40 | Vendor master |
| | Beneficiary never paid before | 1 / 0 | 0.25 | Payment history |
| | Account entered manually with no provenance | 1 / 0 | 0.20 | Graph Q1 |
| | Bank name-lookup mismatch (if available) | 1 / 0 | 0.30 | Bank API (optional) |
| **G3 Content / intent** | Pressure in linked messages | mean(urgency, secrecy, channel_evasion) if a financial action is requested, else 0 | 0.30 | LLM + deterministic keywords (max of both) |
| **G4 Meeting / channel identity** | External participant claiming an internal authority | 1 / 0 | 0.40 | Graph Q2 |
| | Media authenticity (deepfake) | the detector's synthetic probability | 0.30 | Detector, **SIMULATED in MVP** |
| | Meeting invited from an external message | 1 / 0 | 0.15 | Graph |

**Risk score**

```
R = 100 × ( 1 − Π_g ( 1 − max_{i ∈ g} ( w_i · s_i ) ) )
```

- R stays in [0, 100] by construction, so it can never "sum to 125".
- Independent weak signals compound (noisy-OR), which is the "weak signals together" claim in the pitch.
- Every group's contribution `max(w·s)` is shown in the RiskScoreMeter. That is the explanation.

**Why these weights?** They are expert priors ordered by how hard each signal is to fake:
provenance (0.50) and lookalike domain (0.45) are structural facts; content (0.30) and media
(0.30) are easy for an attacker to tune. In pilot shadow mode we collect labelled outcomes and
recalibrate weights per group (logistic regression), keeping the rules unchanged. We tell judges
that the weights are priors.

## 3. Policy rules (v1)

| Rule | Condition | Minimum tier | Effect on confirmers |
|---|---|---|---|
| **R1 NEW_BENEFICIARY_HIGH_VALUE** | Beneficiary never paid **and** amount ≥ ₹10,00,000 | T1 | Authority matrix |
| **R2 EXTERNAL_PROVENANCE** | Account first seen via an external message ≤ 30 d ago **and** amount ≥ floor | T1; **T2** if any linked sender domain is a lookalike or < 30 days old | Authority matrix |
| **R3 BANK_DETAIL_CHANGE** | Payment goes to a vendor account registered ≤ 30 d ago (a change) | T1 | + **vendor callback** using the vendor-master contact |
| **R4 AUTHORITY_IMPERSONATION_RISK** | A linked message or meeting carries an authority claim that resolves to an internal authority, made by an **external** identity | T2 | + the claimed person |
| **R5 VELOCITY_TO_YOUNG_ACCOUNTS** | In 7 days: ≥ 2 distinct accounts first seen ≤ 7 d ago (external/manual) paid by the same requester or linked to the same source domain | T2 | Authority matrix + analyst notified |
| **R6 CHANNEL_EVASION** | Linked messages ask to bypass normal process (secrecy, "use my personal number", "don't loop in…") **and** amount ≥ floor | T1 | Authority matrix |
| **R7 FAIL_SAFE** | Decision is `degraded` **and** amount ≥ ₹10,00,000 | T1 | Authority matrix |

**Score tiers** (amount ≥ floor): `R < 30 → T0`, `30 ≤ R < 70 → T1`, `R ≥ 70 → T2`.

## 4. Worked examples (arithmetic verified)

### S1 — Arup-style deepfake CFO, **detector fooled** (media score set to 0.12)
Facts: email from `arup-group.co` (lookalike of `arup.com`, registered 4 days ago; SPF/DKIM pass),
asks for secrecy and urgency, invites to Zoom, mentions account `ACCT_9f3a…`; in the meeting an
external participant shows as "Rajesh Mehta (CFO)"; payment ₹5,00,00,000 to `ACCT_9f3a…`, never paid before.

| Group | Contributions | max |
|---|---|---|
| G1 | lookalike 0.45×1 = 0.45; young 0.35×1 = 0.35 | **0.45** |
| G2 | provenance 0.50×1 = 0.50; never paid 0.25 | **0.50** |
| G3 | pressure 0.30×0.8 | **0.24** |
| G4 | external claims CFO 0.40×1 = 0.40; media 0.30×0.12 = 0.036 | **0.40** |

`Π(1−x) = 0.55 × 0.50 × 0.76 × 0.60 = 0.1254` → **R = 87.5**

Rules fired: R1 (T1), R2 → T2 (lookalike), R4 (T2), R6 (T1). **Final: T2.**
Confirmers: CFO (matrix + claimed) and Treasurer (second approver). Requester excluded.

> **The detector contributed 0.036, which is effectively nothing, and the payment still goes to T2.**
> Without *any* meeting data, R = 79.1 and R2 alone still requires T2. This is the core pitch line.

### S2 — Vendor bank-detail change from a compromised real vendor mailbox
Facts: email from the vendor's real domain (9 years old, DMARC pass) says the bank changed; AP
updates the vendor master; payment ₹18,00,000 to the new account.

| Group | max |
|---|---|
| G1 | 0 |
| G2 | provenance 0.50 (account first seen in an external message 2 days ago) |
| G3 | 0.30 × 0.6 = 0.18 |

`Π = 0.50 × 0.82 = 0.41` → **R = 59.0** → score tier T1. Rules: R1, R2 (T1), R3 (T1 + vendor callback).
**Final: T1.** The approver must confirm they called the vendor at the vendor-master number,
not the number in the email.

### S3 — Routine monthly vendor payment
Known account registered through vendor onboarding, paid 12 times before; internal email with
mild urgency (0.2). `R = 100 × (1 − (1 − 0.06)) = 6.0`. No rules fire. **Final: T0, no friction.**

### S4 — "CEO on WhatsApp" (no ingested communication)
New account typed in manually, ₹40,00,000. G2: max(0.25 never paid, 0.20 manual) = 0.25 → **R = 25.0**
(score tier T0). **R1 fires → T1.** Rules catch what the score cannot see; this is why rules decide.

## 5. Policy file (versioned)

```yaml
# backend/app/policy/policy_v1.yaml
version: "2026.10-v1"
currency: INR
materiality_floor_paise: 10000000        # ₹1,00,000
high_value_paise: 100000000              # ₹10,00,000
lookback_days: 30
velocity_window_days: 7
score_tiers: { t1: 30, t2: 70 }
confirmation:
  t1_expiry_minutes: 30
  t2_expiry_minutes: 60
  t2_cooling_off_minutes: 120
weights:
  G1: { lookalike: 0.45, young_domain: 0.35, dmarc_fail: 0.40, reply_to_mismatch: 0.20 }
  G2: { external_provenance: 0.50, bank_detail_change: 0.40, never_paid: 0.25, manual_entry: 0.20, name_mismatch: 0.30 }
  G3: { pressure: 0.30 }
  G4: { external_authority_claim: 0.40, media_authenticity: 0.30, external_invite: 0.15 }
rules: [R1, R2, R3, R4, R5, R6, R7]   # implemented in code, parameters above
```

Each decision stores `policy_version`. Changing the file means a new version and an evidence record.

## 6. Decision output contract
```json
{
  "tier": "T2",
  "state": "PENDING_CONFIRMATION",
  "score": 87.5,
  "degraded": false,
  "policy_version": "2026.10-v1",
  "rules_fired": [
    {"id": "R2", "tier": "T2", "reason": "Account first seen 2h ago in email from arup-group.co (lookalike of arup.com, registered 4 days ago)"},
    {"id": "R4", "tier": "T2", "reason": "External meeting participant presented as Rajesh Mehta (CFO)"}
  ],
  "contributions": [
    {"group": "G2", "signal": "external_provenance", "value": 0.50},
    {"group": "G1", "signal": "lookalike", "value": 0.45},
    {"group": "G4", "signal": "external_authority_claim", "value": 0.40},
    {"group": "G3", "signal": "pressure", "value": 0.24}
  ],
  "confirmers": [{"person_id": "p_cfo", "role": "CFO"}, {"person_id": "p_treas", "role": "Treasurer"}]
}
```
Reasons are written for humans: the same text appears in the Approver prompt and the incident pack.
