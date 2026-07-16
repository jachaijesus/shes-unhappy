import React from 'react';
import { transitionPhases, TransitionPhase } from '../../data/agriculture/agriculturalData';

interface TransitionPhasesProps {
  currentPhase: number;
  onSelectPhase: (phaseId: number) => void;
}

export const TransitionPhases: React.FC<TransitionPhasesProps> = ({
  currentPhase,
  onSelectPhase
}) => {
  // Simple Visual glyph SVG paths representing each stage
  const renderGlyph = (id: number) => {
    switch (id) {
      case 0: // Baseline: grain/field contours
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        );
      case 1: // Field boundaries: tree rows around margins
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
      case 2: // Water poplars: trees along curves
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12c4-4 8-4 12 0s8 4 12 0" />
            <circle cx="8" cy="8" r="2.5" fill="currentColor" />
            <circle cx="16" cy="16" r="2.5" fill="currentColor" />
          </svg>
        );
      case 3: // Silvopasture: animals + canopy
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="7" cy="7" r="4" />
            <circle cx="17" cy="17" r="3" />
            <line x1="12" y1="12" x2="12" y2="12.01" strokeWidth="4" />
          </svg>
        );
      case 4: // Deeply connected: network
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="2" fill="currentColor" />
            <circle cx="18" cy="6" r="2" fill="currentColor" />
            <circle cx="12" cy="18" r="2" fill="currentColor" />
            <line x1="6" y1="6" x2="12" y2="18" />
            <line x1="18" y1="6" x2="12" y2="18" />
            <line x1="6" y1="6" x2="18" y2="6" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getPhaseColor = (id: number) => {
    switch (id) {
      case 0: return "var(--stage-0-accent)";
      case 1: return "var(--stage-1-accent)";
      case 2: return "var(--stage-2-accent)";
      case 3: return "var(--stage-3-accent)";
      default: return "#a855f7"; // purple
    }
  };

  return (
    <div className="glass-panel ui-element" style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
        Agroforestry Transition Phases
      </h3>
      <div 
        role="radiogroup" 
        aria-label="Agroforestry Transition Phases"
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        {transitionPhases.map((phase: TransitionPhase) => {
          const isActive = currentPhase === phase.id;
          const color = getPhaseColor(phase.id);

          return (
            <button
              key={phase.id}
              role="radio"
              aria-checked={isActive}
              className={`strategy-item ${isActive ? 'active' : ''}`}
              style={{
                '--active-accent': color,
                '--accent-glow': isActive ? `rgba(255,255,255,0.02)` : 'transparent',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '14px',
                textAlign: 'left',
                padding: '12px 16px',
                outline: 'none'
              } as React.CSSProperties}
              onClick={() => onSelectPhase(phase.id)}
              tabIndex={0}
            >
              {/* Visual Glyph */}
              <div 
                style={{ 
                  color: isActive ? color : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '8px',
                  width: '36px',
                  height: '36px',
                  flexShrink: 0,
                  transition: 'all 0.3s'
                }}
              >
                {renderGlyph(phase.id)}
              </div>

              {/* Phase text summary */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: isActive ? color : 'var(--text-muted)' }}>
                    Phase {phase.id}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, opacity: isActive ? 0.8 : 0.3 }}>0{phase.id + 1}</span>
                </div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {phase.publicName}
                </h4>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>
                  {phase.oneSentence}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default TransitionPhases;
