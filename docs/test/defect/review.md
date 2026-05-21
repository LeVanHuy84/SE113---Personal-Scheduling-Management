# Review Defect and Bug List

## Scope

| Group | Review Type | Target | Notes |
|---|---|---|---|
| Document | Document review | docs/srs/SRS.md | Functional and non-functional requirement consistency |
| Document | Document review | docs/business-rules/business-rules.md | Business constraint validation and conflict check |
| Testing | Static testing / test review | docs/test | Test plan, test case, defect traceability, coverage notes |
| Code | Code review / clean code | src | Clean code, architecture, naming, maintainability, potential bug risks |

## Defect and Bug Log

| ID | Group | Source | Detection Activity | Defect/Bug Description | Type | Severity | Priority | Status | Owner | Detected Date | Evidence/Reference | Suggested Fix |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DOC-001 | Document | docs/srs/SRS.md; docs/business-rules/business-rules.md; docs/api-contract/appointment.api.md | Document review | Appointment status definition is inconsistent across SRS, BR, and API contract. SRS requires completed/cancelled and reopen; BR only states completed/pending; API defines SCHEDULED/COMPLETED/CANCELLED/MISSED. | Defect | High | High | Open | BA/QA | 2026-05-18 | SRS FR-09: docs/srs/SRS.md#L114; BR-14: docs/business-rules/business-rules.md#L31; API enum: docs/api-contract/appointment.api.md#L47 | Normalize one status model in SRS + BR + API and define allowed transitions in one source of truth. |
| DOC-002 | Document | docs/srs/SRS.md | Document review | Acceptance criteria for reopening completed appointments is ambiguous ("when permitted" is undefined). | Defect | High | High | Open | BA | 2026-05-18 | docs/srs/SRS.md#L114 | Add explicit reopening constraints (who can reopen, time window, forbidden states, audit requirements). |
| DOC-003 | Document | docs/srs/SRS.md; docs/use-cases | Document review | SRS references use cases (UC-1..UC-35) but use-case repository is empty, causing broken traceability. | Defect | Medium | High | Open | BA | 2026-05-18 | SRS references: docs/srs/SRS.md#L29 and FR mappings in docs/srs/SRS.md; folder check: docs/use-cases (empty) | Create use-case documents and map each FR to concrete UC artifacts. |
| DOC-004 | Document | docs/srs/SRS.md; docs/business-rules/business-rules.md | Document review | Security wording inconsistency: SRS FR-01 says password is securely hashed, while BR-32 states passwords are encrypted before storage. | Defect | Medium | Medium | Open | Security/BA | 2026-05-18 | SRS FR-01: docs/srs/SRS.md#L95; BR-32: docs/business-rules/business-rules.md#L67 | Standardize requirement to password hashing (with salt/work factor) and align BR language. |
| TST-001 | Testing | docs/test/test-plan.md | Static testing / test review | Internal inconsistency in F3 scope: section 3 lists only GET /appointments and PATCH /appointments/:id/status, but section 4 still requires createAppointment/updateAppointment decision-table coverage. | Defect | High | High | Open | QA Lead | 2026-05-18 | Endpoints list: docs/test/test-plan.md#L29; decision-table targets: docs/test/test-plan.md#L54 and docs/test/test-plan.md#L55 | Align F3 test scope with actual endpoint surface or mark create/update as service-level tests with clear entry points. |
| TST-003 | Testing | docs/test/test-plan.md | Static testing / test review | Inconsistent function count in one document: "five core backend functions" vs "6 retained functions" in responsibilities. | Defect | Medium | Medium | Open | QA Lead | 2026-05-18 | five-core statements: docs/test/test-plan.md#L16 and docs/test/test-plan.md#L40; conflicting count: docs/test/test-plan.md#L162 | Correct retained-function count and update all related sections to one consistent scope statement. |
| CR-001 | Code | docs/test/defect/system-test-defect-log.md | Code review / clean code | Authorization boundary risk documented: queue-triggered and repository mutation paths may trust upstream userId, potentially bypassing consistent ownership enforcement. | Bug Risk | High | High | Open | Backend Lead | 2026-05-18 | docs/test/defect/system-test-defect-log.md#L6 (ST-05) | Define mandatory authorization checkpoint rules for async and repository write paths; add security tests for worker and service boundaries. |

## Type Legend

- Defect: Requirement, logic, flow, or specification mismatch.
- Bug: Observed incorrect behavior in implementation.
- Bug Risk: Potential issue detected during static analysis/code review.

## Status Legend

- Open
- In Progress
- Fixed
- Verified
- Rejected
- Deferred

## Change Log (2026-05-18)

- BR-14 and BR-32 updated in `docs/business-rules/business-rules.md` to align status model and password hashing requirement.
- FR-09 clarified in `docs/srs/SRS.md` with explicit reopening rules (owner-only, 7-day window, audit log requirement).
- `docs/test/test-plan.md` F3 endpoints aligned to include `POST /appointments` and `PUT /appointments/:id`; guidance added for service-level testing if endpoints are absent.
- Review entries updated to reflect fixes; remaining item DOC-001 (status transition finalization) marked In Progress and requires a final state-transition table in SRS.
