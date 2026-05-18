import { SECTION_TYPES } from '../constants/sections'
import { normalizeNavigationHrefForExport, normalizeNavigationLinks } from '../navigationUtils'
import {
  getEnabledFooterSocialLinks,
  getFooterSocialGlyph,
  normalizeFooterLinkGroups,
} from './footerUtils'
import { getNestedImageWidth, getNestedTextWidth } from './layoutFactories'
import { themes } from '../themes/themes'
import { DEFAULT_STYLE_VARIABLES, THEME_NAMES } from '../contexts/ThemeContext'

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const styleObjectToString = (style = {}) =>
  Object.entries(style)
    .filter(([key, value]) => {
      if (
        key === 'hover' ||
        key === 'gradientType' ||
        key === 'gradientStops' ||
        key === 'gradientAngle' ||
        value == null ||
        value === ''
      ) {
        return false
      }

      return true
    })
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
      return `${cssKey}:${String(value)};`
    })
    .join(' ')

const imagePositionToJustify = (position) => {
  if (position === 'left') return 'flex-start'
  if (position === 'right') return 'flex-end'
  return 'center'
}

const buildCarouselMarkup = ({
  carouselId,
  images,
  height,
  align = 'center',
  showCaptions = true,
  autoplay = false,
  interval = 4000,
  loop = true,
  wrapperStyle = '',
}) => {
  const slideMarkup = images
    .map(
      (image) => `
        <figure class="carousel-slide">
          <img src="${escapeHtml(image.src || '')}" alt="${escapeHtml(image.alt || '')}" />
          ${showCaptions === false ? '' : `<figcaption>${escapeHtml(image.caption || '')}</figcaption>`}
        </figure>`,
    )
    .join('')

  const indicatorMarkup = images
    .map(
      (_, index) =>
        `<button type="button" class="carousel-indicator ${index === 0 ? 'active' : ''}" data-carousel-action="go" data-carousel-index="${index}" aria-label="Show slide ${index + 1}" aria-pressed="${index === 0}"></button>`,
    )
    .join('')

  const carouselAttributes = [
    'data-carousel="true"',
    `data-carousel-id="${escapeHtml(carouselId)}"`,
    `data-autoplay="${autoplay ? 'true' : 'false'}"`,
    `data-interval="${Number(interval) || 4000}"`,
    `data-loop="${loop ? 'true' : 'false'}"`,
  ].join(' ')

  return `
  <div class="carousel-export" ${carouselAttributes}>
    <div class="carousel-preview align-${align}" style="height:${height || 320}px;${wrapperStyle ? ` ${wrapperStyle}` : ''}">
      <div class="carousel-viewport">
        <div class="carousel-track">${slideMarkup}
        </div>
      </div>
      <div class="carousel-footer">
        <div class="carousel-controls">
          <button type="button" class="carousel-control-btn" data-carousel-action="prev" aria-label="Previous slide">Previous</button>
          <button type="button" class="carousel-control-btn" data-carousel-action="next" aria-label="Next slide">Next</button>
        </div>
        <div class="carousel-indicators" aria-label="Carousel slides">
          ${indicatorMarkup}
        </div>
      </div>
    </div>
  </div>`
}

const getThemeCssVariables = (themeName = THEME_NAMES.SIMPLE_LIGHT, styleOverrides = {}) => {
  const theme = themes[themeName] || themes[THEME_NAMES.SIMPLE_LIGHT]
  const resolvedVariables = {
    '--bg-primary': theme.background,
    '--bg-secondary': theme.backgroundSecondary,
    '--text-primary': theme.text,
    '--text-secondary': theme.textSecondary,
    '--nav-bg': theme.navigationBg,
    '--nav-accent': theme.navigationAccent || theme.buttonBg,
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
    ...styleOverrides,
  }

  return `
    :root {
${Object.entries(resolvedVariables)
  .map(([key, value]) => `      ${key}: ${String(value).replaceAll('\n', ' ')};`)
  .join('\n')}
    }
  `
}

const buildDocumentStyleSheet = ({
  sections,
  floatingButtons,
  floatingTexts,
  floatingImages,
  floatingCarousels,
  currentTheme,
  styleOverrides,
}) => {
  const sectionTypes = new Set((sections || []).map((section) => section.type))
  const hasSectionType = (type) => sectionTypes.has(type)
  const hasFloatingButtons = (floatingButtons || []).length > 0
  const hasFloatingTexts = (floatingTexts || []).length > 0
  const hasFloatingImages = (floatingImages || []).length > 0
  const hasFloatingCarousels = (floatingCarousels || []).length > 0
  const hasButtonStyles = hasSectionType(SECTION_TYPES.BUTTON) || hasFloatingButtons
  const hasCarouselStyles = hasSectionType(SECTION_TYPES.CAROUSEL) || hasFloatingCarousels

  const blocks = [
    `    * { box-sizing: border-box; }
    body { margin: 0; font-family: var(--font-body); color: var(--text-primary); background: var(--bg-primary); transition: background-color 0.3s ease, color 0.3s ease; }
    main { width: 100%; margin: 0; padding: 0; }
    .preview-canvas { position: relative; background: var(--bg-primary); width: 100%; }
    .section { border: none; border-radius: 0; background: var(--card-bg); padding: 0; margin: 0; position: relative; transition: background-color 0.3s ease, border-color 0.3s ease; width: 100%; box-shadow: none; }
    /* remove any gap or top border between consecutive sections */
    .section + .section { margin-top: 0; border-top: none; }`,
  ]

  if (hasSectionType(SECTION_TYPES.HEADER) || hasSectionType(SECTION_TYPES.BLOCK)) {
    blocks.push(
      `    .section h1, .section h3, .section h4 { margin: 24px 0 6px; color: var(--text-primary); font-family: var(--font-heading); }`,
    )
  }

  if (hasSectionType(SECTION_TYPES.HEADER)) {
    blocks.push(
      `    .section-header { display: grid; align-content: center; min-height: 320px; text-align: center; background: linear-gradient(135deg, rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.96) 55%, rgba(0, 0, 0, 0.02)); border: none; padding: 0; background-repeat: no-repeat; background-size: cover; background-position: center top; }
    .section-header h1 { margin: 0; font-size: clamp(2.5rem, 6vw, 5rem); line-height: 1.02; letter-spacing: -0.04em; color: var(--text-primary); padding: 0 40px; }`,
    )
  }

  if (hasSectionType(SECTION_TYPES.TEXT)) {
    blocks.push(
      `    .section-text { border-left: 4px solid #111111; background: linear-gradient(180deg, rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.98)); padding: 24px 24px 24px 40px; }
    .section-text p { margin: 0; line-height: 1.5; max-width: 70ch; font-size: 1.02rem; color: var(--text-primary); }`,
    )
  }

  if (hasSectionType(SECTION_TYPES.IMAGE)) {
    blocks.push(
      `    .section-image { background: linear-gradient(180deg, rgba(0, 0, 0, 0.02), var(--card-bg) 55%, rgba(0, 0, 0, 0.02)); border: none; padding: 24px; }
    .section figure { margin: 24px 0 0; }
    .image-figure { margin: 24px 0 0; display: grid; gap: 6px; }
    .image-figure.position-left { justify-items: start; }
    .image-figure.position-center { justify-items: center; }
    .image-figure.position-right { justify-items: end; }
    .section-image img { display: block; border-radius: 0; object-fit: cover; max-height: 100%; margin: 0; border: none; box-shadow: none; }
    .section-image figcaption { margin: 0; line-height: 1.5; color: var(--text-primary); }`,
    )
  }

  if (hasCarouselStyles) {
    blocks.push(
      `    .section-carousel { padding: 0; background: linear-gradient(180deg, rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.97)); border: none; }
    .section-carousel .carousel-preview { border-radius: 0; border: none; background: var(--bg-secondary); }
    /* remove border/shadow from carousel in exported HTML so hero sections don't show framed box */
    .carousel-preview { display: flex; flex-direction: column; width: 100%; height: 100%; border: none; border-radius: 0; background: var(--card-bg); overflow: hidden; box-shadow: none; }
    .carousel-viewport { flex: 1; overflow: hidden; }
    .carousel-track { display: grid; grid-auto-flow: column; grid-auto-columns: 100%; height: 100%; transition: transform 0.3s ease; }
    .carousel-slide { margin: 0; display: grid; padding: 0; gap: 0; height: 100%; align-content: stretch; }
    .carousel-slide img { width: 100%; height: 100%; object-fit: cover; border-radius: 0; display: block; }
    .carousel-footer { padding: 10px 12px 12px; display: grid; gap: 10px; }
    .carousel-controls { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; }
    .carousel-control-btn { border: 1px solid var(--button-bg); background: var(--card-bg); color: var(--button-bg); border-radius: 6px; padding: 6px 12px; font-weight: 600; }
    .carousel-indicators { display: flex; justify-content: center; gap: 6px; flex-wrap: wrap; }
    .carousel-indicator { width: 10px; height: 10px; padding: 0; border-radius: 50%; border: 1px solid var(--button-bg); background: transparent; }
    .carousel-indicator.active { background: var(--button-bg); }`,
    )
  }

  if (hasButtonStyles) {
    blocks.push(
      `    .section-button { text-align: center; background: linear-gradient(180deg, rgba(0, 0, 0, 0.04), var(--card-bg)); border: none; padding: 24px; }
    .section-button .button-positioner { display: inline-flex; }
    .preview-button { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; background: var(--button-bg); color: var(--button-text); border: 1px solid var(--button-bg); border-radius: 999px; padding: 7px 12px; font-weight: 600; box-sizing: border-box; transition: background-color 0.2s ease, color 0.2s ease; }
    .button-positioner .preview-button { margin-top: 0; }
    .preview-button:hover { background: var(--button-hover); }`,
    )
  }

  if (hasSectionType(SECTION_TYPES.NAVIGATION)) {
    blocks.push(
      `    .nav-layout { /* Navigation defaults (fallbacks) */ --nav-accent: #FFD400; --nav-active-color: var(--button-text, #ffffff); --nav-border: transparent; --nav-logo-size: 80px; display: grid; grid-template-columns: var(--nav-logo-size, 80px) minmax(0, 1fr) var(--nav-logo-size, 80px); align-items: center; justify-content: initial; gap: var(--nav-gap, 16px); width: 100%; padding: var(--nav-padding-vertical, 8px) var(--nav-padding-horizontal, 18px); background: var(--nav-bg, transparent); color: var(--nav-link); }
    /* nav outline removed (debug) */
    .nav-center { min-width: 0; display: grid; justify-items: center; gap: 4px; text-align: center; color: var(--text-primary); font-family: var(--font-ui); }
    .preview-links { display:flex; gap:var(--nav-gap, 16px); align-items:center; justify-content:center; color:var(--nav-link); }
    .preview-links.nav-align-left { justify-content:flex-start; }
    .preview-links.nav-align-center { justify-content:center; }
    .preview-links.nav-align-right { justify-content:flex-end; }
    .nav-logo-circle { width: var(--nav-logo-size, 48px); height: var(--nav-logo-size, 48px); border: 2px solid var(--nav-link); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; background: var(--card-bg); transition: border-color 0.3s ease, background-color 0.3s ease; }
    .nav-logo-circle img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .nav-logo-empty { background: var(--bg-secondary); }
    .nav-logo-hidden { visibility: hidden; pointer-events: none; }
    .nav-logo-circle.has-logo { padding: 0; }
    /* remove navigation background in exported HTML so no divider line appears between sections */
    .section-navigation { background: transparent; border: none; padding: 0; box-shadow: none; }
    .nav-link-button { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; background: transparent; border: none; color: var(--nav-link); padding: var(--nav-padding-vertical, 8px) var(--nav-padding-horizontal, 6px); text-transform: uppercase; font-weight:700; letter-spacing:0.04em; font-size:var(--nav-font-size,0.95rem); position:relative; }
    .nav-link-button::after{ content: ''; position: absolute; left: 10%; right: 10%; bottom: calc(-1 * var(--nav-underline-offset,8px)); height:var(--nav-underline-height,3px); background: transparent; border-radius:3px; transition:background-color 160ms ease, transform 160ms ease; transform-origin:center; }
    .nav-link-button:hover::after{ background: var(--nav-accent); }
    .nav-link-button.active, .nav-link-button[aria-pressed='true']{ color: var(--nav-active-color); box-shadow: inset 0 -3px 0 var(--nav-accent); }
    .nav-link-button.active::after, .nav-link-button[aria-pressed='true']::after{ background: var(--nav-accent); transform: scaleX(1); }`,
    )
  }

  if (hasSectionType(SECTION_TYPES.FOOTER)) {
    blocks.push(
      `    .section-footer { background: var(--card-bg); border: none; padding: 36px 24px; }
    .footer-layout { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(280px, 1fr); gap: 24px; align-items: start; text-align: left; }
    .footer-layout.footer-align-center { justify-items: center; }
    .footer-layout.footer-align-right { justify-items: end; }
    .footer-brand, .footer-links-column, .footer-social-column { display: grid; gap: 10px; }
    .footer-brand strong, .footer-social-column strong { display: block; font-size: 1.05rem; font-family: var(--font-heading); }
    .footer-brand p { margin: 0; line-height: 1.6; color: var(--text-secondary); }
    .footer-link-group { display: grid; gap: 8px; }
    .footer-link-group strong { display: block; font-size: 0.98rem; }
    .footer-link-list { display: grid; gap: 8px; }
    .footer-inline-link { color: var(--nav-link); text-decoration: none; }
    .footer-inline-link:hover { text-decoration: underline; color: var(--button-hover); }
    .footer-social-list { display: flex; flex-wrap: wrap; gap: 10px; }
    .footer-social-link { display: inline-flex; align-items: center; gap: 8px; text-decoration: none; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-primary); border-radius: 999px; padding: 8px 12px; font-weight: 600; transition: transform 0.15s ease, border-color 0.2s ease, background-color 0.2s ease; box-shadow: 0 10px 24px var(--shadow); }
    .footer-social-link:hover { transform: translateY(-1px); border-color: var(--button-bg); }
    .footer-social-icon { width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #fff; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
    .footer-social-icon.facebook { background: #1877f2; }
    .footer-social-icon.instagram { background: linear-gradient(135deg, #f58529 0%, #dd2a7b 48%, #8134af 100%); }
    .footer-social-icon.tiktok { background: #111111; }
    .footer-social-icon.x { background: #111111; }
    .footer-social-icon.youtube { background: #ff0033; }
    .footer-social-icon.pinterest { background: #e60023; }
    .footer-empty-state { margin: 0; color: var(--text-secondary); }`,
    )
  }

  if (hasFloatingButtons) {
    blocks.push(
      `    .floating-button { display: inline-flex; position: absolute; z-index: 20; text-decoration: none; background: var(--button-bg); color: var(--button-text); border-radius: 0; padding: 8px 14px; font-weight: 600; transition: background-color 0.2s ease, color 0.2s ease; }
    .floating-button:hover { background: var(--button-hover); }`,
    )
  }

  if (hasFloatingTexts) {
    blocks.push(
      `    .floating-text { position: absolute; z-index: 20; border: 1px solid var(--border-color); border-radius: 0; background: var(--card-bg); padding: 10px 12px; transition: background-color 0.3s ease, border-color 0.3s ease; box-shadow: 0 12px 28px var(--shadow); }
    .floating-text p { margin: 0; line-height: 1.45; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--text-primary); }`,
    )
  }

  if (hasFloatingImages) {
    blocks.push(
      `    .floating-image { position: absolute; z-index: 20; margin: 0; }
    .floating-image figcaption { margin: 6px 0 0; color: var(--text-primary); }`,
    )
  }

  if (hasFloatingCarousels) {
    blocks.push(`    .floating-carousel-box { z-index: 20; }`)
  }

  return [getThemeCssVariables(currentTheme, styleOverrides), ...blocks].join('\n')
}

const buildDocumentScript = ({ sections, floatingCarousels }) => {
  const hasCarouselStyles =
    (sections || []).some((section) => section.type === SECTION_TYPES.CAROUSEL) ||
    (floatingCarousels || []).length > 0

  if (!hasCarouselStyles) {
    return ''
  }

  return `
  <script>
    (() => {
      const carousels = Array.from(document.querySelectorAll('[data-carousel="true"]'))

      carousels.forEach((carousel) => {
        const track = carousel.querySelector('.carousel-track')
        const slides = Array.from(carousel.querySelectorAll('.carousel-slide'))
        const prevBtn = carousel.querySelector('[data-carousel-action="prev"]')
        const nextBtn = carousel.querySelector('[data-carousel-action="next"]')
        const indicators = Array.from(carousel.querySelectorAll('[data-carousel-action="go"]'))
        const loop = carousel.dataset.loop !== 'false'
        const autoplay = carousel.dataset.autoplay === 'true' && slides.length > 1
        const interval = Math.max(1000, Number(carousel.dataset.interval) || 4000)
        let activeIndex = 0
        let timer = null

        const render = () => {
          if (!track || slides.length === 0) return
          track.style.transform = 'translateX(-' + (activeIndex * 100) + '%)'
          indicators.forEach((indicator, index) => {
            const isActive = index === activeIndex
            indicator.classList.toggle('active', isActive)
            indicator.setAttribute('aria-pressed', String(isActive))
          })
        }

        const goTo = (nextIndex) => {
          if (slides.length === 0) return
          if (loop) {
            activeIndex = (nextIndex + slides.length) % slides.length
          } else {
            activeIndex = Math.max(0, Math.min(slides.length - 1, nextIndex))
          }
          render()
        }

        const startAutoplay = () => {
          if (!autoplay || timer) return
          timer = window.setInterval(() => {
            goTo(activeIndex + 1)
          }, interval)
        }

        const stopAutoplay = () => {
          if (timer) {
            window.clearInterval(timer)
            timer = null
          }
        }

        prevBtn?.addEventListener('click', () => goTo(activeIndex - 1))
        nextBtn?.addEventListener('click', () => goTo(activeIndex + 1))
        indicators.forEach((indicator) => {
          indicator.addEventListener('click', () => {
            goTo(Number(indicator.dataset.carouselIndex) || 0)
          })
        })

        carousel.addEventListener('mouseenter', stopAutoplay)
        carousel.addEventListener('mouseleave', startAutoplay)

        render()
        startAutoplay()
      })
    })()
  </script>`
}

export const buildHtmlDocument = (
  sections,
  pageTitle,
  floatingButtons = [],
  floatingTexts = [],
  floatingImages = [],
  floatingCarousels = [],
  currentTheme = THEME_NAMES.SIMPLE_LIGHT,
  styleOverrides = {},
) => {
  const documentStyles = buildDocumentStyleSheet({
    sections,
    floatingButtons,
    floatingTexts,
    floatingImages,
    floatingCarousels,
    currentTheme,
    styleOverrides,
  })
  const documentScript = buildDocumentScript({ sections, floatingCarousels })

  const sectionMarkup = (sections || [])
    .map((section) => {
      // Map some section style keys to CSS variables for exported HTML
      const rawStyleObj = { ...(section.style || {}) }

      const mapToCssVar = (props, varName) => {
        for (const p of props) {
          if (rawStyleObj[p] !== undefined) {
            rawStyleObj[varName] = rawStyleObj[p]
            delete rawStyleObj[p]
            break
          }
        }
      }

      mapToCssVar(['navAccent', 'nav-accent', 'accent'], '--nav-accent')
      // Only map a section's background into --nav-bg when this section is a NAVIGATION section
      if (section.type === SECTION_TYPES.NAVIGATION) {
        mapToCssVar(['navBg', 'nav-bg', 'navBackground', 'background'], '--nav-bg')
      }
      mapToCssVar(['navActiveColor', 'nav-active-color', 'activeColor', 'navActive'], '--nav-active-color')
      mapToCssVar(['navBorder', 'nav-border', 'borderColor', 'border'], '--nav-border')
      mapToCssVar(['navUnderlineHeight', 'nav-underline-height'], '--nav-underline-height')
      mapToCssVar(['navUnderlineOffset', 'nav-underline-offset'], '--nav-underline-offset')

      const sectionStyle = [
        section.align ? `text-align:${section.align};` : '',
        section.type === SECTION_TYPES.NAVIGATION ? '' : section.height ? `min-height:${section.height}px;` : '',
        styleObjectToString(rawStyleObj),
      ]
        .filter(Boolean)
        .join(' ')

      const sectionStyleAttr = sectionStyle ? ` style="${sectionStyle}"` : ''

      if (section.type === SECTION_TYPES.HEADER) {
        return `
  <section class="section section-header"${sectionStyleAttr}>
    <h1>${escapeHtml(section.title || '')}</h1>
  </section>`
      }

      if (section.type === SECTION_TYPES.TEXT) {
        return `
  <section class="section section-text"${sectionStyleAttr}>
    <p>${escapeHtml(section.text || '')}</p>
  </section>`
      }

      if (section.type === SECTION_TYPES.IMAGE) {
        const imageStyle = [
          section.width ? `width:${section.width}%;` : '',
          section.height ? `height:${section.height}px; object-fit: cover;` : '',
          `transform: translateX(${section.offsetX || 0}px);`,
        ].join(' ')
        const imageJustify = imagePositionToJustify(section.position)

        return `
  <section class="section section-image"${sectionStyleAttr}>
    <figure class="image-figure position-${section.position || 'center'}">
      <div style="display:flex; justify-content:${imageJustify}; width:100%;">
        <img style="${imageStyle}" src="${escapeHtml(section.src || '')}" alt="${escapeHtml(section.alt || '')}" />
      </div>
      <figcaption>${escapeHtml(section.caption || '')}</figcaption>
    </figure>
  </section>`
      }

      if (section.type === SECTION_TYPES.CAROUSEL) {
        const carouselImages = Array.isArray(section.images) ? section.images.filter(Boolean) : []

        return `
  <section class="section section-carousel"${sectionStyleAttr}>
    ${buildCarouselMarkup({
      carouselId: section.id,
      images: carouselImages,
      height: section.height || 320,
      align: section.align || 'center',
      showCaptions: section.showCaptions !== false,
      autoplay: section.autoplay,
      interval: section.interval,
      loop: section.loop,
    })}
  </section>`
      }

      if (section.type === SECTION_TYPES.BUTTON) {
        const buttonInlineStyle = [
          'display:inline-flex;',
          'align-items:center;',
          'justify-content:center;',
          'text-decoration:none;',
          'background:var(--button-bg);',
          'color:var(--button-text);',
          'border:1px solid var(--button-bg);',
          'border-radius:999px;',
          'padding:7px 12px;',
          'font-weight:600;',
          'box-sizing:border-box;',
        ].join(' ')

        return `
  <section class="section section-button"${sectionStyleAttr}>
    <div class="button-positioner" style="position:relative; left:${section.offsetX || 0}px; top:${section.offsetY || 0}px;">
          <a class="preview-button cta" style="${buttonInlineStyle}" href="${escapeHtml(section.href || '#')}">${escapeHtml(section.label || '')}</a>
    </div>
  </section>`
      }

      if (section.type === SECTION_TYPES.NAVIGATION) {
        const navLogoMarkup = (logo, enabled) =>
          enabled && logo?.src
            ? `<span class="nav-logo-circle"><img src="${escapeHtml(logo.src)}" alt="${escapeHtml(logo.alt || 'Logo')}" /></span>`
            : `<span class="nav-logo-circle nav-logo-hidden nav-logo-empty"></span>`

        const navAlignmentClass = `nav-align-${section.align || 'left'}`
        const navLinks = normalizeNavigationLinks(section.links)
        const navLinksMarkup = navLinks
          .map(
            (link, index) => {
              const isActive = index === 0
              return `
        <a class="nav-link-button ${isActive ? 'active' : ''}" aria-pressed="${String(isActive)}" href="${escapeHtml(normalizeNavigationHrefForExport(link.href) || '#')}">${escapeHtml(link.label || '')}</a>`
            },
          )
          .join('')

        return `
  <section class="section section-navigation"${sectionStyleAttr}>
    <nav class="nav-layout ${navAlignmentClass}">
      ${navLogoMarkup(section.logoLeft, section.logoLeftEnabled)}
      <div class="nav-center">
        <strong>${escapeHtml(section.title || 'Navigation')}</strong>
        <div class="preview-links ${navAlignmentClass}">${navLinksMarkup}
        </div>
      </div>
      ${navLogoMarkup(section.logoRight, section.logoRightEnabled)}
    </nav>
  </section>`
      }

      if (section.type === SECTION_TYPES.FOOTER) {
        const footerSocialLinks = getEnabledFooterSocialLinks(section.socialLinks)
        const footerLinkGroups = normalizeFooterLinkGroups(section.linkGroups)

        return `
  <section class="section section-footer"${sectionStyleAttr}>
    <footer class="footer-layout footer-align-${section.align || 'left'}">
      <div class="footer-brand">
        <strong>${escapeHtml(section.companyName || 'Your Company')}</strong>
        <p>${escapeHtml(
          section.companyDescription ||
            section.text ||
            'A short line about your brand, mission, or customer support.',
        )}</p>
      </div>
      <div class="footer-links-column">
        ${footerLinkGroups
          .map(
            (group) => `
        <div class="footer-link-group">
          <strong>${escapeHtml(group.title || '')}</strong>
          <div class="footer-link-list">
            ${(group.links || [])
              .map(
                (link) => `
            <a class="footer-inline-link" href="${escapeHtml(link.href || '#')}">${escapeHtml(link.label || '')}</a>`,
              )
              .join('')}
          </div>
        </div>`,
          )
          .join('')}
      </div>
      <div class="footer-social-column">
        <strong>${escapeHtml(section.socialTitle || 'Connect with us')}</strong>
        <div class="footer-social-list">
          ${footerSocialLinks
            .map(
              (link) => `
          <a class="footer-social-link ${escapeHtml(link.key || '')}" href="${escapeHtml(link.href || '#')}" target="_blank" rel="noreferrer">
            <span class="footer-social-icon ${escapeHtml(link.key || '')}" aria-hidden="true">${escapeHtml(getFooterSocialGlyph(link.key))}</span>
            <span class="footer-social-label">${escapeHtml(link.label || '')}</span>
          </a>`,
            )
            .join('') || '<p class="footer-empty-state">No social icons enabled.</p>'}
        </div>
      </div>
    </footer>
  </section>`
      }

      const nestedItemsMarkup = (section.nestedItems || [])
        .reduce((rows, item) => {
          const level = Number.isFinite(Number(item.level)) ? Number(item.level) : 0
          if (!rows[level]) {
            rows[level] = []
          }
          rows[level].push(item)
          return rows
        }, [])
        .filter(Boolean)
        .map((rowItems) => {
          const rowMarkup = rowItems
            .map((item) => {
              if (item.type === SECTION_TYPES.TEXT) {
                return `
      <div class="nested-text" style="position:relative; left:${item.offsetX || 0}px; width:${getNestedTextWidth(item.width)}px; text-align:${item.align || 'left'};">
        <p style="white-space:pre-wrap; overflow-wrap:anywhere; word-break:break-word; line-height:1.45;">${escapeHtml(item.text || '')}</p>
      </div>`
              }

              const imageStyle = [
                item.width ? `width:${getNestedImageWidth(item.width)}px;` : '',
                item.height ? `height:${item.height}px; object-fit: cover;` : '',
              ].join(' ')

              return `
      <figure class="nested-image">
        <div style="display:flex; justify-content:${imagePositionToJustify(item.position)};">
          <img style="${imageStyle}" src="${escapeHtml(item.src || '')}" alt="${escapeHtml(item.alt || '')}" />
        </div>
        <figcaption>${escapeHtml(item.caption || '')}</figcaption>
      </figure>`
            })
            .join('')

          return `
    <div class="nested-level-row">${rowMarkup}
    </div>`
        })
        .join('')

      const titleMarkup = section.title ? `    <h4>${escapeHtml(section.title || '')}</h4>` : ''
      const bodyMarkup = section.body ? `    <p>${escapeHtml(section.body || '')}</p>` : ''

      return `
  <section class="section section-block"${sectionStyleAttr}>
${titleMarkup}
${bodyMarkup}${nestedItemsMarkup}
  </section>`
    })
    .join('')

  const floatingButtonsMarkup = (floatingButtons || [])
    .map((button) => {
      return `
  <div class="button-positioner" style="position:absolute; left:${button.offsetX || 0}px; top:${button.offsetY || 0}px;">
    <a class="preview-button" href="${escapeHtml(button.href || '#')}">${escapeHtml(button.label || '')}</a>
  </div>`
    })
    .join('')

  const floatingTextsMarkup = (floatingTexts || [])
    .map((textBox) => {
      const textStyle = [
        'position:absolute;',
        `left:${textBox.offsetX || 0}px;`,
        `top:${textBox.offsetY || 0}px;`,
        `width:${textBox.width || 280}px;`,
        `text-align:${textBox.align || 'left'};`,
      ].join(' ')

      return `
  <div class="floating-text" style="${textStyle}"><p>${escapeHtml(textBox.text || '')}</p></div>`
    })
    .join('')

  const floatingImagesMarkup = (floatingImages || [])
    .map((imageBox) => {
      const imageStyle = [
        'position:absolute;',
        `left:${imageBox.offsetX || 0}px;`,
        `top:${imageBox.offsetY || 0}px;`,
        `width:${imageBox.width || 320}px;`,
      ].join(' ')

      const imgStyle = [
        'display:block;',
        'width:100%;',
        'border-radius:8px;',
        'object-fit:cover;',
        imageBox.height ? `height:${imageBox.height}px;` : '',
      ].join(' ')

      return `
  <figure class="floating-image" style="${imageStyle}"><img style="${imgStyle}" src="${escapeHtml(imageBox.src || '')}" alt="${escapeHtml(imageBox.alt || '')}" /><figcaption>${escapeHtml(imageBox.caption || '')}</figcaption></figure>`
    })
    .join('')

  const floatingCarouselsMarkup = (floatingCarousels || [])
    .map((carouselBox) => {
      const carouselImages = Array.isArray(carouselBox.images) ? carouselBox.images.filter(Boolean) : []
      const carouselStyle = [
        'position:absolute;',
        `left:${carouselBox.offsetX || 0}px;`,
        `top:${carouselBox.offsetY || 0}px;`,
        `width:${carouselBox.width || 480}px;`,
        `height:${carouselBox.height || 630}px;`,
      ].join(' ')

      return `
  <section class="floating-carousel-box" style="${carouselStyle}">
    ${buildCarouselMarkup({
      carouselId: carouselBox.id,
      images: carouselImages,
      height: carouselBox.height || 630,
      align: carouselBox.align || 'center',
      showCaptions: carouselBox.showCaptions !== false,
      autoplay: carouselBox.autoplay,
      interval: carouselBox.interval,
      loop: carouselBox.loop,
    })}
  </section>`
    })
    .join('')

  return `<!doctype html>
<html lang="en" data-theme="${currentTheme}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(pageTitle || 'Generated Prototype')}</title>
  <style>
    ${documentStyles}
  </style>
</head>
<body>
  <main>
    <div class="preview-canvas">${sectionMarkup}${floatingButtonsMarkup}${floatingTextsMarkup}${floatingImagesMarkup}${floatingCarouselsMarkup}
    </div>
  </main>
  ${documentScript}
</body>
</html>`
}

export const downloadTextFile = (filename, content, type) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export const createSafeHtmlFilename = (name) => {
  const cleaned = String(name || 'webpagebuilder')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${cleaned || 'webpagebuilder'}.html`
}

export const exportHtmlFile = ({ pageName, pageTitle, htmlPreview }) => {
  const filename = createSafeHtmlFilename(pageName || pageTitle)
  downloadTextFile(filename, htmlPreview, 'text/html')
}

export const exportLayoutFile = ({ activePageId, pages, normalizePage }) => {
  const layout = {
    activePageId,
    pages: pages.map(normalizePage),
    exportedAt: new Date().toISOString(),
  }

  downloadTextFile('webbuilder-layout.json', JSON.stringify(layout, null, 2), 'application/json')
}
