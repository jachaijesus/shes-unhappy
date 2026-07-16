import React from 'react';
import { hubs, transitionPhases } from '../../data/agriculture/agriculturalData';

interface GlobeFallbackProps {
  phase: number;
  selectedRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
  onClearSelection: () => void;
}

export const GlobeFallback: React.FC<GlobeFallbackProps> = ({
  phase,
  selectedRegionId,
  onSelectRegion,
  onClearSelection
}) => {
  // SVG points for simplified world continents (2D visual guides)
  const continents = [
    { name: "North America", points: "20,25 45,20 60,35 40,55 25,50" },
    { name: "South America", points: "35,60 50,65 42,95 32,75" },
    { name: "Eurasia", points: "55,20 85,25 95,50 70,60 58,35" },
    { name: "Africa", points: "52,48 68,52 64,80 50,68" },
    { name: "Australia", points: "80,72 92,75 88,90 78,82" }
  ];

  // Map 3D hubs to 2D coordinates on our 100x100 grid fallback map
  const hubs2D = [
    { id: "north_america", label: "N. American Corn Belt", x: 38, y: 38 },
    { id: "south_america", label: "S. American Cerrado", x: 42, y: 72 },
    { id: "europe", label: "Central European Plain", x: 60, y: 35 },
    { id: "east_asia", label: "Yangtze River Basin", x: 80, y: 48 },
    { id: "south_asia", label: "Ganges River Plain", x: 74, y: 52 },
    { id: "africa", label: "Sub-Saharan Highlands", x: 60, y: 62 },
    { id: "australia", label: "Wheat-Sheep Belt", x: 85, y: 80 }
  ];

  const activePhaseName = transitionPhases[phase]?.publicName || "";

  return (
    <div 
      className="glass-panel" 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '20px', 
        background: '#090d16',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
    >
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>2D Agricultural Atlas (Fallback Mode)</h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          WebGL is currently unavailable. Displaying the 2D geographical layout.
        </p>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: '300px', background: '#05070a', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display: 'block' }}>
          {/* Grid lines overlay */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />

          {/* Draw simplified continents */}
          {continents.map((c) => (
            <polygon
              key={c.name}
              points={c.points}
              fill="rgba(31, 41, 55, 0.4)"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
          ))}

          {/* Hub connection curves (illustrative) */}
          {phase >= 1 && (
            <path
              d="M 38 38 Q 49 48 60 35"
              fill="none"
              stroke="rgba(16, 185, 129, 0.25)"
              strokeWidth="0.8"
            />
          )}
          {phase >= 2 && (
            <path
              d="M 60 35 Q 67 48 74 52"
              fill="none"
              stroke="rgba(6, 182, 212, 0.25)"
              strokeWidth="0.8"
            />
          )}

          {/* Interactive hub button overlays */}
          {hubs2D.map((hub) => {
            const isSelected = selectedRegionId === hub.id;
            // Phase-based color shifts: grey/yellow (Phase 0) to bright teal/green (Phase 4)
            let color = "rgb(251, 191, 36)";
            if (phase >= 3) {
              color = "rgb(16, 185, 129)"; // emerald
            }

            return (
              <g key={hub.id}>
                {/* Visual Circle indicator */}
                <circle
                  cx={hub.x}
                  cy={hub.y}
                  r={isSelected ? 4 : 2.5}
                  fill={isSelected ? "rgb(0, 229, 255)" : color}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth="0.5"
                  style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                  onClick={() => onSelectRegion(hub.id)}
                />
                
                {/* Concentric rings on focus */}
                {isSelected && (
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={6.5}
                    fill="none"
                    stroke="rgba(0, 229, 255, 0.3)"
                    strokeWidth="0.5"
                  />
                )}
                
                {/* Label text */}
                <text
                  x={hub.x}
                  y={hub.y - (isSelected ? 6 : 4)}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="2"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {hub.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Active Phase: <strong>{activePhaseName}</strong>
        </span>
        {selectedRegionId && (
          <button
            onClick={onClearSelection}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#f3f4f6',
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '0.68rem',
              cursor: 'pointer'
            }}
          >
            Clear Focus
          </button>
        )}
      </div>
    </div>
  );
};
export default GlobeFallback;
