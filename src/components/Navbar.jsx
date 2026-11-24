import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Heart, ShoppingBag, Menu, X, Instagram, Facebook } from 'lucide-react'
import { useStore } from '../lib/store'
import { scrollToId, useScrollLock, gsap } from '../lib/motion'
import { BloomMark, PinterestIcon } from './ui'

export const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'collection', label: 'Collections' },
  { id: 'customize', label: 'Customize' },
  { id: 'contact', label: 'Contact' },
]

export default function Navbar() {
  const { count, wish, bump, setPanel } = useStore()
  const [solid, setSolid] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('home')
  const bagRef = useRef(null)
  useScrollLock(open)

  useEffect(() => {
    let last = window.scrollY
    let ticking = false
    const update = () => {
      ticking = false
      const y = window.scrollY
      const heroEnd = window.innerHeight * 0.8
      setSolid(y > heroEnd)
      // hide while travelling down, return on any upward scroll
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > heroEnd)
        last = y
      }
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // highlight the section currently in view
  useEffect(() => {
    const els = NAV.map((n) => document.getElementById(n.id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // bag icon jiggles whenever something is added
  useEffect(() => {
    if (!bump || !bagRef.current) return
    gsap.fromTo(bagRef.current, { rotate: -14, scale: 1.25 }, { rotate: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.35)' })
  }, [bump])

  const go = (id) => {
    setOpen(false)
    // let the menu close (and the scroll lock lift) before travelling
    setTimeout(() => scrollToId(id), open ? 450 : 0)
  }

  const tone = solid || open ? 'text-burgundy' : 'text-burgundy'

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,box-shadow,backdrop-filter] duration-700 ease-silk ${
          hidden && !open ? '-translate-y-full' : 'translate-y-0'
        } ${solid && !open ? 'bg-ivory/85 shadow-[0_1px_0_rgba(84,39,53,0.08)] backdrop-blur-xl' : 'bg-transparent'}`}
      >
        <nav className={`container-x flex items-center justify-between transition-[height] duration-500 ${solid ? 'h-16' : 'h-20 sm:h-24'} ${tone}`} aria-label="Main">
          <button onClick={() => go('home')} className="group flex items-center gap-2.5" aria-label="PÉTALE — back to top">
            <BloomMark size={26} className="text-rose transition-transform duration-700 ease-silk group-hover:rotate-[72deg]" />
            <span className="font-display text-2xl font-normal tracking-[0.32em]">PÉTALE</span>
          </button>

          <ul className="hidden items-center gap-9 lg:flex">
            {NAV.map((n) => (
              <li key={n.id}>
                <button onClick={() => go(n.id)} className="group relative py-2 font-sans text-[0.7rem] uppercase tracking-[0.24em]">
                  {n.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-current transition-transform duration-500 ease-silk ${
                      active === n.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    }`}
                  />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-0.5 sm:gap-1.5">
            <button className="icon-btn hover:bg-blush/40" onClick={() => setPanel('search')} aria-label="Search bouquets">
              <Search size={19} strokeWidth={1.4} />
            </button>
            <button className="icon-btn hover:bg-blush/40" onClick={() => setPanel('wishlist')} aria-label={`Wishlist, ${wish.length} saved`}>
              <Heart size={19} strokeWidth={1.4} />
              {wish.length > 0 && <Badge n={wish.length} />}
            </button>
            <button ref={bagRef} className="icon-btn hover:bg-blush/40" onClick={() => setPanel('cart')} aria-label={`Shopping bag, ${count} items`}>
              <ShoppingBag size={19} strokeWidth={1.4} />
              <AnimatePresence>{count > 0 && <Badge n={count} key="b" dark />}</AnimatePresence>
            </button>
            <button className="icon-btn ml-1 hover:bg-blush/40 lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={open ? 'x' : 'm'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.25 }}>
                  {open ? <X size={22} strokeWidth={1.4} /> : <Menu size={22} strokeWidth={1.4} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-ivory px-6 pb-10 pt-28 lg:hidden"
            initial={{ clipPath: 'circle(0% at 92% 4%)' }}
            animate={{ clipPath: 'circle(150% at 92% 4%)' }}
            exit={{ clipPath: 'circle(0% at 92% 4%)' }}
            transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="flex flex-1 flex-col justify-center gap-2">
              {NAV.map((n, i) => (
                <motion.li key={n.id} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                  <button onClick={() => go(n.id)} className="flex w-full items-baseline gap-4 py-2 text-left">
                    <span className="eyebrow text-rose">0{i + 1}</span>
                    <span className="display text-[3.2rem] text-burgundy">{n.label}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-between border-t border-burgundy/15 pt-6 text-burgundy">
              <span className="eyebrow text-burgundy/60">Follow the atelier</span>
              <span className="flex gap-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <Instagram size={19} strokeWidth={1.4} />
                </a>
                <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                  <PinterestIcon size={19} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <Facebook size={19} strokeWidth={1.4} />
                </a>
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Badge({ n, dark }) {
  return (
    <motion.span
      key={n}
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18 }}
      className={`absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[0.58rem] font-medium leading-none ${
        dark ? 'bg-burgundy text-ivory' : 'bg-rose text-ivory'
      }`}
    >
      {n}
    </motion.span>
  )
}
