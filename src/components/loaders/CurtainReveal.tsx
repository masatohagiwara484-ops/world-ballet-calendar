'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Theatrical Curtain Reveal — first-load opening experience.
 *
 * A scarlet velvet stage curtain (animation-film style, Higgsfield-generated
 * texture) fills the viewport. The visitor *scrolls* to part the curtain — the
 * two halves billow and slide outward, revealing the search hero behind, exactly
 * like a theatre raising its curtain at curtain-up.
 *
 * - Driver:  React Three Fiber (WebGL) — perspective billow + parting.
 * - Texture: /curtain/curtain.png (left & right halves UV-split from one image).
 * - Responsive: planes are sized from the live r3f viewport every frame, so the
 *   curtain fills any aspect ratio (desktop + mobile) without distortion.
 * - Shown once per browser (localStorage). Skipped for reduced-motion users.
 */

const SEEN_KEY = 'wboc_curtain_seen'
const TEXTURE_SRC = '/curtain/curtain.png'
const VELVET = '#7B0A12' // fallback velvet while/if the texture is unavailable

/* ------------------------------------------------------------------ */
/* One curtain half (left | right)                                     */
/* ------------------------------------------------------------------ */
function CurtainHalf({
  side,
  texture,
  openRef,
}: {
  side: 'left' | 'right'
  texture: THREE.Texture | null
  openRef: React.MutableRefObject<number>
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  const dir = side === 'left' ? -1 : 1

  // Show only this half of the source image (left 50% | right 50%).
  const halfTexture = useMemo(() => {
    if (!texture) return null
    const t = texture.clone()
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
    t.repeat.set(0.5, 1)
    t.offset.set(side === 'left' ? 0 : 0.5, 0)
    t.center.set(0.5, 0.5)
    t.needsUpdate = true
    return t
  }, [texture, side])

  // Subdivided plane so we can billow the cloth in the vertex positions.
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 28, 18), [])
  const basePositions = useMemo(
    () => (geometry.attributes.position.array as Float32Array).slice(),
    [geometry]
  )

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const p = THREE.MathUtils.clamp(openRef.current, 0, 1)
    const halfW = viewport.width / 2
    const fullH = viewport.height

    // Fill exactly half the viewport, with a hair of overlap at the seam so no
    // sliver of the page leaks through before the curtain parts.
    mesh.scale.set(halfW * 1.03, fullH * 1.02, 1)

    // Slide each half off its own side. A little overshoot clears the frame.
    const travel = halfW * 1.12
    mesh.position.x = dir * (halfW / 2 + p * travel)

    // Billow: peaks mid-open (sin curve), settling as the curtain clears.
    const open = Math.sin(p * Math.PI)
    const idle = 0.18 // gentle life even while closed
    const amp = THREE.MathUtils.clamp(idle + open, 0, 1) * fullH * 0.03
    const pos = geometry.attributes.position
    const t = state.clock.elapsedTime
    for (let i = 0; i < pos.count; i++) {
      const bx = basePositions[i * 3] // -0.5..0.5
      const by = basePositions[i * 3 + 1] // -0.5..0.5
      const z =
        Math.sin(bx * 9 + dir * t * 1.1) * 0.7 +
        Math.sin(by * 5 - t * 0.7) * 0.3
      // Anchor the outer edge (where it hangs) flatter than the free inner edge.
      const inner = side === 'left' ? bx + 0.5 : 0.5 - bx // 0 outer -> 1 inner
      pos.setZ(i, z * amp * (0.35 + 0.65 * inner))
    }
    pos.needsUpdate = true
    geometry.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        map={halfTexture ?? undefined}
        color={halfTexture ? '#ffffff' : VELVET}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */
function CurtainScene({
  targetRef,
}: {
  targetRef: React.MutableRefObject<number>
}) {
  // Smoothed open amount so flicks of the wheel ease instead of snapping.
  const openRef = useRef(0)
  const texture = useSharedTexture()
  useFrame((_, delta) => {
    openRef.current = THREE.MathUtils.damp(
      openRef.current,
      targetRef.current,
      6,
      delta
    )
  })

  return (
    <>
      <CurtainHalf side="left" texture={texture} openRef={openRef} />
      <CurtainHalf side="right" texture={texture} openRef={openRef} />
    </>
  )
}

/* Load the curtain texture once and share it. Returns null until ready (or on
 * error), in which case the halves fall back to a flat velvet colour so the
 * screen is never blank. */
let sharedTexture: THREE.Texture | null = null
let sharedRequested = false
function useSharedTexture(): THREE.Texture | null {
  const [tex, setTex] = useState<THREE.Texture | null>(sharedTexture)
  useEffect(() => {
    if (sharedTexture) {
      setTex(sharedTexture)
      return
    }
    if (sharedRequested) return
    sharedRequested = true
    new THREE.TextureLoader().load(
      TEXTURE_SRC,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace
        sharedTexture = t
        setTex(t)
      },
      undefined,
      () => {
        // Missing/blocked texture — stay on the velvet fallback.
        sharedRequested = false
      }
    )
  }, [])
  return tex
}

/* ------------------------------------------------------------------ */
/* Controller — scroll capture, lifecycle, overlay UI                  */
/* ------------------------------------------------------------------ */
export default function CurtainReveal() {
  const [show, setShow] = useState(false)
  const [closing, setClosing] = useState(false)
  const [bar, setBar] = useState(0)
  const targetRef = useRef(0)
  const doneRef = useRef(false)

  // Decide whether to play at all (once per browser; never for reduced-motion).
  useEffect(() => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const seen = localStorage.getItem(SEEN_KEY)
    if (reduce || seen) return
    setShow(true)
  }, [])

  // Scroll / touch / key capture while the curtain is up.
  useEffect(() => {
    if (!show) return
    const body = document.body
    const prevOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    const WHEEL = 0.0009
    const TOUCH = 0.0018
    let touchY = 0

    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      localStorage.setItem(SEEN_KEY, 'true')
      setClosing(true)
      window.setTimeout(() => {
        body.style.overflow = prevOverflow
        setShow(false)
      }, 750)
    }

    const advance = (next: number) => {
      const v = Math.min(1, Math.max(0, next))
      targetRef.current = v
      setBar(v)
      if (v >= 0.999) finish()
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      advance(targetRef.current + e.deltaY * WHEEL)
    }
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY
    }
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const y = e.touches[0].clientY
      advance(targetRef.current + (touchY - y) * TOUCH)
      touchY = y
    }
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault()
        advance(targetRef.current + 0.14)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
      body.style.overflow = prevOverflow
    }
  }, [show])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[9999]"
      style={{
        opacity: closing ? 0 : 1,
        transition: 'opacity 0.75s ease',
        pointerEvents: closing ? 'none' : 'auto',
      }}
      aria-hidden
    >
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <CurtainScene targetRef={targetRef} />
      </Canvas>

      {/* Scroll hint — fades as the curtain parts */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-10 flex flex-col items-center gap-3"
        style={{ opacity: Math.max(0, 1 - bar * 2.2) }}
      >
        <span
          className="font-serif text-[#F3E3C0]"
          style={{
            fontSize: '13px',
            letterSpacing: '0.42em',
            textTransform: 'uppercase',
            textShadow: '0 2px 18px rgba(0,0,0,0.6)',
          }}
        >
          Scroll to begin
        </span>
        <span
          className="text-[#D4AF37]"
          style={{ animation: 'wboc-bob 1.8s ease-in-out infinite' }}
        >
          ▾
        </span>
      </div>

      {/* Gold parting progress */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px]">
        <div
          className="h-full"
          style={{
            width: `${bar * 100}%`,
            margin: '0 auto',
            background:
              'linear-gradient(90deg, transparent, #D4AF37 50%, transparent)',
            boxShadow: '0 0 12px rgba(212,175,55,0.7)',
            transition: 'width 0.12s linear',
          }}
        />
      </div>

      <style>{`@keyframes wboc-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}`}</style>
    </div>
  )
}
