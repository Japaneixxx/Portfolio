export default function ZoomControls({ zoomIn, zoomOut, reset }) {
  return (
    <div className="zoom-controls">
      <button type="button" onClick={zoomIn} aria-label="Aumentar zoom">
        +
      </button>
      <button type="button" onClick={zoomOut} aria-label="Diminuir zoom">
        −
      </button>
      <button type="button" onClick={reset} aria-label="Resetar zoom">
        reset
      </button>
    </div>
  )
}
