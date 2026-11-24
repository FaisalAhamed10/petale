import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Eye, Plus, X } from 'lucide-react'
import { useStore, unitPrice } from '../lib/store'
import { CATEGORIES, OCCASIONS, PRODUCTS, inr } from '../data/catalog'
import { gsap, useGsap, fadeUp, isTouch, prefersReducedMotion } from '../lib/motion'
import { Photo, PetalShape, RevealHeading } from './ui'

// asymmetric editorial rhythm, repeated every eight cards
const LAYOUT = [
  { span: 'lg:col-span-5', ratio: 1.25, mt: '' },
  { span: 'lg:col-span-4', ratio: 1.3, mt: 'lg:mt-28' },
  { span: 'lg:col-span-3', ratio: 1.45, mt: 'lg:mt-56' },
  { span: 'lg:col-span-3', ratio: 1.4, mt: 'lg:-mt-6' },
  { span: 'lg:col-span-5', ratio: 0.85, mt: 'lg:mt-24' },
  { span: 'lg:col-span-4', ratio: 1.3, mt: 'lg:-mt-20' },
  { span: 'lg:col-span-4 lg:col-start-2', ratio: 1.3, mt: 'lg:mt-4' },
  { span: 'lg:col-span-6', ratio: 0.9, mt: 'lg:mt-28' },
]

const POP = [
  { dx: '-60px', dy: '-150px', rot: '220deg', left: '20%', c: '#D98E9C' },
  { dx: '40px', dy: '-170px', rot: '-260deg', left: '45%', c: '#EBC9C9' },
  { dx: '70px', dy: '-130px', rot: '300deg', left: '70%', c: '#B8253A' },
  { dx: '-30px', dy: '-190px', rot: '-180deg', left: '35%', c: '#E7A7B6' },
  { dx: '20px', dy: '-120px', rot: '240deg', left: '60%', c: '#C5A779' },
  { dx: '-80px', dy: '-110px', rot: '-300deg', left: '10%', c: '#D98E9C' },
]

export function ProductCard({ product, layout = LAYOUT[0], index = 0 }) {
  const { addProduct, setQuick, toggleWish, wish } = useStore()
  const card = useRef(null)
  const glare = useRef(null)
  const [hover, setHover] = useState(false)
  const saved = wish.includes(product.id)

  // 3D tilt + glare following the pointer
  useEffect(() => {
    const el = card.current
    if (!el || isTouch() || prefersReducedMotion()) return
    gsap.set(el, { transformPerspective: 1100 })
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      rx(-y * 9)
      ry(x * 11)
      if (glare.current) glare.current.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.35), transparent 55%)`
    }
    const leave = () => {
      rx(0)
      ry(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <article
      ref={card}
      className="group relative will-change-transform [transform-style:preserve-3d]"
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <div className="relative overflow-hidden rounded-[26px] bg-blush/40" style={{ aspectRatio: `1 / ${layout.ratio}` }}>
        <button className="absolute inset-0 z-[1] block h-full w-full" onClick={() => setQuick(product.id)} data-cursor="View" aria-label={`Quick view ${product.name}`}>
          <Photo
            id={product.img}
            alt={`${product.name} bouquet`}
            ratio={layout.ratio}
            sizes="(max-width: 768px) 92vw, (max-width: 1024px) 46vw, 34vw"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-silk group-hover:scale-[1.08]"
          />
          <Photo
            id={product.alt}
            alt=""
            ratio={layout.ratio}
            sizes="(max-width: 768px) 92vw, (max-width: 1024px) 46vw, 34vw"
            className="absolute inset-0 h-full w-full scale-[1.12] object-cover opacity-0 transition-[opacity,transform] duration-[1.2s] ease-silk group-hover:scale-100 group-hover:opacity-100"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-wine/55 via-transparent to-transparent opacity-60 transition-opacity duration-700 group-hover:opacity-90" />
          <span ref={glare} className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-100" />
        </button>

        {/* petals burst on hover */}
        {hover && !prefersReducedMotion() && (
          <span className="pointer-events-none absolute inset-x-0 bottom-10 z-[2] h-0" aria-hidden="true">
            {POP.map((p, i) => (
              <span key={i} className="petal-svg bottom-0" style={{ left: p.left, '--dx': p.dx, '--dy': p.dy, '--rot': p.rot, animation: `petalPop 1.6s cubic-bezier(.2,.7,.3,1) ${i * 0.07}s both` }}>
                <PetalShape color={p.c} size={16 + (i % 3) * 5} />
              </span>
            ))}
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-start justify-between p-4 sm:p-5">
          <span className="rounded-full bg-ivory/85 px-3 py-1.5 font-sans text-[0.58rem] uppercase tracking-[0.2em] text-burgundy backdrop-blur">{product.category}</span>
          <button
            className={`pointer-events-auto grid h-10 w-10 place-items-center rounded-full backdrop-blur transition-colors duration-300 ${saved ? 'bg-burgundy text-ivory' : 'bg-ivory/85 text-burgundy hover:bg-ivory'}`}
            onClick={() => toggleWish(product.id)}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          >
            <Heart size={16} strokeWidth={1.5} className={saved ? 'fill-current' : ''} />
          </button>
        </div>
        {product.tag && (
          <span className="pointer-events-none absolute left-4 top-16 z-[2] font-display text-xl italic text-ivory drop-shadow sm:left-5">{product.tag}</span>
        )}

        {/* actions slide up on hover (always visible on touch) */}
        <div className="absolute inset-x-0 bottom-0 z-[3] flex gap-2 p-4 transition-all duration-700 ease-silk sm:p-5 [@media(hover:hover)]:translate-y-6 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100">
          <button onClick={() => addProduct(product.id)} className="btn flex-1 bg-ivory px-4 py-3.5 text-burgundy hover:bg-burgundy hover:text-ivory">
            <span className="btn-label">
              <Plus size={14} strokeWidth={1.6} /> Add to cart
            </span>
          </button>
          <button onClick={() => setQuick(product.id)} className="grid w-12 place-items-center rounded-full border border-ivory/60 bg-ivory/15 text-ivory backdrop-blur transition-colors hover:bg-ivory hover:text-burgundy" aria-label={`Quick view ${product.name}`}>
            <Eye size={17} strokeWidth={1.4} />
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4 px-1">
        <div>
          <p className="eyebrow text-[0.58rem] text-rose">
            {String(index + 1).padStart(2, '0')} · {product.stems.split('·')[0].trim()}
          </p>
          <h3 className="mt-2 font-display text-[1.9rem] font-normal leading-none text-burgundy transition-transform duration-700 ease-silk group-hover:translate-x-1.5">{product.name}</h3>
          <p className="mt-2 max-w-xs font-sans text-[0.86rem] leading-relaxed text-ink/60">{product.short}</p>
        </div>
        <p className="shrink-0 font-display text-2xl text-burgundy">{inr(unitPrice(product))}</p>
      </div>
    </article>
  )
}

export default function Collection() {
  const { filter, setFilter } = useStore()
  const list = useMemo(
    () =>
      PRODUCTS.filter((p) => (filter.category === 'All' || p.category === filter.category) && (!filter.occasion || p.occasions.includes(filter.occasion))),
    [filter]
  )
  const occasion = OCCASIONS.find((o) => o.id === filter.occasion)

  const scope = useGsap((root) => {
    fadeUp(gsap.utils.selector(root)('.col-fade'), { trigger: root, start: 'top 75%' })
  })

  return (
    <section id="collection" ref={scope} className="relative bg-ivory pb-32 pt-24 md:pb-44 md:pt-32">
      <div className="container-x">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="col-fade eyebrow text-rose">The collection · Shop bouquets</p>
            <RevealHeading className="display mt-6 text-[3.2rem] text-burgundy sm:text-[5rem] lg:text-[6.4rem]">
              Bouquets, composed <em className="italic text-rose">like poetry.</em>
            </RevealHeading>
          </div>
          <p className="col-fade font-sans text-[0.98rem] leading-relaxed text-ink/65 lg:col-span-4 lg:col-start-9">
            Eight signatures from the atelier, hand-tied every morning and delivered in our keepsake wrap. Every bouquet comes in Classic, Grand and Luxe sizes.
          </p>
        </div>

        <div className="col-fade no-scrollbar -mx-5 mt-12 flex gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="toolbar" aria-label="Filter bouquets by category">
          {CATEGORIES.map((c) => {
            const on = filter.category === c
            return (
              <button
                key={c}
                onClick={() => setFilter((f) => ({ ...f, category: c }))}
                aria-pressed={on}
                className={`chip shrink-0 ${on ? 'border-burgundy bg-burgundy text-ivory' : 'border-burgundy/20 text-burgundy hover:border-burgundy'}`}
              >
                {c}
              </button>
            )
          })}
          <AnimatePresence>
            {occasion && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setFilter((f) => ({ ...f, occasion: null }))}
                className="chip shrink-0 border-rose bg-rose/15 text-burgundy"
                aria-label={`Clear occasion filter ${occasion.name}`}
              >
                {occasion.name} <X size={13} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <motion.div layout className="mt-14 grid gap-x-6 gap-y-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => {
              const l = LAYOUT[i % LAYOUT.length]
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: (i % 4) * 0.06 }}
                  className={`${l.span} ${l.mt} ${i % 2 ? 'md:max-lg:mt-16' : ''}`}
                >
                  <ProductCard product={p} layout={list.length < 3 ? { ...l, ratio: 1.2 } : l} index={PRODUCTS.indexOf(p)} />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
        {list.length === 0 && (
          <div className="mt-10 rounded-[28px] border border-dashed border-burgundy/25 p-12 text-center">
            <p className="display text-4xl text-burgundy">No bouquets match — yet.</p>
            <button className="btn-light mt-6" onClick={() => setFilter({ category: 'All', occasion: null })}>
              <span className="btn-fill" />
              <span className="btn-label">Show every bouquet</span>
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
