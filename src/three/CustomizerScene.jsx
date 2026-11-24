import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CameraControls, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import CameraControlsImpl from 'camera-controls'
import Bouquet from './Bouquet'
import { FLOWER_TYPES, WRAPS, RIBBONS } from '../data/catalog'
import { prefersReducedMotion } from '../lib/motion'

/** Turn a customer's design into a bouquet recipe for the 3D preview. */
export function designRecipe(design) {
  return Object.keys(design.flowers).map((t) => {
    const f = FLOWER_TYPES.find((x) => x.id === t)
    const col = f.colors.find((c) => c.id === design.flowers[t]) || f.colors[0]
    return { kind: f.kind, color: col.hex, n: design.counts?.[t] ?? 1 }
  })
}

/** Camera views offered by the preview's buttons: [position, target]. */
export const VIEWS = {
  front: [0, 0.75, 8.4, 0, -0.5, 0],
  side: [7.6, 0.4, 2.2, 0, -0.5, 0],
  top: [0, 8.2, 1.8, 0, 0.2, 0],
  detail: [1.1, 2.1, 3.3, 0, 0.75, 0],
}

/** A view, pushed further out on narrow screens so the whole bouquet fits. */
export function viewFor(name, far = 1) {
  const [x, y, z, tx, ty, tz] = VIEWS[name] || VIEWS.front
  return [tx + (x - tx) * far, ty + (y - ty) * far, tz + (z - tz) * far, tx, ty, tz]
}

function Turntable({ spin, children }) {
  const ref = useRef()
  const reduced = prefersReducedMotion()
  useFrame((_, dt) => {
    if (ref.current && spin && !reduced) ref.current.rotation.y += Math.min(dt, 0.05) * 0.25
  })
  return <group ref={ref}>{children}</group>
}

/** Hand-lettered gift card leaning against the plinth; redrawn when the message changes. */
function GiftCard({ message }) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 768
    c.height = 512
    return c
  }, [])
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [canvas])
  useLayoutEffect(() => () => tex.dispose(), [tex])

  useEffect(() => {
    const draw = () => {
      const ctx = canvas.getContext('2d')
      const W = canvas.width
      const H = canvas.height
      ctx.fillStyle = '#fffdf8'
      ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(197,167,121,0.9)'
      ctx.lineWidth = 3
      ctx.strokeRect(22, 22, W - 44, H - 44)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#C5A779'
      ctx.font = '500 26px Jost, sans-serif'
      ctx.fillText('P É T A L E', W / 2, 78)
      ctx.fillStyle = '#542735'
      const text = message.trim() || 'Your words, hand-lettered here.'
      ctx.font = `italic 400 ${message.trim() ? 46 : 40}px Cormorant, Georgia, serif`
      // wrap the message into centred lines
      const words = text.split(/\s+/)
      const lines = []
      let line = ''
      words.forEach((w) => {
        const test = line ? `${line} ${w}` : w
        if (ctx.measureText(test).width > W - 140 && line) {
          lines.push(line)
          line = w
        } else line = test
      })
      if (line) lines.push(line)
      const shown = lines.slice(0, 6)
      const lh = 56
      const y0 = H / 2 + 20 - ((shown.length - 1) * lh) / 2
      shown.forEach((l, i) => ctx.fillText(i === 5 && lines.length > 6 ? `${l}…` : l, W / 2, y0 + i * lh))
      tex.needsUpdate = true
    }
    draw()
    document.fonts?.ready.then(draw)
  }, [message, canvas, tex])

  return (
    <group position={[1.05, -2.02, 1.15]} rotation={[-0.32, -0.45, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.96, 0.64, 0.012]} />
        <meshStandardMaterial attach="material-0" color="#f3ede2" />
        <meshStandardMaterial attach="material-1" color="#f3ede2" />
        <meshStandardMaterial attach="material-2" color="#f3ede2" />
        <meshStandardMaterial attach="material-3" color="#f3ede2" />
        <meshStandardMaterial attach="material-4" map={tex} roughness={0.85} />
        <meshStandardMaterial attach="material-5" color="#efe6d8" roughness={0.9} />
      </mesh>
    </group>
  )
}

/** Keep vertical swipes scrolling the page on touch screens; horizontal drags orbit. */
function TouchFriendly() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const el = gl.domElement
    const fix = () => (el.style.touchAction = 'pan-y')
    fix()
    const id = setTimeout(fix, 200)
    return () => clearTimeout(id)
  }, [gl])
  return null
}

export default function CustomizerScene({ design, quality = 1, spin = true, controlsRef, far = 1 }) {
  const recipe = useMemo(() => designRecipe(design), [design])
  const wrap = WRAPS.find((w) => w.id === design.wrap) || WRAPS[0]
  const ribbon = RIBBONS.find((r) => r.id === design.ribbon) || RIBBONS[0]
  const wrapProp = useMemo(() => ({ hex: wrap.hex, clear: !!wrap.clear }), [wrap.hex, wrap.clear])
  const hq = quality > 0.5
  const cc = useRef()

  useEffect(() => {
    const c = cc.current
    if (!c) return
    const A = CameraControlsImpl.ACTION
    c.mouseButtons.wheel = A.NONE // the page keeps the wheel; zoom lives on the +/- buttons and pinch
    c.mouseButtons.right = A.NONE
    c.touches.two = A.TOUCH_DOLLY
    c.touches.three = A.NONE
    c.setLookAt(...viewFor('front', far), false)
    if (controlsRef) controlsRef.current = c
    return () => {
      if (controlsRef) controlsRef.current = null
    }
  }, [controlsRef, far])

  return (
    <>
      <TouchFriendly />
      <CameraControls ref={cc} minDistance={3.2} maxDistance={11} minPolarAngle={0.12} maxPolarAngle={1.72} smoothTime={0.35} draggingSmoothTime={0.12} />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#fff3ea', '#8a6f63', 0.85]} />
      <directionalLight
        position={[3.5, 7, 4.5]}
        intensity={2.6}
        color="#fff1e2"
        castShadow={hq}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-camera-left={-3.4}
        shadow-camera-right={3.4}
        shadow-camera-top={3.4}
        shadow-camera-bottom={-3.4}
        shadow-camera-near={1}
        shadow-camera-far={18}
      />
      <directionalLight position={[0, -1, 6]} intensity={0.7} color="#ffe9e4" />
      <directionalLight position={[-4, 2.5, -3]} intensity={1.3} color="#f2b6c2" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2} position={[0, 5, 3]} scale={[8, 3, 1]} color="#fff6ee" />
        <Lightformer form="rect" intensity={1.1} position={[-5, 1, -2]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} color="#f4c6cf" />
        <Lightformer form="rect" intensity={0.9} position={[5, 0, 2]} rotation-y={-Math.PI / 2} scale={[3, 5, 1]} color="#ffe6cf" />
      </Environment>

      <Turntable spin={spin}>
        <group position={[0, -0.05, 0]}>
          {recipe.length > 0 && (
            <Bouquet recipe={recipe} wrap={wrapProp} ribbon={ribbon.hex} filler={design.filler} quality={quality} seed={9} grow shadows={hq} />
          )}
        </group>
      </Turntable>

      {/* studio plinth: the bouquet lies on it, so the shadows are real, not painted */}
      <group position={[0, -2.32, 0]}>
        <mesh receiveShadow castShadow position={[0, -0.14, 0]}>
          <cylinderGeometry args={[2.05, 2.1, 0.28, 96]} />
          <meshPhysicalMaterial color="#f6ede6" roughness={0.42} clearcoat={0.5} clearcoatRoughness={0.35} sheen={0.4} sheenColor="#ffffff" />
        </mesh>
        <mesh position={[0, -0.0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[1.98, 2.05, 96]} />
          <meshStandardMaterial color="#C5A779" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      <GiftCard message={design.message} />
    </>
  )
}
