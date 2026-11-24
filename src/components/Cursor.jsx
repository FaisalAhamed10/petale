import { useEffect, useRef, useState } from 'react'
import { gsap, curtain, prefersReducedMotion, useFinePointer } from '../lib/motion'
import { BloomMark } from './ui'

/** Dot + trailing ring. The ring grows over links and shows a label for [data-cursor] targets. */
export function Cursor() {
  const fine = useFinePointer()
  const dot = useRef(null)
  const ring = useRef(null)
  const [label, setLabel] = useState('')
  const [mode, setMode] = useState('') // '' | 'link' | 'label'

  useEffect(() => {
    if (!fine) return
    document.documentElement.classList.add('has-cursor')
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3.out' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3.out' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3.out' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3.out' })
    let shown = false
    const move = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return
      if (!shown) {
        shown = true
        gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 })
      }
      dx(e.clientX)
      dy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
      const t = e.target instanceof Element ? e.target : null
      const labelled = t?.closest('[data-cursor]')
      if (labelled && labelled.getAttribute('data-cursor')) {
        setMode('label')
        setLabel(labelled.getAttribute('data-cursor'))
      } else if (t?.closest('a, button, [role="button"], label, input[type="range"], select, summary')) {
        setMode('link')
        setLabel('')
      } else {
        setMode('')
        setLabel('')
      }
    }
    const leave = () => {
      shown = false
      gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.3 })
    }
    const down = () => gsap.to(ring.current, { scale: 0.85, duration: 0.2 })
    const up = () => gsap.to(ring.current, { scale: 1, duration: 0.3 })
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [fine])

  if (!fine) return null
  const ringSize = mode === 'label' ? 92 : mode === 'link' ? 58 : 38
  return (
    <>
      <div ref={dot} className="pointer-events-none fixed left-0 top-0 z-[120] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-burgundy opacity-0 mix-blend-multiply" aria-hidden="true" />
      <div ref={ring} className="pointer-events-none fixed left-0 top-0 z-[119] opacity-0" aria-hidden="true">
        <div
          className={`grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border transition-[width,height,background-color,border-color] duration-500 ease-silk ${
            mode === 'label' ? 'border-transparent bg-burgundy/90 text-ivory backdrop-blur-sm' : mode === 'link' ? 'border-rose bg-blush/25' : 'border-burgundy/35'
          }`}
          style={{ width: ringSize, height: ringSize }}
        >
          {mode === 'label' && <span className="eyebrow text-[0.55rem] tracking-[0.25em]">{label}</span>}
        </div>
      </div>
    </>
  )
}

/** Petal curtain used as the "page transition" when jumping between distant sections. */
export function Curtain() {
  const root = useRef(null)
  useEffect(() => {
    if (prefersReducedMotion()) return
    const el = root.current
    curtain.play = (midway) => {
      const tl = gsap.timeline()
      tl.set(el, { display: 'grid', yPercent: 100, borderRadius: '50% 50% 0 0 / 12% 12% 0 0' })
        .to(el, { yPercent: 0, borderRadius: '0% 0% 0 0 / 0% 0% 0 0', duration: 0.75, ease: 'expo.in' })
        .fromTo(el.querySelector('.ct-mark'), { scale: 0.4, rotate: -40, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, '-=0.25')
        .add(() => midway?.())
        .to(el, { yPercent: -100, borderRadius: '0 0 50% 50% / 0 0 12% 12%', duration: 0.85, ease: 'expo.inOut', delay: 0.15 })
        .set(el, { display: 'none' })
      return tl
    }
    return () => {
      curtain.play = null
    }
  }, [])
  return (
    <div ref={root} className="fixed inset-0 z-[95] hidden place-items-center bg-burgundy text-blush" aria-hidden="true">
      <div className="ct-mark flex flex-col items-center gap-4">
        <BloomMark size={54} />
        <span className="font-display text-3xl font-light tracking-[0.35em] text-ivory">PÉTALE</span>
      </div>
    </div>
  )
}
