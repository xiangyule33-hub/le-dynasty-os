# Reference Workflow: AI PPT Product Decision

The current PPT product decision flow is a **reference implementation and concept proof**.

```text
workflowType: reference
domain: product_decision
generality: fixed_demo
```

It is not the only intended workflow and it is not a general governance engine.

## Objective

Compare AI presentation product directions and produce an auditable product decision memo.

## Stages and concepts demonstrated

| Stage | Accountable role | Output | Governance concept demonstrated |
| --- | --- | --- | --- |
| Decision framing | Strategy Cabinet | Decision frame | Objective translated into constraints and acceptance intent |
| Evidence map | Intelligence Office | Comparison note | Inputs and assumptions separated from recommendation |
| Product recommendation | Product Ministry | Recommendation draft | One owner accountable for the recommendation |
| Independent audit | Censorate | Review Decision | Producer and reviewer are different roles |
| Final synthesis | Secretariat | Decision memo | Accepted work converges on a delivered Artifact |

## Rejection and rework

The offline demo intentionally rejects the first product recommendation once. The rejection is stored as both Markdown explanation and a structured Review Decision:

```json
{
  "verdict": "reject",
  "failedCriteria": ["AC-001"],
  "reasonCodes": ["MISSING_SUCCESS_METRICS"],
  "requiredActions": [
    "Add measurable MVP criteria",
    "Separate assumptions from verified evidence"
  ],
  "escalate": false
}
```

This proves that rejection can be represented as an executable organizational decision. It does not prove dynamic review policy. The rework count and sequence remain hardcoded.

## Artifact

The workflow writes a Markdown decision memo under `deliverables/`. The run records an Artifact reference with type, format, path, and delivery status.

Current limitations:

- no artifact version store
- no provenance graph
- no signing or immutable acceptance record
- Markdown is the only workflow artifact type
- no live source retrieval in offline mode

## What the workflow validates

- accountable task ownership
- separate production and review roles
- structured acceptance criteria
- machine-readable rejection
- one rework transition
- artifact-centered completion
- real-time status visibility

## What it does not validate

- arbitrary workflow definitions
- dynamic role selection
- enforced permissions
- policy-driven retry or escalation
- durable event sourcing
- provider pricing and budget enforcement
- organizational memory
