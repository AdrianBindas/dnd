import Panzoom from "@panzoom/panzoom"

function initializeMapViewer(container: HTMLElement) {
  const source = container.dataset.mapSrc
  if (!source || container.dataset.mapViewerReady === "true") return

  const image = document.createElement("img")
  image.className = "map-viewer-image"
  image.alt = container.dataset.mapAlt ?? container.dataset.mapTitle ?? "Interactive map"
  image.draggable = false
  image.src = new URL(source, document.baseURI).toString()

  container.replaceChildren(image)
  container.dataset.mapViewerReady = "true"

  const panzoom = Panzoom(image, {
    maxScale: 8,
    minScale: 1,
    step: 0.15,
    contain: "outside",
    cursor: "grab",
  })

  container.addEventListener("wheel", panzoom.zoomWithWheel, { passive: false })

  window.addCleanup(() => {
    container.removeEventListener("wheel", panzoom.zoomWithWheel)
    panzoom.destroy()
    container.removeAttribute("data-map-viewer-ready")
  })
}

document.addEventListener("nav", () => {
  document
    .querySelectorAll<HTMLElement>(".map-viewer[data-map-src]")
    .forEach(initializeMapViewer)
})
