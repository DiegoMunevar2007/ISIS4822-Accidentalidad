import { useEffect, useRef, useState } from 'react'
import { useStore, setState } from '@/store'
import { useUi } from '@/ui-store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { stopStory } from '@/components/story/controller'

interface Step {
  sel: string
  before?: () => void
  title: string
  text: string
}

const STEPS: Step[] = [
  { sel: '#tabs', before: () => setState({ tab: 'mapa', mapa: true }), title: 'Las vistas',
    text: '"Mapa y cambios" muestra dónde están las cámaras y qué cambió con ellas; "Evolución" muestra la serie mes a mes; "Corredores" ordena los corredores por cambio; "Comparar meses" pone dos meses lado a lado.' },
  { sel: '#map', before: () => setState({ tab: 'mapa', mapa: true }), title: 'Elegir en el mapa',
    text: 'Cada círculo es un sitio de cámara. Con el cursor encima se ve cuántos siniestros tiene cerca, y un clic lo selecciona. Los tramos del corredor también admiten clic.' },
  { sel: '.f-corr', before: () => setState({ tab: 'mapa', corredor: 'Av. Boyacá', sitio: null }), title: 'O desde el menú',
    text: 'Se eligió Av. Boyacá como ejemplo. El menú de al lado permite bajar a un sitio de cámara.' },
  { sel: '#scope-line', title: '¿Qué se está contando?',
    text: 'Aquí se resume el alcance: sitios y cámaras del ámbito, el radio alrededor de cada cámara y los filtros de "Más filtros". Se cuentan los siniestros dentro de ese radio, no toda la vía.' },
  { sel: '#filters', before: () => setState({ tab: 'mapa' }), title: 'Filtrar',
    text: 'Periodo (antes de la instalación: 2019; instalación y pandemia: 2020; después: 2021–22) y gravedad. En "Más filtros" están el tipo de siniestro, el actor (moto, peatón…), el radio y las intersecciones ambiguas.' },
  { sel: '#panel-ficha', before: () => setState({ tab: 'mapa', mapa: true }), title: 'Con y sin cámara',
    text: 'El panel compara el promedio mensual antes y después en la zona con cámara y en las vías sin cámara, que sirven de referencia. La diferencia entre ambos cambios, en %, es el dato principal.' },
  { sel: '#btn-hide-map', title: 'Ocultar el mapa',
    text: 'Al ocultar el mapa, los cambios y la serie quedan lado a lado. El mapa se vuelve a mostrar desde la barra lateral.' },
  { sel: '#panel-serie', before: () => setState({ tab: 'serie', mapa: false, serieModo: 'anios' }), title: 'Evolución',
    text: 'Con el cursor sobre la serie se ve cada mes. "Años superpuestos" pone un recuadro por año, con 2019 de referencia, "Con y sin cámara" compara los dos grupos frente al nivel de 2019 y, abajo, está la velocidad del tráfico.' },
  { sel: '#panel-ab', before: () => setState({ tab: 'ab' }), title: 'Comparar meses',
    text: 'Un clic o un arrastre sobre las barras asigna meses al grupo A o B, y "Restablecer meses" vuelve a 2019 frente a 2021–22. La tabla compara el promedio mensual de siniestros, víctimas y velocidad entre ambas.' },
]

export function startTour() {
  stopStory()
  useStore.getState().set(useStore.getState().fresh())
  useUi.setState({ tour: true, tourStep: 0 })
}
export function endTour() {
  useUi.setState({ tour: false })
  useStore.getState().set(useStore.getState().fresh())
}

interface Pos { hole: React.CSSProperties; card: React.CSSProperties }

export function Tour() {
  const active = useUi((s) => s.tour)
  const k = useUi((s) => s.tourStep)
  const [pos, setPos] = useState<Pos | null>(null)
  const [tick, setTick] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const step = STEPS[k]

  // Ejecuta el `before` del paso una sola vez por paso
  useEffect(() => {
    if (active) step.before?.()
  }, [active, k, step])

  // Mide el elemento destacado (tras el render del estado nuevo). El desplazamiento es inmediato:
  // medir mientras la página sigue moviéndose dejaba el recuadro desfasado.
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => {
      const el = document.querySelector(step.sel)
      if (!el) {
        if (k + 1 >= STEPS.length) endTour()
        else useUi.setState({ tourStep: k + 1 })
        return
      }
      const vw = window.innerWidth
      const vh = window.innerHeight
      const alto = el.getBoundingClientRect().height
      el.scrollIntoView({ block: alto > vh * 0.7 ? 'start' : 'center', behavior: 'instant' as ScrollBehavior })
      const r = el.getBoundingClientRect()
      const pad = 6
      const m = 12
      // Parte visible del elemento
      const hole = {
        left: Math.max(m / 2, r.left - pad),
        top: Math.max(m / 2, r.top - pad),
        right: Math.min(vw - m / 2, r.right + pad),
        bottom: Math.min(vh - m / 2, r.bottom + pad),
      }
      const cw = Math.min(380, vw - 2 * m)
      const ch = cardRef.current?.offsetHeight ?? 260
      // La tarjeta va donde no tape lo destacado: debajo, arriba, a la derecha o a la izquierda.
      const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)
      const opciones = [
        { ok: hole.bottom + m + ch <= vh, left: clamp(hole.left, m, vw - cw - m), top: hole.bottom + m },
        { ok: hole.top - m - ch >= 0, left: clamp(hole.left, m, vw - cw - m), top: hole.top - m - ch },
        { ok: hole.right + m + cw <= vw, left: hole.right + m, top: clamp(hole.top, m, vh - ch - m) },
        { ok: hole.left - m - cw >= 0, left: hole.left - m - cw, top: clamp(hole.top, m, vh - ch - m) },
      ]
      const e = opciones.find((o) => o.ok) ?? { left: clamp(hole.left, m, vw - cw - m), top: vh - ch - m }
      setPos({
        hole: { left: hole.left, top: hole.top, width: hole.right - hole.left, height: hole.bottom - hole.top },
        card: { left: e.left, top: e.top, width: cw },
      })
    }, 80)
    return () => clearTimeout(t)
  }, [active, k, step, tick])

  useEffect(() => {
    if (!active) return
    const onResize = () => setTick((n) => n + 1)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && endTour()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize)
      document.removeEventListener('keydown', onKey)
    }
  }, [active])

  if (!active) return null
  const last = k === STEPS.length - 1
  return (
    <div id="tour" className="tour">
      <div className="tour-hole" style={pos?.hole} />
      <Card ref={cardRef} className="tour-card gap-3 px-5 py-5" role="dialog" aria-label="Recorrido guiado" style={pos?.card}>
        <div className="flex items-center gap-2">
          <span className="text-small font-semibold text-primary">Recorrido</span>
          <span className="text-small text-muted-foreground">Paso {k + 1} de {STEPS.length}</span>
        </div>
        <Progress value={((k + 1) / STEPS.length) * 100} className="h-1.5" aria-label={`Paso ${k + 1} de ${STEPS.length}`} />
        <h3 className="text-kpi font-bold">{step.title}</h3>
        <p className="tour-text text-body text-ink-2">{step.text}</p>
        <div className="mt-1 flex justify-end gap-2">
          <Button size="small" variant="ghost" onClick={endTour}>Saltar</Button>
          <Button size="small" variant="primary" onClick={() => (last ? endTour() : useUi.setState({ tourStep: k + 1 }))}>
            {last ? 'Empezar a explorar' : 'Siguiente'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
