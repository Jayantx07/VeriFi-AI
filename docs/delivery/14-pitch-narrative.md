# Pitch Narrative (source for the PPT)

> **Audience:** whoever builds and presents the deck · **Owner:** Pitch lead · **Status:** v1
> Each slide has a headline (the one thing it says), content, a visual, and speaker notes. Every
> number on a slide must have a source in `product/01-vision-and-strategy.md` §9. **No unsourced
> market-size numbers.**

**Arc:** a real loss → why today's tools miss it → our insight → live proof → how it works →
why it's credible → why it's a business.

---

### 1. Title
- **Headline:** *VeriFi AI: money can't move on a forged instruction.*
- **Sub:** The authorization layer between business communication and payments. Track 03.
- **Visual:** logo; a phone showing "Deny: I did not ask for this".

### 2. The loss
- **Headline:** *A deepfake CFO took US$25.6M in one week.*
- **Content:** Arup, Jan 2024. Video call with a deepfaked CFO and colleagues → **15 transfers to
  5 accounts** over a week. The employee was suspicious at first. It was caught only when they
  checked with headquarters.
- **Visual:** timeline: message → video call → 15 transfers → call to HQ (too late).
- **Notes:** "The employee *was* suspicious. The deepfake beat human suspicion. What finally worked
  was asking the real authority, a week too late."

### 3. The real problem: the correlation gap
- **Headline:** *The place where persuasion happens can't stop money. The place money leaves can't see the persuasion.*
- **Visual:** two silos: Email/Zoom/WhatsApp | ERP/Treasury/Bank, with a gap between them.

### 4. Why existing tools miss it
- **Headline:** *Detectors score the call. Payee checks verify the account. Nobody verifies the instruction.*
- **Content:** a 4-row table from vision §2.3 (detectors, email security, payee verification, bank name lookup) with "what it misses".
- **Notes:** the bank name lookup line: "It confirms the account matches the name you typed, and the fraudster gave you that name."

### 5. Our insight
- **Headline:** *Every fraud ends in an account. Trace where the account came from.*
- **Content:** faces, voices, and domains can be forged; the account number must appear in the
  payment, so it can't hide. VeriFi asks: *where did this account first enter the company, and through whom?*
- **Visual:** chain: lookalike domain → email → meeting → "CFO" → **account** → payment.

### 6. How it works
- **Headline:** *Trace → Decide → Confirm.*
- **Content:**
  1. **Trace:** emails and meetings are turned into a lineage graph anchored on bank accounts.
  2. **Decide:** explicit policy plus an explainable risk score; normal payments pass with zero friction.
  3. **Confirm:** the *real* authority, not the deceived employee, approves or denies on their own
     phone with a passkey bound to this exact amount and account.
- **Visual:** three icons; tiers T0 / T1 / T2 underneath.

### 7. Live demo
- See `13-demo-script.md`. **This slide is just "Live demo" plus a QR code to the backup video.**
- Key moment: the detector says *authentic (0.12)*, and the CFO's Deny still holds ₹5 Cr.

### 8. Why it holds up: the confirmation
- **Headline:** *A fraudster can fake the CFO's face. They can't produce the CFO's passkey signature.*
- **Content:** goes to the authority (never the requester) · signature covers amount + account + decision
  · what you see is what you sign · non-repudiable record.
- **Visual:** the phone prompt mock with the "Why you're being asked" box.

### 9. The worked example (credibility slide)
- **Headline:** *87.5 with a fooled detector, and the detector contributed 0.036.*
- **Content:** the S1 contribution table from `06-signals-risk-and-policy.md` §4 + "rules R2 and R4 → T2".
- **Notes:** "Weak signals compound, the score is bounded, and every factor is listed. The decision comes
  from explicit rules, so it's auditable."

### 10. Response: Track 03's actionable path
- **Headline:** *From "Deny" to a 1930-ready incident pack in under two minutes.*
- **Content:** signed, chained evidence (KMS + S3 Object Lock) · pre-filled cybercrime.gov.in fields ·
  bank recall draft · response playbook.
- **Visual:** the PDF cover + a "VALID" verification badge.

### 11. Architecture
- **Headline:** *Assembled from open standards and AWS, not invented crypto.*
- **Visual:** simplified `04-system-architecture.md` diagram: Bedrock (Claude), Neo4j, Postgres,
  S3 Object Lock, KMS, FIDO2/WebAuthn, FastAPI, Next.js.
- **Notes:** fast path ≤ 300 ms with no LLM on it; fail-safe on outages; tokenized identifiers.

### 12. Business
- **Headline:** *Sold to the CFO, installed at the payment-release step.*
- **Content:** ICP: Indian mid-to-large enterprises with central treasury/AP · buyer: CFO, approver: CISO ·
  pilot: 60-day shadow mode → their own data · pricing per entity + payment-volume tier (hypothesis) ·
  integration: API hook → bank-file gate → bank partnership.
- **Notes:** do not show a TAM number unless it has a source.

### 13. Moat & roadmap
- **Headline:** *The only system sitting across both silos, and the data gets better with every customer.*
- **Content:** payment-path position · cross-silo lineage data · consortium mule-account intelligence
  (roadmap) · Secure Payment Confirmation, Web Push, Teams/Zoom/Graph connectors.

### 14. Close
- **Headline:** *Detectors tell you a call might be fake. VeriFi makes sure money can't move because of it.*
- **Content:** team, contact, repo link.

---

## Style rules for the deck
- One idea per slide; the headline *is* the idea (a sentence, not a label).
- Indian number formatting for INR (₹5,00,00,000 / ₹5 Cr); US$ only for the Arup figure.
- Label simulated elements in screenshots exactly as in the product (ADR-014).
- Never claim: "nobody links communications to payments", "detects all deepfakes", "banks call our API".
