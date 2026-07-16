import React from 'react';

interface Strategy {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  badge: string;
}

interface StrategyControlsProps {
  currentStage: number;
  onSelectStage: (stageId: number) => void;
}

export const StrategyControls: React.FC<StrategyControlsProps> = ({
  currentStage,
  onSelectStage
}) => {
  const strategies: Strategy[] = [
    {
      id: 0,
      badge: "Stage 0",
      title: "Industrial Monoculture",
      subtitle: "Baseline Farmland",
      description: "Intense deep tilling, high synthetic inputs, zero shade cover. Wind whips topsoil, leaving cracked clay. High erosion, low organic mass.",
      color: "var(--stage-0-accent)"
    },
    {
      id: 1,
      badge: "Stage 1",
      title: "Contour Strips & Windbreaks",
      subtitle: "Soil Preservation Initative",
      description: "Planting dense evergreen rows on field margins and contours. Breaks wind velocity, captures blowing topsoil, and establishes initial crop microclimates.",
      color: "var(--stage-1-accent)"
    },
    {
      id: 2,
      badge: "Stage 2",
      title: "Alley Cropping & Riparian Buffers",
      subtitle: "Hydrological Integration",
      description: "Alternating grain rows with rows of nut/fruit-bearing hardwoods. Planting thick willow/poplar filters near streams to absorb agricultural runoff and clear water channels.",
      color: "var(--stage-2-accent)"
    },
    {
      id: 3,
      badge: "Stage 3",
      title: "Silvopasture & Multi-strata Agroforest",
      subtitle: "Complete Ecosystem Mimicry",
      description: "Integrating rotational livestock grazing under high canopy walnut and oak trees. Dense multi-story vegetation creates rich organic matter, self-healing soils, and dynamic biodiversity.",
      color: "var(--stage-3-accent)"
    }
  ];

  return (
    <div className="glass-panel ui-element" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.1rem', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
        Agroforestry Transition Phases
      </h3>
      <div className="strategy-list">
        {strategies.map((strat) => {
          const isActive = currentStage === strat.id;
          return (
            <button
              key={strat.id}
              className={`strategy-item ${isActive ? 'active' : ''}`}
              style={{
                '--active-accent': strat.color,
                '--accent-glow': isActive ? `rgba(${strat.id === 0 ? '192, 132, 252' : strat.id === 1 ? '245, 158, 11' : strat.id === 2 ? '14, 165, 233' : '16, 185, 129'}, 0.2)` : 'transparent'
              } as React.CSSProperties}
              onClick={() => onSelectStage(strat.id)}
            >
              <div className="strategy-item-header">
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isActive ? strat.color : 'var(--text-muted)'
                }}>
                  {strat.badge}
                </span>
                <span className="strategy-number">0{strat.id + 1}</span>
              </div>
              <h4 style={{ fontSize: '0.9rem', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', transition: 'color 0.2s' }}>
                {strat.title}
              </h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.3' }}>
                {strat.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StrategyControls;
