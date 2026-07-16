import * as THREE from 'three';

// Lat/Lon to Cartesian coordinates helper
export function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;

  const x = radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);

  return new THREE.Vector3(x, y, z);
}

// 1. Geography Source Metadata
export const GeographyMetadata = {
  title: "Natural Earth ne_110m_land",
  producingOrganization: "Natural Earth (public domain vector and raster map data)",
  sourceUrl: "http://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson",
  license: "Public Domain (CC0)",
  filesUsed: "ne_110m_land.json",
  modifications: "Parsed polygons, projected coordinates from [lon, lat] degrees to 3D Cartesian coordinates on sphere of R=2.0",
  projectionMethod: "Spherical Equirectangular to 3D Sphere conversion"
};

// 2. Agricultural Land Cover Metadata
export const AgricultureMetadata = {
  title: "FAO Global Land Cover & Copernicus Global Land Cover (simplified)",
  releaseYear: "2020",
  resolution: "100m (aggregated to regional polygons)",
  projection: "WGS84",
  classDefinitions: "Cropland (annual/perennial), Pasture/Grazing, Mixed Crop-Livestock, Irrigated Fields, Tree Crops",
  license: "Copernicus Open Access / CC-BY 4.0",
  limitations: "Broad farming regions are simplified for visual interpretation and do not show individual farms or exact land-use boundaries.",
  status: "Illustrative"
};

// 3. Representative Farming System Patterns
export interface FarmingPattern {
  name: string;
  farmingType: string;
  representativeBaseline: string;
  potentialPractice: string;
  contribution: string;
  limitation: string;
  source: string;
}

export const representativePatterns: Record<string, FarmingPattern> = {
  north_america: {
    name: "North American Corn Belt",
    farmingType: "Cropland (annual grains)",
    representativeBaseline: "Monoculture maize and soybeans, heavy machinery tilling, low organic matter residue.",
    potentialPractice: "Windbreaks and Alley Cropping (walnut or chestnut rows between grain corridors)",
    contribution: "Trees slow local wind erosion, build soil carbon stocks, and trap snow moisture during winters.",
    limitation: "Crop yield can decline adjacent to tree rows due to root competition and shade if spacing is too narrow.",
    source: "Illustrative (Reference: USDA National Agroforestry Center guidelines)"
  },
  south_america: {
    name: "South American Cerrado/Pampas",
    farmingType: "Grazing and pasture systems",
    representativeBaseline: "Open grassland pastures, high solar heat exposure, livestock soil compaction.",
    potentialPractice: "Silvopasture (integrating native legumes and shading trees)",
    contribution: "Provides thermal cover for cattle, increases animal comfort, and adds organic leaf fodder.",
    limitation: "Requires rotational grazing management to prevent young tree seedling damage by livestock.",
    source: "Illustrative (Reference: EMBRAPA Brazilian Agricultural Research Corporation guidelines)"
  },
  europe: {
    name: "Central European Plain",
    farmingType: "Mixed crop–livestock systems",
    representativeBaseline: "Alternating grain fields and small dairy holdings, moderate soil runoff.",
    potentialPractice: "Riparian Buffers and Alley Cropping",
    contribution: "Poplar/willow zones filter chemical runoff from waterways; leaf litter builds humus.",
    limitation: "Reduces net crop acreage; requires localized labor for tree pruning and establishment.",
    source: "Illustrative (Reference: EURAF European Agroforestry Federation studies)"
  },
  east_asia: {
    name: "East Asian River Basins",
    farmingType: "Irrigated production regions & crops",
    representativeBaseline: "Rice paddies and intensive vegetable irrigation, heavy nitrogen inputs.",
    potentialPractice: "Riparian buffer zones and wetland forest edges",
    contribution: "Woody root systems stabilize paddy bunds, reduce nitrogen leaching, and shelter beneficial predatory insects.",
    limitation: "Roots may block irrigation channels if not carefully maintained and cleared periodically.",
    source: "Illustrative (Reference: FAO Sustainable Rice Platform research)"
  },
  south_asia: {
    name: "Ganges River Plain",
    farmingType: "Mixed smallholder cropping",
    representativeBaseline: "Fragmented smallholder farming, heavy groundwater depletion, extreme heat stress.",
    potentialPractice: "Multistrata food forests and boundary planting",
    contribution: "Provides microclimate cooling, multi-layered fuel/food crop security, and soil organic mass.",
    limitation: "High labor demand for multi-layered weeding, harvesting, and complex watering regimes.",
    source: "Illustrative (Reference: ICAR Indian Council of Agricultural Research systems)"
  },
  africa: {
    name: "Sub-Saharan Highlands",
    farmingType: "Mixed farming mosaics & grazing",
    representativeBaseline: "Subsistence maize plots, steep hill erosion, fuel wood scarcity.",
    potentialPractice: "Contour hedges and nitrogen-fixing tree crops (e.g., Acacia, Gliricidia)",
    contribution: "Drastically reduces hillslope erosion, improves soil nitrogen levels naturally, and provides local fuel wood.",
    limitation: "Takes 3 to 5 years for trees to provide measurable soil fertility benefits.",
    source: "Illustrative (Reference: ICRAF World Agroforestry Centre regional guidelines)"
  },
  australia: {
    name: "Australian Wheat-Sheep Belt",
    farmingType: "Mixed wheat–livestock systems",
    representativeBaseline: "Large dryland wheat fields, soil salinity, dry wind stripping.",
    potentialPractice: "Wide shelterbelts and paddock shade clusters",
    contribution: "Lowers groundwater tables to suppress salt rising, and reduces wind evaporation rates.",
    limitation: "Compromises movement of wide farming implements; competition for scarce dryland water.",
    source: "Illustrative (Reference: Australian Agroforestry Association guidelines)"
  }
};

// 4. Neurographical Nodes structure
export interface NeuroNode {
  id: string;
  label: string;
  scale: 'primary' | 'secondary' | 'tertiary' | 'micro';
  lat: number;
  lon: number;
  regionId: string;
  category?: 'Crops' | 'Livestock' | 'Trees' | 'Water' | 'Soil' | 'Ecology' | 'Economy';
}

export interface NeuroConnection {
  from: string;
  to: string;
  type: 'ecological' | 'landscape' | 'global' | 'knowledge';
  phaseUnlocked: number; // Unlocked at Phase 0, 1, 2, 3, 4
}

// Generate Nodes and Connections
export const hubs = [
  { id: "north_america", label: "N. American Corn Belt", lat: 39, lon: -95 },
  { id: "south_america", label: "S. American Cerrado", lat: -16, lon: -48 },
  { id: "europe", label: "Central European Plain", lat: 50, lon: 15 },
  { id: "east_asia", label: "Yangtze River Basin", lat: 30, lon: 115 },
  { id: "south_asia", label: "Ganges River Plain", lat: 26, lon: 82 },
  { id: "africa", label: "Sub-Saharan Highlands", lat: -2, lon: 34 },
  { id: "australia", label: "Wheat-Sheep Belt", lat: -32, lon: 138 }
];

export const nodes: NeuroNode[] = [];
export const connections: NeuroConnection[] = [];

// Populate Nodes procedurally to keep code clean and structured
hubs.forEach((hub) => {
  // 1. Primary Hub
  nodes.push({
    id: hub.id,
    label: hub.label,
    scale: 'primary',
    lat: hub.lat,
    lon: hub.lon,
    regionId: hub.id
  });

  // 2. Secondary Nodes (Crops, Livestock, Trees, Water, Soil) clustered tightly around primary hub
  const secondaries = [
    { id: `${hub.id}_crops`, label: "Crops", cat: 'Crops', latOffset: 3, lonOffset: -4 },
    { id: `${hub.id}_livestock`, label: "Livestock", cat: 'Livestock', latOffset: -3, lonOffset: 4 },
    { id: `${hub.id}_trees`, label: "Trees", cat: 'Trees', latOffset: 4, lonOffset: 2 },
    { id: `${hub.id}_water`, label: "Water System", cat: 'Water', latOffset: -4, lonOffset: -3 },
    { id: `${hub.id}_soil`, label: "Soil hum", cat: 'Soil', latOffset: 0, lonOffset: 5 }
  ] as const;

  secondaries.forEach((s) => {
    nodes.push({
      id: s.id,
      label: s.label,
      scale: 'secondary',
      lat: hub.lat + s.latOffset,
      lon: hub.lon + s.lonOffset,
      regionId: hub.id,
      category: s.cat
    });

    // Connection from Primary to Secondary (ecological and landscape connections, unlocked at Phase 0)
    connections.push({
      from: hub.id,
      to: s.id,
      type: 'landscape',
      phaseUnlocked: 0
    });
  });

  // 3. Tertiary Nodes (Shade, Erosion, Habitat, Labor, Markets)
  const tertiaries = [
    { id: `${hub.id}_shade`, label: "Canopy Shade", parent: `${hub.id}_trees`, latOffset: 7, lonOffset: 4, phase: 1 },
    { id: `${hub.id}_erosion`, label: "Erosion Control", parent: `${hub.id}_soil`, latOffset: 2, lonOffset: 9, phase: 1 },
    { id: `${hub.id}_habitat`, label: "Habitat Corridors", parent: `${hub.id}_trees`, latOffset: 8, lonOffset: -3, phase: 2 },
    { id: `${hub.id}_water_mgt`, label: "Water Filtering", parent: `${hub.id}_water`, latOffset: -7, lonOffset: -7, phase: 2 },
    { id: `${hub.id}_labor`, label: "Knowledge & Labor", parent: hub.id, latOffset: -6, lonOffset: 8, phase: 0 },
    { id: `${hub.id}_markets`, label: "Food Markets", parent: hub.id, latOffset: 6, lonOffset: -9, phase: 0 }
  ];

  tertiaries.forEach((t) => {
    nodes.push({
      id: t.id,
      label: t.label,
      scale: 'tertiary',
      lat: hub.lat + t.latOffset,
      lon: hub.lon + t.lonOffset,
      regionId: hub.id
    });

    // Connection to parent node
    connections.push({
      from: t.parent,
      to: t.id,
      type: t.id.includes('labor') || t.id.includes('market') ? 'knowledge' : 'ecological',
      phaseUnlocked: t.phase
    });
  });

  // 4. Micro Nodes (Field lines, Tree roots)
  const micros = [
    { id: `${hub.id}_root`, label: "Root mesh", parent: `${hub.id}_soil`, latOffset: 1, lonOffset: 7, phase: 3 },
    { id: `${hub.id}_buffer`, label: "Riparian buffer", parent: `${hub.id}_water`, latOffset: -5, lonOffset: -5, phase: 2 },
    { id: `${hub.id}_shelter`, label: "Shelterbelt", parent: `${hub.id}_crops`, latOffset: 5, lonOffset: -6, phase: 1 }
  ];

  micros.forEach((m) => {
    nodes.push({
      id: m.id,
      label: m.label,
      scale: 'micro',
      lat: hub.lat + m.latOffset,
      lon: hub.lon + m.lonOffset,
      regionId: hub.id
    });

    connections.push({
      from: m.parent,
      to: m.id,
      type: 'ecological',
      phaseUnlocked: m.phase
    });
  });

  // Intra-hub connections (Ecological relations within the region)
  // Crops - Soil (Erosion, Water)
  connections.push({
    from: `${hub.id}_crops`,
    to: `${hub.id}_soil`,
    type: 'ecological',
    phaseUnlocked: 0
  });
  connections.push({
    from: `${hub.id}_water`,
    to: `${hub.id}_soil`,
    type: 'ecological',
    phaseUnlocked: 0
  });

  // Trees -> Soil (unlocked in Phase 1 as windbreaks build organic matter)
  connections.push({
    from: `${hub.id}_trees`,
    to: `${hub.id}_soil`,
    type: 'ecological',
    phaseUnlocked: 1
  });
  // Trees -> Water (unlocked in Phase 2 as buffers hold water)
  connections.push({
    from: `${hub.id}_trees`,
    to: `${hub.id}_water`,
    type: 'ecological',
    phaseUnlocked: 2
  });
  // Trees -> Livestock (unlocked in Phase 3 as silvopasture shade benefits appear)
  connections.push({
    from: `${hub.id}_trees`,
    to: `${hub.id}_livestock`,
    type: 'ecological',
    phaseUnlocked: 3
  });
});

// 5. Global Food Economy illustrative connections (unlocked at Phase 0, low-intensity trade arcs)
const globalArcs = [
  { from: "north_america", to: "europe" },
  { from: "south_america", to: "europe" },
  { from: "north_america", to: "east_asia" },
  { from: "australia", to: "east_asia" },
  { from: "europe", to: "south_asia" },
  { from: "africa", to: "europe" }
];

globalArcs.forEach((g, idx) => {
  connections.push({
    from: `${g.from}_crops`,
    to: `${g.to}_markets`,
    type: 'global',
    phaseUnlocked: 0
  });
});

// 6. Transition Phase Control Metadata
export interface TransitionPhase {
  id: number;
  publicName: string;
  oneSentence: string;
  description: string;
}

export const transitionPhases: TransitionPhase[] = [
  {
    id: 0,
    publicName: "Existing Farming Landscapes",
    oneSentence: "A simplified view of varied farming landscapes with uneven tree integration.",
    description: "Phase 0 shows cropland grids, dry pastures, and heavily extracted water courses with severed ecosystems and low tree canopy cover."
  },
  {
    id: 1,
    publicName: "Windbreaks and Field Boundaries",
    oneSentence: "Shelterbelts and tree rows planted on field contours and margins.",
    description: "Phase 1 installs edge rows that shield annual grains from wind speed, capture eroding soil particles, and add local moisture buffers."
  },
  {
    id: 2,
    publicName: "Alley Cropping and Water Buffers",
    oneSentence: "Integrated tree-crop strips and willow buffers along watersheds.",
    description: "Phase 2 blends poplars/willows next to agricultural runoff streams and alternates rows of wheat/corn with hazelnut or walnut hardwood rows."
  },
  {
    id: 3,
    publicName: "Silvopasture and Layered Systems",
    oneSentence: "Livestock grazing beneath protective canopy shade clusters.",
    description: "Phase 3 brings cows, sheep, and fodder trees together, reducing animal heat stress and creating organic nutrient recycling systems."
  },
  {
    id: 4,
    publicName: "Locally Adapted Agroforestry Networks",
    oneSentence: "Mature regional agricultural clusters with high ecological connectivity.",
    description: "Phase 4 reaches mature landscape recovery with combined tree-crop-water mosaics, recognizing regional limits and food market demands."
  }
];
