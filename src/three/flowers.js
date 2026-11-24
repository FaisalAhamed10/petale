import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/* -------------------------------------------------------------------------- */
/*  Small maths helpers                                                        */
/* -------------------------------------------------------------------------- */

export const lerp = (a, b, t) => a + (b - a) * t
export const clamp01 = (t) => Math.max(0, Math.min(1, t))
export const smooth = (t) => {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}
export const ramp = (p, a, b) => smooth((p - a) / (b - a))

/** Deterministic PRNG so every bouquet composes the same way on every visit. */
export function rng(seed = 1) {
  let s = seed >>> 0
  return () => {
    s += 0x6d2b79f5
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const tmpM = new THREE.Matrix4()
const tmpQ = new THREE.Quaternion()
const tmpE = new THREE.Euler()
const ONE = new THREE.Vector3(1, 1, 1)

function place(geo, { pos = [0, 0, 0], rot = [0, 0, 0], scale = 1, order = 'YXZ' }) {
  tmpE.set(rot[0], rot[1], rot[2], order)
  tmpQ.setFromEuler(tmpE)
  const s = typeof scale === 'number' ? ONE.clone().multiplyScalar(scale) : new THREE.Vector3(...scale)
  tmpM.compose(new THREE.Vector3(...pos), tmpQ, s)
  return geo.clone().applyMatrix4(tmpM)
}

/** Give a geometry a vertex-colour attribute from fn(position, uv) -> [r,g,b]. */
function paint(geo, fn) {
  const pos = geo.attributes.position
  const uv = geo.attributes.uv
  const col = new Float32Array(pos.count * 3)
  const p = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i)
    const c = fn(p, uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0)
    col[i * 3] = c[0]
    col[i * 3 + 1] = c[1]
    col[i * 3 + 2] = c[2]
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return geo
}

/** Merge indexed parts; each part keeps its own smooth normals. */
const merge = (list) => mergeGeometries(list, false)

/* -------------------------------------------------------------------------- */
/*  Petals                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A single petal grown along +Y from its base, its inner (concave) face towards -Z.
 * shape: 'round' (rose / peony), 'oval' (tulip), 'point' (lily), 'strap' (sunflower)
 */
export function petalGeometry({
  w = 0.5,
  h = 0.6,
  cup = 0.5, // curvature across the width
  curl = 0.2, // tip rolls outward (+Z)
  belly = 0.06, // lengthwise bowl
  ruffle = 0,
  roll = 0, // margins roll back outward (+Z) — the reflexed edge of an opening rose
  notch = 0, // small heart-shaped dip at the tip
  shape = 'round',
  segW = 9,
  segH = 11,
  tint = null, // fn(v,u) -> [r,g,b] multiplier
  seed = 1,
} = {}) {
  const geo = new THREE.PlaneGeometry(1, 1, segW, segH)
  geo.translate(0, 0.5, 0)
  const pos = geo.attributes.position
  const col = new Float32Array(pos.count * 3)
  const r = rng(seed)
  const ph = r() * 10
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) // -0.5..0.5
    const v = pos.getY(i) // 0..1
    let f
    // smooth, fully rounded outlines: widest above the middle, closing in a soft curve (no corners)
    if (shape === 'round') f = Math.max(0.24, Math.pow(Math.sin(Math.PI * Math.pow(Math.min(v, 0.999), 1.45)), 0.55))
    else if (shape === 'oval') f = Math.max(0.28, Math.pow(Math.sin(Math.PI * Math.min(v, 0.999)), 0.6))
    else if (shape === 'point') f = Math.pow(Math.sin(Math.PI * v), 0.85) * (1 - 0.25 * v)
    else f = v < 0.12 ? 0.45 + 0.55 * (v / 0.12) : 1 - 0.1 * v
    let x = u * w * f
    let y = v * h
    // rounded / pointed tip
    if (shape === 'strap' && v > 0.86) y -= Math.abs(u * 2) * 0.12 * h
    const across = (x / (w * 0.5)) ** 2
    let z = -across * cup * w * 0.5
    z -= Math.sin(v * Math.PI) * belly * h
    z += curl * h * smooth((v - 0.5) / 0.5) ** 2
    if (ruffle) z += Math.sin(u * 15 + ph + v * 4) * ruffle * smooth(v) * h
    if (roll) z += roll * w * smooth((Math.abs(u * 2) - 0.45) / 0.55) ** 2 * smooth((v - 0.2) / 0.6)
    if (notch) y -= notch * h * Math.exp(-((u * 9) ** 2)) * smooth((v - 0.8) / 0.2)
    pos.setXYZ(i, x, y, z)

    // shading: deeper at the heart, softer and lighter towards the rim
    const shade = lerp(0.5, 1, smooth(v * 1.25)) * (1 - 0.06 * Math.pow(Math.cos(u * Math.PI * 9), 10) * (1 - v))
    let c = [shade, shade, shade]
    if (tint) {
      const t = tint(v, u)
      c = [shade * t[0], shade * t[1], shade * t[2]]
    }
    col[i * 3] = Math.min(1, c[0])
    col[i * 3 + 1] = Math.min(1, c[1])
    col[i * 3 + 2] = Math.min(1, c[2])
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  geo.computeVertexNormals()
  return geo
}

/* -------------------------------------------------------------------------- */
/*  Flower heads — each returns { petals, green, extra? } geometries,          */
/*  built around the origin with the flower facing +Y.                         */
/* -------------------------------------------------------------------------- */

/** Rose petal transforms, shared by the merged head and the "hero" rose whose petals can separate. */
export function rosePetalSpecs(n = 22, seed = 7) {
  const r = rng(seed)
  const specs = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    specs.push({
      w: lerp(0.2, 0.56, Math.pow(t, 0.8)),
      h: lerp(0.24, 0.5, Math.pow(t, 0.7)),
      cup: lerp(1.15, 0.38, t),
      curl: lerp(-0.02, 0.42, t * t),
      roll: lerp(0, 0.3, Math.pow(t, 1.4)),
      tilt: lerp(0.06, 1.12, Math.pow(t, 1.6)) + (r() - 0.5) * 0.08,
      radius: lerp(0.015, 0.13, t),
      y: lerp(0.1, -0.03, t),
      angle: i * GOLDEN + (r() - 0.5) * 0.2,
      seed: i + seed * 31,
    })
  }
  return specs
}

export function rosePetal(spec, quality = 1) {
  return petalGeometry({
    w: spec.w,
    h: spec.h,
    cup: spec.cup,
    curl: spec.curl,
    belly: 0.05,
    ruffle: 0.012,
    roll: spec.roll,
    notch: 0,
    shape: 'round',
    segW: quality > 0.5 ? 11 : 6,
    segH: quality > 0.5 ? 13 : 6,
    seed: spec.seed,
  })
}

export const roseTransform = (s) => ({ pos: [Math.sin(s.angle) * s.radius, s.y, Math.cos(s.angle) * s.radius], rot: [s.tilt, s.angle, 0] })

function greenBase({ sepals = 5, size = 0.3, seed = 3 } = {}) {
  const parts = []
  const rec = new THREE.SphereGeometry(0.09, 12, 8)
  rec.scale(1, 0.9, 1)
  rec.translate(0, -0.06, 0)
  parts.push(paint(rec, () => [0.36, 0.5, 0.28]))
  const r = rng(seed)
  for (let i = 0; i < sepals; i++) {
    const leaf = leafGeometry({ w: 0.1, h: size, fold: 0.2, droop: 0.12, seg: 6 })
    const a = (i / sepals) * Math.PI * 2 + r() * 0.3
    parts.push(place(leaf, { pos: [Math.sin(a) * 0.07, -0.04, Math.cos(a) * 0.07], rot: [2.1 + r() * 0.3, a, 0] }))
  }
  return merge(parts)
}

export function roseHead(quality = 1) {
  const specs = rosePetalSpecs(quality > 0.5 ? 26 : 15)
  const petals = merge(specs.map((s) => place(rosePetal(s, quality), roseTransform(s))))
  return { petals, green: greenBase({ sepals: 5, size: 0.32 }) }
}

export function peonyHead(quality = 1) {
  const n = quality > 0.5 ? 46 : 28
  const r = rng(11)
  const parts = []
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const s = {
      w: lerp(0.22, 0.6, t),
      h: lerp(0.2, 0.44, Math.pow(t, 0.6)),
      cup: lerp(0.9, 0.5, t),
      curl: lerp(-0.05, 0.18, t),
      tilt: lerp(0.25, 1.35, Math.pow(t, 1.2)) + (r() - 0.5) * 0.15,
      radius: lerp(0.02, 0.2, Math.sqrt(t)),
      y: lerp(0.12, -0.04, t),
      angle: i * GOLDEN * 1.02 + r() * 0.3,
    }
    const g = petalGeometry({ w: s.w, h: s.h, cup: s.cup, curl: s.curl, ruffle: 0.018, belly: 0.08, segW: quality > 0.5 ? 8 : 5, segH: quality > 0.5 ? 8 : 5, seed: i + 400 })
    parts.push(place(g, roseTransform(s)))
  }
  return { petals: merge(parts), green: greenBase({ sepals: 5, size: 0.28, seed: 5 }) }
}

export function tulipHead(quality = 1) {
  const parts = []
  const tint = (v) => [lerp(0.78, 1, smooth(v * 3)), lerp(0.88, 1, smooth(v * 3)), lerp(0.62, 1, smooth(v * 3))]
  for (let i = 0; i < 6; i++) {
    const inner = i % 2 === 0
    const a = (i / 6) * Math.PI * 2
    const g = petalGeometry({ w: inner ? 0.34 : 0.38, h: 0.56, cup: 1.05, curl: -0.06, belly: 0.1, shape: 'oval', segW: quality > 0.5 ? 8 : 5, segH: quality > 0.5 ? 10 : 6, tint, seed: i + 70 })
    parts.push(place(g, { pos: [Math.sin(a) * (inner ? 0.05 : 0.075), -0.02, Math.cos(a) * (inner ? 0.05 : 0.075)], rot: [inner ? 0.1 : 0.2, a, 0] }))
  }
  const rec = new THREE.SphereGeometry(0.07, 10, 6)
  rec.translate(0, -0.03, 0)
  return { petals: merge(parts), green: merge([paint(rec, () => [0.4, 0.55, 0.3])]) }
}

export function lilyHead(quality = 1) {
  const parts = []
  const tint = (v) => [lerp(0.86, 1, smooth(v * 2.6)), lerp(0.96, 1, smooth(v * 2.6)), lerp(0.55, 1, smooth(v * 2.6))]
  for (let i = 0; i < 6; i++) {
    const inner = i % 2 === 0
    const a = (i / 6) * Math.PI * 2 + (inner ? 0 : 0.08)
    const g = petalGeometry({ w: inner ? 0.24 : 0.2, h: 0.62, cup: 0.35, curl: 0.42, belly: -0.03, shape: 'point', segW: quality > 0.5 ? 7 : 5, segH: quality > 0.5 ? 12 : 7, tint, seed: i + 90 })
    parts.push(place(g, { pos: [Math.sin(a) * 0.04, 0, Math.cos(a) * 0.04], rot: [inner ? 0.95 : 1.1, a, 0] }))
  }
  // stamens (pale green filaments) + anthers (rust pollen)
  const stems = []
  const anthers = []
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.5
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(Math.sin(a) * 0.05, 0.22, Math.cos(a) * 0.05),
      new THREE.Vector3(Math.sin(a) * 0.16, 0.36, Math.cos(a) * 0.16)
    )
    stems.push(paint(new THREE.TubeGeometry(curve, 8, 0.006, 4), () => [0.75, 0.82, 0.55]))
    const an = new THREE.CapsuleGeometry(0.012, 0.05, 2, 6)
    anthers.push(place(paint(an, () => [0.55, 0.22, 0.1]), { pos: [Math.sin(a) * 0.16, 0.37, Math.cos(a) * 0.16], rot: [Math.PI / 2, a, 0] }))
  }
  const rec = new THREE.SphereGeometry(0.06, 10, 6)
  rec.translate(0, -0.03, 0)
  return { petals: merge(parts), green: merge([paint(rec, () => [0.45, 0.58, 0.32]), ...stems, ...anthers]) }
}

export function sunflowerHead(quality = 1) {
  const parts = []
  const tint = (v) => [1, lerp(0.75, 1, smooth(v * 2)), lerp(0.6, 1, smooth(v * 2))]
  for (let ring = 0; ring < 2; ring++) {
    const n = 20
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ring * 0.16
      const g = petalGeometry({ w: 0.13, h: 0.4, cup: 0.25, curl: 0.05, belly: 0.03, shape: 'strap', segW: 4, segH: quality > 0.5 ? 8 : 5, tint, seed: i + ring * 40 + 200 })
      parts.push(place(g, { pos: [Math.sin(a) * 0.19, 0.02 - ring * 0.01, Math.cos(a) * 0.19], rot: [1.38 + ring * 0.12, a, 0] }))
    }
  }
  const disc = new THREE.SphereGeometry(0.22, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  disc.scale(1, 0.3, 1)
  paint(disc, (p) => {
    const r = Math.hypot(p.x, p.z) / 0.22
    const seedy = 0.85 + 0.15 * Math.sin(Math.atan2(p.z, p.x) * 34 + r * 40)
    return [lerp(0.18, 0.36, r) * seedy, lerp(0.1, 0.2, r) * seedy, lerp(0.05, 0.08, r)]
  })
  const back = new THREE.SphereGeometry(0.2, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)
  back.scale(1, 0.35, 1)
  paint(back, () => [0.35, 0.48, 0.25])
  return { petals: merge(parts), green: merge([disc, back]) }
}

/* -------------------------------------------------------------------------- */
/*  Foliage, stems, paper, ribbon                                              */
/* -------------------------------------------------------------------------- */

/**
 * A leaf with a serrated margin, folded along the midrib, with vein shading baked
 * into vertex colours (midrib + pinnate lateral veins).
 */
export function leafGeometry({ w = 0.22, h = 0.62, fold = 0.35, droop = 0.18, seg = 10, serrate = 0.06, teeth = 9, tone = [0.3, 0.46, 0.26] } = {}) {
  const geo = new THREE.PlaneGeometry(1, 1, 8, seg * 2)
  geo.translate(0, 0.5, 0)
  const pos = geo.attributes.position
  const col = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i)
    const v = pos.getY(i)
    let f = Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.02)), 0.85) * (1 - 0.18 * v)
    // saw-tooth margin
    if (serrate && Math.abs(u) > 0.42) f *= 1 - serrate * (((v * teeth) % 1) ** 2) * smooth(v * 4) * smooth((1 - v) * 4)
    const x = u * w * f
    const z = -Math.abs(x) * fold - v * v * droop * h + Math.sin(v * 9 + u * 4) * 0.006
    pos.setXYZ(i, x, v * h, z)
    const au = Math.abs(u) * 2
    const midrib = Math.pow(1 - Math.min(1, au * 6), 3)
    // lateral veins sweep up and out from the midrib
    const lat = Math.pow(Math.abs(Math.sin((v * 7 - au * 1.6) * Math.PI)), 14) * (1 - au) * 0.9
    const g = lerp(0.68, 1.02, v) * (1 + 0.32 * midrib + 0.14 * lat) * (1 - 0.12 * au * au)
    col[i * 3] = tone[0] * g
    col[i * 3 + 1] = tone[1] * g
    col[i * 3 + 2] = tone[2] * g
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  geo.computeVertexNormals()
  return geo
}

/** A rose-leaf spray: a short petiole with a terminal leaflet and two opposite pairs. */
export function leafSprayGeometry({ seed = 4 } = {}) {
  const r = rng(seed)
  const parts = []
  const len = 0.62
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, len * 0.5, -0.04), new THREE.Vector3(0, len, -0.12))
  parts.push(paint(new THREE.TubeGeometry(curve, 10, 0.009, 5), () => [0.33, 0.45, 0.25]))
  const leaflet = (sc) => leafGeometry({ w: 0.2 * sc, h: 0.34 * sc, fold: 0.3, droop: 0.12, seg: 7, serrate: 0.09, teeth: 8 })
  parts.push(place(leaflet(1.15), { pos: [0, len, -0.12], rot: [-0.25, 0, 0] }))
  ;[0.42, 0.72].forEach((t, k) => {
    const p = curve.getPoint(t)
    for (const side of [-1, 1]) {
      parts.push(place(leaflet(0.85 + k * 0.12 + r() * 0.08), { pos: [p.x, p.y, p.z], rot: [0.15, 0, side * (1.05 - k * 0.15)], order: 'XYZ' }))
    }
  })
  return merge(parts)
}

/** Baby's breath floret: five tiny rounded petals around a green-white eye (unit size). */
export function floretGeometry() {
  const parts = []
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const pet = new THREE.CircleGeometry(0.55, 7)
    pet.scale(0.75, 1, 1)
    pet.translate(0, 0.5, 0)
    parts.push(place(paint(pet, () => [1, 1, 0.98]), { pos: [0, 0, 0], rot: [-1.1, a, 0], order: 'YXZ' }))
  }
  const eye = new THREE.SphereGeometry(0.28, 6, 4)
  parts.push(paint(eye, () => [0.86, 0.9, 0.72]))
  return merge(parts)
}

/** Unit stem: a thin cylinder from y=0 to y=1, scaled per flower. */
export function stemGeometry() {
  const g = new THREE.CylinderGeometry(0.014, 0.018, 1, 6, 1, true)
  g.translate(0, 0.5, 0)
  return g
}

/** One curved sheet of wrapping paper: a slice of a cone, hinged at its narrow base (y = 0). */
export function wrapSheetGeometry({ rTop = 1.3, rBottom = 0.12, height = 1.65, arc = 1.7, seed = 1, seg = 24 } = {}) {
  const geo = new THREE.CylinderGeometry(rTop, rBottom, height, seg * 2, 16, true, -arc / 2, arc)
  geo.translate(0, height / 2, 0)
  const pos = geo.attributes.position
  const r = rng(seed)
  const ph = r() * 10
  const p = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i)
    const v = p.y / height
    const ang = Math.atan2(p.x, p.z)
    // crinkles grow towards the open top edge; pleats run up the cone like hand folds
    const crinkle = (Math.sin(ang * 9 + ph) * 0.5 + Math.sin(ang * 23 + ph * 2) * 0.25 + Math.sin(ang * 41 + v * 6 + ph) * 0.12) * 0.035 * v * v
    const pleat = (Math.abs(Math.sin(ang * 4.5 + ph * 0.7)) - 0.6) * 0.045 * v
    // the paper flares open near the top like a real hand-folded cone, so blooms sit inside it
    const flare = 0.3 * Math.pow(v, 2.5)
    const k = 1 + crinkle + pleat + flare
    p.x *= k
    p.z *= k
    if (v > 0.95) p.y += Math.sin(ang * 6 + ph) * 0.05
    pos.setXYZ(i, p.x, p.y, p.z)
  }
  geo.computeVertexNormals()
  return geo
}

/**
 * Satin ribbon spiralling around the bouquet's neck: a flat band (not a tube) so it reads as
 * real ribbon. Indexed segment by segment, so setDrawRange() can "wind" it on.
 */
export function ribbonGeometry({ turns = 2.25, radius = 0.165, height = 0.3, width = 0.075, segments = 180 } = {}) {
  const pos = []
  const nor = []
  const uv = []
  const idx = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const a = t * turns * Math.PI * 2
    const r = radius + 0.012 * Math.sin(t * Math.PI * turns * 2)
    const y = -height / 2 + t * height
    const sx = Math.sin(a)
    const cz = Math.cos(a)
    // band tilts with the helix so the wraps cross over each other like hand-tied satin
    const tilt = 0.35
    for (const side of [-0.5, 0.5]) {
      pos.push(sx * (r + side * width * 0.12), y + side * width, cz * (r + side * width * 0.12) + side * width * tilt * 0)
      nor.push(sx, 0, cz)
      uv.push(t * turns * 4, side + 0.5)
    }
    if (i < segments) {
      const k = i * 2
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

export function bowGeometry() {
  const parts = []
  // two loops
  for (const side of [-1, 1]) {
    const loop = new THREE.TorusGeometry(0.15, 0.05, 8, 40)
    loop.scale(1.25, 0.66, 0.28) // flattened: reads as a satin band rather than cord
    parts.push(place(loop, { pos: [side * 0.17, 0.03, 0], rot: [0, side * 0.35, side * -0.25] }))
  }
  // knot
  const knot = new THREE.SphereGeometry(0.06, 16, 10)
  knot.scale(1.1, 0.95, 0.55)
  parts.push(knot)
  // two tails
  for (const side of [-1, 1]) {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(side * 0.08, -0.15, 0.04),
      new THREE.Vector3(side * 0.06, -0.3, 0.02),
      new THREE.Vector3(side * 0.16, -0.48, 0.05)
    )
    const tail = new THREE.TubeGeometry(curve, 24, 0.046, 8, false)
    tail.scale(1, 1, 0.26)
    parts.push(tail)
  }
  return merge(parts)
}

/* -------------------------------------------------------------------------- */
/*  Textures + materials (cached so every bouquet shares them)                 */
/* -------------------------------------------------------------------------- */

/* ---- procedural textures (drawn once on canvases, no downloads) ---- */

const texCache = new Map()
function canvasTex(key, w, h, draw, { srgb = false, repeat = null } = {}) {
  if (texCache.has(key)) return texCache.get(key)
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(repeat, repeat)
  }
  t.anisotropy = 4
  texCache.set(key, t)
  return t
}

/** Fan of fine veins from the petal's base, used both as colour detail and relief. */
function drawVeins(ctx, w, h, { stroke, n = 46, seed = 5, width = 1.2 }) {
  const r = rng(seed)
  ctx.strokeStyle = stroke
  for (let i = 0; i < n; i++) {
    const t = (i + r() * 0.6) / n
    const endX = t * w
    ctx.lineWidth = width * (0.5 + r())
    ctx.beginPath()
    ctx.moveTo(w / 2 + (t - 0.5) * w * 0.12, h)
    ctx.bezierCurveTo(w / 2 + (t - 0.5) * w * 0.4, h * 0.65, endX + (r() - 0.5) * 12, h * 0.3, endX + (r() - 0.5) * 18, h * (0.02 + r() * 0.12))
    ctx.stroke()
  }
}

/** Petal colour detail (multiplies the bloom colour): veins, a paler heart, a faintly darker rim. */
export const petalMap = () =>
  canvasTex(
    'petal-map',
    256,
    512,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, h, 0, 0)
      g.addColorStop(0, '#f4ecd2') // pale, slightly golden heart
      g.addColorStop(0.22, '#ffffff')
      g.addColorStop(0.85, '#ffffff')
      g.addColorStop(1, '#ece4e4')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      drawVeins(ctx, w, h, { stroke: 'rgba(90,40,50,0.10)', n: 54 })
      const r = rng(17)
      for (let i = 0; i < 160; i++) {
        const x = r() * w
        const y = r() * h
        const rad = 4 + r() * 18
        const sp = ctx.createRadialGradient(x, y, 0, x, y, rad)
        sp.addColorStop(0, r() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(80,30,40,0.06)')
        sp.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = sp
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
      }
      const rim = ctx.createLinearGradient(0, 0, 0, h * 0.08)
      rim.addColorStop(0, 'rgba(70,30,35,0.18)')
      rim.addColorStop(1, 'rgba(70,30,35,0)')
      ctx.fillStyle = rim
      ctx.fillRect(0, 0, w, h * 0.08)
    },
    { srgb: true }
  )

export const petalBump = () =>
  canvasTex('petal-bump', 256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, w, h)
    drawVeins(ctx, w, h, { stroke: 'rgba(255,255,255,0.35)', n: 54, width: 1.6 })
  })

export function paperBump() {
  return canvasTex(
    'paper-bump',
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#808080'
      ctx.fillRect(0, 0, w, h)
      const r = rng(99)
      // fibres
      for (let i = 0; i < 6000; i++) {
        const g = Math.floor(96 + r() * 70)
        ctx.fillStyle = 'rgba(' + g + ',' + g + ',' + g + ',0.3)'
        ctx.fillRect(r() * w, r() * h, 1 + r() * 9, 1)
      }
      // crumple creases: faceted polylines with a lit edge and a shaded edge
      for (let i = 0; i < 70; i++) {
        const pts = []
        let x = r() * w
        let y = r() * h
        const ang = r() * Math.PI
        pts.push([x, y])
        for (let k = 0; k < 4; k++) {
          x += Math.cos(ang + (r() - 0.5)) * (30 + r() * 60)
          y += Math.sin(ang + (r() - 0.5)) * (30 + r() * 60)
          pts.push([x, y])
        }
        const lw = 1 + r() * 2.5
        ;[
          ['rgba(255,255,255,' + (0.12 + r() * 0.15) + ')', 0],
          ['rgba(0,0,0,' + (0.1 + r() * 0.12) + ')', 2],
        ].forEach(([style, off]) => {
          ctx.lineWidth = lw
          ctx.strokeStyle = style
          ctx.beginPath()
          pts.forEach(([px, py], k) => (k ? ctx.lineTo(px + off, py + off) : ctx.moveTo(px + off, py + off)))
          ctx.stroke()
        })
      }
    },
    { repeat: 2 }
  )
}

/**
 * Light glowing through thin petals: an emissive term proportional to the petal colour,
 * strongest at grazing angles (edges and curled rims) — a cheap stand-in for subsurface scattering.
 */
function translucent(mat, amount) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTrans = { value: amount }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTrans;')
      .replace(
        '#include <emissivemap_fragment>',
        [
          '#include <emissivemap_fragment>',
          'float ndv = abs(dot(normalize(normal), normalize(vViewPosition)));',
          'totalEmissiveRadiance += diffuseColor.rgb * uTrans * (0.3 + 0.7 * pow(1.0 - ndv, 2.0));',
        ].join('\n')
      )
  }
  mat.customProgramCacheKey = () => 'translucent-' + amount
  return mat
}

const mats = new Map()
function cached(key, make) {
  if (!mats.has(key)) mats.set(key, make())
  return mats.get(key)
}

export const petalMaterial = (hex, hq = true) =>
  cached('petal:' + hex + ':' + hq, () => {
    const color = new THREE.Color(hex)
    const dark = color.getHSL({}).l < 0.4
    const sheen = color.clone().lerp(new THREE.Color('#ffffff'), 0.45)
    return translucent(
      new THREE.MeshPhysicalMaterial({
        color,
        vertexColors: true,
        map: petalMap(),
        bumpMap: hq ? petalBump() : null,
        bumpScale: 0.9,
        roughness: 0.52,
        sheen: hq ? 1 : 0,
        sheenRoughness: 0.38,
        sheenColor: sheen,
        side: THREE.DoubleSide,
      }),
      dark ? 0.2 : 0.06
    )
  })

export const greenMaterial = () =>
  cached(
    'green',
    () =>
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.48,
        clearcoat: 0.25,
        clearcoatRoughness: 0.5,
        side: THREE.DoubleSide,
      })
  )

export const stemMaterial = () => cached('stem', () => new THREE.MeshStandardMaterial({ color: '#5f7d49', roughness: 0.45 }))

export const wrapMaterial = (hex, clear = false, inner = false) =>
  cached('wrap:' + hex + ':' + clear + ':' + inner, () => {
    const color = new THREE.Color(hex)
    if (inner) color.lerp(new THREE.Color('#ffffff'), 0.35)
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness: clear ? 0.08 : 0.8,
      metalness: 0,
      emissive: clear ? new THREE.Color('#000000') : color.clone().multiplyScalar(0.16),
      sheen: clear ? 0 : 0.6,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color('#ffffff'),
      clearcoat: clear ? 1 : 0,
      iridescence: clear ? 0.35 : 0,
      transparent: clear,
      opacity: clear ? (inner ? 0.16 : 0.28) : 1,
      depthWrite: !clear,
      bumpMap: clear ? null : paperBump(),
      bumpScale: 1.4,
      side: THREE.DoubleSide,
    })
  })

export const ribbonMaterial = (hex) =>
  cached('ribbon:' + hex, () => {
    const gold = hex.toLowerCase() === '#c9a46a'
    return new THREE.MeshPhysicalMaterial({
      color: hex,
      roughness: gold ? 0.28 : 0.3,
      metalness: gold ? 0.55 : 0.05,
      // satin: highlights stretched along the weave
      anisotropy: 0.8,
      sheen: 1,
      sheenRoughness: 0.25,
      sheenColor: new THREE.Color('#ffffff'),
      clearcoat: 0.35,
      clearcoatRoughness: 0.3,
      side: THREE.DoubleSide,
    })
  })

export const dotMaterial = () =>
  cached('dot', () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, emissive: '#4a4540', emissiveIntensity: 0.3, side: THREE.DoubleSide }))

/* geometry cache keyed by kind + quality */
const geos = new Map()
const BUILDERS = { rose: roseHead, peony: peonyHead, tulip: tulipHead, lily: lilyHead, sunflower: sunflowerHead }
export function headGeometry(kind, quality = 1) {
  const key = `${kind}:${quality > 0.5 ? 'hi' : 'lo'}`
  if (!geos.has(key)) geos.set(key, BUILDERS[kind](quality))
  return geos.get(key)
}
export function shared(key, make) {
  if (!geos.has(key)) geos.set(key, make())
  return geos.get(key)
}
