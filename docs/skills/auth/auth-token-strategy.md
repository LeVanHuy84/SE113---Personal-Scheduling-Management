# Skill: Token Strategy

- Access Token → auth (JWT, short-lived)
- Verify Token → email verification
- Reset Token → password recovery

Rules:

- MUST use different secrets per token type
- MUST include "type" in payload
- MUST enforce expiry
- MUST NOT reuse tokens across flows
