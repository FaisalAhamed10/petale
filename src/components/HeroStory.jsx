import { useEffect, useLayoutEffect, useRef } from 'react'
import { ArrowDown, ArrowRight, Plus } from 'lucide-react'
import Stage from '../three/Stage'
import HeroScene from '../three/HeroScene'
import { story } from '../three/story'
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion, scrollToId, smoothScrub, useMobile, liteGPU } from '../lib/motion'
import { useStore, unitPrice } from '../lib/store'
import { PRODUCTS, inr } from '../data/catalog'
import { Button, Photo } from './ui'

const CHAPTERS = [
  { n: '01', k: 'The Bloom', title: 'Every petal, chosen by hand.', body: 'We cut our roses at the exact hour they begin to open — velvet-soft, fragrant and never forced.', at: [0.13, 0.27], side: 'left' },
  { n: '02', k: 'Release', title: 'Petals take flight.', body: 'Before a bouquet is composed, every bloom is studied, conditioned and freed of tired outer petals.', at: [0.29, 0.43], side: 'right' },
  { n: '03', k: 'Composition', title: 'Gathered into harmony.', body: 'Our florists spiral-tie each stem by hand, turning every flower toward the light.', at: [0.46, 0.58], side: 'left' },
  { n: '04', k: 'The Wrap', title: 'Paper that unfolds like a love letter.', body: 'Layered tissue and textured paper, folded around the stems in a signature cone.', at: [0.6, 0.72], side: 'right' },
  { n: '05', k: 'The Ribbon', title: 'Finished in satin.', body: 'A hand-tied satin ribbon holds the spiral in place — and makes the unwrapping a moment of its own.', at: [0.73, 0.85], side: 'left' },
]

const SIGNATURE = PRODUCTS[0]

function HeroFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="h-[58vh] w-[min(80vw,420px)] overflow-hidden rounded-t-full shadow-2xl shadow-burgundy/20">
        <Photo id={SIGNATURE.img} alt="Eternal Red Roses bouquet" ratio={1.4} eager className="h-full w-full object-cover" sizes="420px" />
      </div>
    </div>
  )
}

export default function HeroStory({ ready }) {
  const wrap = useRef(null)
  const copy = useRef(null)
  const rail = useRef(null)
  const mobile = useMobile()
  const { addProduct, setQuick } = useStore()
  const quality = mobile || liteGPU() ? 0.3 : 1

  // scroll-scrubbed story: one timeline across the whole pinned stage
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(wrap)
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: wrap.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: smoothScrub(true),
          onUpdate: (self) => {
            story.p = self.progress
            rail.current?.style.setProperty('--p', self.progress.toFixed(4))
          },
        },
      })
      tl.fromTo(q('.hero-copy'), { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -70, duration: 0.07 }, 0.025)
      tl.fromTo(q('.scroll-cue'), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.03 }, 0.01)
      CHAPTERS.forEach((c, i) => {
        const el = q(`.chapter-${i}`)
        tl.fromTo(el, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.035 }, c.at[0])
        tl.fromTo(el.map((e) => e.querySelector('.ch-line')), { scaleX: 0 }, { scaleX: 1, duration: 0.05 }, c.at[0])
        tl.to(el, { autoAlpha: 0, y: -60, duration: 0.03 }, c.at[1] - 0.03)
      })
      tl.fromTo(q('.showcase'), { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.9)
      tl.fromTo(q('.story-rail'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.08)
      tl.set({}, {}, 1)
    }, wrap)
    return () => {
      ctx.revert()
      story.p = 0
    }
  }, [])

  // intro: heading characters rise once the loader lifts
  useEffect(() => {
    const el = copy.current
    if (!el) return
    if (!ready) {
      gsap.set(el, { autoAlpha: 0 })
      return
    }
    const reduced = prefersReducedMotion()
    let split
    const ctx = gsap.context(() => {
      gsap.set(el, { autoAlpha: 1 })
      if (reduced) return
      split = new SplitText(el.querySelectorAll('.hero-line'), { type: 'chars,words', mask: 'chars' })
      const tl = gsap.timeline({ delay: 0.1 })
      tl.from(split.chars, { yPercent: 120, rotate: 6, duration: 1.4, ease: 'expo.out', stagger: 0.028 })
        .from(el.querySelectorAll('.hero-fade'), { y: 30, autoAlpha: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1 }, '-=1')
        .from(el.querySelectorAll('.hero-rule'), { scaleX: 0, duration: 1.4, ease: 'expo.inOut' }, '-=1.4')
    }, el)
    ScrollTrigger.refresh()
    return () => {
      ctx.revert()
      split?.revert()
    }
  }, [ready])

  return (
    <section id="home" ref={wrap} className="relative h-[560vh] md:h-[640vh]" aria-label="PÉTALE — flowers that speak without words">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* moving light */}
        <div className="absolute inset-0 bg-gradient-to-b from-ivory via-[#f7ede8] to-[#f2e1dc]" />
        <div className="aurora" aria-hidden="true">
          <span className="a1" />
          <span className="a2" />
          <span className="a3" />
          <span className="a4" />
        </div>
        <div className="grain absolute inset-0" aria-hidden="true" />

        <Stage className="absolute inset-0" camera={{ position: [0, 0.25, 9], fov: 34 }} maxDpr={1.25} fallback={<HeroFallback />}>
          <HeroScene quality={quality} />
        </Stage>

        {/* ------------------------------------------------ hero copy */}
        <div className="hero-copy pointer-events-none absolute inset-0 text-burgundy">
          <div ref={copy} className="container-x invisible relative flex h-full flex-col pb-8 pt-24 sm:pt-28 md:justify-center md:pb-16 md:pt-24">
            <div className="md:max-w-[46vw] lg:max-w-[44vw]">
              <p className="hero-fade eyebrow flex items-center gap-3 text-burgundy/70">
                <span className="hero-rule block h-px w-10 origin-left bg-burgundy/40" />
                Atelier Floral · Est. 2014
              </p>
              <h1 className="display pointer-events-none mt-5 select-none text-[13.5vw] leading-[0.9] sm:text-[10vw] md:mt-7 md:text-[6.6vw]">
                <span className="hero-line block">Flowers that</span>
                <span className="hero-line block">
                  <em className="font-light italic text-rose">speak</em> without
                </span>
                <span className="hero-line block">words.</span>
              </h1>
              <p className="hero-fade mt-5 max-w-md font-sans text-[0.95rem] leading-relaxed text-ink/75 md:mt-8 md:text-[1.02rem]">
                Thoughtfully designed bouquets for life’s most beautiful moments — hand-tied every morning, delivered the same day across Bengaluru.
              </p>
            </div>
            <div className="hero-fade pointer-events-auto mt-auto flex flex-wrap gap-3 md:mt-10">
              <Button variant="dark" onClick={() => scrollToId('collection')}>
                Explore collection <ArrowRight size={15} strokeWidth={1.5} />
              </Button>
              <Button variant="light" onClick={() => scrollToId('customize')}>
                Create your bouquet
              </Button>
            </div>
          </div>
        </div>

        {/* scroll indicator */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: window.innerHeight * 1.2, behavior: 'smooth' })}
          className="scroll-cue absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-burgundy/70 md:flex"
          aria-label="Scroll to discover the story"
        >
          <span className="eyebrow text-[0.58rem]">Scroll to bloom</span>
          <span className="relative h-14 w-px overflow-hidden bg-burgundy/15">
            <span className="scroll-line absolute inset-0 bg-burgundy" />
          </span>
          <ArrowDown size={13} strokeWidth={1.4} className="animate-bounce" />
        </button>

        {/* ------------------------------------------------ chapters */}
        {CHAPTERS.map((c, i) => (
          <div
            key={c.n}
            className={`pointer-events-none absolute inset-x-0 bottom-[9vh] md:bottom-auto md:top-1/2 md:-translate-y-1/2 ${
              c.side === 'left' ? 'md:left-[6vw] md:right-auto' : 'md:left-auto md:right-[6vw]'
            }`}
          >
            <div className={`chapter-${i} invisible`}>
            <div className="mx-5 rounded-[28px] border border-white/60 bg-ivory/70 p-6 text-burgundy shadow-[0_30px_80px_-40px_rgba(84,39,53,0.45)] backdrop-blur-xl md:mx-0 md:w-[min(30rem,36vw)] md:bg-ivory/55 md:p-9">
              <div className="flex items-center gap-4">
                <span className="font-display text-5xl font-light italic text-rose md:text-6xl">{c.n}</span>
                <span className="ch-line h-px flex-1 origin-left bg-burgundy/25" />
                <span className="eyebrow text-burgundy/60">{c.k}</span>
              </div>
              <h2 className="display mt-4 text-[2.1rem] md:mt-6 md:text-[3.1rem]">{c.title}</h2>
              <p className="mt-3 font-sans text-[0.92rem] leading-relaxed text-ink/70 md:mt-5">{c.body}</p>
            </div>
            </div>
          </div>
        ))}

        {/* ------------------------------------------------ finale: the completed bouquet becomes a product */}
        <div className="absolute inset-x-0 bottom-[5vh] md:bottom-auto md:right-[7vw] md:top-1/2 md:left-auto md:-translate-y-1/2">
          <div className="showcase invisible">
          <div className="mx-5 rounded-[30px] bg-burgundy p-6 text-ivory shadow-[0_40px_90px_-30px_rgba(84,39,53,0.7)] md:mx-0 md:w-[min(28rem,34vw)] md:p-10">
            <p className="eyebrow text-blush/80">The Signature · Bestseller</p>
            <h2 className="display mt-3 text-[2.5rem] md:mt-4 md:text-[3.6rem]">{SIGNATURE.name}</h2>
            <p className="mt-3 hidden font-sans text-[0.92rem] leading-relaxed text-ivory/75 sm:block">{SIGNATURE.description}</p>
            <div className="mt-5 flex items-end justify-between md:mt-7">
              <span className="font-display text-4xl font-light">{inr(unitPrice(SIGNATURE))}</span>
              <span className="eyebrow text-blush/70">{SIGNATURE.stems.split('·')[0]}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-7">
              <button className="btn bg-ivory text-burgundy hover:bg-blush" onClick={() => addProduct(SIGNATURE.id)}>
                <span className="btn-label">
                  <Plus size={14} /> Add to cart
                </span>
              </button>
              <button className="btn-ghost" onClick={() => setQuick(SIGNATURE.id)}>
                <span className="btn-label">Quick view</span>
              </button>
            </div>
          </div>
          </div>
        </div>

        {/* story progress rail */}
        <div ref={rail} className="absolute right-5 top-1/2 hidden h-48 -translate-y-1/2 md:block" aria-hidden="true">
          <div className="story-rail invisible relative h-full w-px bg-burgundy/15">
            <div className="absolute inset-x-0 top-0 h-full origin-top bg-burgundy" style={{ transform: 'scaleY(var(--p, 0))' }} />
          </div>
        </div>
      </div>
    </section>
  )
}
