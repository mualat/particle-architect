import * as THREE from 'three';
import type { RenderStyle } from '@/types';

// Base geometries
export const geometries = {
  spark: new THREE.TetrahedronGeometry(0.25),
  vector: new THREE.ConeGeometry(0.1, 0.5, 4).rotateX(Math.PI / 2),
  plasma: new THREE.PlaneGeometry(0.8, 0.8),
  cyber: new THREE.BoxGeometry(0.3, 0.3, 0.3),
  sphere: new THREE.SphereGeometry(0.3, 16, 16),
};

// Material definitions with shader code for export
export const materialDefinitions: Record<RenderStyle, { 
  material: THREE.Material; 
  geoCode: string;
  matCode: string;
}> = {
  spark: {
    material: new THREE.MeshBasicMaterial({ color: 0xffffff }),
    geoCode: `new THREE.TetrahedronGeometry(0.25)`,
    matCode: `new THREE.MeshBasicMaterial({ color: 0xffffff })`,
  },
  vector: {
    material: new THREE.MeshBasicMaterial({ color: 0x00aaff }),
    geoCode: `new THREE.ConeGeometry(0.1, 0.5, 4).rotateX(Math.PI / 2)`,
    matCode: `new THREE.MeshBasicMaterial({ color: 0x00aaff })`,
  },
  cyber: {
    material: new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true }),
    geoCode: `new THREE.BoxGeometry(0.3, 0.3, 0.3)`,
    matCode: `new THREE.MeshBasicMaterial({ color: 0x00ff88, wireframe: true })`,
  },
  plasma: {
    material: new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vColor;
        void main() {
          vUv = uv;
          vColor = instanceColor;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vColor;
        uniform float uTime;
        void main() {
          float dist = distance(vUv, vec2(0.5));
          float ring = smoothstep(0.4, 0.45, dist) - smoothstep(0.45, 0.5, dist);
          float core = 1.0 - smoothstep(0.0, 0.1, dist);
          float alpha = core + ring * (0.5 + 0.5 * sin(uTime * 3.0));
          if (alpha < 0.05) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    geoCode: `new THREE.PlaneGeometry(0.8, 0.8)`,
    matCode: `new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: \`
        varying vec2 vUv;
        varying vec3 vColor;
        void main() {
          vUv = uv;
          vColor = instanceColor;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      \`,
      fragmentShader: \`
        varying vec2 vUv;
        varying vec3 vColor;
        uniform float uTime;
        void main() {
          float dist = distance(vUv, vec2(0.5));
          float ring = smoothstep(0.4, 0.45, dist) - smoothstep(0.45, 0.5, dist);
          float core = 1.0 - smoothstep(0.0, 0.1, dist);
          float alpha = core + ring * (0.5 + 0.5 * sin(uTime * 3.0));
          if (alpha < 0.05) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      \`,
      transparent: true,
      depthWrite: false,
      side: 2
    })`,
  },
  ink: {
    material: new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vColor;
        void main() {
          vUv = uv;
          vColor = instanceColor;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vColor;
        uniform float uTime;
        float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
        float noise(vec2 p) { 
          vec2 ip = floor(p); 
          vec2 u = fract(p); 
          u = u*u*(3.0-2.0*u); 
          float res = mix(mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x), 
                         mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y); 
          return res * res; 
        }
        void main() {
          float dist = distance(vUv, vec2(0.5));
          float n = noise(vUv * 5.0 + uTime * 0.5);
          float alpha = (1.0 - smoothstep(0.2, 0.5, dist)) * (0.5 + 0.5 * n);
          if(alpha < 0.1) discard;
          gl_FragColor = vec4(vColor + 0.2, alpha * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    }),
    geoCode: `new THREE.PlaneGeometry(0.8, 0.8)`,
    matCode: `new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: \`...\`,
      fragmentShader: \`...\`,
      transparent: true,
      depthWrite: false,
      side: 2,
      blending: 2
    })`,
  },
  paint: {
    material: new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vColor;
        void main() {
          vUv = uv;
          vColor = instanceColor;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vColor;
        uniform float uTime;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          for(int i=1; i<4; i++) {
            p.x += 0.3/float(i)*sin(float(i)*3.0*p.y + uTime*0.4);
            p.y += 0.3/float(i)*cos(float(i)*3.0*p.x + uTime*0.4);
          }
          float r = cos(p.x+p.y+1.0)*0.5+0.5;
          float pattern = (sin(p.x+p.y)+cos(p.x+p.y))*0.5+0.5;
          float dist = distance(vUv, vec2(0.5));
          if(dist > 0.5) discard;
          vec3 finalColor = mix(vColor, vec3(r, pattern, 1.0 - r), 0.3);
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    }),
    geoCode: `new THREE.PlaneGeometry(0.8, 0.8)`,
    matCode: `new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: \`...\`,
      fragmentShader: \`...\`,
      side: 2
    })`,
  },
  steel: {
    material: new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vColor;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vColor = instanceColor;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vColor;
        void main() {
          vec3 viewDir = vec3(0.0, 0.0, 1.0);
          float metallic = dot(vNormal, viewDir) * 0.5 + 0.5;
          metallic = pow(metallic, 3.0);
          vec3 col = mix(vec3(0.1), vColor, 0.5) * metallic + vec3(0.2);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    }),
    geoCode: `new THREE.SphereGeometry(0.3, 16, 16)`,
    matCode: `new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: \`...\`,
      fragmentShader: \`...\`
    })`,
  },
  glass: {
    material: new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vColor;
        void main() {
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = -mvPosition.xyz;
          vColor = instanceColor;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying vec3 vColor;
        void main() {
          float fresnel = dot(vNormal, normalize(vViewPosition));
          fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
          fresnel = pow(fresnel, 2.0);
          vec3 col = vColor * fresnel + vec3(0.1);
          gl_FragColor = vec4(col, 0.3 + fresnel * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    geoCode: `new THREE.SphereGeometry(0.3, 16, 16)`,
    matCode: `new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: \`...\`,
      fragmentShader: \`...\`,
      transparent: true,
      blending: 2,
      depthWrite: false
    })`,
  },
};

export function getGeometryForStyle(style: RenderStyle): THREE.BufferGeometry {
  switch (style) {
    case 'plasma':
    case 'ink':
    case 'paint':
      return geometries.plasma;
    case 'vector':
      return geometries.vector;
    case 'cyber':
      return geometries.cyber;
    case 'steel':
    case 'glass':
      return geometries.sphere;
    default:
      return geometries.spark;
  }
}

export function getMaterialForStyle(style: RenderStyle): THREE.Material {
  return materialDefinitions[style].material;
}

export function updateShaderTime(style: RenderStyle, time: number): void {
  const material = materialDefinitions[style].material;
  if (material instanceof THREE.ShaderMaterial && material.uniforms.uTime) {
    material.uniforms.uTime.value = time;
  }
}
