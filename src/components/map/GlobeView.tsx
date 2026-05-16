'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { Company } from '@/lib/supabase'

function latLngToXYZ(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setOpacity(1), 300)
    return () => clearTimeout(timer)
  }, [])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.12
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        color="#111111"
        metalness={0.2}
        roughness={0.6}
        emissive="#C9A961"
        emissiveIntensity={0.04}
        transparent
        opacity={opacity}
      />
    </mesh>
  )
}

function CompanyMarker({
  company,
  onHover,
}: {
  company: Company
  onHover: (company: Company | null) => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const position = useMemo(
    () => latLngToXYZ(company.lat, company.lng, 2.05),
    [company.lat, company.lng]
  )

  useFrame(() => {
    if (meshRef.current) {
      const scale = hovered ? 2.5 : 1.5
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(meshRef.current.scale.x, scale, 0.1)
      )
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={() => { setHovered(true); onHover(company) }}
      onPointerLeave={() => { setHovered(false); onHover(null) }}
    >
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial
        color={hovered ? '#FFD700' : '#C9A961'}
        emissive={hovered ? '#FFD700' : '#C9A961'}
        emissiveIntensity={hovered ? 2.0 : 0.8}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  )
}

export default function GlobeView() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [hoveredCompany, setHoveredCompany] = useState<Company | null>(null)

  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.json())
      .then(data => setCompanies(data.companies ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-8, -8, -8]} intensity={0.3} color="#C9A961" />

        <Globe />

        {companies.map(company => (
          <CompanyMarker
            key={company.id}
            company={company}
            onHover={setHoveredCompany}
          />
        ))}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.8}
        />
      </Canvas>

      {hoveredCompany && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#0A0A0A]/90 border border-[#C9A961]/30 backdrop-blur-sm pointer-events-none">
          <p className="text-[#C9A961] text-[9px] tracking-widest uppercase mb-1">
            {hoveredCompany.type} · {hoveredCompany.city}
          </p>
          <p className="text-white text-sm font-light">
            {hoveredCompany.name}
          </p>
        </div>
      )}
    </div>
  )
}
