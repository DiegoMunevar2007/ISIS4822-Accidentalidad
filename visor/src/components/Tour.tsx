import { useEffect, useState } from 'react'
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
    text: '«Mapa y cambios» muestra dónde están las cámaras y qué cambió con ellas; «Evolución» muestra la serie mes a mes; «Corredores» ordena los corredores por cambio; «Comparar meses» pone dos meses lado a lado.' },
  { sel: '#panel-map', before: () => setState({ tab: 'mapa', mapa: true }), title: 'Elegir en el mapa',
    text: 'Cada círculo es un sitio de cámara. Con el cursor encima se ve cuántos siniestros tiene cerca, y un clic lo selecciona. Los tramos del corredor también admiten clic.' },
  { sel: '.f-corr', before: () => setState({ tab: 'mapa', corredor: 'Av. Boyacá', sitio: null }), title: 'O desde el menú',
    text: 'Se eligió Av. Boyacá como ejemplo. El menú de al lado permite bajar a un sitio de cámara.' },
  { sel: '#scope-line', title: '¿Qué se está contando?',
    text: 'Aquí se resume el alcance: sitios y cámaras del ámbito, el radio alrededor de cada cámara y los filtros de «Más filtros». Se cuentan los siniestros dentro de ese radio, no toda la vía.' },
  { sel: '.f-periodo', before: () => setState({ tab: 'mapa' }), title: 'Filtrar',
    text: 'Periodo (antes de la instalación: 2019; instalación y pandemia: 2020; después: 2021–22) y gravedad. En «Más filtros» están el tipo de siniestro, el actor (moto, peatón…), el radio y las intersecciones ambiguas.' },
  { sel: '#panel-ficha', before: () => setState({ tab: 'mapa', mapa: true }), title: 'Con y sin cámara',
    text: 'El panel compara el promedio mensual antes y después en la zona con cámara y en las vías sin cámara, que sirven de referencia (el control). La diferencia en puntos porcentuales es el dato principal.' },
  { sel: '#btn-hide-map', title: 'Ocultar el mapa',
    text: 'Al ocultar el mapa, los cambios y la serie quedan lado a lado. El mapa se vuelve a mostrar desde la barra lateral.' },
  { sel: '#panel-serie', before: () => setState({ tab: 'serie', mapa: false, serieModo: 'anios' }), title: 'Evolución',
    text: 'Con el cursor sobre la serie se ve cada mes. «Años superpuestos» dibuja un año sobre otro, «Con y sin cámara» compara los dos grupos frente al nivel de 2019 y, abajo, está la velocidad del tráfico.' },
  { sel: '#panel-ab', before: () => setState({ tab: 'ab' }), title: 'Comparar meses',
    text: 'Las bandas A y B se arrastran sobre el gráfico, o por sus bordes, para elegir los meses de cada una. La tabla compara el promedio mensual de siniestros, víctimas y velocidad entre ambas.' },
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
  const step = STEPS[k]

  // Ejecuta el `before` del paso una sola vez por paso
  useEffect(() => {
    if (active) step.before?.()
  }, [active, k, step])

  // Mide el elemento destacado (tras el render del estado nuevo)
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => {
      const el = document.querySelector(step.sel)
      if (!el) {
        if (k + 1 >= STEPS.length) endTour()
        else useUi.setState({ tourStep: k + 1 })
        return
      }
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      const r = el.getBoundingClientRect()
      const pad = 6
      const cw = Math.min(380, window.innerWidth - 24)
      const below = r.bottom + 12 + 220 < window.innerHeight
      const left = Math.min(Math.max(12, r.left), window.innerWidth - cw - 12)
      let top = below ? r.bottom + 12 : Math.max(12, r.top - 232)
      if (r.height > window.innerHeight * 0.6) top = Math.min(r.top + 24, window.innerHeight - 250)
      setPos({
        hole: { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: Math.min(r.height + pad * 2, window.innerHeight - 20) },
        card: { left, top, width: cw },
      })
    }, 60)
    return () => clearTimeout(t)
  }, [active, k, step, tick])

  useEffect(() => {
    if (!active) return
    const onResize = () => setTick((n) => n + 1)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && endTour()
    window.addEventListener('resize', onResize)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', onResize)
      document.removeEventListener('keydown', onKey)
    }
  }, [active])

  if (!active) return null
  const last = k === STEPS.length - 1
  return (
    <div id="tour" className="tour">
      <div className="tour-hole" style={pos?.hole} />
      <Card className="tour-card gap-3 px-5 py-5" role="dialog" aria-label="Recorrido guiado" style={pos?.card}>
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
