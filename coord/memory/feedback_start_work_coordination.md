---
name: Start-work coordination rule
description: Kristian expects agents to announce what they are starting before touching shared files or document sections.
type: feedback
---

When an agent begins work in a shared area, it must first communicate in
`coord/` what it is about to work on and which files or sections it expects to
touch — before the first nontrivial edit.

This is especially important for shared prose such as Results, Discussion,
Conclusion, design memos, and planning documents, where two agents can edit
adjacent text without realizing their scopes overlap. The intended workflow:

1. Post a concise start-work note or `type: claim` in the active thread.
2. Name the scope and the files/sections.
3. If another agent may be active in the same area, narrow scope, wait for
   acknowledgement, or ask Kristian.
4. Edit only after the start-work note is posted.

Treat this as a standing working preference, not optional courtesy.

<!--
This file ships as a concrete example of a `feedback_*` shared memory. Replace
or delete it once the project has its own memories; see `README.md` for the
memory types and write policy.
-->
