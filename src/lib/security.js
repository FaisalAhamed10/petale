/**
 * Client-side hardening helpers.
 * React already escapes everything it renders, so these focus on keeping user input
 * well-formed (length caps, no control / bidi-override characters) and on blunting
 * automated form spam. Real protection still has to live on a server once one exists.
 */

// C0/C1 control chars (except tab/newline), zero-width chars and bidi overrides used for spoofing
const UNSAFE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g

export const LIMITS = {
  name: 80,
  email: 254,
  phone: 16,
  subject: 120,
  gift: 200,
  occasion: 40,
  date: 10,
  message: 2000,
  address: 160,
  landmark: 80,
  city: 60,
  pin: 6,
  promo: 20,
  search: 60,
}

/** Strip unsafe characters and cap the length while the user types. */
export const cleanInput = (value, max = 200) => String(value ?? '').replace(UNSAFE, '').slice(0, max)

/** Final pass before a value is used: clean, collapse runs of spaces, trim. */
export const cleanField = (value, max = 200) =>
  cleanInput(value, max)
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

export const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]{1,64}@[^\s@<>()[\]\\,;:"]{1,189}\.[a-z]{2,24}$/i

/**
 * Returns a guard for one form: blocks re-submits inside `gapMs`, and submissions that
 * arrive faster than a human could fill the form (`minFillMs` after it was shown).
 */
export function createSubmitGuard({ gapMs = 8000, minFillMs = 1500 } = {}) {
  const shownAt = Date.now()
  let last = 0
  return {
    check() {
      const now = Date.now()
      if (now - shownAt < minFillMs) return 'too-fast'
      if (now - last < gapMs) return 'too-soon'
      last = now
      return 'ok'
    },
  }
}

/** Hidden "website" field: people never see it, form-filling bots usually do. */
export const HONEYPOT_PROPS = {
  type: 'text',
  name: 'website',
  tabIndex: -1,
  autoComplete: 'off',
  'aria-hidden': true,
  className: 'pointer-events-none absolute -left-[9999px] h-px w-px opacity-0',
}

/** JSON from localStorage, never trusted: parse failures and oversize blobs return the fallback. */
export function readStorage(key, fallback, maxBytes = 20000) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw || raw.length > maxBytes) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked — the site keeps working for this visit */
  }
}
