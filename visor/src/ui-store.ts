import { create } from 'zustand'

const KEY = 'camaras-visor-visto'

function yaVisto(): boolean {
  let visto = false
  try { visto = localStorage.getItem(KEY) === '1' } catch { /* sin almacenamiento */ }
  if (new URLSearchParams(location.search).has('sinlanding')) visto = true
  // Un enlace directo a la historia tampoco muestra la landing.
  if (new URLSearchParams(location.search).has('historia')) visto = true
  return visto
}

interface Ui {
  landing: boolean
  /** Ventana con las preguntas del proyecto. */
  preguntas: boolean
  openPreguntas: () => void
  closePreguntas: () => void
  tour: boolean
  tourStep: number
  story: boolean
  storyStep: number
  offTrack: boolean
  /** Corredor bajo el cursor, en el mapa o en la lista; resalta el mismo corredor en ambas vistas. */
  hoverCorredor: string | null
  setHover: (c: string | null) => void
  openLanding: () => void
  closeLanding: () => void
}

export const useUi = create<Ui>((set) => ({
  landing: !yaVisto(),
  preguntas: false,
  openPreguntas: () => set({ preguntas: true }),
  closePreguntas: () => set({ preguntas: false }),
  tour: false,
  tourStep: 0,
  story: false,
  storyStep: 0,
  offTrack: false,
  hoverCorredor: null,
  setHover: (c) => set((s) => (s.hoverCorredor === c ? s : { hoverCorredor: c })),
  openLanding: () => set({ landing: true }),
  closeLanding: () => {
    try { localStorage.setItem(KEY, '1') } catch { /* sin almacenamiento */ }
    set({ landing: false })
  },
}))
