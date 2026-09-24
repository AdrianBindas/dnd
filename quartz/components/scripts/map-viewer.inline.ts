type MapPoint = {
  x: number
  y: number
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum)

function initializeMapViewer(container: HTMLElement) {
  const source = container.dataset.mapSrc
  if (!source || container.dataset.mapViewerReady === "true") return

  container.dataset.mapViewerReady = "true"

  const title = container.dataset.mapTitle ?? "Interactive map"
  const alt = container.dataset.mapAlt ?? title
  const imageUrl = new URL(source, document.baseURI).toString()

  container.innerHTML = `
    <div class="map-viewer-toolbar">
      <span class="map-viewer-title"></span>
      <span class="map-viewer-spacer"></span>
      <button type="button" class="map-viewer-button" data-map-action="zoom-out" aria-label="Zoom out">−</button>
      <button type="button" class="map-viewer-button map-viewer-reset" data-map-action="reset">Reset</button>
      <button type="button" class="map-viewer-button" data-map-action="zoom-in" aria-label="Zoom in">+</button>
      <a class="map-viewer-open" target="_blank" rel="noopener" aria-label="Open the full-resolution map">Open full size</a>
    </div>
    <div class="map-viewer-viewport" tabindex="0" role="application" aria-label="Interactive map">
      <div class="map-viewer-stage">
        <img class="map-viewer-image" draggable="false" alt="">
      </div>
      <div class="map-viewer-loading" role="status">Loading map…</div>
    </div>
    <div class="map-viewer-help">Drag to pan · scroll or use + / − to zoom · press 0 to reset</div>
  `

  const titleElement = container.querySelector(".map-viewer-title") as HTMLElement
  const viewport = container.querySelector(".map-viewer-viewport") as HTMLElement
  const stage = container.querySelector(".map-viewer-stage") as HTMLElement
  const image = container.querySelector(".map-viewer-image") as HTMLImageElement
  const loading = container.querySelector(".map-viewer-loading") as HTMLElement
  const openLink = container.querySelector(".map-viewer-open") as HTMLAnchorElement

  titleElement.textContent = title
  viewport.setAttribute("aria-label", alt)
  image.alt = alt
  openLink.href = imageUrl
  image.src = imageUrl

  let scale = 1
  let minimumScale = 0.1
  let maximumScale = 4
  let pan: MapPoint = { x: 0, y: 0 }
  let dragStart: MapPoint | null = null
  let pointerId: number | null = null
  let resizeObserver: ResizeObserver | null = null

  const updateTransform = () => {
    stage.style.transform = `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`
  }

  const fitMap = () => {
    if (!image.naturalWidth || !image.naturalHeight) return

    const horizontalScale = viewport.clientWidth / image.naturalWidth
    const verticalScale = viewport.clientHeight / image.naturalHeight
    minimumScale = Math.min(horizontalScale, verticalScale, 1)
    maximumScale = Math.max(4, minimumScale * 12)
    scale = minimumScale
    pan = { x: 0, y: 0 }
    updateTransform()
  }

  const setScale = (nextScale: number) => {
    scale = clamp(nextScale, minimumScale, maximumScale)
    updateTransform()
  }

  const zoom = (factor: number) => setScale(scale * factor)

  const reset = () => {
    fitMap()
  }

  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    zoom(event.deltaY < 0 ? 1.15 : 0.87)
  }

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.pointerType !== "touch") return
    pointerId = event.pointerId
    dragStart = { x: event.clientX - pan.x, y: event.clientY - pan.y }
    viewport.classList.add("is-dragging")
    viewport.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (dragStart === null || event.pointerId !== pointerId) return
    pan = { x: event.clientX - dragStart.x, y: event.clientY - dragStart.y }
    updateTransform()
  }

  const stopDragging = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return
    dragStart = null
    pointerId = null
    viewport.classList.remove("is-dragging")
    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId)
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault()
      zoom(1.15)
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault()
      zoom(0.87)
    } else if (event.key === "0") {
      event.preventDefault()
      reset()
    }
  }

  const zoomIn = container.querySelector('[data-map-action="zoom-in"]') as HTMLButtonElement
  const zoomOut = container.querySelector('[data-map-action="zoom-out"]') as HTMLButtonElement
  const resetButton = container.querySelector('[data-map-action="reset"]') as HTMLButtonElement

  const onZoomIn = () => zoom(1.15)
  const onZoomOut = () => zoom(0.87)
  const onImageLoad = () => {
    loading.remove()
    fitMap()
  }
  const onImageError = () => {
    loading.textContent = "The map could not be loaded."
    loading.classList.add("map-viewer-error")
  }

  const cleanup = () => {
    viewport.removeEventListener("wheel", onWheel)
    viewport.removeEventListener("pointerdown", onPointerDown)
    viewport.removeEventListener("pointermove", onPointerMove)
    viewport.removeEventListener("pointerup", stopDragging)
    viewport.removeEventListener("pointercancel", stopDragging)
    viewport.removeEventListener("keydown", onKeyDown)
    zoomIn.removeEventListener("click", onZoomIn)
    zoomOut.removeEventListener("click", onZoomOut)
    resetButton.removeEventListener("click", reset)
    image.removeEventListener("load", onImageLoad)
    image.removeEventListener("error", onImageError)
    resizeObserver?.disconnect()
  }

  viewport.addEventListener("wheel", onWheel, { passive: false })
  viewport.addEventListener("pointerdown", onPointerDown)
  viewport.addEventListener("pointermove", onPointerMove)
  viewport.addEventListener("pointerup", stopDragging)
  viewport.addEventListener("pointercancel", stopDragging)
  viewport.addEventListener("keydown", onKeyDown)
  zoomIn.addEventListener("click", onZoomIn)
  zoomOut.addEventListener("click", onZoomOut)
  resetButton.addEventListener("click", reset)
  image.addEventListener("load", onImageLoad)
  image.addEventListener("error", onImageError)

  resizeObserver = new ResizeObserver(() => fitMap())
  resizeObserver.observe(viewport)

  window.addCleanup(() => {
    cleanup()
    container.removeAttribute("data-map-viewer-ready")
  })
}

document.addEventListener("nav", () => {
  document.querySelectorAll<HTMLElement>(".map-viewer[data-map-src]").forEach(initializeMapViewer)
})
