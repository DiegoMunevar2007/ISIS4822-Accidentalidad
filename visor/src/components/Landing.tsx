import type { ComponentType } from 'react'
import { BookOpen, Compass, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useUi } from '@/ui-store'
import { startTour } from '@/components/Tour'
import { startStory } from '@/components/story/controller'

const DATOS: [string, string][] = [
  ['92', 'cámaras'],
  ['40', 'sitios'],
  ['18', 'corredores'],
  ['109.137', 'siniestros'],
]

function Opcion({ icon: Icon, titulo, texto, onClick, destacada }: {
  icon: ComponentType<{ className?: string }>; titulo: string; texto: string; onClick: () => void; destacada?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-4 text-left shadow-xs outline-none transition-[background-color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/40',
        destacada
          ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border-border bg-card hover:bg-accent/50',
      )}
    >
      <Icon className={cn('size-5', destacada ? 'text-primary-foreground' : 'text-primary')} />
      <span className="text-body font-semibold">{titulo}</span>
      <span className={cn('text-small', destacada ? 'text-primary-foreground/85' : 'text-muted-foreground')}>{texto}</span>
    </button>
  )
}

export function Landing() {
  const open = useUi((s) => s.landing)
  const close = useUi((s) => s.closeLanding)
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent id="landing" aria-describedby="landing-desc" className="max-w-[820px]">
        <p className="eyebrow">ISIS4822, Visualización de datos. Bogotá, 2019 a 2022</p>
        <DialogTitle asChild>
          <h1>Qué pasó antes y después de instalar las cámaras salvavidas</h1>
        </DialogTitle>
        <DialogDescription asChild>
          <p className="lede" id="landing-desc">
            Bogotá instaló cámaras de fotodetección entre noviembre de 2019 y marzo de 2020. Este visor compara los siniestros, las víctimas y la velocidad del tráfico cerca de ellas con las de vías sin cámara.
          </p>
        </DialogDescription>

        <dl className="my-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {DATOS.map(([n, l]) => (
            <div key={l} className="flex flex-col">
              <dd className="order-1 text-small text-muted-foreground">{l}</dd>
              <dt className="text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">{n}</dt>
            </div>
          ))}
        </dl>

        <Separator className="mb-5" />

        <div className="grid gap-3 sm:grid-cols-3">
          <Opcion
            destacada
            icon={BookOpen}
            titulo="Ver la historia"
            texto="Nueve pasos guiados, unos 2 minutos."
            onClick={() => { close(); startStory(0) }}
          />
          <Opcion
            icon={Compass}
            titulo="Cómo usar el visor"
            texto="Un recorrido por los filtros y las vistas."
            onClick={() => { close(); startTour() }}
          />
          <Opcion
            icon={Search}
            titulo="Explorar libremente"
            texto="Ir directo al mapa y a los datos."
            onClick={close}
          />
        </div>

        <p className="fineprint mt-5">
          Fuentes: SDM (siniestros georreferenciados y anuarios SIGAT), inventario Cámaras Salvavidas y Bitcarrier (velocidades). Los cambios son descriptivos y no prueban un efecto causal.
        </p>
      </DialogContent>
    </Dialog>
  )
}
