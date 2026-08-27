import { canonicalizeToJson } from './canonicalize';
import { hashCanonical } from './hash';
import type { Sha256Digest, TransitionIrOperation, TransitionIrV1, TransitionMechanismArtifact } from './types';

const ALLOWED_OPERATIONS = new Set<TransitionIrOperation['op']>([
  'SET',
  'INCREMENT',
  'APPEND_UNIQUE',
  'TOMBSTONE',
  'ASSERT',
  'LINK_CAUSE',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function assertAllowedKeys(value: Record<string, unknown>, allowed: readonly string[], context: string): void {
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length > 0) throw new Error(`${context} contains unsupported fields: ${unexpected.join(', ')}`);
}

export function assertJsonPointer(path: string): void {
  if (path === '') return;
  if (!path.startsWith('/')) throw new Error(`Invalid JSON Pointer: ${path}`);
  for (const segment of path.slice(1).split('/')) {
    for (let index = 0; index < segment.length; index += 1) {
      if (segment[index] !== '~') continue;
      const escape = segment[index + 1];
      if (escape !== '0' && escape !== '1') throw new Error(`Invalid JSON Pointer escape in: ${path}`);
      index += 1;
    }
  }
}

function assertOperation(value: unknown): asserts value is TransitionIrOperation {
  if (!isRecord(value)) throw new Error('Transition IR operation must be an object');
  const op = value.op;
  if (typeof op !== 'string' || !ALLOWED_OPERATIONS.has(op as TransitionIrOperation['op'])) {
    throw new Error(`Unsupported operation: ${String(op)}`);
  }
  if (typeof value.path !== 'string') throw new Error(`${op} operation requires a JSON Pointer path`);
  assertJsonPointer(value.path);

  switch (op) {
    case 'SET':
      assertAllowedKeys(value, ['op', 'path', 'value'], 'SET operation');
      if (!Object.hasOwn(value, 'value')) throw new Error('SET operation requires value');
      canonicalizeToJson(value.value);
      return;
    case 'INCREMENT':
      assertAllowedKeys(value, ['op', 'path', 'value'], 'INCREMENT operation');
      if (typeof value.value !== 'number' || !Number.isFinite(value.value)) {
        throw new Error('INCREMENT operation requires a finite numeric value');
      }
      return;
    case 'APPEND_UNIQUE':
      assertAllowedKeys(value, ['op', 'path', 'value'], 'APPEND_UNIQUE operation');
      if (!Object.hasOwn(value, 'value')) throw new Error('APPEND_UNIQUE operation requires value');
      canonicalizeToJson(value.value);
      return;
    case 'TOMBSTONE':
      assertAllowedKeys(value, ['op', 'path'], 'TOMBSTONE operation');
      return;
    case 'ASSERT':
      assertAllowedKeys(value, ['op', 'path', 'equals'], 'ASSERT operation');
      if (!Object.hasOwn(value, 'equals')) throw new Error('ASSERT operation requires equals');
      canonicalizeToJson(value.equals);
      return;
    case 'LINK_CAUSE':
      assertAllowedKeys(value, ['op', 'path', 'cause'], 'LINK_CAUSE operation');
      if (!isRecord(value.cause) || typeof value.cause.type !== 'string' || typeof value.cause.ref !== 'string') {
        throw new Error('LINK_CAUSE operation requires a cause with type and ref');
      }
      assertAllowedKeys(value.cause, ['type', 'ref'], 'LINK_CAUSE cause');
      return;
  }
}

export function assertTransitionIrV1(value: unknown): asserts value is TransitionIrV1 {
  if (!isRecord(value)) throw new Error('Transition IR must be an object');
  assertAllowedKeys(value, ['version', 'operations'], 'Transition IR');
  if (value.version !== '1') throw new Error(`Unsupported Transition IR version: ${String(value.version)}`);
  if (!Array.isArray(value.operations)) throw new Error('Transition IR operations must be an array');
  for (const operation of value.operations) assertOperation(operation);
}

function isWithinDeclaredPath(path: string, declaredPath: string): boolean {
  if (declaredPath === '') return true;
  return path === declaredPath || path.startsWith(`${declaredPath}/`);
}

function assertPathDeclared(path: string, declared: string[], kind: 'read' | 'write'): void {
  for (const item of declared) assertJsonPointer(item);
  if (!declared.some((item) => isWithinDeclaredPath(path, item))) {
    throw new Error(`Operation path ${path} is outside the declared ${kind} set`);
  }
}

export function assertOperationWithinDeclaredSets(
  operation: TransitionIrOperation,
  readSet: string[],
  writeSet: string[],
): void {
  switch (operation.op) {
    case 'ASSERT':
      assertPathDeclared(operation.path, readSet, 'read');
      return;
    case 'INCREMENT':
    case 'APPEND_UNIQUE':
      assertPathDeclared(operation.path, readSet, 'read');
      assertPathDeclared(operation.path, writeSet, 'write');
      return;
    case 'SET':
    case 'TOMBSTONE':
    case 'LINK_CAUSE':
      assertPathDeclared(operation.path, writeSet, 'write');
      return;
  }
}

export function assertIrWithinDeclaredSets(ir: TransitionIrV1, readSet: string[], writeSet: string[]): void {
  for (const operation of ir.operations) assertOperationWithinDeclaredSets(operation, readSet, writeSet);
}

export function mechanismDefinitionPayload(
  mechanism: Omit<TransitionMechanismArtifact, 'mechanismHash'> | TransitionMechanismArtifact,
) {
  return {
    schema: mechanism.schema,
    mechanismId: mechanism.mechanismId,
    producerId: mechanism.producerId,
    sourceType: mechanism.sourceType,
    executorKind: mechanism.executorKind,
    stateSchema: mechanism.stateSchema,
    inputSchema: mechanism.inputSchema,
    readSet: [...mechanism.readSet].sort(),
    writeSet: [...mechanism.writeSet].sort(),
    epistemicCeiling: mechanism.epistemicCeiling,
    deterministicSeedPolicy: mechanism.deterministicSeedPolicy,
    invariantSuiteIds: [...mechanism.invariantSuiteIds].sort(),
    riskClass: mechanism.riskClass,
    executionPolicy: mechanism.executionPolicy,
    ir: mechanism.ir,
  };
}

export function computeMechanismHash(
  mechanism: Omit<TransitionMechanismArtifact, 'mechanismHash'> | TransitionMechanismArtifact,
): Sha256Digest {
  return hashCanonical(mechanismDefinitionPayload(mechanism));
}
