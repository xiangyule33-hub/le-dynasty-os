# Governance Primitives

This document defines the domain language of Le Dynasty OS. The primitives describe accountable work independently of any specific agent framework or model provider.

| Primitive | Definition and problem solved | Minimal fields | Relationships | Example |
| --- | --- | --- | --- | --- |
| Objective | A desired organizational outcome. Prevents tasks from becoming detached activity. | `id`, `statement`, `owner`, `policy`, `successMeasures` | Produces Tasks and Decisions. | Validate a product direction before implementation. |
| Task | The smallest owned unit of accountable work. Prevents shared responsibility from becoming no responsibility. | `id`, `objectiveId`, `owner`, `state`, `contract` | Executed by an Agent or worker; produces Artifacts. | Produce a product recommendation. |
| Responsibility | A durable statement of what a Role is accountable for. | `owner`, `accountableFor`, `boundaries` | Appears inside a Contract and Role. | Product owns the final recommendation. |
| Contract | Machine-readable conditions for acceptable work. | `responsibility`, `inputContract`, `outputContract`, `acceptanceContract` | Binds a Task to expected inputs, outputs, and criteria. | A decision memo must include measurable MVP criteria. |
| Agent | A replaceable execution resource. | `id`, `capabilities`, `runtime`, `availability` | Fulfills a Role on a Task under Permissions. | A DeepSeek-backed product worker. |
| Role | An organizational function with responsibility and authority boundaries. | `id`, `purpose`, `responsibilities`, `authorities` | Assigned to Agents; participates in Reviews and Decisions. | Independent auditor. |
| Authority | The right to propose, execute, approve, reject, publish, or veto an action. | `action`, `scope`, `holder`, `conditions` | Constrained by Permission and policy. | Auditor may reject but cannot publish. |
| Decision | A machine-readable choice that changes organizational state. | `id`, `type`, `actor`, `reasonCodes`, `createdAt` | May approve, reject, or escalate a Task or Artifact. | Reject because `AC-001` failed. |
| Review | An independent evaluation against explicit acceptance criteria. | `reviewer`, `artifactId`, `criteria`, `decision` | Produces a Decision; may trigger rework. | Audit of the product recommendation. |
| Artifact | A versioned, inspectable output of work. | `id`, `type`, `uri`, `version`, `status`, `provenance` | Produced by Tasks, evaluated by Reviews, then delivered. | Markdown decision memo. |
| Permission | A rule describing which actions an actor may perform on which resources. | `subject`, `action`, `resource`, `effect`, `conditions` | Enforces Authority and policy. | Product worker may write drafts but not publish. |
| Escalation | Transfer of an unresolved decision to a higher authority. | `reason`, `from`, `to`, `deadline`, `requiredDecision` | Triggered by policy, cost, risk, or repeated rejection. | Escalate after two failed reviews. |
| Event | An immutable fact about a state transition or action. | `id`, `type`, `actor`, `subject`, `timestamp`, `payload` | Rebuilds history and supports audit. | Task moved from rejected to rework. |
| Cost | Resources consumed by accountable work. | `provider`, `model`, `tokens`, `money`, `time`, `budgetId` | Attributed to Tasks, Artifacts, and Outcomes. | USD cost of producing an approved memo. |
| Memory | Reviewed knowledge retained for future work. | `content`, `source`, `outcome`, `reviewer`, `validity` | Derived from Events and accepted Artifacts. | A validated acceptance pattern. |
| Outcome | The organizational effect produced after delivery. | `objectiveId`, `artifactIds`, `measures`, `acceptedBy` | Closes the loop back to Objective and Memory. | Founder selects the refinement strategy. |

## Accountable Task contract

```json
{
  "responsibility": {
    "owner": "product",
    "accountableFor": "Final product recommendation"
  },
  "inputContract": {
    "allowedSources": ["objective", "prior_stage_artifacts"],
    "constraints": ["Mark assumptions"]
  },
  "outputContract": {
    "artifactType": "decision_memo",
    "format": "markdown"
  },
  "acceptanceContract": {
    "criteria": [
      {
        "id": "AC-001",
        "description": "Recommendation includes measurable MVP criteria"
      }
    ]
  }
}
```

Prompt decides how an Agent responds. Contract decides whether the organization accepts the work.

## Structured review decision

```json
{
  "verdict": "reject",
  "failedCriteria": ["AC-001"],
  "reasonCodes": ["MISSING_SUCCESS_METRICS"],
  "requiredActions": ["Add measurable MVP criteria"],
  "escalate": false,
  "reviewer": "auditor"
}
```

Rejection is useful only when it produces an executable next state.

## Task states

The reference model distinguishes:

```text
proposed -> awaiting_approval -> assigned -> in_progress
         -> awaiting_review -> approved -> delivered
                            -> rejected -> rework_in_progress
                            -> blocked / escalated
```

The prototype records these names and state history. It does not yet implement a policy-driven generic transition engine.

