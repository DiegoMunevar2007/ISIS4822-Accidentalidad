import { create } from 'zustand'
import { loadData } from './data.js'

export type Tab = 'mapa' | 'serie' | 'panorama' | 'ab'

export interface State {
  tab: Tab
  corredor: string | null
  sitio: string | null
  periodo: 'todo' | 'antes' | 'transicion' | 'despues'
  gravedad: 'fatal' | 'grave' | 'heridos' | 'todos'
  clases: Set<string>
  actor: string | null
  radio: number
  excluirCruce: boolean
  /** Con un corredor elegido: mostrar todos los siniestros del tramo, no solo los cercanos a las cámaras. */
  todoCorredor: boolean
  mapa: boolean
  serieModo: 'linea' | 'anios' | 'control'
  ctrlOn: boolean
  rango: [number, number] | null
  /** Meses (0 a 47) de cada grupo en "Comparar meses"; ordenados, sin repetir y sin meses en común. */
  mesesA: number[]
  mesesB: number[]
  /** Grupo al que van los meses elegidos en el modo de meses sueltos. */
  abClick: 'A' | 'B'
}

const desde = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, k) => a + k)
/** Punto de partida: 2019 (antes de la instalación) frente a 2021–22 (después). */
export const MESES_A_DEF = desde(0, 11)
export const MESES_B_DEF = desde(24, 47)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Data = any

export const defaults = (clases: Set<string> = new Set()): State => ({
  tab: 'mapa',
  corredor: null,
  sitio: null,
  periodo: 'todo',
  gravedad: 'todos',
  clases,
  actor: null,
  radio: 500,
  excluirCruce: false,
  todoCorredor: false,
  mapa: true,
  serieModo: 'linea',
  ctrlOn: true,
  rango: null,
  mesesA: MESES_A_DEF,
  mesesB: MESES_B_DEF,
  abClick: 'A',
})

interface Store {
  D: Data | null
  st: State
  /** Aplica un parche al estado; mismas reglas que el `set` original. */
  set: (patch: Partial<State>) => void
  /** Estado inicial (con todas las clases de siniestro activas). */
  fresh: () => State
  load: () => Promise<void>
}

export const useStore = create<Store>((setStore, get) => ({
  D: null,
  st: defaults(),
  set: (patch) => {
    const next = { ...patch }
    if ('periodo' in next) next.rango = null
    if ('corredor' in next && !next.corredor) next.todoCorredor = false
    setStore((s) => ({ st: { ...s.st, ...next } }))
  },
  fresh: () => defaults(new Set(get().D?.meta.clases ?? [])),
  load: async () => {
    const D = await loadData()
    setStore((s) => ({ D, st: { ...s.st, clases: new Set(D.meta.clases as string[]) } }))
  },
}))

export const getState = () => useStore.getState().st
export const setState = (patch: Partial<State>) => useStore.getState().set(patch)
