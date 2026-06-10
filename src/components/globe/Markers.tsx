'use client'

import { useMemo, useRef, useState } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Company } from '@/lib/types'
import { latLngToVec3 } from './dotMatrix'

const GOLD = new THREE.Color('#D4AF37')
const GOLD_BRIGHT = new THREE.Color('#F5E7C1')

export interface MarkerHover {
  company: Company
  /** Normalized screen coords for the HTML tooltip (0..1 of canvas box). */
  x: number
  y: number
}

interface MarkersProps {
  companies: Company[]
  radius?: number
  onHover: (h: MarkerHover | null) => void
  onSelect: (c: Company) => void
}

/**
 * Gold company markers: a small glowing core sphere plus a soft additive halo,
 * placed at each company's lat/lng. Hover enlarges the marker and sets the
 * pointer cursor; click selects. A gentle global sine pulse keeps them alive.
 */
export default function Markers({ companies, radius = 2.04, onHover, onSelect }: MarkersProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState<string | null>(null)

  const placed = useMemo(
    () =>
      companies
        .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng))
        .map((c) => ({
          company: c,
          pos: latLngToVec3(c.lat, c.lng, radius),
        })),
    [companies, radius]
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const g = groupRef.current
    if (!g) return
    g.children.forEach((child, i) => {
      const isHover = (child.userData.id as string) === hovered
      const pulse = 1 + Math.sin(t * 2.2 + i * 0.7) * 0.14
      const target = (isHover ? 1.9 : 1) * pulse
      child.scale.setScalar(THREE.MathUtils.lerp(child.scale.x, target, 0.18))
    })
  })

  return (
    <group ref={groupRef}>
      {placed.map(({ company, pos }) => {
        const isHover = hovered === company.id
        return (
          <group key={company.id} position={pos} userData={{ id: company.id }}>
            {/* Halo */}
            <sprite scale={isHover ? 0.42 : 0.3}>
              <spriteMaterial
                map={haloTexture()}
                color={GOLD}
                transparent
                opacity={0.6}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </sprite>
            {/* Core — the hit target */}
            <mesh
              onPointerOver={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation()
                setHovered(company.id)
                document.body.style.cursor = 'pointer'
                onHover({
                  company,
                  x: (e.pointer.x + 1) / 2,
                  y: (1 - e.pointer.y) / 2,
                })
              }}
              onPointerMove={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation()
                onHover({
                  company,
                  x: (e.pointer.x + 1) / 2,
                  y: (1 - e.pointer.y) / 2,
                })
              }}
              onPointerOut={(e: ThreeEvent<PointerEvent>) => {
                e.stopPropagation()
                setHovered((h) => (h === company.id ? null : h))
                document.body.style.cursor = 'auto'
                onHover(null)
              }}
              onClick={(e: ThreeEvent<MouseEvent>) => {
                e.stopPropagation()
                onSelect(company)
              }}
            >
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshBasicMaterial color={isHover ? GOLD_BRIGHT : GOLD} toneMapped={false} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** Lazily-built radial-gradient sprite texture, shared by all halos. */
let _halo: THREE.Texture | null = null
function haloTexture(): THREE.Texture {
  if (_halo) return _halo
  const size = 64
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(245,231,193,1)')
  grad.addColorStop(0.25, 'rgba(212,175,55,0.7)')
  grad.addColorStop(1, 'rgba(212,175,55,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  _halo = new THREE.CanvasTexture(c)
  _halo.needsUpdate = true
  return _halo
}
