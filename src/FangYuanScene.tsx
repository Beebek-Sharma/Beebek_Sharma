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
   3D RIVER OF TIME RINGS (光阴之河环)
   Encircle Fang Yuan in true 3D spatial depth
   ═══════════════════════════════════════════════════════════════════ */

function RiverOfTimeRings({ quality, reduced }: { quality: SceneQuality; reduced: boolean }) {
  const ring1 = useRef<THREE.Mesh>(null)
  const ring2 = useRef<THREE.Mesh>(null)
  const ring3 = useRef<THREE.Mesh>(null)
  const low = quality === 'low'

  useFrame((_, delta) => {
    if (reduced) return
    if (ring1.current) ring1.current.rotation.z += delta * 0.12
    if (ring2.current) ring2.current.rotation.z -= delta * 0.18
    if (ring3.current) ring3.current.rotation.z += delta * 0.08
  })

  return (
    <group position={[0, -0.15, 0]}>
      {/* Outer Golden Time Stream */}
      <mesh ref={ring1} rotation={[1.18, 0.22, 0]}>
        <torusGeometry args={[1.32, 0.007, low ? 3 : 6, low ? 36 : 64]} />
        <meshStandardMaterial color="#e5c158" roughness={0.3} metalness={0.9} transparent opacity={0.65} />
      </mesh>
      {/* Middle Counter-rotating Emerald Ring */}
      <mesh ref={ring2} rotation={[1.32, -0.28, 0.35]}>
        <torusGeometry args={[1.08, 0.005, low ? 3 : 5, low ? 30 : 54]} />
        <meshStandardMaterial color="#5b9c82" roughness={0.2} metalness={0.7} transparent opacity={0.55} />
      </mesh>
      {/* Inner Gu Seal Ring */}
      <mesh ref={ring3} rotation={[1.02, 0.38, -0.18]}>
        <torusGeometry args={[0.82, 0.006, low ? 3 : 5, low ? 24 : 48]} />
        <meshStandardMaterial color="#c4a44e" roughness={0.35} metalness={0.8} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   3D TEMPORAL SPARKS / ESSENCE MOTES
   Float with genuine 3D depth in front of and behind Fang Yuan
   ═══════════════════════════════════════════════════════════════════ */

function TemporalSparks({ quality, reduced }: { quality: SceneQuality; reduced: boolean }) {
  const count = quality === 'low' ? 18 : 36
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, basePositions } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const base = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 1.8
      const y = (Math.random() - 0.5) * 2.4
      const z = (Math.random() - 0.5) * 1.0 // depth in front and behind
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = z
      base[i * 3] = x
      base[i * 3 + 1] = y
      base[i * 3 + 2] = z
    }
    return { positions: pos, basePositions: base }
  }, [count])

  useFrame((state) => {
    if (reduced || !pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array
    const t = state.clock.getElapsedTime()

    for (let i = 0; i < count; i++) {
      const idx = i * 3
      // Drift gently upward and oscillate horizontally
      arr[idx + 1] = ((basePositions[idx + 1] + t * 0.15 + 1.2) % 2.4) - 1.2
      arr[idx] = basePositions[idx] + Math.sin(t * 1.2 + i) * 0.04
    }
    posAttr.needsUpdate = true
  })

  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      grad.addColorStop(0, 'rgba(254, 240, 138, 1)')
      grad.addColorStop(0.3, 'rgba(91, 156, 130, 0.8)')
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 32, 32)
    }
    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }, [])

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={quality === 'low' ? 0.055 : 0.075}
        map={particleTexture}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   3D FANG YUAN HIGH-FIDELITY DIORAMA PLANE
   Uses high-res reference art with soft-edge shader blending
   ═══════════════════════════════════════════════════════════════════ */

function FangYuanDiorama() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    loader.load('/fang-yuan.jpg', (loadedTex) => {
      loadedTex.colorSpace = THREE.SRGBColorSpace
      loadedTex.minFilter = THREE.LinearMipmapLinearFilter
      loadedTex.magFilter = THREE.LinearFilter
      loadedTex.generateMipmaps = true
      setTexture(loadedTex)
    })
  }, [])

  // Custom shader that softly feathers the outer boundary into #050807
  const material = useMemo(() => {
    if (!texture) return null
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(uTexture, vUv);
          
          // Soft edge feathering so borders melt seamlessly into #050807
          float edgeX = smoothstep(0.0, 0.045, vUv.x) * smoothstep(1.0, 0.955, vUv.x);
          float edgeY = smoothstep(0.0, 0.035, vUv.y) * smoothstep(1.0, 0.965, vUv.y);
          float edgeAlpha = edgeX * edgeY;

          gl_FragColor = vec4(color.rgb, color.a * edgeAlpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    })
  }, [texture])

  if (!material) return null

  // Aspect ratio is 775/1024 ≈ 0.757
  const height = 2.15
  const width = height * 0.757

  return (
    <group position={[0, -0.14, 0]}>
      <mesh material={material}>
        <planeGeometry args={[width, height, 1, 1]} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   3D ANCHORING PLINTH & GOLD PEDESTAL TRIM
   ═══════════════════════════════════════════════════════════════════ */

function PedestalBase({ quality }: { quality: SceneQuality }) {
  const low = quality === 'low'
  const segs = low ? 24 : 48

  return (
    <group position={[0, -1.18, 0]}>
      {/* Lower Obsidian Base */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.96, 1.02, 0.12, segs]} />
        <meshStandardMaterial color="#0b100e" roughness={0.4} metalness={0.65} />
      </mesh>
      {/* Gold Trim Ring 1 */}
      <mesh position={[0, -0.01, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.97, 0.011, low ? 4 : 8, low ? 32 : 56]} />
        <meshStandardMaterial color="#d4af37" roughness={0.25} metalness={0.88} />
      </mesh>
      {/* Upper Altar Lip */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.88, 0.94, 0.08, segs]} />
        <meshStandardMaterial color="#060908" roughness={0.25} metalness={0.75} />
      </mesh>
      {/* Gold Top Rim */}
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.89, 0.012, low ? 4 : 8, low ? 32 : 56]} />
        <meshStandardMaterial color="#e5c158" roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   ASSEMBLED 3D FANG YUAN DIORAMA SCENE
   ═══════════════════════════════════════════════════════════════════ */

function FangYuanShowcaseGeometry({
  quality,
  reduced,
  motion,
}: {
  quality: SceneQuality
  reduced: boolean
  motion: MutableRefObject<Motion>
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!group.current) return
    const m = motion.current
    if (!m.dragging && !reduced && quality === 'high') {
      m.targetY += delta * 0.035
    }
    m.x = THREE.MathUtils.damp(m.x, m.targetX, quality === 'low' ? 7 : 9, delta)
    m.y = THREE.MathUtils.damp(m.y, m.targetY, quality === 'low' ? 7 : 9, delta)
    group.current.rotation.set(m.x, m.y, 0)
  })

  return (
    <group ref={group} rotation={[0.08, -0.2, 0]}>
      <FangYuanDiorama />
      <RiverOfTimeRings quality={quality} reduced={reduced} />
      <TemporalSparks quality={quality} reduced={reduced} />
      <PedestalBase quality={quality} />
    </group>
  )
}

export function FangYuanScene() {
  const reduced = useReducedMotion()
  const quality = useMemo(getQuality, [])
  const sceneRef = useRef<HTMLDivElement>(null)
  const invalidateRef = useRef<() => void>(() => undefined)
  const motion = useRef<Motion>({
    x: 0.08,
    y: -0.2,
    targetX: 0.08,
    targetY: -0.2,
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
      aria-label="Interactive 3D Fang Yuan (方源) Collectible Showcase. Drag or swipe to inspect."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="fang-scene-grid" aria-hidden="true" />
      <Canvas
        camera={{ position: [0, 0.0, 2.95], fov: 42 }}
        dpr={quality === 'low' ? 1 : [1, 1.35]}
        frameloop={frameMode}
        gl={{ antialias: quality === 'high', powerPreference: 'low-power' }}
      >
        <InvalidateBridge invalidateRef={invalidateRef} />
        <ambientLight intensity={0.6} />

        {/* Warm Golden Key Light illuminating the 3D River of Time rings */}
        <pointLight
          color="#fef08a"
          intensity={quality === 'low' ? 1.4 : 2.5}
          distance={7}
          position={[2.4, 2.5, 3.2]}
        />

        {/* Emerald Rim Light */}
        <pointLight
          color="#4ade80"
          intensity={quality === 'low' ? 0.9 : 1.8}
          distance={6}
          position={[-2.4, 1.8, -1.5]}
        />

        {/* Base Under-glow */}
        <pointLight
          color="#22c55e"
          intensity={quality === 'low' ? 0.6 : 1.2}
          distance={4}
          position={[0, -0.8, 1.2]}
        />

        <FangYuanShowcaseGeometry quality={quality} reduced={reduced} motion={motion} />
      </Canvas>

      <div className="fang-scene-label">
        <span>方源 · FANG YUAN</span>
        <span>DRAG TO ROTATE</span>
      </div>
    </div>
  )
}

export function FangYuanFallback() {
  return (
    <div className="fang-scene-fallback" role="img" aria-label="Fang Yuan 3D showcase loading">
      <span>方源 · FANG YUAN</span>
      <i aria-hidden="true" />
      <small>GREAT LOVE IMMORTAL VENERABLE</small>
    </div>
  )
}
