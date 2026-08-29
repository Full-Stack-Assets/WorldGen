import { expect, it } from 'vitest';
import { evaluateMechanismExecutionPolicy, validateEpistemicTransition } from '../causal/policy';

it('blocks an unapproved agent-generated mechanism', () => {
  expect(evaluateMechanismExecutionPolicy({
    sourceType: 'AGENT_GENERATED', promotionStatus: 'CANDIDATE', riskClass: 'LOW_RISK_RENDERING',
    reversible: true, machineVerifiable: true, independentVerificationPassed: true,
  })).toBe('HUMAN_REQUIRED');
});

it('accepts an approved low-risk independently verified mechanism execution', () => {
  expect(evaluateMechanismExecutionPolicy({
    sourceType: 'HUMAN_AUTHORED', promotionStatus: 'APPROVED_EXECUTABLE', riskClass: 'LOW_RISK_RENDERING',
    reversible: true, machineVerifiable: true, independentVerificationPassed: true,
  })).toBe('ACCEPTED');
});

it('blocks generated output from becoming observed truth', () => {
  expect(() => validateEpistemicTransition({ from: 'GENERATED', to: 'OBSERVED', evidenceIngestAuthorized: false }))
    .toThrow('Epistemic uplift requires authorized evidence ingest');
});
