'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { gsap } from '@/lib/gsap'
import type { Company } from '@/lib/supabase'

interface GlobeViewProps {
  focusCountry?: string | null
  highlightedCompanyIds?: string[]
}

function latLngToXYZ(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function Globe({ dragging }: { dragging: React.MutableRefObject<boolean> }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [opacity, setOpacity] = useState(0)
  // Timestamp until which auto-rotation stays paused after a drag ends.
  const resumeAt = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 300)
    return () => clearTimeout(timer)
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    if (dragging.current) {
      // While dragging, hold rotation and defer resume.
      resumeAt.current = state.clock.elapsedTime + 2.5
      return
    }
    if (state.clock.elapsedTime < resumeAt.current) return
    meshRef.current.rotation.y += delta * 0.12
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        color="#1B2A4A"
        metalness={0.3}
        roughness={0.55}
        emissive="#1B2A4A"
        emissiveIntensity={0.25}
        transparent
        opacity={opacity}
      />
    </mesh>
  )
}

function CompanyMarker({
  company,
  onHover,
  isHighlighted,
}: {
  company: Company
  onHover: (company: Company | null) => void
  isHighlighted: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const [hovered, setHovered] = useState(false)
  const position = useMemo(
    () => latLngToXYZ(company.lat, company.lng, 2.05),
    [company.lat, company.lng]
  )

  useFrame((state) => {
    if (!meshRef.current) return
    const baseScale = isHighlighted ? 3.0 : 1.5
    const targetScale = hovered ? Math.max(baseScale, 2.5) : baseScale
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1)
    )

    if (materialRef.current) {
      let intensity = hovered ? 2.0 : 0.8
      if (isHighlighted) {
        const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 3)
        intensity = 1.8 + pulse * 1.4
      }
      materialRef.current.emissiveIntensity = intensity
    }
  })

  const color = hovered || isHighlighted ? '#FFD700' : '#C9A961'

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={() => { setHovered(true); onHover(company) }}
      onPointerLeave={() => { setHovered(false); onHover(null) }}
    >
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  )
}

function CameraController({
  focusCountry,
  companies,
}: {
  focusCountry?: string | null
  companies: Company[]
}) {
  const { camera } = useThree()

  useEffect(() => {
    let target: THREE.Vector3

    if (focusCountry) {
      const matches = companies.filter(c => c.country === focusCountry)
      if (matches.length > 0) {
        const avgLat = matches.reduce((s, c) => s + c.lat, 0) / matches.length
        const avgLng = matches.reduce((s, c) => s + c.lng, 0) / matches.length
        // Camera sits on the ray through the surface point, at distance ~5.
        target = latLngToXYZ(avgLat, avgLng, 5)
      } else {
        target = new THREE.Vector3(0, 0, 5)
      }
    } else {
      target = new THREE.Vector3(0, 0, 5)
    }

    const tween = gsap.to(camera.position, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => camera.lookAt(0, 0, 0),
    })

    return () => {
      tween.kill()
    }
  }, [focusCountry, companies, camera])

  return null
}

export default function GlobeView({ focusCountry, highlightedCompanyIds }: GlobeViewProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [hoveredCompany, setHoveredCompany] = useState<Company | null>(null)
  const dragging = useRef(false)

  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => setCompanies(data.companies ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="relative w-full h-full" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-8, -8, -8]} intensity={0.3} color="#C9A961" />

        <Globe dragging={dragging} />

        {companies.map(company => (
          <CompanyMarker
            key={company.id}
            company={company}
            onHover={setHoveredCompany}
            isHighlighted={highlightedCompanyIds?.includes(company.id) ?? false}
          />
        ))}

        <CameraController focusCountry={focusCountry} companies={companies} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={true}
          autoRotate={false}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.8}
          onStart={() => { dragging.current = true }}
          onEnd={() => { dragging.current = false }}
        />
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
