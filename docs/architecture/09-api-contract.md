# API Contract (v1)

> **Audience:** backend + frontend engineers, integration partners · **Owner:** Lead Engineer · **Status:** Draft v1. The generated OpenAPI spec (`/openapi.json`) is authoritative once the code exists, and this page must be updated with it.

## 1. Conventions
- Base path `/v1`. JSON. UTC timestamps in RFC 3339.
- **Money:** `amount_paise` (integer) + `currency` (ISO 4217). Never floats.
- **IDs:** prefixed ULIDs (`pay_`, `cr_`, `inc_`, `eml_`, `mtg_`).
- **Errors:** RFC 9457 problem details: `{type, title, status, detail, instance, code}`.
- **Idempotency:** `Idempotency-Key` header on all `POST`s that create things; payments are also
  idempotent on `(tenant, external_payment_id)`.
- **Tenancy:** derived from credentials, never from the request body.

## 2. Authentication

| Caller | Mechanism |
|---|---|
| ERP / integration | `Authorization: VeriFi-HMAC key_id=…, ts=…, sig=…` where `sig = HMAC-SHA256(secret, method ‖ path ‖ ts ‖ SHA256(body))`; 5-minute clock window. Pilot adds mTLS. |
| Humans (Approver, Analyst, Admin) | Passkey login → HTTP-only, `Secure`, `SameSite=Strict` session cookie; CSRF token on state-changing calls; roles: `requester`, `authority`, `analyst`, `admin` |
| Webhooks to ERP | VeriFi signs with the same HMAC scheme; ERP verifies |

## 3. Endpoints

### Ingestion (service or analyst)
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/v1/ingest/email` | `multipart: eml file` | `202 {event_id, status:"queued"}` |
| POST | `/v1/ingest/meeting` | `{platform, title, scheduled_at, invite_link, participants[{display_name, email, external}], transcript?, media_authenticity?{score, source:"SIMULATED"\|model}}` | `202 {event_id}` |
| GET | `/v1/ingest/{event_id}` | — | `{status: queued\|processed\|failed, extracted:{…tokens only}}` |
| PUT | `/v1/vendors/{vendor_id}` | `{name, domains[], bank_accounts[{account_number, ifsc}], contact_phone}` | `200` (raw values go to the vault; a bank change creates an evidence record) |

### Payments (ERP hook, Mode A)
`POST /v1/payments/evaluate`
```json
{
  "external_payment_id": "SAP-4500012345-001",
  "legal_entity": "ARUP-IN",
  "type": "VENDOR",
  "amount_paise": 5000000000,
  "currency": "INR",
  "beneficiary": {"name": "Meridian Advisory LLP", "account_number": "50100234567812", "ifsc": "HDFC0001234"},
  "requester_email": "priya.sharma@arup.com",
  "callback_url": "https://erp.example/verifi/callback"
}
```
Response `200`:
```json
{
  "payment_id": "pay_01JA…",
  "state": "PENDING_CONFIRMATION",
  "tier": "T2",
  "score": 87.5,
  "degraded": false,
  "short_code": "7F3A-91C2",
  "rules_fired": [{"id": "R2", "tier": "T2", "reason": "…"}],
  "contributions": [{"group": "G2", "signal": "external_provenance", "value": 0.5}],
  "confirmers": [{"name": "Rajesh Mehta", "role": "CFO"}, {"name": "Anil Rao", "role": "Treasurer"}],
  "expires_at": "2026-10-09T12:00:00Z"
}
```
| Method | Path | Notes |
|---|---|---|
| GET | `/v1/payments/{payment_id}` | Current state + decision |
| Webhook | `payment.released`, `payment.held`, `payment.rejected` | Signed POST to `callback_url`; retried with backoff |

### Confirmations (Approver PWA; role `authority`)
| Method | Path | Notes |
|---|---|---|
| GET | `/v1/confirmations/pending` | Requests where the caller is a confirmer: `canonical_tx`, rendered reasons, `short_code`, two WebAuthn option sets `{APPROVE, DENY}` |
| POST | `/v1/confirmations/{request_id}/decision` | `{decision: "APPROVE"\|"DENY", assertion, callback_confirmed?: true}` → new payment state. **No payment ID in the body.** |

### Passkeys / auth
| Method | Path | Notes |
|---|---|---|
| POST | `/v1/auth/login/options` · `/v1/auth/login/verify` | Passkey login (discoverable credentials) |
| POST | `/v1/enroll/{token}/options` · `/v1/enroll/{token}/verify` | One-time enrollment link flow |
| POST | `/v1/admin/enrollments` | Admin issues an enrollment link (role `admin`) |

### Console (role `analyst`)
| Method | Path | Notes |
|---|---|---|
| GET | `/v1/console/queue` | Pending + held, sorted |
| GET | `/v1/console/payments/{payment_id}` | Decision, timeline, confirmations |
| GET | `/v1/console/payments/{payment_id}/lineage` | `{nodes, edges}` from Q4: tenant-scoped, tokens only; 404 if not found (no placeholder data) |
| POST | `/v1/console/payments/{payment_id}/release` | `{reason}`; enforces the post-DENY rule |
| POST | `/v1/console/payments/{payment_id}/reject` | `{reason}` → incident |
| POST | `/v1/console/incidents/{incident_id}/pack` | → `{pdf_url, json_url}` (short-lived signed URLs) |
| POST | `/v1/console/incidents/{incident_id}/filed` | `{channel: "1930"\|"cybercrime.gov.in"\|"bank", reference}` |

### Evidence & admin
| Method | Path | Notes |
|---|---|---|
| GET | `/v1/evidence/verify?payment_id=` | Chain + checkpoint + assertion verification result |
| GET/PUT | `/v1/admin/authority-matrix` | Versioned; changes are evidence records |
| GET/PUT | `/v1/admin/policy` | Upload a new policy version (validated) |
| GET | `/health` · `/ready` | `ready` reports Postgres, Neo4j, KMS, and S3 reachability |

## 4. Error codes (selection)
| `code` | HTTP | Meaning |
|---|---|---|
| `REQUEST_EXPIRED` | 409 | Confirmation request expired |
| `ALREADY_DECIDED` | 409 | This confirmer already decided |
| `NOT_A_CONFIRMER` | 403 | Credential owner is not in the confirmer set |
| `ASSERTION_INVALID` | 401 | WebAuthn verification failed (detail logged, not returned) |
| `RELEASE_BLOCKED_BY_DENY` | 409 | Analyst release needs authority re-approval |
| `TENANT_MISMATCH` | 404 | Resource is not visible to this tenant (deliberately 404, not 403) |
