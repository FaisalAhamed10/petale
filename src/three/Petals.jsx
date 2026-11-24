import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { petalGeometry, rng, shared } from './flowers'

const PALETTE = ['#B3263A', '#D98E9C', '#EBC9C9', '#C2485E', '#F3E2DC', '#8E1D2C']

/**
 * Rose petals drifting through the air: one instanced draw call, each petal
 * tumbling on its own path and wrapping around the volume when it falls out.
 */
export default function Petals({ count = 70, area = [9, 7, 6], center = [0, 0, 0], speed = 1, colors = PALETTE, size = 1, wind = 0.25 }) {
  const ref = useRef()
  const geo = shared('drift-petal', () => {
    const g = petalGeometry({ w: 0.5, h: 0.55, cup: 0.6, curl: 0.15, segW: 5, segH: 5, seed: 3 })
    g.translate(0, -0.27, 0)
    return g
  })
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.6,
        side: THREE.DoubleSide,
      }),
    []
  )
  const parts = useMemo(() => {
    const r = rng(77)
    return Array.from({ length: count }, () => ({
      p: new THREE.Vector3((r() - 0.5) * area[0], (r() - 0.5) * area[1], (r() - 0.5) * area[2]),
      v: new THREE.Vector3((r() - 0.3) * 0.12, -(0.12 + r() * 0.2), (r() - 0.5) * 0.06),
      rot: new THREE.Euler(r() * 6, r() * 6, r() * 6),
      spin: new THREE.Vector3((r() - 0.5) * 1.6, (r() - 0.5) * 1.6, (r() - 0.5) * 1.6),
      s: (0.07 + r() * 0.08) * size,
      ph: r() * 10,
    }))
  }, [count, area, size])

  useLayoutEffect(() => {
    const mesh = ref.current
    const c = new THREE.Color()
    const r = rng(9)
    parts.forEach((_, i) => {
      c.set(colors[Math.floor(r() * colors.length)])
      mesh.setColorAt(i, c)
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [parts, colors])
  useLayoutEffect(() => () => mat.dispose(), [mat])

  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const sv = useMemo(() => new THREE.Vector3(), [])
  const scl = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const d = Math.min(dt, 0.05) * speed
    const t = clock.elapsedTime
    const hx = area[0] / 2
    const hy = area[1] / 2
    const hz = area[2] / 2
    parts.forEach((pt, i) => {
      pt.p.x += (pt.v.x + Math.sin(t * 0.5 + pt.ph) * wind * 0.4) * d
      pt.p.y += pt.v.y * d
      pt.p.z += (pt.v.z + Math.cos(t * 0.4 + pt.ph) * 0.05) * d
      if (pt.p.y < -hy) pt.p.y = hy
      if (pt.p.x > hx) pt.p.x = -hx
      if (pt.p.x < -hx) pt.p.x = hx
      if (pt.p.z > hz) pt.p.z = -hz
      if (pt.p.z < -hz) pt.p.z = hz
      pt.rot.x += pt.spin.x * d
      pt.rot.y += pt.spin.y * d
      pt.rot.z += pt.spin.z * d
      q.setFromEuler(pt.rot)
      scl.setScalar(pt.s)
      m.compose(sv.set(pt.p.x + center[0], pt.p.y + center[1], pt.p.z + center[2]), q, scl)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />
}
