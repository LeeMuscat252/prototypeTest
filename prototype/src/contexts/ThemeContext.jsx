import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { themes } from '../themes/themes'

const ThemeContext = createContext()

const STYLE_STORAGE_KEY = 'app-style-overrides'

export const DEFAULT_STYLE_VARIABLES = {
  '--font-body': "'Avenir Next', 'Century Gothic', 'Trebuchet MS', sans-serif",
  '--font-heading': "Georgia, Cambria, 'Times New Roman', serif",
  '--font-ui': "'Avenir Next', 'Century Gothic', 'Trebuchet MS', sans-serif",
  // Navigation / button specific defaults
  '--nav-button-border-color': 'var(--button-bg)',
  '--nav-button-border-width': '1px',
  '--nav-button-border-style': 'solid',
  '--nav-button-border-radius': '999px',
  '--nav-button-padding': '7px 12px',
  '--nav-button-bg': 'var(--card-bg)',
  '--nav-button-color': 'var(--button-bg)',
  // Accent for active nav item (e.g., underline)
  '--nav-accent': '#FFD400',
  '--nav-active-color': 'var(--button-text)',
  // Compact sizing for navigation
  '--nav-padding-vertical': '8px',
  '--nav-padding-horizontal': '6px',
  '--nav-gap': '16px',
  '--nav-font-size': '0.9rem',
  '--nav-logo-size': '48px',
  '--nav-underline-height': '3px',
  '--nav-underline-offset': '8px',
}

const readStoredStyleOverrides = () => {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const rawValue = window.localStorage.getItem(STYLE_STORAGE_KEY)
    if (!rawValue) {
      return {}
    }

    const parsed = JSON.parse(rawValue)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const getThemeStyleVariables = (themeName) => {
  const theme = themes[themeName] || themes[THEME_NAMES.SIMPLE_LIGHT]

  return {
    '--bg-primary': theme.background,
    '--bg-secondary': theme.backgroundSecondary,
    '--text-primary': theme.text,
    '--text-secondary': theme.textSecondary,
    '--nav-bg': theme.navigationBg,
    '--nav-link': theme.navigationLink,
    '--nav-border': theme.navigationBorder,
    '--button-bg': theme.buttonBg,
    '--button-text': theme.buttonText,
    '--button-hover': theme.buttonHover,
    '--card-bg': theme.cardBg,
    '--card-border': theme.cardBorder,
    '--shadow': theme.shadow,
    '--border-radius': theme.borderRadius,
    '--border-color': theme.border,
    ...DEFAULT_STYLE_VARIABLES,
  }
}

export const THEME_NAMES = {
  SIMPLE_LIGHT: 'simple-light',
  DARK: 'dark',
}

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Load theme from localStorage or default to simple-light
    return localStorage.getItem('app-theme') || THEME_NAMES.SIMPLE_LIGHT
  })
  const [styleOverrides, setStyleOverrides] = useState(() => readStoredStyleOverrides())

  const resolvedStyleVariables = useMemo(
    () => ({
      ...getThemeStyleVariables(currentTheme),
      ...styleOverrides,
    }),
    [currentTheme, styleOverrides],
  )

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('app-theme', currentTheme)
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [currentTheme])

  useEffect(() => {
    localStorage.setItem(STYLE_STORAGE_KEY, JSON.stringify(styleOverrides))
  }, [styleOverrides])

  useEffect(() => {
    const root = document.documentElement

    Object.entries(resolvedStyleVariables).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) {
        root.style.setProperty(key, value)
      } else {
        root.style.removeProperty(key)
      }
    })
  }, [resolvedStyleVariables])

  const changeTheme = (themeName) => {
    if (Object.values(THEME_NAMES).includes(themeName)) {
      setCurrentTheme(themeName)
    }
  }

  const setStyleVariable = (variableName, value) => {
    setStyleOverrides((current) => {
      const next = { ...current }

      if (value === undefined || value === null || value === '') {
        delete next[variableName]
        return next
      }

      next[variableName] = value
      return next
    })
  }

  const resetStyleVariables = () => {
    setStyleOverrides({})
  }

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        changeTheme,
        styleOverrides,
        resolvedStyleVariables,
        setStyleVariable,
        resetStyleVariables,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
