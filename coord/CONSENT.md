---
principal: Kristian
authorized_agents: []
valid_until: until-revoked
revoked: false
---

## Consent

This template is intentionally inactive. To allow coord-pulse to wake external
agent CLIs for this repo, add agents to `authorized_agents`, for example:

```yaml
authorized_agents: [agy, claude, codex]
```

Then commit `coord/CONSENT.md` as the principal. Revoke by setting
`revoked: true` or by removing agents from the list.

This is a coordination/audit gate, not a sandbox. It limits what coord-pulse
sends and records; it does not prevent a woken agent from reading files through
its own tools.
