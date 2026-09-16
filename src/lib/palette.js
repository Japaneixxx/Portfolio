// Cada categoria referencia uma dessas chaves de cor.
// Ajuste os tons aqui se quiser afinar a identidade visual mais tarde.
export const PALETTE = {
  cyan: { band: '#3ec9d6', border: '#3ec9d6', text: '#08181a' },
  coral: { band: '#e8804a', border: '#e8804a', text: '#1c0d05' },
  amber: { band: '#e0a83e', border: '#e0a83e', text: '#1c1204' },
  pink: { band: '#d66aa0', border: '#d66aa0', text: '#1c0c14' },
  purple: { band: '#8b7cf0', border: '#8b7cf0', text: '#120f24' },
  teal: { band: '#3ec99a', border: '#3ec99a', text: '#051a12' },
}

export function colorFor(colorKey) {
  return PALETTE[colorKey] || PALETTE.cyan
}
