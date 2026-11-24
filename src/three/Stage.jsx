import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Component, Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { hasWebGL, registerScene, useInView, useMobile } from '../lib/motion'

class GLBoundary extends Component {
  constructor(p) {
    super(p)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.warn('[PÉTALE] 3D scene unavailable, showing photography instead.', err)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/** Compile every shader in the scene off the critical path (KHR_parallel_shader_compile when available). */
function Compile({ onCompiled }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    let alive = true
    requestAnimationFrame(async () => {
      try {
        await gl.compileAsync(scene, camera)
      } catch {
        /* older drivers: shaders compile on first draw instead */
      }
      if (alive) onCompiled()
    })
    return () => {
      alive = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

/** Draw a few frames so environment maps, shadows and transmission targets are built up front. */
function Prime({ active, onPrimed }) {
  const n = useRef(0)
  useFrame(() => {
    if (!active) return
    n.current += 1
    if (n.current === 3) onPrimed()
  })
  return null
}

/**
 * Canvas wrapper used by every 3D moment on the site:
 * - compiles + primes its scene during the preloader, then sleeps until on screen
 * - starts at a modest pixel ratio and adapts it to the measured frame rate
 * - falls back to product photography if WebGL is missing or crashes
 */
export default function Stage({ children, fallback = null, camera = { position: [0, 0, 6], fov: 35 }, className = '', style, shadows = false, interactive = false, maxDpr = 1.5 }) {
  const [ref, inView] = useInView('150px')
  const mobile = useMobile()
  const supported = typeof window !== 'undefined' && hasWebGL()
  const device = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const ceiling = Math.min(device, maxDpr)
  const [dpr, setDpr] = useState(Math.min(device, 1.25, maxDpr))
  const [phase, setPhase] = useState('compile') // compile -> prime -> live
  const release = useRef(() => {})

  useEffect(() => {
    if (!supported) return
    release.current = registerScene()
    return () => release.current()
  }, [supported])

  const frameloop = phase === 'prime' || (phase === 'live' && inView) ? 'always' : 'never'

  return (
    <div ref={ref} className={className} style={style}>
      {supported ? (
        <GLBoundary fallback={fallback}>
          <Suspense fallback={null}>
            <Canvas
              frameloop={frameloop}
              dpr={dpr}
              camera={camera}
              shadows={shadows}
              gl={{ antialias: !mobile, alpha: true, powerPreference: 'high-performance', stencil: false }}
              onCreated={({ gl }) => {
                // Neutral tone mapping keeps rose reds and blush pinks true (ACES drifts them toward orange).
                gl.toneMapping = THREE.NeutralToneMapping
                gl.toneMappingExposure = 1
              }}
              style={{ pointerEvents: interactive ? 'auto' : 'none', touchAction: interactive ? 'pan-y' : 'auto' }}
            >
              {phase === 'compile' && <Compile onCompiled={() => setPhase('prime')} />}
              <Prime
                active={phase === 'prime'}
                onPrimed={() => {
                  setPhase('live')
                  release.current()
                }}
              />
              {phase === 'live' && (
                <PerformanceMonitor
                  bounds={() => [50, 58]}
                  flipflops={3}
                  onDecline={() => setDpr((d) => Math.max(0.75, +(d - 0.25).toFixed(2)))}
                  onIncline={() => setDpr((d) => Math.min(ceiling, +(d + 0.25).toFixed(2)))}
                />
              )}
              {children}
            </Canvas>
          </Suspense>
        </GLBoundary>
      ) : (
        fallback
      )}
    </div>
  )
}
