import { useState } from 'react'
import { ArrowRight, ArrowUp, Facebook, Instagram, Check } from 'lucide-react'
import { useStore } from '../lib/store'
import { OCCASIONS } from '../data/catalog'
import { cleanInput, cleanField, EMAIL_RE, LIMITS } from '../lib/security'
import { scrollToId } from '../lib/motion'
import { BloomMark, PinterestIcon } from './ui'

export default function Footer() {
  const { setFilter, setPanel } = useStore()
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | error | done

  const subscribe = (e) => {
    e.preventDefault()
    if (!EMAIL_RE.test(cleanField(email))) return setState('error')
    setState('done') // demo: no list is joined
    setEmail('')
  }
  const occasion = (id) => {
    setFilter({ category: 'All', occasion: id })
    scrollToId('collection')
  }

  const col = 'space-y-3 font-sans text-[0.9rem] text-ivory/70'
  const link = 'transition-colors hover:text-ivory'

  return (
    <footer className="relative overflow-hidden bg-wine pt-24 text-ivory">
      <div className="container-x">
        <div className="grid gap-14 border-b border-ivory/10 pb-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <BloomMark size={30} className="text-rose" />
              <span className="font-display text-3xl tracking-[0.32em]">PÉTALE</span>
            </div>
            <p className="mt-6 max-w-sm font-display text-[2rem] font-light italic leading-tight text-blush">Made with love, delivered with flowers.</p>
            <form onSubmit={subscribe} className="mt-10 max-w-md" noValidate>
              <label htmlFor="nl" className="eyebrow text-[0.6rem] text-ivory/60">
                The PÉTALE letter — seasonal blooms & first access
              </label>
              <div className="mt-4 flex items-center gap-3 border-b border-ivory/25 pb-3 focus-within:border-ivory">
                <input
                  id="nl"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => (setEmail(cleanInput(e.target.value, LIMITS.email)), setState('idle'))}
                  placeholder="Your email address"
                  className="w-full bg-transparent font-sans text-[0.95rem] text-ivory placeholder:text-ivory/35 focus:outline-none"
                  aria-invalid={state === 'error'}
                />
                <button className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ivory text-burgundy transition-transform duration-500 hover:rotate-[-45deg]" aria-label="Subscribe">
                  {state === 'done' ? <Check size={16} /> : <ArrowRight size={16} />}
                </button>
              </div>
              <p className="mt-3 h-4 font-sans text-[0.75rem]" role="status">
                {state === 'error' && <span className="text-rose">Please enter a valid email.</span>}
                {state === 'done' && <span className="text-blush">You’re on the list — welcome to the atelier. (Demo: nothing was sent.)</span>}
              </p>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:col-span-7">
            <div>
              <p className="eyebrow mb-5 text-[0.6rem] text-blush/70">About</p>
              <ul className={col}>
                <li><button className={link} onClick={() => scrollToId('about')}>Our story</button></li>
                <li><button className={link} onClick={() => scrollToId('garden')}>The garden</button></li>
                <li><button className={link} onClick={() => scrollToId('testimonials')}>Reviews</button></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-5 text-[0.6rem] text-blush/70">Shop</p>
              <ul className={col}>
                <li><button className={link} onClick={() => scrollToId('collection')}>All bouquets</button></li>
                <li><button className={link} onClick={() => scrollToId('bestsellers')}>Bestsellers</button></li>
                <li><button className={link} onClick={() => scrollToId('customize')}>Customise</button></li>
                <li><button className={link} onClick={() => setPanel('wishlist')}>Wishlist</button></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-5 text-[0.6rem] text-blush/70">Collections</p>
              <ul className={col}>
                {OCCASIONS.slice(0, 5).map((o) => (
                  <li key={o.id}>
                    <button className={link} onClick={() => occasion(o.id)}>{o.name}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-5 text-[0.6rem] text-blush/70">Contact</p>
              <ul className={col}>
                <li><button className={link} onClick={() => scrollToId('contact')}>Write to us</button></li>
                <li><button className={link} onClick={() => setPanel('cart')}>Your bag</button></li>
              </ul>
              <div className="mt-8 flex gap-3">
                {[
                  { I: Instagram, href: 'https://instagram.com', l: 'Instagram' },
                  { I: null, href: 'https://pinterest.com', l: 'Pinterest' },
                  { I: Facebook, href: 'https://facebook.com', l: 'Facebook' },
                ].map(({ I, href, l }) => (
                  <a key={l} href={href} target="_blank" rel="noopener noreferrer" aria-label={l} className="grid h-10 w-10 place-items-center rounded-full border border-ivory/20 transition-colors hover:bg-ivory hover:text-burgundy">
                    {I ? <I size={16} strokeWidth={1.4} /> : <PinterestIcon size={16} />}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-5 py-8 text-center sm:flex-row sm:text-left">
          <p className="font-sans text-[0.78rem] text-ivory/60">
            © 2026 All Rights Reserved. Made with 💙 by{' '}
            <a href="https://luphera-technologies.pages.dev/" target="_blank" rel="noopener noreferrer" className="text-ivory underline-offset-4 hover:underline">
              Luphera
            </a>
          </p>
          <button onClick={() => scrollToId('home')} className="flex items-center gap-2 font-sans text-[0.7rem] uppercase tracking-[0.2em] text-ivory/70 hover:text-ivory">
            Back to top <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  )
}
