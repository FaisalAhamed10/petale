import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import { useStore, unitPrice } from '../lib/store'
import { BESTSELLERS, PRODUCTS, inr } from '../data/catalog'
import { prefersReducedMotion } from '../lib/motion'
import { Photo, RevealHeading } from './ui'

const ITEMS = BESTSELLERS.map((id) => PRODUCTS.find((p) => p.id === id))
const EASE = [0.22, 1, 0.36, 1]

function Slide({ p, i, total, root }) {
  const { addProduct, setQuick } = useStore()
  const view = { root, amount: 0.45, once: false }
  return (
    <article className="bs-slide flex w-[84vw] shrink-0 snap-start flex-col gap-6 sm:w-[64vw] md:w-[min(1040px,78vw)] md:flex-row md:items-center md:gap-12">
      <button
        className="group relative block aspect-[4/5] w-full shrink-0 overflow-hidden rounded-[30px] md:aspect-auto md:h-[min(68vh,620px)] md:w-[44%]"
        onClick={() => setQuick(p.id)}
        data-cursor="View"
        aria-label={`Quick view ${p.name}`}
      >
        <Photo id={p.img} alt={`${p.name} bouquet`} sizes="(max-width: 768px) 84vw, 460px" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-silk group-hover:scale-[1.06]" />
        <Photo id={p.alt} alt="" sizes="(max-width: 768px) 84vw, 460px" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        <span className="absolute left-5 top-5 rounded-full bg-ivory/85 px-3 py-1.5 font-sans text-[0.58rem] uppercase tracking-[0.2em] text-burgundy backdrop-blur">
          No. {String(i + 1).padStart(2, '0')} bestseller
        </span>
      </button>
      <div className="md:max-w-md">
        <p className="eyebrow text-rose">
          {String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')} · {p.category}
        </p>
        <motion.h3
          className="display mt-4 text-[2.8rem] text-burgundy md:text-[4.2rem] lg:text-[5rem]"
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={view}
          transition={{ duration: 0.9, ease: EASE }}
        >
          {p.name}
        </motion.h3>
        <motion.div initial={{ y: 24, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={view} transition={{ duration: 0.9, ease: EASE, delay: 0.12 }}>
          <p className="mt-4 font-sans text-[0.95rem] leading-relaxed text-ink/65">{p.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="font-display text-4xl text-burgundy">{inr(unitPrice(p))}</span>
            <button className="btn-dark" onClick={() => addProduct(p.id)}>
              <span className="btn-fill" />
              <span className="btn-label">
                <Plus size={14} /> Add to cart
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </article>
  )
}

/**
 * Bestsellers: a free horizontal carousel. It never pins or takes over the page scroll —
 * vertical scrolling always moves the page; swipe, drag, trackpad or the arrows move the slides.
 */
export default function Bestsellers() {
  const track = useRef(null)
  const [active, setActive] = useState(0)
  const drag = useRef(null)
  const dragged = useRef(false)

  const slideX = (n) => {
    const el = track.current?.children[n]
    return el ? el.offsetLeft - track.current.children[0].offsetLeft : 0
  }
  const goTo = useCallback((i) => {
    const n = Math.max(0, Math.min(ITEMS.length - 1, i))
    track.current?.scrollTo({ left: slideX(n), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [])

  // which slide is in front
  useEffect(() => {
    const el = track.current
    if (!el) return
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        let best = 0
        let dist = Infinity
        ;[...el.children].slice(0, ITEMS.length).forEach((c, k) => {
          const d = Math.abs(c.offsetLeft - el.children[0].offsetLeft - el.scrollLeft)
          if (d < dist) {
            dist = d
            best = k
          }
        })
        setActive(best)
      })
    }
    el.addEventListener('scroll', on, { passive: true })
    return () => {
      el.removeEventListener('scroll', on)
      cancelAnimationFrame(raf)
    }
  }, [])

  // mouse drag-to-scroll on desktop (touch already swipes natively)
  const down = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false }
    track.current.style.scrollSnapType = 'none'
  }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > 4) d.moved = true
    track.current.scrollLeft = d.left - dx
  }
  const up = () => {
    const d = drag.current
    if (!d) return
    drag.current = null
    track.current.style.scrollSnapType = ''
    if (d.moved) {
      dragged.current = true
      setTimeout(() => (dragged.current = false), 0)
      // settle on the nearest slide
      const el = track.current
      let best = 0
      let dist = Infinity
      ;[...el.children].slice(0, ITEMS.length).forEach((c, k) => {
        const dd = Math.abs(c.offsetLeft - el.children[0].offsetLeft - el.scrollLeft)
        if (dd < dist) {
          dist = dd
          best = k
        }
      })
      goTo(best)
    }
  }
  const clickCapture = (e) => {
    if (dragged.current) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  return (
    <section id="bestsellers" className="relative overflow-hidden bg-ivory py-24 md:py-32">
      <div className="container-x flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-rose">Bestsellers</p>
          <RevealHeading className="display mt-4 text-[2.9rem] text-burgundy sm:text-[4rem] lg:text-[5rem]">The most loved blooms.</RevealHeading>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-display text-2xl text-burgundy">
            {String(active + 1).padStart(2, '0')}
            <span className="text-burgundy/35"> / {String(ITEMS.length).padStart(2, '0')}</span>
          </span>
          <button className="icon-btn h-12 w-12 border border-burgundy/25 text-burgundy hover:bg-burgundy hover:text-ivory disabled:opacity-30" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous bestseller">
            <ArrowLeft size={17} strokeWidth={1.4} />
          </button>
          <button className="icon-btn h-12 w-12 border border-burgundy/25 text-burgundy hover:bg-burgundy hover:text-ivory disabled:opacity-30" onClick={() => goTo(active + 1)} disabled={active === ITEMS.length - 1} aria-label="Next bestseller">
            <ArrowRight size={17} strokeWidth={1.4} />
          </button>
        </div>
      </div>

      <div
        ref={track}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onClickCapture={clickCapture}
        data-cursor="Drag"
        className="no-scrollbar mt-12 flex cursor-grab snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain scroll-smooth px-5 pb-4 active:cursor-grabbing sm:px-8 md:mt-16 md:gap-[6vw] lg:px-14"
        style={{ scrollPaddingInline: 'max(20px, 3.5rem)' }}
        aria-roledescription="carousel"
        aria-label="Bestselling bouquets"
      >
        {ITEMS.map((p, i) => (
          <Slide key={p.id} p={p} i={i} total={ITEMS.length} root={track} />
        ))}
        <span className="w-[6vw] shrink-0" aria-hidden="true" />
      </div>

      <div className="container-x mt-8 md:mt-12">
        <div className="relative h-px bg-burgundy/15">
          <div className="absolute inset-y-0 left-0 bg-burgundy transition-[width] duration-500 ease-silk" style={{ width: `${((active + 1) / ITEMS.length) * 100}%` }} />
        </div>
      </div>
    </section>
  )
}
