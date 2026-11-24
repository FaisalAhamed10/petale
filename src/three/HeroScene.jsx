import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import Bouquet, { heroLocalPosition, layoutBouquet } from './Bouquet'
import Petals from './Petals'
import { ramp, lerp } from './flowers'
import { story } from './story'
import { pointer, prefersReducedMotion } from '../lib/motion'

const UP = new THREE.Vector3(0, 1, 0)
const TAU = Math.PI * 2

/** The signature bouquet: red roses, pink tulips, white lilies, peonies, baby's breath. */
export function heroRecipe(quality) {
  const hi = quality > 0.5
  return [
    { kind: 'rose', color: '#9E1B2C', n: hi ? 9 : 7 },
    { kind: 'rose', color: '#B8253A', n: hi ? 3 : 2 },
    { kind: 'tulip', color: '#E88AA2', n: hi ? 4 : 3 },
    { kind: 'lily', color: '#F7F3EA', n: hi ? 3 : 2 },
    { kind: 'peony', color: '#EEB9C4', n: hi ? 3 : 2 },
  ]
}

const lerpAngle = (a, b, t) => {
  let d = ((b - a) % TAU + TAU * 1.5) % TAU - TAU / 2
  return a + d * t
}

/** Camera keyframes along the story. Close-ups are expressed relative to the hero rose (H). */
function keyframes(H, f, portrait) {
  const c = portrait ? 1.3 : 1
  const at = (x, y, z) => new THREE.Vector3(x, y, z)
  const rel = (x, y, z) => H.clone().add(new THREE.Vector3(x * c, y * c, z * c))
  return [
    { p: 0, pos: at(0, 0.25, 7.6 * f), tgt: at(0, 0.02, 0) },
    { p: 0.1, pos: at(0, 0.4, 6.2 * f), tgt: at(0, 0.2, 0) },
    { p: 0.2, pos: rel(0.12, 0.5, 1.15), tgt: H },
    { p: 0.28, pos: rel(-0.28, 0.32, 1.0), tgt: H },
    { p: 0.38, pos: rel(0.55, 1.0, 3.1), tgt: H.clone().add(at(0, 0.55, 0)) },
    { p: 0.47, pos: at(0.4, 0.9, 8.4 * f), tgt: at(0, 0.55, 0) },
    { p: 0.57, pos: at(0, 0.5, 6.3 * f), tgt: at(0, 0.18, 0) },
    { p: 0.7, pos: at(-2.7 * f, 0.15, 4.9 * f), tgt: at(0, -0.25, 0) },
    { p: 0.83, pos: at(0.75, -0.5, 3.0 * (portrait ? 1.35 : 1)), tgt: at(0, -0.9, 0) },
    { p: 0.95, pos: at(0, 0.25, 7.8 * f), tgt: at(0, 0.05, 0) },
    { p: 1, pos: at(0, 0.25, 7.8 * f), tgt: at(0, 0.05, 0) },
  ]
}

function sample(keys, p, outPos, outTgt) {
  let i = 0
  while (i < keys.length - 2 && p > keys[i + 1].p) i++
  const a = keys[i]
  const b = keys[i + 1]
  const t = ramp(p, a.p, b.p)
  outPos.lerpVectors(a.pos, b.pos, t)
  outTgt.lerpVectors(a.tgt, b.tgt, t)
}

export default function HeroScene({ quality = 1 }) {
  const recipe = useMemo(() => heroRecipe(quality), [quality])
  const layout = useMemo(() => layoutBouquet(recipe, { seed: 4, filler: true, quality }), [recipe, quality])
  const heroLocal = useMemo(() => heroLocalPosition(layout), [layout])
  const group = useRef()
  const anim = useRef({ scatter: 0, detach: 0, wrap: 1, ribbon: 1, wind: 1 })
  const sm = useRef({ p: 0, px: 0, py: 0, idle: 0 })
  const camPos = useMemo(() => new THREE.Vector3(0, 0.25, 9), [])
  const camTgt = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const wantPos = useMemo(() => new THREE.Vector3(), [])
  const wantTgt = useMemo(() => new THREE.Vector3(), [])
  const H = useMemo(() => new THREE.Vector3(), [])
  const light = useRef()
  const { size } = useThree()
  const reduced = prefersReducedMotion()

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime
    const d = Math.min(dt, 0.05)
    const S = sm.current
    // a short catch-up keeps touch scrolling (which arrives in steps) silky
    S.p += (story.p - S.p) * (1 - Math.exp(-d * 7))
    S.px += (pointer.x - S.px) * (1 - Math.exp(-d * 3))
    S.py += (pointer.y - S.py) * (1 - Math.exp(-d * 3))
    const p = S.p

    // --- story state -------------------------------------------------------
    const a = anim.current
    a.wrap = 1 - ramp(p, 0.21, 0.31) + ramp(p, 0.58, 0.72)
    a.ribbon = 1 - ramp(p, 0.19, 0.26) + ramp(p, 0.72, 0.86)
    a.detach = ramp(p, 0.25, 0.4) - ramp(p, 0.48, 0.57)
    a.scatter = ramp(p, 0.39, 0.47) - ramp(p, 0.5, 0.6)
    a.wind = reduced ? 0.2 : 1
    const shift = ramp(p, 0.86, 0.96)
    const portrait = size.width / size.height < 0.9
    const f = portrait ? 1.28 : size.width / size.height < 1.3 ? 1.15 : 1

    // --- bouquet transform ----------------------------------------------------
    const g = group.current
    const storyRot = -layout.heroPhi + ramp(p, 0.3, 0.86) * TAU + Math.sin(t * 0.35) * 0.3 * shift
    // at rest the bouquet keeps its open front to the viewer and sways gently, like it is being held
    const idleRot = -layout.heroPhi + (reduced ? 0 : Math.sin(t * 0.22) * 0.5 + Math.sin(t * 0.13) * 0.18)
    g.rotation.y = lerpAngle(idleRot, storyRot, ramp(p, 0.02, 0.15))
    g.rotation.x = S.py * 0.05 * (1 - ramp(p, 0.12, 0.2))
    g.rotation.z = -S.px * 0.04 * (1 - ramp(p, 0.12, 0.2))
    // hero layout: copy on the left, bouquet on the right (below the copy on phones)
    const rest = 1 - ramp(p, 0.03, 0.14)
    const wide = size.width / size.height > 1.15
    g.position.set(
      (portrait ? 0 : -1.5 * shift) + (wide ? 1.55 : 0) * rest,
      (portrait ? 0.75 : 0) * shift + (portrait ? -0.75 : 0) * rest + Math.sin(t * 0.6) * 0.04,
      0
    )
    const sc = lerp(1, portrait ? 0.82 : 0.95, shift)
    g.scale.setScalar(sc)

    // hero rose in world space (head centre)
    H.copy(heroLocal).applyAxisAngle(UP, g.rotation.y).multiplyScalar(sc).add(g.position)

    if (import.meta.env.DEV) window.__hero = { camera, H, p, story }
    // --- camera ---------------------------------------------------------------
    const keys = keyframes(H, f, portrait)
    sample(keys, p, wantPos, wantTgt)
    // slow intro dolly toward the bouquet while resting on the hero
    const intro = (1 - Math.min(1, t / 9)) * 1.4 * (1 - ramp(p, 0, 0.08))
    wantPos.z += intro
    // pointer parallax (gentler in close-ups)
    const close = ramp(p, 0.12, 0.2) * (1 - ramp(p, 0.3, 0.4))
    const par = reduced ? 0 : 1 - close * 0.75
    wantPos.x += S.px * 0.5 * par
    wantPos.y += S.py * 0.28 * par
    const k = 1 - Math.exp(-d * 4.5)
    camPos.lerp(wantPos, k)
    camTgt.lerp(wantTgt, k)
    camera.position.copy(camPos)
    camera.lookAt(camTgt)
    if (camera.fov !== (portrait ? 44 : 34)) {
      camera.fov = portrait ? 44 : 34
      camera.updateProjectionMatrix()
    }

    // drifting warm light — the "moving light" in the background
    if (light.current) {
      light.current.position.set(Math.sin(t * 0.25) * 4, 2.5 + Math.sin(t * 0.4) * 0.8, Math.cos(t * 0.25) * 4)
    }
  })

  return (
    <>
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#fff3ea', '#8a6f63', 0.9]} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={2.6}
        color="#fff1e2"
        castShadow={false}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={4}
        shadow-camera-left={-3.6}
        shadow-camera-right={3.6}
        shadow-camera-top={3.6}
        shadow-camera-bottom={-3.6}
        shadow-camera-near={1}
        shadow-camera-far={16}
      />
      <directionalLight position={[0, -1, 6]} intensity={0.8} color="#ffe9e4" />
      <directionalLight position={[-4, 2, -3]} intensity={1.4} color="#f2b6c2" />
      <pointLight ref={light} intensity={6} distance={9} color="#ffd9c9" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, 3]} scale={[8, 3, 1]} color="#fff6ee" />
        <Lightformer form="rect" intensity={1.2} position={[-5, 1, -2]} rotation-y={Math.PI / 2} scale={[4, 6, 1]} color="#f4c6cf" />
        <Lightformer form="rect" intensity={0.9} position={[5, 0, 2]} rotation-y={-Math.PI / 2} scale={[3, 5, 1]} color="#ffe6cf" />
        <Lightformer form="ring" intensity={1.5} position={[0, -3, 4]} scale={2} color="#ffffff" />
      </Environment>
      <group ref={group}>
        <Bouquet layout={layout} quality={quality} anim={anim} heroRose ribbon="#A3172B" wrap={{ hex: '#F5F1EA', clear: false }} />
      </group>
      <Petals count={quality > 0.5 ? 70 : 30} area={PETAL_AREA} speed={reduced ? 0.2 : 1} />
    </>
  )
}

const PETAL_AREA = [11, 8, 7]
