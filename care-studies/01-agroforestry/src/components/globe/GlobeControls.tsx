import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface GlobeControlsProps {
  autoRotate: boolean;
  selectedRegionId: string | null;
  onClearSelection: () => void;
  reducedMotion: boolean;
}

export const GlobeControls: React.FC<GlobeControlsProps> = ({
  autoRotate,
  selectedRegionId,
  onClearSelection,
  reducedMotion
}) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);

  // Slow planetary auto-rotation on Y axis when no region is focused
  useFrame((_, delta) => {
    if (controlsRef.current && autoRotate && !selectedRegionId && !reducedMotion) {
      // Rotate planet
      const speed = 0.05; // rad per sec
      controlsRef.current.target.set(0, 0, 0);
      
      // We simulate rotation by rotating the camera around the target using controls
      controlsRef.current.azimuthAngle += speed * delta;
      controlsRef.current.update();
    }
  });

  // Keyboard navigation & accessibility handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClearSelection]);

  // Adjust OrbitControls constraints
  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      minDistance={3.5}
      maxDistance={7.0}
      enablePan={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.05}
      makeDefault
    />
  );
};
export default GlobeControls;
