import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { customEarthShader } from '../../shaders/customEarthShader';
import geojson from '../../data/geography/ne_110m_land.json';

interface EarthSurfaceProps {
  adoption: number; // 0.0 to 1.0
  selectedHotspot: THREE.Vector3 | null;
  hotspotActive: number;
}

export const EarthSurface: React.FC<EarthSurfaceProps> = ({
  adoption,
  selectedHotspot,
  hotspotActive
}) => {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  // Generate Canvas Texture dynamically from GeoJSON and agricultural zones
  const canvasTexture = useMemo(() => {
    const width = 2048;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // 1. Fill background (Black = Ocean)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Coordinate mapping functions
    const lonToX = (lon: number) => (lon + 180) * (width / 360);
    const latToY = (lat: number) => (90 - lat) * (height / 180);

    // 2. Draw GeoJSON Land Polygons (Red Channel = CC0 land mask)
    ctx.fillStyle = 'rgb(255, 0, 0)';
    ctx.strokeStyle = 'rgb(255, 0, 0)';
    ctx.lineWidth = 1;

    const drawPolygon = (coordinates: number[][][]) => {
      coordinates.forEach((ring) => {
        if (ring.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(lonToX(ring[0][0]), latToY(ring[0][1]));
        for (let i = 1; i < ring.length; i++) {
          ctx.lineTo(lonToX(ring[i][0]), latToY(ring[i][1]));
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
    };

    // Parse Natural Earth GeoJSON features
    const features = (geojson as any).features || [];
    features.forEach((feature: any) => {
      const geom = feature.geometry;
      if (!geom) return;
      if (geom.type === 'Polygon') {
        drawPolygon(geom.coordinates);
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach((polyCoords: number[][][]) => {
          drawPolygon(polyCoords);
        });
      }
    });

    // 3. Draw Agricultural Zones in Green/Blue (composition with land)
    // R=255, G=255, B=0 (Cropland)
    // R=255, G=0, B=255 (Pasture)
    // Use 'source-atop' global composite operation to clip agricultural drawing to existing land R mask!
    ctx.globalCompositeOperation = 'source-atop';

    // Helper to paint agricultural bounding box
    const drawAgZone = (lonMin: number, lonMax: number, latMin: number, latMax: number, type: 'crop' | 'pasture') => {
      ctx.fillStyle = type === 'crop' ? 'rgb(255, 255, 0)' : 'rgb(255, 0, 255)';
      const x = lonToX(lonMin);
      const y = latToY(latMax);
      const w = lonToX(lonMax) - x;
      const h = latToY(latMin) - y;
      ctx.fillRect(x, y, w, h);
    };

    // Bounding box profiles (simplified agricultural belts)
    drawAgZone(-105, -75, 30, 48, 'crop'); // N. America Corn Belt
    drawAgZone(-65, -45, -30, -10, 'pasture'); // S. America Cerrado/Pampas
    drawAgZone(-5, 45, 45, 60, 'crop'); // Europe Plain
    drawAgZone(105, 125, 22, 45, 'crop'); // East Asia Yangtze
    drawAgZone(70, 90, 12, 30, 'crop'); // South Asia Ganges
    drawAgZone(10, 42, -15, 12, 'pasture'); // East Africa Highlands
    drawAgZone(115, 150, -36, -26, 'pasture'); // Australian Belt

    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }, []);

  // Update uniforms per frame
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
      
      const currentAdoption = materialRef.current.uniforms.u_adoption.value;
      materialRef.current.uniforms.u_adoption.value = THREE.MathUtils.lerp(
        currentAdoption,
        adoption,
        0.08
      );

      // Focus spotlight mapping
      if (selectedHotspot) {
        materialRef.current.uniforms.uHotspotActive.value = THREE.MathUtils.lerp(
          materialRef.current.uniforms.uHotspotActive.value,
          hotspotActive,
          0.1
        );
        materialRef.current.uniforms.uSelectedHotspot.value.copy(selectedHotspot);
      } else {
        materialRef.current.uniforms.uHotspotActive.value = THREE.MathUtils.lerp(
          materialRef.current.uniforms.uHotspotActive.value,
          0.0,
          0.1
        );
      }
    }
  });

  // Equator and axial rings for celestial sphere look
  const equatorGeo = useMemo(() => {
    const points = [];
    const segments = 64;
    const r = 2.02; // slightly larger than globe
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta)));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  const meridianGeo = useMemo(() => {
    const points = [];
    const segments = 64;
    const r = 2.02;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(0, r * Math.sin(theta), r * Math.cos(theta)));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  return (
    <group>
      {/* 3D Sphere mesh */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[2, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={customEarthShader.vertexShader}
          fragmentShader={customEarthShader.fragmentShader}
          uniforms={{
            uTime: customEarthShader.uniforms.uTime,
            u_adoption: { value: 0.0 },
            uSelectedHotspot: { value: new THREE.Vector3() },
            uHotspotActive: { value: 0.0 },
            uLandMask: { value: canvasTexture }
          }}
        />
      </mesh>

      {/* Coordinate rings (Equator and Prime Meridian) */}
      <line geometry={equatorGeo}>
        <lineBasicMaterial color="rgba(255, 255, 255, 0.08)" />
      </line>
      <line geometry={meridianGeo}>
        <lineBasicMaterial color="rgba(255, 255, 255, 0.08)" />
      </line>

      {/* Axial markers at the North/South poles */}
      <mesh position={[0, 2.15, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
        <meshBasicMaterial color="rgba(255, 255, 255, 0.2)" />
      </mesh>
      <mesh position={[0, -2.15, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
        <meshBasicMaterial color="rgba(255, 255, 255, 0.2)" />
      </mesh>
    </group>
  );
};
