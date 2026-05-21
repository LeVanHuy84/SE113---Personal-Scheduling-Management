# Bug List

| Defect ID | Module | Description | Type | Severity | Priority | Status | Created Date |
| --------- | ------ | ----------- | ---- | -------- | -------- | ------ | ------------ |
| DEFECT-UNIT-001 | F3 Appointment Status Transition | Invalid status value was accepted in `updateAppointmentStatus`; expected `400 Bad Request` for out-of-enum status. | Functional | Major | High | Fixed | 18-May-26 |
| DEFECT-UNIT-002 | F4 Create Series | Invalid timezone (`Mars/Phobos`) was accepted in series create/update; expected validation rejection. | Validation | Major | High | Fixed | 18-May-26 |
| DEFECT-UNIT-003 | F3 Appointment Status Transition | Missing ownership enforcement in status transition flow; non-owner scenario cannot be blocked at service layer. | Security / Access Control | Critical | High | Open | 18-May-26 |
| DEFECT-UNIT-004 | F3 Appointment Retrieval | Retrieval flow trusts client-supplied `userId` query; risk of cross-user data access. | Security / Data Isolation | Critical | High | Open | 18-May-26 |

## Notes
- Source details are maintained in individual files:
  - `DEFECT-UNIT-001.md`
  - `DEFECT-UNIT-002.md`
  - `DEFECT-UNIT-003.md`
  - `DEFECT-UNIT-004.md`
