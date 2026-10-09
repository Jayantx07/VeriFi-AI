# Graph Data Model (Instruction Lineage Graph)

> **Audience:** backend engineers · **Owner:** Graph/ingest owner · **Status:** Schema v1
> Decisions referenced: ADR-002 (account anchor), ADR-008 (tokens), ADR-011 (native datetimes), ADR-016 (tenancy).

## 1. Design principles
1. **The account is the anchor.** Every query that matters starts at a `BankAccount` and walks back.
2. **Neo4j stores tokens, never raw identifiers.** Raw values live in the Postgres vault.
3. **Everything is tenant-scoped.** Every node has `tenant_id`; every uniqueness constraint
   includes it; every query filters by it.
4. **Native temporal types.** All times are Cypher `datetime`, written from timezone-aware UTC
   values. Never strings.
5. **Derived store.** The graph can be rebuilt from Postgres + raw events. Postgres stays the
   system of record.

## 2. Nodes

| Label | Key (with `tenant_id`) | Main properties |
|---|---|---|
| `Person` | `person_id` | `name`, `role` (CFO, Treasurer, AP_Maker…), `email_token`, `is_authority` |
| `Domain` | `name` | `owned_by_tenant` (bool), `registered_at`, `age_days_at_first_seen`, `rdap_source` |
| `ExternalIdentity` | `address_token` | `display_name`, `domain` |
| `Email` | `message_id` | `received_at`, `subject_hash`, `spf`, `dkim`, `dmarc`, `dmarc_aligned`, `reply_to_mismatch`, `urgency`, `secrecy`, `intent`, `llm_status` |
| `Meeting` | `meeting_id` | `platform`, `scheduled_at`, `invite_link_hash`, `media_authenticity` (0–1, `media_source`: `SIMULATED` \| model name) |
| `AuthorityClaim` | `claim_id` | `claimed_role`, `claimed_name`, `source` (display_name \| signature \| transcript \| llm), `resolved` |
| `BankAccount` | `acct_token` | `num_token`, `ifsc`, `last4`, `first_seen_at`, `first_seen_via` (VENDOR_ONBOARDING \| ERP \| EXTERNAL_MESSAGE \| INTERNAL_MESSAGE \| MANUAL), `name_lookup_result` (optional) |
| `Vendor` | `vendor_id` | `name`, `domains[]`, `contact_phone_token` |
| `Payment` | `payment_id` | `amount_paise`, `currency`, `created_at`, `tier`, `state`, `score`, `policy_version` |
| `Incident` | `incident_id` | `opened_at`, `status` |

**Two account tokens.** `acct_token` = HMAC(tenant_key, bank_code(IFSC) + account_digits) identifies
an account exactly. `num_token` = HMAC(tenant_key, account_digits) is used to match an email that
mentions only the account number without an IFSC. Matches through `num_token` alone are marked
`match_quality: "number_only"`.

## 3. Relationships

```
(:Domain)-[:HOSTS]->(:ExternalIdentity)
(:Domain)-[:LOOKALIKE_OF {technique, distance}]->(:Domain {owned_by_tenant:true})
(:ExternalIdentity)-[:SENT]->(:Email)
(:Email)-[:DELIVERED_TO]->(:Person)
(:Email)-[:INVITES_TO]->(:Meeting)
(:ExternalIdentity)-[:ATTENDED {display_name, external:true}]->(:Meeting)
(:Person)-[:ATTENDED]->(:Meeting)
(:Email|Meeting)-[:ASSERTS]->(:AuthorityClaim)-[:CLAIMS_TO_BE]->(:Person)
(:Email|Meeting)-[:MENTIONS {match_quality, at}]->(:BankAccount)
(:Vendor)-[:REGISTERED_ACCOUNT {since, verified_by}]->(:BankAccount)
(:Vendor)-[:USES_DOMAIN]->(:Domain)
(:Person)-[:INITIATED]->(:Payment)-[:PAYS_TO]->(:BankAccount)
(:Payment)-[:CONFIRMATION_REQUESTED_FROM]->(:Person)
(:Person)-[:DECIDED {decision, at}]->(:Payment)
(:Payment)-[:RAISED]->(:Incident)
```

The full Arup-style chain this enables:

```
(Domain arup-group.co, age 4d) -[:LOOKALIKE_OF]-> (Domain arup.com)
   -[:HOSTS]-> (ExternalIdentity "Rajesh Mehta")
   -[:SENT]-> (Email "Confidential acquisition")
   -[:INVITES_TO]-> (Meeting Zoom)
   -[:ASSERTS]-> (AuthorityClaim "CFO") -[:CLAIMS_TO_BE]-> (Person Rajesh Mehta, CFO)
(Email) -[:MENTIONS]-> (BankAccount ACCT_9f3a…, first seen via EXTERNAL_MESSAGE)
(Person Priya) -[:INITIATED]-> (Payment ₹5 Cr) -[:PAYS_TO]-> (BankAccount ACCT_9f3a…)
```

## 4. Constraints & indexes

```cypher
CREATE CONSTRAINT acct_key IF NOT EXISTS FOR (a:BankAccount) REQUIRE (a.tenant_id, a.acct_token) IS UNIQUE;
CREATE CONSTRAINT pay_key  IF NOT EXISTS FOR (p:Payment)     REQUIRE (p.tenant_id, p.payment_id) IS UNIQUE;
CREATE CONSTRAINT eml_key  IF NOT EXISTS FOR (e:Email)       REQUIRE (e.tenant_id, e.message_id) IS UNIQUE;
CREATE CONSTRAINT dom_key  IF NOT EXISTS FOR (d:Domain)      REQUIRE (d.tenant_id, d.name) IS UNIQUE;
CREATE CONSTRAINT per_key  IF NOT EXISTS FOR (p:Person)      REQUIRE (p.tenant_id, p.person_id) IS UNIQUE;
CREATE INDEX acct_num IF NOT EXISTS FOR (a:BankAccount) ON (a.tenant_id, a.num_token);
CREATE INDEX eml_time IF NOT EXISTS FOR (e:Email)       ON (e.tenant_id, e.received_at);
```

## 5. Core queries

### Q1 — Beneficiary provenance (the fast-path query)
Returns how the account entered the organisation and every external message that mentioned it
in the lookback window.

```cypher
MATCH (a:BankAccount {tenant_id: $tenant, acct_token: $acct})
OPTIONAL MATCH (v:Vendor {tenant_id: $tenant})-[r:REGISTERED_ACCOUNT]->(a)
OPTIONAL MATCH (x:ExternalIdentity)-[:SENT]->(m:Email)-[mm:MENTIONS]->(a)
  WHERE m.tenant_id = $tenant AND m.received_at >= datetime() - duration({days: $lookback_days})
OPTIONAL MATCH (d:Domain)-[:HOSTS]->(x)
OPTIONAL MATCH (d)-[la:LOOKALIKE_OF]->(owned:Domain)
OPTIONAL MATCH (m)-[:INVITES_TO]->(mt:Meeting)
OPTIONAL MATCH (m)-[:ASSERTS]->(c1:AuthorityClaim)
OPTIONAL MATCH (mt)-[:ASSERTS]->(c2:AuthorityClaim)
RETURN a.first_seen_at AS first_seen_at, a.first_seen_via AS first_seen_via,
       collect(DISTINCT {vendor: v.vendor_id, since: r.since, verified_by: r.verified_by}) AS registrations,
       collect(DISTINCT {msg: m.message_id, at: m.received_at, domain: d.name,
                         domain_age_days: d.age_days_at_first_seen, lookalike_of: owned.name,
                         spf: m.spf, dkim: m.dkim, dmarc: m.dmarc,
                         urgency: m.urgency, secrecy: m.secrecy, match: mm.match_quality}) AS mentions,
       collect(DISTINCT {meeting: mt.meeting_id, media: mt.media_authenticity}) AS meetings,
       collect(DISTINCT c1.claimed_role) + collect(DISTINCT c2.claimed_role) AS claimed_roles
```
- If `acct_token` is not found, the same query runs on `num_token` (match quality `number_only`).
- `collect` of a map yields a map of nulls when the OPTIONAL MATCH found nothing. The service
  drops entries whose key field (`msg`, `vendor`, `meeting`) is null.
- The chained OPTIONAL MATCHes multiply rows. That is fine at per-account scale; if profiling
  shows otherwise, split into `CALL {}` subqueries.

### Q2 — External participants claiming executive identity in linked meetings
```cypher
MATCH (mt:Meeting {tenant_id: $tenant, meeting_id: $meeting})<-[att:ATTENDED]-(x:ExternalIdentity)
MATCH (mt)-[:ASSERTS]->(c:AuthorityClaim)-[:CLAIMS_TO_BE]->(p:Person {is_authority: true})
WHERE att.external = true
RETURN x.display_name, x.domain, p.name, p.role
```

### Q3 — Velocity: recent payments to young accounts (R5)
```cypher
MATCH (p:Payment {tenant_id: $tenant})-[:PAYS_TO]->(a:BankAccount)
WHERE p.created_at >= datetime() - duration({days: 7})
  AND a.first_seen_at >= datetime() - duration({days: 7})
  AND a.first_seen_via IN ['EXTERNAL_MESSAGE', 'MANUAL']
RETURN count(DISTINCT a) AS young_accounts, count(p) AS payments, sum(p.amount_paise) AS total_paise
```

### Q4 — Lineage subgraph for the Analyst Console (bounded, tenant-scoped)
```cypher
MATCH (p:Payment {tenant_id: $tenant, payment_id: $pid})
CALL {
  WITH p
  MATCH path = (p)-[:PAYS_TO|INITIATED|CONFIRMATION_REQUESTED_FROM|DECIDED|RAISED]-()
  RETURN path
  UNION
  WITH p
  MATCH (p)-[:PAYS_TO]->(a:BankAccount)
  MATCH path = (a)<-[:MENTIONS]-(m)<-[:SENT]-(:ExternalIdentity)<-[:HOSTS]-(:Domain)
  WHERE m.tenant_id = $tenant
  RETURN path
  UNION
  WITH p
  MATCH (p)-[:PAYS_TO]->(:BankAccount)<-[:MENTIONS]-(m)
  MATCH path = (m)-[:INVITES_TO|ASSERTS|CLAIMS_TO_BE*1..2]->()
  RETURN path
  UNION
  WITH p
  MATCH (p)-[:PAYS_TO]->(:BankAccount)<-[:MENTIONS]-(:Email)<-[:SENT]-(:ExternalIdentity)<-[:HOSTS]-(d:Domain)
  MATCH path = (d)-[:LOOKALIKE_OF]->(:Domain)
  RETURN path
}
RETURN path LIMIT 200
```
The API converts paths to `{nodes, edges}` and **never** returns raw identifiers.

## 6. Write rules
- `BankAccount.first_seen_at` / `first_seen_via` are set with `ON CREATE` only. Later sightings
  never overwrite them.
- A vendor-master bank-detail change creates a new `REGISTERED_ACCOUNT` edge with `since = now`.
  The old edge is kept with `until`.
- Every write is idempotent (MERGE on keys), so worker retries are safe.
