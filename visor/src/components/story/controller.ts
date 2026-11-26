import {
  baseMask, cambioPorCorredor, cambioPorGravedad, porMes, sumRange, velocidadGravedadPorCorredor, victimasPorCondicion, zonaTest,
} from '@/data.js'
import { getState, setState, useStore, type Data, type State } from '@/store'
import { useUi } from '@/ui-store'
import { KEYS, STEPS, type Metrics } from './steps'

// Estado imperativo de la historia (no necesita provocar renders).
let snap: State | null = null
let base: Partial<State> | null = null
let applying = false
let M: Metrics | null = null

const same = (a: unknown, b: unknown) => JSON.stringify(a, (_, v) => (v instanceof Set ? [...v] : v)) === JSON.stringify(b, (_, v) => (v instanceof Set ? [...v] : v))
const pick = (s: State) => Object.fromEntries(KEYS.map((k) => [k, s[k]])) as Partial<State>
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

export const metrics = () => M

function clearFocus() {
  document.querySelectorAll('.story-focus,.story-spot').forEach((n) => n.classList.remove('story-focus', 'story-spot'))
}

function focusStep(i: number) {
  clearFocus()
  const s = STEPS[i]
  for (const sel of s.focus ?? []) document.querySelector(sel)?.classList.add('story-focus')
  if (s.spot) {
    const spot = document.querySelector(s.spot)
    if (spot) {
      if (spot instanceof HTMLDetailsElement) spot.open = true
      // Secciones plegables (Collapsible): se abren pulsando su botón.
      if (spot.getAttribute('data-state') === 'closed') spot.querySelector<HTMLButtonElement>('button')?.click()
      spot.classList.add('story-spot')
      spot.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' })
    }
  }
}

function updateURL(active: boolean, i: number) {
  try {
    const u = new URL(location.href)
    if (active) u.searchParams.set('historia', String(i + 1))
    else u.searchParams.delete('historia')
    history.replaceState(null, '', u.toString())
  } catch { /* sin historial */ }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function calcular(D: Data, base: State): Metrics {
  const st: State = { ...base, corredor: null, sitio: null, gravedad: 'fatal' }
  const mask = baseMask(D, st)
  const mes = porMes(D, mask, () => true)
  const anual = [0, 1, 2, 3].map((a) => sumRange(mes, a * 12, a * 12 + 11))
  const vict = victimasPorCondicion(D, mask, zonaTest(D, st), 'fatal').map((v: any) => ({
    condicion: v.condicion, cambio: v.ma > 0 ? (v.md - v.ma) / v.ma : null,
  }))
  const { rows, geo } = D
  // Los tres corredores con más siniestros con muertos cerca de las cámaras en una ventana de meses.
  const top = (desde: number, hasta: number): string[] => {
    const n = Array<number>(geo.corredores.length).fill(0)
    for (let i = 0; i < rows.n; i++)
      if (mask[i] && rows.dc[i] <= base.radio && rows.m[i] >= desde && rows.m[i] <= hasta) n[rows.corr[i]]++
    return n.map((x, i) => ({ x, c: geo.corredores[i] as string })).sort((a, b) => b.x - a.x).slice(0, 3).filter((a) => a.x > 0).map((a) => a.c)
  }
  const grave: State = { ...base, corredor: null, sitio: null, gravedad: 'grave' }
  const ctrl: number | null = cambioPorGravedad(D, grave).find((g: any) => g.key === 'grave')?.control.cambio ?? null
  const difs = ctrl == null ? [] : cambioPorCorredor(D, grave)
    .filter((c: any) => c.cambio != null && c.n >= 10)
    .map((c: any) => ({ corredor: c.corredor as string, dif: c.cambio - ctrl }))
    .sort((a: { dif: number }, b: { dif: number }) => a.dif - b.dif)
  const pts: { speed: number; share: number }[] = velocidadGravedadPorCorredor(D, grave)
  let r: number | null = null
  if (pts.length > 2) {
    const mx = pts.reduce((s, p) => s + p.speed, 0) / pts.length
    const my = pts.reduce((s, p) => s + p.share, 0) / pts.length
    const sxy = pts.reduce((s, p) => s + (p.speed - mx) * (p.share - my), 0)
    const sxx = pts.reduce((s, p) => s + (p.speed - mx) ** 2, 0)
    const syy = pts.reduce((s, p) => s + (p.share - my) ** 2, 0)
    r = sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null
  }
  return {
    byGrav: cambioPorGravedad(D, st),
    anual,
    vict,
    top: { antes: top(0, 11), despues: top(24, 47) },
    extremos: difs.length ? { ctrl: ctrl as number, mejor: difs[0], peor: difs[difs.length - 1] } : null,
    r,
    nCorredores: pts.length,
  }
}

export function applyStep(k: number) {
  const i = Math.max(0, Math.min(STEPS.length - 1, k))
  const { fresh } = useStore.getState()
  applying = true
  setState(STEPS[i].patch(fresh()))
  applying = false
  base = pick(getState())
  useUi.setState({ storyStep: i, offTrack: false })
  updateURL(true, i)
  // el DOM se actualiza tras el render de React
  setTimeout(() => focusStep(i), 60)
}

export function startStory(k = 0) {
  if (useUi.getState().story) return applyStep(k)
  const { fresh, D } = useStore.getState()
  if (!D) return
  snap = { ...getState(), clases: new Set(getState().clases) }
  M = calcular(D, fresh())
  useUi.getState().closeLanding()
  useUi.setState({ story: true })
  document.body.classList.add('story-on')
  applyStep(k)
  setTimeout(() => window.dispatchEvent(new Event('resize')), 40)
}

/** Con `conservar`, el visor queda como está (fin de la historia); si no, vuelve al estado previo. */
export function stopStory(conservar = false) {
  if (!useUi.getState().story) return
  useUi.setState({ story: false, offTrack: false })
  document.body.classList.remove('story-on')
  clearFocus()
  updateURL(false, 0)
  if (snap && !conservar) {
    applying = true
    setState(snap)
    applying = false
  }
  snap = null
  setTimeout(() => window.dispatchEvent(new Event('resize')), 40)
}

/** Detecta si el usuario cambió algo que el paso actual no permite. */
export function onStateChange(st: State) {
  const ui = useUi.getState()
  if (!ui.story || applying || !base) return
  const step = STEPS[ui.storyStep]
  if (step.allowAll) return
  const allow = step.allow ?? []
  const off = KEYS.filter((k) => !same(st[k], base![k])).some((k) => !allow.includes(k))
  if (off !== ui.offTrack) useUi.setState({ offTrack: off })
}
