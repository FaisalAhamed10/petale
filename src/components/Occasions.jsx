import { ArrowUpRight } from 'lucide-react'
import { useStore } from '../lib/store'
import { OCCASIONS } from '../data/catalog'
import { gsap, useGsap, fadeUp, prefersReducedMotion, scrollToId, smoothScrub } from '../lib/motion'
import { Photo, RevealHeading } from './ui'

// editorial heights so the grid never reads as a uniform template
const SHAPES = ['aspect-[3/4]', 'aspect-[4/5] lg:mt-24', 'aspect-[3/4] lg:mt-10', 'aspect-[4/5] lg:mt-36', 'aspect-[4/5] lg:-mt-12', 'aspect-[3/4] lg:mt-8', 'aspect-[4/5] lg:-mt-20', 'aspect-[3/4]']

export default function Occasions() {
  const { setFilter } = useStore()
  const scope = useGsap((root) => {
    const q = gsap.utils.selector(root)
    fadeUp(q('.oc-fade'), { trigger: root, start: 'top 75%' })
    if (prefersReducedMotion()) return
    q('.oc-card').forEach((card, i) => {
      const media = card.querySelector('.oc-media')
      const img = card.querySelector('img')
      gsap.fromTo(media, { clipPath: 'inset(18% 12% 18% 12% round 200px)' }, { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 1.5, ease: 'expo.out', delay: (i % 4) * 0.08, scrollTrigger: { trigger: card, start: 'top 88%', once: true } })
      gsap.fromTo(img, { scale: 1.4 }, { scale: 1.08, duration: 1.8, ease: 'expo.out', delay: (i % 4) * 0.08, scrollTrigger: { trigger: card, start: 'top 88%', once: true } })
      gsap.from(card.querySelectorAll('.oc-text'), { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08, delay: 0.3 + (i % 4) * 0.08, scrollTrigger: { trigger: card, start: 'top 88%', once: true } })
      gsap.fromTo(card, { y: (i % 2 ? 60 : 20) }, { y: i % 2 ? -60 : -20, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: smoothScrub(true) } })
    })
  })

  const choose = (id) => {
    setFilter({ category: 'All', occasion: id })
    scrollToId('collection')
  }

  return (
    <section id="occasions" ref={scope} className="relative overflow-hidden bg-burgundy py-28 text-ivory md:py-40">
      <div className="container-x">
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="oc-fade eyebrow text-blush/80">Gifting · Shop by occasion</p>
            <RevealHeading className="display mt-6 text-[3.2rem] sm:text-[5rem] lg:text-[6.4rem]">
              For every moment <em className="italic text-blush">worth a flower.</em>
            </RevealHeading>
          </div>
          <p className="oc-fade font-sans text-[0.98rem] leading-relaxed text-ivory/65 lg:col-span-4">
            From first birthdays to golden anniversaries — choose the moment, and we’ll show you the bouquets our florists recommend for it.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
          {OCCASIONS.map((o, i) => (
            <button key={o.id} className="oc-card group block text-left" onClick={() => choose(o.id)} data-cursor="Shop" aria-label={`Shop ${o.name}`}>
              <div className={`oc-media relative overflow-hidden rounded-[26px] ${SHAPES[i]}`}>
                <span className="absolute inset-0 transition-transform duration-[1.6s] ease-silk group-hover:scale-[1.08]">
                  <Photo id={o.img} alt="" ratio={1.3} sizes="(max-width: 1024px) 46vw, 24vw" className="absolute inset-0 h-full w-full object-cover" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-t from-wine/80 via-wine/10 to-transparent" />
                <span className="absolute right-3 top-3 grid h-10 w-10 -rotate-45 place-items-center rounded-full bg-ivory/90 text-burgundy opacity-0 transition-all duration-500 ease-silk group-hover:rotate-0 group-hover:opacity-100 sm:right-4 sm:top-4">
                  <ArrowUpRight size={17} strokeWidth={1.5} />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  <p className="oc-text eyebrow text-[0.55rem] text-blush/90">0{i + 1}</p>
                  <h3 className="oc-text mt-2 font-display text-[1.6rem] font-light leading-[0.95] transition-transform duration-700 ease-silk group-hover:-translate-y-1 sm:text-[2.3rem]">{o.name}</h3>
                  <p className="oc-text mt-2 hidden font-sans text-[0.82rem] text-ivory/70 sm:block">{o.line}</p>
                  <span className="mt-4 block h-px w-full origin-left scale-x-0 bg-ivory/60 transition-transform duration-700 ease-silk group-hover:scale-x-100" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
