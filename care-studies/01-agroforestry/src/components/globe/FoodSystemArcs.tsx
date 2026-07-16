import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { nodes, connections, latLonToVector3 } from '../../data/agriculture/agriculturalData';

interface FoodSystemArcsProps {
  visible: boolean;
}

export const FoodSystemArcs: React.FC<FoodSystemArcsProps> = ({ visible }) => {
  // 1. Generate curves from connections data
  const tradeArcs = useMemo(() => {
    return connections
      .filter((conn) => conn.type === 'global')
      .map((conn, idx) => {
        const fromNode = nodes.find((n) => n.id === conn.from);
        const toNode = nodes.find((n) => n.id === conn.to);
        if (!fromNode || !toNode) return null;

        const p0 = latLonToVector3(fromNode.lat, fromNode.lon, 2.01);
        const p2 = latLonToVector3(toNode.lat, toNode.lon, 2.01);

        const distance = p0.distanceTo(p2);
        const midpoint = new THREE.Vector3().addVectors(p0, p2).multiplyScalar(0.5);
        const normal = midpoint.clone().normalize();
        
        // Elevate global trade arcs higher (up to R=2.4) to clear the surface
        const elevation = 2.01 + distance * 0.22;
        const p1 = normal.multiplyScalar(elevation);

        const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
        // Create 20 subdivisions
        const points = curve.getPoints(20);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return {
          id: `global_${idx}`,
          geometry,
          curve
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, []);

  // 2. Animate small pulse dots moving along the arcs
  const pulseGroupRef = useRef<THREE.Group | null>(null);

  useFrame(({ clock }) => {
    if (pulseGroupRef.current && visible) {
      const t = (clock.getElapsedTime() * 0.25) % 1.0; // cycle over 4 seconds
      const children = pulseGroupRef.current.children;
      
      tradeArcs.forEach((arc, idx) => {
        const mesh = children[idx] as THREE.Mesh;
        if (mesh) {
          // Compute position along the curve
          const point = arc.curve.getPointAt(t);
          mesh.position.copy(point);
        }
      });
    }
  });

  if (!visible) return null;

  return (
    <group>
      {/* Static Arcs */}
      {tradeArcs.map((arc) => (
        <line key={arc.id} geometry={arc.geometry}>
          <lineBasicMaterial
            color="rgba(255, 255, 255, 0.25)"
            linewidth={1}
            transparent
            depthWrite={false}
          />
        </line>
      ))}

      {/* Moving pulse nodes */}
      <group ref={pulseGroupRef}>
        {tradeArcs.map((arc) => (
          <mesh key={`pulse_${arc.id}`}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshBasicMaterial
              color="#ffffff"
              toneMapped={false}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};
export default FoodSystemArcs;
