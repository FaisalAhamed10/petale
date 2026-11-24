import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Star } from 'lucide-react'
import { gsap, prefersReducedMotion, revealChars, isTouch } from '../lib/motion'
import { photo, srcSet } from '../data/catalog'

/** Pulls its child toward the pointer while hovered — the "magnetic" luxury button feel. */
export function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || isTouch() || prefersReducedMotion()) return
    const xTo = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.4)' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.4)' })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      xTo((e.clientX - (r.left + r.width / 2)) * strength)
      yTo((e.clientY - (r.top + r.height / 2)) * strength)
    }
    const leave = () => {
      xTo(0)
      yTo(0)
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [strength])
  return (
    <span ref={ref} className={`inline-block will-change-transform ${className}`}>
      {children}
    </span>
  )
}

/** Pill button with a rose fill sweep; magnetic on precise pointers. */
export const Button = forwardRef(function Button({ variant = 'dark', children, className = '', magnetic = true, as = 'button', cursor, ...rest }, ref) {
  const Tag = as
  const el = (
    <Tag ref={ref} className={`btn-${variant} ${className}`} data-cursor={cursor} {...rest}>
      <span className="btn-fill" aria-hidden="true" />
      <span className="btn-label">{children}</span>
    </Tag>
  )
  return magnetic ? <Magnetic>{el}</Magnetic> : el
})

/**
 * Responsive self-hosted WebP photo, sized by srcset, lazy by default.
 * A soft blush placeholder shows while it loads; if a request fails on a flaky connection
 * it retries twice before falling back to a styled floral placeholder.
 */
export function Photo({ id, alt, ratio = 1.25, sizes = '(max-width: 768px) 100vw, 50vw', className = '', eager = false, widths, style, ...rest }) {
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setAttempt(0)
    setFailed(false)
  }, [id])
  const bust = attempt ? `?retry=${attempt}` : ''
  if (failed) {
    return (
      <span role="img" aria-label={alt || undefined} className={`grid place-items-center bg-gradient-to-br from-blush via-[#f3dcdc] to-rose/50 text-burgundy/40 ${className}`} style={style}>
        <BloomMark size={42} />
      </span>
    )
  }
  return (
    <img
      key={attempt}
      src={photo(id, { w: 960 }) + bust}
      srcSet={srcSet(id)
        .split(', ')
        .map((x) => x.replace(' ', bust + ' '))
        .join(', ')}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchpriority={eager ? 'high' : undefined}
      onError={() => {
        if (attempt < 2) setTimeout(() => setAttempt((a) => a + 1), 900 * (attempt + 1))
        else setFailed(true)
      }}
      className={`bg-blush/50 ${className}`}
      style={style}
      {...rest}
    />
  )
}

/** Heading whose characters rise in when scrolled into view. */
export function RevealHeading({ as: Tag = 'h2', children, className = '', delay = 0, stagger = 0.016 }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    let r = null
    let alive = true
    const ctx = gsap.context(() => {})
    // split only once the display font is in, so line breaks are measured on the real glyphs
    ;(document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (!alive) return
      ctx.add(() => {
        r = revealChars(el, { delay, stagger })
      })
    })
    return () => {
      alive = false
      ctx.revert()
      r?.split?.revert()
    }
  }, [delay, stagger])
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}

export function Stars({ n = 5, className = '' }) {
  return (
    <span className={`inline-flex gap-1 ${className}`} role="img" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} strokeWidth={1.2} className={i < n ? 'fill-champagne text-champagne' : 'text-champagne/40'} />
      ))}
    </span>
  )
}

/** A single stylised rose petal (SVG), tinted. */
export function PetalShape({ color = '#D98E9C', size = 22, className = '', style }) {
  return (
    <svg viewBox="0 0 40 48" width={size} height={size * 1.2} className={className} style={style} aria-hidden="true">
      <defs>
        <radialGradient id={`pg-${color.slice(1)}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="60%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </radialGradient>
      </defs>
      <path d="M20 46C9 40 2 28 4 16 6 6 14 1 20 6c6-5 14 0 16 10 2 12-5 24-16 30Z" fill={`url(#pg-${color.slice(1)})`} />
      <path d="M20 44C18 30 19 18 20 8" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" fill="none" />
    </svg>
  )
}

const PETAL_COLORS = ['#D98E9C', '#EBC9C9', '#B8253A', '#E7A7B6', '#C5A779']

/** Petals drifting down through a section (pure CSS animation; paused for reduced motion). */
export function FallingPetals({ count = 10, className = '' }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${(i * 37 + 11) % 100}%`,
        delay: `${-(i * 2.3) % 14}s`,
        dur: `${14 + ((i * 7) % 9)}s`,
        size: 12 + ((i * 5) % 14),
        dx: `${((i % 2 ? 1 : -1) * (40 + ((i * 13) % 90)))}px`,
        rot: `${360 + ((i * 97) % 400)}deg`,
        color: PETAL_COLORS[i % PETAL_COLORS.length],
      })),
    [count]
  )
  if (prefersReducedMotion()) return null
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal-svg top-0"
          style={{ left: p.left, animation: `petalFall ${p.dur} linear ${p.delay} infinite`, '--dx': p.dx, '--rot': p.rot }}
        >
          <PetalShape color={p.color} size={p.size} />
        </span>
      ))}
    </div>
  )
}

export function PinterestIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M10.2 20.6 12 13m0 0c.5 1.3 1.6 2 2.9 2 2.4 0 3.9-2.3 3.9-5.1C18.8 6.8 16.3 5 13.3 5 9.8 5 7.5 7.6 7.5 10.4c0 1.1.4 2.2 1.1 2.8" />
      <path d="M12 13c-.6-1.8-.2-3.6 1-4.2" />
    </svg>
  )
}

/** Brand mark: five-petal bloom. */
export function BloomMark({ size = 22, className = '' }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <g fill="currentColor" opacity="0.9">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="32" cy="18" rx="8.5" ry="13.5" transform={`rotate(${a} 32 32)`} />
        ))}
      </g>
      <circle cx="32" cy="32" r="6" fill="#C5A779" />
    </svg>
  )
}

/** Small "sample data" badge — used wherever details are placeholders for the demo. */
export function SampleTag({ className = '' }) {
  return <span className={`rounded-full border border-champagne/60 px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.2em] text-champagne ${className}`}>Sample</span>
}
