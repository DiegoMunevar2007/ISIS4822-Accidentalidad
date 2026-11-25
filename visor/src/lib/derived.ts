import {
  baseMask, scopeTest, zonaTest, controlTest, porMes, porDia, victimasPorCondicion,
  GRAVEDAD, N_MESES, MESES_CORTOS,
} from '@/data.js'
import type { Data, State } from '@/store'

// ---------------------------------------------------------------- fechas
export const monthStartDay: number[] = []
for (let m = 0; m <= N_MESES; m++) {
  const d = new Date(2019 + Math.floor(m / 12), m % 12, 1)
  monthStartDay.push(Math.round((d.getTime() - new Date(2019, 0, 1).getTime()) / 864e5))
}
export const dayDate = (d: number) => new Date(2019, 0, 1 + d)
export const fmtDia = (d: number) => {
  const dt = dayDate(d)
  return `${dt.getDate()} ${MESES_CORTOS[dt.getMonth()]} ${dt.getFullYear()}`
}
export const INSTALACION = [322, 451] // 19-nov-2019 .. 27-mar-2020
export const OPERACION = monthStartDay[16] // may-2020

// ---------------------------------------------------------------- textos de ámbito
export function nombreAmbito(D: Data, st: State): string {
  if (st.sitio) {
    const s = D.geo.sitios.find((x: { id: string }) => x.id === st.sitio)
    return `${s.corredor}, ${s.via}`
  }
  return st.corredor ?? 'Bogotá'
}
export function nombreZona(D: Data, st: State): string {
  if (st.sitio || st.corredor) return nombreAmbito(D, st)
  return `Zonas con cámara (≤ ${st.radio} m)`
}
export const gravLabel = (st: State): string => GRAVEDAD[st.gravedad].label
/** Para frases con número delante: «377 siniestros», «12 siniestros con muertos». */
export const nLabel = (st: State): string => (st.gravedad === 'todos' ? 'siniestros' : gravLabel(st))
export const ySiniestros = (_st?: State): string => 'Cantidad de siniestros'

// ---------------------------------------------------------------- cálculo memoizado por filtros
export interface Computed {
  keyBase: string
  keyScope?: string
  mask: Uint8Array
  scope: (i: number) => boolean
  mScope: Float64Array
  dScope: Float64Array
  mZona: Float64Array
  mCtrl: Float64Array
  mBogota: Float64Array
  mScopeTodos: Float64Array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vict: any[]
  victMes: Float64Array
  conteoSitio: Map<string, number>
}

let cache: Partial<Computed> = {}
let cacheD: Data | null = null

function victimasMes(D: Data, mask: Uint8Array, test: (i: number) => boolean) {
  const V = D.victimas
  const out = new Float64Array(N_MESES)
  for (let j = 0; j < V.row.length; j++) {
    if (V.grav[j] !== 2) continue
    const i = V.row[j]
    if (mask[i] && test(i)) out[D.rows.m[i]] += V.cnt[j]
  }
  return out
}

export function compute(D: Data, st: State): Computed {
  if (cacheD !== D) {
    cache = {}
    cacheD = D
  }
  const keyBase = JSON.stringify([st.gravedad, [...st.clases], st.actor, st.excluirCruce])
  const keyScope = JSON.stringify([keyBase, st.corredor, st.sitio, st.radio, st.todoCorredor])
  if (cache.keyBase !== keyBase) cache = { keyBase, mask: baseMask(D, st) }
  if (cache.keyScope !== keyScope) {
    const mask = cache.mask as Uint8Array
    const scope = scopeTest(D, st)
    const zona = zonaTest(D, st)
    const ctrl = controlTest(D, st)
    cache.keyScope = keyScope
    cache.scope = scope
    cache.mScope = porMes(D, mask, scope)
    cache.dScope = porDia(D, mask, scope)
    cache.mZona = (st.sitio || st.corredor) && !st.todoCorredor ? cache.mScope : porMes(D, mask, zona)
    cache.mCtrl = porMes(D, mask, ctrl)
    cache.mBogota = porMes(D, mask, () => true)
    const maskTodos = baseMask(D, { ...st, gravedad: 'todos' })
    cache.mScopeTodos = porMes(D, maskTodos, zona)
    cache.vict = victimasPorCondicion(D, mask, zona, st.gravedad)
    cache.victMes = victimasMes(D, mask, zona)
    const R = st.radio
    const cnt = new Map<string, number>()
    const { rows } = D
    for (let i = 0; i < rows.n; i++) {
      if (!mask[i] || rows.dc[i] > R) continue
      const id = D.meta.sitios[rows.s[i]]
      cnt.set(id, (cnt.get(id) ?? 0) + 1)
    }
    cache.conteoSitio = cnt
  }
  return cache as Computed
}
