import { expect, it } from 'vitest';
import { createBranchThroughKernel } from '../causal/builtinMechanisms';
import { createInitialWorldlineState } from '../state';

it('does not expose unchecked canonical mutation functions', async () => {
  const stateModule = await import('../state');
  expect('commitSnapshot' in stateModule).toBe(false);
  expect('createBranch' in stateModule).toBe(false);
});

it('branch creation preserves the parent branch and produces an admitted revision receipt', async () => {
  const state = createInitialWorldlineState();
  const parentBefore = JSON.stringify(state.branches[state.activeBranchId]);
  const result = await createBranchThroughKernel(state, { label: 'alternate', atYear: 2030 });
  expect(result.decision).toBe('ACCEPTED');
  expect(result.receipt.core.decision).toBe('ACCEPTED');
  expect(result.revision.transitionReceiptCoreHash).toBe(result.receipt.coreHash);
  expect(JSON.stringify(state.branches[state.activeBranchId])).toBe(parentBefore);
  expect(result.state.activeBranchId).not.toBe(state.activeBranchId);
});
