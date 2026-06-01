<!--
SYNC IMPACT REPORT
==================
Version change: (template/unfilled) → 1.0.0
Rationale: First concrete ratification of the IDARA constitution (placeholders
           replaced with real, project-specific principles). MINOR/MAJOR not
           applicable from an unversioned template; adopting 1.0.0 as the baseline.

Principles defined:
  I.   Layered Architecture & Separation of Concerns
  II.  Test Discipline (NON-NEGOTIABLE)
  III. Real-Time Consistency & Optimistic UX
  IV.  Security & Privacy by Default
  V.   Pragmatic Simplicity (YAGNI)

Added sections:
  - Technology & Quality Constraints (Section 2)
  - Development Workflow & Quality Gates (Section 3)
  - Governance

Templates reviewed for alignment:
  ✅ .specify/templates/plan-template.md  — Constitution Check gate aligns with principles
  ✅ .specify/templates/spec-template.md  — no constitution-driven mandatory sections to add
  ✅ .specify/templates/tasks-template.md — testing/architecture task types consistent
  ✅ README.md / docs/ARCHITECTURE.md     — principles reflect documented architecture

Deferred / TODO: none.
-->

# IDARA Constitution

IDARA is a real-time collaborative kanban task manager (FastAPI backend +
Next.js 14 frontend). This constitution defines the non-negotiable engineering
principles that govern how the project is built and changed.

## Core Principles

### I. Layered Architecture & Separation of Concerns

The backend MUST preserve the strict dependency direction:
`route → service → repository → model`. Routes handle HTTP concerns only
(validation, status codes, auth guards) and MUST NOT contain business logic or
raw queries. Services hold business logic; repositories own all database access
(no SQLAlchemy queries outside `repositories/`). The frontend MUST keep server
state in TanStack Query and client/UI-only state in Zustand or local React
state — the two MUST NOT be conflated.

**Rationale:** A predictable layering is what makes the codebase testable,
reviewable, and extensible. Leaks (SQL in a route, server data in Zustand) erode
that guarantee and are the most common source of regressions.

### II. Test Discipline (NON-NEGOTIABLE)

Backend changes to services or routes MUST ship with tests, and overall backend
coverage MUST stay at or above 70%. Tests MUST run against an isolated database
(in-memory SQLite, fresh schema per test) — never a shared or developer DB.
Every bug fix MUST add a regression test that fails before the fix. Critical
frontend logic (pure helpers, hooks, ordering logic) MUST have Vitest coverage.
A change MUST NOT be merged with failing tests or lint.

**Rationale:** This project is a portfolio-grade demonstration of correctness.
Tests are the contract that lets us refactor and extend without fear; the
isolated-DB rule keeps them deterministic.

### III. Real-Time Consistency & Optimistic UX

The REST API is the single source of truth. All authoritative state changes go
through REST; the WebSocket layer only broadcasts the resulting events. Clients
MUST apply their own changes optimistically and MUST ignore the echo of events
they originated (matched by actor id). When local optimistic state and the
server can diverge in non-trivial ways (e.g. cross-column task moves), the client
MUST reconcile from the authoritative server state rather than guessing.

**Rationale:** Real-time collaboration is the headline feature; a clear "REST is
truth, WebSocket is notification" model prevents the split-brain bugs that plague
naive real-time apps while keeping the UI instant.

### IV. Security & Privacy by Default

Authentication MUST use JWTs stored in httpOnly cookies — never localStorage.
Passwords MUST be hashed with bcrypt; secrets and config MUST come from
environment variables and MUST NOT be hardcoded. Every board-scoped endpoint
MUST enforce the role model (owner/editor/viewer); non-members MUST receive 404
(existence is not leaked) and under-privileged members MUST receive 403. Auth
endpoints MUST be rate-limited. Error responses MUST use the consistent shape
`{ error, code, details? }` and MUST NOT leak internals or stack traces.

**Rationale:** These are the controls that make the auth story credible. They are
cheap to keep and expensive to retrofit, so they are mandatory from the start.

### V. Pragmatic Simplicity (YAGNI)

Prefer the simplest solution that satisfies the requirement. New runtime
dependencies and new abstractions MUST be justified by a concrete present need,
not a hypothetical future one. Deferred scaling work (e.g. Redis Pub/Sub for
multi-instance WebSocket fan-out) MUST be left as an in-code TODO with context
rather than built speculatively. Any silently dropped scope (caps, sampling,
skipped retries) MUST be surfaced in code or docs, never hidden.

**Rationale:** Working, polished software beats feature-completeness. Simplicity
keeps the project legible to reviewers and to its author six months later.

## Technology & Quality Constraints

- **Backend:** Python 3.11+, FastAPI, async SQLAlchemy 2.0, Pydantic v2, Alembic
  for migrations. Type hints are required; code MUST pass `ruff` lint.
- **Frontend:** Next.js 14 (App Router), TypeScript in strict mode, Tailwind CSS,
  TanStack Query, dnd-kit. Code MUST pass `tsc --noEmit`, `eslint`, and build
  cleanly.
- **Database:** PostgreSQL is the production/Docker target; SQLite + aiosqlite is
  the supported local-dev and test database. Models MUST stay DB-agnostic so both
  work identically.
- **Schema changes:** Any model change MUST be accompanied by an Alembic
  migration. Local SQLite dev may auto-create tables, but production MUST migrate.
- **Configuration:** All secrets/config via environment; every new config key MUST
  appear in the relevant `.env.example`.

## Development Workflow & Quality Gates

- **Before merge**, a change MUST: pass backend `pytest` (≥70% coverage), backend
  `ruff`, frontend `tsc`/`eslint`/`build`, and frontend `vitest`.
- **Verification:** Behavioral changes SHOULD be verified by actually running the
  app (not only unit tests) when feasible — the project standard is to confirm
  flows end-to-end (e.g. signup → board → task → move).
- **Commits:** Use clear, conventional-style messages. Do not commit generated or
  heavy artifacts (`node_modules/`, `.venv/`, `.next/`, local `*.db`).
- **Docs:** User-facing or architectural changes MUST update `README.md` and/or
  `docs/ARCHITECTURE.md` in the same change.

## Governance

This constitution supersedes ad-hoc practice. When a change conflicts with a
principle, either the change is revised or the constitution is amended first —
silent deviation is not allowed.

Amendments MUST be made by editing this file with: a clear description of the
change, a version bump per the policy below, and propagation to any dependent
templates/docs noted in the Sync Impact Report.

**Versioning policy (semantic):**
- **MAJOR** — backward-incompatible governance change or removal/redefinition of a
  principle.
- **MINOR** — a new principle or section, or materially expanded guidance.
- **PATCH** — clarifications, wording, and non-semantic refinements.

**Compliance:** Code review MUST check changes against these principles. Added
complexity MUST be justified against Principle V. Runtime/agent guidance lives in
`CLAUDE.md`, `README.md`, and `docs/ARCHITECTURE.md`.

**Version**: 1.0.0 | **Ratified**: 2026-05-30 | **Last Amended**: 2026-05-30
