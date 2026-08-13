import type { WorldLore } from '../types/world';

export function serializeWorldBible(lore: WorldLore): string {
  const factions = lore.factions.map((faction) => [
    `### ${faction.name}`,
    `> ${faction.motto}`,
    '',
    faction.description,
    '',
    `Territory: ${faction.territory}`,
    '',
  ].join('\n')).join('\n');

  const eras = lore.eras.map((era) => [
    `### ${era.name} (${era.years})`,
    '',
    era.summary,
    '',
  ].join('\n')).join('\n');

  const regions = lore.regions.map((region) => `- (${region.x}, ${region.y}) **${region.name}** — ${region.description}`).join('\n');

  return [
    `# ${lore.worldName}`,
    '',
    `*${lore.tagline}*`,
    '',
    'This world bible is a Generated/Creative document. It is not observed history.',
    '',
    '## History',
    '',
    lore.history,
    '',
    '## Mythology',
    '',
    lore.mythology,
    '',
    '## Ages',
    '',
    eras || '_No eras recorded._',
    '',
    '## Factions',
    '',
    factions || '_No factions recorded._',
    '',
    '## Landmark Regions',
    '',
    regions || '_No named regions._',
    '',
  ].join('\n');
}

export function downloadWorldBible(lore: WorldLore): void {
  const blob = new Blob([serializeWorldBible(lore)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${lore.worldName.replaceAll(/\s+/g, '-').toLowerCase() || 'world'}-bible.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}
