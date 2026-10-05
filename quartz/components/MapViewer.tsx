import { QuartzComponent, QuartzComponentConstructor } from "./types"

// @ts-ignore: TypeScript doesn't know about Quartz's inline bundling system
import script from "./scripts/map-viewer.inline"

import style from "./styles/map-viewer.scss"

const MapViewer: QuartzComponent = () => null

MapViewer.css = style
MapViewer.afterDOMLoaded = script

export default (() => MapViewer) satisfies QuartzComponentConstructor