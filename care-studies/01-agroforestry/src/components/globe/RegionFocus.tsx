import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { hubs, latLonToVector3 } from '../../data/agriculture/agriculturalData';

interface RegionFocusProps {
  selectedRegionId: string | null;
}

export const RegionFocus: React.FC<RegionFocusProps> = ({ selectedRegionId }) => {
  const { camera } = useThree();

  useEffect(() => {
    // Default Camera View: Africa/Europe/Asia Atlantic profile (Lat 12, Lon 15)
    const defaultCameraPos = latLonToVector3(12, 15, 4.8);

    const targetPos = selectedRegionId
      ? (() => {
          const hub = hubs.find((h) => h.id === selectedRegionId);
          return hub ? latLonToVector3(hub.lat, hub.lon, 4.8) : defaultCameraPos;
        })()
      : defaultCameraPos;

    // Transition Camera smoothly
    const duration = 1200; // ms
    const startTime = performance.now();
    const startPos = camera.position.clone();
    
    // Check if camera is already close to target to avoid redundant transitions
    if (startPos.distanceTo(targetPos) < 0.05) return;

    let animFrame: number;

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      
      // Smooth easeInOutCubic
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPos, targetPos, ease);
      camera.lookAt(0, 0, 0);

      if (progress < 1.0) {
        animFrame = requestAnimationFrame(animate);
      }
    };

    animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [selectedRegionId, camera]);

  return null;
};
export default RegionFocus;
