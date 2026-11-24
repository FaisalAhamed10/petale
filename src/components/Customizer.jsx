import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Minus, Plus, RotateCcw, ShoppingBag, Sparkles, ZoomIn, ZoomOut, Pause, Play, Move3d, X } from 'lucide-react'
import Stage from '../three/Stage'
import { useStore, sanitizeDesign } from '../lib/store'
import { useInView, useMobile, liteGPU, gsap, useGsap, fadeUp } from '../lib/motion'
import { cleanInput, LIMITS, readStorage, writeStorage } from '../lib/security'
import {
  DEFAULT_DESIGN,
  FLOWER_TYPES,
  RIBBONS,
  STEM_LIMITS,
  WRAPS,
  PRESETS,
  FILLER_PRICE,
  DESIGN_FEE,
  IMG,
  inr,
  priceDesign,
  sizeTier,
} from '../data/catalog'
import { Photo, RevealHeading } from './ui'

const CustomizerScene = lazy(() => import('../three/CustomizerScene'))
const loadViews = () => import('../three/CustomizerScene').then((m) => m.viewFor)
const MAX_TYPES = 4
const SAVE_KEY = 'petale-design-v1'
const DARK = ['#5c2434', '#a3172b', '#9e1b2c', '#7a3a63']

function useDebounced(value, ms) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function Step({ n, title, hint, children }) {
  return (
    <fieldset className="border-t border-burgundy/12 py-7">
      <legend className="sr-only">{title}</legend>
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <p className="flex items-baseline gap-3">
          <span className="font-display text-2xl italic text-rose">{n}</span>
          <span className="eyebrow text-burgundy">{title}</span>
        </p>
        {hint && <span className="text-right font-sans text-[0.78rem] text-ink/50">{hint}</span>}
      </div>
      {children}
    </fieldset>
  )
}

function Swatch({ hex, on, label, onClick, clear, size = 'h-9 w-9' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`relative grid ${size} place-items-center rounded-full border transition-transform duration-300 hover:scale-110 ${on ? 'border-burgundy ring-2 ring-burgundy ring-offset-2 ring-offset-cream' : 'border-burgundy/20'}`}
      style={{ background: clear ? 'linear-gradient(135deg,#f4f8fa 0%,#dfe8ec 50%,#f9fbfc 100%)' : `radial-gradient(circle at 35% 30%, #ffffff55, transparent 55%), ${hex}` }}
    >
      {on && <Check size={14} strokeWidth={2} className={DARK.includes(hex.toLowerCase()) ? 'text-ivory' : 'text-burgundy'} />}
    </button>
  )
}

function Stepper({ value, onDec, onInc, decDisabled, incDisabled, label }) {
  return (
    <div className="flex items-center rounded-full border border-burgundy/20 bg-ivory/70">
      <button type="button" onClick={onDec} disabled={decDisabled} className="grid h-9 w-9 place-items-center text-burgundy disabled:opacity-25" aria-label={`Fewer ${label}`}>
        <Minus size={14} />
      </button>
      <span className="w-7 text-center font-display text-xl text-burgundy" aria-live="polite">
        {value}
      </span>
      <button type="button" onClick={onInc} disabled={incDisabled} className="grid h-9 w-9 place-items-center text-burgundy disabled:opacity-25" aria-label={`More ${label}`}>
        <Plus size={14} />
      </button>
    </div>
  )
}

const VIEW_BUTTONS = [
  { id: 'front', label: 'Front' },
  { id: 'side', label: 'Side' },
  { id: 'top', label: 'Top' },
  { id: 'detail', label: 'Close-up' },
]

function Preview({ design, mobile }) {
  const [ref, near] = useInView('700px', true)
  const quality = mobile || liteGPU() ? 0.3 : 1
  const controls = useRef(null)
  const [spin, setSpin] = useState(true)
  const [view, setView] = useState('front')
  const far = mobile ? 1.4 : 1

  const go = async (id) => {
    setView(id)
    const viewFor = await loadViews()
    controls.current?.setLookAt(...viewFor(id, far), true)
  }
  const zoom = (d) => controls.current?.dolly(d, true)

  return (
    <div ref={ref} className="absolute inset-0">
      {near && (
        <Stage
          className="absolute inset-0"
          camera={{ position: [0, 1.2, 7.6 * far], fov: 36 }}
          interactive
          shadows={quality > 0.5}
          fallback={
            <div className="absolute inset-0 grid place-items-center p-10">
              <Photo id={IMG.pastel} alt="A custom bouquet" ratio={1.25} className="h-full max-h-[80%] w-auto rounded-[28px] object-cover" />
            </div>
          }
        >
          <Suspense fallback={null}>
            <CustomizerScene design={design} quality={quality} spin={spin} controlsRef={controls} far={far} />
          </Suspense>
        </Stage>
      )}

      {/* camera toolbar */}
      <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2 sm:inset-x-6 sm:bottom-6">
        <div className="flex rounded-full bg-ivory/80 p-1 shadow-sm backdrop-blur" role="group" aria-label="Camera view">
          {VIEW_BUTTONS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => go(v.id)}
              aria-pressed={view === v.id}
              className={`rounded-full px-3 py-1.5 font-sans text-[0.6rem] uppercase tracking-[0.16em] transition-colors sm:px-4 ${view === v.id ? 'bg-burgundy text-ivory' : 'text-burgundy hover:bg-blush/50'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 rounded-full bg-ivory/80 p-1 shadow-sm backdrop-blur">
          <button type="button" onClick={() => zoom(1.2)} className="grid h-8 w-8 place-items-center rounded-full text-burgundy hover:bg-blush/50" aria-label="Zoom in">
            <ZoomIn size={15} strokeWidth={1.5} />
          </button>
          <button type="button" onClick={() => zoom(-1.2)} className="grid h-8 w-8 place-items-center rounded-full text-burgundy hover:bg-blush/50" aria-label="Zoom out">
            <ZoomOut size={15} strokeWidth={1.5} />
          </button>
          <button type="button" onClick={() => setSpin((s) => !s)} aria-pressed={spin} className="grid h-8 w-8 place-items-center rounded-full text-burgundy hover:bg-blush/50" aria-label={spin ? 'Stop turning' : 'Turn the bouquet'}>
            {spin ? <Pause size={14} strokeWidth={1.6} /> : <Play size={14} strokeWidth={1.6} />}
          </button>
        </div>
      </div>
    </div>
  )
}

function loadSaved() {
  return sanitizeDesign(readStorage(SAVE_KEY, null)) || DEFAULT_DESIGN
}

export default function Customizer() {
  const { addCustom } = useStore()
  const mobile = useMobile()
  const [design, setDesign] = useState(loadSaved)
  const [note, setNote] = useState('')
  const [added, setAdded] = useState(false)
  const preview = useDebounced(design, 160)
  const price = useMemo(() => priceDesign(design), [design])
  const types = Object.keys(design.flowers)
  const total = price.count
  const activePreset = PRESETS.find((p) => {
    const a = sanitizeDesign({ ...p.design, message: design.message })
    return a && JSON.stringify(a.flowers) === JSON.stringify(design.flowers) && JSON.stringify(a.counts) === JSON.stringify(design.counts) && a.wrap === design.wrap && a.ribbon === design.ribbon
  })?.id

  // the design is remembered on this device, so a visitor can come back to it
  useEffect(() => writeStorage(SAVE_KEY, design), [design])

  const scope = useGsap((root) => {
    fadeUp(gsap.utils.selector(root)('.cz-fade'), { trigger: root, start: 'top 70%' })
  })

  const toggleType = (id) => {
    const has = id in design.flowers
    if (has && types.length === 1) return setNote('Your bouquet needs at least one variety.')
    if (!has && types.length >= MAX_TYPES) return setNote(`Choose up to ${MAX_TYPES} varieties for a balanced bouquet.`)
    if (!has && total >= STEM_LIMITS.max) return setNote(`A hand-tied bouquet holds up to ${STEM_LIMITS.max} stems — remove a few first.`)
    if (has && total - design.counts[id] < STEM_LIMITS.min) return setNote(`Keep at least ${STEM_LIMITS.min} stems in the bouquet.`)
    setNote('')
    setDesign((d) => {
      const flowers = { ...d.flowers }
      const counts = { ...d.counts }
      if (has) {
        delete flowers[id]
        delete counts[id]
      } else {
        flowers[id] = FLOWER_TYPES.find((f) => f.id === id).colors[0].id
        counts[id] = Math.min(5, STEM_LIMITS.max - total)
      }
      return sanitizeDesign({ ...d, flowers, counts }) || d
    })
  }
  const setColor = (id, c) => setDesign((d) => ({ ...d, flowers: { ...d.flowers, [id]: c } }))
  const step = (id, delta) =>
    setDesign((d) => {
      const n = (d.counts[id] ?? 0) + delta
      const t = Object.values(d.counts).reduce((s, x) => s + x, 0) + delta
      if (n < STEM_LIMITS.perMin || n > STEM_LIMITS.perMax || t < STEM_LIMITS.min || t > STEM_LIMITS.max) return d
      return { ...d, counts: { ...d.counts, [id]: n } }
    })
  const applyPreset = (p) => {
    setNote('')
    setDesign((d) => sanitizeDesign({ ...p.design, message: d.message }) || d)
  }

  const add = () => {
    if (addCustom(design)) {
      setAdded(true)
      setTimeout(() => setAdded(false), 2400)
    }
  }

  return (
    <section id="customize" ref={scope} className="relative overflow-hidden bg-cream py-24 md:py-36">
      <div className="container-x">
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="cz-fade eyebrow text-rose">Bouquet atelier · Customiser</p>
            <RevealHeading className="display mt-6 text-[3.2rem] text-burgundy sm:text-[5rem] lg:text-[6.4rem]">Design your own bouquet.</RevealHeading>
          </div>
          <p className="cz-fade font-sans text-[0.98rem] leading-relaxed text-ink/65 lg:col-span-4">
            Choose your blooms, colours, stem counts, wrap and ribbon. The 3D studio arranges it live — orbit it, zoom in, look from above — and our florists hand-tie exactly what you see.
          </p>
        </div>

        {/* signature presets */}
        <div className="cz-fade no-scrollbar -mx-5 mt-10 flex gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Start from a signature">
          <span className="eyebrow hidden shrink-0 self-center pr-2 text-burgundy/60 sm:block">Start from</span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              aria-pressed={activePreset === p.id}
              className={`chip shrink-0 ${activePreset === p.id ? 'border-burgundy bg-burgundy text-ivory' : 'border-burgundy/20 bg-ivory/60 text-burgundy hover:border-burgundy'}`}
            >
              <span className="flex -space-x-1">
                {p.swatch.map((c) => (
                  <span key={c} className="h-3.5 w-3.5 rounded-full border border-white/70" style={{ background: c }} />
                ))}
              </span>
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* live 3D studio */}
          <div className="lg:col-span-7">
            <div className="relative h-[64vh] min-h-[460px] overflow-hidden rounded-[34px] bg-[radial-gradient(ellipse_at_50%_35%,#fdf6f2_0%,#f4e3e0_55%,#e9cfcc_100%)] shadow-[inset_0_0_120px_rgba(255,255,255,0.6)] lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]">
              <Preview design={preview} mobile={mobile} />
              <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-ivory/75 px-4 py-2 backdrop-blur sm:left-6 sm:top-6">
                <Move3d size={14} strokeWidth={1.4} className="text-burgundy" />
                <span className="eyebrow text-[0.54rem] text-burgundy">Drag to orbit · pinch to zoom</span>
              </div>
              <div className="pointer-events-none absolute right-4 top-4 rounded-2xl bg-burgundy px-5 py-3 text-right text-ivory shadow-xl sm:right-6 sm:top-6">
                <p className="eyebrow text-[0.52rem] text-blush/80">
                  {sizeTier(total)} · {total} stems
                </p>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.p key={price.total} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} className="font-display text-3xl">
                    {inr(price.total)}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* options */}
          <form className="lg:col-span-5" onSubmit={(e) => (e.preventDefault(), add())} aria-label="Bouquet customiser">
            <Step n="i." title="Flower varieties" hint={`Up to ${MAX_TYPES}`}>
              <div className="flex flex-wrap gap-2">
                {FLOWER_TYPES.map((f) => {
                  const on = f.id in design.flowers
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleType(f.id)}
                      aria-pressed={on}
                      className={`chip ${on ? 'border-burgundy bg-burgundy text-ivory' : 'border-burgundy/20 bg-ivory/60 text-burgundy hover:border-burgundy'}`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full border border-white/50" style={{ background: f.colors[0].hex }} />
                      {f.label}
                      <span className={`text-[0.62rem] normal-case tracking-normal ${on ? 'text-blush' : 'text-ink/45'}`}>{inr(f.price)}/stem</span>
                    </button>
                  )
                })}
              </div>
              <AnimatePresence>
                {note && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 font-sans text-[0.8rem] text-rose" role="status">
                    {note}
                  </motion.p>
                )}
              </AnimatePresence>
            </Step>

            <Step n="ii." title="Colours & stems" hint={`${total} of ${STEM_LIMITS.max} stems · ${sizeTier(total)}`}>
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {types.map((t) => {
                    const f = FLOWER_TYPES.find((x) => x.id === t)
                    const chosen = f.colors.find((c) => c.id === design.flowers[t])
                    const n = design.counts[t]
                    return (
                      <motion.li
                        key={t}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-2xl border border-burgundy/10 bg-ivory/60 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-sans text-[0.92rem] text-ink/85">{f.label}</p>
                            <p className="font-sans text-[0.72rem] text-ink/50">
                              {chosen?.label} · {inr(f.price * n)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Stepper
                              value={n}
                              label={f.label}
                              onDec={() => step(t, -1)}
                              onInc={() => step(t, 1)}
                              decDisabled={n <= STEM_LIMITS.perMin || total <= STEM_LIMITS.min}
                              incDisabled={n >= STEM_LIMITS.perMax || total >= STEM_LIMITS.max}
                            />
                            <button type="button" onClick={() => toggleType(t)} className="grid h-8 w-8 place-items-center rounded-full text-ink/40 hover:bg-blush/50 hover:text-rose" aria-label={`Remove ${f.label}`}>
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        {f.colors.length > 1 && (
                          <div className="mt-3 flex gap-2.5">
                            {f.colors.map((c) => (
                              <Swatch key={c.id} size="h-7 w-7" hex={c.hex} label={`${f.label}: ${c.label}`} on={design.flowers[t] === c.id} onClick={() => setColor(t, c.id)} />
                            ))}
                          </div>
                        )}
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-burgundy/10" aria-hidden="true">
                <motion.div className="h-full bg-burgundy" animate={{ width: `${(total / STEM_LIMITS.max) * 100}%` }} transition={{ duration: 0.4 }} />
              </div>
            </Step>

            <Step n="iii." title="Wrapping paper" hint={WRAPS.find((w) => w.id === design.wrap)?.label}>
              <div className="grid grid-cols-5 gap-2">
                {WRAPS.map((w) => {
                  const on = design.wrap === w.id
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setDesign((d) => ({ ...d, wrap: w.id }))}
                      aria-pressed={on}
                      className={`group flex flex-col items-center gap-2 rounded-2xl border p-2.5 transition-colors ${on ? 'border-burgundy bg-ivory' : 'border-transparent hover:border-burgundy/20'}`}
                    >
                      <span
                        className="h-12 w-full rounded-xl border border-burgundy/10 transition-transform duration-500 group-hover:-rotate-3"
                        style={{
                          background: w.clear ? 'linear-gradient(135deg,rgba(235,242,245,.9),rgba(255,255,255,.4) 50%,rgba(220,232,238,.9))' : `linear-gradient(135deg, ${w.hex}, ${w.hex}dd)`,
                          clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                        }}
                      />
                      <span className="text-center font-sans text-[0.62rem] leading-tight text-ink/70">{w.label}</span>
                      <span className="font-sans text-[0.58rem] text-ink/40">{inr(w.price)}</span>
                    </button>
                  )
                })}
              </div>
            </Step>

            <Step n="iv." title="Ribbon & finishing" hint={RIBBONS.find((r) => r.id === design.ribbon)?.label}>
              <div className="flex gap-3">
                {RIBBONS.map((r) => (
                  <Swatch key={r.id} hex={r.hex} label={`${r.label} ribbon`} on={design.ribbon === r.id} onClick={() => setDesign((d) => ({ ...d, ribbon: r.id }))} />
                ))}
              </div>
              <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-burgundy/12 bg-ivory/60 p-4">
                <span>
                  <span className="block font-sans text-[0.9rem] text-ink/80">Baby’s breath & rose-leaf greenery</span>
                  <span className="font-sans text-[0.75rem] text-ink/50">Airy filler and foliage · {inr(FILLER_PRICE)}</span>
                </span>
                <input type="checkbox" className="peer sr-only" checked={design.filler} onChange={(e) => setDesign((d) => ({ ...d, filler: e.target.checked }))} />
                <span className="relative h-7 w-12 shrink-0 rounded-full bg-burgundy/15 transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-ivory after:shadow after:transition-transform peer-checked:bg-burgundy peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-burgundy" />
              </label>
            </Step>

            <Step n="v." title="Gift message" hint={`${design.message.length}/${LIMITS.gift}`}>
              <textarea
                className="field min-h-[96px] resize-none rounded-none"
                placeholder="Write a few words — they appear on the card in the 3D studio, and we hand-letter them."
                value={design.message}
                maxLength={LIMITS.gift}
                onChange={(e) => setDesign((d) => ({ ...d, message: cleanInput(e.target.value, LIMITS.gift) }))}
                aria-label="Gift message"
                data-lenis-prevent
              />
            </Step>

            <div className="rounded-[28px] bg-burgundy p-6 text-ivory sm:p-8">
              <dl className="space-y-2 font-sans text-[0.85rem] text-ivory/75">
                {price.perType.map((p) => (
                  <div key={p.id} className="flex justify-between">
                    <dt>
                      {p.n} × {p.label}
                    </dt>
                    <dd>{inr(p.cost)}</dd>
                  </div>
                ))}
                <div className="flex justify-between">
                  <dt>Wrap & ribbon</dt>
                  <dd>{inr(price.wrap + price.ribbon)}</dd>
                </div>
                {design.filler && (
                  <div className="flex justify-between">
                    <dt>Baby’s breath & greenery</dt>
                    <dd>{inr(price.filler)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt>Atelier hand-tying</dt>
                  <dd>{inr(DESIGN_FEE)}</dd>
                </div>
              </dl>
              <div className="mt-5 flex items-end justify-between border-t border-ivory/15 pt-5">
                <span className="eyebrow text-blush/80">
                  {sizeTier(total)} · {total} stems
                </span>
                <span className="font-display text-5xl font-light">{inr(price.total)}</span>
              </div>
              <button type="submit" className="btn mt-6 w-full bg-ivory py-5 text-burgundy hover:text-ivory">
                <span className="btn-fill" />
                <span className="btn-label">
                  {added ? (
                    <>
                      <Check size={16} /> Added to your bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} strokeWidth={1.5} /> Add custom bouquet to cart
                    </>
                  )}
                </span>
              </button>
              <div className="mt-4 flex items-center justify-between">
                <p className="flex items-center gap-2 font-sans text-[0.72rem] text-ivory/60">
                  <Sparkles size={13} /> Ready in 3 hours · same-day delivery
                </p>
                <button type="button" onClick={() => (setDesign(DEFAULT_DESIGN), setNote(''))} className="flex items-center gap-1.5 font-sans text-[0.72rem] text-ivory/70 underline-offset-4 hover:underline">
                  <RotateCcw size={12} /> Reset
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
