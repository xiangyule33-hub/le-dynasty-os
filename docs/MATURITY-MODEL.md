# AI Organization Maturity Model

Automation should not exceed governance maturity. This model describes increasing organizational capability, not model intelligence.

## Level 0: Chat

One user interacts with one model. The conversation is the primary unit of work.

## Level 1: Tools

The model can call tools or external APIs. Actions exist, but ownership and acceptance remain mostly implicit.

## Level 2: Workflows

Multiple steps execute in a repeatable sequence. State and handoffs may be visible, but roles and authority remain simplified.

## Level 3: Roles

Different executors have explicit responsibilities. One task has one accountable owner. Outputs are associated with roles and artifacts.

## Level 4: Governance

The system enforces approval, independent review, permissions, rejection, escalation, and acceptance contracts. Decisions are machine-readable and events are durable.

## Level 5: Organization

The system manages multiple objectives, portfolios, budgets, permissions, memory, outcomes, and organizational learning across many workflows.

## Current project position

Le Dynasty OS is currently **Level 2.5: a workflow prototype with emerging role and governance primitives**.

Implemented evidence:

- a repeatable five-stage workflow
- one accountable assignee per task
- a separate auditor role
- a structured Task Contract example attached to tasks
- a structured Review Decision in the reference workflow
- an Artifact written to disk
- SSE status updates

Why it is not Level 3 or Level 4 yet:

- roles and team selection are hardcoded
- rejection and one rework cycle are fixed
- transition policy is not generic
- events are not durably stored or replayable
- permissions are documented but not enforced
- cost is not budget governance
- memory and outcome measurement are target concepts

