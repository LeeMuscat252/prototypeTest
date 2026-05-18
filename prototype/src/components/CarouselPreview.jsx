import { useEffect, useState } from 'react'

export default function CarouselPreview({ section, onSelect }) {
  const images = Array.isArray(section.images) ? section.images.filter(Boolean) : []
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (activeIndex >= images.length) {
      setActiveIndex(0)
    }
  }, [activeIndex, images.length])

  useEffect(() => {
    setActiveIndex(0)
  }, [section.id])

  useEffect(() => {
    if (!section.autoplay || images.length < 2) {
      return undefined
    }

    const delay = Math.max(1000, Number(section.interval) || 4000)
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length)
    }, delay)

    return () => window.clearInterval(timer)
  }, [images.length, section.autoplay, section.interval])

  if (images.length === 0) {
    return <div className="carousel-empty-state">No images configured for this carousel.</div>
  }

  const showCaptions = section.showCaptions !== false

  const goToSlide = (delta) => {
    setActiveIndex((current) => (current + delta + images.length) % images.length)
  }

    return (
    <div className={`carousel-preview align-${section.align || 'center'}`} style={{ height: `${section.height || 320}px` }}>
      <div className="carousel-viewport">
        <div className="carousel-track" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
          {images.map((image, index) => (
            <figure key={image.id} className="carousel-slide" style={image.style || {}}>
              <img
                src={image.src}
                alt={image.alt || 'Carousel slide'}
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', ...(image.style || {}) }}
                onClick={() => onSelect?.(index)}
              />
            </figure>
          ))}
        </div>
      </div>

      <div className="carousel-footer">
        {showCaptions ? (
          <div className="carousel-caption" onClick={() => onSelect?.(activeIndex)}>{images[activeIndex]?.caption}</div>
        ) : null}
        <div className="carousel-controls">
          <button
            type="button"
            className="carousel-control-btn"
            onPointerDown={(event) => {
              event.stopPropagation()
            }}
            onClick={(event) => {
              onSelect?.(activeIndex)
              event.stopPropagation()
              goToSlide(-1)
            }}
          >
            Previous
          </button>
          <button
            type="button"
            className="carousel-control-btn"
            onPointerDown={(event) => {
              event.stopPropagation()
            }}
            onClick={(event) => {
              onSelect?.(activeIndex)
              event.stopPropagation()
              goToSlide(1)
            }}
          >
            Next
          </button>
        </div>

        <div className="carousel-indicators" aria-label="Carousel slides">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={`carousel-indicator ${index === activeIndex ? 'active' : ''}`}
              onPointerDown={(event) => {
                event.stopPropagation()
              }}
              onClick={(event) => {
                onSelect?.(index)
                event.stopPropagation()
                setActiveIndex(index)
              }}
              aria-label={`Show slide ${index + 1}`}
              aria-pressed={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </div>
  )
}