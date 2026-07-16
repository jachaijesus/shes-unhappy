import * as THREE from 'three';

const noiseShaderChunk = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
  
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
  
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
  
    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
  
    vec4 j = p - 49.0 * floor(p * ns.z);
  
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
  
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
  
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
  
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
  
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
  
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
  
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3)));
  }
`;

export const customEarthShader = {
  uniforms: {
    uTime: { value: 0 },
    u_adoption: { value: 0.0 }, // Transition state (0.0 to 1.0)
    uSelectedHotspot: { value: new THREE.Vector3(0, 0, 0) },
    uHotspotActive: { value: 0.0 },
    uLandMask: { value: null } // Textures containing geography & agricultural zones
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float u_adoption;
    uniform vec3 uSelectedHotspot;
    uniform float uHotspotActive;
    uniform sampler2D uLandMask;
    
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    ${noiseShaderChunk}

    void main() {
      vec3 pos = normalize(vPosition);
      
      // Sample geography canvas texture:
      // Red: Land mask (Natural Earth)
      // Green: Cropland mask
      // Blue: Pasture/grazing mask
      vec4 mapData = texture2D(uLandMask, vUv);
      float isLand = step(0.1, mapData.r);
      float isCrop = mapData.g;
      float isPasture = mapData.b;
      
      // Deep mineral background for Oceans (#06090d)
      vec3 oceanBase = vec3(0.0235, 0.0353, 0.051);
      
      // Base theme colors
      vec3 cropGold = vec3(0.85, 0.65, 0.25); // Gold
      vec3 pastureGrass = vec3(0.2, 0.6, 0.35); // Grass green
      vec3 waterCyan = vec3(0.0, 0.75, 0.85); // Water cyan
      vec3 activeGreen = vec3(0.06, 0.75, 0.45); // Living Emerald
      vec3 neutralLand = vec3(0.2, 0.22, 0.28); // Deep charcoal land

      vec3 finalColor = vec3(0.0);

      // Polar Zones (pure ice blue/white nodes)
      float polarMask = smoothstep(0.68, 0.82, abs(pos.y)) * isLand;

      if (isLand > 0.5) {
        // Continent dot matrix grid mapping (300 x 150)
        vec2 gridUV = fract(vUv * vec2(300.0, 150.0));
        float dotMask = smoothstep(0.42, 0.18, length(gridUV - 0.5));
        
        vec3 landColor = neutralLand;
        
        // 1. Cropland: warm ochre/gold parallel ridges
        if (isCrop > 0.1) {
          float cropLines = step(0.8, fract(vUv.x * 600.0 + vUv.y * 300.0));
          landColor = mix(cropGold * 0.6, cropGold, cropLines);
        }
        
        // 2. Pastures: grass-toned open nodes
        if (isPasture > 0.1) {
          float pastureDots = step(0.9, fract(snoise(pos * 35.0)));
          landColor = mix(pastureGrass * 0.6, pastureGrass * 1.1, pastureDots);
        }

        // 3. Polar tinting
        if (polarMask > 0.1) {
          landColor = mix(landColor, vec3(0.8, 0.92, 1.0), polarMask);
        }

        // 4. Agroforestry emergence (Living Green overlay grows with u_adoption)
        float agroNoise = snoise(pos * 8.5 + vec3(0.0, 0.0, uTime * 0.05)) * 0.5 + 0.5;
        // As adoption rises, trees occupy larger sections of croplands/pastures
        float agroThreshold = mix(0.9, 0.38, u_adoption);
        float hasAgro = step(agroThreshold, agroNoise) * (isCrop + isPasture) * (1.0 - polarMask);
        
        // Blend in living green nodes
        landColor = mix(landColor, activeGreen, hasAgro);

        // Grid node glow
        float glowFactor = dotMask * (0.4 + u_adoption * 0.5);
        finalColor = landColor * glowFactor;

        // Flowing neural relationship pathways (representing agricultural networks)
        float flowNoise1 = snoise(pos * 5.0 + vec3(0.0, 0.0, uTime * 0.12));
        float flowNoise2 = snoise(pos * 10.0 - vec3(0.0, uTime * 0.4, 0.0));
        
        float pathLines = smoothstep(0.05, 0.0, abs(flowNoise1 - 0.2)) * 0.3;
        float pulsePoints = smoothstep(0.03, 0.0, abs(flowNoise2 - sin(uTime * 1.2) * 0.15)) * 0.25;

        // Connections illuminate with u_adoption
        vec3 connectionColor = mix(vec3(0.7, 0.45, 0.3) * 0.3, activeGreen, u_adoption);
        finalColor += connectionColor * (pathLines + pulsePoints) * (0.2 + u_adoption * 0.8);
      } else {
        // Oceans: quiet deep mineral base with subtle coordinate guides
        vec2 oceanGridUV = fract(vUv * vec2(60.0, 30.0));
        float gridX = smoothstep(0.02, 0.0, abs(oceanGridUV.x - 0.5));
        float gridY = smoothstep(0.02, 0.0, abs(oceanGridUV.y - 0.5));
        float guides = max(gridX, gridY) * 0.06;
        
        // Gentle wave motion
        float waves = sin(uTime * 0.4 + pos.x * 3.0 + pos.y * 2.0) * 0.015;
        vec3 gridColor = mix(vec3(0.0, 0.2, 0.4), waterCyan * 0.5, u_adoption) * guides;

        finalColor = oceanBase + vec3(waves) + gridColor;
      }

      // Hotspot spotlight tracking ripple
      if (uHotspotActive > 0.01) {
        float dist = distance(vPosition, uSelectedHotspot);
        if (dist < 0.6) {
          float pulseSpeed = 6.0;
          float ring = sin(dist * 40.0 - uTime * pulseSpeed) * 0.5 + 0.5;
          float spotlightGlow = (1.0 - (dist / 0.6)) * 0.4 * uHotspotActive;
          finalColor += waterCyan * spotlightGlow * (0.6 + 0.4 * ring);
        }
      }

      // Celestial rim glow (Fresnel shell)
      float fresnel = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
      vec3 atmosphericGlow = mix(vec3(0.5, 0.3, 0.7) * 0.4, activeGreen * 0.9, u_adoption) * fresnel;
      finalColor += atmosphericGlow;

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};
