import { ACTORES, CLASE_LABEL, TRAMO_BUFFER_M, sitiosDelAmbito } from '@/data.js'
import { useStore, type Tab } from '@/store'
import { useUi } from '@/ui-store'
import { BookOpen, CircleHelp, RotateCcw, X, Map as MapIcon, ChartLine, ListOrdered, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs as UiTabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Computed } from '@/lib/derived'
import { startStory } from '@/components/story/controller'

function Tip({ text, children }: { text: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}

export function TopBar() {
  const set = useStore((s) => s.set)
  const fresh = useStore((s) => s.fresh)
  const openLanding = useUi((s) => s.openLanding)
  return (
    <header className="topbar mb-3 flex flex-wrap items-end justify-between gap-4 max-[640px]:items-start">
      <div className="brand">
        <h1>Cámaras salvavidas de Bogotá</h1>
        <p className="hint">Siniestros y velocidad antes y después de la instalación, 2019 a 2022.</p>
      </div>
      <TooltipProvider>
        <div className="top-actions flex gap-2">
          <Tip text="Recorrido guiado en tres actos">
            <Button id="btn-story" variant="primary" onClick={() => startStory(0)}><BookOpen className="size-4" />Historia</Button>
          </Tip>
          <Tip text="Volver a la vista inicial">
            <Button id="btn-reset" onClick={() => set(fresh())}><RotateCcw className="size-4" />Reiniciar</Button>
          </Tip>
          <Tip text="Volver a Bogotá">
            <Button id="btn-clear" onClick={() => set({ corredor: null, sitio: null })}><X className="size-4" />Quitar selección</Button>
          </Tip>
          <Tip text="Ver el recorrido de bienvenida">
            <Button size="icon" id="btn-help" aria-label="Ayuda" onClick={openLanding}><CircleHelp className="size-4" /></Button>
          </Tip>
        </div>
      </TooltipProvider>
    </header>
  )
}

const TABS: [Tab, string, React.ComponentType<{ className?: string }>][] = [
  ['mapa', 'Mapa y cambios', MapIcon], ['serie', 'Evolución', ChartLine], ['panorama', 'Corredores', ListOrdered], ['ab', 'Comparar meses', ArrowLeftRight],
]

export function Tabs() {
  const tab = useStore((s) => s.st.tab)
  const set = useStore((s) => s.set)
  return (
    <UiTabs value={tab} onValueChange={(v) => set({ tab: v as Tab })} className="mb-4 max-[640px]:overflow-x-auto">
      <TabsList variant="line" id="tabs" className="h-auto w-full justify-start gap-1 rounded-none border-b border-border p-0">
        {TABS.map(([v, l, Icon]) => (
          <TabsTrigger
            key={v}
            value={v}
            data-tab={v}
            className="h-auto flex-none cursor-pointer rounded-none px-4 py-2.5 text-[1rem] font-semibold text-muted-foreground hover:text-foreground data-[state=active]:text-foreground after:!bottom-[-1px] after:!h-[3px] after:!bg-primary"
          >
            <Icon className="size-4" />
            {l}
          </TabsTrigger>
        ))}
      </TabsList>
    </UiTabs>
  )
}

export function ScopeLine({ K: _K }: { K: Computed }) {
  const D = useStore((s) => s.D)!
  const st = useStore((s) => s.st)
  // Solo lo que los selectores de arriba no dicen: tamaño del ámbito, radio y filtros de «Más filtros».
  const sitios = st.tab === 'panorama' ? D.geo.sitios : sitiosDelAmbito(D, st)
  const nCam = sitios.reduce((a: number, s: { n_camaras: number }) => a + s.n_camaras, 0)
  const clases = st.clases.size === D.meta.clases.length ? null : [...st.clases].map((c) => CLASE_LABEL[c as keyof typeof CLASE_LABEL]).join(', ')
  const actor = st.actor ? (ACTORES.find((a: string[]) => a[0] === st.actor) as string[])[1] : null

  type Item = [string | null, string]
  const items: Item[] = [
    [null, `${sitios.length} sitio${sitios.length === 1 ? '' : 's'}`],
    [null, `${nCam} cámara${nCam === 1 ? '' : 's'}`],
    ...(st.corredor && !st.sitio && st.todoCorredor
      ? ([['Corredor', `a menos de ${TRAMO_BUFFER_M} m del tramo`]] as Item[])
      : ([['Radio', `${st.radio} m`]] as Item[])),
    ...(st.tab === 'panorama' ? ([['Periodo', '2019 frente a 2021–22']] as Item[]) : []),
    ...(clases ? ([['Tipo', clases]] as Item[]) : []),
    ...(actor ? ([['Actor', actor]] as Item[]) : []),
    ...(st.excluirCruce ? ([[null, 'Sin intersecciones ambiguas']] as Item[]) : []),
  ]

  return (
    <ul className="scope flex flex-wrap items-center gap-2" id="scope-line" aria-label="Alcance de lo que se cuenta">
      {items.map(([k, v]) => (
        <li key={`${k}${v}`}>
          <Badge variant="outline" className="h-7 gap-1.5 rounded-md px-2.5 text-small font-normal">
            {k && <span className="text-muted-foreground">{k}</span>}
            <b className="font-semibold text-foreground">{v}</b>
          </Badge>
        </li>
      ))}
    </ul>
  )
}
