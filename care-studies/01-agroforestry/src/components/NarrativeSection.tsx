import React from 'react';

export interface HotspotData {
  id: string;
  title: string;
  category: "Soil" | "Water" | "Microclimate" | "Biodiversity";
  stageRequirement: number;
  coordinates: [number, number, number]; // 3D position
  shortDescription: string;
  fullNarrative: string;
  impactMetric: string;
}

export const hotspots: HotspotData[] = [
  {
    id: "microbes",
    title: "Mycorrhizal Soil Networks",
    category: "Soil",
    stageRequirement: 0,
    coordinates: [0, 1.8, 0.8],
    shortDescription: "Tillage pulverizes underground fungal webs.",
    fullNarrative: "Industrial deep tilling breaks up the complex mycelial structures that bind soil. By transitioning to tree crops (agroforestry), deep perennial roots establish permanent soil sanctuaries, nurturing mycorrhizal fungi that trade nutrients for plant sugars, turning dusty dirt back into living, spongy humus.",
    impactMetric: "+450% Soil Microbial Biomass"
  },
  {
    id: "riparian",
    title: "Riparian POPLAR Buffers",
    category: "Water",
    stageRequirement: 2,
    coordinates: [-1.4, -0.6, 1.3],
    shortDescription: "Willow filter strips trapping fertilizer runoff.",
    fullNarrative: "Monoculture field margins dump excess nitrates and phosphorus into streams, feeding toxic algae. Riparian agroforests (willow, poplar, and dogwood buffers) capture 80%+ of this runoff. Their roots act as biological filters, stabilizing stream banks against floods and cooling the water for aquatic life.",
    impactMetric: "82% Reduction in Nitrate Runoff"
  },
  {
    id: "windbreak",
    title: "Contour Windbreaks",
    category: "Microclimate",
    stageRequirement: 1,
    coordinates: [1.3, 0.8, -1.2],
    shortDescription: "Oak & Pine rows stopping soil blow-away.",
    fullNarrative: "Open flat fields expose crops to high winds, accelerating evaporation and causing physical stress. Field-edge windbreaks slow wind velocity by up to 60%, creating a sheltered microclimate that traps humidity, reduces plant transpiration, and shields delicate flowers, boosting core yields.",
    impactMetric: "40% Wind Velocity Reduction"
  },
  {
    id: "animal",
    title: "Canopy Silvopasture",
    category: "Biodiversity",
    stageRequirement: 3,
    coordinates: [0.8, -1.2, -1.2],
    shortDescription: "Cattle rotational grazing under walnut shade.",
    fullNarrative: "Monoculture livestock feedlots are carbon-intensive and stressful for animals. Silvopasture integrates sheep or cattle beneath high-canopy walnut and oak trees. Trees shield animals from heat stress, grass thrives under partial shade, and animal manure fertilizes the trees, creating a closed-loop grazing sink.",
    impactMetric: "3.2x Higher Animal Comfort Index"
  }
];

interface NarrativeSectionProps {
  selectedHotspot: HotspotData | null;
  onCloseHotspot: () => void;
  activeStage: number;
}

export const NarrativeSection: React.FC<NarrativeSectionProps> = ({
  selectedHotspot,
  onCloseHotspot,
  activeStage
}) => {
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Soil": return "var(--stage-3-accent)";
      case "Water": return "var(--stage-2-accent)";
      case "Microclimate": return "var(--stage-1-accent)";
      default: return "#f472b6";
    }
  };

  return (
    <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      {selectedHotspot ? (
        <div className="glass-panel narrative-overlay-panel ui-element floating-icon" style={{ pointerEvents: 'auto' }}>
          <div className="narrative-title-row">
            <div>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${getCategoryColor(selectedHotspot.category)}`,
                color: getCategoryColor(selectedHotspot.category),
                padding: '2px 8px',
                borderRadius: '12px',
                display: 'inline-block',
                marginBottom: '6px'
              }}>
                {selectedHotspot.category} System
              </span>
              <h2 style={{ fontSize: '1.25rem', marginTop: '2px' }}>
                {selectedHotspot.title}
              </h2>
            </div>
            <button onClick={onCloseHotspot} aria-label="Close panel">×</button>
          </div>
          
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '12px 0 16px 0' }}>
            {selectedHotspot.fullNarrative}
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>METRIC IMPROVEMENT</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: getCategoryColor(selectedHotspot.category) }}>
              {selectedHotspot.impactMetric}
            </span>
          </div>

          {activeStage < selectedHotspot.stageRequirement && (
            <div style={{
              marginTop: '12px',
              fontSize: '0.72rem',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(251, 191, 36, 0.05)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '6px',
              padding: '8px'
            }}>
              ⚠️ Requires Stage {selectedHotspot.stageRequirement} to unlock full physical render on globe.
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel narrative-overlay-panel ui-element" style={{ pointerEvents: 'auto' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>
            She’s Unhappy.
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '12px' }}>
            Our soils are dying. Intensive monoculture cropping has stripped the carbon buffers, dried out water filters, and accelerated desertification.
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            <strong>Care Study 01: Agroforestry</strong> is an exploration of remediation. Hover or toggle the strategies to rebuild soil, trap water, capture carbon, and restore ecological joy.
          </p>
          
          <div style={{
            margin: '16px 0 8px 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '12px'
          }}>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Planetary Navigation Guide
            </h4>
            <ul style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li><strong>Rotate:</strong> Click & drag the planet globe.</li>
              <li><strong>Hotspots:</strong> Click glowing nodes to zoom in on narratives.</li>
              <li><strong>Phases:</strong> Toggle stages below to see restoration progress.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Campaign footer / Call to action */}
      <div className="glass-panel ui-element" style={{ pointerEvents: 'auto', padding: '16px 20px', maxWidth: '400px', marginBottom: '24px', alignSelf: 'flex-start' }}>
        <h3 style={{ fontSize: '0.95rem' }}>Restore The Canopy</h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.3' }}>
          Agroforestry can capture up to 34% of agricultural emissions if adopted globally. Help plant buffers.
        </p>
        <button 
          className="cta-button"
          onClick={() => window.open('https://www.unccd.int/', '_blank')}
        >
          Advocate For Agroforestry
        </button>
      </div>
    </div>
  );
};

export default NarrativeSection;
