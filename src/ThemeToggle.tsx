import { useEffect, useState } from 'react'

export type ThemePreference = 'system' | 'dark' | 'light'

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system'
    return (localStorage.getItem('beebek-theme') as ThemePreference) || 'system'
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (pref: ThemePreference) => {
      const resolved = pref === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : pref
      document.documentElement.setAttribute('data-theme', resolved)
      document.documentElement.setAttribute('data-theme-preference', pref)
      try {
        localStorage.setItem('beebek-theme', pref)
      } catch (err) {
        console.warn('Unable to persist theme to localStorage', err)
      }
    }

    applyTheme(preference)

    const handleSystemChange = () => {
      const currentPref = (localStorage.getItem('beebek-theme') as ThemePreference) || 'system'
      if (currentPref === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [preference])

  return (
    <div className="theme-toggle-group" role="radiogroup" aria-label="Select color theme">
      <button
        type="button"
        className={`theme-btn ${preference === 'system' ? 'is-active' : ''}`}
        onClick={() => setPreference('system')}
        role="radio"
        aria-checked={preference === 'system'}
        title="System theme (Auto)"
        aria-label="System theme"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span className="theme-btn-label">Auto</span>
      </button>

      <button
        type="button"
        className={`theme-btn ${preference === 'dark' ? 'is-active' : ''}`}
        onClick={() => setPreference('dark')}
        role="radio"
        aria-checked={preference === 'dark'}
        title="Dark theme"
        aria-label="Dark theme"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <span className="theme-btn-label">Dark</span>
      </button>

      <button
        type="button"
        className={`theme-btn ${preference === 'light' ? 'is-active' : ''}`}
        onClick={() => setPreference('light')}
        role="radio"
        aria-checked={preference === 'light'}
        title="Light theme"
        aria-label="Light theme"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <span className="theme-btn-label">Light</span>
      </button>
    </div>
  )
}
