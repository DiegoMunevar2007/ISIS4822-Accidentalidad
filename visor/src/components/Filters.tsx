import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ACTORES, CLASE_LABEL, PERIODOS } from '@/data.js'
import { useStore } from '@/store'
import { Select } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const GRAVEDADES = [
  { value: 'todos', label: 'Todos' },
  { value: 'heridos', label: 'Heridos' },
  { value: 'grave', label: 'Heridos o muertos' },
  { value: 'fatal', label: 'Muertos' },
]

/** True en pantallas angostas, donde los filtros viven en un panel inferior. */
function useAngosta() {
  const q = '(max-width: 639px)'
  const [v, setV] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const f = () => setV(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return v
}

export function Filters() {
  const D = useStore((s) => s.D)!
  const st = useStore((s) => s.st)
  const set = useStore((s) => s.set)
  const [radio, setRadio] = useState<number | null>(null) // valor mientras se arrastra
  const angosta = useAngosta()

  const sitios = st.corredor ? D.geo.sitios.filter((s: any) => s.corredor === st.corredor) : D.geo.sitios
  const nMore = (st.clases.size < D.meta.clases.length ? 1 : 0) + (st.actor ? 1 : 0) + (st.radio !== 500 ? 1 : 0) + (st.excluirCruce ? 1 : 0)

  // Solo se muestran los filtros que cambian lo que hay en pantalla:
  // - Corredores: la lista ya incluye todos los corredores y compara 2019 con 2021–22.
  // - Comparar meses: los meses se eligen con A y B, no con el periodo.
  const verUbicacion = st.tab !== 'panorama'
  const verPeriodo = st.tab === 'mapa' || st.tab === 'serie'

  const label = 'f flex flex-col gap-1'
  const campos = (
    <>
      {verUbicacion && (
        <>
      <label className={`${label} f-corr`}>
        <span>Corredor</span>
        <Combobox
          placeholder="Buscar corredor"
          value={st.corredor}
          onChange={(v) => set({ corredor: v, sitio: null })}
          options={[{ value: '', label: 'Bogotá, vista general' }, ...D.geo.corredores.map((c: string) => ({ value: c, label: c }))]}
        />
      </label>
      <label className={`${label} f-sitio`}>
        <span>Sitio de cámara</span>
        <Combobox
          placeholder="Buscar sitio"
          value={st.sitio}
          onChange={(id) => {
            const s = id && D.geo.sitios.find((x: any) => x.id === id)
            set({ sitio: id, corredor: s ? s.corredor : st.corredor })
          }}
          options={[
            { value: '', label: st.corredor ? 'Todo el corredor' : 'Todos los sitios' },
            ...sitios.map((s: any) => ({ value: s.id, label: `${st.corredor ? '' : `${s.corredor}, `}${s.via} (${s.id})` })),
          ]}
        />
      </label>
        </>
      )}
      {verPeriodo && (
      <label className={`${label} f-periodo`}>
        <span>Periodo</span>
        <Select
          value={st.periodo}
          onChange={(v) => set({ periodo: (v ?? 'todo') as typeof st.periodo })}
          options={Object.entries(PERIODOS).map(([k, p]: [string, any]) => ({ value: k, label: p.label }))}
        />
      </label>
      )}
      <label className={`${label} f-grav`}>
        <span>Gravedad</span>
        <Select value={st.gravedad} onChange={(v) => set({ gravedad: (v ?? 'todos') as typeof st.gravedad })} options={GRAVEDADES} />
      </label>

    </>
  )
  const extras = (
    <>
      <div className="more-col">
        <span>Tipo de siniestro</span>
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          spacing={1}
          id="chips-clase"
          className="flex-wrap"
          value={[...st.clases]}
          onValueChange={(vals) => vals.length && set({ clases: new Set(vals) })}
        >
          {[...D.meta.clases].sort((x: string, y: string) => Number(x === 'Otro') - Number(y === 'Otro')).map((c: string) => (
            <ToggleGroupItem key={c} value={c} className="cursor-pointer rounded-md text-small data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground">
              {CLASE_LABEL[c as keyof typeof CLASE_LABEL]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="more-col">
        <span>Actor involucrado</span>
        <Select
          className="min-w-0"
          value={st.actor}
          onChange={(v) => set({ actor: v })}
          options={[{ value: '', label: 'Todos' }, ...ACTORES.map(([k, l]: string[]) => ({ value: k, label: l }))]}
        />
      </div>
      <div className="more-col">
        <span>Radio alrededor de la cámara: <b>{radio ?? st.radio} m</b></span>
        <Slider
          min={150} max={1000} step={50}
          value={[radio ?? st.radio]}
          onValueChange={([v]) => setRadio(v)}
          onValueCommit={([v]) => { setRadio(null); set({ radio: v }) }}
          aria-label="Radio alrededor de la cámara"
        />
      </div>
      <label className="more-col !flex-row items-center gap-2 sm:col-span-2">
        <Checkbox checked={st.excluirCruce} onCheckedChange={(c) => set({ excluirCruce: c === true })} />
        <span className="!font-medium !text-ink">Excluir intersecciones ambiguas</span>
      </label>
    </>
  )

  if (angosta) {
    return (
      <Sheet>
        <section className="filters flex items-end gap-3" id="filters">
          <SheetTrigger asChild>
            <Button className="h-10">
              Filtros
              {nMore > 0 && <span className="font-semibold text-primary">({nMore})</span>}
              <ChevronDown className="size-4 text-muted-foreground" />
            </Button>
          </SheetTrigger>
        </section>
        <SheetContent>
          <SheetTitle className="m-0 text-[1.125rem] font-bold">Filtros</SheetTitle>
          <SheetDescription className="sr-only">Elegir corredor, sitio, periodo, gravedad y otros filtros.</SheetDescription>
          <div className="flex flex-col gap-3.5">{campos}</div>
          <div className="flex flex-col gap-3.5 border-t border-border pt-4">{extras}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover>
    <PopoverAnchor asChild>
    <section className="filters relative flex flex-wrap items-end gap-x-4 gap-y-2.5" id="filters">
      {verUbicacion && (
        <>
      <label className={`${label} f-corr`}>
        <span>Corredor</span>
        <Combobox
          placeholder="Buscar corredor"
          value={st.corredor}
          onChange={(v) => set({ corredor: v, sitio: null })}
          options={[{ value: '', label: 'Bogotá, vista general' }, ...D.geo.corredores.map((c: string) => ({ value: c, label: c }))]}
        />
      </label>
      <label className={`${label} f-sitio`}>
        <span>Sitio de cámara</span>
        <Combobox
          placeholder="Buscar sitio"
          value={st.sitio}
          onChange={(id) => {
            const s = id && D.geo.sitios.find((x: any) => x.id === id)
            set({ sitio: id, corredor: s ? s.corredor : st.corredor })
          }}
          options={[
            { value: '', label: st.corredor ? 'Todo el corredor' : 'Todos los sitios' },
            ...sitios.map((s: any) => ({ value: s.id, label: `${st.corredor ? '' : `${s.corredor}, `}${s.via} (${s.id})` })),
          ]}
        />
      </label>
        </>
      )}
      {verPeriodo && (
      <label className={`${label} f-periodo`}>
        <span>Periodo</span>
        <Select
          value={st.periodo}
          onChange={(v) => set({ periodo: (v ?? 'todo') as typeof st.periodo })}
          options={Object.entries(PERIODOS).map(([k, p]: [string, any]) => ({ value: k, label: p.label }))}
        />
      </label>
      )}
      <label className={`${label} f-grav`}>
        <span>Gravedad</span>
        <Select value={st.gravedad} onChange={(v) => set({ gravedad: (v ?? 'todos') as typeof st.gravedad })} options={GRAVEDADES} />
      </label>

      <div className="f f-more static" id="more-filters">
        <PopoverTrigger asChild>
          <Button className="group h-10 data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/30">
            Más filtros
            {nMore > 0 && <span className="font-semibold text-primary">({nMore})</span>}
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </Button>
        </PopoverTrigger>
      </div>
    </section>
    </PopoverAnchor>
    <PopoverContent align="start" className="grid w-[var(--radix-popover-trigger-width)] grid-cols-1 gap-3.5 sm:grid-cols-2">
      <div className="more-col">
        <span>Tipo de siniestro</span>
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          spacing={1}
          id="chips-clase"
          className="flex-wrap"
          value={[...st.clases]}
          onValueChange={(vals) => vals.length && set({ clases: new Set(vals) })}
        >
          {[...D.meta.clases].sort((x: string, y: string) => Number(x === 'Otro') - Number(y === 'Otro')).map((c: string) => (
            <ToggleGroupItem key={c} value={c} className="cursor-pointer rounded-md text-small data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-accent-foreground">
              {CLASE_LABEL[c as keyof typeof CLASE_LABEL]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="more-col">
        <span>Actor involucrado</span>
        <Select
          className="min-w-0"
          value={st.actor}
          onChange={(v) => set({ actor: v })}
          options={[{ value: '', label: 'Todos' }, ...ACTORES.map(([k, l]: string[]) => ({ value: k, label: l }))]}
        />
      </div>
      <div className="more-col">
        <span>Radio alrededor de la cámara: <b>{radio ?? st.radio} m</b></span>
        <Slider
          min={150} max={1000} step={50}
          value={[radio ?? st.radio]}
          onValueChange={([v]) => setRadio(v)}
          onValueCommit={([v]) => { setRadio(null); set({ radio: v }) }}
          aria-label="Radio alrededor de la cámara"
        />
      </div>
      <label className="more-col !flex-row items-center gap-2 sm:col-span-2">
        <Checkbox checked={st.excluirCruce} onCheckedChange={(c) => set({ excluirCruce: c === true })} />
        <span className="!font-medium !text-ink">Excluir intersecciones ambiguas</span>
      </label>
    </PopoverContent>
    </Popover>
  )
}
