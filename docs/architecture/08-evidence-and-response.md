# Evidence Chain & Incident Response

> **Audience:** backend engineers, analysts, auditors, judges · **Owner:** Evidence owner · **Status:** v1
> Decisions referenced: ADR-010 (chain + Object Lock), ADR-012 (1930 / cybercrime.gov.in), ADR-014 (honesty).
>
> Track 03 asks for "an actionable path for review, reporting, or response". This document is that path.

## 1. Evidence record

Every state transition, confirmation, analyst action, policy change, and enrollment writes one record.

```json
{
  "tenant_id": "t_arup_demo",
  "seq": 1042,
  "type": "CONFIRMATION_DECISION",
  "at": "2026-10-09T11:02:17.412Z",
  "subject": {"payment_id": "pay_01JA…", "request_id": "cr_01JA…"},
  "payload": { "...": "canonical_tx, decision, nonce, assertion{authenticatorData, clientDataJSON, signature, credentialId}" },
  "payload_hash": "sha256:…",
  "prev_hash": "sha256:<record_hash of seq 1041>",
  "record_hash": "sha256:<SHA-256(JCS(record without record_hash))>"
}
```

- **Chain:** `prev_hash` links each record to the previous one (per tenant). Changing any record
  changes its hash and breaks every later link.
- **Storage:** Postgres table `evidence_records`. The API's database role has `INSERT` and `SELECT`
  only (no `UPDATE`/`DELETE`). A unique constraint on `(tenant_id, seq)` plus a serialised append
  (advisory lock per tenant) keeps the chain linear.
- **Payload privacy:** payloads contain tokens, not raw identifiers. Raw values for the incident
  pack are read from the vault at render time by an authorised analyst.

## 2. Checkpoints (making the chain independently verifiable)

A **checkpoint** is `{tenant_id, seq, record_hash, at}`.
1. It is signed with an **AWS KMS asymmetric key** (ECDSA P-256, `Sign` API). The private key never
   leaves KMS.
2. The signed checkpoint is written to an S3 bucket with **Object Lock in compliance mode** (retention
   set per tenant). In compliance mode, nobody, including the root account, can delete or overwrite
   it before retention ends.
3. Checkpoints are made at least every 15 minutes, and immediately when an incident is opened or a
   payment is held.

**Local/dev mode:** checkpoints are signed with a local Ed25519 key and written to disk. The UI
and the evidence itself mark this as `anchor: LOCAL_DEV` (ADR-014).

## 3. Verification

`verifi evidence verify --tenant t_arup_demo [--payment pay_01JA…]`
1. Recompute each `record_hash` and check each `prev_hash`.
2. Fetch the checkpoints from S3, verify the KMS signatures with the public key, and check that
   each checkpoint's `record_hash` matches the recomputed chain at that `seq`.
3. For each `CONFIRMATION_DECISION`, re-verify the WebAuthn assertion with the stored public key and
   recompute the challenge from `canonical_tx ‖ decision ‖ nonce`.
4. Output: `VALID` or the first broken `seq` and why.

The same check is exposed as `GET /v1/evidence/verify?payment_id=…` for the Analyst Console's
"Verify" button. The demo shows tampering with one record and the verifier catching it.

## 4. Analyst workflow

1. **Queue:** `HELD_FOR_REVIEW` and `PENDING_CONFIRMATION`, sorted by tier, then amount, then age.
2. **Case view:** decision explanation (rules + contributions), Cytoscape lineage graph (Q4), the
   timeline of evidence records, confirmations and their outcomes.
3. **Actions:** `Release` (with reason; extra rule after a DENY, see protocol §2), `Reject`
   (opens or updates an incident), `Generate incident pack`, `Verify evidence`.
4. Every action is an evidence record that includes the analyst's identity.

## 5. Incident pack

Generated as **PDF (for humans) + JSON (for systems)** in one click, target under 2 minutes from DENY.
The PDF is designed to be read aloud on a **1930** call and copied into a **cybercrime.gov.in**
financial-fraud complaint, and to be attached to the bank recall request.

### 5.1 Contents
| Section | Content |
|---|---|
| Summary | One paragraph in plain language: what was attempted, amount, when, status (held / released / partially released) |
| Transaction | Amount, date/time (IST), remitter account (masked), beneficiary name, **full beneficiary account + IFSC** (from vault), UTR if any part was released |
| Attacker indicators | Sender addresses and domains, domain registration date, lookalike target, Reply-To, sending IPs from `Received` headers, meeting platform and the participant identifiers used |
| Lineage | The provenance chain as a figure + a numbered timeline |
| Decision record | Rules fired, score, confirmers asked, who denied and when |
| Evidence integrity | Record hashes, checkpoint signature, S3 object reference, verification result |
| Complaint fields | Pre-filled fields in the structure of the cybercrime.gov.in financial-fraud complaint (incident date/time, platform, suspect identifiers, transaction details). The analyst copies them; VeriFi does not submit. |
| Bank recall draft | Letter to the remitter bank requesting recall / lien on the beneficiary account, with transaction references (only relevant if any amount left the account) |
| Internal | Notification list (CFO, CISO, Legal), suggested next steps |

### 5.2 Why VeriFi does not file automatically
Filing is a legal act on behalf of the company. VeriFi prepares everything so a human can file in
minutes, records that it was filed (analyst marks it, with the complaint acknowledgement number),
and keeps the pack in the evidence chain.

## 6. Response playbook (shown in the console when an incident opens)
1. **If any amount was released:** call **1930** immediately and contact the remitter bank's fraud
   desk with the pack. Recovery chances are highest in the first hours.
2. File on **cybercrime.gov.in** using the pre-filled fields; record the acknowledgement number.
3. Block the attacker domain and sender addresses in the mail gateway (indicators are in the pack).
4. Notify the impersonated executive and everyone who received messages from the same domain
   (graph query: all `Email` nodes from that `Domain`).
5. Review other payments to accounts that appeared in the same messages (graph query, shown in the console).
