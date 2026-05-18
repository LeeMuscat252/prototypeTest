import { useEffect } from 'react'
import CarouselPreview from './CarouselPreview'
import NavigationPreview from './NavigationPreview'
import { getEnabledFooterSocialLinks, getFooterSocialGlyph, normalizeFooterLinkGroups } from '../utils/footerUtils'

export default function PreviewStage({
  isEditorCollapsed,
  setIsEditorCollapsed,
  onDragEnd,
  dropIndex,
  onDropZoneEnter,
  onDropZoneDrop,
  onSectionDragStart,
  sections,
  activeSectionId,
  setActiveSectionId,
  setActiveFloatingButtonId,
  setActiveFloatingTextId,
  setActiveFloatingImageId,
  setActiveCarouselImageId,
  resizingSectionId,
  startResize,
  sectionTypes,
  draggingImage,
  startImageDrag,
  resizingImage,
  startImageResize,
  onBlockImageDrop,
  setDropIndex,
  groupNestedItemsByLevel,
  activeNestedItemId,
  setActiveNestedItemId,
  startNestedItemDrag,
  getNestedImageWidth,
  getNestedTextWidth,
  draggingButton,
  startButtonDrag,
  floatingButtons,
  floatingTexts,
  floatingImages,
  draggingFloatingText,
  draggingFloatingImage,
  startFloatingTextDrag,
  startFloatingImageDrag,
  resizingFloatingImage,
  startFloatingImageResize,
  floatingCarousels,
  draggingFloatingCarousel,
  startFloatingCarouselDrag,
  resizingFloatingCarousel,
  startFloatingCarouselResize,
  activeFloatingCarouselId,
  setActiveFloatingCarouselId,
  setActiveFloatingCarouselImageId,
}) {
  useEffect(() => {
    // Build hover CSS for sections and floating items that have hover styles
    let css = ''

    sections.forEach((section) => {
      const s = section.style || {}
      // nav link hover
      if (s.navLinkHover) {
        const bg = s.navLinkHover.background || ''
        const color = s.navLinkHover.color || ''
        css += `[data-section-id="${section.id}"] .nav-link-button:hover { ${bg ? `background:${bg};` : ''} ${color ? `color:${color};` : ''} }\n`
      }

      // generic hover for preview buttons inside sections
      if (s.hover) {
        const bg = s.hover.background || ''
        const color = s.hover.color || ''
        css += `[data-section-id="${section.id}"] .preview-button:hover { ${bg ? `background:${bg};` : ''} ${color ? `color:${color};` : ''} }\n`
      }

      // nested items hover
      ;(section.nestedItems || []).forEach((item) => {
        if (item.style && item.style.hover) {
          const bg = item.style.hover.background || ''
          const color = item.style.hover.color || ''
          css += `[data-section-id="${section.id}"] [data-nested-item-id="${item.id}"]:hover { ${bg ? `background:${bg};` : ''} ${color ? `color:${color};` : ''} }\n`
        }
      })
    })

    floatingButtons.forEach((b) => {
      if (b.style && b.style.hover) {
        const bg = b.style.hover.background || ''
        const color = b.style.hover.color || ''
        css += `[data-floating-button-id="${b.id}"] .preview-button:hover { ${bg ? `background:${bg};` : ''} ${color ? `color:${color};` : ''} }\n`
      }
    })

    floatingImages.forEach((img) => {
      if (img.style && img.style.hover) {
        const bg = img.style.hover.background || ''
        const color = img.style.hover.color || ''
        css += `[data-floating-image-id="${img.id}"]:hover img { ${bg ? `background:${bg};` : ''} ${color ? `color:${color};` : ''} }\n`
      }
    })

    // Inject or update style tag
    const STYLE_ID = 'per-component-hover-styles'
    let styleEl = document.getElementById(STYLE_ID)
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = STYLE_ID
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = css
  }, [sections, floatingButtons, floatingImages])

  // Document-level pointerup capture to force-select preview sections when
  // pointer events are swallowed by pointer capture/drag handlers. This runs
  // in capture phase so it detects the event even if children call
  // stopPropagation().
  useEffect(() => {
    const handler = (e) => {
      try {
        const previewRoot = document.querySelector('.preview-canvas')
        if (!previewRoot) return
        if (!previewRoot.contains(e.target)) return

        const sectionEl = e.target.closest && e.target.closest('[data-section-id]')
        if (sectionEl) {
          const id = sectionEl.getAttribute('data-section-id')
          if (id) {
            // if already active, do nothing
            if (id === activeSectionId) return
            console.log('PreviewStage (capture): forced select', id)
            setActiveSectionId(id)
            setActiveNestedItemId(null)
            setActiveFloatingButtonId(null)
            setActiveFloatingTextId(null)
            setActiveFloatingImageId(null)
            setActiveCarouselImageId(null)
            setActiveFloatingCarouselId(null)
            setActiveFloatingCarouselImageId(null)
            setIsEditorCollapsed(false)
          }
        }
      } catch (err) {
        /* ignore */
      }
    }

    document.addEventListener('pointerup', handler, true)
    return () => document.removeEventListener('pointerup', handler, true)
  }, [activeSectionId, setActiveSectionId, setActiveNestedItemId, setActiveFloatingButtonId, setActiveFloatingTextId, setActiveFloatingImageId, setActiveCarouselImageId, setActiveFloatingCarouselId, setActiveFloatingCarouselImageId, setIsEditorCollapsed])

  // Fallback selection helper: sometimes pointer events prevent clicks reaching
  // higher-level handlers, so ensure pointerup sets the active section reliably.
  const selectSection = (sectionId, opts = {}) => {
    if (!sectionId) return
    console.log('PreviewStage: selectSection', sectionId, opts)
    setActiveSectionId(sectionId)
    if (opts.nestedItemId) setActiveNestedItemId(opts.nestedItemId)
    setActiveFloatingButtonId(null)
    setActiveFloatingTextId(null)
    setActiveFloatingImageId(null)
    setActiveCarouselImageId(opts.carouselImageId ?? null)
    setActiveFloatingCarouselId(null)
    setActiveFloatingCarouselImageId(null)
    setIsEditorCollapsed(false)
  }
  return (
    <section className="frame-stage" onDragEnd={onDragEnd}>
      <div className="preview-header">
        <h2>Live preview</h2>
      </div>
      <div className="preview-canvas">
        <div
          className={`preview-drop-zone ${dropIndex === 0 ? 'active' : ''}`}
          onDragOver={(event) => onDropZoneEnter(event, 0)}
          onDrop={(event) => onDropZoneDrop(event, 0)}
        >
          {sections.length === 0 ? 'Drop components here' : 'Drop here'}
        </div>

        {sections.map((section, index) => {
          const isActive = section.id === activeSectionId

          return (
            <div key={section.id}>
              <article
                data-section-id={section.id}
                className={`preview-section preview-block ${section.type} ${isActive ? 'active' : ''} ${resizingSectionId === section.id ? 'resizing' : ''}`}
                draggable
                onDragStart={(event) => onSectionDragStart(event, section.id)}
                onClick={() => {
                  setActiveSectionId(section.id)
                  setActiveFloatingButtonId(null)
                  setActiveFloatingTextId(null)
                  setActiveFloatingImageId(null)
                  setActiveCarouselImageId(
                    section.type === sectionTypes.CAROUSEL ? section.images?.[0]?.id ?? null : null,
                  )
                  setActiveFloatingCarouselId(null)
                  setActiveFloatingCarouselImageId(null)
                  setIsEditorCollapsed(false)
                }}
                style={(() => {
                  // Build inline style for the article while mapping some section style properties
                  // to CSS variables for better control of component-scoped theming.
                  const inlineStyle = {
                    minHeight: section.height ? `${section.height}px` : undefined,
                    textAlign: section.align || 'left',
                  }

                  const sectionStyle = section.style ? { ...section.style } : {}

                  // If this is a navigation section, map common keys to nav CSS variables
                  if (section.type === sectionTypes.NAVIGATION) {
                    if (sectionStyle.background) {
                      inlineStyle['--nav-bg'] = sectionStyle.background
                      delete sectionStyle.background
                    }
                    if (sectionStyle.color) {
                      inlineStyle['--nav-link'] = sectionStyle.color
                      delete sectionStyle.color
                    }

                    const mapToVar = (props, varName) => {
                      for (const p of props) {
                        if (sectionStyle[p] !== undefined) {
                          inlineStyle[varName] = sectionStyle[p]
                          delete sectionStyle[p]
                          break
                        }
                      }
                    }

                    mapToVar(['navAccent', 'nav-accent', 'accent'], '--nav-accent')
                    mapToVar(['navActiveColor', 'nav-active-color', 'activeColor', 'navActive'], '--nav-active-color')
                    mapToVar(['navBorder', 'nav-border', 'borderColor', 'border'], '--nav-border')
                    mapToVar(['navUnderlineHeight', 'nav-underline-height'], '--nav-underline-height')
                    mapToVar(['navUnderlineOffset', 'nav-underline-offset'], '--nav-underline-offset')
                  }

                  // Preserve any remaining section-level inline properties
                  return { ...inlineStyle, ...(sectionStyle || {}) }
                })()}
                onMouseMove={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  const distFromTop = event.clientY - rect.top
                  const distFromBottom = rect.bottom - event.clientY
                  const edgeThreshold = 12

                  if (distFromTop < edgeThreshold || distFromBottom < edgeThreshold) {
                    event.currentTarget.style.cursor = 'ns-resize'
                  } else {
                    event.currentTarget.style.cursor = 'default'
                  }
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.cursor = 'default'
                }}
                onPointerDown={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  const distFromTop = event.clientY - rect.top
                  const distFromBottom = rect.bottom - event.clientY
                  const edgeThreshold = 12

                  if (distFromTop < edgeThreshold || distFromBottom < edgeThreshold) {
                    startResize(event, section.id, section.height)
                  }
                }}
              >
                {isActive ? (
                  <div className="selected-badge">Selected</div>
                ) : null}
                {section.type === sectionTypes.HEADER && (
                  <h1>{section.title}</h1>
                )}
                {section.type === sectionTypes.TEXT && <p>{section.text}</p>}
                {section.type === sectionTypes.IMAGE && (
                  <figure
                    className={`image-figure position-${section.position || 'center'}`}
                    onPointerDown={() => selectSection(section.id)}
                    onClick={() => selectSection(section.id)}
                  >
                    <div
                      className={`image-frame ${
                        draggingImage?.sectionId === section.id && !draggingImage?.isNested
                          ? 'active'
                          : ''
                      }`}
                    >
                      <img
                        src={section.src}
                        alt={section.alt}
                        draggable={false}
                        onDragStart={(event) => event.preventDefault()}
                        onPointerDown={(event) =>
                          startImageDrag(event, section.id, section.offsetX || 0, false)
                        }
                        style={{
                          width: section.width ? `${section.width}%` : undefined,
                          height: section.height ? `${section.height}px` : undefined,
                          objectFit: 'cover',
                          transform: `translateX(${section.offsetX || 0}px)`,
                          cursor: 'grab',
                        }}
                      />
                      <div
                        className={`image-resize-frame ${resizingImage?.sectionId === section.id && !resizingImage?.isNested ? 'active' : ''}`}
                      >
                        <span
                          className="image-resize-handle left"
                          onPointerDown={(event) =>
                            startImageResize(event, section.id, section.width || 100, 'left', false)
                          }
                        />
                        <span
                          className="image-resize-handle right"
                          onPointerDown={(event) =>
                            startImageResize(event, section.id, section.width || 100, 'right', false)
                          }
                        />
                      </div>
                    </div>
                    <figcaption>{section.caption}</figcaption>
                  </figure>
                )}
                {section.type === sectionTypes.CAROUSEL && (
                  <CarouselPreview
                    section={section}
                    onSelect={(idx) => {
                      setActiveSectionId(section.id)
                      setActiveFloatingButtonId(null)
                      setActiveFloatingTextId(null)
                      setActiveFloatingImageId(null)
                      setActiveCarouselImageId(section.images?.[idx]?.id ?? section.images?.[0]?.id ?? null)
                      setActiveFloatingCarouselId(null)
                      setActiveFloatingCarouselImageId(null)
                      setIsEditorCollapsed(false)
                    }}
                  />
                )}
                {section.type === sectionTypes.BLOCK && (
                  <div
                    className="nested-items-canvas"
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDropIndex(index + 1)
                    }}
                    onDrop={(event) => onBlockImageDrop(event, section.id)}
                  >
                    <h4>{section.title}</h4>
                    <p>{section.body}</p>
                    <div className="nested-item-preview-list">
                      {groupNestedItemsByLevel(section.nestedItems || []).map((levelItems, levelIndex) => (
                        <div key={`level-${levelIndex}`} className="nested-level-row">
                          {levelItems.map((item) => (
                            <div
                              key={item.id}
                              className={`nested-item-preview ${item.type} ${
                                activeSectionId === section.id && activeNestedItemId === item.id ? 'active' : ''
                              }`}
                              style={
                                item.type === sectionTypes.IMAGE || item.type === sectionTypes.TEXT
                                  ? {
                                      position: 'relative',
                                      width:
                                        item.type === sectionTypes.IMAGE
                                          ? `${getNestedImageWidth(item.width)}px`
                                          : `${getNestedTextWidth(item.width)}px`,
                                      left: `${item.offsetX || 0}px`,
                                    }
                                  : undefined
                              }
                              onClick={(event) => {
                                event.stopPropagation()
                                setActiveSectionId(section.id)
                                setActiveNestedItemId(item.id)
                              }}
                            >
                              {item.type === sectionTypes.TEXT ? (
                                <p
                                  style={{
                                    textAlign: item.align || 'left',
                                    width: '100%',
                                    cursor: 'grab',
                                    touchAction: 'none',
                                    ...(item.style || {}),
                                  }}
                                  onPointerDown={(event) =>
                                    startNestedItemDrag(event, section.id, item.offsetX || 0, item.id)
                                  }
                                >
                                  {item.text}
                                </p>
                              ) : (
                                <figure
                                  className={`nested-image position-${item.position || 'center'}`}
                                  onPointerDown={() => selectSection(section.id, { nestedItemId: item.id })}
                                  onClick={() => selectSection(section.id, { nestedItemId: item.id })}
                                >
                                  <div
                                    className={`image-frame nested ${
                                      draggingImage?.sectionId === section.id && draggingImage?.nestedItemId === item.id
                                        ? 'active'
                                        : ''
                                    }`}
                                  >
                                    <img
                                      src={item.src}
                                      alt={item.alt}
                                      draggable={false}
                                      onDragStart={(event) => event.preventDefault()}
                                      onPointerDown={(event) =>
                                        startImageDrag(event, section.id, item.offsetX || 0, true, item.id)
                                      }
                                      style={{
                                        width: '100%',
                                        height: item.height ? `${item.height}px` : undefined,
                                        objectFit: 'cover',
                                        cursor: 'grab',
                                        touchAction: 'none',
                                        ...(item.style || {}),
                                      }}
                                    />
                                    <div
                                      className={`image-resize-frame nested ${
                                        resizingImage?.sectionId === section.id && resizingImage?.nestedItemId === item.id
                                          ? 'active'
                                          : ''
                                      }`}
                                    >
                                      <span
                                        className="image-resize-handle left"
                                        onPointerDown={(event) =>
                                          startImageResize(
                                            event,
                                            section.id,
                                            item.width || 100,
                                            'left',
                                            true,
                                            item.id,
                                          )
                                        }
                                      />
                                      <span
                                        className="image-resize-handle right"
                                        onPointerDown={(event) =>
                                          startImageResize(
                                            event,
                                            section.id,
                                            item.width || 100,
                                            'right',
                                            true,
                                            item.id,
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                  <figcaption>{item.caption}</figcaption>
                                </figure>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {section.type === sectionTypes.BUTTON && (
                  <div
                    className={`button-positioner ${
                      draggingButton?.sectionId === section.id ? 'active' : ''
                    }`}
                    style={{
                      position: 'relative',
                      left: `${section.offsetX || 0}px`,
                      top: `${section.offsetY || 0}px`,
                      display: 'inline-block',
                    }}
                    onPointerDown={(event) =>
                      startButtonDrag(event, section.id, section.offsetX || 0, section.offsetY || 0)
                    }
                  >
                    <a className="preview-button" href={section.href}>
                      {section.label}
                    </a>
                  </div>
                )}
                {section.type === sectionTypes.NAVIGATION && <NavigationPreview section={section} />}
                {section.type === sectionTypes.FOOTER && (
                  <footer className={`footer-layout footer-align-${section.align || 'left'}`}>
                    <div className="footer-brand">
                      <strong>{section.companyName || 'Your Company'}</strong>
                      <p>{section.companyDescription || 'A short line about your brand, mission, or customer support.'}</p>
                    </div>
                    <div className="footer-links-column">
                      {normalizeFooterLinkGroups(section.linkGroups).map((group) => (
                        <div key={group.id} className="footer-link-group">
                          <strong>{group.title}</strong>
                          <div className="footer-link-list">
                            {(group.links || []).map((link) => (
                              <a key={link.id} className="footer-inline-link" href={link.href || '#'}>
                                {link.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="footer-social-column">
                      <strong>{section.socialTitle || 'Connect with us'}</strong>
                      <div className="footer-social-list">
                        {getEnabledFooterSocialLinks(section.socialLinks).length > 0 ? (
                          getEnabledFooterSocialLinks(section.socialLinks).map((link) => (
                            <a
                              key={link.id}
                              className={`footer-social-link ${link.key}`}
                              href={link.href || '#'}
                              target="_blank"
                              rel="noreferrer"
                              style={link.style || {}}
                            >
                              <span className={`footer-social-icon ${link.key}`} aria-hidden="true">
                                {getFooterSocialGlyph(link.key)}
                              </span>
                              <span className="footer-social-label">{link.label}</span>
                            </a>
                          ))
                        ) : (
                          <p className="footer-empty-state">No social icons enabled.</p>
                        )}
                      </div>
                    </div>
                  </footer>
                )}
              </article>

              <div
                className={`preview-drop-zone ${dropIndex === index + 1 ? 'active' : ''}`}
                onDragOver={(event) => onDropZoneEnter(event, index + 1)}
                onDrop={(event) => onDropZoneDrop(event, index + 1)}
              >
                Drop here
              </div>
            </div>
          )
        })}
        <div className="floating-button-layer">
          {floatingButtons.map((button) => (
            <div
              key={button.id}
              data-floating-button-id={button.id}
              className={`button-positioner floating ${draggingButton?.sectionId === button.id ? 'active' : ''}`}
              style={{
                position: 'absolute',
                left: `${button.offsetX || 0}px`,
                top: `${button.offsetY || 0}px`,
              }}
              onClick={(event) => {
                event.stopPropagation()
                setActiveSectionId(null)
                setActiveFloatingButtonId(button.id)
                setActiveFloatingTextId(null)
                setActiveFloatingImageId(null)
              }}
              onPointerDown={(event) =>
                startButtonDrag(event, button.id, button.offsetX || 0, button.offsetY || 0)
              }
            >
              <a
                className="preview-button"
                href={button.href}
                style={button.style || {}}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('PreviewStage: floating button click', button.id)
                  setActiveSectionId(null)
                  setActiveFloatingButtonId(button.id)
                  setIsEditorCollapsed(false)
                }}
              >
                {button.label}
              </a>
            </div>
          ))}
          {floatingCarousels.map((carouselBox) => (
            <div
              key={carouselBox.id}
              className={`floating-carousel-box ${
                (draggingFloatingCarousel?.carouselId === carouselBox.id || activeFloatingCarouselId === carouselBox.id)
                  ? 'active'
                  : ''
              }`}
              style={{
                left: `${carouselBox.offsetX || 0}px`,
                top: `${carouselBox.offsetY || 0}px`,
                width: `${carouselBox.width || 480}px`,
                height: `${carouselBox.height || 630}px`,
                cursor: 'grab',
                ...(carouselBox.style || {}),
              }}
              onClick={(event) => {
                event.stopPropagation()
                // If already selected, deselect it
                if (activeFloatingCarouselId === carouselBox.id) {
                  setActiveFloatingCarouselId(null)
                } else {
                  setActiveSectionId(null)
                  setActiveFloatingButtonId(null)
                  setActiveFloatingTextId(null)
                  setActiveFloatingImageId(null)
                  setActiveFloatingCarouselId(carouselBox.id)
                    setIsEditorCollapsed(false)
                }
              }}
              onPointerDown={(event) =>
                startFloatingCarouselDrag(event, carouselBox.id, carouselBox.offsetX || 0, carouselBox.offsetY || 0)
              }
            >
                  <div className="floating-carousel-frame">
                  <CarouselPreview
                    section={carouselBox}
                    onSelect={(idx) => {
                      setActiveSectionId(null)
                      setActiveFloatingButtonId(null)
                      setActiveFloatingTextId(null)
                      setActiveFloatingImageId(null)
                      setActiveFloatingCarouselId(carouselBox.id)
                      setActiveFloatingCarouselImageId(carouselBox.images?.[idx]?.id ?? carouselBox.images?.[0]?.id ?? null)
                      setIsEditorCollapsed(false)
                    }}
                  />
                  <div
                    className={`floating-carousel-resize-frame ${
                      resizingFloatingCarousel?.carouselId === carouselBox.id ? 'active' : ''
                    }`}
                  >
                    <span
                      className="image-resize-handle left"
                      onPointerDown={(event) =>
                        startFloatingCarouselResize(
                          event,
                          carouselBox.id,
                          carouselBox.width || 480,
                          carouselBox.height || 630,
                          'left',
                          carouselBox.offsetX || 0,
                          carouselBox.offsetY || 0,
                        )
                      }
                    />
                    <span
                      className="image-resize-handle right"
                      onPointerDown={(event) =>
                        startFloatingCarouselResize(
                          event,
                          carouselBox.id,
                          carouselBox.width || 480,
                          carouselBox.height || 630,
                          'right',
                          carouselBox.offsetX || 0,
                          carouselBox.offsetY || 0,
                        )
                      }
                    />
                    <span
                      className="image-resize-handle top"
                      onPointerDown={(event) =>
                        startFloatingCarouselResize(
                          event,
                          carouselBox.id,
                          carouselBox.width || 480,
                          carouselBox.height || 630,
                          'top',
                          carouselBox.offsetX || 0,
                          carouselBox.offsetY || 0,
                        )
                      }
                    />
                    <span
                      className="image-resize-handle bottom"
                      onPointerDown={(event) =>
                        startFloatingCarouselResize(
                          event,
                          carouselBox.id,
                          carouselBox.width || 480,
                          carouselBox.height || 630,
                          'bottom',
                          carouselBox.offsetX || 0,
                          carouselBox.offsetY || 0,
                        )
                      }
                    />
                  </div>
              </div>
            </div>
          ))}
          {floatingTexts.map((textBox) => (
            <div
              key={textBox.id}
              className={`floating-text-box ${draggingFloatingText?.textId === textBox.id ? 'active' : ''}`}
              style={{
                left: `${textBox.offsetX || 0}px`,
                top: `${textBox.offsetY || 0}px`,
                width: `${textBox.width || 280}px`,
                textAlign: textBox.align || 'left',
              }}
              onClick={(event) => {
                event.stopPropagation()
                setActiveSectionId(null)
                setActiveFloatingButtonId(null)
                setActiveFloatingTextId(textBox.id)
                setActiveFloatingImageId(null)
              }}
              onPointerDown={(event) =>
                startFloatingTextDrag(event, textBox.id, textBox.offsetX || 0, textBox.offsetY || 0)
              }
            >
              <p style={textBox.style || {}}>{textBox.text}</p>
            </div>
          ))}
          {floatingImages.map((imageBox) => (
            <figure
              key={imageBox.id}
              data-floating-image-id={imageBox.id}
              className={`floating-image-box ${draggingFloatingImage?.imageId === imageBox.id ? 'active' : ''}`}
              style={{
                left: `${imageBox.offsetX || 0}px`,
                top: `${imageBox.offsetY || 0}px`,
                width: `${imageBox.width || 320}px`,
              }}
              onClick={(event) => {
                event.stopPropagation()
                setActiveSectionId(null)
                setActiveFloatingButtonId(null)
                setActiveFloatingTextId(null)
                setActiveFloatingImageId(imageBox.id)
              }}
              onPointerDown={(event) =>
                startFloatingImageDrag(event, imageBox.id, imageBox.offsetX || 0, imageBox.offsetY || 0)
              }
            >
              <div className="floating-image-frame">
                <img
                  src={imageBox.src}
                  alt={imageBox.alt}
                  draggable={false}
                  onDragStart={(event) => event.preventDefault()}
                  style={{
                    width: '100%',
                    height: imageBox.height ? `${imageBox.height}px` : undefined,
                    objectFit: 'cover',
                    borderRadius: (imageBox.style && imageBox.style.borderRadius) || '8px',
                    ...(imageBox.style || {}),
                  }}
                  onPointerUp={() => selectSection(null)}
                />
                <div
                  className={`floating-image-resize-frame ${
                    resizingFloatingImage?.imageId === imageBox.id ? 'active' : ''
                  }`}
                >
                  <span
                    className="image-resize-handle left"
                    onPointerDown={(event) =>
                      startFloatingImageResize(
                        event,
                        imageBox.id,
                        imageBox.width || 320,
                        imageBox.height || 220,
                        'left',
                        imageBox.offsetX || 0,
                        imageBox.offsetY || 0,
                      )
                    }
                  />
                  <span
                    className="image-resize-handle right"
                    onPointerDown={(event) =>
                      startFloatingImageResize(
                        event,
                        imageBox.id,
                        imageBox.width || 320,
                        imageBox.height || 220,
                        'right',
                        imageBox.offsetX || 0,
                        imageBox.offsetY || 0,
                      )
                    }
                  />
                  <span
                    className="image-resize-handle top"
                    onPointerDown={(event) =>
                      startFloatingImageResize(
                        event,
                        imageBox.id,
                        imageBox.width || 320,
                        imageBox.height || 220,
                        'top',
                        imageBox.offsetX || 0,
                        imageBox.offsetY || 0,
                      )
                    }
                  />
                  <span
                    className="image-resize-handle bottom"
                    onPointerDown={(event) =>
                      startFloatingImageResize(
                        event,
                        imageBox.id,
                        imageBox.width || 320,
                        imageBox.height || 220,
                        'bottom',
                        imageBox.offsetX || 0,
                        imageBox.offsetY || 0,
                      )
                    }
                  />
                </div>
              </div>
              <figcaption>{imageBox.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
