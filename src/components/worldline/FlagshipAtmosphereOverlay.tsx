import type { TimeMode } from '../../worldline/types';

export function FlagshipAtmosphereOverlay({
  selectedYear,
  timeMode,
}: {
  selectedYear: number;
  timeMode: TimeMode;
}) {
  const temporalLayers =
    timeMode === 'PARALLAX'
      ? [
          Math.max(2023, selectedYear - 3),
          selectedYear,
          Math.min(2046, selectedYear + 5),
        ]
      : [];

  return (
    <>
      <div className="wl-open-earth-clouds" aria-hidden="true" />
      <div className="wl-open-earth-grain" aria-hidden="true" />
      {temporalLayers.length > 0 && (
        <div
          className="wl-earth-parallax"
          aria-label="New Bedford Temporal Parallax layers"
        >
          {temporalLayers.map((year, index) => (
            <div
              key={`${year}-${index}`}
              className={`wl-earth-time-plane plane-${index}`}
            >
              <span>{year}</span>
              <small>
                {year <= 2023
                  ? 'OBSERVATION'
                  : year <= 2025
                    ? 'NEAREST OBSERVATION'
                    : year === 2026
                      ? 'RECONSTRUCTION'
                      : 'SCENARIO'}
              </small>
            </div>
          ))}
        </div>
      )}
      <div className="wl-open-earth-caption">
        SATELLITE EARTH · OpenFreeMap / OpenStreetMap · EOX Sentinel-2 · visual
        concept future layer
      </div>
    </>
  );
}
