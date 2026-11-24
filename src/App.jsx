import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, prefersReducedMotion, scroller } from './lib/motion'
import { StoreProvider } from './lib/store'
import Loader from './components/Loader'
import Navbar from './components/Navbar'
import { Cursor, Curtain } from './components/Cursor'
import HeroStory from './components/HeroStory'
import About from './components/About'
import Collection from './components/Collection'
import Customizer from './components/Customizer'
import Occasions from './components/Occasions'
import Bestsellers from './components/Bestsellers'
import Garden from './components/Garden'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'
import { CartDrawer, QuickView, SearchPanel, Toast, WishlistDrawer } from './components/Overlays'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.2 })
    scroller.lenis = lenis
    if (import.meta.env.DEV) window.__lenis = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      scroller.lenis = null
    }
  }, [])

  // trigger positions depend on fonts and lazily loaded images — refresh once they settle
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => window.removeEventListener('load', refresh)
  }, [])

  return (
    <StoreProvider>
      {loading && <Loader onReveal={() => setRevealed(true)} onDone={() => setLoading(false)} />}
      <a href="#collection" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-burgundy focus:px-5 focus:py-3 focus:text-ivory">
        Skip to bouquets
      </a>
      <Navbar />
      <main>
        <HeroStory ready={revealed} />
        <About />
        <Collection />
        <Customizer />
        <Occasions />
        <Bestsellers />
        <Garden />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <CartDrawer />
      <WishlistDrawer />
      <SearchPanel />
      <QuickView />
      <Toast />
      <Curtain />
      <Cursor />
    </StoreProvider>
  )
}
