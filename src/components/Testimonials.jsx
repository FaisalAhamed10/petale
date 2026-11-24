import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Quote } from 'lucide-react'
import { TESTIMONIALS } from '../data/catalog'
import { useReducedMotion } from '../lib/motion'
import { Photo, RevealHeading, Stars } from './ui'

const EASE = [0.22, 1, 0.36, 1]

export default function Testimonials() {
  const [[i, dir], set] = useState([0, 1])
  const [paused, setPaused] = useState(false)
  const reduced = useReducedMotion()
  const t = TESTIMONIALS[i]
  const go = useCallback((d) => set(([n]) => [(n + d + TESTIMONIALS.length) % TESTIMONIALS.length, d]), [])

  useEffect(() => {
    if (paused || reduced) return
    const id = setTimeout(() => go(1), 7000)
    return () => clearTimeout(id)
  }, [i, paused, reduced, go])

  const img = {
    enter: (d) => ({ clipPath: d > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)', scale: 1.15 }),
    center: { clipPath: 'inset(0 0% 0 0%)', scale: 1, transition: { duration: 1.2, ease: EASE } },
    exit: { opacity: 0.4, scale: 1.02, transition: { duration: 1.2, ease: EASE } },
  }
  const text = {
    enter: (d) => ({ opacity: 0, x: d * 60 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.9, ease: EASE, delay: 0.15 } },
    exit: (d) => ({ opacity: 0, x: d * -60, transition: { duration: 0.5, ease: EASE } }),
  }

  return (
    <section id="testimonials" className="relative overflow-hidden bg-blush/45 py-28 md:py-40" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-rose">Kind words</p>
            <RevealHeading className="display mt-5 text-[3rem] text-burgundy sm:text-[4.4rem] lg:text-[5.4rem]">Loved, then remembered.</RevealHeading>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => go(-1)} className="icon-btn h-14 w-14 border border-burgundy/25 text-burgundy hover:bg-burgundy hover:text-ivory" aria-label="Previous review">
              <ArrowLeft size={18} strokeWidth={1.4} />
            </button>
            <button onClick={() => go(1)} className="icon-btn h-14 w-14 border border-burgundy/25 text-burgundy hover:bg-burgundy hover:text-ivory" aria-label="Next review">
              <ArrowRight size={18} strokeWidth={1.4} />
            </button>
          </div>
        </div>

        <div className="mt-14 grid items-center gap-10 md:grid-cols-12 md:gap-14" aria-roledescription="carousel" aria-label="Customer reviews">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[30px] bg-blush md:col-span-5">
            <AnimatePresence initial={false} custom={dir}>
              <motion.div key={i} custom={dir} variants={img} initial="enter" animate="center" exit="exit" className="absolute inset-0">
                <Photo id={t.img} alt={`${t.bouquet} bouquet delivered to ${t.name}`} ratio={1.25} sizes="(max-width: 768px) 92vw, 40vw" className="h-full w-full object-cover" />
              </motion.div>
            </AnimatePresence>
            <span className="absolute bottom-4 left-4 z-10 rounded-full bg-ivory/90 px-4 py-2 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-burgundy backdrop-blur">{t.bouquet}</span>
          </div>

          <motion.div
            className="relative min-h-[22rem] md:col-span-7"
            drag={reduced ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1)
              else if (info.offset.x > 60) go(-1)
            }}
            data-cursor="Drag"
          >
            <Quote size={56} strokeWidth={0.8} className="text-rose" aria-hidden="true" />
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.figure key={i} custom={dir} variants={text} initial="enter" animate="center" exit="exit" aria-live="polite">
                <Stars n={t.rating} className="mt-6" />
                <blockquote className="mt-6 font-display text-[1.9rem] font-light leading-[1.2] text-burgundy sm:text-[2.5rem] lg:text-[2.9rem]">“{t.quote}”</blockquote>
                <figcaption className="mt-8 flex items-center gap-4">
                  <span className="h-px w-12 bg-burgundy/40" />
                  <span>
                    <span className="block font-sans text-[0.95rem] font-medium text-burgundy">{t.name}</span>
                    <span className="eyebrow text-[0.58rem] text-ink/50">
                      {t.city} · Verified order <span className="normal-case tracking-normal">(sample review)</span>
                    </span>
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
            <div className="mt-10 flex gap-2" role="tablist" aria-label="Choose review">
              {TESTIMONIALS.map((x, n) => (
                <button key={n} role="tab" aria-selected={n === i} aria-label={`Review ${n + 1} of ${TESTIMONIALS.length}`} onClick={() => set([n, n > i ? 1 : -1])} className="group relative h-6 w-10">
                  <span className="absolute inset-x-0 top-1/2 h-px bg-burgundy/20" />
                  {n === i && <motion.span layoutId="tdot" className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-px bg-burgundy" />}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
