import { useMemo } from 'react'
import { Compass, MessageCircleQuestion, Telescope } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useUi } from '@/ui-store'
import { defaults, useStore } from '@/store'
import { baseMask, porMes } from '@/data.js'
import { startTour } from '@/components/Tour'
import { startStory } from '@/components/story/controller'

/** Siniestros por mes de toda la ciudad: la imagen que resume el dashboard, con el momento de instalación marcado. */
function SerieResumen({ meses }: { meses: ArrayLike<number> }) {
  const W = 440, H = 214, l = 8, r = 8, t = 34, b = 28
  const n = meses.length
  const max = Math.max(1, ...Array.from(meses))
  const x = (i: number) => l + (i / (n - 1)) * (W - l - r)
  const y = (v: number) => H - b - (v / max) * (H - t - b)
  const linea = Array.from(meses).map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const area = `${linea}L${x(n - 1).toFixed(1)},${H - b}L${x(0).toFixed(1)},${H - b}Z`
  const x0 = x(10.6), x1 = x(14.9)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Siniestros por mes en Bogotá, de 2019 a 2022, con la instalación de las cámaras marcada">
      <rect x={x0} y={t - 8} width={x1 - x0} height={H - b - t + 8} fill="#FFD84D" opacity="0.55" />
      <path d={area} fill="#B5283A" opacity="0.1" />
      <path d={linea} fill="none" stroke="#B5283A" strokeWidth="2.25" strokeLinejoin="round" />
      <line x1={l} x2={W - r} y1={H - b} y2={H - b} stroke="#c9c9c3" />
      <text x={x0 + (x1 - x0) / 2} y={t - 16} textAnchor="middle" fontSize="13" fontWeight="600" fill="#3d4349">Instalación de las cámaras</text>
      {[0, 12, 24, 36].map((i, k) => (
        <text key={i} x={x(i)} y={H - 8} fontSize="13" fill="#5c636a">{2019 + k}</text>
      ))}
    </svg>
  )
}

export function Landing() {
  const open = useUi((s) => s.landing)
  const close = useUi((s) => s.closeLanding)
  const openPreguntas = useUi((s) => s.openPreguntas)
  const D = useStore((s) => s.D)
  const meses = useMemo(
    () => (D ? porMes(D, baseMask(D, defaults(new Set(D.meta.clases))), () => true) : null),
    [D],
  )
  // Las cifras salen de los datos cargados.
  const DATOS: [string, string][] = D
    ? [
      [D.rows.n.toLocaleString('es-CO'), 'siniestros'],
      [String(D.geo.camaras.length), 'cámaras'],
      [String(D.geo.sitios.length), 'sitios'],
      [String(D.geo.corredores.length), 'corredores'],
    ]
    : []
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent id="landing" aria-describedby="landing-desc" className="max-w-[1040px] !gap-0 overflow-hidden !p-0 sm:!p-0">
        <div className="flag-bar" aria-hidden="true" />
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col px-6 py-8 sm:px-10 sm:py-10">
            <p className="eyebrow">ISIS4822 - Visual Analytics</p>
            <DialogTitle asChild>
              <h1>Qué pasó antes y después de instalar las cámaras salvavidas</h1>
            </DialogTitle>
            <DialogDescription asChild>
              <p className="lede" id="landing-desc">
                Bogotá instaló cámaras de fotodetección entre noviembre de 2019 y marzo de 2020. Este dashboard compara los siniestros, las víctimas y la velocidad del tráfico cerca de ellas con las de vías sin cámara.
              </p>
            </DialogDescription>

            <div className="mt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => { close(); startStory(0) }}
                className="flex w-full cursor-pointer items-center gap-4 rounded-lg bg-primary px-5 py-4 text-left text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <span className="flex flex-col">
                  <span className="text-[1.0625rem] font-bold">Ver la historia</span>
                  <span className="text-small text-primary-foreground/85">Nueve pasos guiados y luego exploración libre</span>
                </span>
              </button>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => { close(); startTour() }}><Compass className="size-4" />Cómo usar el dashboard</Button>
                <Button onClick={close}><Telescope className="size-4" />Explorar libremente</Button>
                <Button onClick={() => { close(); openPreguntas() }}><MessageCircleQuestion className="size-4" />Preguntas que responde el dashboard (Why)</Button>
              </div>
            </div>

            <p className="fineprint mt-auto pt-8">
              Los datos provienen de SDM (siniestros georreferenciados y anuarios SIGAT), del inventario Cámaras Salvavidas y de Bitcarrier (velocidades). Los cambios son descriptivos y no prueban un efecto causal.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-6 bg-soft px-6 py-8 sm:px-10 sm:py-10">
            <div>
              <p className="m-0 text-small font-semibold text-foreground">Siniestros por mes en Bogotá, 2019 a 2022</p>
              <p className="m-0 mb-2 text-small text-muted-foreground">Todos los siniestros georreferenciados de la ciudad</p>
              {meses && <SerieResumen meses={meses} />}
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5">
              {DATOS.map(([n, l]) => (
                <div key={l} className="flex flex-col">
                  <dt className="order-2 text-small text-muted-foreground">{l}</dt>
                  <dd className="order-1 m-0 text-[1.75rem] font-extrabold leading-tight tracking-tight text-foreground tabular-nums">{n}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
