# VeriFi AI

> **Detectors tell you a call might be fake. VeriFi makes sure money can't move because of it.**

VeriFi is the authorization layer between business communication and money movement. Before a
payment is released, VeriFi traces where the beneficiary account came from. If the instruction
can't be trusted, it gets a passkey confirmation, bound to that exact amount and account, from
the person the instruction claims to come from: on their own phone, never from the employee
being deceived.

**Trace → Decide → Confirm → Respond**

| | |
|---|---|
| **Trace** | Emails and meetings become an Instruction Lineage Graph anchored on bank accounts |
| **Decide** | Explicit policy rules + a bounded, explainable risk score; normal payments pass with zero friction |
| **Confirm** | Transaction-bound FIDO2/WebAuthn confirmation from the real authority |
| **Respond** | Signed, chained evidence and a 1930 / cybercrime.gov.in incident pack |

Built for India (INR, IFSC, NEFT/RTGS/IMPS) on Amazon Bedrock, Neo4j, Postgres, S3 Object Lock,
AWS KMS, FastAPI, and Next.js.

## Status
The product is being rebuilt against the documentation. The code in `backend/` and `frontend/` is
the earlier prototype and is **reference only**; see [docs/delivery/11-build-plan.md](docs/delivery/11-build-plan.md).

## Documentation
Start at **[docs/README.md](docs/README.md)**. The key decisions are in
[docs/00-decision-log.md](docs/00-decision-log.md).
