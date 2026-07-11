const TASK_STATES = Object.freeze([
  'proposed',
  'awaiting_approval',
  'assigned',
  'in_progress',
  'awaiting_review',
  'rejected',
  'rework_in_progress',
  'approved',
  'delivered',
  'blocked',
  'escalated'
]);

const WORKFLOW_METADATA = Object.freeze({
  workflowType: 'reference',
  domain: 'product_decision',
  generality: 'fixed_demo'
});

function createTaskContract(role, artifactType = 'working_note') {
  const criterion = role.key === 'product'
    ? 'Recommendation includes measurable MVP criteria.'
    : `${role.name} produces the required ${artifactType}.`;

  return {
    responsibility: {
      owner: role.key,
      accountableFor: role.responsibility
    },
    inputContract: {
      allowedSources: ['objective', 'prior_stage_artifacts'],
      constraints: ['Mark assumptions.', 'Do not invent current market facts.']
    },
    outputContract: {
      artifactType,
      format: 'markdown'
    },
    acceptanceContract: {
      criteria: [{
        id: role.key === 'product' ? 'AC-001' : `AC-${String(role.id).padStart(3, '0')}`,
        description: criterion
      }]
    }
  };
}

function createReviewDecision(verdict, overrides = {}) {
  return {
    verdict,
    failedCriteria: [],
    reasonCodes: [],
    requiredActions: [],
    escalate: false,
    reviewer: 'auditor',
    decidedAt: new Date().toISOString(),
    ...overrides
  };
}

module.exports = {
  TASK_STATES,
  WORKFLOW_METADATA,
  createTaskContract,
  createReviewDecision
};

