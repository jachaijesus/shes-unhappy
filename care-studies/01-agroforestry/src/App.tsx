import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Planet } from './components/Planet';
import { StrategyControls } from './components/StrategyControls';
import { MetricDisplay } from './components/MetricDisplay';
import { NarrativeSection, HotspotData } from './components/NarrativeSection';
import { soundSystem } from './audio/SoundSystem';

export const App: React.FC = () => {
  const [stage, setStage] = useState<number>(0);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotData | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [audioInitialized, setAudioInitialized] = useState<boolean>(false);

  // Synchronize active stage with Sound Synth
  useEffect(() => {
    if (audioInitialized) {
      soundSystem.setStage(stage);
    }
  }, [stage, audioInitialized]);

  // Sync mute state on startup check
  useEffect(() => {
    setIsMuted(soundSystem.getMuteState());
  }, []);

  const handleStageSelect = (stageId: number) => {
    setStage(stageId);
    // Initialize audio on first interact
    if (!audioInitialized) {
      soundSystem.init();
      soundSystem.setStage(stageId);
      setAudioInitialized(true);
    }
  };

  const handleHotspotSelect = (hotspot: HotspotData) => {
    setSelectedHotspot(hotspot);
    if (!audioInitialized) {
      soundSystem.init();
      soundSystem.setStage(stage);
      setAudioInitialized(true);
    }
  };

  const toggleSound = () => {
    // Lazy initial system setup on user trigger
    if (!audioInitialized) {
      soundSystem.init();
      soundSystem.setStage(stage);
      setAudioInitialized(true);
    }
    const muted = soundSystem.toggleMute();
    setIsMuted(muted);
  };

  // Determine stage accent color to apply to index root
  const getStageAccentColor = () => {
    switch (stage) {
      case 0: return 'var(--stage-0-accent)';
      case 1: return 'var(--stage-1-accent)';
      case 2: return 'var(--stage-2-accent)';
      case 3: return 'var(--stage-3-accent)';
      default: return 'var(--stage-0-accent)';
    }
  };

  return (
    <div 
      className="app-container"
      style={{ 
        '--active-accent': getStageAccentColor(),
        '--accent-glow': `rgba(${
          stage === 0 ? '192, 132, 252' : stage === 1 ? '245, 158, 11' : stage === 2 ? '14, 165, 233' : '16, 185, 129'
        }, 0.2)`
      } as React.CSSProperties}
    >
      {/* 3D WebGL Canvas Layer */}
      <div className="canvas-container">
        <Canvas
          shadows
          camera={{ position: [0, 0, 4.8], fov: 60 }}
          style={{ background: 'transparent' }}
        >
          <Planet
            stage={stage}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={handleHotspotSelect}
          />
        </Canvas>
      </div>

      {/* HTML HUD Control Layer */}
      <div className="ui-container">
        
        {/* Header */}
        <header className="app-header glass-panel ui-element">
          <div>
            <h1 style={{ fontSize: '1.4rem', lineHeight: '1.2' }}>She’s Unhappy</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
              Care Study 01: Agroforestry Earth
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="campaign-tag">
              PSA Live Simulation
            </div>

            {/* Sound Synthesizer Controller */}
            <button 
              className={`sound-toggle ui-element ${isMuted ? 'muted' : ''}`}
              onClick={toggleSound}
              title={isMuted ? "Unmute Ambient Synthesizer" : "Mute Soundscape"}
              aria-label="Toggle Sound"
            >
              {isMuted ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Sidebar Controls & Gauges */}
        <aside className="sidebar">
          <StrategyControls
            currentStage={stage}
            onSelectStage={handleStageSelect}
          />
          <MetricDisplay stage={stage} />
        </aside>

        {/* Narrative Box (Center Overlay / Floating) */}
        <main className="main-overlay">
          <NarrativeSection
            selectedHotspot={selectedHotspot}
            onCloseHotspot={() => setSelectedHotspot(null)}
            activeStage={stage}
          />
        </main>

      </div>
    </div>
  );
};

export default App;
