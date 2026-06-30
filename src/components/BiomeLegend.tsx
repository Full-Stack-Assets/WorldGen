export function BiomeLegend() {
  const biomes = [
    { name: 'Ocean', color: '#143c78' },
    { name: 'Beach', color: '#d2c38c' },
    { name: 'Grassland', color: '#5a963c' },
    { name: 'Forest', color: '#22642d' },
    { name: 'Jungle', color: '#14501e' },
    { name: 'Desert', color: '#d2b478' },
    { name: 'Savanna', color: '#a09146' },
    { name: 'Mountain', color: '#787369' },
    { name: 'Snow', color: '#e6ebf5' },
    { name: 'Tundra', color: '#a0af96' },
    { name: 'Swamp', color: '#325037' },
    { name: 'Volcanic', color: '#3c2d28' },
    { name: 'River', color: '#2864a0' },
  ];

  return (
    <div className="biome-legend">
      {biomes.map((b) => (
        <div key={b.name} className="legend-item">
          <span className="legend-swatch" style={{ background: b.color }} />
          <span>{b.name}</span>
        </div>
      ))}
    </div>
  );
}
