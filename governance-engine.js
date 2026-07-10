const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const ROLES = [
  { id: 1, key: 'strategist', name: 'Strategy Cabinet', title: 'Decision framing', responsibility: 'Define the decision, constraints, and acceptance criteria.' },
  { id: 2, key: 'researcher', name: 'Intelligence Office', title: 'Evidence and comparison', responsibility: 'Build a structured evidence map and mark assumptions.' },
  { id: 3, key: 'product', name: 'Product Ministry', title: 'Product recommendation', responsibility: 'Turn evidence into tradeoffs and a product direction.' },
  { id: 4, key: 'auditor', name: 'Independent Censorate', title: 'Audit and rejection', responsibility: 'Challenge unsupported claims and reject weak work.' },
  { id: 5, key: 'editor', name: 'Secretariat', title: 'Final synthesis', responsibility: 'Resolve review findings and produce the deliverable.' }
];

const OFFLINE_OUTPUTS = {
  strategist: `## Decision frame

- Decision: which product direction is most defensible for an AI-assisted presentation workflow.
- User: designers and delivery teams refining an existing deck after client feedback.
- Constraints: editable PPTX output, page-level control, explainable revisions, and controlled model cost.
- Acceptance: compare alternatives on workflow fit, editability, reviewability, and implementation risk.`,
  researcher: `## Evidence map

This offline run uses an illustrative comparison rather than live market research.

| Product archetype | Typical strength | Typical limitation for this use case |
| --- | --- | --- |
| Prompt-to-deck generator | Fast first draft | Weak page-level revision of an existing client file |
| Template design suite | Mature assets and manual control | AI workflow is not centered on feedback-to-revision traceability |
| Automated layout tool | Consistent structure | Can replace the designer's intent instead of preserving it |

Assumptions requiring live verification: current export fidelity, pricing, animation support, and collaboration limits.`,
  product: `## Product recommendation

Do not compete as another prompt-to-deck generator. Build a refinement layer for existing presentations.

1. Parse the original deck and protect facts, charts, branding, and page order.
2. Convert client feedback into page-level tasks.
3. Modify existing elements before proposing a new layout.
4. Show every change as an inspectable revision.
5. Export one cumulative editable PPTX.

Primary risk: preview fidelity can create false confidence if it does not match native PowerPoint rendering.`,
  auditor_reject: `## Audit result: rejected

The recommendation has a strong position but is not ready for approval.

- Competitor observations are illustrative and must not be presented as current verified facts.
- Success metrics are missing.
- The recommendation needs a staged implementation plan and explicit stop conditions.

Required revision: label evidence confidence, add measurable MVP criteria, and separate immediate work from future capability.`,
  auditor_approve: `## Audit result: approved

The revised recommendation distinguishes assumptions from evidence, defines measurable acceptance criteria, and limits the first release to a testable workflow. Residual risk remains around native rendering fidelity.`,
  editor: `## Final decision

Proceed with a narrow AI presentation refinement product, not a general deck generator.

### MVP

- Upload and parse an existing PPTX.
- Convert natural-language feedback into page-level tasks.
- Apply controlled text and layout edits to existing elements.
- Preserve protected content and export an editable cumulative deck.
- Record the request, change, reviewer decision, and version for every revision.

### Acceptance criteria

- A six-page test deck completes the full workflow without losing page order or protected elements.
- At least 80% of requested page changes are correctly targeted without manual remapping.
- The exported PPTX opens successfully and remains editable.
- Every model call is attributable to a task and visible in usage reporting.
- A designer can reject or roll back a revision without overwriting the previous version.

### Stop conditions

- Native rendering differs enough from the exported deck to mislead reviewers.
- The system repeatedly replaces layouts when element-level editing would satisfy the request.
- Model cost cannot be tied to a useful accepted change.

### Next action

Validate one end-to-end client revision scenario before expanding templates, animation, or whole-deck generation.`
};

class GovernanceEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.deliverablesDir = options.deliverablesDir || path.join(__dirname, 'deliverables');
    this.tasks = [];
    this.runs = [];
    this.usage = { calls: 0, tokens: 0, cost: 0 };
    this.running = false;
    fs.mkdirSync(this.deliverablesDir, { recursive: true });
  }

  snapshot() {
    return {
      tasks: this.tasks.map(task => ({ ...task })),
      runs: this.runs.map(run => ({ ...run })),
      usage: { ...this.usage }
    };
  }

  updateTask(task, patch) {
    Object.assign(task, patch, { updatedAt: new Date().toISOString() });
    this.emit('event', { event: 'task_updated', data: { ...task } });
  }

  createTask(runId, role, title, order) {
    const task = {
      id: `${runId}-${order}`,
      runId,
      title,
      description: role.responsibility,
      priority: order === 4 ? 'P1' : 'P2',
      status: 'pending',
      assignee: role.id,
      assigneeName: role.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      output: ''
    };
    this.tasks.unshift(task);
    this.emit('event', { event: 'task_created', data: { ...task } });
    return task;
  }

  async callRole(role, objective, context, fallback) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return fallback;

    const prompt = [
      `You are ${role.name}, responsible for ${role.responsibility}`,
      `Objective: ${objective}`,
      'Rules: be concise, mark assumptions, do not invent current market facts, and produce Markdown.',
      context ? `Previous work:\n${context.slice(-10000)}` : '',
      `Required output for this stage: ${fallback}`
    ].filter(Boolean).join('\n\n');

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-chat', temperature: 0.2, messages: [{ role: 'user', content: prompt }] })
    });
    if (!response.ok) throw new Error(`DeepSeek returned ${response.status}`);
    const payload = await response.json();
    const usage = payload.usage || {};
    this.usage.calls += 1;
    this.usage.tokens += usage.total_tokens || 0;
    const output = payload.choices?.[0]?.message?.content?.trim();
    return output || fallback;
  }

  async execute(task, role, objective, context, fallback) {
    this.updateTask(task, { status: 'in_progress' });
    await new Promise(resolve => setTimeout(resolve, process.env.NODE_ENV === 'test' ? 5 : 450));
    try {
      const output = await this.callRole(role, objective, context, fallback);
      this.updateTask(task, { status: 'completed', output, completedAt: new Date().toISOString() });
      return output;
    } catch (error) {
      this.updateTask(task, { status: 'blocked', error: error.message });
      throw error;
    }
  }

  async run(objective) {
    if (this.running) throw new Error('A governance run is already in progress.');
    this.running = true;
    const runId = `RUN-${Date.now()}`;
    const run = { id: runId, objective, status: 'running', startedAt: new Date().toISOString(), reworks: 0, events: [] };
    this.runs.unshift(run);
    this.emit('event', { event: 'run_started', data: { ...run } });

    try {
      const strategist = this.createTask(runId, ROLES[0], 'Frame the product decision', 1);
      const research = this.createTask(runId, ROLES[1], 'Build the competitor evidence map', 2);
      const product = this.createTask(runId, ROLES[2], 'Recommend a defensible product direction', 3);
      const audit = this.createTask(runId, ROLES[3], 'Audit claims and acceptance criteria', 4);
      const editor = this.createTask(runId, ROLES[4], 'Produce the approved decision report', 5);

      const frame = await this.execute(strategist, ROLES[0], objective, '', OFFLINE_OUTPUTS.strategist);
      const evidence = await this.execute(research, ROLES[1], objective, frame, OFFLINE_OUTPUTS.researcher);
      const recommendation = await this.execute(product, ROLES[2], objective, `${frame}\n\n${evidence}`, OFFLINE_OUTPUTS.product);

      const rejection = await this.execute(audit, ROLES[3], objective, recommendation, OFFLINE_OUTPUTS.auditor_reject);
      run.reworks = 1;
      this.updateTask(product, { status: 'in_progress', review: rejection, rework: 1 });
      const revised = await this.callRole(ROLES[2], objective, `${recommendation}\n\n${rejection}`, `${recommendation}\n\n${OFFLINE_OUTPUTS.editor}`);
      this.updateTask(product, { status: 'completed', output: revised, completedAt: new Date().toISOString() });

      const approval = await this.callRole(ROLES[3], objective, revised, OFFLINE_OUTPUTS.auditor_approve);
      this.updateTask(audit, { status: 'completed', output: `${rejection}\n\n${approval}`, verdict: 'approved_after_rework' });
      const finalBody = await this.execute(editor, ROLES[4], objective, `${revised}\n\n${approval}`, OFFLINE_OUTPUTS.editor);

      const report = `# AI Presentation Product Decision Report\n\n**Run:** ${runId}  \n**Objective:** ${objective}  \n**Mode:** ${process.env.DEEPSEEK_API_KEY ? 'DeepSeek' : 'Offline deterministic demo'}  \n**Review:** approved after one rework\n\n${finalBody}\n\n---\n\n## Audit trail\n\n${rejection}\n\n${approval}\n`;
      const filename = `${runId.toLowerCase()}-decision-report.md`;
      fs.writeFileSync(path.join(this.deliverablesDir, filename), report, 'utf8');
      Object.assign(run, { status: 'completed', completedAt: new Date().toISOString(), filename, review: 'approved_after_rework' });
      this.emit('event', { event: 'run_completed', data: { ...run } });
      return { ...run };
    } catch (error) {
      Object.assign(run, { status: 'blocked', error: error.message, completedAt: new Date().toISOString() });
      this.emit('event', { event: 'run_blocked', data: { ...run } });
      throw error;
    } finally {
      this.running = false;
    }
  }
}

module.exports = { GovernanceEngine, ROLES, OFFLINE_OUTPUTS };

