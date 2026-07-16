import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { hotspots, HotspotData } from './NarrativeSection';
import { customEarthShader } from '../shaders/customEarthShader';

// Tree generation configurations
interface TreeConfig {
  pos: THREE.Vector3;
  scale: number;
  stageToAppear: number;
  type: 'conifer' | 'deciduous' | 'crop';
}

interface PlanetSceneProps {
  stage: number;
  selectedHotspot: HotspotData | null;
  onSelectHotspot: (hotspot: HotspotData) => void;
}

export const Planet: React.FC<PlanetSceneProps> = ({
  stage,
  selectedHotspot,
  onSelectHotspot
}) => {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const planetRef = useRef<THREE.Group | null>(null);
  const { camera } = useThree();

  // Handle uniforms animation
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      
      // Interpolate u_adoption smoothly toward target adoption rate (stage / 3.0)
      const currentVal = materialRef.current.uniforms.u_adoption.value;
      materialRef.current.uniforms.u_adoption.value = THREE.MathUtils.lerp(currentVal, stage / 3.0, 0.08);

      // Handle Hotspot focus highlights
      if (selectedHotspot) {
        materialRef.current.uniforms.uHotspotActive.value = THREE.MathUtils.lerp(
          materialRef.current.uniforms.uHotspotActive.value, 1.0, 0.1
        );
        const targetPos = new THREE.Vector3(...selectedHotspot.coordinates);
        materialRef.current.uniforms.uSelectedHotspot.value.copy(targetPos);
      } else {
        materialRef.current.uniforms.uHotspotActive.value = THREE.MathUtils.lerp(
          materialRef.current.uniforms.uHotspotActive.value, 0.0, 0.1
        );
      }
    }

    // Slow planetary spin
    if (planetRef.current && !selectedHotspot) {
      planetRef.current.rotation.y = clock.getElapsedTime() * 0.015;
    }
  });

  // Camera tracking when hotspot selected
  useEffect(() => {
    if (selectedHotspot) {
      const coords = selectedHotspot.coordinates;
      const targetPos = new THREE.Vector3(coords[0], coords[1], coords[2]);
      
      // Position camera slightly offset from hotspot, looking directly at it
      const viewDir = targetPos.clone().normalize().multiplyScalar(4.8);
      
      // Smooth transition
      const duration = 1200;
      const startTime = performance.now();
      const startCam = camera.position.clone();
      
      const animateCam = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1.0);
        
        // EaseInOutCubic interpolation
        const ease = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(startCam, viewDir, ease);
        camera.lookAt(0, 0, 0);

        if (progress < 1.0) {
          requestAnimationFrame(animateCam);
        }
      };
      
      requestAnimationFrame(animateCam);
    }
  }, [selectedHotspot, camera]);

  // Generate trees procedurally and cache them
  const trees = useMemo(() => {
    const arr: TreeConfig[] = [];
    const seedRandom = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    // Spawn 70 trees distributed across coordinates
    for (let i = 0; i < 80; i++) {
      const r = 2.0; // planet sphere radius
      const u = seedRandom(i * 12.3);
      const v = seedRandom(i * 45.6);
      
      // Spherical coordinates
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      // Convert to Cartesian
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      
      const pos = new THREE.Vector3(x, y, z);
      
      // Avoid river belt (based on simple noise approximation)
      // Check 3D distance to river band or standard coordinates
      // We will classify them based on index to appear at different stages
      let stageToAppear = 1;
      if (i > 15 && i <= 40) stageToAppear = 2;
      if (i > 40) stageToAppear = 3;

      let type: 'conifer' | 'deciduous' | 'crop' = 'conifer';
      if (stageToAppear === 2) type = 'crop';
      if (stageToAppear === 3) type = 'deciduous';

      arr.push({
        pos,
        scale: 0.12 + seedRandom(i) * 0.08,
        stageToAppear,
        type
      });
    }
    return arr;
  }, []);

  // Particles mapping (carbon cycle & evaporation)
  const particleCount = 120;
  const [particlePositions, particleVelocities] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      // Random coordinates in space surrounding planet
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const dist = 2.2 + Math.random() * 1.5;

      pos[i*3] = dist * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] = dist * Math.sin(phi) * Math.sin(theta);
      pos[i*3+2] = dist * Math.cos(phi);

      // Speed outward/inward
      vel[i*3] = (Math.random() - 0.5) * 0.01;
      vel[i*3+1] = (Math.random() - 0.5) * 0.01;
      vel[i*3+2] = (Math.random() - 0.5) * 0.01;
    }
    return [pos, vel];
  }, []);

  const particlesRef = useRef<THREE.Points | null>(null);
  useFrame(() => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      // Particle density/behavior adapts to stage
      // Stage 0: slow smog. Stage 3: rapid moisture exchange
      const speedCoeff = stage === 0 ? 0.2 : stage === 1 ? 0.5 : stage === 2 ? 1.0 : 1.6;

      for (let i = 0; i < particleCount; i++) {
        // Move outward or flow
        const xIdx = i * 3;
        const yIdx = i * 3 + 1;
        const zIdx = i * 3 + 2;

        positions[xIdx] += particleVelocities[xIdx] * speedCoeff;
        positions[yIdx] += particleVelocities[yIdx] * speedCoeff;
        positions[zIdx] += particleVelocities[zIdx] * speedCoeff;

        const currentPos = new THREE.Vector3(positions[xIdx], positions[yIdx], positions[zIdx]);
        const dist = currentPos.length();

        // Reset if too far or too close
        if (dist > 3.6 || dist < 2.05) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          const startDist = stage === 0 ? 3.5 : 2.1; // Smog drifts in, water drifts out
          
          positions[xIdx] = startDist * Math.sin(phi) * Math.cos(theta);
          positions[yIdx] = startDist * Math.sin(phi) * Math.sin(theta);
          positions[zIdx] = startDist * Math.cos(phi);

          const factor = stage === 0 ? -1 : 1; // Inward for smog, outward for transpiration
          const speed = 0.005 + Math.random() * 0.01;
          const dir = new THREE.Vector3(positions[xIdx], positions[yIdx], positions[zIdx]).normalize().multiplyScalar(speed * factor);
          
          particleVelocities[xIdx] = dir.x;
          particleVelocities[yIdx] = dir.y;
          particleVelocities[zIdx] = dir.z;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.8} castShadow />
      <directionalLight position={[-10, -5, -10]} intensity={0.4} />

      <group ref={planetRef}>
        {/* The Procedural Planet Globe */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[2, 64, 64]} />
          <shaderMaterial
            ref={materialRef}
            vertexShader={customEarthShader.vertexShader}
            fragmentShader={customEarthShader.fragmentShader}
            uniforms={customEarthShader.uniforms}
          />
        </mesh>

        {/* Glowing Atmosphere Outer Shell */}
        <mesh>
          <sphereGeometry args={[2.08, 32, 32]} />
          <meshBasicMaterial
            color={stage === 0 ? "#c084fc" : stage === 1 ? "#fbbf24" : stage === 2 ? "#38bdf8" : "#34d399"}
            transparent
            opacity={0.06 + (stage * 0.02)}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Render Trees dynamically scaling with stage */}
        {trees.map((tree, idx) => {
          // Tree growth logic
          const shouldShow = stage >= tree.stageToAppear;
          // Scale transitions smoothly using active stages
          let targetScale = 0;
          if (shouldShow) {
            targetScale = tree.scale;
          }
          
          return (
            <TreeMesh
              key={idx}
              position={tree.pos}
              targetScale={targetScale}
              type={tree.type}
            />
          );
        })}

        {/* Interactive Hotspots floating nodes */}
        {hotspots.map((hs) => {
          const isSelected = selectedHotspot?.id === hs.id;
          return (
            <group key={hs.id} position={hs.coordinates}>
              {/* Floating pulsing 3D mesh marker */}
              <mesh onClick={() => onSelectHotspot(hs)}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial
                  color={isSelected ? "#00e5ff" : stage >= hs.stageRequirement ? "white" : "#d8b4fe"}
                  toneMapped={false}
                />
              </mesh>
              {/* Outer pulsing ring */}
              <mesh scale={[1.4, 1.4, 1.4]}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshBasicMaterial
                  color={stage >= hs.stageRequirement ? "#38bdf8" : "#805ad5"}
                  transparent
                  opacity={0.3}
                  wireframe
                />
              </mesh>

              {/* 2D HTML Tag Overlay */}
              <Html distanceFactor={5} style={{ pointerEvents: 'none' }}>
                <div style={{
                  background: 'rgba(9, 13, 22, 0.85)',
                  border: isSelected ? '1px solid #0ea5e9' : '1px solid rgba(255,255,255,0.15)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  transform: 'translate(-50%, -150%)',
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 0 10px rgba(14,165,233,0.4)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => onSelectHotspot(hs)}
                >
                  <span>{stage >= hs.stageRequirement ? '✅' : '🔒'}</span>
                  {hs.title}
                </div>
              </Html>
            </group>
          );
        })}
      </group>

      {/* Atmospheric/Flowing Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color={stage === 0 ? "#d8b4fe" : stage === 1 ? "#fde047" : stage === 2 ? "#7dd3fc" : "#a7f3d0"}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>

      <OrbitControls
        enableZoom={true}
        minDistance={3.5}
        maxDistance={7}
        enablePan={false}
        makeDefault
      />
    </>
  );
};

// Tree Helper Component that animates scale changes
interface TreeMeshProps {
  position: THREE.Vector3;
  targetScale: number;
  type: 'conifer' | 'deciduous' | 'crop';
}

const TreeMesh: React.FC<TreeMeshProps> = ({ position, targetScale, type }) => {
  const ref = useRef<THREE.Group | null>(null);
  const currentScaleRef = useRef(0);

  // Orient mesh outwards from planet center
  const quaternion = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const normal = position.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(up, normal);
  }, [position]);

  useFrame(() => {
    if (ref.current) {
      // Smooth scale interpolation
      currentScaleRef.current = THREE.MathUtils.lerp(currentScaleRef.current, targetScale, 0.05);
      const s = currentScaleRef.current;
      ref.current.scale.set(s, s, s);
      
      // Hide completely if scaled to nearly zero
      ref.current.visible = s > 0.005;
    }
  });

  // Render simple low-poly tree geometries to conserve performance
  return (
    <group ref={ref} position={position} quaternion={quaternion}>
      {/* Tree Trunk */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.4, 6]} />
        <meshStandardMaterial color="#4a2e1b" roughness={0.9} />
      </mesh>

      {/* Tree Leaves */}
      {type === 'conifer' && (
        <mesh position={[0, 0.5, 0]}>
          <coneGeometry args={[0.22, 0.6, 6]} />
          <meshStandardMaterial color="#14532d" roughness={0.8} />
        </mesh>
      )}

      {type === 'deciduous' && (
        <mesh position={[0, 0.55, 0]}>
          <dodecahedronGeometry args={[0.22]} />
          <meshStandardMaterial color="#047857" roughness={0.7} />
        </mesh>
      )}

      {type === 'crop' && (
        <mesh position={[0, 0.45, 0]} scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.18, 5, 5]} />
          <meshStandardMaterial color="#4d7c0f" roughness={0.8} />
        </mesh>
      )}
    </group>
  );
};
