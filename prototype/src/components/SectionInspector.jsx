import React, { useEffect, useState } from 'react'
import NavigationSectionEditor from './NavigationSectionEditor'

export default function SectionInspector({
  sectionTypes,
  sectionLabels,
  activeSection,
  activeNestedItem,
  activeNestedItemId,
  imageInputRef,
  patchSection,
  addNestedItemToBlock,
  updateNestedItemSelection,
  moveNestedItemInBlock,
  removeNestedItemFromBlock,
  patchNestedItem,
  nestedImageInputRef,
  handleImageFile,
  activeCarouselImage,
  patchCarouselImage,
  handleFloatingCarouselImageFile,
  activeNavigationLinks,
  addNavigationLink,
  updateNavigationLink,
  removeNavigationLink,
  handleNavigationLogoFile,
  removeSection,
}) {
  if (!activeSection) {
    return (
      <div style={{ padding: 12, fontSize: 13, color: '#666' }}>
        No section selected.
      </div>
    )
  }

    function buildGradientString(type, angle, stops = []) {
      if (!type || type === 'none' || !stops || stops.length === 0) return ''
      const stopStrings = stops
        .map((s) => {
          const color = (s.color || '#000000').replaceAll('\n', '')
          const pos = (s.position != null ? `${s.position}%` : '')
          return `${color} ${pos}`.trim()
        })
        .join(', ')

      if (type === 'linear') {
        const ang = angle || '135deg'
        return `linear-gradient(${ang}, ${stopStrings})`
      }

      return ''
    }

    function GradientEditor({ activeSection, onPatch }) {
      const initial = activeSection.style || {}
      const [gradientType, setGradientType] = useState(initial.gradientType || 'none')
      const [gradientAngle, setGradientAngle] = useState(initial.gradientAngle || '135deg')
      const [stops, setStops] = useState(() => {
        const s = initial.gradientStops || []
        if (s.length >= 2) return [s[0], s[1]]
        return [{ position: 0, color: '#ffffff' }, { position: 100, color: '#000000' }]
      })

      useEffect(() => {
        const s = activeSection.style || {}
        setGradientType(s.gradientType || 'none')
        setGradientAngle(s.gradientAngle || '135deg')
        const g = s.gradientStops || []
        if (g.length >= 2) setStops([g[0], g[1]])
        else setStops([{ position: 0, color: '#ffffff' }, { position: 100, color: '#000000' }])
      }, [activeSection.id])

      const apply = (next) => {
        const nextStops = next.stops ?? stops
        const nextType = next.type ?? gradientType
        const nextAngle = next.angle ?? gradientAngle
        const backgroundImage = buildGradientString(nextType, nextAngle, nextStops)
        const base = { ...(activeSection.style || {}) }
        // When applying a gradient, remove any plain background so CSS vars / backgroundImage take precedence
        delete base.background
        onPatch({ style: { ...base, gradientType: nextType, gradientStops: nextStops, gradientAngle: nextAngle, backgroundImage } })
      }

      const updateStop = (index, patch) => {
        const next = stops.map((s, i) => (i === index ? { ...s, ...patch } : s))
        setStops(next)
        apply({ stops: next })
      }

      const onTypeChange = (t) => {
        setGradientType(t)
        apply({ type: t })
      }

      const onAngleChange = (a) => {
        setGradientAngle(a)
        apply({ angle: a })
      }

      const removeGradient = () => {
        const base = { ...(activeSection.style || {}) }
        delete base.gradientType
        delete base.gradientStops
        delete base.gradientAngle
        delete base.backgroundImage
        onPatch({ style: base })
        setGradientType('none')
        setStops([{ position: 0, color: '#ffffff' }, { position: 100, color: '#000000' }])
        setGradientAngle('135deg')
      }

      return (
        <div style={{ marginTop: 8, borderTop: '1px solid #eee', paddingTop: 8 }}>
          <h5 style={{ margin: '6px 0' }}>Gradient background</h5>
          <label>
            Gradient type
            <select value={gradientType} onChange={(e) => onTypeChange(e.target.value)}>
              <option value="none">None</option>
              <option value="linear">Linear</option>
            </select>
          </label>

          {gradientType !== 'none' && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  Angle
                  {/* numeric-only input: keep local string state so user can fully edit number without losing cursor/selection */}
                  {(() => {
                    const [angleInput, setAngleInput] = useState(() => {
                      const n = parseInt(gradientAngle)
                      return Number.isNaN(n) ? '' : String(n)
                    })

                    useEffect(() => {
                      const n = parseInt(gradientAngle)
                      setAngleInput(Number.isNaN(n) ? '' : String(n))
                    }, [gradientAngle])

                    const commit = (val) => {
                      const v = val === '' ? 0 : Number(val)
                      if (Number.isNaN(v)) return
                      const clamped = Math.max(0, Math.min(360, Math.round(v)))
                      setAngleInput(String(clamped))
                      onAngleChange(`${clamped}deg`)
                    }

                    return (
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={angleInput}
                        onChange={(e) => setAngleInput(e.target.value)}
                        onBlur={(e) => commit(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commit(e.target.value) }}
                        style={{ width: 80 }}
                      />
                    )
                  })()}
                  <span style={{ minWidth: 60 }}>{gradientAngle}</span>
                </label>
                <button type="button" onClick={removeGradient}>Remove gradient</button>
              </div>

              <div style={{ marginTop: 8 }}>
                {/* Two-stop editor (start and end) */}
                {stops.map((stop, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <input type="color" value={stop.color || (idx === 0 ? '#ffffff' : '#000000')} onChange={(e) => updateStop(idx, { color: e.target.value })} />
                    <input type="number" min="0" max="100" value={stop.position != null ? stop.position : (idx === 0 ? 0 : 100)} onChange={(e) => updateStop(idx, { position: Number(e.target.value) || 0 })} />
                    <div style={{ color: '#666', fontSize: 12 }}>{idx === 0 ? 'start' : 'end'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

  const onPatch = (patch) => {
    if (typeof patchSection === 'function') patchSection(activeSection.id, patch)
  }

  return (
    <div className="section-inspector" style={{ padding: 12 }}>
      <h4 style={{ marginTop: 0 }}>{activeSection.type}</h4>

      {activeSection.type === sectionTypes.BLOCK && (
        <div>
          <label>
            Block Title
            <input
              value={activeSection.title || ''}
              onChange={(e) => onPatch({ title: e.target.value })}
            />
          </label>

          <label>
            Block Body
            <textarea
              value={activeSection.body || ''}
              onChange={(e) => onPatch({ body: e.target.value })}
            />
          </label>

          {/* Allow editing basic block styles (background, text color, padding) */}
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'block', marginBottom: 6 }}>
              Background
              <input type="color" value={(activeSection.style && activeSection.style.background) || '#ffffff'} onChange={(e) => onPatch({ style: { ...(activeSection.style || {}), background: e.target.value } })} />
            </label>
            <label style={{ display: 'block', marginBottom: 6 }}>
              Text color
              <input type="color" value={(activeSection.style && activeSection.style.color) || '#111111'} onChange={(e) => onPatch({ style: { ...(activeSection.style || {}), color: e.target.value } })} />
            </label>
            <label style={{ display: 'block', marginBottom: 6 }}>
              Padding
              <input placeholder="12px" value={(activeSection.style && activeSection.style.padding) || ''} onChange={(e) => onPatch({ style: { ...(activeSection.style || {}), padding: e.target.value } })} />
            </label>
            <GradientEditor activeSection={activeSection} onPatch={onPatch} />
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button type="button" onClick={() => addNestedItemToBlock(activeSection.id, sectionTypes.TEXT)}>Add Text Box</button>
              <button type="button" onClick={() => addNestedItemToBlock(activeSection.id, sectionTypes.IMAGE)}>Add Image</button>
            </div>

            <div className="nested-item-list">
              {(activeSection.nestedItems || []).map((item, idx) => (
                <div key={item.id} className={`nested-item-row ${activeNestedItemId === item.id ? 'active' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', padding: 6, border: '1px solid #eee', marginBottom: 6 }} onClick={() => updateNestedItemSelection(activeSection.id, item.id)}>
                  <div>{idx + 1}. {item.type}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" onClick={(e) => { e.stopPropagation(); moveNestedItemInBlock(activeSection.id, item.id, -1) }} disabled={idx === 0}>Up</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); moveNestedItemInBlock(activeSection.id, item.id, 1) }} disabled={idx === (activeSection.nestedItems || []).length - 1}>Down</button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeNestedItemFromBlock(activeSection.id, item.id) }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {activeNestedItem ? (
              <div className="nested-item-editor" style={{ marginTop: 8, padding: 8, border: '1px solid #ddd' }}>
                <h5>Editing {activeNestedItem.type}</h5>
                {activeNestedItem.type === sectionTypes.TEXT ? (
                  <div>
                    <label>Text</label>
                    <textarea value={activeNestedItem.text || ''} onChange={(e) => patchNestedItem(activeSection.id, activeNestedItem.id, { text: e.target.value })} />
                  </div>
                ) : (
                  <div>
                    <label>Image URL</label>
                    <input value={activeNestedItem.src || ''} onChange={(e) => patchNestedItem(activeSection.id, activeNestedItem.id, { src: e.target.value })} />
                    <label style={{ display: 'block', marginTop: 6 }}>Replace Image File</label>
                    <input ref={nestedImageInputRef} type="file" accept="image/*" onChange={(e) => handleImageFile(activeSection.id, e.target.files?.[0], true, activeNestedItem.id)} />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Basic styling for other section types */}
      {activeSection && activeSection.type !== sectionTypes.BLOCK && (
        <div className="section-style" style={{ marginTop: 8 }}>
          {/* Image section editor */}
          {activeSection.type === sectionTypes.IMAGE && (
            <div style={{ marginBottom: 8 }}>
              <label>Image URL</label>
              <input value={activeSection.src || ''} onChange={(e) => onPatch({ src: e.target.value })} />
              <label style={{ display: 'block', marginTop: 6 }}>Replace Image File</label>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={(e) => handleImageFile(activeSection.id, e.target.files?.[0])} />
            </div>
          )}

          {/* Carousel image editor */}
          {activeSection.type === sectionTypes.CAROUSEL && activeCarouselImage && (
            <div style={{ marginBottom: 8 }}>
              <h5>Editing slide</h5>
              <label>Slide Image URL</label>
              <input value={activeCarouselImage.src || ''} onChange={(e) => patchCarouselImage && patchCarouselImage(activeSection.id, activeCarouselImage.id, { src: e.target.value })} />
              <label>Caption</label>
              <input value={activeCarouselImage.caption || ''} onChange={(e) => patchCarouselImage && patchCarouselImage(activeSection.id, activeCarouselImage.id, { caption: e.target.value })} />
              <label style={{ display: 'block', marginTop: 6 }}>Replace Slide Image</label>
              <input type="file" accept="image/*" onChange={(e) => handleFloatingCarouselImageFile && handleFloatingCarouselImageFile(activeSection.id, activeCarouselImage.id, e.target.files?.[0])} />
            </div>
          )}

          {/* Button editor */}
          {activeSection.type === sectionTypes.BUTTON && (
            <div style={{ marginBottom: 8 }}>
              <label>Label</label>
              <input value={activeSection.label || ''} onChange={(e) => onPatch({ label: e.target.value })} />
              <label>Href</label>
              <input value={activeSection.href || ''} onChange={(e) => onPatch({ href: e.target.value })} />
            </div>
          )}
          <label>Background
            <input type="color" value={(activeSection.style && activeSection.style.background) || '#ffffff'} onChange={(e) => onPatch({ style: { ...(activeSection.style || {}), background: e.target.value } })} />
          </label>
          <label>Text color
            <input type="color" value={(activeSection.style && activeSection.style.color) || '#111111'} onChange={(e) => onPatch({ style: { ...(activeSection.style || {}), color: e.target.value } })} />
          </label>
          <label>Padding
            <input placeholder="12px" value={(activeSection.style && activeSection.style.padding) || ''} onChange={(e) => onPatch({ style: { ...(activeSection.style || {}), padding: e.target.value } })} />
          </label>
          {/* Gradient editor */}
          <GradientEditor activeSection={activeSection} onPatch={onPatch} />
        </div>
      )}

      <NavigationSectionEditor
        activeSection={activeSection}
        activeNavigationLinks={activeNavigationLinks}
        patchSection={patchSection}
        addNavigationLink={addNavigationLink}
        updateNavigationLink={updateNavigationLink}
        removeNavigationLink={removeNavigationLink}
        handleNavigationLogoFile={handleNavigationLogoFile}
      />

      <div style={{ marginTop: 10 }}>
        <button type="button" className="remove-btn" onClick={() => removeSection && removeSection(activeSection.id)}>Remove Selected</button>
      </div>
    </div>
  )
}
