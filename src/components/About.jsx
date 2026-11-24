import { gsap, useGsap, prefersReducedMotion, fadeUp, smoothScrub } from '../lib/motion'
import { IMG } from '../data/catalog'
import { FallingPetals, Photo, RevealHeading } from './ui'

const STATS = [
  { v: '12', s: 'years', l: 'of floral craft' },
  { v: '48k', s: '+', l: 'bouquets hand-tied' },
  { v: '4.9', s: '★', l: 'average rating' },
  { v: '90', s: 'min', l: 'express delivery' },
]

/** Line-art botanical sprig that draws itself as you scroll. */
function Sprig({ className = '' }) {
  return (
    <svg viewBox="0 0 220 420" className={className} fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" aria-hidden="true">
      <path className="draw" d="M110 415 C 108 330, 120 250, 104 160 C 96 110, 110 60, 128 10" />
      <path className="draw" d="M106 330 C 70 320, 46 296, 40 268 C 72 272, 98 296, 106 330Z" />
      <path className="draw" d="M110 270 C 146 262, 172 238, 180 208 C 148 212, 120 236, 110 270Z" />
      <path className="draw" d="M104 200 C 72 192, 52 168, 48 142 C 76 146, 98 170, 104 200Z" />
      <path className="draw" d="M108 140 C 136 130, 156 106, 160 82 C 134 88, 114 110, 108 140Z" />
      <path className="draw" d="M128 10 C 112 22, 112 44, 126 52 C 142 42, 142 22, 128 10Z" />
    </svg>
  )
}

export default function About() {
  const scope = useGsap((root) => {
    const q = gsap.utils.selector(root)
    fadeUp(q('.ab-fade'), { trigger: root, start: 'top 70%' })
    if (prefersReducedMotion()) return
    // image reveals: a curtain lifts while the photo settles from a gentle zoom
    q('.ab-img').forEach((wrap) => {
      const img = wrap.querySelector('img')
      gsap.fromTo(wrap, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } })
      gsap.fromTo(img, { scale: 1.35 }, { scale: 1.12, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } })
      // parallax drift
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: smoothScrub(true) } })
    })
    q('.ab-depth').forEach((el) => {
      gsap.fromTo(el, { y: Number(el.dataset.depth) * 80 }, { y: Number(el.dataset.depth) * -80, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: smoothScrub(true) } })
    })
    q('.draw').forEach((p) => {
      const len = p.getTotalLength()
      gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: root, start: 'top 75%', end: 'center 40%', scrub: smoothScrub(1) } })
    })
  })

  return (
    <section id="about" ref={scope} className="relative overflow-hidden bg-ivory py-28 md:py-40">
      <FallingPetals count={9} className="opacity-70" />
      <div className="container-x relative grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="relative lg:col-span-5 lg:pt-10">
          <p className="ab-fade eyebrow text-rose">Our floral story</p>
          <RevealHeading className="display mt-6 text-[3.3rem] text-burgundy sm:text-[5rem] lg:text-[6.2rem]">
            Every flower has a story.
          </RevealHeading>
          <p className="ab-fade mt-8 max-w-md font-sans text-[1.02rem] leading-[1.85] text-ink/75">
            We believe flowers are more than beautiful arrangements. They are emotions, memories, celebrations, and moments worth remembering.
          </p>
          <p className="ab-fade mt-5 max-w-md font-sans text-[0.95rem] leading-[1.85] text-ink/60">
            Since our first stall in a Bengaluru flower market, every PÉTALE bouquet has been composed by hand — stems conditioned overnight, petals inspected one by one, and every wrap folded like a letter you can’t wait to open.
          </p>
          <div className="ab-fade mt-12 grid max-w-md grid-cols-2 gap-x-8 gap-y-8 border-t border-burgundy/15 pt-10">
            {STATS.map((s) => (
              <div key={s.l}>
                <p className="font-display text-5xl font-light text-burgundy">
                  {s.v}
                  <span className="ml-1 text-2xl text-rose">{s.s}</span>
                </p>
                <p className="eyebrow mt-2 text-[0.6rem] text-ink/50">{s.l}</p>
              </div>
            ))}
          </div>
          <Sprig className="pointer-events-none absolute -left-10 top-[58%] hidden h-[340px] text-botanical/70 xl:block" />
        </div>

        <div className="relative lg:col-span-7">
          <div className="relative mx-auto h-[640px] max-w-[680px] sm:h-[760px]">
            <div className="ab-img absolute right-0 top-0 h-[78%] w-[72%] overflow-hidden rounded-t-[999px] rounded-b-[28px]">
              <Photo id={IMG.florist} alt="A PÉTALE florist arranging roses at the atelier bench" ratio={1.35} className="h-full w-full scale-110 object-cover" sizes="(max-width: 1024px) 72vw, 480px" />
            </div>
            <div className="ab-depth absolute bottom-0 left-0 w-[46%]" data-depth="0.8">
              <div className="ab-img aspect-[4/5] overflow-hidden rounded-[24px] shadow-[0_40px_80px_-30px_rgba(84,39,53,0.45)]">
                <Photo id={IMG.detail} alt="Close-up of blush garden roses" ratio={1.25} className="h-full w-full scale-110 object-cover" sizes="(max-width: 1024px) 46vw, 320px" />
              </div>
            </div>
            <div className="ab-depth absolute left-[6%] top-[6%] w-[26%]" data-depth="-0.6">
              <div className="ab-img aspect-square overflow-hidden rounded-full border-[6px] border-ivory shadow-xl">
                <Photo id={IMG.floristShop} alt="Flowers being prepared in the shop" ratio={1} className="h-full w-full scale-110 object-cover" sizes="200px" />
              </div>
            </div>
            <div className="ab-depth absolute bottom-[14%] right-[-2%] rounded-full bg-burgundy px-6 py-5 text-center text-ivory shadow-2xl sm:right-[4%]" data-depth="0.4">
              <p className="font-display text-3xl italic leading-none">Since</p>
              <p className="eyebrow mt-1 text-blush">2014</p>
            </div>
          </div>
        </div>
      </div>

      {/* editorial marquee */}
      <div className="relative mt-28 overflow-hidden border-y border-burgundy/10 py-6 md:mt-36" aria-hidden="true">
        <div className="marquee flex w-max gap-12 whitespace-nowrap font-display text-5xl font-light italic text-burgundy/80 md:text-7xl">
          {Array.from({ length: 2 }, (_, k) => (
            <span key={k} className="flex gap-12">
              {['Roses', 'Peonies', 'Tulips', 'Lilies', 'Ranunculus', 'Baby’s breath', 'Eucalyptus', 'Garden roses'].map((w) => (
                <span key={w} className="flex items-center gap-12">
                  {w}
                  <span className="text-2xl not-italic text-rose">✿</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
