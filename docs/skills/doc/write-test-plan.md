# Skill: Generate IEEE Test Plan

## Goal

Generate a complete **IEEE 829-style Test Plan** based on existing project documentation.

## Input Sources

Agent MUST read and synthesize from:

- `/docs/srs/SRS.md`
- `/docs/domain/domain-model.md`
- `/docs/database/database-design.md`
- `/docs/features/*.md`
- `/docs/business-rules/*.md`
- `/docs/diagrams/sequence/*.puml`
- `/docs/phases/*.md`
- `/docs/ARCHITECTURE.md`

## Requirements

### 1. Follow STRICT structure templete:

```markdown
# Test Plan: [Project Name]

## 1. Test Plan Identifier

- **ID:** [Unique-ID-Version]
- **Date:** [YYYY-MM-DD]
- **Author:** [Your Name/Team]

## 2. Introduction

Briefly summarize the software being tested and the purpose of this test plan.

- **Objective:**  
  [e.g., Verify core functionality of the User Authentication module.]

- **Scope:**  
  [What parts of the system are covered?]

## 3. Test Items

List the specific software items (files, modules, objects) to be tested.

- [Module Name] - [Version Number]
- [Service Name] - [Commit Hash]

## 4. Features to be Tested

Describe the specific functions or attributes to be verified from a user perspective.

- **[Feature A]:** User Login
- **[Feature B]:** Payment Processing

## 5. Features Not to be Tested

List features excluded from this test cycle and explain why.

- **[Feature Y]:** Browser compatibility (tested by UI team)

## 6. Approach

Outline the overall testing strategy.

- **Techniques:**  
  [e.g., Black-box, Regression, Integration]

- **Tools:**  
  [e.g., Selenium, JUnit, Postman]

## 7. Item Pass/Fail Criteria

Define the conditions for a test item to be considered successful.

- **Pass:**  
  100% of critical test cases pass.

- **Fail:**  
  Any "Critical" severity bug remains open.

## 8. Suspension Criteria and Resumption Requirements

Under what conditions will testing stop and resume?

- **Suspension:**  
  More than 20% of cases fail in a single day.

- **Resumption:**  
  Bug fixes for blockers are verified in the build.

## 9. Test Deliverables

List the documents to be delivered during/after testing.

- Test Plan (this document)
- Test Logs / Execution Reports
- Final Summary Report

## 10. Testing Tasks

List all necessary activities.

- **[Task 1]:** Environment Setup
- **[Task 2]:** Case Execution

## 11. Environmental Needs

Specify the hardware, software, and network requirements.

- **Server:**  
  [OS version, CPU, RAM]

- **Client:**  
  [Browser versions, Device types]

## 12. Responsibilities

Assign roles to team members.

- **QA Lead:** [Name] - Strategy & Approval
- **Testers:** [Names] - Execution & Bug Reporting

## 13. Staffing and Training Needs

Identify necessary human resources and skills.

- **[Skill Needed]:** Security Testing training for the team

## 14. Schedule

Key milestones and deadlines.

- **Test Design Finish:** [Date]
- **Execution Finish:** [Date]

## 15. Risks and Contingencies

Identify potential risks and how to handle them.

- **Risk:** Delay in dev delivery
- **Contingency:** Shift resources to automation

## 16. Approvals

Names and titles of individuals who must sign off on the plan.

- [Name], [Title] — [Date]
```

### 2. Mapping rules (QUAN TRỌNG)

- **Features to be Tested**
  → Extract from:
  - `features/`
  - `use-cases/`
  - `SRS.md`

- **Test Items**
  → Map to:
  - Modules (Auth, Appointment, Reminder, Tag, etc.)
  - DB entities (from database-design)
  - Services (from architecture)

- **Approach**
  MUST reflect actual system:
  - Backend: Integration test, Unit test
  - API: Contract test (Postman / e2e)
  - Async (Kafka/Redis): Event-driven testing

- **Environmental Needs**
  MUST include:
  - PostgreSQL
  - Redis
  - Kafka (if used)
  - NestJS runtime

- **Testing Tasks**
  MUST align with phases:
  → read `/docs/phases/*.md`

- **Risks**
  MUST reflect real system:
  - Event inconsistency
  - Redis cache stale
  - Cron/worker timing issues

---

### 3. Constraints

- Do NOT invent features outside docs
- Do NOT write generic textbook content
- Must be **system-specific**
- Keep concise, but meaningful
- Use bullet points where needed

---

### 4. Output format

- Markdown
- Clean headings
- No explanation outside Test Plan

---

### 5. Tone

- Professional
- Engineering-focused
- No fluff
