import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import type { DrawPixel } from '@/types';

export interface ShapeResult {
  positions: THREE.Vector3[];
  colors: THREE.Color[];
  extras?: Array<{ seed: number; ox?: number; oy?: number; oz?: number }>;
}

export function generateSphere(count: number): ShapeResult {
  const positions: THREE.Vector3[] = [];
  const colors: THREE.Color[] = [];
  const color = new THREE.Color();
  const r = 30;
  
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(-1 + (2 * i) / count);
    const theta = Math.sqrt(count * Math.PI) * phi;
    positions.push(new THREE.Vector3(
      r * Math.cos(theta) * Math.sin(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(phi)
    ));
    colors.push(color.setHex(0x00ff88).clone());
  }
  
  return { positions, colors };
}

export function generateCube(count: number): ShapeResult {
  const positions: THREE.Vector3[] = [];
  const colors: THREE.Color[] = [];
  const color = new THREE.Color();
  const s = Math.ceil(Math.cbrt(count));
  const sep = 2.5;
  const off = (s * sep) / 2;
  let idx = 0;
  
  for (let x = 0; x < s; x++) {
    for (let y = 0; y < s; y++) {
      for (let z = 0; z < s; z++) {
        if (idx >= count) break;
        positions.push(new THREE.Vector3(x * sep - off, y * sep - off, z * sep - off));
        colors.push(color.setHex(0x00aaff).clone());
        idx++;
      }
    }
  }
  
  return { positions, colors };
}

export function generateHelix(count: number): ShapeResult {
  const positions: THREE.Vector3[] = [];
  const colors: THREE.Color[] = [];
  const color = new THREE.Color();
  const r = 15;
  const h = count * 0.003;
  const off = h / 2;
  
  for (let i = 0; i < count; i++) {
    const t = i * 0.05;
    positions.push(new THREE.Vector3(
      Math.cos(t) * r,
      (i * 0.003) - off,
      Math.sin(t) * r
    ));
    colors.push(color.setHSL(i / count, 1, 0.5).clone());
  }
  
  return { positions, colors };
}

export function generateTorus(count: number): ShapeResult {
  const positions: THREE.Vector3[] = [];
  const colors: THREE.Color[] = [];
  const color = new THREE.Color();
  const R = 25;
  const r = 8;
  
  for (let i = 0; i < count; i++) {
    const u = (i / count) * Math.PI * 2 * 40;
    const v = (i / count) * Math.PI * 2;
    positions.push(new THREE.Vector3(
      (R + r * Math.cos(u)) * Math.cos(v),
      (R + r * Math.cos(u)) * Math.sin(v),
      r * Math.sin(u)
    ));
    colors.push(color.setHex(0xff0055).clone());
  }
  
  return { positions, colors };
}

export function generateFromText(
  text: string,
  count: number,
  fontSize: number,
  font: string
): ShapeResult {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const tW = 1024;
  const tH = 1024;
  canvas.width = tW;
  canvas.height = tH;
  
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, tW, tH);
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px "${font}"`;
  
  // Word wrap
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];
  const maxW = tW * 0.9;
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxW && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  
  const lineHeight = fontSize * 1.1;
  const totalH = lines.length * lineHeight;
  let startY = (tH - totalH) / 2 + (lineHeight / 2);
  
  lines.forEach((l, i) => {
    ctx.fillText(l.trim(), tW / 2, startY + (i * lineHeight));
  });
  
  const data = ctx.getImageData(0, 0, tW, tH).data;
  const valid: Array<{ x: number; y: number }> = [];
  const step = 4;
  const wH = 60;
  const wW = 60;
  
  for (let y = 0; y < tH; y += step) {
    for (let x = 0; x < tW; x += step) {
      if (data[(y * tW + x) * 4] > 128) {
        valid.push({
          x: (x / tW - 0.5) * wW,
          y: ((1 - y / tH) - 0.5) * wH,
        });
      }
    }
  }
  
  valid.sort(() => Math.random() - 0.5);
  
  const positions: THREE.Vector3[] = [];
  const colors: THREE.Color[] = [];
  const extras: Array<{ seed: number; ox: number; oy: number; oz: number }> = [];
  const color = new THREE.Color();
  
  for (let i = 0; i < count; i++) {
    if (i < valid.length) {
      const p = valid[i];
      positions.push(new THREE.Vector3(p.x, p.y, 0));
      colors.push(color.setHex(0x00ff88).clone());
      extras.push({ seed: Math.random() * 100, ox: p.x, oy: p.y, oz: 0 });
    } else {
      positions.push(new THREE.Vector3(0, -500, 0));
      colors.push(color.setHex(0x000000).clone());
      extras.push({ seed: Math.random() * 100, ox: 0, oy: 0, oz: 0 });
    }
  }
  
  return { positions, colors, extras };
}

export function generateFromImage(
  image: HTMLImageElement,
  count: number
): ShapeResult {
  const ratio = image.naturalWidth / image.naturalHeight;
  const gridH = Math.floor(Math.sqrt(count / ratio));
  const gridW = Math.floor(gridH * ratio);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = gridW;
  canvas.height = gridH;
  ctx.drawImage(image, 0, 0, gridW, gridH);
  
  const data = ctx.getImageData(0, 0, gridW, gridH).data;
  const positions: THREE.Vector3[] = [];
  const colors: THREE.Color[] = [];
  const color = new THREE.Color();
  const wW = 70;
  const wH = wW / ratio;
  
  let idx = 0;
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      if (idx >= count) break;
      positions.push(new THREE.Vector3(
        (x / gridW - 0.5) * wW,
        ((1 - y / gridH) - 0.5) * wH,
        0
      ));
      const i = (y * gridW + x) * 4;
      colors.push(color.setRGB(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255).clone());
      idx++;
    }
  }
  
  // Fill remaining
  for (let i = idx; i < count; i++) {
    positions.push(new THREE.Vector3(0, -500, 0));
    colors.push(color.setHex(0x000000).clone());
  }
  
  return { positions, colors };
}

export function generateFromVideoGrid(
  videoWidth: number,
  videoHeight: number,
  count: number
): { positions: THREE.Vector3[]; gridW: number; gridH: number } {
  const ratio = videoWidth / videoHeight;
  const gridH = Math.floor(Math.sqrt(count / ratio));
  const gridW = Math.floor(gridH * ratio);
  const wW = 70;
  const wH = wW / ratio;
  
  const positions: THREE.Vector3[] = [];
  let idx = 0;
  
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      if (idx >= count) break;
      positions.push(new THREE.Vector3(
        (x / gridW - 0.5) * wW,
        ((1 - y / gridH) - 0.5) * wH,
        0
      ));
      idx++;
    }
  }
  
  for (let i = idx; i < count; i++) {
    positions.push(new THREE.Vector3(0, -500, 0));
  }
  
  return { positions, gridW, gridH };
}

export function generateFromDrawPixels(
  pixels: DrawPixel[],
  count: number,
  depth: number,
  scale: number,
  rotateDeg: number,
  fill: boolean
): ShapeResult {
  if (pixels.length === 0) {
    return { positions: [], colors: [] };
  }
  
  const positions: THREE.Vector3[] = [];
  const colors: THREE.Color[] = [];
  const color = new THREE.Color();
  
  const angleRad = (rotateDeg * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  
  for (let i = 0; i < count; i++) {
    const p = pixels[i % pixels.length];
    
    let z = 0;
    if (depth > 0) {
      if (fill) {
        const r = Math.random();
        if (r < 0.4) z = depth / 2;
        else if (r < 0.8) z = -depth / 2;
        else z = (Math.random() - 0.5) * depth;
      } else {
        z = (Math.random() - 0.5) * depth;
      }
    }
    
    let tx = p.x * scale;
    let ty = p.y * scale;
    let rotX = tx * cosA - ty * sinA;
    let rotY = tx * sinA + ty * cosA;
    
    positions.push(new THREE.Vector3(
      rotX + (Math.random() - 0.5) * 0.15,
      rotY + (Math.random() - 0.5) * 0.15,
      z
    ));
    colors.push(color.setRGB(p.r / 255, p.g / 255, p.b / 255).clone());
  }
  
  return { positions, colors };
}

export function generateBlueprint(
  image: HTMLImageElement,
  count: number,
  threshold: number,
  scale: number,
  fill: boolean
): ShapeResult {
  const w = 512;
  const h = Math.floor(512 * (image.naturalHeight / image.naturalWidth));
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(image, 0, 0, w, h);
  
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  
  // Auto-detect background
  let totalBright = 0;
  for (let i = 0; i < w * h; i++) {
    totalBright += (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  }
  const avgBright = totalBright / (w * h);
  const isDarkBg = avgBright < 100;
  
  const candidates: Array<{ x: number; y: number; mag: number; r: number; g: number; b: number }> = [];
  
  if (fill) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx] / 255;
        const g = data[idx + 1] / 255;
        const b = data[idx + 2] / 255;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        let diff = 0;
        if (isDarkBg) diff = brightness;
        else diff = 255 - brightness;
        
        const fillThreshold = Math.max(10, 255 - threshold);
        
        if (diff > fillThreshold) {
          candidates.push({
            x: (x / w - 0.5) * 120 * scale,
            y: ((1 - y / h) - 0.5) * 120 * (h / w) * scale,
            mag: diff,
            r, g, b
          });
        }
      }
    }
  } else {
    // Edge detection with Sobel
    const gray = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      gray[i] = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
    }
    
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i00 = (y - 1) * w + (x - 1);
        const i01 = (y - 1) * w + x;
        const i02 = (y - 1) * w + (x + 1);
        const i10 = y * w + (x - 1);
        const i12 = y * w + (x + 1);
        const i20 = (y + 1) * w + (x - 1);
        const i21 = (y + 1) * w + x;
        const i22 = (y + 1) * w + (x + 1);
        
        const Gx = -gray[i00] + gray[i02] - 2 * gray[i10] + 2 * gray[i12] - gray[i20] + gray[i22];
        const Gy = -gray[i00] - 2 * gray[i01] - gray[i02] + gray[i20] + 2 * gray[i21] + gray[i22];
        const mag = Math.sqrt(Gx * Gx + Gy * Gy);
        
        const idx = (y * w + x) * 4;
        candidates.push({
          x: (x / w - 0.5) * 120 * scale,
          y: ((1 - y / h) - 0.5) * 120 * (h / w) * scale,
          mag,
          r: data[idx] / 255,
          g: data[idx + 1] / 255,
          b: data[idx + 2] / 255,
        });
      }
    }
  }
  
  candidates.sort((a, b) => b.mag - a.mag);
  
  if (!fill) {
    const userThreshold = Math.max(10, 255 - threshold);
    const filtered = candidates.filter(c => c.mag > userThreshold);
    candidates.length = 0;
    candidates.push(...filtered);
  }
  
  const MAX_ACTIVE = 15000;
  const valid = candidates.slice(0, Math.min(candidates.length, MAX_ACTIVE));
  
  // Re-center
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  valid.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  valid.forEach(p => {
    p.x -= centerX;
    p.y -= centerY;
  });
  
  valid.sort(() => Math.random() - 0.5);
  
  const positions: THREE.Vector3[] = [];
  const colors: THREE.Color[] = [];
  const color = new THREE.Color();
  
  for (let i = 0; i < count; i++) {
    const p = valid[i % valid.length];
    positions.push(new THREE.Vector3(p.x, p.y, 0));
    colors.push(color.setRGB(p.r, p.g, p.b).clone());
  }
  
  return { positions, colors };
}

export async function generateFromModel(
  file: File,
  count: number
): Promise<ShapeResult> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    const onLoad = (group: THREE.Group | THREE.Object3D) => {
      URL.revokeObjectURL(url);
      
      const positions: THREE.Vector3[] = [];
      const colors: THREE.Color[] = [];
      const color = new THREE.Color();
      
      // Collect all triangles from all meshes for surface sampling
      interface Triangle {
        a: THREE.Vector3;
        b: THREE.Vector3;
        c: THREE.Vector3;
        colorA?: THREE.Color;
        colorB?: THREE.Color;
        colorC?: THREE.Color;
        materialColor?: THREE.Color;
        area: number;
      }
      
      const triangles: Triangle[] = [];
      
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const geometry = child.geometry;
          if (!geometry || !geometry.attributes.position) return;
          
          const posAttr = geometry.attributes.position;
          const colorAttr = geometry.attributes.color;
          child.updateWorldMatrix(true, false);
          const matrix = child.matrixWorld;
          
          // Get material color as fallback
          let matColor: THREE.Color | undefined;
          if (child.material) {
            const mat = Array.isArray(child.material) ? child.material[0] : child.material;
            if ((mat as any).color) {
              matColor = (mat as any).color.clone();
            }
          }
          
          // Helper to get a world-space vertex
          const getVertex = (idx: number): THREE.Vector3 => {
            const v = new THREE.Vector3(
              posAttr.getX(idx),
              posAttr.getY(idx),
              posAttr.getZ(idx)
            );
            v.applyMatrix4(matrix);
            return v;
          };
          
          // Helper to get vertex color
          const getColor = (idx: number): THREE.Color | undefined => {
            if (!colorAttr) return undefined;
            return new THREE.Color(
              colorAttr.getX(idx),
              colorAttr.getY(idx),
              colorAttr.getZ(idx)
            );
          };
          
          // Build triangles from indexed or non-indexed geometry
          const index = geometry.index;
          const triCount = index 
            ? Math.floor(index.count / 3)
            : Math.floor(posAttr.count / 3);
          
          for (let t = 0; t < triCount; t++) {
            let i0: number, i1: number, i2: number;
            if (index) {
              i0 = index.getX(t * 3);
              i1 = index.getX(t * 3 + 1);
              i2 = index.getX(t * 3 + 2);
            } else {
              i0 = t * 3;
              i1 = t * 3 + 1;
              i2 = t * 3 + 2;
            }
            
            const a = getVertex(i0);
            const b = getVertex(i1);
            const c = getVertex(i2);
            
            // Triangle area via cross product
            const ab = new THREE.Vector3().subVectors(b, a);
            const ac = new THREE.Vector3().subVectors(c, a);
            const area = ab.cross(ac).length() * 0.5;
            
            if (area > 0) {
              triangles.push({
                a, b, c,
                colorA: getColor(i0),
                colorB: getColor(i1),
                colorC: getColor(i2),
                materialColor: matColor,
                area,
              });
            }
          }
        }
      });
      
      if (triangles.length === 0) {
        reject(new Error("No geometry found in 3D model."));
        return;
      }
      
      // Build cumulative area distribution for weighted random sampling
      let totalArea = 0;
      const cumulativeAreas: number[] = [];
      for (const tri of triangles) {
        totalArea += tri.area;
        cumulativeAreas.push(totalArea);
      }
      
      // Sample points uniformly on the mesh surface
      const sampledPoints: THREE.Vector3[] = [];
      const sampledColors: THREE.Color[] = [];
      
      for (let i = 0; i < count; i++) {
        // Pick a random triangle weighted by area
        const r = Math.random() * totalArea;
        let triIdx = 0;
        for (let j = 0; j < cumulativeAreas.length; j++) {
          if (cumulativeAreas[j] >= r) {
            triIdx = j;
            break;
          }
        }
        const tri = triangles[triIdx];
        
        // Random point on triangle using barycentric coordinates
        let u = Math.random();
        let v = Math.random();
        if (u + v > 1) {
          u = 1 - u;
          v = 1 - v;
        }
        const w = 1 - u - v;
        
        const point = new THREE.Vector3(
          tri.a.x * w + tri.b.x * u + tri.c.x * v,
          tri.a.y * w + tri.b.y * u + tri.c.y * v,
          tri.a.z * w + tri.b.z * u + tri.c.z * v,
        );
        
        sampledPoints.push(point);
        
        // Interpolate vertex colors if available, else use material color, else orange
        if (tri.colorA && tri.colorB && tri.colorC) {
          const c = new THREE.Color(
            tri.colorA.r * w + tri.colorB.r * u + tri.colorC.r * v,
            tri.colorA.g * w + tri.colorB.g * u + tri.colorC.g * v,
            tri.colorA.b * w + tri.colorB.b * u + tri.colorC.b * v,
          );
          sampledColors.push(c);
        } else if (tri.materialColor) {
          sampledColors.push(tri.materialColor.clone());
        } else {
          sampledColors.push(color.setHex(0xf97316).clone());
        }
      }
      
      // Center and scale all sampled points
      const box = new THREE.Box3().setFromPoints(sampledPoints);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 50 / maxDim; // Fit within a reasonable radius
      
      for (let i = 0; i < sampledPoints.length; i++) {
        sampledPoints[i].sub(center).multiplyScalar(scale);
        positions.push(sampledPoints[i]);
        colors.push(sampledColors[i]);
      }
      
      resolve({ positions, colors });
    };

    const onError = (error: any) => {
      URL.revokeObjectURL(url);
      reject(error);
    };

    if (extension === 'glb' || extension === 'gltf') {
      const loader = new GLTFLoader();
      loader.load(url, (gltf) => onLoad(gltf.scene), undefined, onError);
    } else if (extension === 'obj') {
      const loader = new OBJLoader();
      loader.load(url, onLoad, undefined, onError);
    } else {
      URL.revokeObjectURL(url);
      reject(new Error("Unsupported file extension. Please use .glb, .gltf, or .obj"));
    }
  });
}
