import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './ClothDistortion.css'

interface ClothDistortionCanvasProps {
  imageSrc: string
  alt?: string
  className?: string
  aspectRatio?: number // default 16 / 10
  interactive?: boolean
  onClick?: () => void
}

const vertexShader = `
  uniform vec2 uMouse;
  uniform vec2 uMouseVel;
  uniform float uTime;
  uniform float uHover;
  varying vec2 vUv;
  varying float vShade;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Distance from cursor in UV space
    float d = distance(uv, uMouse);
    float speed = length(uMouseVel);

    // 1. Rubber sheet bulge at cursor location
    float cursorImpact = exp(-d * d * 22.0) * uHover;

    // 2. Traveling fluid cloth wave ripples across the surface
    float wave1 = sin(uv.y * 12.0 - uTime * 3.2 + uv.x * 5.0);
    float wave2 = cos(uv.x * 10.0 + uTime * 2.1 - uv.y * 4.0);
    float clothWave = (wave1 * 0.6 + wave2 * 0.4) * (speed * 0.5 + 0.06) * uHover;

    // 3. Signature edge deformation (waving curtain / cloth flutter along boundaries)
    // Strongest near the borders (1.0 - uv.x) and modulated by mouse velocity
    float edgeWave = sin(uv.y * 8.0 - uTime * 3.0) * (uMouseVel.x * 0.4 + 0.05 * uHover);
    float edgeFactor = smoothstep(0.0, 0.35, 1.0 - uv.x) + smoothstep(0.0, 0.35, uv.x);
    pos.x += edgeWave * edgeFactor * 0.14;

    // 4. Z-displacement: pushing into/out of the rubber cloth membrane
    pos.z += (cursorImpact * 0.32 + clothWave * 0.16) * (1.0 + speed * 1.8);

    // 5. Normal / slope estimation for dynamic lighting across cloth folds
    vShade = clothWave * 1.6 + cursorImpact * 0.8 + edgeWave * 0.6;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uHover;
  uniform vec2 uPlaneRes;
  uniform vec2 uMediaRes;
  varying vec2 vUv;
  varying float vShade;

  void main() {
    // Optical refraction along cloth slopes
    vec2 uv = vUv;
    uv += vec2(vShade * 0.018, vShade * 0.014);

    // Object-fit: cover mapping so images never stretch or letterbox
    vec2 ratio = vec2(
      min((uPlaneRes.x / uPlaneRes.y) / (uMediaRes.x / uMediaRes.y), 1.0),
      min((uPlaneRes.y / uPlaneRes.x) / (uMediaRes.y / uMediaRes.x), 1.0)
    );
    vec2 coverUv = vec2(
      uv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      uv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
    coverUv = clamp(coverUv, 0.001, 0.999);

    vec4 color = texture2D(uTexture, coverUv);

    // Subtle cloth fold specular sheen & shadow
    color.rgb += vShade * 0.16 * uHover;

    gl_FragColor = color;
  }
`

export const ClothDistortionCanvas: React.FC<ClothDistortionCanvasProps> = ({
  imageSrc,
  alt = 'Project preview',
  className = '',
  aspectRatio = 16 / 10,
  interactive = true,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [webglSupported, setWebglSupported] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  // Internal state for mouse interpolation
  const mouseRef = useRef({ x: 0.5, y: 0.5 })
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 })
  const prevMouseRef = useRef({ x: 0.5, y: 0.5 })
  const velRef = useRef({ x: 0, y: 0 })
  const hoverRef = useRef(0)
  const targetHoverRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setWebglSupported(false)
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      })
    } catch {
      setWebglSupported(false)
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
    camera.position.z = 2.4

    const vFov = (camera.fov * Math.PI) / 180
    const visibleHeight = 2 * Math.tan(vFov / 2) * camera.position.z
    const visibleWidth = visibleHeight * (container.clientWidth / Math.max(container.clientHeight, 1))

    // Texture loader with sRGB encoding
    const textureLoader = new THREE.TextureLoader()
    let material: THREE.ShaderMaterial | null = null
    let mesh: THREE.Mesh | null = null

    textureLoader.load(
      imageSrc,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.generateMipmaps = false

        const img = texture.image as HTMLImageElement
        const mediaWidth = img?.naturalWidth || img?.width || 1920
        const mediaHeight = img?.naturalHeight || img?.height || 1080

        // High vertex grid for smooth fluid cloth deformation, sized exactly to camera frustum
        const geometry = new THREE.PlaneGeometry(visibleWidth, visibleHeight, 48, 48)

        material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms: {
            uTexture: { value: texture },
            uPlaneRes: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
            uMediaRes: { value: new THREE.Vector2(mediaWidth, mediaHeight) },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
            uMouseVel: { value: new THREE.Vector2(0, 0) },
            uTime: { value: 0 },
            uHover: { value: 0 },
          },
          transparent: true,
          side: THREE.DoubleSide,
        })

        mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)
        setIsLoaded(true)
      },
      undefined,
      () => {
        setWebglSupported(false)
      }
    )

    let animationFrameId: number
    let isVisible = true
    let hasRenderedAtRest = false
    const clock = new THREE.Clock()

    const handleResize = () => {
      if (!container || !renderer || !material) return
      const width = container.clientWidth
      const height = container.clientHeight
      if (width === 0 || height === 0) return

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      material.uniforms.uPlaneRes.value.set(width, height)

      if (mesh) {
        const vH = 2 * Math.tan(vFov / 2) * camera.position.z
        const vW = vH * (width / height)
        mesh.scale.set(vW / visibleWidth, vH / visibleHeight, 1)
      }
      hasRenderedAtRest = false
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    // Visibility observer to pause RAF when off-screen
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting
        if (isVisible) hasRenderedAtRest = false
      },
      { threshold: 0.05 }
    )
    intersectionObserver.observe(container)

    const render = () => {
      animationFrameId = requestAnimationFrame(render)
      if (!isVisible || !material) return

      const velMag = Math.abs(velRef.current.x) + Math.abs(velRef.current.y)
      const isActivelyHovered = hoverRef.current > 0.005 || targetHoverRef.current > 0 || velMag > 0.005

      // Performance: sleep when fully at rest with zero hover
      if (!isActivelyHovered && hasRenderedAtRest) {
        return
      }

      const delta = clock.getDelta()
      const elapsedTime = clock.getElapsedTime()

      // Smooth mouse position interpolation (lerp)
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.12
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.12

      // Calculate smooth velocity
      const vx = (mouseRef.current.x - prevMouseRef.current.x) * 8.0
      const vy = (mouseRef.current.y - prevMouseRef.current.y) * 8.0
      velRef.current.x += (vx - velRef.current.x) * 0.18
      velRef.current.y += (vy - velRef.current.y) * 0.18
      prevMouseRef.current.x = mouseRef.current.x
      prevMouseRef.current.y = mouseRef.current.y

      // Smooth hover presence transition
      hoverRef.current += (targetHoverRef.current - hoverRef.current) * 0.08

      // Update shader uniforms
      material.uniforms.uTime.value = elapsedTime
      material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)
      material.uniforms.uMouseVel.value.set(velRef.current.x, velRef.current.y)
      material.uniforms.uHover.value = hoverRef.current

      renderer.render(scene, camera)

      if (!isActivelyHovered) {
        hasRenderedAtRest = true
      }
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      if (material) material.dispose()
      if (mesh) {
        mesh.geometry.dispose()
      }
      renderer.dispose()
    }
  }, [imageSrc, aspectRatio])

  // Mouse event handlers for interactive hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    // Normalized coordinates [0, 1] with Y inverted for WebGL texture UV
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, 1.0 - (e.clientY - rect.top) / rect.height))
    targetMouseRef.current = { x, y }
    targetHoverRef.current = 1.0
  }

  const handleMouseEnter = () => {
    if (!interactive) return
    targetHoverRef.current = 1.0
  }

  const handleMouseLeave = () => {
    if (!interactive) return
    targetHoverRef.current = 0.0
    velRef.current = { x: 0, y: 0 }
  }

  return (
    <div
      ref={containerRef}
      className={`cloth-distortion-container ${className} ${isLoaded ? 'is-loaded' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ aspectRatio }}
    >
      {webglSupported ? (
        <canvas ref={canvasRef} className="cloth-distortion-canvas" />
      ) : (
        <img src={imageSrc} alt={alt} className="cloth-distortion-fallback-img" />
      )}
    </div>
  )
}

export default ClothDistortionCanvas
