import { useState } from 'react'
import { useTheme, THEME_NAMES } from '../contexts/ThemeContext'

const COLOR_CONTROLS = [
  { key: '--bg-primary', label: 'Page background' },
  { key: '--bg-secondary', label: 'Panel background' },
  { key: '--text-primary', label: 'Primary text' },
  { key: '--text-secondary', label: 'Secondary text' },
  { key: '--nav-bg', label: 'Navigation background' },
  { key: '--nav-link', label: 'Navigation links' },
  { key: '--nav-accent', label: 'Navigation accent' },
  { key: '--nav-border', label: 'Navigation stroke' },
  { key: '--nav-active-color', label: 'Navigation active' },
  { key: '--button-bg', label: 'Button color' },
  { key: '--button-text', label: 'Button text' },
  { key: '--button-hover', label: 'Hover color' },
  { key: '--card-bg', label: 'Card background' },
  { key: '--card-border', label: 'Card stroke' },
  { key: '--border-color', label: 'General stroke' },
]

const TEXT_CONTROLS = [
  { key: '--font-body', label: 'Body font' },
  { key: '--font-heading', label: 'Heading font' },
  { key: '--font-ui', label: 'UI font' },
  { key: '--shadow', label: 'Shadow' },
  { key: '--border-radius', label: 'Border radius' },
]

const SIMPLE_FONTS = [
  "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
  "Georgia, 'Times New Roman', serif",
  "'Poppins', 'Helvetica Neue', Arial",
]

const SHADOW_PRESETS = {
  none: 'none',
  light: '0 4px 12px rgba(0,0,0,0.06)',
  medium: '0 10px 24px rgba(0,0,0,0.12)',
  heavy: '0 20px 50px rgba(0,0,0,0.18)',
}

const THEME_DISPLAY_NAMES = {
  [THEME_NAMES.SIMPLE_LIGHT]: '☀️ Light',
  [THEME_NAMES.DARK]: '🌙 Dark',
}

export default function ThemeSelectorPanel() {
  const { currentTheme, changeTheme, resolvedStyleVariables, setStyleVariable, resetStyleVariables } = useTheme()
  const [simpleMode, setSimpleMode] = useState(true)

  return (
    <div className="rail-box style-editor-panel" style={{ minHeight: '160px' }}>
      <h2 style={{ marginBottom: '10px' }}>Themes</h2>
      <div className="palette-grid">
        {Object.entries(THEME_DISPLAY_NAMES).map(([themeName, displayName]) => (
          <button
            key={themeName}
            onClick={() => changeTheme(themeName)}
            style={{
              fontWeight: currentTheme === themeName ? '700' : '600',
              background: currentTheme === themeName ? 'var(--button-bg)' : 'var(--card-bg)',
              color: currentTheme === themeName ? 'var(--button-text)' : 'var(--button-bg)',
              border: `2px solid ${currentTheme === themeName ? 'var(--button-bg)' : 'var(--border-color)'}`,
              padding: '10px 8px',
            }}
          >
            {displayName}
          </button>
        ))}
      </div>

      <div className="style-editor-section">
        <div className="style-editor-heading-row">
          <h2 style={{ marginBottom: '10px' }}>Styling</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12 }}>
              <input type="checkbox" checked={simpleMode} onChange={() => setSimpleMode((s) => !s)} /> Simple mode
            </label>
            <button type="button" className="style-reset-btn" onClick={resetStyleVariables}>
              Reset styles
            </button>
          </div>
        </div>

        {simpleMode ? (
          <div className="style-editor-group">
            <h3>Quick fonts & shadows</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <label className="style-control">
                <span>Body font</span>
                <select
                  value={resolvedStyleVariables['--font-body'] || SIMPLE_FONTS[0]}
                  onChange={(e) => setStyleVariable('--font-body', e.target.value)}
                >
                  {SIMPLE_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f.split(',')[0]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="style-control">
                <span>Heading font</span>
                <select
                  value={resolvedStyleVariables['--font-heading'] || SIMPLE_FONTS[0]}
                  onChange={(e) => setStyleVariable('--font-heading', e.target.value)}
                >
                  {SIMPLE_FONTS.map((f) => (
                    <option key={f} value={f}>
                      {f.split(',')[0]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="style-control">
                <span>Shadow preset</span>
                <select
                  value={Object.values(SHADOW_PRESETS).includes(resolvedStyleVariables['--shadow']) ? resolvedStyleVariables['--shadow'] : 'medium'}
                  onChange={(e) => setStyleVariable('--shadow', e.target.value)}
                >
                  <option value={SHADOW_PRESETS.none}>None</option>
                  <option value={SHADOW_PRESETS.light}>Light</option>
                  <option value={SHADOW_PRESETS.medium}>Medium</option>
                  <option value={SHADOW_PRESETS.heavy}>Heavy</option>
                </select>
              </label>

              <label className="style-control">
                <span>Shadow intensity</span>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={parseInt((resolvedStyleVariables['--shadow-strength'] || '12'), 10)}
                  onChange={(e) => setStyleVariable('--shadow-strength', e.target.value)}
                />
              </label>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Tip: toggle simple mode off for advanced controls.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="style-editor-group">
              <h3>Colors</h3>
              <div className="style-control-grid">
                {COLOR_CONTROLS.map((control) => (
                  <label key={control.key} className="style-control">
                    <span>{control.label}</span>
                    <input
                      type="color"
                      value={resolvedStyleVariables[control.key] || '#000000'}
                      onChange={(event) => setStyleVariable(control.key, event.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="style-editor-group">
              <h3>Fonts and effects</h3>
              <div className="style-control-grid text-controls">
                {TEXT_CONTROLS.map((control) => (
                  <label key={control.key} className="style-control">
                    <span>{control.label}</span>
                    <input
                      type="text"
                      value={resolvedStyleVariables[control.key] || ''}
                      onChange={(event) => setStyleVariable(control.key, event.target.value)}
                      placeholder={
                        control.key === '--shadow'
                          ? '0 12px 30px rgba(0, 0, 0, 0.08)'
                          : control.key === '--border-radius'
                            ? '12px'
                            : "'Avenir Next', sans-serif"
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
