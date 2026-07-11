const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { GovernanceEngine, ROLES } = require('../governance-engine');

test('offline workflow executes five roles, reworks once, and writes an approved report', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'le-dynasty-'));
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  delete process.env.DEEPSEEK_API_KEY;

  try {
    const engine = new GovernanceEngine({ deliverablesDir: dir });
    const events = [];
    engine.on('event', event => events.push(event.event));
    const run = await engine.run('Compare AI presentation product directions.');

    assert.equal(ROLES.length, 5);
    assert.equal(run.status, 'completed');
    assert.equal(run.reworks, 1);
    assert.equal(run.review, 'approved_after_rework');
    assert.equal(engine.tasks.length, 5);
    assert.deepEqual(engine.tasks.map(task => task.status), ['delivered', 'approved', 'approved', 'approved', 'approved']);
    assert.equal(engine.tasks.find(task => task.assignee === 3).contract.acceptanceContract.criteria[0].id, 'AC-001');
    assert.equal(engine.tasks.find(task => task.assignee === 3).reviewDecision.verdict, 'approve');
    assert.deepEqual(engine.tasks.find(task => task.assignee === 3).reviewDecisions.map(item => item.verdict), ['reject', 'approve']);
    assert.ok(engine.tasks.find(task => task.assignee === 3).stateHistory.some(item => item.to === 'rejected'));
    assert.deepEqual(run.metadata, { workflowType: 'reference', domain: 'product_decision', generality: 'fixed_demo' });
    assert.equal(run.artifact.status, 'delivered');
    assert.ok(events.includes('run_started'));
    assert.ok(events.includes('run_completed'));

    const reportPath = path.join(dir, run.filename);
    assert.ok(fs.existsSync(reportPath));
    const report = fs.readFileSync(reportPath, 'utf8');
    assert.match(report, /Final decision/);
    assert.match(report, /Audit trail/);
    assert.match(report, /approved after one rework/);
  } finally {
    process.env.NODE_ENV = previous;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('engine rejects concurrent workflow runs', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'le-dynasty-'));
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'test';
  try {
    const engine = new GovernanceEngine({ deliverablesDir: dir });
    const first = engine.run('First run');
    await assert.rejects(() => engine.run('Second run'), /already in progress/);
    await first;
  } finally {
    process.env.NODE_ENV = previous;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
