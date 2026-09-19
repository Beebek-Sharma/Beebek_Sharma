import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from './hooks'

type SceneQuality = 'high' | 'low'
type Motion = {
  x: number
  y: number
  targetX: number
  targetY: number
  dragging: boolean
  pointerId: number | null
  lastX: number
  lastY: number
}

function getQuality(): SceneQuality {
  if (typeof window === 'undefined') return 'low'
  const device = navigator as Navigator & { deviceMemory?: number }
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const lowMemory = typeof device.deviceMemory === 'number' && device.deviceMemory <= 4
  const lowCpu = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4
  return coarse || lowMemory || lowCpu || window.devicePixelRatio > 1.7 ? 'low' : 'high'
}

function InvalidateBridge({ invalidateRef }: { invalidateRef: MutableRefObject<() => void> }) {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    invalidateRef.current = invalidate
    return () => { invalidateRef.current = () => undefined }
  }, [invalidate, invalidateRef])
  return null
}

/* ═══════════════════════════════════════════════════════════════════
   THE RIVER OF TIME (光阴之河)
   Concentric orbital temporal rings and flowing time particles
   ═══════════════════════════════════════════════════════════════════ */

function RiverOfTime({ quality, reduced }: { quality: SceneQuality; reduced: boolean }) {
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const ring3 = useRef<THREE.Mesh>(null)
  const low = quality === 'low'

  useFrame((_, delta) => {
    if (reduced) return
    if (ring1.current) ring1.current.rotation.z += delta * 0.15
    if (ring2.current) ring2.current.rotation.z -= delta * 0.22
    if (ring3.current) ring3.current.rotation.z += delta * 0.09
  })

  return (
    <group position={[0, 0.05, 0]}>
      <mesh ref={ring1} rotation={[1.15, 0.2, 0]}>
        <torusGeometry args={[1.22, 0.007, low ? 3 : 6, low ? 36 : 64]} />
        <meshStandardMaterial color="#e5c158" roughness={0.3} metalness={0.9} transparent opacity={0.65} />
      </mesh>
      <mesh ref={ring2} rotation={[1.3, -0.3, 0.4]}>
        <torusGeometry args={[0.98, 0.005, low ? 3 : 5, low ? 30 : 54]} />
        <meshStandardMaterial color="#5b9c82" roughness={0.2} metalness={0.7} transparent opacity={0.5} />
      </mesh>
      <mesh ref={ring3} rotation={[1.05, 0.4, -0.2]}>
        <torusGeometry args={[0.74, 0.006, low ? 3 : 5, low ? 24 : 48]} />
        <meshStandardMaterial color="#c4a44e" roughness={0.35} metalness={0.8} transparent opacity={0.55} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SPRING AUTUMN CICADA (春秋蝉)
   Rank 6 Legendary Gu Insect — Detailed Jade Carapace, Gold Filigree,
   Translucent Curved Stained-Glass Wings, Emerald Compound Eyes
   ═══════════════════════════════════════════════════════════════════ */

function SpringAutumnCicada({ quality, reduced }: { quality: SceneQuality; reduced: boolean }) {
  const low = quality === 'low'
  const cicadaGroup = useRef<THREE.Group>(null)
  const wingLeftFront = useRef<THREE.Group>(null)
  const wingRightFront = useRef<THREE.Group>(null)
  const wingLeftRear = useRef<THREE.Group>(null)
  const wingRightRear = useRef<THREE.Group>(null)
  const timeRef = useRef(0)

  const wingMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#8be5c3',
    roughness: 0.16,
    metalness: 0.2,
    transmission: 0.72,
    ior: 1.45,
    thickness: 0.04,
    specularIntensity: 1.0,
    specularColor: new THREE.Color('#d4af37'),
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
  }), [])

  const veinMaterial = useMemo(() => new THREE.LineBasicMaterial({
    color: '#d4af37',
    transparent: true,
    opacity: 0.85,
  }), [])

  const forewingGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.quadraticCurveTo(0.18, 0.45, 0.48, 0.82)
    s.quadraticCurveTo(0.65, 0.98, 0.85, 0.92)
    s.quadraticCurveTo(0.96, 0.82, 0.92, 0.65)
    s.quadraticCurveTo(0.8, 0.38, 0.52, 0.12)
    s.quadraticCurveTo(0.28, -0.04, 0, 0)
    return new THREE.ShapeGeometry(s, low ? 3 : 7)
  }, [low])

  const hindwingGeo = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    s.quadraticCurveTo(0.12, 0.28, 0.32, 0.52)
    s.quadraticCurveTo(0.5, 0.62, 0.62, 0.48)
    s.quadraticCurveTo(0.58, 0.25, 0.36, 0.06)
    s.quadraticCurveTo(0.18, -0.05, 0, 0)
    return new THREE.ShapeGeometry(s, low ? 2 : 5)
  }, [low])

  const forewingVeinsGeo = useMemo(() => {
    const points: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0.002), new THREE.Vector3(0.55, 0.84, 0.002),
      new THREE.Vector3(0, 0, 0.002), new THREE.Vector3(0.72, 0.62, 0.002),
      new THREE.Vector3(0, 0, 0.002), new THREE.Vector3(0.48, 0.24, 0.002),
      new THREE.Vector3(0.22, 0.38, 0.002), new THREE.Vector3(0.35, 0.28, 0.002),
      new THREE.Vector3(0.38, 0.62, 0.002), new THREE.Vector3(0.54, 0.48, 0.002),
      new THREE.Vector3(0.55, 0.84, 0.002), new THREE.Vector3(0.75, 0.76, 0.002),
      new THREE.Vector3(0.72, 0.62, 0.002), new THREE.Vector3(0.85, 0.48, 0.002),
    ]
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  const hindwingVeinsGeo = useMemo(() => {
    const points: THREE.Vector3[] = [
      new THREE.Vector3(0, 0, 0.002), new THREE.Vector3(0.36, 0.52, 0.002),
      new THREE.Vector3(0, 0, 0.002), new THREE.Vector3(0.48, 0.38, 0.002),
      new THREE.Vector3(0.18, 0.24, 0.002), new THREE.Vector3(0.28, 0.16, 0.002),
      new THREE.Vector3(0.36, 0.52, 0.002), new THREE.Vector3(0.52, 0.44, 0.002),
    ]
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  useFrame((_, delta) => {
    if (!cicadaGroup.current) return
    timeRef.current += delta

    const t = timeRef.current
    if (!reduced) {
      const hoverY = Math.sin(t * 1.8) * 0.04
      const rollZ = Math.sin(t * 1.1) * 0.025
      const pitchX = Math.sin(t * 1.4) * 0.02
      cicadaGroup.current.position.y = 0.22 + hoverY
      cicadaGroup.current.rotation.z = rollZ
      cicadaGroup.current.rotation.x = 0.18 + pitchX

      const flutter = Math.sin(t * 3.6) * 0.12
      const microFlutter = Math.sin(t * 12.0) * 0.04

      if (wingLeftFront.current && wingRightFront.current) {
        wingLeftFront.current.rotation.z = 0.32 + flutter + microFlutter
        wingRightFront.current.rotation.z = -0.32 - flutter - microFlutter
      }
      if (wingLeftRear.current && wingRightRear.current) {
        wingLeftRear.current.rotation.z = 0.22 + flutter * 0.8
        wingRightRear.current.rotation.z = -0.22 - flutter * 0.8
      }
    }
  })

  const segs = low ? 8 : 16
  const segsSm = low ? 6 : 12

  return (
    <group ref={cicadaGroup} position={[0, 0.22, 0]} rotation={[0.18, 0, 0]} scale={1.15}>
      {/* 1. Head & Compound Eyes */}
      <group position={[0, 0.03, 0.38]}>
        <mesh scale={[1.1, 0.65, 0.75]}>
          <sphereGeometry args={[0.14, segs, segsSm]} />
          <meshStandardMaterial color="#2d7350" roughness={0.25} metalness={0.5} flatShading />
        </mesh>
        <mesh position={[0, 0.04, 0.04]} scale={[0.12, 0.03, 0.08]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#e5c158" roughness={0.22} metalness={0.88} />
        </mesh>

        {/* Left Compound Eye */}
        <mesh position={[-0.14, 0.015, 0.02]} scale={[0.85, 0.8, 1.1]}>
          <sphereGeometry args={[0.065, segsSm, segsSm]} />
          <meshStandardMaterial
            color="#22c55e"
            roughness={0.12}
            metalness={0.7}
            emissive="#15803d"
            emissiveIntensity={0.9}
          />
        </mesh>
        <mesh position={[-0.14, 0.015, 0.02]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.06, 0.007, low ? 3 : 5, low ? 10 : 18]} />
          <meshStandardMaterial color="#d4af37" roughness={0.25} metalness={0.85} />
        </mesh>

        {/* Right Compound Eye */}
        <mesh position={[0.14, 0.015, 0.02]} scale={[0.85, 0.8, 1.1]}>
          <sphereGeometry args={[0.065, segsSm, segsSm]} />
          <meshStandardMaterial
            color="#22c55e"
            roughness={0.12}
            metalness={0.7}
            emissive="#15803d"
            emissiveIntensity={0.9}
          />
        </mesh>
        <mesh position={[0.14, 0.015, 0.02]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.06, 0.007, low ? 3 : 5, low ? 10 : 18]} />
          <meshStandardMaterial color="#d4af37" roughness={0.25} metalness={0.85} />
        </mesh>

        {/* Ocelli */}
        {[-0.035, 0, 0.035].map((x, i) => (
          <mesh key={i} position={[x, 0.08, 0.02]}>
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshStandardMaterial color="#fef08a" roughness={0.1} emissive="#ca8a04" emissiveIntensity={0.7} />
          </mesh>
        ))}

        {/* Antennae */}
        <mesh position={[-0.06, 0.06, 0.12]} rotation={[-0.45, -0.3, 0.35]}>
          <cylinderGeometry args={[0.004, 0.007, 0.22, low ? 3 : 5]} />
          <meshStandardMaterial color="#e5c158" roughness={0.25} metalness={0.85} />
        </mesh>
        <mesh position={[-0.095, 0.14, 0.21]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#fef08a" roughness={0.2} metalness={0.9} />
        </mesh>

        <mesh position={[0.06, 0.06, 0.12]} rotation={[-0.45, 0.3, -0.35]}>
          <cylinderGeometry args={[0.004, 0.007, 0.22, low ? 3 : 5]} />
          <meshStandardMaterial color="#e5c158" roughness={0.25} metalness={0.85} />
        </mesh>
        <mesh position={[0.095, 0.14, 0.21]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color="#fef08a" roughness={0.2} metalness={0.9} />
        </mesh>
      </group>

      {/* 2. Thorax */}
      <group position={[0, 0.02, 0.16]}>
        <mesh scale={[1.25, 0.8, 1.1]}>
          <sphereGeometry args={[0.18, segs, segsSm]} />
          <meshStandardMaterial color="#1a4d36" roughness={0.32} metalness={0.45} flatShading />
        </mesh>
        <mesh position={[0, 0.13, 0]} scale={[0.04, 0.035, 0.36]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#d4af37" roughness={0.25} metalness={0.88} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.04]}>
          <torusGeometry args={[0.18, 0.012, low ? 3 : 6, low ? 16 : 28]} />
          <meshStandardMaterial color="#e5c158" roughness={0.25} metalness={0.85} />
        </mesh>
        <mesh position={[0, -0.01, 0]}>
          <sphereGeometry args={[0.09, low ? 8 : 14, low ? 6 : 10]} />
          <meshStandardMaterial color="#4ade80" roughness={0.1} metalness={0.5} emissive="#16a34a" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* 3. Segmented Jade Abdomen */}
      <group position={[0, -0.01, -0.08]}>
        {[
          { z: 0.0, r: 0.19, h: 0.12, col: '#2d7350', goldR: 0.192 },
          { z: -0.11, r: 0.17, h: 0.11, col: '#256345', goldR: 0.172 },
          { z: -0.21, r: 0.15, h: 0.1, col: '#1f533a', goldR: 0.152 },
          { z: -0.3, r: 0.13, h: 0.09, col: '#1a4430', goldR: 0.132 },
          { z: -0.38, r: 0.1, h: 0.08, col: '#163827', goldR: 0.102 },
          { z: -0.45, r: 0.075, h: 0.07, col: '#122c1f', goldR: 0.078 },
        ].map((tier, idx) => (
          <group key={idx} position={[0, -idx * 0.012, tier.z]}>
            <mesh scale={[1.1, 0.72, 1]}>
              <cylinderGeometry args={[tier.r * 0.92, tier.r, tier.h, segs]} />
              <meshStandardMaterial color={tier.col} roughness={0.28} metalness={0.4} flatShading />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, tier.h * 0.45]}>
              <torusGeometry args={[tier.goldR, 0.008, low ? 3 : 5, low ? 14 : 26]} />
              <meshStandardMaterial color="#d4af37" roughness={0.22} metalness={0.88} />
            </mesh>
          </group>
        ))}

        <mesh position={[0, -0.08, -0.54]} rotation={[Math.PI / 2, 0, 0]} scale={[0.9, 1, 0.6]}>
          <coneGeometry args={[0.055, 0.15, segs]} />
          <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.9} />
        </mesh>
      </group>

      {/* 4. Translucent Wings */}
      <group ref={wingLeftFront} position={[-0.08, 0.09, 0.14]} rotation={[0.15, -0.4, 0.32]}>
        <mesh geometry={forewingGeo} material={wingMaterial} scale={1.18} />
        <lineSegments scale={1.18}>
          <edgesGeometry args={[forewingGeo]} />
          <primitive object={veinMaterial} attach="material" />
        </lineSegments>
        <lineSegments geometry={forewingVeinsGeo} material={veinMaterial} scale={1.18} />
      </group>

      <group ref={wingRightFront} position={[0.08, 0.09, 0.14]} rotation={[0.15, 0.4, -0.32]}>
        <mesh geometry={forewingGeo} material={wingMaterial} scale={[-1.18, 1.18, 1.18]} />
        <lineSegments scale={[-1.18, 1.18, 1.18]}>
          <edgesGeometry args={[forewingGeo]} />
          <primitive object={veinMaterial} attach="material" />
        </lineSegments>
        <lineSegments geometry={forewingVeinsGeo} material={veinMaterial} scale={[-1.18, 1.18, 1.18]} />
      </group>

      <group ref={wingLeftRear} position={[-0.07, 0.06, 0.04]} rotation={[0.2, -0.3, 0.22]}>
        <mesh geometry={hindwingGeo} material={wingMaterial} scale={1.1} />
        <lineSegments scale={1.1}>
          <edgesGeometry args={[hindwingGeo]} />
          <primitive object={veinMaterial} attach="material" />
        </lineSegments>
        <lineSegments geometry={hindwingVeinsGeo} material={veinMaterial} scale={1.1} />
      </group>

      <group ref={wingRightRear} position={[0.07, 0.06, 0.04]} rotation={[0.2, 0.3, -0.22]}>
        <mesh geometry={hindwingGeo} material={wingMaterial} scale={[-1.1, 1.1, 1.1]} />
        <lineSegments scale={[-1.1, 1.1, 1.1]}>
          <edgesGeometry args={[hindwingGeo]} />
          <primitive object={veinMaterial} attach="material" />
        </lineSegments>
        <lineSegments geometry={hindwingVeinsGeo} material={veinMaterial} scale={[-1.1, 1.1, 1.1]} />
      </group>

      {/* 5. Six Articulated Legs */}
      {[
        { side: -1, z: 0.26, rotY: 0.35, rotZ: -0.42, len: 0.18 },
        { side: 1, z: 0.26, rotY: -0.35, rotZ: 0.42, len: 0.18 },
        { side: -1, z: 0.14, rotY: 0.05, rotZ: -0.55, len: 0.22 },
        { side: 1, z: 0.14, rotY: -0.05, rotZ: 0.55, len: 0.22 },
        { side: -1, z: 0.02, rotY: -0.45, rotZ: -0.48, len: 0.26 },
        { side: 1, z: 0.02, rotY: 0.45, rotZ: 0.48, len: 0.26 },
      ].map((leg, i) => (
        <group key={i} position={[leg.side * 0.11, -0.05, leg.z]} rotation={[0, leg.rotY, leg.rotZ]}>
          <mesh>
            <sphereGeometry args={[0.02, 6, 6]} />
            <meshStandardMaterial color="#d4af37" roughness={0.25} metalness={0.88} />
          </mesh>
          <mesh position={[leg.side * (leg.len * 0.25), -0.06, 0]} rotation={[0, 0, leg.side * 0.4]}>
            <cylinderGeometry args={[0.008, 0.012, leg.len * 0.6, low ? 3 : 5]} />
            <meshStandardMaterial color="#2d7350" roughness={0.35} metalness={0.4} />
          </mesh>
          <mesh position={[leg.side * (leg.len * 0.6), -0.14, 0]} rotation={[0, 0, -leg.side * 0.35]}>
            <cylinderGeometry args={[0.004, 0.008, leg.len * 0.7, low ? 3 : 5]} />
            <meshStandardMaterial color="#e5c158" roughness={0.25} metalness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   CICADA PEDESTAL
   ═══════════════════════════════════════════════════════════════════ */

function CicadaPedestal({ quality }: { quality: SceneQuality }) {
  const low = quality === 'low'
  const segs = low ? 24 : 48

  return (
    <group position={[0, -0.85, 0]}>
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[1.05, 1.12, 0.14, segs]} />
        <meshStandardMaterial color="#0b100e" roughness={0.4} metalness={0.65} />
      </mesh>
      <mesh position={[0, -0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.06, 0.012, low ? 4 : 8, low ? 32 : 56]} />
        <meshStandardMaterial color="#d4af37" roughness={0.25} metalness={0.85} />
      </mesh>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.96, 1.02, 0.18, segs]} />
        <meshStandardMaterial color="#0f1614" roughness={0.35} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.95, 0.01, low ? 4 : 8, low ? 32 : 56]} />
        <meshStandardMaterial color="#c4a44e" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.88, 0.94, 0.12, segs]} />
        <meshStandardMaterial color="#080d0b" roughness={0.22} metalness={0.75} />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.88, 0.014, low ? 4 : 8, low ? 32 : 56]} />
        <meshStandardMaterial color="#e5c158" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Nameplate plaque */}
      <group position={[0, 0.01, 1.01]}>
        <mesh scale={[0.48, 0.13, 0.016]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#060a08" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh scale={[0.5, 0.145, 0.008]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#d4af37" roughness={0.28} metalness={0.85} />
        </mesh>
        <mesh position={[-0.08, 0.005, 0.01]} scale={[0.07, 0.055, 0.004]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#f0cf65" roughness={0.2} metalness={0.9} emissive="#523d0c" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0.08, 0.005, 0.01]} scale={[0.07, 0.055, 0.004]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#f0cf65" roughness={0.2} metalness={0.9} emissive="#523d0c" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0, 0.005, 0.012]}>
          <sphereGeometry args={[0.022, low ? 6 : 12, low ? 6 : 10]} />
          <meshStandardMaterial color="#4ade80" roughness={0.15} metalness={0.6} emissive="#166534" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  )
}

function CicadaRelicGeometry({
  quality,
  reduced,
  motion,
}: {
  quality: SceneQuality
  reduced: boolean
  motion: MutableRefObject<Motion>
}) {
  const relicGroup = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!relicGroup.current) return
    const m = motion.current
    if (!m.dragging && !reduced && quality === 'high') {
      m.targetY += delta * 0.04
    }
    m.x = THREE.MathUtils.damp(m.x, m.targetX, quality === 'low' ? 7 : 9, delta)
    m.y = THREE.MathUtils.damp(m.y, m.targetY, quality === 'low' ? 7 : 9, delta)
    relicGroup.current.rotation.set(m.x, m.y, 0)
  })

  return (
    <group ref={relicGroup} rotation={[0.18, -0.35, 0]}>
      <SpringAutumnCicada quality={quality} reduced={reduced} />
      <RiverOfTime quality={quality} reduced={reduced} />
      <CicadaPedestal quality={quality} />
    </group>
  )
}

export function CicadaScene() {
  const reduced = useReducedMotion()
  const quality = useMemo(getQuality, [])
  const sceneRef = useRef<HTMLDivElement>(null)
  const invalidateRef = useRef<() => void>(() => undefined)
  const motion = useRef<Motion>({
    x: 0.18,
    y: -0.35,
    targetX: 0.18,
    targetY: -0.35,
    dragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
  })
  const [visible, setVisible] = useState(true)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!sceneRef.current) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.05,
    })
    observer.observe(sceneRef.current)
    return () => observer.disconnect()
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    motion.current.dragging = true
    motion.current.pointerId = event.pointerId
    motion.current.lastX = event.clientX
    motion.current.lastY = event.clientY
    setDragging(true)
    invalidateRef.current()
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const state = motion.current
    if (!state.dragging || state.pointerId !== event.pointerId) return
    event.preventDefault()
    const dx = event.clientX - state.lastX
    const dy = event.clientY - state.lastY
    state.targetY = THREE.MathUtils.clamp(state.targetY + dx * 0.007, -1.8, 1.8)
    state.targetX = THREE.MathUtils.clamp(state.targetX + dy * 0.007, -0.85, 0.85)
    state.lastX = event.clientX
    state.lastY = event.clientY
    invalidateRef.current()
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (motion.current.pointerId !== event.pointerId) return
    motion.current.dragging = false
    motion.current.pointerId = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    invalidateRef.current()
  }

  const frameMode = !visible ? 'never' : quality === 'high' && !reduced ? 'always' : 'demand'

  return (
    <div
      ref={sceneRef}
      className={`fang-scene ${dragging ? 'is-dragging' : ''} quality-${quality}`}
      role="img"
      aria-label="Interactive 3D Spring Autumn Cicada (春秋蝉) artifact. Drag or swipe to inspect."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="fang-scene-grid" aria-hidden="true" />
      <Canvas
        camera={{ position: [0, 0.42, 2.7], fov: 38 }}
        dpr={quality === 'low' ? 1 : [1, 1.35]}
        frameloop={frameMode}
        gl={{ antialias: quality === 'high', powerPreference: 'low-power' }}
      >
        <InvalidateBridge invalidateRef={invalidateRef} />
        <ambientLight intensity={0.55} />
        <pointLight
          color="#fef08a"
          intensity={quality === 'low' ? 1.4 : 2.5}
          distance={7}
          position={[2.2, 2.5, 3.2]}
        />
        <pointLight
          color="#4ade80"
          intensity={quality === 'low' ? 0.9 : 1.8}
          distance={6}
          position={[-2.4, 1.8, -1.5]}
        />
        <pointLight
          color="#22c55e"
          intensity={quality === 'low' ? 0.6 : 1.2}
          distance={4}
          position={[0, -0.7, 1.2]}
        />
        <CicadaRelicGeometry quality={quality} reduced={reduced} motion={motion} />
      </Canvas>

      <div className="fang-scene-label">
        <span>春秋蝉 · RANK 6 GU</span>
        <span>DRAG TO ROTATE</span>
      </div>
    </div>
  )
}

export function CicadaFallback() {
  return (
    <div className="fang-scene-fallback" role="img" aria-label="Spring Autumn Cicada 3D artifact loading">
      <span>春秋蝉 · RANK 6 GU</span>
      <i aria-hidden="true" />
      <small>TIME PATH · REVEREND INSANITY</small>
    </div>
  )
}
