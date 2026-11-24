import { Suspense, lazy, useLayoutEffect, useRef } from 'react'
import Stage from '../three/Stage'
import { gsap, SplitText, prefersReducedMotion, smoothScrub, useInView, useMobile, liteGPU } from '../lib/motion'
import { IMG } from '../data/catalog'
import { Photo } from './ui'

const GardenScene = lazy(() => import('../three/GardenScene'))

const LINES = [
  { t: 'Grown on hillside farms in the Nilgiris', at: 0.22 },
  { t: 'Cut at dawn, conditioned by noon', at: 0.45 },
  { t: 'In their hands by dusk', at: 0.68 },
]

export default function Garden() {
  const section = useRef(null)
  const progress = useRef(0)
  const mobile = useMobile()
  const [mountRef, near] = useInView('900px', true)
  const quality = mobile || liteGPU() ? 0.3 : 1

  useLayoutEffect(() => {
    let split
    let alive = true
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section)
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: smoothScrub(true),
          onUpdate: (self) => (progress.current = self.progress),
        },
      })
      if (!prefersReducedMotion()) {
        ;(document.fonts?.ready ?? Promise.resolve()).then(() => {
          if (!alive) return
          ctx.add(() => {
            split = new SplitText(q('.gd-title'), { type: 'chars', mask: 'chars' })
            tl.from(split.chars, { yPercent: 120, stagger: 0.004, duration: 0.08 }, 0.02)
          })
        })
      }
      tl.fromTo(q('.gd-sub'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.08)
      tl.to(q('.gd-head'), { autoAlpha: 0, y: -80, scale: 0.94, duration: 0.08 }, 0.2)
      q('.gd-line').forEach((el, i) => {
        const at = LINES[i].at
        tl.fromTo(el, { autoAlpha: 0, y: 40, filter: 'blur(8px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.05 }, at)
        tl.to(el, { autoAlpha: 0, y: -40, filter: 'blur(8px)', duration: 0.05 }, at + 0.14)
      })
      tl.fromTo(q('.gd-end'), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.88)
      tl.set({}, {}, 1)
    }, section)
    return () => {
      alive = false
      ctx.revert()
      split?.revert()
    }
  }, [])

  return (
    <section ref={section} id="garden" className="relative h-[340vh] bg-[#f1e4d8]" aria-label="Let beauty bloom">
      <div ref={mountRef} className="sticky top-0 h-[100svh] overflow-hidden">
        {near && (
          <Stage
            className="absolute inset-0"
            camera={{ position: [0, 1.35, 10.5], fov: 48 }}
            maxDpr={1.25}
            fallback={
              <div className="gd-fallback absolute inset-0">
                <Photo id={IMG.gardenPath} alt="A winding path through a rose garden" ratio={0.6} className="h-full w-full object-cover" sizes="100vw" />
              </div>
            }
          >
            <Suspense fallback={null}>
              <GardenScene quality={quality} progress={progress} />
            </Suspense>
          </Stage>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(84,39,53,0.28)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f1e4d8] to-transparent" />

        <div className="gd-head pointer-events-none absolute inset-x-0 top-[13vh] px-5 text-center text-burgundy md:top-[11vh]" style={{ textShadow: '0 0 50px rgba(248,244,236,0.95), 0 0 18px rgba(248,244,236,0.8)' }}>
          <div>
            <p className="gd-sub eyebrow text-burgundy/70">The flower experience</p>
            <h2 className="gd-title display mt-5 text-[17vw] leading-[0.85] md:text-[9vw]">
              Let beauty
              <br />
              <em className="italic text-rose">bloom.</em>
            </h2>
            <p className="gd-sub mx-auto mt-6 max-w-md font-sans text-[0.95rem] text-ink/70">Scroll to walk through our rose garden.</p>
          </div>
        </div>

        {LINES.map((l, i) => (
          <p key={i} className="gd-line invisible pointer-events-none absolute inset-x-0 top-[18%] px-6 text-center font-display text-[2.6rem] font-light italic leading-tight text-burgundy md:text-[4.4rem]" style={{ textShadow: '0 0 40px rgba(248,244,236,0.95)' }}>
            {l.t}
          </p>
        ))}

        <div className="gd-end invisible pointer-events-none absolute inset-x-0 top-[14vh] px-6 text-center text-burgundy" style={{ textShadow: '0 0 40px rgba(248,244,236,0.95)' }}>
          <p className="eyebrow text-burgundy/70">Fresh from the garden</p>
          <p className="display mx-auto mt-4 max-w-3xl text-[2.4rem] md:text-[3.8rem]">Every bouquet is a garden, gathered for one person.</p>
        </div>
      </div>
    </section>
  )
}
