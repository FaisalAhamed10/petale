/**
 * Catalogue data. Photography is from Unsplash (free licence), self-hosted in
 * public/photos as WebP at three widths so it never depends on a third-party CDN.
 * Crops are done in CSS (object-fit: cover), so `ratio` is only a layout hint.
 */

export const PHOTO_WIDTHS = [480, 960, 1440]

/** Local WebP of a photo at the smallest stored width that covers `w`. */
export function photo(id, { w = 960 } = {}) {
  const fit = PHOTO_WIDTHS.find((x) => x >= w) ?? PHOTO_WIDTHS[PHOTO_WIDTHS.length - 1]
  return `/photos/${id}-${fit}.webp`
}
export function srcSet(id) {
  return PHOTO_WIDTHS.map((w) => `/photos/${id}-${w}.webp ${w}w`).join(', ')
}

export const IMG = {
  // products
  eternal: '1597720301887-dc3e3bd15daf',
  eternalAlt: '1518709779341-56cf4535e94b',
  pink: '1680563094046-5d846e2c59d1',
  pinkAlt: '1583228858294-6745cb25969e',
  white: '1557925923-6885735abfb1',
  whiteAlt: '1595467959554-9ffcbf37f10f',
  pastel: '1610599929746-e79dbd785f18',
  pastelAlt: '1615363750824-e8c53205cde1',
  peony: '1575178094668-132dc931ad35',
  peonyAlt: '1511201173873-c327e63eb6c4',
  tulip: '1650298306610-1d8e8d58ad4a',
  tulipAlt: '1610952598999-cdd873418f3e',
  midnight: '1681253279503-dc26b2ad87d3',
  midnightAlt: '1612351641432-20a0f196086c',
  forever: '1487530811176-3780de880c2d',
  foreverAlt: '1621581314652-06a9fe9d4db6',
  // editorial
  florist: '1642751652611-bb9a7cad58a3',
  floristShop: '1709294728779-6be509d45255',
  atelier: '1531058240690-006c446962d8',
  detail: '1482715091246-822e47d61e1c',
  stillLife: '1457089328109-e5d9bd499191',
  // occasions
  birthday: '1602136303098-f5aa2b9c9df9',
  anniversary: '1561729098-cbab0f7a9f7c',
  wedding: '1521543832500-49e69fb2bea2',
  valentine: '1730749387748-79e6d50a269c',
  proposal: '1586973698216-0c4c285d7afd',
  congrats: '1587317997383-2e6c1b24040f',
  thanks: '1644248423441-bc7c5dcebeb6',
  justBecause: '1567696153798-9111f9cd3d0d',
  // garden + testimonials
  gardenArch: '1572085313466-6710de8d7ba3',
  gardenPath: '1765124048840-1cdccf9009a8',
  gardenBed: '1530906622963-8a60586a49c7',
  t1: '1523694576729-dc99e9c0f9b4',
  t2: '1525258946800-98cfd641d0de',
  t3: '1593011951342-8426e949371f',
  t4: '1540635352372-c21b523a29c6',
}

export const CATEGORIES = ['All', 'Roses', 'Romance', 'Classic', 'Seasonal', 'Signature']

export const SIZES = [
  { id: 'classic', label: 'Classic', note: 'As pictured', mult: 1 },
  { id: 'grand', label: 'Grand', note: '+50% stems', mult: 1.45 },
  { id: 'luxe', label: 'Luxe', note: 'Double stems & keepsake box', mult: 1.9 },
]

export const PRODUCTS = [
  {
    id: 'eternal-red-roses',
    name: 'Eternal Red Roses',
    category: 'Roses',
    price: 4499,
    short: 'Two dozen velvet Grand Prix roses, clouded in baby’s breath.',
    description:
      'Our signature declaration: twenty-four long-stem red roses chosen at peak bloom, softened with clouds of baby’s breath and wrapped in ivory paper with a satin bow.',
    stems: '24 roses · baby’s breath · eucalyptus',
    wrap: 'Ivory premium paper, red satin ribbon',
    img: IMG.eternal,
    alt: IMG.eternalAlt,
    tag: 'Bestseller',
    occasions: ['anniversary', 'valentine', 'proposal'],
    tone: '#8E1D2C',
  },
  {
    id: 'pink-romance',
    name: 'Pink Romance',
    category: 'Romance',
    price: 3299,
    short: 'Blush garden roses layered in rosé tissue and pink satin.',
    description:
      'A tender bundle of blush and candy-pink roses, nested in layered rosé tissue — the bouquet for first dates, sweet apologies and every “thinking of you”.',
    stems: '18 roses · waxflower · pittosporum',
    wrap: 'Blush pink paper, pink satin ribbon',
    img: IMG.pink,
    alt: IMG.pinkAlt,
    tag: 'New',
    occasions: ['birthday', 'valentine', 'justBecause'],
    tone: '#D98E9C',
  },
  {
    id: 'white-elegance',
    name: 'White Elegance',
    category: 'Classic',
    price: 3799,
    short: 'Ivory roses and spray blooms, quietly luxurious.',
    description:
      'Cream and ivory roses with spray roses and soft greenery. Pure, calm and endlessly elegant — for weddings, sympathy and grand gestures that whisper.',
    stems: '20 ivory roses · spray roses · ruscus',
    wrap: 'Kraft & linen paper, white satin ribbon',
    img: IMG.white,
    alt: IMG.whiteAlt,
    occasions: ['wedding', 'thanks', 'congrats'],
    tone: '#E9E1D2',
  },
  {
    id: 'pastel-dream',
    name: 'Pastel Dream',
    category: 'Seasonal',
    price: 2999,
    short: 'Peach, blush and cream — a watercolour in bloom.',
    description:
      'Garden roses in peach, blush and cream with spray roses and dusty foliage. Light, airy and full of joy — a soft-focus bouquet that brightens any room.',
    stems: '15 roses · spray roses · eucalyptus',
    wrap: 'Transparent luxury wrap, champagne ribbon',
    img: IMG.pastel,
    alt: IMG.pastelAlt,
    occasions: ['birthday', 'thanks', 'justBecause'],
    tone: '#EBC9C9',
  },
  {
    id: 'royal-peony',
    name: 'Royal Peony',
    category: 'Signature',
    price: 5999,
    short: 'Sarah Bernhardt peonies, opulent and fleeting.',
    description:
      'Seasonal Sarah Bernhardt peonies that open from tight buds into blousy, perfumed blooms. Our most coveted bouquet, available while the season lasts.',
    stems: '12 peonies · garden foliage',
    wrap: 'Blush pink paper, champagne gold ribbon',
    img: IMG.peony,
    alt: IMG.peonyAlt,
    tag: 'Limited',
    occasions: ['wedding', 'anniversary', 'congrats'],
    tone: '#E7A7B6',
  },
  {
    id: 'sunshine-tulips',
    name: 'Sunshine Tulips',
    category: 'Seasonal',
    price: 2799,
    short: 'Thirty golden tulips — bottled sunlight.',
    description:
      'Thirty butter-yellow Dutch tulips that keep growing and turning towards the light in the vase. Cheerful, generous and impossible not to smile at.',
    stems: '30 tulips',
    wrap: 'Kraft paper, white satin ribbon',
    img: IMG.tulip,
    alt: IMG.tulipAlt,
    occasions: ['birthday', 'congrats', 'thanks'],
    tone: '#E9B94A',
  },
  {
    id: 'midnight-romance',
    name: 'Midnight Romance',
    category: 'Romance',
    price: 4999,
    short: 'Deep burgundy roses for evenings to remember.',
    description:
      'Velvety black-baccara and burgundy roses gathered in a dark, dramatic arrangement. Mysterious, intimate and unmistakably grown-up.',
    stems: '20 burgundy roses · dark foliage',
    wrap: 'Burgundy paper, red satin ribbon',
    img: IMG.midnight,
    alt: IMG.midnightAlt,
    occasions: ['anniversary', 'valentine', 'proposal'],
    tone: '#542735',
  },
  {
    id: 'forever-bloom',
    name: 'Forever Bloom',
    category: 'Signature',
    price: 6499,
    short: 'The atelier’s grand mixed garden bouquet.',
    description:
      'Our florists’ grandest composition: roses, lisianthus, stock and seasonal treasures in an abundant, garden-gathered mix. Every one is unique.',
    stems: '40+ mixed premium stems',
    wrap: 'Premium white paper, champagne gold ribbon',
    img: IMG.forever,
    alt: IMG.foreverAlt,
    tag: 'Atelier pick',
    occasions: ['wedding', 'congrats', 'birthday'],
    tone: '#C5A779',
  },
]

export const OCCASIONS = [
  { id: 'birthday', name: 'Birthday Flowers', line: 'Another year, in full bloom.', img: IMG.birthday },
  { id: 'anniversary', name: 'Anniversary Bouquets', line: 'For every year that grew more beautiful.', img: IMG.anniversary },
  { id: 'wedding', name: 'Wedding Flowers', line: 'Bridal bouquets, boutonnières & aisles.', img: IMG.wedding },
  { id: 'valentine', name: 'Valentine’s Day', line: 'Say it in red.', img: IMG.valentine },
  { id: 'proposal', name: 'Proposal Flowers', line: 'Before the question, the roses.', img: IMG.proposal },
  { id: 'congrats', name: 'Congratulations', line: 'Celebrate the win, beautifully.', img: IMG.congrats },
  { id: 'thanks', name: 'Thank You', line: 'Gratitude, hand-tied.', img: IMG.thanks },
  { id: 'justBecause', name: 'Just Because', line: 'No reason needed.', img: IMG.justBecause },
]

export const BESTSELLERS = ['eternal-red-roses', 'royal-peony', 'pink-romance', 'midnight-romance', 'forever-bloom']

export const TESTIMONIALS = [
  {
    name: 'Ananya R.',
    city: 'Bengaluru',
    rating: 5,
    bouquet: 'White Elegance',
    img: IMG.t1,
    quote:
      'The bouquet arrived looking exactly like the photographs — better, honestly. My mother cried, then asked who the florist was. Every rose lasted well over a week.',
  },
  {
    name: 'Karthik & Meera',
    city: 'Chennai',
    rating: 5,
    bouquet: 'Royal Peony',
    img: IMG.t2,
    quote:
      'We ordered peonies for our engagement and the atelier styled everything around them. The wrapping, the ribbon, the handwritten card — it felt couture.',
  },
  {
    name: 'Rhea S.',
    city: 'Mumbai',
    rating: 5,
    bouquet: 'Custom bouquet',
    img: IMG.t3,
    quote:
      'I designed my own bouquet with the customiser — peonies, white roses, champagne ribbon — and what arrived matched the preview almost exactly. Magic.',
  },
  {
    name: 'Arjun M.',
    city: 'Hyderabad',
    rating: 5,
    bouquet: 'Pink Romance',
    img: IMG.t4,
    quote:
      'Same-day delivery on a Friday evening, on time to the minute. She still has the ribbon tied to her mirror. PÉTALE saved my anniversary.',
  },
]

/* ----------------------------- bouquet customiser ----------------------------- */

export const FLOWER_TYPES = [
  { id: 'redRose', label: 'Red roses', kind: 'rose', price: 180, colors: [{ id: 'red', label: 'Grand Prix red', hex: '#9E1B2C' }] },
  { id: 'pinkRose', label: 'Pink roses', kind: 'rose', price: 170, colors: [{ id: 'pink', label: 'Blush', hex: '#E59AAA' }, { id: 'candy', label: 'Candy', hex: '#D9607E' }] },
  { id: 'whiteRose', label: 'White roses', kind: 'rose', price: 190, colors: [{ id: 'white', label: 'Ivory', hex: '#F3ECDF' }, { id: 'cream', label: 'Champagne', hex: '#EBD9BC' }] },
  {
    id: 'tulip',
    label: 'Tulips',
    kind: 'tulip',
    price: 160,
    colors: [
      { id: 'pink', label: 'Pink', hex: '#E88AA2' },
      { id: 'yellow', label: 'Golden', hex: '#F0BE3C' },
      { id: 'white', label: 'White', hex: '#F2EEE6' },
      { id: 'purple', label: 'Plum', hex: '#7A3A63' },
    ],
  },
  { id: 'lily', label: 'Lilies', kind: 'lily', price: 260, colors: [{ id: 'white', label: 'Casablanca white', hex: '#F7F3EA' }, { id: 'pink', label: 'Stargazer pink', hex: '#E8A0B4' }] },
  { id: 'peony', label: 'Peonies', kind: 'peony', price: 420, colors: [{ id: 'blush', label: 'Blush', hex: '#EEB9C4' }, { id: 'coral', label: 'Coral charm', hex: '#EE8C7C' }, { id: 'white', label: 'Duchesse white', hex: '#F4EEE6' }] },
  { id: 'sunflower', label: 'Sunflowers', kind: 'sunflower', price: 200, colors: [{ id: 'gold', label: 'Golden', hex: '#F1B52C' }] },
]

export const WRAPS = [
  { id: 'white', label: 'Premium white', hex: '#F5F1EA', price: 299 },
  { id: 'blush', label: 'Blush pink', hex: '#EBC3C3', price: 299 },
  { id: 'kraft', label: 'Kraft paper', hex: '#B98E62', price: 199 },
  { id: 'burgundy', label: 'Burgundy', hex: '#5C2434', price: 349 },
  { id: 'clear', label: 'Transparent luxury', hex: '#E9EEF0', price: 449, clear: true },
]

export const RIBBONS = [
  { id: 'white', label: 'White satin', hex: '#F7F4EE', price: 99 },
  { id: 'pink', label: 'Pink satin', hex: '#E7A1B0', price: 99 },
  { id: 'red', label: 'Red satin', hex: '#A3172B', price: 99 },
  { id: 'gold', label: 'Champagne gold', hex: '#C9A46A', price: 199 },
]

export const FILLER_PRICE = 249
export const DESIGN_FEE = 399
/** Stems per variety, and for the whole bouquet. */
export const STEM_LIMITS = { perMin: 1, perMax: 24, min: 5, max: 48 }

export const DEFAULT_DESIGN = {
  flowers: { redRose: 'red', peony: 'blush' }, // selected variety -> colour id
  counts: { redRose: 9, peony: 5 }, // selected variety -> stems
  wrap: 'white',
  ribbon: 'gold',
  filler: true,
  message: '',
}

/** Signature starting points for the customiser. */
export const PRESETS = [
  {
    id: 'romantic',
    label: 'The Romantic',
    swatch: ['#9E1B2C', '#F5F1EA'],
    design: { flowers: { redRose: 'red' }, counts: { redRose: 15 }, wrap: 'white', ribbon: 'red', filler: true, message: '' },
  },
  {
    id: 'blush',
    label: 'Blush Garden',
    swatch: ['#E59AAA', '#EEB9C4'],
    design: { flowers: { pinkRose: 'pink', peony: 'blush', whiteRose: 'white' }, counts: { pinkRose: 7, peony: 5, whiteRose: 5 }, wrap: 'blush', ribbon: 'gold', filler: true, message: '' },
  },
  {
    id: 'golden',
    label: 'Golden Hour',
    swatch: ['#F1B52C', '#F0BE3C'],
    design: { flowers: { sunflower: 'gold', tulip: 'yellow' }, counts: { sunflower: 5, tulip: 8 }, wrap: 'kraft', ribbon: 'white', filler: false, message: '' },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    swatch: ['#9E1B2C', '#7A3A63'],
    design: { flowers: { redRose: 'red', tulip: 'purple' }, counts: { redRose: 9, tulip: 6 }, wrap: 'burgundy', ribbon: 'gold', filler: false, message: '' },
  },
  {
    id: 'pure',
    label: 'Pure White',
    swatch: ['#F3ECDF', '#F7F3EA'],
    design: { flowers: { whiteRose: 'white', lily: 'white' }, counts: { whiteRose: 9, lily: 4 }, wrap: 'clear', ribbon: 'white', filler: true, message: '' },
  },
]

export const totalStems = (d) => Object.keys(d.flowers).reduce((s, t) => s + (d.counts?.[t] ?? 0), 0)

export function sizeTier(n) {
  if (n < 12) return 'Petite'
  if (n < 20) return 'Classic'
  if (n < 30) return 'Grand'
  return 'Luxe'
}

/** Price is always recomputed from the catalogue, never trusted from storage. */
export function priceDesign(d) {
  const types = Object.keys(d.flowers).filter((t) => FLOWER_TYPES.some((f) => f.id === t))
  if (!types.length) return { stems: 0, wrap: 0, ribbon: 0, filler: 0, fee: DESIGN_FEE, total: DESIGN_FEE, perType: [], count: 0 }
  const perType = types.map((t) => {
    const f = FLOWER_TYPES.find((x) => x.id === t)
    const n = d.counts?.[t] ?? 0
    return { id: f.id, label: f.label, n, cost: n * f.price }
  })
  const stems = perType.reduce((s, p) => s + p.cost, 0)
  const wrap = WRAPS.find((w) => w.id === d.wrap)?.price ?? 0
  const ribbon = RIBBONS.find((r) => r.id === d.ribbon)?.price ?? 0
  const filler = d.filler ? FILLER_PRICE : 0
  const count = perType.reduce((s, p) => s + p.n, 0)
  return { stems, wrap, ribbon, filler, fee: DESIGN_FEE, total: stems + wrap + ribbon + filler + DESIGN_FEE, perType, count }
}

/** Evenly split n stems across k types (first types get the remainder). */
export function splitCount(n, k) {
  const base = Math.floor(n / k)
  return Array.from({ length: k }, (_, i) => base + (i < n % k ? 1 : 0))
}

export function describeDesign(d) {
  const parts = Object.entries(d.flowers).map(([t, c]) => {
    const f = FLOWER_TYPES.find((x) => x.id === t)
    const col = f?.colors.find((x) => x.id === c)
    const name = f ? (f.colors.length > 1 ? `${col?.label ?? ''} ${f.label.toLowerCase()}` : f.label.toLowerCase()) : ''
    return `${d.counts?.[t] ?? 0} ${name}`
  })
  const wrap = WRAPS.find((w) => w.id === d.wrap)?.label
  const ribbon = RIBBONS.find((r) => r.id === d.ribbon)?.label
  return `${parts.join(', ')} · ${wrap} wrap · ${ribbon} ribbon${d.filler ? ' · baby’s breath & greenery' : ''}`
}

export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')

export const CONTACT = {
  phone: '+91 98765 43210',
  phoneHref: '+919876543210',
  email: 'hello@petale-atelier.example',
  address: '14 Rose Garden Lane, Indiranagar, Bengaluru 560038',
  hours: 'Mon–Sun · 8am – 9pm',
}
