'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Company } from '@/lib/types'
import { buildDotMatrix, loadImage, type DotMatrix } from './dotMatrix'
import DotField from './DotField'
import { Atmosphere, GlassShell } from './Atmosphere'
import Markers, { type MarkerHover } from './Markers'

interface GlassGlobeProps {
  companies: Company[]
  onSelect: (company: Company) => void
  onHover: (h: MarkerHover | null) => void
}

/**
 * The rotating globe group: dots + glass shell + markers. Owns auto-rotate,
 * pointer-drag rotation (with X clamp and auto-resume), and the mount entrance
 * scale-up. Lives inside the Canvas.
 */
function GlobeGroup({
  matrix,
  companies,
  onSelect,
  onHover,
}: {
  matrix: DotMatrix
  companies: Company[]
  onSelect: (c: Company) => void
  onHover: (h: MarkerHover | null) => void
}) {
  const group = useRef<THREE.Group>(null)
  const { gl } = useThree()
  const drag = useRef<{ active: boolean; lastX: number; lastY: number; releasedAt: number }>(
    { active: false, lastX: 0, lastY: 0, releasedAt: -1 }
  )
  const rotX = useRef(0)
  const mountT = useRef(0)

  // Pointer drag handlers on the canvas element.
  useEffect(() => {
    const el = gl.domElement
    const down = (e: PointerEvent) => {
      drag.current.active = true
      drag.current.lastX = e.clientX
      drag.current.lastY = e.clientY
    }
    const move = (e: PointerEvent) => {
      if (!drag.current.active || !group.current) return
      const dx = e.clientX - drag.current.lastX
      const dy = e.clientY - drag.current.lastY
      drag.current.lastX = e.clientX
      drag.current.lastY = e.clientY
      group.current.rotation.y += dx * 0.005
      rotX.current = THREE.MathUtils.clamp(rotX.current + dy * 0.005, -0.6, 0.6)
      group.current.rotation.x = rotX.current
    }
    const up = () => {
      if (drag.current.active) drag.current.releasedAt = performance.now()
      drag.current.active = false
    }
    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [gl])

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return
    // Entrance: ease scale 0.88 → 1 over ~1.2s.
    if (mountT.current < 1) {
      mountT.current = Math.min(1, mountT.current + delta / 1.2)
      const e = 1 - Math.pow(1 - mountT.current, 3) // easeOutCubic
      g.scale.setScalar(0.88 + 0.12 * e)
    }
    // Auto-rotate unless dragging or within 2.5s of release.
    const sinceRelease = drag.current.releasedAt < 0 ? Infinity : performance.now() - drag.current.releasedAt
    if (!drag.current.active && sinceRelease > 2500) {
      g.rotation.y += delta * 0.06
    }
    // Gentle drift of X back toward level when idle.
    if (!drag.current.active && sinceRelease > 2500) {
      rotX.current = THREE.MathUtils.lerp(rotX.current, 0, 0.01)
      g.rotation.x = rotX.current
    }
  })

  return (
    <group ref={group} rotation={[0, -0.6, 0]} scale={0.88}>
      <DotField matrix={matrix} />
      <GlassShell radius={2.0} />
      <Atmosphere radius={2.25} />
      <Markers companies={companies} onHover={onHover} onSelect={onSelect} />
    </group>
  )
}

export default function GlassGlobe({ companies, onSelect, onHover }: GlassGlobeProps) {
  const [matrix, setMatrix] = useState<DotMatrix | null>(null)

  // Sample the earth texture once on mount → build the dot matrix.
  useEffect(() => {
    let alive = true
    loadImage('/textures/earth.jpg')
      .then((img) => {
        if (!alive) return
        setMatrix(buildDotMatrix(img, { radius: 1.96, step: 1.25 }))
      })
      .catch(() => {
        // Texture missing: leave matrix null; shell + markers still render.
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <Canvas
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 5.4], fov: 42 }}
      style={{ background: 'transparent', touchAction: 'none' }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 3, 5]} intensity={0.8} color="#F5E7C1" />
      {matrix && matrix.count > 0 && (
        <GlobeGroup
          matrix={matrix}
          companies={companies}
          onSelect={onSelect}
          onHover={onHover}
        />
      )}
    </Canvas>
  )
}
