import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, useGLTF } from '@react-three/drei'
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ErrorInfo, MutableRefObject, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
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

const fangYuanModelUrl = '/models/Fang_Yuan_Web1.glb'

class FangYuanModelErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unable to load the Fang Yuan model.', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fang-scene-fallback" role="img" aria-label="Fang Yuan 3D model could not be loaded">
          <span>方源 · FANG YUAN</span>
          <i aria-hidden="true" />
          <small>MODEL UNAVAILABLE · PLEASE RELOAD</small>
        </div>
      )
    }

    return this.props.children
  }
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
   SOFT STUDIO LIGHTING ENVIRONMENT (PMREM)
   Diffuse studio softboxes providing natural, subtle sheen without
   harsh specular blowout on face and skin.
   ═══════════════════════════════════════════════════════════════════ */

function StudioEnvironment() {
  return (
    <Environment resolution={256}>
      {/* Soft Key Softbox (Front-Right Warm Light) */}
      <mesh position={[2.5, 3.0, 3.0]} scale={[3.5, 3.5, 1]}>
        <planeGeometry />
        <meshBasicMaterial color="#fff6eb" side={THREE.DoubleSide} />
      </mesh>
      {/* Gentle Fill Softbox (Front-Left Pale Warm) */}
      <mesh position={[-2.5, 2.0, 2.5]} scale={[3.0, 3.5, 1]}>
        <planeGeometry />
        <meshBasicMaterial color="#fef3c7" side={THREE.DoubleSide} />
      </mesh>
      {/* Overhead Hair Softbox */}
      <mesh position={[0, 4.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[4, 3, 1]}>
        <planeGeometry />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
      {/* Dark Neutral Studio Backdrop */}
      <mesh position={[0, 0, -5]} scale={[10, 8, 1]}>
        <planeGeometry />
        <meshBasicMaterial color="#080a09" side={THREE.DoubleSide} />
      </mesh>
    </Environment>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   SUBTLE ESSENCE MOTES
   Gracefully drifting around the perimeter
   ═══════════════════════════════════════════════════════════════════ */

function TemporalSparks({ quality, reduced }: { quality: SceneQuality; reduced: boolean }) {
  const count = quality === 'low' ? 8 : 16
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, basePositions } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const base = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 0.8 + Math.random() * 0.8
      const x = Math.cos(angle) * radius
      const y = (Math.random() - 0.5) * 1.5
      const z = Math.sin(angle) * radius
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
      arr[idx + 1] = ((basePositions[idx + 1] + t * 0.08 + 0.75) % 1.5) - 0.75
      arr[idx] = basePositions[idx] + Math.sin(t * 0.8 + i) * 0.02
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
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.9)')
      grad.addColorStop(0.35, 'rgba(180, 150, 90, 0.5)')
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
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={quality === 'low' ? 0.045 : 0.06}
        map={particleTexture}
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   AUTHENTIC FANG YUAN 3D MODEL
   Centered at portrait eye-level with softened skin normals
   matching the original collectible photograph.
   ═══════════════════════════════════════════════════════════════════ */

function FangYuanModel({ onLoaded }: { onLoaded: () => void }) {
  const { scene } = useGLTF(fangYuanModelUrl)

  const presentation = useMemo(() => {
    const model = scene.clone(true)
    const bounds = new THREE.Box3().setFromObject(model)
    const center = bounds.getCenter(new THREE.Vector3())
    // 1.30 scale perfectly frames the entire seated figure, hair, robes, and pedestal base with clear breathing room
    const modelScale = 1.30

    return {
      model,
      position: [
        -center.x * modelScale,
        -center.y * modelScale - 0.04,
        -center.z * modelScale,
      ] as [number, number, number],
      scale: [modelScale, modelScale, modelScale] as [number, number, number],
    }
  }, [scene])

  useEffect(() => {
    presentation.model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((mat) => {
            if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
              const stdMat = mat as THREE.MeshStandardMaterial
              // Soften normal scale so skin does not show 3D scan bumps or seams
              if (stdMat.normalMap) {
                stdMat.normalScale.set(0.65, 0.65)
              }
              if (stdMat.map) {
                stdMat.map.colorSpace = THREE.SRGBColorSpace
              }
              // Soft velvety matte porcelain skin finish
              stdMat.roughness = 0.82
              stdMat.metalness = 0.08
              stdMat.envMapIntensity = 0.5
              stdMat.needsUpdate = true
            }
          })
        }
      }
    })
    onLoaded()
  }, [presentation.model, onLoaded])

  return (
    <group position={presentation.position} scale={presentation.scale}>
      <primitive object={presentation.model} />
    </group>
  )
}

function ModelLoadingPlaceholder() {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#174d3d" metalness={0.65} roughness={0.34} transparent opacity={0.35} />
    </mesh>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   ASSEMBLED 3D FANG YUAN SHOWCASE
   Cleaned: No artificial lower board, no wireframe rings.
   Pure focus on the authentic collectible statue and face.
   ═══════════════════════════════════════════════════════════════════ */

function FangYuanShowcaseGeometry({
  quality,
  reduced,
  motion,
  onModelLoaded,
}: {
  quality: SceneQuality
  reduced: boolean
  motion: MutableRefObject<Motion>
  onModelLoaded: () => void
}) {
  const group = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!group.current) return
    const m = motion.current
    if (!m.dragging && !reduced) {
      m.targetY += delta * 0.12
    }
    const factor = Math.min(delta * 10, 1)
    m.x += (m.targetX - m.x) * factor
    m.y += (m.targetY - m.y) * factor
    group.current.rotation.set(m.x, m.y, 0)
  })

  return (
    <group ref={group} rotation={[0.02, -0.15, 0]}>
      <Suspense fallback={<ModelLoadingPlaceholder />}>
        <FangYuanModel onLoaded={onModelLoaded} />
      </Suspense>
      <TemporalSparks quality={quality} reduced={reduced} />
    </group>
  )
}

function FangYuanSceneContent() {
  const reduced = useReducedMotion()
  const quality = useMemo(getQuality, [])
  const sceneRef = useRef<HTMLDivElement>(null)
  const invalidateRef = useRef<() => void>(() => undefined)
  const motion = useRef<Motion>({
    x: 0.02,
    y: -0.15,
    targetX: 0.02,
    targetY: -0.15,
    dragging: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
  })
  const [visible, setVisible] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const onModelLoaded = useCallback(() => setModelLoaded(true), [])

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
    state.targetY += dx * 0.007
    state.targetX = THREE.MathUtils.clamp(state.targetX + dy * 0.006, -0.45, 0.45)
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

  const frameMode = visible ? 'always' : 'never'

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
      <Canvas
        camera={{ position: [0, 0.0, 2.9], fov: 36 }}
        dpr={quality === 'low' ? 1 : [1, 1.25]}
        frameloop={frameMode}
        gl={{
          antialias: quality === 'high',
          powerPreference: 'low-power',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
      >
        <InvalidateBridge invalidateRef={invalidateRef} />

        {/* 1. Procedural Soft Studio Environment */}
        <StudioEnvironment />

        {/* 2. Warm Ambient Light */}
        <ambientLight intensity={0.95} color="#38322b" />

        {/* 3. Primary Key Light (Soft warm light illuminating face and body) */}
        <directionalLight
          position={[1.0, 1.5, 2.4]}
          intensity={2.2}
          color="#fff5eb"
        />

        {/* 4. Front Fill Light */}
        <directionalLight
          position={[-1.0, 0.5, 2.0]}
          intensity={1.3}
          color="#fef3c7"
        />

        {/* 5. Delicate Overhead Hair & Shoulder Highlight */}
        <directionalLight
          position={[0.2, 2.6, -0.6]}
          intensity={1.5}
          color="#ffffff"
        />

        {/* 6. Subtle Base Illumination for the stone pedestal and robes */}
        <pointLight
          position={[0, -0.65, 1.6]}
          intensity={1.0}
          color="#e2d9c8"
          distance={3.5}
        />

        <FangYuanShowcaseGeometry
          quality={quality}
          reduced={reduced}
          motion={motion}
          onModelLoaded={onModelLoaded}
        />
      </Canvas>

      <div className="fang-scene-label">
        <span>方源 · FANG YUAN</span>
        <span>{modelLoaded ? 'DRAG TO ROTATE' : 'LOADING MODEL'}</span>
      </div>
    </div>
  )
}

export function FangYuanScene() {
  return (
    <FangYuanModelErrorBoundary>
      <FangYuanSceneContent />
    </FangYuanModelErrorBoundary>
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
