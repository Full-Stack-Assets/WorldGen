export interface SkillPatch {
  id: string;
  trigger: string;
  workflow: string[];
  toolRequirements: string[];
  obligations: string[];
  outputFields: string[];
}

export interface SharedProcedure {
  id: string;
  steps: string[];
  patchIds: string[];
}

export interface SkillResidual {
  patchId: string;
  trigger: string;
  sharedProcedureId: string | null;
  workflow: string[];
  toolRequirements: string[];
  obligations: string[];
  outputFields: string[];
}

export interface SkillCoverage {
  complete: boolean;
  patchCount: number;
  triggersCovered: number;
  workflowEdgesCovered: number;
  toolRequirementsCovered: number;
  obligationsCovered: number;
  outputFieldsCovered: number;
}

export interface CompressedSkill {
  schema: 'worldline-skill-compression-v2';
  sourcePatches: SkillPatch[];
  sharedProcedures: SharedProcedure[];
  residuals: SkillResidual[];
  coverage: SkillCoverage;
}

function stableStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function normalizePatch(patch: SkillPatch): SkillPatch {
  return {
    id: patch.id.trim(),
    trigger: patch.trigger.trim(),
    workflow: patch.workflow.map((value) => value.trim()).filter(Boolean),
    toolRequirements: stableStrings(patch.toolRequirements),
    obligations: stableStrings(patch.obligations),
    outputFields: stableStrings(patch.outputFields),
  };
}

function workflowKey(workflow: string[]): string {
  return JSON.stringify(workflow);
}

function procedureId(steps: string[]): string {
  let hash = 2166136261;
  const text = workflowKey(steps);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `procedure-${(hash >>> 0).toString(36)}`;
}

function coverageFor(patches: SkillPatch[], residuals: SkillResidual[], sharedProcedures: SharedProcedure[]): SkillCoverage {
  const sharedById = new Map(sharedProcedures.map((procedure) => [procedure.id, procedure]));
  let triggersCovered = 0;
  let workflowEdgesCovered = 0;
  let toolRequirementsCovered = 0;
  let obligationsCovered = 0;
  let outputFieldsCovered = 0;
  let complete = true;

  for (const patch of patches) {
    const residual = residuals.find((item) => item.patchId === patch.id);
    if (!residual || residual.trigger !== patch.trigger) {
      complete = false;
      continue;
    }
    triggersCovered += 1;
    const workflow = residual.sharedProcedureId
      ? sharedById.get(residual.sharedProcedureId)?.steps ?? []
      : residual.workflow;
    if (JSON.stringify(workflow) !== JSON.stringify(patch.workflow)) complete = false;
    else workflowEdgesCovered += patch.workflow.length;

    const checks: Array<[string[], string[], 'tools' | 'obligations' | 'outputs']> = [
      [patch.toolRequirements, residual.toolRequirements, 'tools'],
      [patch.obligations, residual.obligations, 'obligations'],
      [patch.outputFields, residual.outputFields, 'outputs'],
    ];
    for (const [expected, actual, kind] of checks) {
      if (JSON.stringify(expected) !== JSON.stringify(actual)) complete = false;
      if (kind === 'tools') toolRequirementsCovered += actual.length;
      if (kind === 'obligations') obligationsCovered += actual.length;
      if (kind === 'outputs') outputFieldsCovered += actual.length;
    }
  }

  return {
    complete,
    patchCount: patches.length,
    triggersCovered,
    workflowEdgesCovered,
    toolRequirementsCovered,
    obligationsCovered,
    outputFieldsCovered,
  };
}

export function compressSkillPatches(input: SkillPatch[]): CompressedSkill {
  const patches = input.map(normalizePatch).sort((a, b) => a.id.localeCompare(b.id));
  const workflowGroups = new Map<string, SkillPatch[]>();
  for (const patch of patches) {
    const key = workflowKey(patch.workflow);
    workflowGroups.set(key, [...(workflowGroups.get(key) ?? []), patch]);
  }

  const sharedProcedures = [...workflowGroups.values()]
    .filter((group) => group.length >= 2 && group[0].workflow.length > 0)
    .map((group) => ({
      id: procedureId(group[0].workflow),
      steps: [...group[0].workflow],
      patchIds: group.map((patch) => patch.id).sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const procedureForPatch = new Map<string, string>();
  for (const procedure of sharedProcedures) {
    for (const patchId of procedure.patchIds) procedureForPatch.set(patchId, procedure.id);
  }

  const residuals = patches.map((patch): SkillResidual => {
    const sharedProcedureId = procedureForPatch.get(patch.id) ?? null;
    return {
      patchId: patch.id,
      trigger: patch.trigger,
      sharedProcedureId,
      workflow: sharedProcedureId ? [] : [...patch.workflow],
      toolRequirements: [...patch.toolRequirements],
      obligations: [...patch.obligations],
      outputFields: [...patch.outputFields],
    };
  });

  return {
    schema: 'worldline-skill-compression-v2',
    sourcePatches: structuredClone(patches),
    sharedProcedures,
    residuals,
    coverage: coverageFor(patches, residuals, sharedProcedures),
  };
}

export function zipSkillPatchOnWrite(current: CompressedSkill, patch: SkillPatch): CompressedSkill {
  const next = current.sourcePatches.filter((item) => item.id !== patch.id);
  next.push(structuredClone(patch));
  return compressSkillPatches(next);
}
