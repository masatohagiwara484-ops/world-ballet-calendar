'use client'

import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * Outer fresnel halo — a BackSide sphere whose champagne-gold glow concentrates
 * at the limb and fades inward, reading as atmosphere on the near-black stage.
 */
export function Atmosphere({ radius = 2.25 }: { radius?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color('#D4AF37') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vNormal = normalize(mat3(modelMatrix) * normal);
            vec4 world = modelMatrix * vec4(position, 1.0);
            vView = normalize(cameraPosition - world.xyz);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            // BackSide: normals point inward, so the limb is where view grazes.
            // Tight power keeps the glow as a thin rim halo, not a fill.
            float fres = pow(1.0 - abs(dot(vNormal, vView)), 5.0);
            gl_FragColor = vec4(uColor, fres * 0.55);
          }
        `,
      }),
    []
  )

  return (
    <mesh material={material}>
      <sphereGeometry args={[radius, 64, 64]} />
    </mesh>
  )
}

/**
 * Glass shell — a fresnel rim in champagne gold rendered on both faces. This is
 * the headless-safe fallback for MeshPhysicalMaterial transmission (which can
 * render black under swiftshader). It reads as a refractive glass edge without
 * ever occluding the dot field inside.
 */
export function GlassShell({ radius = 2.0 }: { radius?: number }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: new THREE.Color('#F5E7C1') },
          uGold: { value: new THREE.Color('#D4AF37') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vNormal = normalize(mat3(modelMatrix) * normal);
            vec4 world = modelMatrix * vec4(position, 1.0);
            vView = normalize(cameraPosition - world.xyz);
            gl_Position = projectionMatrix * viewMatrix * world;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform vec3 uGold;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            float f = 1.0 - abs(dot(normalize(vNormal), normalize(vView)));
            // Rim-only champagne edge. No full-surface sheen — that washed the
            // continents to white under additive blending. Just a crisp limb.
            float rim = pow(f, 3.5);
            vec3 col = mix(uColor, uGold, smoothstep(0.0, 1.0, rim));
            float alpha = rim * 0.30;
            gl_FragColor = vec4(col, alpha);
          }
        `,
      }),
    []
  )

  return (
    <mesh material={material} renderOrder={2}>
      <sphereGeometry args={[radius, 64, 64]} />
    </mesh>
  )
}
