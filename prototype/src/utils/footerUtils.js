import { SECTION_TYPES } from '../constants/sections'

export const FOOTER_SOCIAL_OPTIONS = [
  { key: 'facebook', label: 'Facebook', glyph: 'f', className: 'facebook' },
  { key: 'instagram', label: 'Instagram', glyph: 'ig', className: 'instagram' },
  { key: 'tiktok', label: 'TikTok', glyph: 'tt', className: 'tiktok' },
  { key: 'x', label: 'X', glyph: 'x', className: 'x' },
  { key: 'youtube', label: 'YouTube', glyph: 'yt', className: 'youtube' },
  { key: 'pinterest', label: 'Pinterest', glyph: 'p', className: 'pinterest' },
]

const DEFAULT_ENABLED_SOCIAL_KEYS = new Set(['facebook', 'instagram', 'tiktok'])

export const createFooterSocialLink = (option, overrides = {}) => ({
  id: overrides.id || `footer-social-${option.key}-${crypto.randomUUID()}`,
  key: option.key,
  label: overrides.label || option.label,
  href: overrides.href || '',
  enabled: overrides.enabled ?? DEFAULT_ENABLED_SOCIAL_KEYS.has(option.key),
})

export const normalizeFooterSocialLinks = (links = []) => {
  const sourceLinks = Array.isArray(links) ? links : []

  return FOOTER_SOCIAL_OPTIONS.map((option) => {
    const existing = sourceLinks.find((link) => link?.key === option.key)
    return createFooterSocialLink(option, existing || {})
  })
}

export const getFooterSocialOption = (key) =>
  FOOTER_SOCIAL_OPTIONS.find((option) => option.key === key) || null

export const getFooterSocialGlyph = (key) => getFooterSocialOption(key)?.glyph || String(key || '').slice(0, 1).toUpperCase()

export const getEnabledFooterSocialLinks = (links = []) =>
  normalizeFooterSocialLinks(links).filter((link) => link.enabled !== false)

export const createFooterLinkItem = (overrides = {}) => ({
  id: overrides.id || `footer-link-${crypto.randomUUID()}`,
  label: overrides.label || 'Link label',
  href: overrides.href || '#',
})

export const createFooterLinkGroup = (overrides = {}) => ({
  id: overrides.id || `footer-link-group-${crypto.randomUUID()}`,
  title: overrides.title || 'Help',
  links: Array.isArray(overrides.links) && overrides.links.length > 0
    ? overrides.links.map((link) => createFooterLinkItem(link))
    : [
        createFooterLinkItem({ label: 'Help Center', href: '#' }),
        createFooterLinkItem({ label: 'FAQ', href: '#' }),
      ],
})

export const normalizeFooterLinkGroups = (groups = []) => {
  const sourceGroups = Array.isArray(groups) ? groups : []

  if (sourceGroups.length === 0) {
    return [
      createFooterLinkGroup({
        title: 'Help',
        links: [
          { label: 'Help Center', href: '#' },
          { label: 'FAQ', href: '#' },
        ],
      }),
      createFooterLinkGroup({
        title: 'Company',
        links: [
          { label: 'About Us', href: '#' },
          { label: 'Careers', href: '#' },
        ],
      }),
    ]
  }

  return sourceGroups.map((group) => createFooterLinkGroup(group))
}

export const createFooterSection = (id) => ({
  id,
  type: SECTION_TYPES.FOOTER,
  companyName: 'Your Company',
  companyDescription: 'A short line about your brand, mission, or customer support.',
  socialTitle: 'Connect with us',
  socialLinks: normalizeFooterSocialLinks(),
  linkGroups: normalizeFooterLinkGroups(),
  align: 'left',
  height: 220,
})

export const normalizeFooterSection = (section) => {
  if (section?.type !== SECTION_TYPES.FOOTER) {
    return section
  }

  return {
    ...section,
    companyName: section.companyName || 'Your Company',
    companyDescription:
      section.companyDescription ||
      section.text ||
      'A short line about your brand, mission, or customer support.',
    socialTitle: section.socialTitle || 'Connect with us',
    socialLinks: normalizeFooterSocialLinks(section.socialLinks),
    linkGroups: normalizeFooterLinkGroups(section.linkGroups),
    align: section.align || 'left',
    height: Number(section.height) || 220,
  }
}