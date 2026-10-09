# Vision & Strategy

> **Audience:** whole team, pitch, investors/acquirers · **Owner:** Product lead · **Status:** Living document

## 1. One line

> **Detectors tell you a call might be fake. VeriFi makes sure money can't move because of it.**

Longer form: VeriFi is the authorization layer between business communication and money
movement. Before a payment is released, VeriFi traces where the beneficiary account came from.
If the instruction cannot be trusted, VeriFi gets cryptographic confirmation from the person the
instruction claims to come from.

## 2. The problem

### 2.1 What happens in the real world
In January 2024, a finance employee in Arup's Hong Kong office received a message that appeared
to come from the UK-based CFO and asked for a secret transaction. The employee was suspicious.
Then a video call with the "CFO" and several "colleagues", all deepfakes, removed the doubt.
Over about a week the employee made **15 transfers totalling HK$200M (~US$25.6M) to 5 bank
accounts**. The fraud was discovered only when the employee checked with headquarters.

Three lessons drive the product:
1. **Human suspicion is not a control.** The employee was suspicious, and the deepfake overcame it.
2. **What stopped it was an out-of-band check with the real authority.** It happened a week too late.
3. **It was a campaign, not one payment.** Several new accounts over several days, which is a
   pattern a system can see and a single person cannot.

### 2.2 The correlation gap
- **Communication systems** (email, Zoom/Teams, WhatsApp) are where persuasion happens. They
  cannot stop a payment.
- **Money systems** (ERP, treasury, corporate net banking) are where money leaves. They do not
  know what conversation led to the payment.
- Nothing connects "this account number arrived yesterday in an email from a 4-day-old lookalike
  domain" to "this ₹5 Cr payment is going to that account right now".

### 2.3 Why existing tools do not close it

| Category | Examples | What they do | Why it is not enough |
|---|---|---|---|
| Deepfake / media detection | Reality Defender, Pindrop | Score whether audio/video is synthetic | A score cannot stop money; detectors lose as generators improve |
| Email security / BEC | Secure email gateways, AI email security | Flag suspicious email | No view of the payment; lookalike domains with valid SPF/DKIM get through; nothing covers the call |
| Payee / vendor verification | Eftsure, Trustpair | Check payment details against verified vendor data | Checks *where money goes*, not *who gave the instruction*; does not see communications |
| Bank-side name lookup (India) | RBI-mandated NEFT/RTGS name lookup (since Apr 2025) | Shows the account holder's name before sending | Confirms the account matches the name the payer typed, and the fraudster supplies that name |
| Maker-checker approvals | ERP / net-banking workflows | Second person approves | The checker sees the same convincing story and approves too |

**Our position:**
> Detectors score the call. Payee verification checks where the money goes.
> **VeriFi verifies who actually gave the instruction, and gets cryptographic confirmation from them.**

## 3. The insight (why this works)

Every payment-diversion fraud has to end in **an account the attacker controls**. The face, voice,
domain, and story can all be forged, but the account number has to appear in the payment, so it
cannot be hidden. VeriFi therefore anchors on the account (ADR-002):

1. **Trace:** where did this account first enter the organisation? Vendor onboarding with
   verification, or an email from a new lookalike domain two hours ago?
2. **Decide:** deterministic policy says whether that origin is acceptable for this amount.
3. **Confirm:** if not, the *real* authority confirms on their own device with a passkey bound to
   this exact amount and account. A fraudster can fake a CFO's face. They cannot produce the
   CFO's passkey signature.

This is **defence in depth that does not depend on detection**. If the deepfake is perfect, the
provenance still looks wrong. If the provenance looks clean (compromised real vendor mailbox),
the vendor callback and authority confirmation still apply.

## 4. Who it is for

### 4.1 Initial customer profile
Indian mid-size to large enterprises with:
- a central finance / treasury / accounts-payable function making high-value NEFT/RTGS payments;
- public-facing executives (voice and video samples available to attackers);
- many vendors (bank-detail change fraud surface);
- an existing ERP (SAP, Oracle, Tally Prime at the lower end) and host-to-host bank connectivity.

Later segments: banks offering it to their corporate clients (Mode C, ADR-013), and mid-market
companies through ERP marketplaces.

### 4.2 Buyer and users

| Role | Relationship | What they care about |
|---|---|---|
| CFO / Treasurer | **Economic buyer**, and also a confirmer | Losses, audit findings, board exposure, no slowdown in operations |
| CISO | Technical approver | Integration risk, data handling, identity |
| AP / Treasury maker | Daily user (requester) | No extra friction on normal payments |
| Approver / Authority | Confirmer on phone | Clear prompt, under a minute |
| Fraud / Risk analyst, Internal audit | Investigator | Evidence, timeline, reporting speed |

## 5. Business model (hypotheses to test in pilots)

- **Pricing:** annual platform fee per legal entity + a tier based on protected payment volume
  (number of payments evaluated per month). Not priced as a percentage of value; CFOs dislike it.
- **Pilot offer:** 60 days in shadow mode (evaluate and alert, do not hold), then switch on
  holding. Shadow mode produces the customer's own false-positive data, which removes the
  objection about friction.
- **Value proof:** "your payments to new beneficiaries this quarter, where each account came from,
  and what VeriFi would have held". This is a report the CFO can show the audit committee.

All pricing numbers are TBD and must not appear in the pitch as facts.

## 6. Moat and why an acquirer would care

1. **Integration position.** VeriFi sits on the payment-release path. Products that hold that
   position are hard to remove and become platforms.
2. **Cross-silo data asset.** The lineage graph links communications, identities, and accounts.
   Nobody else has this, because no one else sits across both silos.
3. **Consortium intelligence (roadmap, needs legal review).** An account confirmed as a mule
   account at one customer raises risk at every other customer, using a privacy-preserving
   shared token. This creates a network effect.
4. **Standards-based security.** FIDO2/WebAuthn, S3 Object Lock, KMS signing. Assembled from
   open standards, so it is credible in security due diligence.

**Plausible acquirer categories:** transaction banks / corporate banking platforms, treasury and
AP-automation vendors, payee-verification players expanding into instruction verification,
identity/passkey platforms, and email-security vendors that want a payment-side control.

## 7. What we will not do

- Sell deepfake-detection accuracy as the product.
- Auto-reject payments (ADR-006).
- Claim a bank integration that does not exist (ADR-013).
- Store Aadhaar, or send raw account numbers to an LLM (ADR-008).
- Ship simulated components without labels (ADR-014).

## 8. North-star and product metrics

| Metric | Definition | Target (pilot) |
|---|---|---|
| **Fraudulent value held** (north star) | ₹ of confirmed-fraud payments held before release | Any non-zero is a case study |
| Step-up rate | % of payments reaching T1/T2 | < 3% of payments |
| Confirmation latency | Time from T1 request to decision, median | < 60 s |
| Benign-hold rate | T1/T2 payments that were approved and were genuine | Tracked; used to tune policy |
| Time to incident pack | From DENY to complete 1930 pack | < 2 min |
| Provenance coverage | % of new-beneficiary payments with a known account origin | > 90% |

## 9. Sources
- Arup case: [SCMP, Arup confirmed victim of HK$200M deepfake scam](https://www.scmp.com/news/hong-kong/law-and-crime/article/3263151/uk-multinational-arup-confirmed-victim-hk200-million-deepfake-scam-used-digital-version-cfo-dupe); [Construction Briefing](https://www.constructionbriefing.com/news/arup-employee-falls-victim-to-us-25-million-deepfake-video-call-scam/8037338.article)
- RBI beneficiary name lookup: [Business Standard](https://www.business-standard.com/industry/banking/banks-to-provide-beneficiary-account-name-facility-in-neft-rtgs-by-apr-1-124123000770_1.html); [RBI circular copy (PDF)](https://www.pdicai.org/Docs/RBI-2024-25-99_31122024152349564.pdf)
- DPDP Rules 2025: [Hogan Lovells](https://www.hoganlovells.com/en/publications/indias-digital-personal-data-protection-act-2023-brought-into-force-); [AZB & Partners](https://www.azbpartners.com/?p=87799)

Market-size figures are **not yet sourced**. Do not put a TAM number on a slide until it has a
citation in this section.
