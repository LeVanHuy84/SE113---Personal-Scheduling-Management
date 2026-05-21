# Bug List

| Defect ID | Module | Description | Type | Severity | Priority | Status | Created Date |
| --------- | ------ | ----------- | ---- | -------- | -------- | ------ | ------------ |
| DEFECT-SYSTEM-001 | F3 Appointment Retrieval API | API scope is not bound to authenticated principal; caller may pass arbitrary `userId` and access non-owned appointment list. | Security / Access Control | Critical | High | Open | 18-May-26 |
| DEFECT-SYSTEM-002 | F3 Appointment Status Transition API | Status transition endpoint/service does not enforce owner check using authenticated identity context. | Security / Access Control | Critical | High | Open | 18-May-26 |

## Notes
- These are system-impact defects consolidated from F3 unit/integration analysis.
- Detailed technical evidence is mapped from:
  - `DEFECT-UNIT-003.md`
  - `DEFECT-UNIT-004.md`
