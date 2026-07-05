# ADR 0001: Database choice - PostgreSQL over MongoDB

- Status: Accepted
- Date: 2026-07-05

## Context

The AI Ticket system is an internal IT helpdesk tool. Its core data:

- Users with a role (user / moderator / admin) - RBAC.
- Tickets created by a user, optionally assigned to a moderator/admin.
- An asynchronous AI step (Gemini via an Inngest job) enriches each ticket with
  a summary, priority, helpful notes and related skills.
- Auto-assignment matches a ticket's related skills to a moderator's skills.
- Dashboards list tickets by owner / status / assignee.

The project started on MongoDB (Mongoose) as part of a MERN stack.

## Decision drivers (requirements, not preferences)

| Requirement | Reality of this app | Implication |
| --- | --- | --- |
| Scale / throughput | Low writes (humans file tickets), modest reads, thousands of rows | Any DB is adequate; horizontal scale is irrelevant |
| Relationships | user->tickets (1:N), user->assigned (1:N), skills (M:N); future comments & status history (1:N) | Moderately relational; joins matter |
| Consistency / integrity | No orphaned assignees; valid status/priority; role changes | Referential integrity + constrained enums valuable |
| Query / reporting | Filtered dashboards now; per-agent / per-status / SLA later | SQL aggregation is stronger |
| Schema stability | Still evolving (learning project) | Flexibility helps during development |

At this scale both MongoDB and PostgreSQL are technically adequate - the choice
is not performance-driven. The deciding factor is that the domain is relational
and integrity-sensitive.

## Options considered

1. **Stay on MongoDB, harden the schema** (enums via Mongoose, timestamps,
   select:false, app-level referential checks). Lowest effort. Integrity stays
   the application's responsibility; no DB-enforced foreign keys.
2. **Polyglot (Mongo + Postgres).** Rejected: over-engineering for a single
   small app - two stores, cross-store consistency problems, no shared
   transaction. Polyglot is for distinct bounded contexts at scale.
3. **Switch to PostgreSQL.** Correct domain fit: foreign keys enforce the
   user<->ticket relationships, enum types constrain status/priority/role,
   junction tables (future) model skills as a real many-to-many, and SQL is
   stronger for the reporting the roadmap implies.

## Decision

Switch to **PostgreSQL**, accessed via **Prisma** ORM.

Rationale:
- The domain is relational and integrity-sensitive; Postgres enforces at the DB
  level what MongoDB leaves to application code (FKs, enums, constraints).
- The repository layer added in the earlier refactor means the migration touches
  only `models/` + `repositories/` + the DB connection; services, controllers,
  routes and the Inngest job's business logic are insulated. This is the
  repository pattern working as intended.
- Prisma gives a typed client, a schema file that doubles as documentation, and
  first-class migrations.

Not chosen "for speed": at this scale engine speed is a non-factor. Big systems
get speed from caching, replicas and indexing, not the engine label. Postgres is
chosen for correctness, versatility and operational maturity.

## Scope / compromises for this migration

- **Skills stay as Postgres array columns** (`text[]`) on `users.skills` and
  `tickets.related_skills`, rather than full `skills` + junction tables. This
  keeps the existing array-based skill handling and the AI matching working with
  minimal change. Normalising skills into a controlled vocabulary + junction
  tables is a follow-up (see Consequences).
- **API compatibility:** the repository layer maps Postgres `id` (uuid) back to
  the `_id` field the services / DTOs / frontend already expect, so the HTTP
  contract is unchanged during the migration. Standardising on `id` (and
  updating the frontend) is a follow-up.
- **RBAC** stays application-level (an `authorize()` middleware + a permission
  map) with `role` as a DB enum. Dedicated `roles`/`permissions` tables and
  Postgres Row-Level Security are intentionally deferred (YAGNI for 3 fixed
  roles).

## Consequences

Positive:
- Foreign keys remove orphaned `assignedTo`/`createdBy`.
- Enum types make invalid `status`/`priority` impossible at the DB layer (fixes
  the AI "High" vs "high" downgrade bug at the source).
- `updatedAt` is now tracked; email uniqueness is case-insensitive.
- Schema file is self-documenting; migrations are versioned.

Negative / follow-ups:
- Requires a running Postgres (Docker locally; managed in prod) instead of Atlas.
- Skills-as-array is a pragmatic compromise; a future ADR should cover the
  junction-table model if skill matching needs to scale.
- `_id` compatibility shim in the repositories is a temporary adapter.

## Future trigger to revisit

If the AI grows to **semantic ticket search / RAG over past tickets**, that adds
a hard requirement for vector similarity search. PostgreSQL + `pgvector` keeps
relational data and embeddings in one store, which reinforces this decision.
