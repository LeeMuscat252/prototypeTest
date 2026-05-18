import { useMemo, useRef, useState, useEffect } from 'react'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import './App.css'
import './themes/themes.css'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import ComponentPalettePanel from './components/ComponentPalettePanel'
import { firebaseReady } from './firebase'
import ExportPanel from './components/ExportPanel'
import PageControlsPanel from './components/PageControlsPanel'
import PageTitlePanel from './components/PageTitlePanel'
import PreviewStage from './components/PreviewStage'
import SectionInspector from './components/SectionInspector'
import SummariserPanel from './components/SummariserPanel'
import { buildHtmlDocument, exportHtmlFile, exportLayoutFile } from './utils/exportHtml'
import { createFooterSection, normalizeFooterSection } from './utils/footerUtils'
import {
  createNavigationLink,
  normalizeNavigationLinks,
} from './navigationUtils'
const SECTION_TYPES = {
  NAVIGATION: 'navigation',
  HEADER: 'header',
  BLOCK: 'block',
  IMAGE: 'image',
  CAROUSEL: 'carousel',
  TEXT: 'text',
  BUTTON: 'button',
  FOOTER: 'footer',
}

const SECTION_LABELS = {
  [SECTION_TYPES.HEADER]: 'Header',
  [SECTION_TYPES.TEXT]: 'Text',
  [SECTION_TYPES.IMAGE]: 'Image',
  [SECTION_TYPES.CAROUSEL]: 'Image Carousel',
  [SECTION_TYPES.BLOCK]: 'Content Block',
  [SECTION_TYPES.BUTTON]: 'Button',
  [SECTION_TYPES.NAVIGATION]: 'Navigation',
  [SECTION_TYPES.FOOTER]: 'Footer',
}

const normalizeNavigationSection = (section) =>
  section?.type === SECTION_TYPES.NAVIGATION
    ? { ...section, links: normalizeNavigationLinks(section.links) }
    : section

const normalizeFooterSectionInApp = (section) => normalizeFooterSection(section)

const normalizeHeaderSection = (section) => {
  if (section?.type !== SECTION_TYPES.HEADER) {
    return section
  }

  return {
    ...section,
    title: section.title || section.subtitle || 'Your Hero Headline',
  }
}

const createCarouselImage = (index = 0, overrides = {}) => ({
  id: overrides.id || `carousel-image-${crypto.randomUUID()}`,
  src:
    overrides.src ||
    [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
    ][index % 3],
  alt: overrides.alt || `Carousel image ${index + 1}`,
  caption: overrides.caption || `Slide ${index + 1}`,
})

const normalizeCarouselSection = (section) =>
  section?.type === SECTION_TYPES.CAROUSEL
    ? {
        ...section,
        images:
          Array.isArray(section.images) && section.images.length > 0
            ? section.images.map((image, index) => createCarouselImage(index, image))
            : [createCarouselImage(0), createCarouselImage(1), createCarouselImage(2)],
        autoplay: section.autoplay ?? true,
        interval: Number(section.interval) || 4000,
        height: Number(section.height) || 630,
        showCaptions: section.showCaptions ?? true,
        loop: section.loop ?? true,
      }
    : section

const createPage = (
  name,
  {
    pageTitle = name,
    sections = [],
    floatingButtons = [],
    floatingTexts = [],
    floatingImages = [],
    floatingCarousels = [],
  } = {},
) => ({
  id: `page-${crypto.randomUUID()}`,
  name,
  pageTitle,
  sections,
  floatingButtons,
  floatingTexts,
  floatingImages,
  floatingCarousels,
})

const createDefaultPages = () => [
  createPage('Home', {
    pageTitle: 'Home',
    sections: [],
  }),
  createPage('About Us', {
    pageTitle: 'About Us',
    sections: [],
  }),
]

const normalizePage = (page) => ({
  ...page,
  sections: Array.isArray(page.sections)
    ? page.sections.map((section) =>
        normalizeHeaderSection(
          normalizeFooterSectionInApp(normalizeCarouselSection(normalizeNavigationSection(section))),
        ),
      )
    : [],
  floatingButtons: Array.isArray(page.floatingButtons) ? page.floatingButtons : [],
  floatingTexts: Array.isArray(page.floatingTexts) ? page.floatingTexts : [],
  floatingImages: Array.isArray(page.floatingImages) ? page.floatingImages : [],
  floatingCarousels: Array.isArray(page.floatingCarousels) ? page.floatingCarousels : [],
})

const createSection = (type) => {
  const id = `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  if (type === SECTION_TYPES.HEADER) {
    return {
      id,
      type,
      title: 'Your Hero Headline',
      align: 'center',
      height: 320,
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

  if (type === SECTION_TYPES.CAROUSEL) {
    return {
      id,
      type,
      title: 'Image Carousel',
      images: [createCarouselImage(0), createCarouselImage(1), createCarouselImage(2)],
      autoplay: true,
      interval: 4000,
      height: 630,
      showCaptions: true,
      loop: true,
      align: 'center',
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

const createNestedImage = (imageSection) => ({
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

const getNestedImageWidth = (width) => {
  if (typeof width === 'number' && width > 100) {
    return width
  }

  return 320
}

const getNestedTextWidth = (width) => {
  if (typeof width === 'number' && width >= 120) {
    return width
  }

  return 240
}

const createNestedText = (text = 'Nested text box') => ({
  id: `nested-text-${crypto.randomUUID()}`,
  type: SECTION_TYPES.TEXT,
  text,
  align: 'left',
  width: 240,
  offsetX: 0,
  level: 0,
})

const createNestedItem = (type) => {
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

const groupNestedItemsByLevel = (items = []) => {
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

const reorderByDropZone = (items, movingId, dropIndex) => {
  const fromIndex = items.findIndex((item) => item.id === movingId)
  if (fromIndex < 0) return items

  const clampedDropIndex = Math.max(0, Math.min(dropIndex, items.length))
  const next = [...items]
  const [moving] = next.splice(fromIndex, 1)
  const targetIndex = fromIndex < clampedDropIndex ? clampedDropIndex - 1 : clampedDropIndex
  next.splice(targetIndex, 0, moving)
  return next
}

function AppContent() {
  const { currentTheme, styleOverrides } = useTheme()
  const initialPages = useMemo(() => createDefaultPages(), [])
  const [pages, setPages] = useState(() => initialPages)
  const [activePageId, setActivePageId] = useState(() => initialPages[0].id)
  const [activeSectionId, setActiveSectionId] = useState(null)
  const [activeFloatingButtonId, setActiveFloatingButtonId] = useState(null)
  const [activeFloatingTextId, setActiveFloatingTextId] = useState(null)
  const [activeFloatingImageId, setActiveFloatingImageId] = useState(null)
  const [activeFloatingCarouselId, setActiveFloatingCarouselId] = useState(null)
  const [activeCarouselImageId, setActiveCarouselImageId] = useState(null)
  const [inputText, setInputText] = useState('')
  const [aiOutput, setAiOutput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiError, setAiError] = useState('')
  const [dropIndex, setDropIndex] = useState(null)
  const [resizingSectionId, setResizingSectionId] = useState(null)
  const [resizingImage, setResizingImage] = useState(null)
  const [draggingImage, setDraggingImage] = useState(null)
  const [draggingButton, setDraggingButton] = useState(null)
  const [draggingFloatingText, setDraggingFloatingText] = useState(null)
  const [draggingFloatingImage, setDraggingFloatingImage] = useState(null)
  const [draggingFloatingCarousel, setDraggingFloatingCarousel] = useState(null)
  const [resizingFloatingImage, setResizingFloatingImage] = useState(null)
  const [resizingFloatingCarousel, setResizingFloatingCarousel] = useState(null)
  const [activeFloatingCarouselImageId, setActiveFloatingCarouselImageId] = useState(null)
  const [activeNestedItemId, setActiveNestedItemId] = useState(null)
  const [firebaseStatus, setFirebaseStatus] = useState('')
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false)
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [keepEditorOpenOnLeave, setKeepEditorOpenOnLeave] = useState(() => {
    try {
      return localStorage.getItem('keepEditorOpenOnLeave') === 'true'
    } catch (e) {
      return false
    }
  })
  const imageInputRef = useRef(null)
  const nestedImageInputRef = useRef(null)

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? pages[0] ?? null,
    [pages, activePageId],
  )

  const pageTitle = activePage?.pageTitle || 'My Page Title'
  const pageName = activePage?.name || 'Page'
  const sections = activePage?.sections || []
  const floatingButtons = activePage?.floatingButtons || []
  const floatingTexts = activePage?.floatingTexts || []
  const floatingImages = activePage?.floatingImages || []
  const floatingCarousels = activePage?.floatingCarousels || []

  const updateActivePage = (updater) => {
    setPages((current) =>
      current.map((page) => {
        if (page.id !== activePageId) {
          return page
        }

        const nextPage = typeof updater === 'function' ? updater(page) : updater
        return nextPage ? { ...page, ...nextPage } : page
      }),
    )
  }

  const setPageTitle = (nextValue) => {
    updateActivePage((page) => ({
      pageTitle: typeof nextValue === 'function' ? nextValue(page.pageTitle) : nextValue,
    }))
  }

  const setSections = (nextValue) => {
    updateActivePage((page) => ({
      sections: typeof nextValue === 'function' ? nextValue(page.sections) : nextValue,
    }))
  }

  const setFloatingButtons = (nextValue) => {
    updateActivePage((page) => ({
      floatingButtons: typeof nextValue === 'function' ? nextValue(page.floatingButtons) : nextValue,
    }))
  }

  const setFloatingTexts = (nextValue) => {
    updateActivePage((page) => ({
      floatingTexts: typeof nextValue === 'function' ? nextValue(page.floatingTexts) : nextValue,
    }))
  }

  const setFloatingImages = (nextValue) => {
    updateActivePage((page) => ({
      floatingImages: typeof nextValue === 'function' ? nextValue(page.floatingImages) : nextValue,
    }))
  }

  const setFloatingCarousels = (nextValue) => {
    updateActivePage((page) => ({
      floatingCarousels: typeof nextValue === 'function' ? nextValue(page.floatingCarousels) : nextValue,
    }))
  }

  const selectPage = (pageId) => {
    setActivePageId(pageId)
    setActiveSectionId(null)
    setActiveFloatingButtonId(null)
    setActiveFloatingTextId(null)
    setActiveFloatingImageId(null)
    setActiveCarouselImageId(null)
    setActiveFloatingCarouselImageId(null)
    setActiveNestedItemId(null)
    setActiveFloatingCarouselId(null)
  }

  const createBlankPage = (name) => createPage(name, { pageTitle: name })

  const addPage = () => {
    const nextPageName = `Page ${pages.length + 1}`
    const nextPage = createBlankPage(nextPageName)
    setPages((current) => [...current, nextPage])
    selectPage(nextPage.id)
  }

  const renameActivePage = (nextName) => {
    updateActivePage(() => ({
      name: nextName,
    }))
  }

  const duplicateActivePage = () => {
    if (!activePage) {
      return
    }

    const clonedPage = JSON.parse(JSON.stringify(activePage))
    const nextPage = {
      ...clonedPage,
      id: `page-${crypto.randomUUID()}`,
      name: `${activePage.name} Copy`,
      pageTitle: `${activePage.pageTitle} Copy`,
    }

    setPages((current) => [...current, nextPage])
    selectPage(nextPage.id)
  }

  const deleteActivePage = () => {
    if (pages.length <= 1) {
      return
    }

    const remaining = pages.filter((page) => page.id !== activePageId)
    setPages(remaining)
    if (remaining[0]?.id) {
      selectPage(remaining[0].id)
    }
  }

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? null,
    [sections, activeSectionId],
  )

  const activeFloatingButton = useMemo(
    () => floatingButtons.find((button) => button.id === activeFloatingButtonId) ?? null,
    [floatingButtons, activeFloatingButtonId],
  )

  const activeFloatingText = useMemo(
    () => floatingTexts.find((textBox) => textBox.id === activeFloatingTextId) ?? null,
    [floatingTexts, activeFloatingTextId],
  )

  const activeFloatingImage = useMemo(
    () => floatingImages.find((imageBox) => imageBox.id === activeFloatingImageId) ?? null,
    [floatingImages, activeFloatingImageId],
  )

  const activeFloatingCarousel = useMemo(
    () => floatingCarousels.find((c) => c.id === activeFloatingCarouselId) ?? null,
    [floatingCarousels, activeFloatingCarouselId],
  )

  const activeCarouselImage = useMemo(() => {
    if (activeSection?.type !== SECTION_TYPES.CAROUSEL) {
      return null
    }

    const carouselImages = activeSection.images || []
    return carouselImages.find((image) => image.id === activeCarouselImageId) ?? carouselImages[0] ?? null
  }, [activeSection, activeCarouselImageId])

  const activeNestedItem = useMemo(() => {
    if (activeSection?.type !== SECTION_TYPES.BLOCK) {
      return null
    }

    return (activeSection.nestedItems || []).find((item) => item.id === activeNestedItemId) ?? null
  }, [activeSection, activeNestedItemId])

  const activeNavigationLinks = useMemo(
    () => (activeSection?.type === SECTION_TYPES.NAVIGATION ? normalizeNavigationLinks(activeSection.links) : []),
    [activeSection],
  )

  const htmlPreview = useMemo(
    () =>
      buildHtmlDocument(
        sections,
        pageTitle,
        floatingButtons,
        floatingTexts,
        floatingImages,
        floatingCarousels,
        currentTheme,
        styleOverrides,
      ),
    [
      sections,
      pageTitle,
      floatingButtons,
      floatingTexts,
      floatingImages,
      floatingCarousels,
      currentTheme,
      styleOverrides,
    ],
  )

  const addSection = (type) => {
    if (type === SECTION_TYPES.BUTTON) {
      const nextButton = createSection(type)
      setFloatingButtons((current) => [...current, { ...nextButton, offsetX: 24, offsetY: 24 }])
      setActiveSectionId(null)
      setActiveFloatingButtonId(nextButton.id)
      setActiveFloatingImageId(null)
      return
    }

    if (type === SECTION_TYPES.TEXT) {
      const nextText = createSection(type)
      setFloatingTexts((current) => [
        ...current,
        {
          id: nextText.id,
          type: SECTION_TYPES.TEXT,
          text: nextText.text,
          align: nextText.align,
          width: 280,
          offsetX: 24,
          offsetY: 24,
        },
      ])
      setActiveSectionId(null)
      setActiveFloatingButtonId(null)
      setActiveFloatingTextId(nextText.id)
      setActiveFloatingImageId(null)
      return
    }

    if (type === SECTION_TYPES.IMAGE) {
      const nextImage = createSection(type)
      setFloatingImages((current) => [
        ...current,
        {
          id: nextImage.id,
          type: SECTION_TYPES.IMAGE,
          src: nextImage.src,
          alt: nextImage.alt,
          caption: nextImage.caption,
          width: 320,
          height: nextImage.height || 220,
          offsetX: 24,
          offsetY: 24,
        },
      ])
      setActiveSectionId(null)
      setActiveFloatingButtonId(null)
      setActiveFloatingTextId(null)
      setActiveFloatingImageId(nextImage.id)
      return
    }

    if (type === SECTION_TYPES.CAROUSEL) {
      const nextCarousel = createSection(type)
      setFloatingCarousels((current) => [
        ...current,
        {
          id: nextCarousel.id,
          type: SECTION_TYPES.CAROUSEL,
          images: nextCarousel.images,
          autoplay: nextCarousel.autoplay,
          interval: nextCarousel.interval,
          height: nextCarousel.height || 630,
          showCaptions: nextCarousel.showCaptions,
          loop: nextCarousel.loop,
          align: nextCarousel.align || 'center',
          offsetX: 24,
          offsetY: 24,
          width: 480,
        },
      ])
      setActiveSectionId(null)
      setActiveFloatingButtonId(null)
      setActiveFloatingTextId(null)
      setActiveFloatingImageId(null)
      setActiveFloatingCarouselId(nextCarousel.id)
      setActiveFloatingCarouselImageId(nextCarousel.images?.[0]?.id ?? null)
      return
    }

    const next = createSection(type)
    setSections((current) => [...current, next])
    setActiveSectionId(next.id)
    setActiveFloatingButtonId(null)
    setActiveFloatingTextId(null)
    setActiveFloatingImageId(null)
    setActiveCarouselImageId(next.type === SECTION_TYPES.CAROUSEL ? next.images?.[0]?.id ?? null : null)
  }

  const insertSectionAt = (type, index) => {
    if (type === SECTION_TYPES.BUTTON) {
      const nextButton = createSection(type)
      setFloatingButtons((current) => [...current, { ...nextButton, offsetX: 24, offsetY: 24 }])
      setActiveSectionId(null)
      setActiveFloatingButtonId(nextButton.id)
      setActiveFloatingTextId(null)
      setActiveFloatingImageId(null)
      return
    }

    if (type === SECTION_TYPES.TEXT) {
      const nextText = createSection(type)
      setFloatingTexts((current) => [
        ...current,
        {
          id: nextText.id,
          type: SECTION_TYPES.TEXT,
          text: nextText.text,
          align: nextText.align,
          width: 280,
          offsetX: 24,
          offsetY: 24,
        },
      ])
      setActiveSectionId(null)
      setActiveFloatingButtonId(null)
      setActiveFloatingTextId(nextText.id)
      setActiveFloatingImageId(null)
      return
    }

    if (type === SECTION_TYPES.IMAGE) {
      const nextImage = createSection(type)
      setFloatingImages((current) => [
        ...current,
        {
          id: nextImage.id,
          type: SECTION_TYPES.IMAGE,
          src: nextImage.src,
          alt: nextImage.alt,
          caption: nextImage.caption,
          width: 320,
          height: nextImage.height || 220,
          offsetX: 24,
          offsetY: 24,
        },
      ])
      setActiveSectionId(null)
      setActiveFloatingButtonId(null)
      setActiveFloatingTextId(null)
      setActiveFloatingImageId(nextImage.id)
      return
    }

    const next = createSection(type)

    setSections((current) => {
      const insertAt = Math.max(0, Math.min(index, current.length))
      const clone = [...current]
      clone.splice(insertAt, 0, next)
      return clone
    })

    setActiveSectionId(next.id)
    setActiveFloatingButtonId(null)
    setActiveFloatingTextId(null)
    setActiveFloatingImageId(null)
    setActiveCarouselImageId(next.type === SECTION_TYPES.CAROUSEL ? next.images?.[0]?.id ?? null : null)
  }

  const removeSection = (sectionId) => {
    setSections((current) => current.filter((section) => section.id !== sectionId))
    setActiveSectionId((current) => (current === sectionId ? null : current))
    setActiveNestedItemId((current) => (activeSectionId === sectionId ? null : current))
    setActiveCarouselImageId((current) => (activeSectionId === sectionId ? null : current))
  }

  const patchSection = (sectionId, patch) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    )
  }

  const patchFloatingButton = (buttonId, patch) => {
    setFloatingButtons((current) =>
      current.map((button) => (button.id === buttonId ? { ...button, ...patch } : button)),
    )
  }

  const patchFloatingText = (textId, patch) => {
    setFloatingTexts((current) =>
      current.map((textBox) => (textBox.id === textId ? { ...textBox, ...patch } : textBox)),
    )
  }

  const patchFloatingImage = (imageId, patch) => {
    setFloatingImages((current) =>
      current.map((imageBox) => (imageBox.id === imageId ? { ...imageBox, ...patch } : imageBox)),
    )
  }

  const patchFloatingCarousel = (carouselId, patch) => {
    setFloatingCarousels((current) =>
      current.map((c) => (c.id === carouselId ? { ...c, ...patch } : c)),
    )
  }

  const addFloatingCarouselImage = (carouselId) => {
    const nextImage = createCarouselImage()

    setFloatingCarousels((current) =>
      current.map((c) =>
        c.id === carouselId ? { ...c, images: [...(c.images || []), nextImage] } : c,
      ),
    )

    setActiveFloatingCarouselImageId(nextImage.id)
  }

  const removeFloatingCarouselImage = (carouselId, imageId) => {
    setFloatingCarousels((current) =>
      current.map((c) =>
        c.id === carouselId ? { ...c, images: (c.images || []).filter((img) => img.id !== imageId) } : c,
      ),
    )

    setActiveFloatingCarouselImageId((current) => (current === imageId ? null : current))
  }

  const moveFloatingCarouselImage = (carouselId, imageId, direction) => {
    setFloatingCarousels((current) =>
      current.map((c) => {
        if (c.id !== carouselId) return c
        const items = [...(c.images || [])]
        const fromIndex = items.findIndex((i) => i.id === imageId)
        const toIndex = fromIndex + direction
        if (fromIndex < 0 || toIndex < 0 || toIndex >= items.length) return c
        const [moving] = items.splice(fromIndex, 1)
        items.splice(toIndex, 0, moving)
        return { ...c, images: items }
      }),
    )
  }

  const patchFloatingCarouselImage = (carouselId, imageId, patch) => {
    setFloatingCarousels((current) =>
      current.map((c) =>
        c.id === carouselId
          ? { ...c, images: (c.images || []).map((img) => (img.id === imageId ? { ...img, ...patch } : img)) }
          : c,
      ),
    )
  }

  const handleFloatingCarouselImageFile = async (carouselId, imageId, file) => {
    if (!file) return

    try {
      const dataUrl = await readFileAsDataUrl(file)
      // only update the image source when replacing file; keep existing alt/caption
      patchFloatingCarouselImage(carouselId, imageId, { src: dataUrl })
    } catch (error) {
      setAiError(error.message)
    }
  }

  const patchCarouselImage = (sectionId, imageId, patch) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId && section.type === SECTION_TYPES.CAROUSEL
          ? {
              ...section,
              images: (section.images || []).map((image) =>
                image.id === imageId ? { ...image, ...patch } : image,
              ),
            }
          : section,
      ),
    )
  }

  const addCarouselImage = (sectionId) => {
    const nextImage = createCarouselImage()

    setSections((current) =>
      current.map((section) =>
        section.id === sectionId && section.type === SECTION_TYPES.CAROUSEL
          ? {
              ...section,
              images: [...(section.images || []), nextImage],
            }
          : section,
      ),
    )

    setActiveSectionId(sectionId)
    setActiveCarouselImageId(nextImage.id)
  }

  const removeCarouselImage = (sectionId, imageId) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId && section.type === SECTION_TYPES.CAROUSEL
          ? {
              ...section,
              images: (section.images || []).filter((image) => image.id !== imageId),
            }
          : section,
      ),
    )

    setActiveCarouselImageId((current) => (current === imageId ? null : current))
  }

  const moveCarouselImage = (sectionId, imageId, direction) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId || section.type !== SECTION_TYPES.CAROUSEL) {
          return section
        }

        const nextImages = [...(section.images || [])]
        const fromIndex = nextImages.findIndex((image) => image.id === imageId)
        const targetIndex = fromIndex + direction

        if (fromIndex < 0 || targetIndex < 0 || targetIndex >= nextImages.length) {
          return section
        }

        const [movingImage] = nextImages.splice(fromIndex, 1)
        nextImages.splice(targetIndex, 0, movingImage)

        return {
          ...section,
          images: nextImages,
        }
      }),
    )
  }

  const updateNavigationLink = (sectionId, linkId, patch) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId || section.type !== SECTION_TYPES.NAVIGATION) {
          return section
        }

        return {
          ...section,
          links: normalizeNavigationLinks(section.links).map((link) =>
            link.id === linkId ? { ...link, ...patch } : link,
          ),
        }
      }),
    )
  }

  const addNavigationLink = (sectionId) => {
    const nextLink = createNavigationLink('New Link', 'new-link.html')

    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId || section.type !== SECTION_TYPES.NAVIGATION) {
          return section
        }

        return {
          ...section,
          links: [...normalizeNavigationLinks(section.links), nextLink],
        }
      }),
    )
  }

  const removeNavigationLink = (sectionId, linkId) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId || section.type !== SECTION_TYPES.NAVIGATION) {
          return section
        }

        return {
          ...section,
          links: normalizeNavigationLinks(section.links).filter((link) => link.id !== linkId),
        }
      }),
    )
  }

  const patchNestedItem = (sectionId, itemId, patch) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== sectionId || section.type !== SECTION_TYPES.BLOCK) {
          return section
        }

        return {
          ...section,
          nestedItems: (section.nestedItems || []).map((item) =>
            item.id === itemId ? { ...item, ...patch } : item,
          ),
        }
      }),
    )
  }

  const addNestedItemToBlock = (blockId, type) => {
    const nextItem = createNestedItem(type)

    setSections((current) =>
      current.map((section) =>
        section.id === blockId && section.type === SECTION_TYPES.BLOCK
          ? { ...section, nestedItems: [...(section.nestedItems || []), nextItem] }
          : section,
      ),
    )

    setActiveSectionId(blockId)
    setActiveNestedItemId(nextItem.id)
  }

  const updateNestedItemSelection = (blockId, itemId) => {
    setActiveSectionId(blockId)
    setActiveNestedItemId(itemId)
  }

  const removeNestedItemFromBlock = (blockId, itemId) => {
    setSections((current) =>
      current.map((section) =>
        section.id === blockId && section.type === SECTION_TYPES.BLOCK
          ? {
              ...section,
              nestedItems: (section.nestedItems || []).filter((item) => item.id !== itemId),
            }
          : section,
      ),
    )

    setActiveNestedItemId((current) => (current === itemId ? null : current))
  }

  const moveNestedItemInBlock = (blockId, itemId, direction) => {
    setSections((current) =>
      current.map((section) => {
        if (section.id !== blockId || section.type !== SECTION_TYPES.BLOCK) {
          return section
        }

        const items = [...(section.nestedItems || [])]
        const fromIndex = items.findIndex((item) => item.id === itemId)
        if (fromIndex < 0) {
          return section
        }

        const targetIndex = fromIndex + direction
        if (targetIndex < 0 || targetIndex >= items.length) {
          return section
        }

        const [movingItem] = items.splice(fromIndex, 1)
        items.splice(targetIndex, 0, movingItem)

        return {
          ...section,
          nestedItems: items,
        }
      }),
    )
  }

  const startNestedItemDrag = (event, sectionId, currentOffset = 0, nestedItemId = null) => {
    // ensure section and nested item are selected when user begins interaction
    setActiveSectionId(sectionId)
    setActiveNestedItemId(nestedItemId)
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget?.setPointerCapture?.(event.pointerId)

    const startX = event.clientX
    const initialOffset = currentOffset
    const dragLimit = Math.max(1000, Math.round(window.innerWidth * 0.8))

    const handleMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX
      const nextOffset = Math.max(-dragLimit, Math.min(dragLimit, initialOffset + delta))

      patchNestedItem(sectionId, nestedItemId, { offsetX: nextOffset })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      setDraggingImage(null)
    }

    setDraggingImage({ sectionId, isNested: true, nestedItemId })
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const startImageDrag = (event, sectionId, currentOffset = 0, isNested = false, nestedItemId = null) => {
    if (isNested) {
      startNestedItemDrag(event, sectionId, currentOffset, nestedItemId)
      return
    }
    // select the section image being interacted with
    setActiveSectionId(sectionId)
    setActiveNestedItemId(null)
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget?.setPointerCapture?.(event.pointerId)

    const startX = event.clientX
    const initialOffset = currentOffset
    const dragLimit = 300

    const handleMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX
      const nextOffset = Math.max(-dragLimit, Math.min(dragLimit, initialOffset + delta))

      patchSection(sectionId, { offsetX: nextOffset })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      setDraggingImage(null)
    }

    setDraggingImage({ sectionId, isNested: false, nestedItemId: null })
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const startButtonDrag = (event, sectionId, currentOffsetX = 0, currentOffsetY = 0) => {
    // select either a section-level button or a floating button
    const isSectionButton = sections.find((s) => s.id === sectionId && s.type === SECTION_TYPES.BUTTON)
    if (isSectionButton) {
      setActiveSectionId(sectionId)
      setActiveFloatingButtonId(null)
    } else {
      setActiveSectionId(null)
      setActiveFloatingButtonId(sectionId)
    }
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget?.setPointerCapture?.(event.pointerId)

    const startX = event.clientX
    const startY = event.clientY
    const initialOffsetX = currentOffsetX
    const initialOffsetY = currentOffsetY
    const dragLimit = Math.max(1000, Math.round(window.innerWidth * 0.8))

    const handleMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      patchFloatingButton(sectionId, {
        offsetX: Math.max(-dragLimit, Math.min(dragLimit, initialOffsetX + deltaX)),
        offsetY: Math.max(-dragLimit, Math.min(dragLimit, initialOffsetY + deltaY)),
      })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      setDraggingButton(null)
    }

    setDraggingButton({ sectionId })
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const startFloatingTextDrag = (event, textId, currentOffsetX = 0, currentOffsetY = 0) => {
    // select floating text being interacted with
    setActiveSectionId(null)
    setActiveFloatingTextId(textId)
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget?.setPointerCapture?.(event.pointerId)

    const startX = event.clientX
    const startY = event.clientY
    const initialOffsetX = currentOffsetX
    const initialOffsetY = currentOffsetY
    const dragLimit = Math.max(1000, Math.round(window.innerWidth * 0.8))

    const handleMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      patchFloatingText(textId, {
        offsetX: Math.max(-dragLimit, Math.min(dragLimit, initialOffsetX + deltaX)),
        offsetY: Math.max(-dragLimit, Math.min(dragLimit, initialOffsetY + deltaY)),
      })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      setDraggingFloatingText(null)
    }

    setDraggingFloatingText({ textId })
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const startFloatingImageDrag = (event, imageId, currentOffsetX = 0, currentOffsetY = 0) => {
    // select floating image being interacted with
    setActiveSectionId(null)
    setActiveFloatingImageId(imageId)
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget?.setPointerCapture?.(event.pointerId)

    const startX = event.clientX
    const startY = event.clientY
    const initialOffsetX = currentOffsetX
    const initialOffsetY = currentOffsetY
    const dragLimit = Math.max(1000, Math.round(window.innerWidth * 0.8))

    const handleMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      patchFloatingImage(imageId, {
        offsetX: Math.max(-dragLimit, Math.min(dragLimit, initialOffsetX + deltaX)),
        offsetY: Math.max(-dragLimit, Math.min(dragLimit, initialOffsetY + deltaY)),
      })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      setDraggingFloatingImage(null)
    }

    setDraggingFloatingImage({ imageId })
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const startFloatingCarouselDrag = (event, carouselId, currentOffsetX = 0, currentOffsetY = 0) => {
    // select floating carousel being interacted with
    setActiveSectionId(null)
    setActiveFloatingCarouselId(carouselId)
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget?.setPointerCapture?.(event.pointerId)

    const startX = event.clientX
    const startY = event.clientY
    const initialOffsetX = currentOffsetX
    const initialOffsetY = currentOffsetY
    const dragLimit = Math.max(1000, Math.round(window.innerWidth * 0.8))

    const handleMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      patchFloatingCarousel(carouselId, {
        offsetX: Math.max(-dragLimit, Math.min(dragLimit, initialOffsetX + deltaX)),
        offsetY: Math.max(-dragLimit, Math.min(dragLimit, initialOffsetY + deltaY)),
      })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      setDraggingFloatingCarousel(null)
    }

    setDraggingFloatingCarousel({ carouselId })
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const startFloatingImageResize = (
    event,
    imageId,
    currentWidth = 320,
    currentHeight = 220,
    direction,
    currentOffsetX = 0,
    currentOffsetY = 0,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startY = event.clientY
    const initialWidth = currentWidth || 320
    const initialHeight = currentHeight || 220
    const initialOffsetX = currentOffsetX || 0
    const initialOffsetY = currentOffsetY || 0

    const handleMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      if (direction === 'left') {
        const nextWidth = Math.max(120, Math.min(1200, initialWidth - deltaX))
        const widthDelta = initialWidth - nextWidth
        patchFloatingImage(imageId, {
          width: nextWidth,
          offsetX: initialOffsetX + widthDelta,
        })
        return
      }

      if (direction === 'right') {
        const nextWidth = Math.max(120, Math.min(1200, initialWidth + deltaX))
        patchFloatingImage(imageId, { width: nextWidth })
        return
      }

      if (direction === 'top') {
        const nextHeight = Math.max(80, Math.min(900, initialHeight - deltaY))
        const heightDelta = initialHeight - nextHeight
        patchFloatingImage(imageId, {
          height: nextHeight,
          offsetY: initialOffsetY + heightDelta,
        })
        return
      }

      const nextHeight = Math.max(80, Math.min(900, initialHeight + deltaY))
      patchFloatingImage(imageId, { height: nextHeight })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      setResizingFloatingImage(null)
    }

    setResizingFloatingImage({ imageId, direction })
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const startFloatingCarouselResize = (
    event,
    carouselId,
    currentWidth = 480,
    currentHeight = 630,
    direction,
    currentOffsetX = 0,
    currentOffsetY = 0,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startY = event.clientY
    const initialWidth = currentWidth || 480
    const initialHeight = currentHeight || 630
    const initialOffsetX = currentOffsetX || 0
    const initialOffsetY = currentOffsetY || 0

    const handleMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY

      if (direction === 'left') {
        const nextWidth = Math.max(120, Math.min(1600, initialWidth - deltaX))
        const widthDelta = initialWidth - nextWidth
        patchFloatingCarousel(carouselId, {
          width: nextWidth,
          offsetX: initialOffsetX + widthDelta,
        })
        return
      }

      if (direction === 'right') {
        const nextWidth = Math.max(120, Math.min(1600, initialWidth + deltaX))
        patchFloatingCarousel(carouselId, { width: nextWidth })
        return
      }

      if (direction === 'top') {
        const nextHeight = Math.max(120, Math.min(1200, initialHeight - deltaY))
        const heightDelta = initialHeight - nextHeight
        patchFloatingCarousel(carouselId, {
          height: nextHeight,
          offsetY: initialOffsetY + heightDelta,
        })
        return
      }

      const nextHeight = Math.max(120, Math.min(1200, initialHeight + deltaY))
      patchFloatingCarousel(carouselId, { height: nextHeight })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      setResizingFloatingCarousel(null)
    }

    setResizingFloatingCarousel({ carouselId, direction })
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Unable to read the selected file.'))
      reader.readAsDataURL(file)
    })

  const handleImageFile = async (sectionId, file, isNested = false, nestedItemId = null) => {
    if (!file) return

    try {
      const dataUrl = await readFileAsDataUrl(file)

      if (isNested) {
        patchNestedItem(sectionId, nestedItemId, {
          type: SECTION_TYPES.IMAGE,
          src: dataUrl,
          alt: file.name,
          caption: file.name,
          width: 100,
          height: 220,
          position: 'center',
          offsetX: 0,
        })
        return
      }

      patchSection(sectionId, {
        src: dataUrl,
        alt: file.name,
        caption: file.name,
        width: 100,
        height: 260,
        position: 'center',
        offsetX: 0,
      })
    } catch (error) {
      setAiError(error.message)
    }
  }

  const handleNavigationLogoFile = async (sectionId, file, side) => {
    if (!file) return

    try {
      const dataUrl = await readFileAsDataUrl(file)
      patchSection(sectionId, {
        [side]: {
          src: dataUrl,
          alt: file.name,
        },
        [side === 'logoLeft' ? 'logoLeftEnabled' : 'logoRightEnabled']: true,
      })
    } catch (error) {
      setAiError(error.message)
    }
  }

  const handleFloatingImageFile = async (imageId, file) => {
    if (!file) return

    try {
      const dataUrl = await readFileAsDataUrl(file)
      // only update the image source when replacing file; keep existing alt/caption
      patchFloatingImage(imageId, {
        src: dataUrl,
      })
    } catch (error) {
      setAiError(error.message)
    }
  }

  const processWithAi = async (mode) => {
    if (!inputText.trim()) {
      setAiError('Enter text first.')
      return
    }

    setIsProcessing(true)
    setAiError('')

    try {
      const response = await fetch('/api/process-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText, mode }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to process text.')
      }

      setAiOutput(payload.output)

      if (activeSection && activeSection.type === SECTION_TYPES.TEXT) {
        patchSection(activeSection.id, { text: payload.output })
      }
    } catch (error) {
      setAiError(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const addAiOutputAsSection = () => {
    if (!aiOutput.trim()) return

    const next = {
      ...createSection(SECTION_TYPES.TEXT),
      text: aiOutput,
    }

    setSections((current) => [...current, next])
    setActiveSectionId(next.id)
  }

  const onPaletteDragStart = (event, type) => {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/x-builder-new-section', type)
  }

  const onSectionDragStart = (event, sectionId) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/x-builder-section-id', sectionId)
    setActiveSectionId(sectionId)
  }

  const onDropZoneEnter = (event, zoneIndex) => {
    event.preventDefault()
    setDropIndex(zoneIndex)
  }

  const onDropZoneDrop = (event, zoneIndex) => {
    event.preventDefault()

    const newType = event.dataTransfer.getData('application/x-builder-new-section')
    const draggingId = event.dataTransfer.getData('application/x-builder-section-id')

    if (newType && Object.values(SECTION_TYPES).includes(newType)) {
      if (newType === SECTION_TYPES.BUTTON) {
        const nextButton = createSection(SECTION_TYPES.BUTTON)
        setFloatingButtons((current) => [...current, { ...nextButton, offsetX: 24, offsetY: 24 }])
        setActiveSectionId(null)
        setActiveFloatingButtonId(nextButton.id)
        setActiveFloatingTextId(null)
        setActiveFloatingImageId(null)
        setDropIndex(null)
        return
      }

      if (newType === SECTION_TYPES.TEXT) {
        const nextText = createSection(SECTION_TYPES.TEXT)
        setFloatingTexts((current) => [
          ...current,
          {
            id: nextText.id,
            type: SECTION_TYPES.TEXT,
            text: nextText.text,
            align: nextText.align,
            width: 280,
            offsetX: 24,
            offsetY: 24,
          },
        ])
        setActiveSectionId(null)
        setActiveFloatingButtonId(null)
        setActiveFloatingTextId(nextText.id)
        setActiveFloatingImageId(null)
        setDropIndex(null)
        return
      }

      if (newType === SECTION_TYPES.IMAGE) {
        const nextImage = createSection(SECTION_TYPES.IMAGE)
        setFloatingImages((current) => [
          ...current,
          {
            id: nextImage.id,
            type: SECTION_TYPES.IMAGE,
            src: nextImage.src,
            alt: nextImage.alt,
            caption: nextImage.caption,
            width: 320,
            height: nextImage.height || 220,
            offsetX: 24,
            offsetY: 24,
          },
        ])
        setActiveSectionId(null)
        setActiveFloatingButtonId(null)
        setActiveFloatingTextId(null)
        setActiveFloatingImageId(nextImage.id)
        setDropIndex(null)
        return
      }

      if (newType === SECTION_TYPES.CAROUSEL) {
        const nextCarousel = createSection(SECTION_TYPES.CAROUSEL)
        setFloatingCarousels((current) => [
          ...current,
          {
            id: nextCarousel.id,
            type: SECTION_TYPES.CAROUSEL,
            images: nextCarousel.images,
            autoplay: nextCarousel.autoplay,
            interval: nextCarousel.interval,
            height: nextCarousel.height || 630,
            showCaptions: nextCarousel.showCaptions,
            loop: nextCarousel.loop,
            align: nextCarousel.align || 'center',
            offsetX: 24,
            offsetY: 24,
            width: 480,
          },
        ])
        setActiveSectionId(null)
        setActiveFloatingButtonId(null)
        setActiveFloatingTextId(null)
        setActiveFloatingImageId(null)
        setActiveFloatingCarouselId(nextCarousel.id)
        setActiveFloatingCarouselImageId(nextCarousel.images?.[0]?.id ?? null)
        setDropIndex(null)
        return
      }

      insertSectionAt(newType, zoneIndex)
      setDropIndex(null)
      return
    }

    if (draggingId) {
      setSections((current) => reorderByDropZone(current, draggingId, zoneIndex))
    }

    setDropIndex(null)
  }

  const onBlockImageDrop = (event, blockId) => {
    event.preventDefault()
    event.stopPropagation()

    const newType = event.dataTransfer.getData('application/x-builder-new-section')
    const draggingId = event.dataTransfer.getData('application/x-builder-section-id')

    if (newType === SECTION_TYPES.IMAGE) {
      addNestedItemToBlock(blockId, SECTION_TYPES.IMAGE)
      setDropIndex(null)
      return
    }

    if (newType === SECTION_TYPES.TEXT) {
      addNestedItemToBlock(blockId, SECTION_TYPES.TEXT)
      setDropIndex(null)
      return
    }

    if (draggingId) {
      const draggedSection = sections.find(
        (section) =>
          section.id === draggingId &&
          (section.type === SECTION_TYPES.IMAGE || section.type === SECTION_TYPES.TEXT),
      )

      if (draggedSection) {
        const nextItem =
          draggedSection.type === SECTION_TYPES.TEXT
            ? createNestedText(draggedSection.text)
            : createNestedImage(draggedSection)

        setSections((current) =>
          current
            .filter((section) => section.id !== draggingId)
            .map((section) =>
              section.id === blockId && section.type === SECTION_TYPES.BLOCK
                ? { ...section, nestedItems: [...(section.nestedItems || []), nextItem] }
                : section,
            ),
        )

        setActiveSectionId(blockId)
        setActiveNestedItemId(nextItem.id)
      }
    }

    setDropIndex(null)
  }

  const onDragEnd = () => {
    setDropIndex(null)
    setResizingSectionId(null)
    setResizingImage(null)
    setDraggingImage(null)
    setDraggingButton(null)
    setDraggingFloatingText(null)
    setDraggingFloatingImage(null)
    setDraggingFloatingCarousel(null)
    setResizingFloatingImage(null)
  }

  const startImageResize = (event, sectionId, currentWidth, direction, isNested = false, nestedItemId = null) => {
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const initialWidth = currentWidth ?? 100

    const handleMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX
      const nextWidth =
        direction === 'left'
          ? Math.max(10, Math.min(100, initialWidth - (delta / 2)))
          : Math.max(10, Math.min(100, initialWidth + (delta / 2)))

      if (isNested) {
        patchNestedItem(sectionId, nestedItemId, { width: nextWidth })
        return
      }

      patchSection(sectionId, { width: nextWidth })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      setResizingImage(null)
    }

    setResizingImage({ sectionId, direction, isNested, nestedItemId })
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const startResize = (event, sectionId, currentHeight) => {
    event.preventDefault()
    event.stopPropagation()

    const startY = event.clientY
    const initialHeight = currentHeight ?? 140

    const handleMove = (moveEvent) => {
      const delta = moveEvent.clientY - startY
      const nextHeight = Math.max(90, initialHeight + delta)
      patchSection(sectionId, { height: nextHeight })
    }

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      setResizingSectionId(null)
    }

    setResizingSectionId(sectionId)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const exportHtml = () => {
    exportHtmlFile({ pageName, pageTitle, htmlPreview })
  }

  const exportLayout = () => {
    exportLayoutFile({
      activePageId,
      pages,
      normalizePage,
    })
  }

  const saveToFirestore = async () => {
    if (!firebaseReady) {
      setFirebaseStatus('Configure Firebase env vars first.')
      return
    }

    try {
      setFirebaseStatus('Saving to Firestore...')
      await setDoc(doc(firebaseReady, 'pages', 'main'), {
        activePageId,
        pages: pages.map(normalizePage),
        updatedAt: serverTimestamp(),
      })
      setFirebaseStatus('Saved to Firestore.')
    } catch (error) {
      setFirebaseStatus(error.message)
    }
  }

  const loadFromFirestore = async () => {
    if (!firebaseReady) {
      setFirebaseStatus('Configure Firebase env vars first.')
      return
    }

    try {
      setFirebaseStatus('Loading from Firestore...')
      const snapshot = await getDoc(doc(firebaseReady, 'pages', 'main'))

      if (!snapshot.exists()) {
        setFirebaseStatus('No saved page found in Firestore.')
        return
      }

      const data = snapshot.data()
      if (Array.isArray(data.pages) && data.pages.length > 0) {
        const loadedPages = data.pages.map((page) => normalizePage(page))
        setPages(loadedPages)
        setActivePageId(data.activePageId && loadedPages.some((page) => page.id === data.activePageId) ? data.activePageId : loadedPages[0].id)
      } else {
        const legacySections = Array.isArray(data.sections)
          ? data.sections.map((section) => normalizeFooterSectionInApp(normalizeNavigationSection(section)))
          : []
        const legacyButtons = legacySections.filter((section) => section.type === SECTION_TYPES.BUTTON)
        const legacyTexts = legacySections.filter((section) => section.type === SECTION_TYPES.TEXT)
        const legacyImages = legacySections.filter((section) => section.type === SECTION_TYPES.IMAGE)
        const restoredPage = createPage(data.pageName || data.pageTitle || 'Home', {
          pageTitle: data.pageTitle || 'My Page Title',
          sections: legacySections.filter(
            (section) =>
              section.type !== SECTION_TYPES.BUTTON &&
              section.type !== SECTION_TYPES.TEXT &&
              section.type !== SECTION_TYPES.IMAGE,
          ),
          floatingButtons:
            Array.isArray(data.floatingButtons) && data.floatingButtons.length > 0
              ? data.floatingButtons
              : legacyButtons.map((button) => ({ ...button, offsetX: button.offsetX || 24, offsetY: button.offsetY || 24 })),
          floatingTexts:
            Array.isArray(data.floatingTexts) && data.floatingTexts.length > 0
              ? data.floatingTexts
              : legacyTexts.map((section, index) => ({
                  id: section.id,
                  type: SECTION_TYPES.TEXT,
                  text: section.text || 'Add your paragraph text here.',
                  align: section.align || 'left',
                  width: 280,
                  offsetX: section.offsetX || 24,
                  offsetY: section.offsetY || 24 + index * 48,
                })),
          floatingImages:
            Array.isArray(data.floatingImages) && data.floatingImages.length > 0
              ? data.floatingImages
              : legacyImages.map((section, index) => ({
                  id: section.id,
                  type: SECTION_TYPES.IMAGE,
                  src: section.src || '',
                  alt: section.alt || 'Image',
                  caption: section.caption || 'Image caption',
                  width: 320,
                  height: section.height || 220,
                  offsetX: section.offsetX || 24,
                  offsetY: section.offsetY || 24 + index * 48,
                })),
        })
        setPages([restoredPage])
        setActivePageId(restoredPage.id)
      }
      setActiveSectionId(null)
      setActiveFloatingButtonId(null)
      setActiveFloatingTextId(null)
      setActiveFloatingImageId(null)
      setActiveCarouselImageId(null)
      setFirebaseStatus('Loaded from Firestore.')
    } catch (error) {
      setFirebaseStatus(error.message)
    }
  }

  return (
    <div className={`wireframe-app ${isEditorCollapsed ? 'editor-collapsed' : ''} ${overlayOpen ? 'editor-overlay-open' : ''}`}>
        <aside
          className="left-rail"
          onMouseLeave={() => {
            if (!keepEditorOpenOnLeave) {
              setOverlayOpen(false)
              setIsEditorCollapsed(true)
            }
          }}
          onMouseEnter={() => {
            // keep overlay open while mouse is over the rail
            setOverlayOpen(true)
            setIsEditorCollapsed(false)
          }}
        >
          <PageControlsPanel
          pages={pages}
          activePageId={activePageId}
          selectPage={selectPage}
          pageName={pageName}
          renameActivePage={renameActivePage}
          addPage={addPage}
          duplicateActivePage={duplicateActivePage}
          activePage={activePage}
          deleteActivePage={deleteActivePage}
        />

        <PageTitlePanel pageTitle={pageTitle} setPageTitle={setPageTitle} />

        <ComponentPalettePanel
          sectionTypes={SECTION_TYPES}
          sectionLabels={SECTION_LABELS}
          onPaletteDragStart={onPaletteDragStart}
          addSection={addSection}
        >
          <SectionInspector
            sectionTypes={SECTION_TYPES}
            sectionLabels={SECTION_LABELS}
            activeSection={activeSection}
            activeFloatingButton={activeFloatingButton}
            activeFloatingText={activeFloatingText}
            activeFloatingImage={activeFloatingImage}
            activeFloatingCarousel={activeFloatingCarousel}
            activeFloatingCarouselImageId={activeFloatingCarouselImageId}
            activeCarouselImage={activeCarouselImage}
            activeNavigationLinks={activeNavigationLinks}
            activeNestedItem={activeNestedItem}
            activeNestedItemId={activeNestedItemId}
            imageInputRef={imageInputRef}
            nestedImageInputRef={nestedImageInputRef}
            patchSection={patchSection}
            addNestedItemToBlock={addNestedItemToBlock}
            updateNestedItemSelection={updateNestedItemSelection}
            moveNestedItemInBlock={moveNestedItemInBlock}
            removeNestedItemFromBlock={removeNestedItemFromBlock}
            patchNestedItem={patchNestedItem}
            handleImageFile={handleImageFile}
            patchFloatingButton={patchFloatingButton}
            setFloatingButtons={setFloatingButtons}
            setActiveFloatingButtonId={setActiveFloatingButtonId}
            patchFloatingText={patchFloatingText}
            setFloatingTexts={setFloatingTexts}
            setActiveFloatingTextId={setActiveFloatingTextId}
            patchFloatingImage={patchFloatingImage}
            setFloatingImages={setFloatingImages}
            setActiveFloatingImageId={setActiveFloatingImageId}
            handleFloatingImageFile={handleFloatingImageFile}
            patchFloatingCarousel={patchFloatingCarousel}
            addFloatingCarouselImage={addFloatingCarouselImage}
            removeFloatingCarouselImage={removeFloatingCarouselImage}
            moveFloatingCarouselImage={moveFloatingCarouselImage}
            patchFloatingCarouselImage={patchFloatingCarouselImage}
            handleFloatingCarouselImageFile={handleFloatingCarouselImageFile}
            setActiveSectionId={setActiveSectionId}
            setActiveFloatingCarouselId={setActiveFloatingCarouselId}
            setFloatingCarousels={setFloatingCarousels}
            setActiveFloatingCarouselImageId={setActiveFloatingCarouselImageId}
            activeCarouselImageId={activeCarouselImageId}
            setActiveCarouselImageId={setActiveCarouselImageId}
            patchCarouselImage={patchCarouselImage}
            addCarouselImage={addCarouselImage}
            removeCarouselImage={removeCarouselImage}
            moveCarouselImage={moveCarouselImage}
            addNavigationLink={addNavigationLink}
            updateNavigationLink={updateNavigationLink}
            removeNavigationLink={removeNavigationLink}
            handleNavigationLogoFile={handleNavigationLogoFile}
            removeSection={removeSection}
          />
        </ComponentPalettePanel>

        {/* Left-edge hover trigger (moved below aside so it's clickable when rail is collapsed) */}


        <SummariserPanel
          inputText={inputText}
          setInputText={setInputText}
          processWithAi={processWithAi}
          isProcessing={isProcessing}
          aiError={aiError}
          aiOutput={aiOutput}
          setAiOutput={setAiOutput}
          addAiOutputAsSection={addAiOutputAsSection}
        />

        <ExportPanel
          exportHtml={exportHtml}
          exportLayout={exportLayout}
          saveToFirestore={saveToFirestore}
          loadFromFirestore={loadFromFirestore}
          firebaseStatus={firebaseStatus}
        />

        {/* Theme selector removed per request */}

        <div className="rail-box" style={{ padding: '8px' }}>
          <button
            type="button"
            className="editor-toggle-panel-btn"
            onClick={() => setIsEditorCollapsed((current) => !current)}
          >
            {isEditorCollapsed ? '👁️ Show' : '👁️ Hide'}
          </button>
        </div>
        <div className="rail-box" style={{ padding: '8px' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={keepEditorOpenOnLeave}
              onChange={(e) => {
                const v = e.target.checked
                setKeepEditorOpenOnLeave(v)
                try { localStorage.setItem('keepEditorOpenOnLeave', v ? 'true' : 'false') } catch (err) {}
              }}
            />
            <span style={{ fontSize: 12 }}>Keep editor open on mouse leave</span>
          </label>
        </div>
      </aside>

      {/* Left-edge hover trigger (outside the left-rail so it's clickable when collapsed) */}
      <div
        className="edge-trigger"
        onClick={() => {
          // open the editor by un-collapsing the left rail
          setIsEditorCollapsed(false)
        }}
        role="button"
        aria-label="Open editor"
      />

      <PreviewStage
        isEditorCollapsed={isEditorCollapsed}
        setIsEditorCollapsed={setIsEditorCollapsed}
        onDragEnd={onDragEnd}
        dropIndex={dropIndex}
        onDropZoneEnter={onDropZoneEnter}
        onDropZoneDrop={onDropZoneDrop}
        sections={sections}
        activeSectionId={activeSectionId}
        setActiveSectionId={setActiveSectionId}
        setActiveFloatingButtonId={setActiveFloatingButtonId}
        setActiveFloatingTextId={setActiveFloatingTextId}
        setActiveFloatingImageId={setActiveFloatingImageId}
        setActiveCarouselImageId={setActiveCarouselImageId}
        resizingSectionId={resizingSectionId}
        startResize={startResize}
        sectionTypes={SECTION_TYPES}
        draggingImage={draggingImage}
        startImageDrag={startImageDrag}
        resizingImage={resizingImage}
        startImageResize={startImageResize}
        onBlockImageDrop={onBlockImageDrop}
        setDropIndex={setDropIndex}
        groupNestedItemsByLevel={groupNestedItemsByLevel}
        activeNestedItemId={activeNestedItemId}
        setActiveNestedItemId={setActiveNestedItemId}
        startNestedItemDrag={startNestedItemDrag}
        getNestedImageWidth={getNestedImageWidth}
        getNestedTextWidth={getNestedTextWidth}
        draggingButton={draggingButton}
        startButtonDrag={startButtonDrag}
        floatingButtons={floatingButtons}
        floatingTexts={floatingTexts}
        floatingImages={floatingImages}
        draggingFloatingText={draggingFloatingText}
        draggingFloatingImage={draggingFloatingImage}
        startFloatingTextDrag={startFloatingTextDrag}
        startFloatingImageDrag={startFloatingImageDrag}
        resizingFloatingImage={resizingFloatingImage}
        startFloatingImageResize={startFloatingImageResize}
        floatingCarousels={floatingCarousels}
        draggingFloatingCarousel={draggingFloatingCarousel}
        startFloatingCarouselDrag={startFloatingCarouselDrag}
        resizingFloatingCarousel={resizingFloatingCarousel}
        startFloatingCarouselResize={startFloatingCarouselResize}
        activeFloatingCarouselId={activeFloatingCarouselId}
        setActiveFloatingCarouselId={setActiveFloatingCarouselId}
        setActiveFloatingCarouselImageId={setActiveFloatingCarouselImageId}
        onSectionDragStart={onSectionDragStart}
      />
      {/* overlay controlled by left-rail mouse events and the edge trigger */}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
