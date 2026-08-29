import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dataDir = resolve(process.cwd(), 'public/data/new-bedford');
const load = async (name) => JSON.parse(await readFile(resolve(dataDir, name), 'utf8'));
const [manifest, snapshots, geometry, scenario] = await Promise.all([load('manifest.json'), load('snapshots.json'), load('geometry.geojson'), load('scenario-lab.json')]);
const failures = [];
const sourceIds = new Set(manifest.sources.map((source) => source.sourceId));
if (manifest.worldId !== 'new-bedford-001' || snapshots.worldId !== manifest.worldId) failures.push('World IDs do not match');
if (geometry.type !== 'FeatureCollection' || geometry.features.length === 0) failures.push('Geometry must be a non-empty FeatureCollection');
for (const feature of geometry.features) {
  if (!sourceIds.has(feature.properties?.sourceId)) failures.push(`Unknown feature source: ${feature.properties?.sourceId}`);
  if (feature.geometry?.type !== 'Polygon') failures.push(`Unsupported geometry: ${feature.geometry?.type}`);
  for (const ring of feature.geometry?.coordinates ?? []) {
    if (JSON.stringify(ring[0]) !== JSON.stringify(ring.at(-1))) failures.push(`Unclosed ring: ${feature.id}`);
    for (const [longitude, latitude] of ring) if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) failures.push(`Coordinate outside EPSG:4326 bounds: ${feature.id}`);
  }
  if (['owner', 'address', 'assessedValue'].some((key) => key in (feature.properties ?? {}))) failures.push(`Sensitive property present: ${feature.id}`);
}
if (scenario.claimBoundary !== 'SCENARIO_ANALYSIS_NOT_PREDICTION') failures.push('Scenario claim boundary is unsafe');
if (scenario.sourceTime === scenario.simulationTime) failures.push('Source and simulation time must differ');
if (!scenario.expertReviewRequired) failures.push('Expert review gate is required');
if (scenario.interventions.length === 0 || scenario.interventions.length > 5) failures.push('Intervention set must be bounded');
for (const item of scenario.interventions) if (item.status !== 'PROPOSED_EXPERT_REVIEW_REQUIRED') failures.push(`Intervention is not review-gated: ${item.id}`);
if (failures.length > 0) { console.error(JSON.stringify({ status: 'FAIL', failures }, null, 2)); process.exitCode = 1; }
else console.log(JSON.stringify({ status: 'PASS', worldId: manifest.worldId, sources: manifest.sources.length, snapshots: snapshots.snapshots.length, geometryFeatures: geometry.features.length, crs: 'EPSG:4326', claimBoundary: scenario.claimBoundary }, null, 2));
