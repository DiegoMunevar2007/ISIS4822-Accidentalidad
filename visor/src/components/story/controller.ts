import { cambioPorGravedad } from '@/data.js'
import { getState, setState, useStore, type State } from '@/store'
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
  const st = fresh()
  st.gravedad = 'fatal'
  M = { byGrav: cambioPorGravedad(D, st) }
  useUi.getState().closeLanding()
  useUi.setState({ story: true })
  document.body.classList.add('story-on')
  applyStep(k)
  setTimeout(() => window.dispatchEvent(new Event('resize')), 40)
}

export function stopStory() {
  if (!useUi.getState().story) return
  useUi.setState({ story: false, offTrack: false })
  document.body.classList.remove('story-on')
  clearFocus()
  updateURL(false, 0)
  if (snap) {
    applying = true
    setState(snap)
    applying = false
    snap = null
  }
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
