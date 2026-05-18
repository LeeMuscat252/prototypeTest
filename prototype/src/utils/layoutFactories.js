import { SECTION_TYPES } from '../constants/sections'
import { normalizeNavigationLinks } from '../navigationUtils'
import { createFooterSection, normalizeFooterSection } from './footerUtils'

export const normalizeNavigationSection = (section) =>
  section?.type === SECTION_TYPES.NAVIGATION
    ? { ...section, links: normalizeNavigationLinks(section.links) }
    : section

export const createPage = (
  name,
  {
    pageTitle = name,
    sections = [],
    floatingButtons = [],
    floatingTexts = [],
    floatingImages = [],
  } = {},
) => ({
  id: `page-${crypto.randomUUID()}`,
  name,
  pageTitle,
  sections,
  floatingButtons,
  floatingTexts,
  floatingImages,
})

export const createDefaultPages = () => [
  createPage('Home', {
    pageTitle: 'Home',
    sections: [],
  }),
  createPage('About Us', {
    pageTitle: 'About Us',
    sections: [],
  }),
]

export const normalizePage = (page) => ({
  ...page,
  sections: Array.isArray(page.sections)
    ? page.sections.map((section) => normalizeFooterSection(normalizeNavigationSection(section)))
    : [],
  floatingButtons: Array.isArray(page.floatingButtons) ? page.floatingButtons : [],
  floatingTexts: Array.isArray(page.floatingTexts) ? page.floatingTexts : [],
  floatingImages: Array.isArray(page.floatingImages) ? page.floatingImages : [],
})

export const createSection = (type) => {
  const id = `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  if (type === SECTION_TYPES.HEADER) {
    return {
      id,
      type,
      title: 'New Header',
      subtitle: 'Add supporting text',
      align: 'left',
      height: 150,
    }
  }

  if (type === SECTION_TYPES.TEXT) {
    return {
      id,
      type,
      text: 'Add your paragraph text here.',
      align: 'left',
      height: 120,
    }
  }

  if (type === SECTION_TYPES.IMAGE) {
    return {
      id,
      type,
      src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80',
      alt: 'Mountain landscape',
      caption: 'Image caption',
      width: 100,
      height: 260,
      position: 'center',
      offsetX: 0,
    }
  }

  if (type === SECTION_TYPES.BUTTON) {
    return {
      id,
      type,
      label: 'Call To Action',
      href: '#',
      align: 'left',
      height: 100,
      offsetX: 0,
      offsetY: 0,
    }
  }

  if (type === SECTION_TYPES.NAVIGATION) {
    return {
      id,
      type,
      title: 'Navigation',
      links: normalizeNavigationLinks(),
      align: 'left',
      height: 110,
      logoLeftEnabled: false,
      logoLeft: null,
      logoRightEnabled: false,
      logoRight: null,
    }
  }

  if (type === SECTION_TYPES.FOOTER) {
    return createFooterSection(id)
  }

  return {
    id,
    type,
    title: '',
    body: '',
    align: 'left',
    height: 160,
    nestedItems: [],
  }
}

export const createNestedImage = (imageSection) => ({
  id: imageSection?.id || `nested-image-${crypto.randomUUID()}`,
  type: SECTION_TYPES.IMAGE,
  src: imageSection.src,
  alt: imageSection.alt,
  caption: imageSection.caption,
  width: imageSection.width,
  height: imageSection.height,
  position: imageSection.position,
  offsetX: imageSection.offsetX,
  level: imageSection.level ?? 0,
})

export const getNestedImageWidth = (width) => {
  if (typeof width === 'number' && width > 100) {
    return width
  }

  return 320
}

export const getNestedTextWidth = (width) => {
  if (typeof width === 'number' && width >= 120) {
    return width
  }

  return 240
}

export const createNestedText = (text = 'Nested text box') => ({
  id: `nested-text-${crypto.randomUUID()}`,
  type: SECTION_TYPES.TEXT,
  text,
  align: 'left',
  width: 240,
  offsetX: 0,
  level: 0,
})

export const createNestedItem = (type) => {
  if (type === SECTION_TYPES.TEXT) {
    return createNestedText()
  }

  return createNestedImage({
    src: '',
    alt: 'Nested image',
    caption: 'Nested image',
    width: 320,
    height: 220,
    position: 'center',
    offsetX: 0,
    level: 0,
  })
}

export const groupNestedItemsByLevel = (items = []) => {
  const levels = new Map()

  items.forEach((item) => {
    const level = Number.isFinite(Number(item.level)) ? Number(item.level) : 0
    if (!levels.has(level)) {
      levels.set(level, [])
    }

    levels.get(level).push(item)
  })

  return [...levels.entries()]
    .sort(([leftLevel], [rightLevel]) => leftLevel - rightLevel)
    .map(([, levelItems]) => levelItems)
}

export const reorderByDropZone = (items, movingId, dropIndex) => {
  const fromIndex = items.findIndex((item) => item.id === movingId)
  if (fromIndex < 0) return items

  const clampedDropIndex = Math.max(0, Math.min(dropIndex, items.length))
  const next = [...items]
  const [moving] = next.splice(fromIndex, 1)
  const targetIndex = fromIndex < clampedDropIndex ? clampedDropIndex - 1 : clampedDropIndex
  next.splice(targetIndex, 0, moving)
  return next
}
