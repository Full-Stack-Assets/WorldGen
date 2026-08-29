import { canonicalize } from './canonicalJson';
import type { CausalReference } from './types';

export type TransitionIrComparator = 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'TRUTHY' | 'FALSY';
export type TransitionIrExpression =
  | string | number | boolean | null
  | { input: string }
  | { state: string }
  | { expr: 'ADD' | 'SUBTRACT' | 'MULTIPLY' | 'DIVIDE' | 'MIN' | 'MAX'; args: readonly TransitionIrExpression[] }
  | { expr: 'ROUND'; value: TransitionIrExpression; scale: number }
  | { expr: 'COMPARE'; comparator: TransitionIrComparator; left: TransitionIrExpression; right: TransitionIrExpression }
  | { expr: 'AND' | 'OR'; args: readonly TransitionIrExpression[] }
  | { expr: 'NOT'; value: TransitionIrExpression };

export type TransitionIrOperation =
  | { op: 'SET'; path: string; value: TransitionIrExpression }
  | { op: 'INCREMENT'; path: string; value: TransitionIrExpression }
  | { op: 'APPEND_UNIQUE'; path: string; value: TransitionIrExpression }
  | { op: 'TOMBSTONE'; path: string }
  | { op: 'ASSERT'; path: string; comparator: TransitionIrComparator; value?: TransitionIrExpression }
  | { op: 'LINK_CAUSE'; path: string; value: TransitionIrExpression };

export interface TransitionIrProgram {
  version: 'TRANSITION_IR_V1';
  operations: readonly TransitionIrOperation[];
}

export interface TransitionIrMechanismBoundary {
  readSet: readonly string[];
  writeSet: readonly string[];
}

const FORBIDDEN_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);
const ALLOWED_OPERATIONS = new Set(['SET', 'INCREMENT', 'APPEND_UNIQUE', 'TOMBSTONE', 'ASSERT', 'LINK_CAUSE']);
const ALLOWED_COMPARATORS = new Set(['EQ', 'NEQ', 'GT', 'GTE', 'LT', 'LTE', 'TRUTHY', 'FALSY']);

function parsePointer(path: string): string[] {
  if (!path.startsWith('/')) throw new Error(`Invalid JSON Pointer: ${path}`);
  const parts = path.slice(1).split('/').map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
  if (parts.some((part) => FORBIDDEN_SEGMENTS.has(part))) throw new Error('Forbidden JSON Pointer segment');
  return parts;
}

function pathAllowed(path: string, declared: readonly string[]): boolean {
  parsePointer(path);
  return declared.some((prefix) => path === prefix || path.startsWith(`${prefix.replace(/\/$/, '')}/`));
}

function getAtPath(root: unknown, path: string): unknown {
  let cursor: unknown = root;
  for (const segment of parsePointer(path)) {
    if (cursor === null || typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return cursor;
}

function setAtPath(root: unknown, path: string, value: unknown): void {
  const parts = parsePointer(path);
  if (parts.length === 0) throw new Error('Root replacement is not supported');
  let cursor = root as Record<string, unknown>;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const segment = parts[index];
    const existing = cursor[segment];
    if (existing === null || typeof existing !== 'object' || Array.isArray(existing)) cursor[segment] = {};
    cursor = cursor[segment] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = structuredClone(value);
}

function collectStateReads(value: TransitionIrExpression | undefined, out: string[]): void {
  if (value === undefined || value === null || typeof value !== 'object') return;
  if ('state' in value) {
    if (typeof value.state !== 'string') throw new Error('Invalid state expression');
    out.push(value.state);
    return;
  }
  if ('input' in value) {
    if (typeof value.input !== 'string' || value.input.length === 0) throw new Error('Invalid input expression');
    return;
  }
  if (!('expr' in value)) throw new Error('Unsupported expression');
  switch (value.expr) {
    case 'ADD': case 'SUBTRACT': case 'MULTIPLY': case 'DIVIDE': case 'MIN': case 'MAX': case 'AND': case 'OR':
      value.args.forEach((item) => collectStateReads(item, out));
      break;
    case 'ROUND': case 'NOT':
      collectStateReads(value.value, out);
      break;
    case 'COMPARE':
      collectStateReads(value.left, out);
      collectStateReads(value.right, out);
      break;
    default:
      throw new Error('Unsupported expression');
  }
}

function finite(value: number): number {
  if (!Number.isFinite(value)) throw new Error('Non-finite transition result');
  return value;
}

function compare(comparator: TransitionIrComparator, left: unknown, right?: unknown): boolean {
  if (!ALLOWED_COMPARATORS.has(comparator)) throw new Error(`Unsupported comparator: ${String(comparator)}`);
  switch (comparator) {
    case 'EQ': return Object.is(left, right) || left === right;
    case 'NEQ': return !(Object.is(left, right) || left === right);
    case 'GT': return Number(left) > Number(right);
    case 'GTE': return Number(left) >= Number(right);
    case 'LT': return Number(left) < Number(right);
    case 'LTE': return Number(left) <= Number(right);
    case 'TRUTHY': return Boolean(left);
    case 'FALSY': return !left;
  }
}

function evaluate(expression: TransitionIrExpression, state: unknown, inputs: Record<string, unknown>): unknown {
  if (expression === null || typeof expression !== 'object') return expression;
  if ('input' in expression) {
    if (!(expression.input in inputs)) throw new Error(`Missing transition input: ${expression.input}`);
    return structuredClone(inputs[expression.input]);
  }
  if ('state' in expression) return structuredClone(getAtPath(state, expression.state));
  switch (expression.expr) {
    case 'ADD': return finite(expression.args.reduce<number>((sum, item) => sum + Number(evaluate(item, state, inputs)), 0));
    case 'SUBTRACT': {
      const values = expression.args.map((item) => Number(evaluate(item, state, inputs)));
      if (values.length === 0) throw new Error('SUBTRACT requires arguments');
      return finite(values.slice(1).reduce((result, value) => result - value, values[0]));
    }
    case 'MULTIPLY': return finite(expression.args.reduce<number>((product, item) => product * Number(evaluate(item, state, inputs)), 1));
    case 'DIVIDE': {
      if (expression.args.length !== 2) throw new Error('DIVIDE requires exactly two arguments');
      const numerator = Number(evaluate(expression.args[0], state, inputs));
      const denominator = Number(evaluate(expression.args[1], state, inputs));
      if (denominator === 0) throw new Error('Division by zero');
      return finite(numerator / denominator);
    }
    case 'MIN': return finite(Math.min(...expression.args.map((item) => Number(evaluate(item, state, inputs)))));
    case 'MAX': return finite(Math.max(...expression.args.map((item) => Number(evaluate(item, state, inputs)))));
    case 'ROUND': {
      if (!Number.isInteger(expression.scale) || expression.scale < 0 || expression.scale > 12) throw new Error('Invalid rounding scale');
      const factor = 10 ** expression.scale;
      return finite(Math.round(Number(evaluate(expression.value, state, inputs)) * factor) / factor);
    }
    case 'COMPARE': return compare(expression.comparator, evaluate(expression.left, state, inputs), evaluate(expression.right, state, inputs));
    case 'AND': return expression.args.every((item) => Boolean(evaluate(item, state, inputs)));
    case 'OR': return expression.args.some((item) => Boolean(evaluate(item, state, inputs)));
    case 'NOT': return !Boolean(evaluate(expression.value, state, inputs));
    default: throw new Error(`Unsupported expression operator: ${String((expression as { expr?: unknown }).expr)}`);
  }
}

function validateCause(value: unknown): asserts value is CausalReference {
  if (!value || typeof value !== 'object') throw new Error('Invalid causal reference');
  const record = value as Partial<CausalReference>;
  const sourceTypes = ['ENTITY', 'EVENT', 'EVIDENCE', 'ACTION', 'INTERVENTION', 'REVISION'];
  const relations = ['TRIGGERED_BY', 'CONSTRAINED_BY', 'DERIVED_FROM', 'COUNTERFACTUAL_TO', 'EVIDENCED_BY'];
  if (!sourceTypes.includes(String(record.sourceType)) || !relations.includes(String(record.relation))) throw new Error('Invalid causal reference');
  if (!record.sourceId || !record.sourceRevisionId || typeof record.provenanceDigest !== 'string' || !record.provenanceDigest.startsWith('sha256:')) {
    throw new Error('Invalid causal reference');
  }
}

export function validateTransitionIr(program: TransitionIrProgram, mechanism: TransitionIrMechanismBoundary): void {
  if (!program || program.version !== 'TRANSITION_IR_V1' || !Array.isArray(program.operations)) throw new Error('Unsupported Transition IR');
  for (const operation of program.operations) {
    if (!operation || typeof operation !== 'object' || !ALLOWED_OPERATIONS.has(String((operation as { op?: unknown }).op))) {
      throw new Error(`Unsupported transition operation: ${String((operation as { op?: unknown })?.op)}`);
    }
    parsePointer(operation.path);
    if (operation.op === 'ASSERT' && !ALLOWED_COMPARATORS.has(String(operation.comparator))) {
      throw new Error(`Unsupported comparator: ${String(operation.comparator)}`);
    }
    const writes = operation.op !== 'ASSERT';
    if (writes && !pathAllowed(operation.path, mechanism.writeSet)) throw new Error(`Undeclared write path: ${operation.path}`);
    const reads: string[] = [];
    if (operation.op === 'ASSERT' || operation.op === 'INCREMENT' || operation.op === 'APPEND_UNIQUE') reads.push(operation.path);
    if ('value' in operation) collectStateReads(operation.value, reads);
    for (const path of reads) if (!pathAllowed(path, mechanism.readSet)) throw new Error(`Undeclared read path: ${path}`);
  }
}

export function executeTransitionIr<T>(baseState: T, program: TransitionIrProgram, inputs: Record<string, unknown>): T {
  const state = structuredClone(baseState);
  for (const operation of program.operations) {
    switch (operation.op) {
      case 'ASSERT': {
        const actual = getAtPath(state, operation.path);
        const expected = operation.value === undefined ? undefined : evaluate(operation.value, state, inputs);
        if (!compare(operation.comparator, actual, expected)) throw new Error(`Transition assertion failed: ${operation.path}`);
        break;
      }
      case 'SET':
        setAtPath(state, operation.path, evaluate(operation.value, state, inputs));
        break;
      case 'INCREMENT': {
        const current = Number(getAtPath(state, operation.path));
        const delta = Number(evaluate(operation.value, state, inputs));
        setAtPath(state, operation.path, finite(current + delta));
        break;
      }
      case 'APPEND_UNIQUE': {
        const current = getAtPath(state, operation.path);
        if (!Array.isArray(current)) throw new Error(`APPEND_UNIQUE target is not an array: ${operation.path}`);
        const value = evaluate(operation.value, state, inputs);
        const digest = canonicalize(value);
        if (!current.some((item) => canonicalize(item) === digest)) setAtPath(state, operation.path, [...current, structuredClone(value)]);
        break;
      }
      case 'TOMBSTONE':
        setAtPath(state, operation.path, { tombstoned: true });
        break;
      case 'LINK_CAUSE': {
        const current = getAtPath(state, operation.path);
        if (!Array.isArray(current)) throw new Error(`LINK_CAUSE target is not an array: ${operation.path}`);
        const value = evaluate(operation.value, state, inputs);
        validateCause(value);
        setAtPath(state, operation.path, [...current, structuredClone(value)]);
        break;
      }
    }
  }
  return state;
}
