import { normalizeNavigationLinks } from '../navigationUtils'

export default function NavigationPreview({ section }) {
  const navStyle = {}

  if (section?.style) {
    if (section.style.navAccent || section.style['nav-accent']) {
      navStyle['--nav-accent'] = section.style.navAccent || section.style['nav-accent']
    }
    if (section.style.navActiveColor || section.style['nav-active-color']) {
      navStyle['--nav-active-color'] = section.style.navActiveColor || section.style['nav-active-color']
    }
    if (section.style.navBorder || section.style['nav-border']) {
      navStyle['--nav-border'] = section.style.navBorder || section.style['nav-border']
    }
    if (section.style.background) {
      navStyle['--nav-bg'] = section.style.background
    }
    if (section.style.color) {
      navStyle['--nav-link'] = section.style.color
    }
  }
  // If left logo is present, increase logo size slightly and ensure alignment
  if (section?.logoLeftEnabled && section?.logoLeft?.src) {
    navStyle['--nav-logo-size'] = section.style?.navLogoSize || '80px'
  }

  return (
    <nav style={navStyle} className={`nav-layout nav-align-${section.align || 'left'}`}>
      <span className={`nav-logo-circle ${section.logoLeftEnabled ? '' : 'nav-logo-hidden'} ${section.logoLeft?.src ? 'has-logo' : 'nav-logo-empty'}`}>
        {section.logoLeftEnabled && section.logoLeft?.src ? <img src={section.logoLeft.src} alt={section.logoLeft.alt || 'Logo'} /> : null}
      </span>
        <div className="nav-center">
        <strong>{section.title}</strong>
        <div className={`preview-links nav-align-${section.align || 'left'}`}>
          {normalizeNavigationLinks(section.links).map((link, idx) => (
            <button
              key={link.id}
              type="button"
              className={`nav-link-button ${idx === 0 ? 'active' : ''}`}
              onClick={(event) => event.preventDefault()}
              data-href={link.href || '#'}
              aria-pressed={idx === 0}
            >
              {/* optional icon placeholder */}
              {link.icon ? <span className="nav-link-icon">{link.icon}</span> : null}
              <span className="nav-link-label">{link.label}</span>
            </button>
          ))}
        </div>
      </div>
      <span className={`nav-logo-circle ${section.logoRightEnabled ? '' : 'nav-logo-hidden'} ${section.logoRight?.src ? 'has-logo' : 'nav-logo-empty'}`}>
        {section.logoRightEnabled && section.logoRight?.src ? <img src={section.logoRight.src} alt={section.logoRight.alt || 'Logo'} /> : null}
      </span>
    </nav>
  )
}
