import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject, PointerEvent as ReactPointerEvent } from 'react'
import * as THREE from 'three'
import { useReducedMotion } from './hooks'

type SceneQuality = 'high' | 'low'

type SceneInteraction = {
  currentX: number
  currentY: number
  targetX: number
  targetY: number
  dragging: boolean
  pointerId: number | null
  lastX: number
  lastY: number
}

function getSceneQuality(): SceneQuality {
  if (typeof window === 'undefined') return 'low'
  const device = navigator as Navigator & { deviceMemory?: number }
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches
  const lowMemory = typeof device.deviceMemory === 'number' && device.deviceMemory <= 4
  const lowCpu = navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4
  const highDensity = window.devicePixelRatio > 1.7
  return isCoarsePointer || lowMemory || lowCpu || highDensity ? 'low' : 'high'
}

function InvalidateBridge({ invalidateRef }: { invalidateRef: MutableRefObject<() => void> }) {
  const invalidate = useThree((state) => state.invalidate)
  useEffect(() => {
    invalidateRef.current = invalidate
    return () => { invalidateRef.current = () => undefined }
  }, [invalidate, invalidateRef])
  return null
}

function SystemGeometry({ quality, interaction, reduced }: { quality: SceneQuality; interaction: MutableRefObject<SceneInteraction>; reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const lowPower = quality === 'low'
  const nodeCount = lowPower ? 8 : 14
  const nodes = useMemo(() => Array.from({ length: nodeCount }, (_, index) => {
    const angle = (index / nodeCount) * Math.PI * 2
    const radius = index % 2 === 0 ? 1.2 : 0.78
    return [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.7, (index % 3 - 1) * 0.3] as [number, number, number]
  }), [nodeCount])
  const wireframeGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.05, lowPower ? 0 : 1), [lowPower])

  useEffect(() => () => wireframeGeometry.dispose(), [wireframeGeometry])

  useFrame((_, delta) => {
    if (!group.current) return
    const motion = interaction.current
    if (!motion.dragging && !reduced && !lowPower) motion.targetY += delta * 0.035
    motion.currentX = THREE.MathUtils.damp(motion.currentX, motion.targetX, lowPower ? 7 : 9, delta)
    motion.currentY = THREE.MathUtils.damp(motion.currentY, motion.targetY, lowPower ? 7 : 9, delta)
    group.current.rotation.set(motion.currentX, motion.currentY, 0.08)
  })

  return <group ref={group} rotation={[0.18, -0.35, 0.08]}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.35, 0.008, 6, lowPower ? 32 : 56]} /><meshBasicMaterial color="#174d3d" transparent opacity={0.65} /></mesh>
    <mesh rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.92, 0.006, 6, lowPower ? 28 : 48]} /><meshBasicMaterial color="#23634d" transparent opacity={0.35} /></mesh>
    {nodes.map((position, index) => <group key={index} position={position}><mesh><sphereGeometry args={[index % 4 === 0 ? 0.075 : 0.045, lowPower ? 8 : 12, lowPower ? 8 : 12]} /><meshBasicMaterial color={index % 4 === 0 ? '#0b7656' : '#174d3d'} /></mesh></group>)}
    <lineSegments><edgesGeometry args={[wireframeGeometry]} /><lineBasicMaterial color="#174d3d" transparent opacity={0.48} /></lineSegments>
  </group>
}

export function HeroScene() {
  const reduced = useReducedMotion()
  const quality = useMemo(getSceneQuality, [])
  const sceneRef = useRef<HTMLDivElement>(null)
  const invalidateRef = useRef<() => void>(() => undefined)
  const [visible, setVisible] = useState(true)
  const [dragging, setDragging] = useState(false)
  const interaction = useRef<SceneInteraction>({ currentX: 0.18, currentY: -0.35, targetX: 0.18, targetY: -0.35, dragging: false, pointerId: null, lastX: 0, lastY: 0 })

  useEffect(() => {
    if (!sceneRef.current) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 })
    observer.observe(sceneRef.current)
    return () => observer.disconnect()
  }, [])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    interaction.current.dragging = true
    interaction.current.pointerId = event.pointerId
    interaction.current.lastX = event.clientX
    interaction.current.lastY = event.clientY
    setDragging(true)
    invalidateRef.current()
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const motion = interaction.current
    if (!motion.dragging || motion.pointerId !== event.pointerId) return
    event.preventDefault()
    const deltaX = event.clientX - motion.lastX
    const deltaY = event.clientY - motion.lastY
    motion.targetY = THREE.MathUtils.clamp(motion.targetY + deltaX * 0.006, -1.65, 1.65)
    motion.targetX = THREE.MathUtils.clamp(motion.targetX + deltaY * 0.006, -1.1, 1.1)
    motion.lastX = event.clientX
    motion.lastY = event.clientY
    invalidateRef.current()
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (interaction.current.pointerId !== event.pointerId) return
    interaction.current.dragging = false
    interaction.current.pointerId = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    invalidateRef.current()
  }

  const frameMode = !visible ? 'never' : quality === 'high' && !reduced ? 'always' : 'demand'

  return <div ref={sceneRef} className={`hero-scene ${dragging ? 'is-dragging' : ''} quality-${quality}`} aria-label="Interactive abstract connected system visualization. Drag or swipe to rotate." role="img" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
    <div className="scene-grid" aria-hidden="true" />
    <Canvas camera={{ position: [0, 0, 3.8], fov: 42 }} dpr={quality === 'low' ? 1 : [1, 1.35]} frameloop={frameMode} gl={{ antialias: quality === 'high', powerPreference: 'low-power' }}>
      <InvalidateBridge invalidateRef={invalidateRef} />
      <ambientLight intensity={0.35} />
      <SystemGeometry quality={quality} interaction={interaction} reduced={reduced} />
    </Canvas>
    <div className="scene-caption"><span>SYS / 001</span><span className="scene-hint">DRAG / SWIPE TO ROTATE</span><span>CONNECTED SYSTEMS</span></div>
  </div>
}
