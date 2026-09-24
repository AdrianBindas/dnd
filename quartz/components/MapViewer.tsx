import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore
import script from "./scripts/map-viewer.inline"
import style from "./styles/map-viewer.scss"

const MapViewer: QuartzComponent = () => null

MapViewer.css = style
MapViewer.afterDOMLoaded = script

export default (() => MapViewer) satisfies QuartzComponentConstructor
