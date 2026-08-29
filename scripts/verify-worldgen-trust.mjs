import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import * as stateApi from '../src/worldline/state.ts';
import { createBranchThroughKernel } from '../src/worldline/causal/builtinMechanisms.ts';
import { hashCanonical } from '../src/worldline/causal/canonicalJson.ts';
import { createNewBedfordHiddenPivotalSuite } from '../src/worldline/causal/evaluatorPrivateSuites.ts';

const repositoryRoot = new URL('..', import.meta.url);
const repositoryPath = repositoryRoot.pathname;

function fail(code, detail) {
  throw new Error(`${code}: ${detail}`);
}

function sourceFiles(root) {
  const result = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...sourceFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.ts')) result.push(path);
  }
  return result.sort();
}

async function deterministicRun() {
  const result = await createBranchThroughKernel(stateApi.createInitialWorldlineState(), { label: 'Cross-process branch', atYear: 2030 });
  return {
    branchId: result.state.activeBranchId,
    receiptHash: result.receipt.coreHash,
    revisionId: result.revision.revisionId,
    canonicalStateHash: await hashCanonical({ worlds: result.state.worlds, branches: result.state.branches }),
  };
}

if (process.env.WORLDGEN_TRUST_CHILD === '1') {
  process.stdout.write(JSON.stringify(await deterministicRun()));
  process.exit(0);
}

function runFreshProcess() {
  const viteNode = join(repositoryPath, 'node_modules/.bin/vite-node');
  const result = spawnSync(viteNode, ['--script', 'scripts/verify-worldgen-trust.mjs'], {
    cwd: repositoryPath,
    encoding: 'utf8',
    env: { ...process.env, WORLDGEN_TRUST_CHILD: '1' },
  });
  if (result.status !== 0) fail('E_FRESH_PROCESS', result.stderr || result.stdout || `exit ${result.status}`);
  return result.stdout;
}

const first = runFreshProcess();
const second = runFreshProcess();
if (first !== second) fail('E_CROSS_PROCESS_NONDETERMINISM', `${first} != ${second}`);

const causalRoot = join(repositoryPath, 'src/worldline/causal');
const randomViolations = sourceFiles(causalRoot).filter((path) => /\bMath\.random\s*\(/.test(readFileSync(path, 'utf8')));
if (randomViolations.length > 0) fail('E_IMPLICIT_RANDOMNESS', randomViolations.map((path) => relative(repositoryPath, path)).join(', '));

for (const forbiddenExport of ['commitSnapshot', 'createBranch']) {
  if (forbiddenExport in stateApi) fail('E_CANONICAL_AUTHORITY_BYPASS', forbiddenExport);
}

const hiddenSuite = await createNewBedfordHiddenPivotalSuite({
  suiteVersion: '1.0.0',
  suiteNonce: 'trust-verification-private-nonce',
  evaluatorIsolation: 'PROCESS',
});
if (JSON.stringify(hiddenSuite.descriptor).includes('infrastructure-capacity')) fail('E_HIDDEN_SUITE_LEAK', 'private rule identity');
if (Object.keys(hiddenSuite).sort().join(',') !== 'descriptor,evaluate') fail('E_HIDDEN_SUITE_SURFACE', Object.keys(hiddenSuite).join(','));

const lockBytes = readFileSync(join(repositoryPath, 'package-lock.json'));
const dependencyLockHash = `sha256:${createHash('sha256').update(lockBytes).digest('hex')}`;
const deterministicRunResult = JSON.parse(first);
process.stdout.write(`${JSON.stringify({
  schema: 'worldgen-trust-preflight-v1',
  status: 'PASS',
  crossProcessDeterminism: true,
  deterministicRun: deterministicRunResult,
  implicitRandomnessViolations: [],
  canonicalMutationBypassExports: [],
  hiddenSuiteSurface: Object.keys(hiddenSuite).sort(),
  hiddenSuiteIdentifier: hiddenSuite.descriptor.hiddenSuiteIdentifier,
  dependencyLockHash,
}, null, 2)}\n`);
