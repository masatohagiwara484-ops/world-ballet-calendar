'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { useRef, useState, useEffect, useMemo, Suspense } from 'react'
import * as THREE from 'three'
import { gsap } from '@/lib/gsap'
import type { Company } from '@/lib/supabase'

const GLOBE_RADIUS = 2

interface GlobeViewProps {
  focusCountry?: string | null
  highlightedCompanyIds?: string[]
}

/** Convert geographic coordinates to a point on a sphere of the given radius. */
function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

/** The textured Earth surface plus a drifting cloud layer. */
function Earth() {
  const [colorMap, specularMap, cloudMap] = useTexture([
    '/textures/earth.jpg',
    '/textures/earth-specular.jpg',
    '/textures/earth-clouds.png',
  ])

  colorMap.colorSpace = THREE.SRGBColorSpace
  colorMap.anisotropy = 8

  const cloudsRef = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.012
  })

  return (
    <>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
        <meshPhongMaterial
          map={colorMap}
          specularMap={specularMap}
          specular={new THREE.Color('#3a4b5c')}
          shininess={16}
        />
      </mesh>
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[GLOBE_RADIUS * 1.012, 64, 64]} />
        <meshPhongMaterial
          color="#ffffff"
          alphaMap={cloudMap}
          transparent
          opacity={0.42}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

/** A soft luminous halo around the planet. */
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS * 1.16, 64, 64]} />
      <meshBasicMaterial
        color="#8FBEEA"
        transparent
        opacity={0.14}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}

/** A glowing gold pin marking a company's home city, pinned to the surface. */
function CompanyMarker({
  company,
  isHighlighted,
  onHover,
}: {
  company: Company
  isHighlighted: boolean
  onHover: (company: Company | null) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered, setHovered] = useState(false)
  const position = useMemo(
    () => latLngToVector3(company.lat, company.lng, GLOBE_RADIUS + 0.03),
    [company.lat, company.lng]
  )

  useFrame((state) => {
    if (!meshRef.current) return
    const base = isHighlighted ? 1.9 : 1
    const target = hovered ? 2.4 : base
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, target, 0.15)
    )
    if (matRef.current) {
      let intensity = hovered ? 2.4 : 1.1
      if (isHighlighted) {
        const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3)
        intensity = 1.8 + pulse * 1.6
      }
      matRef.current.emissiveIntensity = intensity
    }
  })

  const color = hovered || isHighlighted ? '#FFE08A' : '#D4AF37'

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        onHover(company)
      }}
      onPointerOut={() => {
        setHovered(false)
        onHover(null)
      }}
    >
      <sphereGeometry args={[0.035, 16, 16]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={color}
        emissiveIntensity={1.1}
        metalness={0.4}
        roughness={0.3}
        toneMapped={false}
      />
    </mesh>
  )
}

interface GlobeSceneProps {
  groupRef: React.MutableRefObject<THREE.Group | null>
  draggingRef: React.MutableRefObject<boolean>
  companies: Company[]
  focusCountry?: string | null
  highlightedCompanyIds?: string[]
  onHover: (company: Company | null) => void
}

/**
 * The rotating planet group. All rotation — auto-spin, drag, and country
 * fly-to — is applied to a single group so nothing can fight anything else
 * (the camera stays fixed). Markers are children of this group, so they stay
 * pinned to their geographic coordinates as the Earth turns.
 */
function GlobeScene({
  groupRef,
  draggingRef,
  companies,
  focusCountry,
  highlightedCompanyIds,
  onHover,
}: GlobeSceneProps) {
  const idleTimer = useRef(0)
  const focusing = useRef(false)

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    if (focusing.current) return
    if (draggingRef.current) {
      idleTimer.current = 3
      return
    }
    if (idleTimer.current > 0) {
      idleTimer.current -= delta
      return
    }
    g.rotation.y += delta * 0.085
  })

  // Intro reveal once the textures have resolved and the group is mounted.
  useEffect(() => {
    const g = groupRef.current
    if (!g) return
    gsap.from(g.scale, { x: 0.85, y: 0.85, z: 0.85, duration: 1.4, ease: 'power3.out' })
  }, [groupRef])

  // Country fly-to: rotate the whole planet so the selected country faces the
  // camera. Levels the planet back upright when the filter is cleared.
  useEffect(() => {
    const g = groupRef.current
    if (!g) return

    if (focusCountry) {
      const matches = companies.filter((c) => c.country === focusCountry)
      if (matches.length === 0) return
      const avgLat = matches.reduce((s, c) => s + c.lat, 0) / matches.length
      const avgLng = matches.reduce((s, c) => s + c.lng, 0) / matches.length
      const v = latLngToVector3(avgLat, avgLng, 1)
      const ry = Math.atan2(-v.x, v.z)
      const rx = Math.atan2(v.y, Math.sqrt(v.x * v.x + v.z * v.z))
      // Take the shortest angular path from the current spin position.
      const ny = ry + Math.PI * 2 * Math.round((g.rotation.y - ry) / (Math.PI * 2))

      focusing.current = true
      const tween = gsap.to(g.rotation, {
        x: rx,
        y: ny,
        duration: 1.6,
        ease: 'power2.inOut',
        onComplete: () => {
          focusing.current = false
        },
      })
      return () => {
        tween.kill()
        focusing.current = false
      }
    }

    if (Math.abs(g.rotation.x) < 0.001) return
    focusing.current = true
    const tween = gsap.to(g.rotation, {
      x: 0,
      duration: 1,
      ease: 'power2.inOut',
      onComplete: () => {
        focusing.current = false
      },
    })
    return () => {
      tween.kill()
      focusing.current = false
    }
  }, [focusCountry, companies, groupRef])

  return (
    <group ref={groupRef}>
      <Earth />
      {companies.map((company) => (
        <CompanyMarker
          key={company.id}
          company={company}
          isHighlighted={highlightedCompanyIds?.includes(company.id) ?? false}
          onHover={onHover}
        />
      ))}
    </group>
  )
}

export default function GlobeView({ focusCountry, highlightedCompanyIds }: GlobeViewProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [hoveredCompany, setHoveredCompany] = useState<Company | null>(null)
  const groupRef = useRef<THREE.Group | null>(null)
  const draggingRef = useRef(false)
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    fetch('/api/companies')
      .then((res) => res.json())
      .then((data) => setCompanies(data.companies ?? []))
      .catch(() => {})
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true
    pointer.current = { x: e.clientX, y: e.clientY }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !groupRef.current) return
    const dx = e.clientX - pointer.current.x
    const dy = e.clientY - pointer.current.y
    pointer.current = { x: e.clientX, y: e.clientY }
    groupRef.current.rotation.y += dx * 0.006
    groupRef.current.rotation.x = THREE.MathUtils.clamp(
      groupRef.current.rotation.x + dy * 0.006,
      -0.65,
      0.65
    )
  }

  const endDrag = () => {
    draggingRef.current = false
  }

  return (
    <div
      className="relative w-full h-full cursor-grab active:cursor-grabbing"
      aria-hidden="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 3, 5]} intensity={1.7} color="#fff6e8" />
        <directionalLight position={[-6, -2, -4]} intensity={0.3} color="#9ab8d8" />

        <Atmosphere />

        <Suspense fallback={null}>
          <GlobeScene
            groupRef={groupRef}
            draggingRef={draggingRef}
            companies={companies}
            focusCountry={focusCountry}
            highlightedCompanyIds={highlightedCompanyIds}
            onHover={setHoveredCompany}
          />
        </Suspense>
      </Canvas>

      {hoveredCompany && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/95 border border-[#1A1A1A]/[0.08] backdrop-blur-sm shadow-card pointer-events-none">
          <p className="text-[#D4AF37] text-[9px] tracking-widest uppercase mb-1">
            {hoveredCompany.type} · {hoveredCompany.city}
          </p>
          <p className="text-[#1A1A1A] text-sm font-light">
            {hoveredCompany.name}
          </p>
        </div>
      )}
    </div>
  )
}
