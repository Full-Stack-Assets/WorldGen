import type { WorldRecord } from '../../worldline/types';

export function PlanetaryStatePanel({ world }: { world: WorldRecord }) {
  const planetary = world.planetary;
  if (!planetary) return null;
  return (
    <section className="wl-planetary-state">
      <div className="wl-panel-kicker">PLANETARY STATE</div>
      <dl>
        <div><dt>Gravity</dt><dd>{planetary.gravityG} g</dd></div>
        {planetary.radiusKm && <div><dt>Radius</dt><dd>{planetary.radiusKm.toLocaleString()} km</dd></div>}
        {planetary.rotationPeriodHours && <div><dt>Rotation</dt><dd>{planetary.rotationPeriodHours} h</dd></div>}
        {planetary.orbitalPeriodDays && <div><dt>Orbit</dt><dd>{planetary.orbitalPeriodDays} d</dd></div>}
        <div><dt>Atmosphere</dt><dd>{planetary.atmosphere}</dd></div>
        {planetary.surfacePressure && <div><dt>Pressure</dt><dd>{planetary.surfacePressure}</dd></div>}
        <div><dt>Temperature</dt><dd>{planetary.temperature}</dd></div>
        <div><dt>Radiation</dt><dd>{planetary.radiation}</dd></div>
        <div><dt>Illumination</dt><dd>{planetary.illumination}</dd></div>
        <div><dt>Light-time</dt><dd>{planetary.lightTime}</dd></div>
        {planetary.referenceFrame && <div><dt>Reference frame</dt><dd>{planetary.referenceFrame}</dd></div>}
        <div><dt>World evidence</dt><dd>{world.epistemicClass}</dd></div>
        <div><dt>Rendered surface</dt><dd>{world.surfaceEpistemicClass ?? world.epistemicClass}</dd></div>
      </dl>
      <h3>Habitability Landscape</h3>
      <dl>{Object.entries(planetary.habitability).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
    </section>
  );
}
