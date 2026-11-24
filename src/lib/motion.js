import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)
ScrollTrigger.config({ ignoreMobileResize: true })
export { gsap, ScrollTrigger, SplitText }

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Touch-first device: native scrolling, no custom cursor, lighter 3D. */
export const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches

/** On touch the native scroll arrives in uneven steps, so scroll-linked effects get a short catch-up. */
export const smoothScrub = (desktop = true) => (isTouch() ? (desktop === true ? 0.5 : Math.max(desktop, 0.5)) : desktop)

export const isSmallScreen = () =>
  typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768)

export function useMedia(query) {
  const [match, setMatch] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(query).matches))
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatch(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return match
}

export const useReducedMotion = () => useMedia('(prefers-reduced-motion: reduce)')
export const useMobile = () => useMedia('(max-width: 767px)')
export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)')

/** Shared pointer position, normalised to -1..1. Consumers smooth it themselves. */
export const pointer = { x: 0, y: 0 }
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    },
    { passive: true }
  )
}

/** Lenis handle so navigation can scroll smoothly to anchors. */
export const scroller = { lenis: null }

/** The curtain used for section-to-section "page" transitions registers itself here. */
export const curtain = { play: null }

export function scrollToY(y, { immediate = false, duration = 1.6 } = {}) {
  if (scroller.lenis) scroller.lenis.scrollTo(y, { immediate, duration, force: true })
  else window.scrollTo({ top: y, behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth' })
}

/**
 * Scroll to a section. Nearby targets glide; far jumps play the petal curtain
 * (a page-style transition) and cut underneath it, so the long 3D story is never fast-forwarded.
 */
export function scrollToId(id, { offset = 0 } = {}) {
  const el = document.getElementById(id)
  if (!el) return
  const y = id === 'home' ? 0 : el.getBoundingClientRect().top + window.scrollY + offset
  const far = Math.abs(y - window.scrollY) > window.innerHeight * 2.2
  if (far && curtain.play && !prefersReducedMotion()) {
    curtain.play(() => {
      scrollToY(y, { immediate: true })
      ScrollTrigger.update()
    })
  } else {
    scrollToY(y)
  }
}

/** 3D scenes register while their shaders compile; the loader waits for them. */
let pendingScenes = 0
let sceneWaiters = []
export function registerScene() {
  pendingScenes++
  let released = false
  return () => {
    if (released) return
    released = true
    pendingScenes--
    if (pendingScenes <= 0) {
      sceneWaiters.forEach((f) => f())
      sceneWaiters = []
    }
  }
}
export function whenScenesReady(timeout = 7000) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeout)
    const done = () => {
      clearTimeout(timer)
      resolve()
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (pendingScenes <= 0) done()
        else sceneWaiters.push(done)
      })
    )
  })
}

/** Freeze page scroll while overlays (menu, drawers, modals) are open. */
let locks = 0
export function lockScroll(on) {
  locks = Math.max(0, locks + (on ? 1 : -1))
  const locked = locks > 0
  document.documentElement.style.overflow = locked ? 'hidden' : ''
  if (scroller.lenis) locked ? scroller.lenis.stop() : scroller.lenis.start()
}
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return
    lockScroll(true)
    return () => lockScroll(false)
  }, [active])
}

/** Is the element near the viewport? Used to lazy-mount and pause WebGL canvases. */
export function useInView(rootMargin = '200px', once = false) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      setInView(e.isIntersecting)
      if (once && e.isIntersecting) io.disconnect()
    }, { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin, once])
  return [ref, inView]
}

/** Low-end devices get fewer flowers and no sheen. */
export const liteGPU = () =>
  typeof navigator !== 'undefined' && ((navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 3)

let glOk = null
export function hasWebGL() {
  if (glOk !== null) return glOk
  try {
    const c = document.createElement('canvas')
    glOk = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    glOk = false
  }
  return glOk
}

/**
 * Scroll-triggered reveal helpers used by most sections. Everything is created
 * inside gsap.context so unmounting a section kills its triggers.
 */
export function useGsap(fn, deps = []) {
  const scope = useRef(null)
  useEffect(() => {
    const ctx = gsap.context(() => fn(scope.current), scope)
    return () => ctx.revert()
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
  return scope
}

/** Character reveal for a heading — masked lines, chars rising in. */
export function revealChars(el, { trigger = el, start = 'top 82%', stagger = 0.018, delay = 0, scrollTrigger = true } = {}) {
  if (!el) return null
  if (prefersReducedMotion()) return null
  const split = new SplitText(el, { type: 'lines,words,chars', linesClass: 'split-line', mask: 'lines' })
  const tween = gsap.from(split.chars, {
    yPercent: 115,
    rotate: 4,
    opacity: 0,
    duration: 1.15,
    ease: 'expo.out',
    stagger,
    delay,
    scrollTrigger: scrollTrigger ? { trigger, start, once: true } : undefined,
  })
  return { split, tween }
}

export function fadeUp(targets, { trigger, start = 'top 85%', stagger = 0.08, y = 36, delay = 0 } = {}) {
  if (prefersReducedMotion()) return null
  return gsap.from(targets, {
    y,
    opacity: 0,
    duration: 1.1,
    ease: 'power3.out',
    stagger,
    delay,
    scrollTrigger: { trigger: trigger || targets, start, once: true },
  })
}
