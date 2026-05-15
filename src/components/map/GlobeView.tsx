'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

function Sphere() {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <mesh ref={meshRef} rotation={[0, 0.5, 0]}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial
        color="#1a1a1a"
        metalness={0.3}
        roughness={0.4}
        emissive="#c9a961"
        emissiveIntensity={0.1}
      />
    </mesh>
  )
}

export default function GlobeView() {
  return (
    <Canvas camera={{ position: [0, 0, 4.5] }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#c9a961" />
      <Sphere />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={2}
      />
    </Canvas>
  )
}
