# New Bedford scenario package sources

The machine-readable source registry is `manifest.json`. It records publisher, source URL, retrieval date, validity time, spatial reference, license note, checksum status, coverage, epistemic class, and transformation chain.

The local `geometry.geojson` contains one derived coverage polygon in EPSG:4326. It does not contain parcels, owners, addresses, assessed values, imagery, or a claim that the rectangular coverage extent is a city boundary. `scenario-lab.json` defines a decision-support scenario boundary and keeps source time separate from simulation time.

Cartographic contract: use the coverage polygon only as a qualitative extent overlay with a categorical/reconstructed legend. Do not encode raw counts or rates as a choropleth. NoData must remain visually distinct from zero. At city scale, Web Mercator is acceptable for an interactive basemap; the source geometry remains stored in EPSG:4326.

Validation command: `npm run validate:new-bedford`.
