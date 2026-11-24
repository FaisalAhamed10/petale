import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { headGeometry, leafGeometry, shared, rng, lerp } from './flowers'
import Petals from './Petals'
import { pointer, prefersReducedMotion } from '../lib/motion'

const ROSE_COLORS = ['#9E1B2C', '#B8253A', '#D98E9C', '#EBC9C9', '#F3ECDF', '#C2485E', '#E59AAA']
const PETAL_AREA = [10, 5, 26]

function useGarden(quality) {
  return useMemo(() => {
    const r = rng(21)
    const roses = []
    const leaves = []
    const rows = quality > 0.5 ? 26 : 16
    for (let row = 0; row < rows; row++) {
      const z = 9 - row * 1.15
      for (const side of [-1, 1]) {
        const bushes = 1 + Math.round(r() * (quality > 0.5 ? 1.4 : 0.6))
        for (let b = 0; b < bushes; b++) {
          const bx = side * (1.15 + r() * 3.2 + b * 1.1)
          const bz = z + (r() - 0.5) * 0.9
          const bh = 0.55 + r() * 0.6
          const nRoses = 4 + Math.floor(r() * 4)
          const base = ROSE_COLORS[Math.floor(r() * ROSE_COLORS.length)]
          for (let i = 0; i < nRoses; i++) {
            const a = r() * Math.PI * 2
            const rad = r() * 0.5
            roses.push({
              pos: new THREE.Vector3(bx + Math.cos(a) * rad, bh + r() * 0.35, bz + Math.sin(a) * rad),
              rot: new THREE.Euler((r() - 0.5) * 0.9, r() * 6, (r() - 0.5) * 0.9),
              s: 0.42 + r() * 0.22,
              color: r() > 0.8 ? ROSE_COLORS[Math.floor(r() * ROSE_COLORS.length)] : base,
              ph: r() * 10,
            })
          }
          const nLeaves = quality > 0.5 ? 18 : 10
          for (let i = 0; i < nLeaves; i++) {
            const a = r() * Math.PI * 2
            const rad = Math.sqrt(r()) * 0.6
            leaves.push({
              pos: new THREE.Vector3(bx + Math.cos(a) * rad, r() * bh * 1.1, bz + Math.sin(a) * rad),
              rot: new THREE.Euler(r() * 1.6 - 0.2, a + (r() - 0.5), 0, 'YXZ'),
              s: 0.38 + r() * 0.4,
              ph: r() * 10,
            })
          }
        }
      }
    }
    return { roses, leaves }
  }, [quality])
}

/** Warm light shafts falling through the garden: additive gradient planes. */
function useShaftTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 64
    c.height = 256
    const ctx = c.getContext('2d')
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, 'rgba(255,236,210,0.9)')
    g.addColorStop(1, 'rgba(255,236,210,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 256)
    const h = ctx.createLinearGradient(0, 0, 64, 0)
    h.addColorStop(0, 'rgba(0,0,0,1)')
    h.addColorStop(0.5, 'rgba(0,0,0,0)')
    h.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = h
    ctx.fillRect(0, 0, 64, 256)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}

export default function GardenScene({ quality = 1, progress }) {
  const { roses, leaves } = useGarden(quality)
  const roseRef = useRef()
  const leafRef = useRef()
  const sun = useRef()
  const shafts = useRef()
  const shaftTex = useShaftTexture()
  const reduced = prefersReducedMotion()
  const { size } = useThree()

  const roseGeo = headGeometry('rose', 0).petals
  const leafGeo = shared('garden-leaf', () => leafGeometry({ w: 0.26, h: 0.5, fold: 0.3, droop: 0.2, seg: 5 }))
  const roseMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.6, sheen: quality > 0.5 ? 0.7 : 0, sheenRoughness: 0.5, sheenColor: '#ffe4ea', side: THREE.DoubleSide }),
    [quality]
  )
  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }), [])
  useLayoutEffect(() => () => (roseMat.dispose(), leafMat.dispose()), [roseMat, leafMat])

  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(40, 60, 60, 90)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const col = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const path = Math.exp(-((x + Math.sin(z * 0.25) * 0.3) ** 2) / 0.9)
      pos.setY(i, Math.sin(x * 0.7) * Math.cos(z * 0.5) * 0.06 * (1 - path))
      const n = 0.9 + 0.1 * Math.sin(x * 3.1 + z * 2.3)
      // moss green beds, a pale gravel path down the middle
      col[i * 3] = lerp(0.27, 0.9, path) * n
      col[i * 3 + 1] = lerp(0.42, 0.84, path) * n
      col[i * 3 + 2] = lerp(0.22, 0.74, path) * n
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.computeVertexNormals()
    return g
  }, [])
  useLayoutEffect(() => () => ground.dispose(), [ground])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const c = new THREE.Color()
    roses.forEach((r, i) => {
      q.setFromEuler(r.rot)
      m.compose(r.pos, q, new THREE.Vector3(r.s, r.s, r.s))
      roseRef.current.setMatrixAt(i, m)
      roseRef.current.setColorAt(i, c.set(r.color))
    })
    roseRef.current.instanceMatrix.needsUpdate = true
    if (roseRef.current.instanceColor) roseRef.current.instanceColor.needsUpdate = true
    leaves.forEach((l, i) => {
      q.setFromEuler(l.rot)
      m.compose(l.pos, q, new THREE.Vector3(l.s, l.s, l.s))
      leafRef.current.setMatrixAt(i, m)
    })
    leafRef.current.instanceMatrix.needsUpdate = true
  }, [roses, leaves])

  const sm = useRef({ p: 0, px: 0, py: 0 })
  const m = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const e = useMemo(() => new THREE.Euler(), [])
  const sc = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime
    const d = Math.min(dt, 0.05)
    const S = sm.current
    S.p += ((progress?.current ?? 0) - S.p) * (1 - Math.exp(-d * 5))
    S.px += (pointer.x - S.px) * (1 - Math.exp(-d * 2.5))
    S.py += (pointer.y - S.py) * (1 - Math.exp(-d * 2.5))
    const portrait = size.width / size.height < 0.9

    // walk down the garden path as the section scrolls by
    const z = lerp(10.5, -4, S.p)
    const bob = reduced ? 0 : Math.sin(t * 1.1) * 0.025
    camera.position.set(Math.sin(S.p * 3) * 0.25 + S.px * 0.3, 1.35 + bob + S.py * 0.12, z)
    camera.lookAt(Math.sin(S.p * 3 + 0.6) * 0.4 + S.px * 0.9, 0.95 + S.py * 0.3, z - 6)
    const fov = portrait ? 62 : 48
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    // a soft breeze through the nearest roses (only those close to the camera are re-posed)
    if (!reduced && roseRef.current) {
      let dirty = false
      roses.forEach((r, i) => {
        if (Math.abs(r.pos.z - z) > 7) return
        e.set(r.rot.x + Math.sin(t * 1.2 + r.ph) * 0.06, r.rot.y, r.rot.z + Math.cos(t + r.ph) * 0.06)
        q.setFromEuler(e)
        m.compose(r.pos, q, sc.setScalar(r.s))
        roseRef.current.setMatrixAt(i, m)
        dirty = true
      })
      if (dirty) roseRef.current.instanceMatrix.needsUpdate = true
    }

    // the sun drifts — shadows and shafts slowly move with it
    if (sun.current) {
      sun.current.position.set(-6 + Math.sin(t * 0.08) * 3, 9, z - 10 + Math.cos(t * 0.06) * 2)
      sun.current.target.position.set(0, 0, z - 3)
      sun.current.target.updateMatrixWorld()
    }
    if (shafts.current) {
      shafts.current.children.forEach((s, i) => {
        s.material.opacity = 0.16 + Math.sin(t * 0.5 + i * 1.7) * 0.07
      })
    }
  })

  const shadows = false // soft fog + light shafts carry the depth; a shadow pass over hundreds of roses costs smoothness

  return (
    <>
      <color attach="background" args={['#f1e4d8']} />
      <fog attach="fog" args={['#f1e2d6', 5, 24]} />
      <hemisphereLight args={['#fff1e0', '#4b5a3c', 0.9]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        ref={sun}
        intensity={2.6}
        color="#ffe3c2"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-far={30}
        shadow-bias={-0.0006}
      />
      <mesh geometry={ground} receiveShadow={shadows}>
        <meshStandardMaterial vertexColors roughness={0.95} />
      </mesh>
      <instancedMesh ref={roseRef} args={[roseGeo, roseMat, roses.length]} castShadow={shadows} frustumCulled={false} />
      <instancedMesh ref={leafRef} args={[leafGeo, leafMat, leaves.length]} castShadow={shadows} receiveShadow={shadows} frustumCulled={false} />
      <group ref={shafts}>
        {[-3, 1.5, -0.5, 3.5].map((x, i) => (
          <mesh key={i} position={[x, 3, 4 - i * 4.5]} rotation={[0, 0, 0.35]} scale={[1.6, 7, 1]}>
            <planeGeometry />
            <meshBasicMaterial map={shaftTex} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
          </mesh>
        ))}
      </group>
      <Petals count={quality > 0.5 ? 90 : 36} area={PETAL_AREA} center={[0, 2.2, 0]} speed={reduced ? 0.2 : 1} size={1.1} />
    </>
  )
}
