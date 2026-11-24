import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  headGeometry,
  shared,
  stemGeometry,
  leafSprayGeometry,
  floretGeometry,
  wrapSheetGeometry,
  ribbonGeometry,
  bowGeometry,
  rosePetalSpecs,
  rosePetal,
  roseTransform,
  petalMaterial,
  greenMaterial,
  stemMaterial,
  wrapMaterial,
  ribbonMaterial,
  dotMaterial,
  rng,
  lerp,
  smooth,
  clamp01,
} from './flowers'

export const BIND = new THREE.Vector3(0, -1.1, 0)
const UP = new THREE.Vector3(0, 1, 0)
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const KIND_SCALE = { rose: 1, peony: 1.04, tulip: 0.88, lily: 1.05, sunflower: 1.15 }
const WRAP_H = 1.65
const WRAP_R0 = 0.12
const WRAP_R1 = 1.45
const coneR = (h) => WRAP_R0 + ((WRAP_R1 - WRAP_R0) * h) / WRAP_H

/**
 * Compose a bouquet: flower heads on a dome (Fibonacci spiral on a spherical cap),
 * every stem crossing at the binding point like a hand-tied spiral.
 */
export function layoutBouquet(recipe, { seed = 4, filler = true, quality = 1 } = {}) {
  const r = rng(seed)
  const list = []
  recipe.forEach((g) => {
    for (let i = 0; i < g.n; i++) list.push({ kind: g.kind, color: g.color })
  })
  // seeded shuffle, then nudge big blooms (peonies, lilies) away from the very centre
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  const N = list.length
  const thetaMax = Math.min(0.66, 0.32 + N * 0.012)
  const capArea = 2 * Math.PI * 1.7 * 1.7 * (1 - Math.cos(thetaMax))
  const s = Math.max(0.8, Math.min(1.32, Math.sqrt(capArea / Math.max(1, N) / 0.15)))

  const flowers = list.map((f, i) => {
    const k = (i + 0.5) / N
    const cos = 1 - k * (1 - Math.cos(thetaMax))
    const theta = Math.acos(cos)
    const phi = i * GOLDEN + r() * 0.25
    const dir = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), cos, Math.sin(theta) * Math.sin(phi)).normalize()
    const L = 2.02 - Math.pow(theta / Math.max(thetaMax, 0.01), 2) * 0.36 + (r() - 0.5) * 0.06
    const quat = new THREE.Quaternion().setFromUnitVectors(UP, dir)
    // spin each head about its own axis so no two look identical
    quat.multiply(new THREE.Quaternion().setFromAxisAngle(UP, r() * Math.PI * 2))
    return {
      ...f,
      i,
      dir,
      L,
      theta,
      quat,
      scale: s * KIND_SCALE[f.kind] * (0.92 + r() * 0.14) * (1 - 0.18 * Math.pow(theta / Math.max(thetaMax, 0.01), 2)),
      phase: r() * Math.PI * 2,
      freq: 0.7 + r() * 0.5,
      jitter: new THREE.Vector3(r() - 0.5, r() * 0.6, r() - 0.5),
      spin: new THREE.Vector3((r() - 0.5) * 1.4, (r() - 0.5) * 2, (r() - 0.5) * 1.4),
    }
  })

  // hero rose: a rose about half-way out on the dome — its face tilts toward the viewer
  let hero = -1
  let best = Infinity
  flowers.forEach((f) => {
    if (f.kind !== 'rose') return
    const score = Math.abs(f.theta / thetaMax - 0.42)
    if (score < best) {
      best = score
      hero = f.i
    }
  })

  // greenery around the rim
  const leaves = []
  const nLeaves = Math.round(8 + N * 0.35)
  for (let i = 0; i < nLeaves; i++) {
    const phi = (i / nLeaves) * Math.PI * 2 + r() * 0.3
    const theta = thetaMax * (0.85 + r() * 0.35)
    const dir = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi))
    const q = new THREE.Quaternion().setFromUnitVectors(UP, dir)
    q.multiply(new THREE.Quaternion().setFromAxisAngle(UP, r() * Math.PI))
    leaves.push({ dir, pos: dir.clone().multiplyScalar(1.15 + r() * 0.3), quat: q, scale: 0.82 + r() * 0.3 })
  }

  // baby's breath clouds tucked between the blooms
  const dots = []
  const twigs = [] // thin wiry branches holding each baby's breath cloud
  if (filler) {
    const clusters = Math.round(N * 0.7)
    const per = quality > 0.5 ? 22 : 12
    for (let c = 0; c < clusters; c++) {
      const k = (c + 0.5) / clusters
      const cos = 1 - k * (1 - Math.cos(thetaMax * 1.05))
      const theta = Math.acos(cos)
      const phi = c * GOLDEN + 1.7
      const dir = new THREE.Vector3(Math.sin(theta) * Math.cos(phi), cos, Math.sin(theta) * Math.sin(phi))
      const center = dir.clone().multiplyScalar(2.06 - Math.pow(theta / thetaMax, 2) * 0.32)
      const cq = new THREE.Quaternion().setFromUnitVectors(UP, dir)
      const sprigs = 4
      const tips = []
      for (let b = 0; b < sprigs; b++) {
        const a = (b / sprigs) * Math.PI * 2 + r()
        tips.push(center.clone().add(new THREE.Vector3(Math.cos(a) * 0.11, 0.02 + r() * 0.05, Math.sin(a) * 0.11).applyQuaternion(cq)))
      }
      const fork = center.clone().sub(dir.clone().multiplyScalar(0.16))
      tips.forEach((t) => twigs.push([fork, t]))
      twigs.push([dir.clone().multiplyScalar(0.9), fork])
      for (let j = 0; j < per; j++) {
        const tip = tips[j % sprigs]
        const a = r() * Math.PI * 2
        const rad = Math.sqrt(r()) * 0.075
        const off = new THREE.Vector3(Math.cos(a) * rad, (r() - 0.3) * 0.05, Math.sin(a) * rad).applyQuaternion(cq)
        const q = cq.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 1.2, r() * 6, (r() - 0.5) * 1.2)))
        dots.push({ pos: tip.clone().add(off), quat: q, s: 0.024 + r() * 0.014 })
      }
    }
  }
  return { flowers, hero, leaves, dots, twigs, thetaMax, heroPhi: hero >= 0 ? Math.atan2(flowers[hero].dir.x, flowers[hero].dir.z) : 0 }
}

/* -------------------------------------------------------------------------- */

/** The rose whose petals drift away in the scroll story — built from separate petals. */
function HeroRose({ color, quality, detach, shadows }) {
  const specs = useMemo(() => rosePetalSpecs(quality > 0.5 ? 26 : 15), [quality])
  const petals = useMemo(
    () =>
      specs.map((s, j) => {
        const t = roseTransform(s)
        const r = rng(500 + j)
        const out = new THREE.Vector3(Math.sin(s.angle), 0, Math.cos(s.angle))
        return {
          geo: rosePetal(s, quality),
          pos: new THREE.Vector3(...t.pos),
          rot: new THREE.Euler(t.rot[0], t.rot[1], 0, 'YXZ'),
          free: j >= specs.length * 0.3,
          delay: r() * 0.45,
          flight: out.multiplyScalar(0.7 + r() * 1.1).add(new THREE.Vector3((r() - 0.5) * 0.6, 0.5 + r() * 1.2, (r() - 0.5) * 0.6)),
          spin: new THREE.Vector3((r() - 0.5) * 5, (r() - 0.5) * 5, (r() - 0.5) * 5),
        }
      }),
    [specs, quality]
  )
  useLayoutEffect(() => () => petals.forEach((p) => p.geo.dispose()), [petals])
  const refs = useRef([])
  const mat = petalMaterial(color, quality > 0.5)
  const green = headGeometry('rose', quality).green

  useFrame(({ clock }) => {
    const d = detach.current
    const t = clock.elapsedTime
    petals.forEach((p, j) => {
      const m = refs.current[j]
      if (!m) return
      if (!p.free) return
      const k = smooth(clamp01((d - p.delay) / (1 - p.delay * 0.9)))
      const flutter = Math.sin(t * 1.6 + j) * 0.05 * k
      m.position.set(p.pos.x + p.flight.x * k + flutter, p.pos.y + p.flight.y * k, p.pos.z + p.flight.z * k + flutter)
      m.rotation.set(p.rot.x + p.spin.x * k, p.rot.y + p.spin.y * k, p.spin.z * k + Math.sin(t * 2 + j) * 0.2 * k, 'YXZ')
    })
  })

  return (
    <group>
      {petals.map((p, j) => (
        <mesh key={j} ref={(el) => (refs.current[j] = el)} geometry={p.geo} material={mat} position={p.pos} rotation={p.rot} castShadow={shadows} receiveShadow={shadows} />
      ))}
      <mesh geometry={green} material={greenMaterial()} castShadow={shadows} />
    </group>
  )
}

/* -------------------------------------------------------------------------- */

const DEFAULT_ANIM = { scatter: 0, detach: 0, wrap: 1, ribbon: 1, wind: 1 }

/**
 * A complete hand-tied bouquet.
 * `anim` is a ref whose fields (scatter, detach, wrap, ribbon, wind) are read every frame,
 * so scroll-driven storytelling never re-renders React.
 */
function Bouquet({ layout: given, recipe, wrap = { hex: '#F5F1EA', clear: false }, ribbon = '#C9A46A', filler = true, quality = 1, anim, seed = 4, heroRose = false, grow = false, shadows = false }) {
  const layout = useMemo(() => given || layoutBouquet(recipe, { seed, filler, quality }), [given, recipe, seed, filler, quality])
  const fallbackAnim = useRef(DEFAULT_ANIM)
  const A = anim || fallbackAnim
  const detach = useRef(0)

  const stemGeo = shared('stem', stemGeometry)
  const leafGeo = shared('leaf-spray', () => leafSprayGeometry())
  const floretGeo = shared('floret', floretGeometry)
  const fillerRef = useRef()
  // wiry baby's-breath branches, merged into one thin mesh per bouquet
  const twigGeo = useMemo(() => {
    if (!layout.twigs?.length) return null
    const parts = layout.twigs.map(([a, b]) => {
      const d = b.clone().sub(a)
      const g = new THREE.CylinderGeometry(0.0035, 0.005, 1, 4, 1, true)
      g.translate(0, 0.5, 0)
      g.applyMatrix4(new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()), new THREE.Vector3(1, d.length(), 1)))
      return g
    })
    return mergeGeometries(parts, false)
  }, [layout])
  useLayoutEffect(() => () => twigGeo?.dispose(), [twigGeo])
  // own copy per bouquet: its draw range is animated
  const ribbonGeo = useMemo(() => ribbonGeometry({ radius: coneR(0.2) + 0.012, height: 0.26 }), [])
  useLayoutEffect(() => () => ribbonGeo.dispose(), [ribbonGeo])
  const bowGeo = shared('bow', bowGeometry)
  // asymmetric wrap: tall paper behind, lower folds in front so the blooms stay on show.
  // Angles are relative to the bouquet's "front" (the hero side), applied via the wrap group.
  const sheets = useMemo(
    () =>
      [
        // tall paper behind, lower folds at the sides and front: the blooms rise above the paper
        { a: Math.PI, arc: 2.4, h: 1.78, r: 1.62, d: 0 },
        { a: Math.PI - 1.15, arc: 2.0, h: 1.44, r: 1.42, d: 0.06 },
        { a: Math.PI + 1.15, arc: 2.0, h: 1.44, r: 1.42, d: 0.12 },
        { a: -1.3, arc: 1.7, h: 1.16, r: 1.18, d: 0.2 },
        { a: 1.3, arc: 1.7, h: 1.16, r: 1.18, d: 0.26 },
        { a: 0, arc: 1.9, h: 0.92, r: 0.96, d: 0.32 },
        { a: Math.PI - 0.45, arc: 1.7, h: 1.92, r: 1.5, d: 0.4, inner: true },
        { a: Math.PI + 0.5, arc: 1.7, h: 1.86, r: 1.46, d: 0.46, inner: true },
      ].map((sh, i) => ({
        geo: shared(`sheet5:${i}`, () => wrapSheetGeometry({ arc: sh.arc, height: sh.h, rTop: sh.r, rBottom: sh.inner ? 0.1 : 0.12, seed: i + 1 })),
        angle: sh.a,
        inner: !!sh.inner,
        delay: sh.d,
      })),
    []
  )

  const dotsRef = useRef()
  const flowerRefs = useRef([])
  const sheetRefs = useRef([])
  const ribbonRef = useRef()
  const bowRef = useRef()
  const foliageRef = useRef()
  const bedRef = useRef()
  // a bed of dense greenery under the blooms: any gap between heads shows leaves, never empty paper or bare stems
  const bedGeo = useMemo(() => {
    const R = 1.62
    const g = new THREE.SphereGeometry(R, 48, 18, 0, Math.PI * 2, 0, Math.min(0.78, layout.thetaMax + 0.16))
    const pos = g.attributes.position
    const col = new Float32Array(pos.count * 3)
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const n = Math.sin(v.x * 9) * Math.cos(v.z * 8) * 0.5 + Math.sin(v.x * 23 + v.z * 19) * 0.5
      v.multiplyScalar(1 + n * 0.035)
      pos.setXYZ(i, v.x, v.y, v.z)
      const k = 0.55 + 0.25 * (n * 0.5 + 0.5)
      col[i * 3] = 0.2 * k
      col[i * 3 + 1] = 0.33 * k
      col[i * 3 + 2] = 0.19 * k
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.computeVertexNormals()
    return g
  }, [layout.thetaMax])
  useLayoutEffect(() => () => bedGeo.dispose(), [bedGeo])
  const born = useRef(new Map())
  // a new composition blooms in again, flower by flower
  useLayoutEffect(() => {
    born.current = new Map()
  }, [layout])

  // baby's breath: one instanced draw call for every floret
  useLayoutEffect(() => {
    const mesh = dotsRef.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    layout.dots.forEach((d, i) => {
      m.compose(d.pos, d.quat, new THREE.Vector3(d.s, d.s, d.s))
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [layout])

  const ribbonCount = ribbonGeo.index.count
  const sheetMats = useMemo(
    () => sheets.map((s) => wrapMaterial(wrap.hex, wrap.clear, s.inner)),
    [sheets, wrap.hex, wrap.clear]
  )
  const ribbonMat = ribbonMaterial(ribbon)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const a = A.current
    const scatter = a.scatter ?? 0
    const windAmp = 0.028 * (a.wind ?? 1) * (0.75 + 0.25 * Math.sin(t * 0.33))
    detach.current = a.detach ?? 0

    layout.flowers.forEach((f, i) => {
      const g = flowerRefs.current[i]
      if (!g) return
      const s = smooth(scatter)
      const sway = Math.sin(t * f.freq + f.phase) * windAmp
      const sway2 = Math.cos(t * f.freq * 0.83 + f.phase * 1.3) * windAmp
      g.position.set(
        BIND.x + (f.dir.x * 1.3 + f.jitter.x * 0.9) * s,
        BIND.y + (f.dir.y * 0.5 + f.jitter.y * 0.8) * s,
        BIND.z + (f.dir.z * 1.3 + f.jitter.z * 0.9) * s
      )
      g.rotation.set(sway + f.spin.x * s * 0.5, f.spin.y * s * 0.4, sway2 + f.spin.z * s * 0.5)
      if (grow) {
        if (!born.current.has(f.i)) born.current.set(f.i, t + f.i * 0.018)
        const k = clamp01((t - born.current.get(f.i)) / 0.65)
        const e = 1 - Math.pow(1 - k, 3)
        g.scale.setScalar(lerp(0.001, 1, e))
      }
    })

    if (bedRef.current) {
      const k = 1 - smooth(scatter * 1.6)
      bedRef.current.visible = k > 0.02
      bedRef.current.scale.setScalar(Math.max(0.001, k))
    }
    if (foliageRef.current) {
      const s = smooth(scatter)
      foliageRef.current.scale.setScalar(1 + s * 0.35)
      foliageRef.current.rotation.y = Math.sin(t * 0.4) * 0.01 + s * 0.3
    }
    if (fillerRef.current) {
      const s = smooth(scatter)
      fillerRef.current.scale.setScalar(1 + s * 0.5)
      fillerRef.current.position.y = BIND.y + s * 0.3
    }

    const w = a.wrap ?? 1
    sheets.forEach((sh, i) => {
      const m = sheetRefs.current[i]
      if (!m) return
      const k = smooth(clamp01((w - sh.delay * 0.6) / (1 - sh.delay * 0.6)))
      m.visible = k > 0.002
      m.scale.set(lerp(0.06, 1, k), lerp(0.25, 1, k), lerp(0.06, 1, k))
      m.rotation.y = sh.angle + (1 - k) * 0.9
    })

    const rb = a.ribbon ?? 1
    if (ribbonRef.current) {
      const k = smooth(clamp01(rb / 0.75))
      const n = Math.floor((ribbonCount / 6) * k) * 6
      ribbonRef.current.geometry.setDrawRange(0, n)
      ribbonRef.current.visible = n > 0
      ribbonRef.current.rotation.y = -(1 - k) * 2.5
    }
    if (bowRef.current) {
      const k = clamp01((rb - 0.7) / 0.3)
      const e = k < 1 ? 1 - Math.pow(1 - k, 3) * Math.cos(k * 6) : 1 // springy pop
      bowRef.current.scale.setScalar(Math.max(0.001, e))
      bowRef.current.visible = k > 0
    }
  })

  // ribbon wraps the paper's neck; bow sits facing the hero side so it ends up facing the camera
  const bowAngle = layout.heroPhi
  const ribbonY = BIND.y + 0.2
  const bowR = coneR(0.2) + 0.04

  return (
    <group>
      {layout.flowers.map((f, i) => {
        const hg = headGeometry(f.kind, quality)
        const isHero = heroRose && i === layout.hero
        return (
          <group key={`${f.kind}-${f.color}-${i}`} ref={(el) => (flowerRefs.current[i] = el)} position={BIND}>
            {/* stem: continues past the binding point so the bundle splays below the wrap */}
            <mesh
              geometry={stemGeo}
              material={stemMaterial()}
              position={f.dir.clone().multiplyScalar(-0.95)}
              quaternion={new THREE.Quaternion().setFromUnitVectors(UP, f.dir)}
              scale={[1, f.L + 0.95 - 0.05, 1]}
              castShadow={shadows}
              receiveShadow={shadows}
            />
            <group position={f.dir.clone().multiplyScalar(f.L)} quaternion={f.quat} scale={f.scale}>
              {isHero ? (
                <HeroRose color={f.color} quality={quality} detach={detach} shadows={shadows} />
              ) : (
                <>
                  <mesh geometry={hg.petals} material={petalMaterial(f.color, quality > 0.5)} castShadow={shadows} receiveShadow={shadows} />
                  <mesh geometry={hg.green} material={greenMaterial()} castShadow={shadows} receiveShadow={shadows} />
                </>
              )}
            </group>
          </group>
        )
      })}

      <mesh ref={bedRef} geometry={bedGeo} material={greenMaterial()} position={BIND} receiveShadow={shadows} />

      <group ref={foliageRef} position={BIND}>
        {layout.leaves.map((l, i) => (
          <mesh key={i} geometry={leafGeo} material={greenMaterial()} position={l.pos} quaternion={l.quat} scale={l.scale} castShadow={shadows} receiveShadow={shadows} />
        ))}
      </group>

      {layout.dots.length > 0 && (
        <group ref={fillerRef} position={BIND}>
          <instancedMesh ref={dotsRef} args={[floretGeo, dotMaterial(), layout.dots.length]} castShadow={shadows} />
          {twigGeo && <mesh geometry={twigGeo} material={stemMaterial()} />}
        </group>
      )}

      <group position={BIND} rotation={[0, layout.heroPhi, 0]}>
        {sheets.map((sh, i) => (
          <mesh key={i} ref={(el) => (sheetRefs.current[i] = el)} geometry={sh.geo} material={sheetMats[i]} rotation={[0, sh.angle, 0]} renderOrder={wrap.clear ? 2 : 0} castShadow={shadows && !wrap.clear} receiveShadow={shadows} />
        ))}
      </group>

      <mesh ref={ribbonRef} geometry={ribbonGeo} material={ribbonMat} position={[0, ribbonY, 0]} castShadow={shadows} receiveShadow={shadows} />
      <group position={[Math.sin(bowAngle) * bowR, ribbonY + 0.02, Math.cos(bowAngle) * bowR]} rotation={[0, bowAngle, 0]}>
        <mesh ref={bowRef} geometry={bowGeo} material={ribbonMat} castShadow={shadows} receiveShadow={shadows} />
      </group>
    </group>
  )
}

export default memo(Bouquet)

/** Expose the hero-rose world position so cameras can fly to it. */
export function heroLocalPosition(layout) {
  if (layout.hero < 0) return new THREE.Vector3(0, 0.6, 0)
  const f = layout.flowers[layout.hero]
  return BIND.clone().add(f.dir.clone().multiplyScalar(f.L))
}
