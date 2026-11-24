import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion, whenScenesReady, lockScroll } from '../lib/motion'

/** Opening screen: a flower draws itself and blooms while the 3D bouquet compiles. */
export default function Loader({ onReveal, onDone }) {
  const root = useRef(null)
  const count = useRef(null)

  useEffect(() => {
    lockScroll(true)
    let alive = true
    let locked = true
    const unlock = () => {
      if (!locked) return
      locked = false
      lockScroll(false)
    }
    const reduced = prefersReducedMotion()
    const q = gsap.utils.selector(root)
    const state = { v: 0 }
    const ctx = gsap.context(() => {
      gsap.set(q('.ld-petal'), { scale: 0, transformOrigin: '50% 100%' })
      const intro = gsap.timeline()
      intro
        .fromTo(q('.ld-stem'), { strokeDashoffset: 220 }, { strokeDashoffset: 0, duration: reduced ? 0 : 1.2, ease: 'power2.inOut' })
        .fromTo(q('.ld-leaf'), { scale: 0, transformOrigin: '0% 100%' }, { scale: 1, duration: reduced ? 0 : 0.8, ease: 'back.out(2)', stagger: 0.15 }, '-=0.6')
        .to(q('.ld-petal'), { scale: 1, duration: reduced ? 0 : 1.1, ease: 'elastic.out(1, 0.55)', stagger: { each: 0.07, from: 'random' } }, '-=0.5')
        .to(q('.ld-bloom'), { rotate: 18, duration: reduced ? 0 : 3, ease: 'sine.inOut', yoyo: true, repeat: -1, transformOrigin: '50% 50%' }, '-=0.6')
        .from(q('.ld-word span'), { yPercent: 110, opacity: 0, stagger: 0.06, duration: 0.9, ease: 'expo.out' }, 0.3)

      // progress: fonts + every 3D scene compiled, never less than ~2.2s so the bloom completes
      const fonts = document.fonts?.ready ?? Promise.resolve()
      const minTime = new Promise((r) => setTimeout(r, reduced ? 300 : 2200))
      const tick = gsap.to(state, {
        v: 86,
        duration: 2.2,
        ease: 'power1.out',
        onUpdate: () => count.current && (count.current.textContent = String(Math.round(state.v)).padStart(2, '0')),
      })
      Promise.all([fonts, whenScenesReady(), minTime]).then(() => {
        if (!alive) return
        tick.kill()
        gsap.to(state, {
          v: 100,
          duration: 0.5,
          ease: 'power2.out',
          onUpdate: () => count.current && (count.current.textContent = String(Math.round(state.v)).padStart(2, '0')),
          onComplete: exit,
        })
      })
    }, root)

    function exit() {
      const q2 = gsap.utils.selector(root)
      const tl = gsap.timeline({
        onComplete: () => {
          unlock()
          onDone?.()
        },
      })
      tl.to(q2('.ld-petal'), { scale: 1.6, opacity: 0, duration: 0.8, ease: 'power3.in', stagger: 0.02 })
        .to(q2('.ld-stem, .ld-leaf, .ld-meta'), { opacity: 0, duration: 0.4 }, '<')
        .add(() => onReveal?.(), '-=0.2')
        .to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.25')
    }

    return () => {
      alive = false
      unlock()
      ctx.revert()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={root} className="fixed inset-0 z-[90] grid place-items-center bg-ivory" style={{ clipPath: 'inset(0 0 0% 0)' }} role="status" aria-live="polite" aria-label="Loading PÉTALE">
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 120 170" className="h-44 w-32 overflow-visible sm:h-52 sm:w-36" aria-hidden="true">
          <path className="ld-stem" d="M60 168 C 58 140, 64 112, 60 74" stroke="#687D60" strokeWidth="2.2" fill="none" strokeDasharray="220" strokeLinecap="round" />
          <path className="ld-leaf" d="M60 130 C 40 124, 30 110, 28 100 C 44 102, 56 112, 60 130Z" fill="#687D60" />
          <path className="ld-leaf" d="M61 112 C 80 108, 90 96, 92 86 C 76 88, 64 98, 61 112Z" fill="#7f9475" />
          <g className="ld-bloom">
            {Array.from({ length: 8 }, (_, i) => (
              <ellipse
                key={i}
                className="ld-petal"
                cx="60"
                cy="46"
                rx="11"
                ry="24"
                transform={`rotate(${i * 45} 60 70)`}
                fill={i % 2 ? '#D98E9C' : '#EBC9C9'}
                opacity="0.92"
              />
            ))}
            <circle className="ld-petal" cx="60" cy="70" r="9" fill="#542735" />
            <circle className="ld-petal" cx="60" cy="70" r="4" fill="#C5A779" />
          </g>
        </svg>
        <div className="ld-word mt-8 overflow-hidden font-display text-4xl font-light tracking-[0.3em] text-burgundy sm:text-5xl" aria-hidden="true">
          {'PÉTALE'.split('').map((c, i) => (
            <span key={i} className="inline-block">
              {c}
            </span>
          ))}
        </div>
        <p className="ld-meta eyebrow mt-3 text-burgundy/50">Atelier Floral</p>
      </div>
      <div className="ld-meta absolute bottom-8 left-0 right-0 flex items-end justify-between px-6 sm:px-12">
        <span className="eyebrow text-burgundy/50">Hand-tying your bouquet</span>
        <span className="font-display text-5xl font-light tabular-nums text-burgundy sm:text-7xl">
          <span ref={count}>00</span>
          <span className="text-2xl text-rose">%</span>
        </span>
      </div>
    </div>
  )
}
