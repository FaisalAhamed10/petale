import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  PRODUCTS,
  SIZES,
  FLOWER_TYPES,
  WRAPS,
  RIBBONS,
  STEM_LIMITS,
  priceDesign,
  splitCount,
  describeDesign,
} from '../data/catalog'
import { readStorage, writeStorage, cleanField, LIMITS } from './security'

const KEY = 'petale-bag-v1'
const WISH_KEY = 'petale-wish-v1'
export const FREE_DELIVERY_AT = 3000
export const DELIVERY_FEE = 149

const clampQty = (q) => {
  const n = Math.trunc(Number(q))
  return Number.isFinite(n) ? Math.max(1, Math.min(9, n)) : 1
}

/** A stored custom design is user-editable, so rebuild it from known options only. */
export function sanitizeDesign(raw) {
  if (!raw || typeof raw !== 'object') return null
  const flowers = {}
  for (const [t, c] of Object.entries(raw.flowers || {}).slice(0, FLOWER_TYPES.length)) {
    const f = FLOWER_TYPES.find((x) => x.id === t)
    if (f && f.colors.some((x) => x.id === c)) flowers[t] = c
  }
  const types = Object.keys(flowers)
  if (!types.length) return null
  // per-variety stem counts (older saved bags stored one total — split it evenly)
  const legacy = splitCount(Math.trunc(Number(raw.count)) || STEM_LIMITS.min, types.length)
  const counts = {}
  types.forEach((t, i) => {
    const n = Math.trunc(Number(raw.counts?.[t] ?? legacy[i]))
    counts[t] = Math.max(STEM_LIMITS.perMin, Math.min(STEM_LIMITS.perMax, Number.isFinite(n) ? n : STEM_LIMITS.perMin))
  })
  let total = types.reduce((s, t) => s + counts[t], 0)
  while (total > STEM_LIMITS.max) {
    const t = types.reduce((a, b) => (counts[a] >= counts[b] ? a : b))
    counts[t] -= 1
    total -= 1
  }
  return {
    flowers,
    counts,
    wrap: WRAPS.some((w) => w.id === raw.wrap) ? raw.wrap : 'white',
    ribbon: RIBBONS.some((r) => r.id === raw.ribbon) ? raw.ribbon : 'white',
    filler: !!raw.filler,
    message: cleanField(raw.message, LIMITS.gift),
  }
}

function sanitizeLine(l) {
  if (!l || typeof l !== 'object') return null
  if (l.kind === 'custom') {
    const design = sanitizeDesign(l.design)
    if (!design) return null
    return { key: String(l.key).slice(0, 40), kind: 'custom', design, qty: clampQty(l.qty) }
  }
  if (!PRODUCTS.some((p) => p.id === l.id)) return null
  const size = SIZES.some((s) => s.id === l.size) ? l.size : 'classic'
  return { key: `${l.id}:${size}`, kind: 'product', id: l.id, size, qty: clampQty(l.qty) }
}

function load() {
  const raw = readStorage(KEY, [])
  if (!Array.isArray(raw)) return []
  const seen = new Set()
  return raw
    .slice(0, 30)
    .map(sanitizeLine)
    .filter((l) => l && !seen.has(l.key) && seen.add(l.key))
}

function reducer(state, a) {
  switch (a.type) {
    case 'add': {
      const found = state.find((l) => l.key === a.line.key)
      if (found) return state.map((l) => (l.key === a.line.key ? { ...l, qty: clampQty(l.qty + a.line.qty) } : l))
      return [...state, a.line]
    }
    case 'qty':
      return state.map((l) => (l.key === a.key ? { ...l, qty: clampQty(a.qty) } : l))
    case 'remove':
      return state.filter((l) => l.key !== a.key)
    case 'clear':
      return []
    default:
      return state
  }
}

/** Resolve a cart line to display data with prices recomputed from the catalogue. */
export function resolveLine(l) {
  if (l.kind === 'custom') {
    const unit = priceDesign(l.design).total
    return { ...l, name: 'Your Custom Bouquet', detail: describeDesign(l.design), unit, total: unit * l.qty, img: null }
  }
  const p = PRODUCTS.find((x) => x.id === l.id)
  const s = SIZES.find((x) => x.id === l.size)
  const unit = sizedPrice(p.price, s.mult)
  return { ...l, name: p.name, detail: `${s.label} · ${p.category}`, unit, total: unit * l.qty, img: p.img, product: p }
}

/** Classic is the list price; larger sizes land on a boutique-style ₹…99 price. */
function sizedPrice(price, mult) {
  return mult === 1 ? price : Math.round((price * mult) / 100) * 100 - 1
}

export const unitPrice = (product, sizeId = 'classic') => {
  const s = SIZES.find((x) => x.id === sizeId) || SIZES[0]
  return sizedPrice(product.price, s.mult)
}

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, undefined, load)
  const [wish, setWish] = useState(() => {
    const w = readStorage(WISH_KEY, [])
    return Array.isArray(w) ? w.filter((id) => PRODUCTS.some((p) => p.id === id)) : []
  })
  const [panel, setPanel] = useState(null) // 'cart' | 'wishlist' | 'search' | null
  const [quick, setQuick] = useState(null) // product id
  const [checkout, setCheckout] = useState(null) // null | 'details' | 'done'
  const [order, setOrder] = useState(null)
  const [toast, setToast] = useState(null)
  const [bump, setBump] = useState(0)
  const [filter, setFilter] = useState({ category: 'All', occasion: null })
  const customN = useRef(0)

  useEffect(() => writeStorage(KEY, items), [items])
  useEffect(() => writeStorage(WISH_KEY, wish), [wish])

  const notify = useCallback((text, action) => setToast({ key: Date.now(), text, action }), [])

  const addProduct = useCallback(
    (id, { size = 'classic', qty = 1 } = {}) => {
      const line = sanitizeLine({ kind: 'product', id, size, qty })
      if (!line) return
      dispatch({ type: 'add', line })
      setBump((b) => b + 1)
      const p = PRODUCTS.find((x) => x.id === id)
      notify(`${p.name} added to your bag`, 'cart')
    },
    [notify]
  )

  const addCustom = useCallback(
    (design) => {
      const clean = sanitizeDesign(design)
      if (!clean) return false
      customN.current += 1
      dispatch({ type: 'add', line: { key: `custom-${Date.now()}-${customN.current}`, kind: 'custom', design: clean, qty: 1 } })
      setBump((b) => b + 1)
      notify('Your custom bouquet is in the bag', 'cart')
      return true
    },
    [notify]
  )

  const toggleWish = useCallback(
    (id) => {
      setWish((w) => {
        const has = w.includes(id)
        const p = PRODUCTS.find((x) => x.id === id)
        notify(has ? `${p?.name} removed from wishlist` : `${p?.name} saved to wishlist`, has ? null : 'wishlist')
        return has ? w.filter((x) => x !== id) : [...w, id]
      })
    },
    [notify]
  )

  const value = useMemo(() => {
    const lines = items.map(resolveLine)
    const count = lines.reduce((s, l) => s + l.qty, 0)
    const subtotal = lines.reduce((s, l) => s + l.total, 0)
    const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE
    return {
      lines,
      count,
      subtotal,
      delivery,
      total: subtotal + delivery,
      wish,
      panel,
      quick,
      checkout,
      order,
      toast,
      bump,
      filter,
      setPanel,
      setQuick,
      setCheckout,
      setToast,
      setFilter,
      addProduct,
      addCustom,
      toggleWish,
      setQty: (key, qty) => dispatch({ type: 'qty', key, qty }),
      remove: (key) => dispatch({ type: 'remove', key }),
      /** Demo order — nothing leaves the browser; the confirmation is built locally. */
      placeOrder: (raw) => {
        const details = Object.fromEntries(
          ['name', 'phone', 'email', 'address', 'city', 'pin', 'date', 'gift'].map((k) => [k, cleanField(raw[k], LIMITS[k] ?? 120)])
        )
        details.slot = cleanField(raw.slot, 40)
        const o = {
          id: `PTL-${Math.floor(100000 + Math.random() * 900000)}`,
          lines,
          subtotal,
          delivery,
          total: subtotal + delivery,
          details,
        }
        setOrder(o)
        dispatch({ type: 'clear' })
        setCheckout('done')
        return o
      },
    }
  }, [items, wish, panel, quick, checkout, order, toast, bump, filter, addProduct, addCustom, toggleWish])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
