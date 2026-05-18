import { normalizeNavigationHrefInput } from '../navigationUtils'

export default function NavigationSectionEditor({
  activeSection,
  activeNavigationLinks,
  patchSection,
  addNavigationLink,
  updateNavigationLink,
  removeNavigationLink,
  handleNavigationLogoFile,
}) {
  if (!activeSection || activeSection.type !== 'navigation') {
    return null
  }

  return (
    <>
      <label>
        Title
        <input
          value={activeSection.title}
          onChange={(event) =>
            patchSection(activeSection.id, { title: event.target.value })
          }
        />
      </label>
      <div className="nav-link-editor">
        <div className="nav-link-editor-header">
          <h4>Links</h4>
          <button type="button" onClick={() => addNavigationLink(activeSection.id)}>
            Add Link
          </button>
        </div>
        <div className="nav-link-list">
          {activeNavigationLinks.map((link, index) => (
            <div key={link.id} className="nav-link-row">
              <label>
                Label
                <input
                  value={link.label}
                  onChange={(event) =>
                    updateNavigationLink(activeSection.id, link.id, {
                      label: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                Link URL
                <input
                  value={link.href}
                  onChange={(event) =>
                    updateNavigationLink(activeSection.id, link.id, {
                      href: normalizeNavigationHrefInput(event.target.value),
                    })
                  }
                />
              </label>
              <div className="nav-link-row-actions">
                <span className="nested-item-empty">Link {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeNavigationLink(activeSection.id, link.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <label>
        Left Logo Enabled
        <input
          type="checkbox"
          checked={activeSection.logoLeftEnabled || false}
          onChange={(event) =>
            patchSection(activeSection.id, { logoLeftEnabled: event.target.checked })
          }
        />
      </label>
      <label>
        Left Logo Image
        <input
          type="file"
          accept="image/*"
          onChange={(event) =>
            handleNavigationLogoFile(activeSection.id, event.target.files?.[0], 'logoLeft')
          }
        />
      </label>
      <label>
        Right Logo Enabled
        <input
          type="checkbox"
          checked={activeSection.logoRightEnabled || false}
          onChange={(event) =>
            patchSection(activeSection.id, { logoRightEnabled: event.target.checked })
          }
        />
      </label>
      <label>
        Right Logo Image
        <input
          type="file"
          accept="image/*"
          onChange={(event) =>
            handleNavigationLogoFile(activeSection.id, event.target.files?.[0], 'logoRight')
          }
        />
      </label>
      <div className="button-row compact">
        <button
          type="button"
          onClick={() => patchSection(activeSection.id, { logoLeft: null, logoLeftEnabled: false })}
        >
          Disable Left
        </button>
        <button
          type="button"
          onClick={() => patchSection(activeSection.id, { logoRight: null, logoRightEnabled: false })}
        >
          Disable Right
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        <h4>Navigation hover style</h4>
        <label>
          Link hover background
          <input
            type="color"
            value={(activeSection.style && activeSection.style.navLinkHover && activeSection.style.navLinkHover.background) || '#ffffff'}
            onChange={(e) => patchSection(activeSection.id, { style: { ...(activeSection.style || {}), navLinkHover: { ...(activeSection.style?.navLinkHover || {}), background: e.target.value } } })}
          />
        </label>
        <label>
          Link hover color
          <input
            type="color"
            value={(activeSection.style && activeSection.style.navLinkHover && activeSection.style.navLinkHover.color) || '#000000'}
            onChange={(e) => patchSection(activeSection.id, { style: { ...(activeSection.style || {}), navLinkHover: { ...(activeSection.style?.navLinkHover || {}), color: e.target.value } } })}
          />
        </label>
      </div>
      <div style={{ marginTop: 12 }}>
        <h4>Navigation style</h4>
        <label>
          Underline color
          <input
            type="color"
            value={(activeSection.style && (activeSection.style.navAccent || activeSection.style['nav-accent'])) || '#FFD400'}
            onChange={(e) =>
              patchSection(activeSection.id, {
                style: { ...(activeSection.style || {}), navAccent: e.target.value },
              })
            }
          />
        </label>
        <label>
          Active link color
          <input
            type="color"
            value={(activeSection.style && (activeSection.style.navActiveColor || activeSection.style['nav-active-color'])) || '#FFFFFF'}
            onChange={(e) =>
              patchSection(activeSection.id, {
                style: { ...(activeSection.style || {}), navActiveColor: e.target.value },
              })
            }
          />
        </label>
      </div>
    </>
  )
}
