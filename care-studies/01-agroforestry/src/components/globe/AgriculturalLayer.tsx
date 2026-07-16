import React, { useMemo } from 'react';
import * as THREE from 'three';
import { hubs, latLonToVector3 } from '../../data/agriculture/agriculturalData';

interface AgriculturalLayerProps {
  visible: boolean;
  selectedRegionId: string | null;
}

export const AgriculturalLayer: React.FC<AgriculturalLayerProps> = ({
  visible,
  selectedRegionId
}) => {
  // Generate ring geometry for boundary lines
  const ringGeo = useMemo(() => {
    const points = [];
    const segments = 32;
    const r = 0.35; // ring radius on globe surface
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  const boundaryRings = useMemo(() => {
    return hubs.map((hub) => {
      const pos = latLonToVector3(hub.lat, hub.lon, 2.01); // slightly above surface
      
      // Orient the ring to face outwards from the center of the globe
      const up = new THREE.Vector3(0, 0, 1);
      const dir = pos.clone().normalize();
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);

      let color = "rgba(217, 119, 6, 0.4)"; // Default Crop Gold
      if (hub.id === "south_america" || hub.id === "australia" || hub.id === "africa") {
        color = "rgba(16, 185, 129, 0.4)"; // Pasture Green
      } else if (hub.id === "south_asia") {
        color = "rgba(6, 182, 212, 0.4)"; // Water Cyan
      }

      return {
        id: hub.id,
        pos,
        quaternion,
        color
      };
    });
  }, []);

  if (!visible) return null;

  return (
    <group>
      {boundaryRings.map((ring) => {
        const isSelected = selectedRegionId === ring.id;
        return (
          <group key={ring.id} position={ring.pos} quaternion={ring.quaternion}>
            {/* Outer dotted/boundary ring representing agricultural landscape boundary */}
            <line geometry={ringGeo}>
              <lineBasicMaterial
                color={isSelected ? "rgb(0, 229, 255)" : ring.color}
                linewidth={1}
                transparent
                opacity={isSelected ? 0.9 : 0.45}
              />
            </line>
            
            {/* Soft inner glow disk */}
            <mesh>
              <ringGeometry args={[0, 0.35, 16]} />
              <meshBasicMaterial
                color={isSelected ? "rgb(0, 165, 233)" : ring.color}
                transparent
                opacity={isSelected ? 0.08 : 0.02}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
export default AgriculturalLayer;
