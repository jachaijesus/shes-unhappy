import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import EarthSurface from './EarthSurface';
import AgriculturalLayer from './AgriculturalLayer';
import NeurographLayer from './NeurographLayer';
import FoodSystemArcs from './FoodSystemArcs';
import RegionFocus from './RegionFocus';
import GlobeControls from './GlobeControls';
import GlobeFallback from './GlobeFallback';
import { latLonToVector3, hubs } from '../../data/agriculture/agriculturalData';

interface AgriculturalNeurographProps {
  phase: number; // 0 to 4
  selectedRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
  onClearSelection: () => void;
  autoRotate: boolean;
  reducedMotion: boolean;
}

export const AgriculturalNeurograph: React.FC<AgriculturalNeurographProps> = ({
  phase,
  selectedRegionId,
  onSelectRegion,
  onClearSelection,
  autoRotate,
  reducedMotion
}) => {
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);

  // Layer toggles states (all enabled by default in educational view)
  const [showLandscapes, setShowLandscapes] = useState<boolean>(true);
  const [showPractices, setShowPractices] = useState<boolean>(true);
  const [showArcs, setShowArcs] = useState<boolean>(true);

  // Detect WebGL context on mount
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setWebGLSupported(support);
    } catch (e) {
      setWebGLSupported(false);
    }
  }, []);

  // Map phase 0-4 to adoption 0.0-1.0
  const adoption = useMemo(() => phase / 4.0, [phase]);

  // Map focused region ID to coordinate
  const focusedCoords = useMemo(() => {
    if (!selectedRegionId) return null;
    const hub = hubs.find((h) => h.id === selectedRegionId);
    return hub ? latLonToVector3(hub.lat, hub.lon, 2.01) : null;
  }, [selectedRegionId]);

  if (!webGLSupported) {
    return (
      <GlobeFallback
        phase={phase}
        selectedRegionId={selectedRegionId}
        onSelectRegion={onSelectRegion}
        onClearSelection={onClearSelection}
      />
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      
      {/* Three.js Canvas Layer */}
      <Canvas
        shadows
        camera={{ position: [0, 0, 4.8], fov: 60 }}
        style={{ background: 'transparent', outline: 'none' }}
        tabIndex={0}
        aria-label="3D Interactive Agricultural Neurograph Globe"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.8} castShadow />
        <directionalLight position={[-10, -5, -10]} intensity={0.4} />

        {/* 1. Base Earth Surface (GeoJSON texture mask + coordinate lines) */}
        <EarthSurface
          adoption={adoption}
          selectedHotspot={focusedCoords}
          hotspotActive={selectedRegionId ? 1.0 : 0.0}
        />

        {/* 2. Agricultural Landscape Layer outlines */}
        <AgriculturalLayer
          visible={showLandscapes}
          selectedRegionId={selectedRegionId}
        />

        {/* 3. Neurograph Nodes & Relationships (unlocked dynamically by phase) */}
        <NeurographLayer
          visible={showPractices}
          phase={phase}
          selectedRegionId={selectedRegionId}
          onSelectRegion={onSelectRegion}
        />

        {/* 4. Global Food-System Arcs */}
        <FoodSystemArcs visible={showArcs} />

        {/* 5. Camera track transition */}
        <RegionFocus selectedRegionId={selectedRegionId} />

        {/* 6. Orbit rotation controls */}
        <GlobeControls
          autoRotate={autoRotate}
          selectedRegionId={selectedRegionId}
          onClearSelection={onClearSelection}
          reducedMotion={reducedMotion}
        />
      </Canvas>

      {/* Floating Layer Toggle HUD Controls */}
      <div 
        className="glass-panel ui-element" 
        style={{ 
          position: 'absolute', 
          bottom: '20px', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          display: 'flex', 
          gap: '12px', 
          padding: '8px 16px',
          borderRadius: '24px',
          zIndex: 5,
          border: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontWeight: 600, color: '#e2e8f0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showLandscapes}
            onChange={(e) => setShowLandscapes(e.target.checked)}
            style={{ accentColor: 'var(--stage-1-accent)' }}
          />
          Landscapes
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontWeight: 600, color: '#e2e8f0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showPractices}
            onChange={(e) => setShowPractices(e.target.checked)}
            style={{ accentColor: 'var(--stage-3-accent)' }}
          />
          Agroforestry
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', fontWeight: 600, color: '#e2e8f0', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showArcs}
            onChange={(e) => setShowArcs(e.target.checked)}
            style={{ accentColor: '#ffffff' }}
          />
          Global Trade
        </label>
      </div>

      {/* Clear focus floating button */}
      {selectedRegionId && (
        <button
          className="ui-element"
          onClick={onClearSelection}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(9, 13, 22, 0.85)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#f3f4f6',
            padding: '6px 12px',
            borderRadius: '6px',
            fontFamily: 'var(--font-display)',
            fontSize: '0.7rem',
            fontWeight: 700,
            cursor: 'pointer',
            zIndex: 5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
        >
          Return to Global View
        </button>
      )}
    </div>
  );
};
export default AgriculturalNeurograph;
