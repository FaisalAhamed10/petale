import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { CONTACT, IMG, OCCASIONS } from '../data/catalog'
import { cleanInput, cleanField, createSubmitGuard, EMAIL_RE, HONEYPOT_PROPS, LIMITS } from '../lib/security'
import { gsap, useGsap, fadeUp } from '../lib/motion'
import { Button, Photo, RevealHeading, SampleTag } from './ui'

const EMPTY = { name: '', email: '', phone: '', occasion: '', message: '', website: '' }

function validate(v) {
  const e = {}
  if (cleanField(v.name).length < 2) e.name = 'Please tell us your name.'
  if (!EMAIL_RE.test(cleanField(v.email))) e.email = 'A valid email helps us reply.'
  const digits = v.phone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 13) e.phone = 'Enter a 10-digit mobile number.'
  if (!v.occasion) e.occasion = 'Choose an occasion.'
  if (cleanField(v.message).length < 10) e.message = 'A few more words, please (10+ characters).'
  return e
}

export function Field({ label, error, children, id }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p id={`${id}-err`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 font-sans text-[0.75rem] text-rose" role="alert">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Contact() {
  const [v, setV] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent | wait
  const guard = useMemo(() => createSubmitGuard(), [])
  const set = (k, max) => (e) => {
    setV((s) => ({ ...s, [k]: cleanInput(e.target.value, max) }))
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }))
  }

  const scope = useGsap((root) => fadeUp(gsap.utils.selector(root)('.ct-fade'), { trigger: root, start: 'top 72%' }))

  const submit = (e) => {
    e.preventDefault()
    if (v.website) return setStatus('sent') // bots get a quiet success
    const errs = validate(v)
    setErrors(errs)
    if (Object.keys(errs).length) return
    const g = guard.check()
    if (g !== 'ok') return setStatus('wait')
    setStatus('sending')
    // demo: nothing is transmitted — a real build would POST to the atelier's inbox here
    setTimeout(() => {
      setStatus('sent')
      setV(EMPTY)
    }, 1100)
  }

  return (
    <section id="contact" ref={scope} className="relative overflow-hidden bg-ivory py-28 md:py-40">
      <div className="container-x grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="ct-fade eyebrow text-rose">Contact the atelier</p>
          <RevealHeading className="display mt-6 text-[3.2rem] text-burgundy sm:text-[4.8rem] lg:text-[5.6rem]">
            Let’s make someone’s day.
          </RevealHeading>
          <p className="ct-fade mt-6 max-w-md font-sans text-[0.98rem] leading-relaxed text-ink/65">
            Weddings, events, a standing weekly order, or one perfect bouquet — write to us and a florist will reply within the hour.
          </p>

          <div className="ct-fade mt-10 space-y-5 rounded-[28px] border border-burgundy/12 bg-cream/70 p-7">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-burgundy">Visit · Call · Write</p>
              <SampleTag />
            </div>
            {[
              { I: Phone, t: CONTACT.phone, href: `tel:${CONTACT.phoneHref}` },
              { I: Mail, t: CONTACT.email, href: `mailto:${CONTACT.email}` },
              { I: MapPin, t: CONTACT.address },
              { I: Clock, t: CONTACT.hours },
            ].map(({ I, t, href }) => (
              <p key={t} className="flex items-start gap-4 font-sans text-[0.92rem] text-ink/75">
                <I size={17} strokeWidth={1.3} className="mt-0.5 shrink-0 text-rose" />
                {href ? (
                  <a href={href} className="underline-offset-4 hover:text-burgundy hover:underline">
                    {t}
                  </a>
                ) : (
                  t
                )}
              </p>
            ))}
            <p className="font-sans text-[0.72rem] text-ink/45">Sample contact details for this demo boutique.</p>
          </div>

          <div className="ct-fade mt-8 hidden aspect-[16/10] overflow-hidden rounded-[28px] lg:block">
            <Photo id={IMG.atelier} alt="Inside the flower atelier" ratio={0.62} className="h-full w-full object-cover" sizes="40vw" />
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="ct-fade relative rounded-[34px] bg-white/60 p-7 shadow-[0_40px_100px_-50px_rgba(84,39,53,0.45)] backdrop-blur sm:p-12">
            <AnimatePresence mode="wait">
              {status === 'sent' ? (
                <motion.div key="ok" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-16 text-center">
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-burgundy text-ivory">
                    <Check size={26} />
                  </span>
                  <p className="display mt-8 text-5xl text-burgundy">Thank you.</p>
                  <p className="mx-auto mt-4 max-w-sm font-sans text-[0.95rem] text-ink/65">
                    Your note is with our florists. (This is a demo boutique — no message was actually sent.)
                  </p>
                  <button className="btn-light mt-8" onClick={() => setStatus('idle')}>
                    <span className="btn-fill" />
                    <span className="btn-label">Send another</span>
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={submit} noValidate className="relative grid gap-8 sm:grid-cols-2">
                  <input {...HONEYPOT_PROPS} value={v.website} onChange={set('website', 40)} />
                  <Field id="c-name" label="Your name" error={errors.name}>
                    <input id="c-name" className="field" autoComplete="name" value={v.name} onChange={set('name', LIMITS.name)} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'c-name-err' : undefined} placeholder="Aanya Kapoor" />
                  </Field>
                  <Field id="c-email" label="Email" error={errors.email}>
                    <input id="c-email" type="email" className="field" autoComplete="email" value={v.email} onChange={set('email', LIMITS.email)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'c-email-err' : undefined} placeholder="you@example.com" />
                  </Field>
                  <Field id="c-phone" label="Phone number" error={errors.phone}>
                    <input id="c-phone" type="tel" inputMode="tel" className="field" autoComplete="tel" value={v.phone} onChange={set('phone', LIMITS.phone)} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'c-phone-err' : undefined} placeholder="+91 98xxx xxxxx" />
                  </Field>
                  <Field id="c-occasion" label="Occasion" error={errors.occasion}>
                    <select id="c-occasion" className="field appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%2212%22%20fill=%22none%22%20stroke=%22%23542735%22%3E%3Cpath%20d=%22M2%204l4%204%204-4%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_center] bg-no-repeat" value={v.occasion} onChange={set('occasion', LIMITS.occasion)} aria-invalid={!!errors.occasion}>
                      <option value="">Select an occasion</option>
                      {OCCASIONS.map((o) => (
                        <option key={o.id} value={o.name}>
                          {o.name}
                        </option>
                      ))}
                      <option value="Event / Corporate">Event / Corporate</option>
                      <option value="Other">Something else</option>
                    </select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field id="c-msg" label="Message" error={errors.message}>
                      <textarea id="c-msg" rows={4} className="field resize-none" value={v.message} onChange={set('message', LIMITS.message)} aria-invalid={!!errors.message} aria-describedby={errors.message ? 'c-msg-err' : undefined} placeholder="Tell us who the flowers are for, and the feeling you’d like them to carry…" data-lenis-prevent />
                    </Field>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-5 sm:col-span-2">
                    <p className="max-w-[16rem] font-sans text-[0.75rem] text-ink/45">
                      {status === 'wait' ? 'One moment — please wait a few seconds before sending again.' : 'We reply within the hour, 8am–9pm.'}
                    </p>
                    <Button type="submit" disabled={status === 'sending'}>
                      {status === 'sending' ? 'Sending…' : 'Send message'} <ArrowRight size={15} strokeWidth={1.5} />
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
