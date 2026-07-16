import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { nodes, connections, latLonToVector3, NeuroNode, NeuroConnection } from '../../data/agriculture/agriculturalData';

interface NeurographLayerProps {
  visible: boolean;
  phase: number; // 0 to 4
  selectedRegionId: string | null;
  onSelectRegion: (regionId: string) => void;
}

export const NeurographLayer: React.FC<NeurographLayerProps> = ({
  visible,
  phase,
  selectedRegionId,
  onSelectRegion
}) => {
  // 1. Filter nodes based on active transition phase
  const visibleNodes = useMemo(() => {
    return nodes.filter((node) => {
      // Primary and secondary nodes are always visible
      if (node.scale === 'primary' || node.scale === 'secondary') return true;
      
      // Tertiary/micro nodes appear depending on phase
      // Map node details to their parent/phase requirements
      if (node.id.includes('shade') || node.id.includes('erosion') || node.id.includes('shelter')) {
        return phase >= 1;
      }
      if (node.id.includes('habitat') || node.id.includes('water_mgt') || node.id.includes('buffer')) {
        return phase >= 2;
      }
      if (node.id.includes('root') || node.id.includes('livestock')) {
        return phase >= 3;
      }
      return true; // default
    });
  }, [phase]);

  // 2. Generate curve geometries for connections
  const lineConnections = useMemo(() => {
    return connections
      .filter((conn) => {
        // Skip global connections (drawn in separate FoodSystemArcs component)
        if (conn.type === 'global') return false;
        // Verify phase unlocks
        return phase >= conn.phaseUnlocked;
      })
      .map((conn, idx) => {
        const fromNode = nodes.find((n) => n.id === conn.from);
        const toNode = nodes.find((n) => n.id === conn.to);
        if (!fromNode || !toNode) return null;

        const p0 = latLonToVector3(fromNode.lat, fromNode.lon, 2.01);
        const p2 = latLonToVector3(toNode.lat, toNode.lon, 2.01);
        
        // Midpoint control point for Bezier arc curve (elevate based on distance)
        const distance = p0.distanceTo(p2);
        const midpoint = new THREE.Vector3().addVectors(p0, p2).multiplyScalar(0.5);
        // Inflate midpoint outward from center
        const normal = midpoint.clone().normalize();
        const elevation = 2.01 + distance * 0.12;
        const p1 = normal.multiplyScalar(elevation);

        const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
        const points = curve.getPoints(12);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        let color = "rgba(156, 163, 175, 0.25)"; // default grey
        let lineStyle: 'solid' | 'dashed' = 'solid';

        if (conn.type === 'ecological') {
          color = "rgba(16, 185, 129, 0.4)"; // emerald green
        } else if (conn.type === 'landscape') {
          color = "rgba(6, 182, 212, 0.4)"; // cyan water
        } else if (conn.type === 'knowledge') {
          color = "rgba(244, 63, 94, 0.4)"; // coral pink
          lineStyle = 'dashed';
        }

        return {
          id: `${conn.from}_${conn.to}_${idx}`,
          geometry,
          color,
          lineStyle
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [phase]);

  // 3. Concentric ring geometry for Primary Hubs
  const ringGeo = useMemo(() => {
    const points = [];
    const segments = 32;
    const r = 0.12;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  // Soft node pulses using useFrame
  const ringRef = useRef<THREE.Group | null>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) {
      const scale = 1.0 + Math.sin(clock.getElapsedTime() * 3.5) * 0.12;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  if (!visible) return null;

  return (
    <group>
      {/* Draw Connection Lines */}
      {lineConnections.map((conn) => {
        if (conn.lineStyle === 'dashed') {
          // Render dashed line
          return (
            <line key={conn.id} geometry={conn.geometry}>
              <lineBasicMaterial
                color={conn.color}
                transparent
                opacity={0.5}
                depthWrite={false}
              />
            </line>
          );
        }
        return (
          <line key={conn.id} geometry={conn.geometry}>
            <lineBasicMaterial
              color={conn.color}
              transparent
              opacity={0.65}
              depthWrite={false}
            />
          </line>
        );
      })}

      {/* Draw Nodes */}
      {visibleNodes.map((node) => {
        const pos = latLonToVector3(node.lat, node.lon, 2.02); // place nodes slightly above connections
        const isPrimary = node.scale === 'primary';
        const isSecondary = node.scale === 'secondary';
        const isSelected = selectedRegionId === node.regionId;

        // Node Styling variables
        let nodeSize = 0.02;
        let nodeColor = "#ffffff";
        
        if (isPrimary) {
          nodeSize = 0.045;
          nodeColor = isSelected ? "rgb(0, 229, 255)" : "rgb(251, 191, 36)"; // Golden-yellow / active cyan
        } else if (isSecondary) {
          nodeSize = 0.025;
          nodeColor = node.category === 'Trees' ? "#10b981" 
                    : node.category === 'Water' ? "#0ea5e9"
                    : node.category === 'Soil' ? "#d97706"
                    : "#ffffff";
        } else if (node.scale === 'tertiary') {
          nodeSize = 0.015;
          nodeColor = "rgb(244, 63, 94)"; // Coral pink
        } else {
          nodeSize = 0.01;
          nodeColor = "rgb(226, 232, 240)"; // White-gray
        }

        // Concentric ring orientation for Primary Hubs
        const up = new THREE.Vector3(0, 0, 1);
        const dir = pos.clone().normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);

        return (
          <group key={node.id} position={pos}>
            {/* 3D mesh marker */}
            <mesh onClick={() => isPrimary && onSelectRegion(node.regionId)}>
              <sphereGeometry args={[nodeSize, 12, 12]} />
              <meshBasicMaterial
                color={nodeColor}
                toneMapped={false}
                depthWrite={false}
              />
            </mesh>

            {/* Concentric rings for Primary Hubs */}
            {isPrimary && (
              <group quaternion={quaternion} ref={isSelected ? ringRef : undefined}>
                <line geometry={ringGeo}>
                  <lineBasicMaterial
                    color={isSelected ? "rgb(0, 229, 255)" : "rgba(251, 191, 36, 0.4)"}
                    transparent
                    opacity={0.8}
                    depthWrite={false}
                  />
                </line>
                <line geometry={ringGeo} scale={[1.5, 1.5, 1.5]}>
                  <lineBasicMaterial
                    color={isSelected ? "rgba(0, 229, 255, 0.3)" : "rgba(251, 191, 36, 0.2)"}
                    transparent
                    opacity={0.5}
                    depthWrite={false}
                  />
                </line>
              </group>
            )}

            {/* Interactive HTML Tag for Primary Hubs */}
            {isPrimary && (
              <Html distanceFactor={5} style={{ pointerEvents: 'none' }}>
                <button
                  style={{
                    background: 'rgba(9, 13, 22, 0.88)',
                    border: isSelected ? '1.5px solid #0ea5e9' : '1px solid rgba(255,255,255,0.12)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    color: isSelected ? '#38bdf8' : '#e2e8f0',
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    transform: 'translate(-50%, -170%)',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 0 12px rgba(14,165,233,0.3)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    outline: 'none'
                  }}
                  onClick={() => onSelectRegion(node.regionId)}
                  tabIndex={0}
                  aria-label={`Select ${node.label} region`}
                >
                  <span style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: isSelected ? '#38bdf8' : 'rgb(251, 191, 36)',
                    display: 'inline-block'
                  }}></span>
                  {node.label}
                </button>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};
export default NeurographLayer;
