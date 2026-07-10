# Le Dynasty OS

> An open-source operating system for running a one-person AI company.

Le Dynasty OS explores a practical question: if one founder can call many AI agents, how should those agents be organized so they produce reliable work instead of repeating one another?

This project treats AI agents as an organization with responsibilities, authority, handoffs, review gates, memory, and measurable delivery. The Chinese-dynasty metaphor provides a memorable interface, while the underlying model maps to modern company operations.

![Le Dynasty OS dashboard](assets/dashboard.png)

## Why It Exists

Most multi-agent demos place several personas in a chat room. That creates more messages, but not necessarily better outcomes.

Le Dynasty OS focuses on the operating system around the models:

```text
Founder sets an objective
        ↓
Decision layer clarifies direction
        ↓
Dispatch layer decomposes the work
        ↓
Specialist agents execute in sequence
        ↓
Audit and safety agents challenge the result
        ↓
The founder approves the deliverable
        ↓
Reusable knowledge returns to organizational memory
```

## Core Principles

- **One owner per task.** Collaboration should not blur accountability.
- **Agents have boundaries.** Every role defines what it owns and what it must not decide.
- **Review is independent.** The agent producing work should not be the only agent judging it.
- **Escalation is visible.** Blockers and decisions requiring the founder appear before vanity metrics.
- **Memory follows outcomes.** Useful experience is written back after review, not copied from every conversation.
- **Cost is operational data.** Model usage belongs beside progress and delivery quality.

## Governance Model

The dynasty vocabulary is a product metaphor, not decorative role-play.

| Dynasty role | Operational responsibility |
| --- | --- |
| Emperor | Founder and final decision owner |
| Cabinet | Decision support and proposal synthesis |
| Secretariat | Task decomposition, dispatch, and progress control |
| Six Ministries | Product, engineering, growth, content, finance, and operations |
| Censorate | Independent audit and challenge function |
| Imperial Guard | Security, permissions, and risk control |
| Hanlin Academy | Knowledge, standards, and organizational memory |
| Observatory | Data monitoring, forecasting, and intelligence |

## AI Complementarity

Agents are useful when they contribute different forms of judgment:

- Product decides whether the need is real.
- Engineering decides whether the plan is feasible.
- Design protects usability and communication quality.
- Data checks whether claims are supported.
- Finance evaluates cost and return.
- Security checks permissions and exposure.
- Audit looks for failure modes and weak assumptions.
- Dispatch controls dependencies and delivery order.

The objective is not consensus. The objective is a traceable result that has survived the right disagreements.

## Current Prototype

The repository currently contains the first public dashboard slice:

- decision-first operating overview
- task and blocker visibility
- AI collaboration chain
- deliverable review area
- live API mode with a standalone local demo fallback
- functional task creation in both modes
- responsive desktop and mobile layouts

Open `index.html` directly to use demo mode. When served by a compatible backend, it automatically reads live system data.

## Backend Contract

```text
GET  /api/tasks
POST /api/tasks
GET  /api/agents
GET  /api/deliverables
GET  /api/token-usage
WS   /  task update events
```

The public repository intentionally excludes private employee memories, API keys, logs, customer files, and local runtime data.

## Roadmap

- Publish a sanitized orchestration backend
- Define role permissions and task acceptance contracts
- Add review, rejection, and escalation workflows
- Add organizational memory with provenance
- Add token cost and delivery-quality reporting
- Package a local desktop distribution

## Status

Early public prototype. The dashboard is usable; the full local orchestration system is being separated from private runtime data before release.

## License

MIT

