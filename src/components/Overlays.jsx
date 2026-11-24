import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Minus, Plus, Trash2, Heart, Search, ShoppingBag, ArrowRight, ArrowLeft, Check, Truck, Gift, Flower2 } from 'lucide-react'
import { useStore, unitPrice, FREE_DELIVERY_AT } from '../lib/store'
import { PRODUCTS, SIZES, OCCASIONS, inr, photo } from '../data/catalog'
import { useScrollLock } from '../lib/motion'
import { cleanInput, cleanField, EMAIL_RE, LIMITS, createSubmitGuard } from '../lib/security'
import { Photo } from './ui'
import { Field } from './Contact'

const EASE = [0.76, 0, 0.24, 1]

function useEscape(active, fn) {
  useEffect(() => {
    if (!active) return
    const k = (e) => e.key === 'Escape' && fn()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [active, fn])
}

/** Focus the dialog when it opens, give focus back to the trigger when it closes. */
function useFocusReturn(active, ref) {
  useEffect(() => {
    if (!active) return
    const prev = document.activeElement
    const t = setTimeout(() => ref.current?.focus(), 60)
    return () => {
      clearTimeout(t)
      if (prev instanceof HTMLElement) prev.focus({ preventScroll: true })
    }
  }, [active, ref])
}

function Backdrop({ onClick }) {
  return <motion.div className="fixed inset-0 z-[60] bg-wine/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClick} />
}

function Drawer({ open, onClose, label, children, width = 'max-w-[480px]' }) {
  const ref = useRef(null)
  useScrollLock(open)
  useEscape(open, onClose)
  useFocusReturn(open, ref)
  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClick={onClose} />
          <motion.aside
            ref={ref}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className={`fixed inset-y-0 right-0 z-[61] flex w-full ${width} flex-col bg-ivory shadow-2xl outline-none`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.7, ease: EASE }}
            data-lenis-prevent
          >
            {children}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerHead({ title, sub, onClose, onBack }) {
  return (
    <div className="flex items-center justify-between border-b border-burgundy/10 px-6 py-5 sm:px-8">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="icon-btn -ml-3 text-burgundy hover:bg-blush/40" aria-label="Back to bag">
            <ArrowLeft size={18} strokeWidth={1.4} />
          </button>
        )}
        <div>
          <p className="display text-3xl text-burgundy">{title}</p>
          {sub && <p className="eyebrow mt-1 text-[0.56rem] text-ink/50">{sub}</p>}
        </div>
      </div>
      <button onClick={onClose} className="icon-btn text-burgundy hover:bg-blush/40" aria-label="Close">
        <X size={20} strokeWidth={1.4} />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ cart + checkout */

function CustomThumb() {
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-blush to-rose/60 text-burgundy">
      <Flower2 size={26} strokeWidth={1.2} />
    </div>
  )
}

function CartLines() {
  const { lines, setQty, remove } = useStore()
  return (
    <ul className="divide-y divide-burgundy/10">
      <AnimatePresence initial={false}>
        {lines.map((l) => (
          <motion.li key={l.key} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, height: 0 }} transition={{ duration: 0.45 }} className="flex gap-4 py-5">
            <div className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-blush">
              {l.img ? <img src={photo(l.img, { w: 200, ratio: 1.2 })} alt="" className="h-full w-full object-cover" loading="lazy" /> : <CustomThumb />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xl leading-tight text-burgundy">{l.name}</p>
                <p className="shrink-0 font-sans text-[0.9rem] text-burgundy">{inr(l.total)}</p>
              </div>
              <p className="mt-1 line-clamp-2 font-sans text-[0.75rem] leading-snug text-ink/55">{l.detail}</p>
              {l.kind === 'custom' && l.design.message && <p className="mt-1 truncate font-display text-sm italic text-rose">“{l.design.message}”</p>}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center rounded-full border border-burgundy/15">
                  <button className="grid h-8 w-8 place-items-center text-burgundy disabled:opacity-30" onClick={() => setQty(l.key, l.qty - 1)} disabled={l.qty <= 1} aria-label={`Decrease ${l.name}`}>
                    <Minus size={13} />
                  </button>
                  <span className="w-6 text-center font-sans text-[0.85rem]" aria-live="polite">
                    {l.qty}
                  </span>
                  <button className="grid h-8 w-8 place-items-center text-burgundy disabled:opacity-30" onClick={() => setQty(l.key, l.qty + 1)} disabled={l.qty >= 9} aria-label={`Increase ${l.name}`}>
                    <Plus size={13} />
                  </button>
                </div>
                <button className="flex items-center gap-1.5 font-sans text-[0.72rem] text-ink/50 hover:text-rose" onClick={() => remove(l.key)} aria-label={`Remove ${l.name}`}>
                  <Trash2 size={13} /> Remove
                </button>
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

const SLOTS = ['9am – 12pm', '12pm – 3pm', '3pm – 6pm', '6pm – 9pm']
const todayISO = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function CheckoutForm() {
  const { total, subtotal, delivery, placeOrder, count } = useStore()
  const [v, setV] = useState({ name: '', phone: '', email: '', address: '', city: 'Bengaluru', pin: '', date: todayISO(), slot: SLOTS[2], gift: '' })
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)
  const guard = useMemo(() => createSubmitGuard({ gapMs: 3000, minFillMs: 1200 }), [])
  const set = (k, max) => (e) => {
    setV((s) => ({ ...s, [k]: cleanInput(e.target.value, max) }))
    setErr((x) => ({ ...x, [k]: undefined }))
  }
  const submit = (e) => {
    e.preventDefault()
    const x = {}
    if (cleanField(v.name).length < 2) x.name = 'Recipient name, please.'
    const digits = v.phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 13) x.phone = 'A 10-digit mobile number.'
    if (v.email && !EMAIL_RE.test(cleanField(v.email))) x.email = 'Check the email address.'
    if (cleanField(v.address).length < 8) x.address = 'Full delivery address, please.'
    if (!/^\d{6}$/.test(v.pin)) x.pin = '6-digit PIN code.'
    if (!v.date || v.date < todayISO()) x.date = 'Choose today or a later date.'
    setErr(x)
    if (Object.keys(x).length || !count) return
    if (guard.check() === 'too-soon') return
    setBusy(true)
    setTimeout(() => placeOrder(v), 900)
  }
  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-7 overflow-y-auto px-6 py-7 sm:px-8" data-lenis-prevent>
        <p className="eyebrow text-[0.58rem] text-rose">Recipient & delivery</p>
        <Field id="o-name" label="Recipient name" error={err.name}>
          <input id="o-name" className="field" autoComplete="name" value={v.name} onChange={set('name', LIMITS.name)} />
        </Field>
        <div className="grid grid-cols-2 gap-5">
          <Field id="o-phone" label="Phone" error={err.phone}>
            <input id="o-phone" className="field" type="tel" inputMode="tel" autoComplete="tel" value={v.phone} onChange={set('phone', LIMITS.phone)} />
          </Field>
          <Field id="o-email" label="Email (optional)" error={err.email}>
            <input id="o-email" className="field" type="email" autoComplete="email" value={v.email} onChange={set('email', LIMITS.email)} />
          </Field>
        </div>
        <Field id="o-addr" label="Delivery address" error={err.address}>
          <input id="o-addr" className="field" autoComplete="street-address" value={v.address} onChange={set('address', LIMITS.address)} />
        </Field>
        <div className="grid grid-cols-2 gap-5">
          <Field id="o-city" label="City" error={err.city}>
            <input id="o-city" className="field" autoComplete="address-level2" value={v.city} onChange={set('city', LIMITS.city)} />
          </Field>
          <Field id="o-pin" label="PIN code" error={err.pin}>
            <input id="o-pin" className="field" inputMode="numeric" autoComplete="postal-code" value={v.pin} onChange={(e) => (setV((s) => ({ ...s, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })), setErr((x) => ({ ...x, pin: undefined })))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <Field id="o-date" label="Delivery date" error={err.date}>
            <input id="o-date" className="field" type="date" min={todayISO()} value={v.date} onChange={set('date', 10)} />
          </Field>
          <Field id="o-slot" label="Time slot">
            <select id="o-slot" className="field" value={v.slot} onChange={set('slot', 40)}>
              {SLOTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field id="o-gift" label="Card message (optional)">
          <textarea id="o-gift" rows={2} className="field resize-none" value={v.gift} onChange={set('gift', LIMITS.gift)} placeholder="Happy birthday, my love…" />
        </Field>
        <div className="rounded-2xl border border-burgundy/12 bg-cream/70 p-4">
          <p className="flex items-center gap-2 font-sans text-[0.85rem] text-burgundy">
            <Check size={15} /> Cash / UPI on delivery
          </p>
          <p className="mt-1 font-sans text-[0.72rem] text-ink/50">Demo checkout — no payment is taken and no order is transmitted.</p>
        </div>
      </div>
      <div className="border-t border-burgundy/10 px-6 py-5 sm:px-8">
        <dl className="space-y-1.5 font-sans text-[0.85rem] text-ink/65">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{inr(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{delivery ? inr(delivery) : 'Free'}</dd>
          </div>
          <div className="flex justify-between pt-2 font-display text-2xl text-burgundy">
            <dt>Total</dt>
            <dd>{inr(total)}</dd>
          </div>
        </dl>
        <button type="submit" disabled={busy} className="btn-dark mt-4 w-full py-5">
          <span className="btn-fill" />
          <span className="btn-label">{busy ? 'Placing order…' : `Place order · ${inr(total)}`}</span>
        </button>
      </div>
    </form>
  )
}

function OrderDone() {
  const { order, setPanel, setCheckout } = useStore()
  if (!order) return null
  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 text-center sm:px-8" data-lenis-prevent>
      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 14 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-burgundy text-ivory">
        <Flower2 size={34} strokeWidth={1.2} />
      </motion.span>
      <p className="display mt-8 text-5xl text-burgundy">Thank you.</p>
      <p className="mt-3 font-sans text-[0.92rem] text-ink/65">
        Order <span className="font-medium text-burgundy">{order.id}</span> is with our florists.
      </p>
      <div className="mt-8 rounded-[24px] bg-cream/80 p-6 text-left">
        <p className="eyebrow text-[0.58rem] text-rose">Delivering to</p>
        <p className="mt-2 font-sans text-[0.9rem] text-ink/75">
          {order.details.name} · {order.details.address}, {order.details.city} {order.details.pin}
        </p>
        <p className="mt-1 font-sans text-[0.85rem] text-ink/55">
          {new Date(order.details.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · {order.details.slot}
        </p>
        <ul className="mt-5 space-y-1 border-t border-burgundy/10 pt-4 font-sans text-[0.85rem] text-ink/70">
          {order.lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-4">
              <span>
                {l.qty} × {l.name}
              </span>
              <span>{inr(l.total)}</span>
            </li>
          ))}
          <li className="flex justify-between pt-2 font-display text-xl text-burgundy">
            <span>Total (pay on delivery)</span>
            <span>{inr(order.total)}</span>
          </li>
        </ul>
      </div>
      <p className="mt-5 font-sans text-[0.72rem] text-ink/45">This is a demo boutique — nothing was charged or sent.</p>
      <button
        className="btn-dark mt-8"
        onClick={() => {
          setCheckout(null)
          setPanel(null)
        }}
      >
        <span className="btn-fill" />
        <span className="btn-label">Continue browsing</span>
      </button>
    </div>
  )
}

export function CartDrawer() {
  const { panel, setPanel, lines, subtotal, count, checkout, setCheckout } = useStore()
  const open = panel === 'cart'
  const close = () => {
    setPanel(null)
    if (checkout === 'done') setCheckout(null)
  }
  const toFree = Math.max(0, FREE_DELIVERY_AT - subtotal)
  const step = checkout || 'bag'
  return (
    <Drawer open={open} onClose={close} label="Shopping bag">
      {step === 'done' ? (
        <>
          <DrawerHead title="Order placed" onClose={close} />
          <OrderDone />
        </>
      ) : step === 'details' ? (
        <>
          <DrawerHead title="Checkout" sub={`${count} item${count === 1 ? '' : 's'}`} onClose={close} onBack={() => setCheckout(null)} />
          <CheckoutForm />
        </>
      ) : (
        <>
          <DrawerHead title="Your bag" sub={`${count} item${count === 1 ? '' : 's'}`} onClose={close} />
          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <ShoppingBag size={40} strokeWidth={1} className="text-rose" />
              <p className="display mt-6 text-4xl text-burgundy">Your bag is empty.</p>
              <p className="mt-3 font-sans text-[0.9rem] text-ink/55">Every beautiful moment starts with a single stem.</p>
              <button
                className="btn-dark mt-8"
                onClick={() => {
                  setPanel(null)
                  setTimeout(() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }), 400)
                }}
              >
                <span className="btn-fill" />
                <span className="btn-label">Explore bouquets</span>
              </button>
            </div>
          ) : (
            <>
              <div className="border-b border-burgundy/10 px-6 py-4 sm:px-8">
                <p className="flex items-center gap-2 font-sans text-[0.8rem] text-ink/65">
                  <Truck size={15} className="text-rose" />
                  {toFree > 0 ? (
                    <>
                      Add <span className="font-medium text-burgundy">{inr(toFree)}</span> for free same-day delivery
                    </>
                  ) : (
                    'Free same-day delivery unlocked'
                  )}
                </p>
                <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-burgundy/10">
                  <motion.div className="h-full bg-burgundy" initial={false} animate={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_AT) * 100)}%` }} transition={{ duration: 0.6 }} />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 sm:px-8" data-lenis-prevent>
                <CartLines />
              </div>
              <div className="border-t border-burgundy/10 px-6 py-6 sm:px-8">
                <p className="mb-4 flex items-center gap-2 font-sans text-[0.75rem] text-ink/55">
                  <Gift size={14} className="text-rose" /> Every bouquet ships in keepsake wrap with a handwritten card.
                </p>
                <div className="flex items-end justify-between">
                  <span className="eyebrow text-burgundy/70">Subtotal</span>
                  <span className="font-display text-4xl text-burgundy">{inr(subtotal)}</span>
                </div>
                <button className="btn-dark mt-5 w-full py-5" onClick={() => setCheckout('details')}>
                  <span className="btn-fill" />
                  <span className="btn-label">
                    Checkout <ArrowRight size={15} />
                  </span>
                </button>
              </div>
            </>
          )}
        </>
      )}
    </Drawer>
  )
}

/* ------------------------------------------------------------------ wishlist */

export function WishlistDrawer() {
  const { panel, setPanel, wish, toggleWish, addProduct, setQuick } = useStore()
  const items = wish.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean)
  return (
    <Drawer open={panel === 'wishlist'} onClose={() => setPanel(null)} label="Wishlist">
      <DrawerHead title="Wishlist" sub={`${items.length} saved`} onClose={() => setPanel(null)} />
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <Heart size={40} strokeWidth={1} className="text-rose" />
          <p className="display mt-6 text-4xl text-burgundy">Nothing saved yet.</p>
          <p className="mt-3 font-sans text-[0.9rem] text-ink/55">Tap the heart on any bouquet to keep it here.</p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-burgundy/10 overflow-y-auto px-6 sm:px-8" data-lenis-prevent>
          {items.map((p) => (
            <li key={p.id} className="flex gap-4 py-5">
              <button className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl" onClick={() => (setPanel(null), setQuick(p.id))} aria-label={`View ${p.name}`}>
                <img src={photo(p.img, { w: 200, ratio: 1.2 })} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <p className="font-display text-xl text-burgundy">{p.name}</p>
                  <p className="font-sans text-[0.9rem] text-burgundy">{inr(unitPrice(p))}</p>
                </div>
                <p className="mt-1 font-sans text-[0.75rem] text-ink/55">{p.short}</p>
                <div className="mt-auto flex gap-4 pt-3">
                  <button className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-burgundy underline-offset-4 hover:underline" onClick={() => addProduct(p.id)}>
                    Add to bag
                  </button>
                  <button className="font-sans text-[0.72rem] text-ink/50 hover:text-rose" onClick={() => toggleWish(p.id)}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  )
}

/* ------------------------------------------------------------------ search */

export function SearchPanel() {
  const { panel, setPanel, setQuick, setFilter } = useStore()
  const open = panel === 'search'
  const [q, setQ] = useState('')
  const input = useRef(null)
  useScrollLock(open)
  useEscape(open, () => setPanel(null))
  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 250)
    else setQ('')
  }, [open])
  const term = q.trim().toLowerCase()
  const results = term
    ? PRODUCTS.filter((p) => [p.name, p.category, p.short, p.stems, ...p.occasions.map((o) => OCCASIONS.find((x) => x.id === o)?.name ?? '')].join(' ').toLowerCase().includes(term))
    : PRODUCTS.slice(0, 4)
  const occ = term ? OCCASIONS.filter((o) => o.name.toLowerCase().includes(term)) : []

  return (
    <AnimatePresence>
      {open && (
        <>
          <Backdrop onClick={() => setPanel(null)} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search bouquets"
            className="fixed inset-x-0 top-0 z-[61] max-h-[88vh] overflow-y-auto bg-ivory pb-10 shadow-2xl"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.7, ease: EASE }}
            data-lenis-prevent
          >
            <div className="container-x pt-8">
              <div className="flex items-center justify-between">
                <p className="eyebrow text-rose">Search the atelier</p>
                <button className="icon-btn text-burgundy hover:bg-blush/40" onClick={() => setPanel(null)} aria-label="Close search">
                  <X size={20} strokeWidth={1.4} />
                </button>
              </div>
              <label className="mt-6 flex items-center gap-4 border-b border-burgundy/20 pb-4 focus-within:border-burgundy">
                <Search size={26} strokeWidth={1.2} className="text-burgundy" />
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(cleanInput(e.target.value, LIMITS.search))}
                  placeholder="Roses, peonies, anniversary…"
                  className="w-full bg-transparent font-display text-4xl font-light text-burgundy placeholder:text-burgundy/30 focus:outline-none sm:text-6xl"
                  aria-label="Search bouquets"
                />
              </label>
              {occ.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {occ.map((o) => (
                    <button
                      key={o.id}
                      className="chip border-rose bg-rose/10 text-burgundy"
                      onClick={() => {
                        setFilter({ category: 'All', occasion: o.id })
                        setPanel(null)
                        setTimeout(() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' }), 450)
                      }}
                    >
                      {o.name} <ArrowRight size={13} />
                    </button>
                  ))}
                </div>
              )}
              <p className="eyebrow mt-8 text-[0.58rem] text-ink/45">{term ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Popular right now'}</p>
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                {results.map((p) => (
                  <button key={p.id} className="group text-left" onClick={() => (setPanel(null), setQuick(p.id))}>
                    <div className="aspect-[4/5] overflow-hidden rounded-2xl">
                      <img src={photo(p.img, { w: 420, ratio: 1.25 })} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                    </div>
                    <p className="mt-3 font-display text-xl text-burgundy">{p.name}</p>
                    <p className="font-sans text-[0.8rem] text-ink/55">{inr(unitPrice(p))}</p>
                  </button>
                ))}
              </div>
              {term && results.length === 0 && (
                <p className="mt-4 font-sans text-[0.95rem] text-ink/60">
                  No bouquets match “{q}”. Try “roses”, “wedding” or{' '}
                  <button className="underline" onClick={() => (setPanel(null), setTimeout(() => document.getElementById('customize')?.scrollIntoView({ behavior: 'smooth' }), 450))}>
                    design your own
                  </button>
                  .
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ quick view */

export function QuickView() {
  const { quick, setQuick, addProduct, toggleWish, wish, setPanel } = useStore()
  const p = PRODUCTS.find((x) => x.id === quick)
  const [size, setSize] = useState('classic')
  const [qty, setQty] = useState(1)
  const [img, setImg] = useState(0)
  const ref = useRef(null)
  const open = !!p
  useScrollLock(open)
  useEscape(open, () => setQuick(null))
  useFocusReturn(open, ref)
  useEffect(() => {
    setSize('classic')
    setQty(1)
    setImg(0)
  }, [quick])

  return (
    <AnimatePresence>
      {p && (
        <>
          <Backdrop onClick={() => setQuick(null)} />
          <div className="pointer-events-none fixed inset-0 z-[61] grid place-items-center p-0 sm:p-6">
            <motion.div
              ref={ref}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={`${p.name} details`}
              className="pointer-events-auto relative grid h-full w-full max-w-5xl overflow-y-auto bg-ivory outline-none sm:h-auto sm:max-h-[90vh] sm:rounded-[34px] md:grid-cols-2"
              initial={{ opacity: 0, y: 60, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              data-lenis-prevent
            >
              <button className="icon-btn absolute right-4 top-4 z-10 bg-ivory/85 text-burgundy backdrop-blur hover:bg-ivory" onClick={() => setQuick(null)} aria-label="Close quick view">
                <X size={20} strokeWidth={1.4} />
              </button>
              <div className="relative aspect-[4/5] overflow-hidden bg-blush md:aspect-auto md:min-h-[600px]">
                <AnimatePresence initial={false}>
                  <motion.div key={img} className="absolute inset-0" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }}>
                    <Photo id={img ? p.alt : p.img} alt={`${p.name} bouquet${img ? ' — alternate view' : ''}`} ratio={1.25} sizes="(max-width: 768px) 100vw, 50vw" eager className="h-full w-full object-cover" />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {[p.img, p.alt].map((id, i) => (
                    <button key={id} onClick={() => setImg(i)} className={`h-16 w-14 overflow-hidden rounded-xl border-2 transition-colors ${img === i ? 'border-ivory' : 'border-transparent opacity-70'}`} aria-label={`Show image ${i + 1}`} aria-pressed={img === i}>
                      <img src={photo(id, { w: 120, ratio: 1.2 })} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col p-7 sm:p-10">
                <p className="eyebrow text-rose">
                  {p.category}
                  {p.tag ? ` · ${p.tag}` : ''}
                </p>
                <h2 className="display mt-4 text-[3rem] text-burgundy sm:text-[3.6rem]">{p.name}</h2>
                <p className="mt-3 font-display text-3xl text-burgundy">{inr(unitPrice(p, size) * qty)}</p>
                <p className="mt-5 font-sans text-[0.93rem] leading-relaxed text-ink/70">{p.description}</p>
                <dl className="mt-6 space-y-2 border-y border-burgundy/10 py-5 font-sans text-[0.82rem]">
                  <div className="flex gap-4">
                    <dt className="w-20 shrink-0 text-ink/45">Stems</dt>
                    <dd className="text-ink/75">{p.stems}</dd>
                  </div>
                  <div className="flex gap-4">
                    <dt className="w-20 shrink-0 text-ink/45">Wrap</dt>
                    <dd className="text-ink/75">{p.wrap}</dd>
                  </div>
                  <div className="flex gap-4">
                    <dt className="w-20 shrink-0 text-ink/45">For</dt>
                    <dd className="text-ink/75">{p.occasions.map((o) => OCCASIONS.find((x) => x.id === o)?.name).join(', ')}</dd>
                  </div>
                </dl>
                <p className="eyebrow mt-6 text-[0.58rem] text-burgundy/70">Size</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {SIZES.map((s) => (
                    <button key={s.id} onClick={() => setSize(s.id)} aria-pressed={size === s.id} className={`rounded-2xl border px-3 py-3 text-left transition-colors ${size === s.id ? 'border-burgundy bg-burgundy text-ivory' : 'border-burgundy/15 text-burgundy hover:border-burgundy'}`}>
                      <span className="block font-sans text-[0.8rem] font-medium">{s.label}</span>
                      <span className={`block font-sans text-[0.65rem] ${size === s.id ? 'text-blush' : 'text-ink/50'}`}>{inr(unitPrice(p, s.id))}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 font-sans text-[0.72rem] text-ink/45">{SIZES.find((s) => s.id === size).note}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-burgundy/20">
                    <button className="grid h-12 w-11 place-items-center text-burgundy disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-sans" aria-live="polite">
                      {qty}
                    </span>
                    <button className="grid h-12 w-11 place-items-center text-burgundy disabled:opacity-30" onClick={() => setQty((q) => Math.min(9, q + 1))} disabled={qty >= 9} aria-label="Increase quantity">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    className="btn-dark flex-1 py-4"
                    onClick={() => {
                      addProduct(p.id, { size, qty })
                      setQuick(null)
                      setTimeout(() => setPanel('cart'), 350)
                    }}
                  >
                    <span className="btn-fill" />
                    <span className="btn-label">
                      <ShoppingBag size={15} strokeWidth={1.5} /> Add to cart
                    </span>
                  </button>
                  <button className={`icon-btn h-12 w-12 border ${wish.includes(p.id) ? 'border-burgundy bg-burgundy text-ivory' : 'border-burgundy/20 text-burgundy'}`} onClick={() => toggleWish(p.id)} aria-pressed={wish.includes(p.id)} aria-label="Save to wishlist">
                    <Heart size={17} strokeWidth={1.5} className={wish.includes(p.id) ? 'fill-current' : ''} />
                  </button>
                </div>
                <p className="mt-5 flex items-center gap-2 font-sans text-[0.75rem] text-ink/55">
                  <Truck size={14} className="text-rose" /> Order by 6pm for same-day delivery · free above {inr(FREE_DELIVERY_AT)}
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------------------------------------------ toast */

export function Toast() {
  const { toast, setToast, setPanel } = useStore()
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast, setToast])
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[80] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="pointer-events-auto flex items-center gap-4 rounded-full bg-burgundy py-2.5 pl-5 pr-2.5 text-ivory shadow-2xl"
          >
            <Check size={16} className="text-blush" />
            <span className="font-sans text-[0.85rem]">{toast.text}</span>
            {toast.action && (
              <button className="rounded-full bg-ivory px-4 py-2 font-sans text-[0.65rem] uppercase tracking-[0.18em] text-burgundy" onClick={() => (setPanel(toast.action), setToast(null))}>
                View
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
