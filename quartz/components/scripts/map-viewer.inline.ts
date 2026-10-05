import Panzoom from "@panzoom/panzoom"

function initializeMapViewer(container: HTMLElement) {
  const source = container.dataset.mapSrc

  if (!source || container.dataset.mapViewerReady === "true") {
    return
  }

  const image = document.createElement("img")

  image.className = "map-viewer-image"
  image.alt =
    container.dataset.mapAlt ??
    container.dataset.mapTitle ??
    "Interactive map"
  image.draggable = false

  // --------------------------------------------------
  // Controls
  // --------------------------------------------------

  const controls = document.createElement("div")
  controls.className = "map-viewer-controls"

  const zoomOutButton = document.createElement("button")
  zoomOutButton.type = "button"
  zoomOutButton.className = "map-viewer-button"
  zoomOutButton.textContent = "−"
  zoomOutButton.setAttribute("aria-label", "Zoom out")
  zoomOutButton.title = "Zoom out"

  const resetButton = document.createElement("button")
  resetButton.type = "button"
  resetButton.className = "map-viewer-button"
  resetButton.textContent = "⟳"
  resetButton.setAttribute("aria-label", "Reset map")
  resetButton.title = "Reset map"

  const zoomInButton = document.createElement("button")
  zoomInButton.type = "button"
  zoomInButton.className = "map-viewer-button"
  zoomInButton.textContent = "+"
  zoomInButton.setAttribute("aria-label", "Zoom in")
  zoomInButton.title = "Zoom in"

  controls.append(
    zoomOutButton,
    resetButton,
    zoomInButton,
  )

  container.replaceChildren(image, controls)
  container.dataset.mapViewerReady = "true"

  let panzoom: ReturnType<typeof Panzoom> | undefined

  // --------------------------------------------------
  // Button handlers
  // --------------------------------------------------

  const handleZoomIn = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (!panzoom) return

    panzoom.zoomIn()
  }

  const handleZoomOut = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (!panzoom) return

    panzoom.zoomOut()
  }

  const handleReset = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (!panzoom) return

    panzoom.reset({
      animate: true,
    })
  }

  // --------------------------------------------------
  // Initialize Panzoom
  // --------------------------------------------------

  const initialize = () => {
    if (panzoom) return

    /*
     * Make the viewer exactly the same aspect ratio
     * as the image.
     */
    container.style.aspectRatio =
      `${image.naturalWidth} / ${image.naturalHeight}`

    panzoom = Panzoom(image, {
      /*
       * The image starts at its natural/container size.
       */
      startScale: 1,

      /*
       * Do not allow zooming below the initial size.
       */
      minScale: 1,

      /*
       * Maximum zoom level.
       */
      maxScale: 8,

      /*
       * Zoom amount for wheel, pinch and buttons.
       */
      step: 0.15,

      /*
       * IMPORTANT:
       *
       * "inside" would restrict maxScale to 1 because
       * the image and container are the same size.
       *
       * "outside" allows the image to grow larger than
       * the container when zooming.
       */
      contain: "outside",

      cursor: "grab",

      /*
       * Required for touch dragging and pinch zooming.
       */
      touchAction: "none",
    })

    /*
     * Mouse-wheel zoom.
     */
    container.addEventListener(
      "wheel",
      panzoom.zoomWithWheel,
      {
        passive: false,
      },
    )

    /*
     * Buttons.
     */
    zoomInButton.addEventListener(
      "click",
      handleZoomIn,
    )

    zoomOutButton.addEventListener(
      "click",
      handleZoomOut,
    )

    resetButton.addEventListener(
      "click",
      handleReset,
    )
  }

  // --------------------------------------------------
  // Wait for image dimensions
  // --------------------------------------------------

  image.addEventListener("load", initialize, {
    once: true,
  })

  image.src = new URL(
    source,
    document.baseURI,
  ).toString()

  // --------------------------------------------------
  // Quartz SPA cleanup
  // --------------------------------------------------

  window.addCleanup(() => {
    zoomInButton.removeEventListener(
      "click",
      handleZoomIn,
    )

    zoomOutButton.removeEventListener(
      "click",
      handleZoomOut,
    )

    resetButton.removeEventListener(
      "click",
      handleReset,
    )

    if (panzoom) {
      container.removeEventListener(
        "wheel",
        panzoom.zoomWithWheel,
      )

      panzoom.destroy()
      panzoom = undefined
    }

    container.style.removeProperty("aspect-ratio")

    container.removeAttribute(
      "data-map-viewer-ready",
    )
  })
}

document.addEventListener("nav", () => {
  document
    .querySelectorAll<HTMLElement>(
      ".map-viewer[data-map-src]",
    )
    .forEach(initializeMapViewer)
})