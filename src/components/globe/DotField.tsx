'use client'

import { useMemo } from 'react'
import * as THREE from 'three'
import type { DotMatrix } from './dotMatrix'

/**
 * The continent dot matrix rendered as a single THREE.Points with a custom
 * additive shader: champagne-ivory dots, soft round falloff, per-point size
 * variance, and a brightness dip toward the limb (view-dependent) so the
 * silhouette reads as a glowing sphere rather than a flat sticker.
 */
export default function DotField({ matrix }: { matrix: DotMatrix }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(matrix.positions, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(matrix.sizes, 1))
    geo.setAttribute('aBright', new THREE.BufferAttribute(matrix.brightness, 1))
    return geo
  }, [matrix])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1 },
        uSize: { value: 2.6 },
        uColorWarm: { value: new THREE.Color('#E8C96A') },
        uColorPale: { value: new THREE.Color('#F5E7C1') },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aBright;
        uniform float uPixelRatio;
        uniform float uSize;
        varying float vBright;
        varying float vRim;
        void main() {
          vBright = aBright;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          // View direction vs normal (sphere → normal == normalized position).
          vec3 worldNormal = normalize(mat3(modelMatrix) * normalize(position));
          vec3 viewDir = normalize(cameraPosition - (modelMatrix * vec4(position,1.0)).xyz);
          float facing = max(dot(worldNormal, viewDir), 0.0);
          // Brighter near the center of the disc, gentle falloff toward limb.
          vRim = facing;
          // Perspective-scaled size. The constant is tuned so dots read as
          // fine points (~2-4px) at this camera distance, not blobs.
          float ps = uSize * aSize * uPixelRatio * (9.0 / -mvPosition.z);
          gl_PointSize = clamp(ps, 0.5, 6.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColorWarm;
        uniform vec3 uColorPale;
        varying float vBright;
        varying float vRim;
        void main() {
          // Round soft dot.
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float alpha = smoothstep(0.5, 0.06, d);
          if (alpha <= 0.001) discard;
          // Center hot-spot reads pale, edges warm gold.
          float core = smoothstep(0.42, 0.0, d);
          vec3 col = mix(uColorWarm, uColorPale, core);
          // Limb falloff: dots facing away dim out, keeping the silhouette soft.
          float facing = 0.45 + 0.55 * smoothstep(0.0, 0.6, vRim);
          float intensity = vBright * facing * 1.15;
          gl_FragColor = vec4(col * intensity, alpha * intensity);
        }
      `,
    })
  }, [])

  return <points geometry={geometry} material={material} />
}
