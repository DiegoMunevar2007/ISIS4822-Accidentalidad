import { useState } from 'react'
import { MESES_CORTOS, cambioPorCorredor, cambioPorGravedad, velocidadGravedadPorCorredor, mesLabel } from '@/data.js'
import { C, fmt, hideTip, lineChart, showTip, speedSeverityScatter } from '@/charts.js'
import { useStore } from '@/store'
import { gravLabel, nLabel } from '@/lib/derived'
import { Chart } from '@/components/charts/Chart'
import { ChartLegend } from '@/components/charts/bits'
import { Ayuda } from '@/components/charts/Ayuda'
import { Button } from '@/components/ui/button'
import { Seg } from '@/components/ui/seg'
import { ChevronDown, MapPin, TriangleAlert } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useUi } from '@/ui-store'

/** Por debajo de este N (siniestros en 4 años) el promedio mensual es poco fiable. */
const N_BAJO = 10

type Orden = 'dif' | 'n' | 'nombre'
const pp = (v: number | null) => (v == null ? '—' : `${v > 0 ? '+' : ''}${fmt.dec(v * 100)}%`)

export function PanoramaPanel({ visible }: { visible: boolean }) {
  const D = useStore((s) => s.D)!
  const st = useStore((s) => s.st)
  const set = useStore((s) => s.set)
  const hover = useUi((s) => s.hoverCorredor)
  const setHover = useUi((s) => s.setHover)
  const [orden, setOrden] = useState<Orden>('dif')
  const [ocultarBajos, setOcultarBajos] = useState(false)
  if (!visible) return <section className="panel panorama-panel" id="panel-panorama" hidden />

  const grav = cambioPorGravedad(D, st)
  const gSel = grav.find((g: any) => g.key === st.gravedad) ?? grav[0]
  const ctrl: number | null = gSel.control.cambio
  const todos = cambioPorCorredor(D, st)
    .filter((c: any) => c.cambio != null)
    .map((c: any) => ({ ...c, dif: ctrl == null ? 0 : c.cambio - ctrl }))
  const sinDato = D.geo.corredores.length - todos.length
  const lista = todos
    .filter((c: any) => !(ocultarBajos && c.n < N_BAJO))
    .sort((a: any, b: any) =>
      orden === 'dif' ? a.dif - b.dif : orden === 'n' ? b.n - a.n : a.corredor.localeCompare(b.corredor, 'es'))
  // La escala la fijan los corredores con siniestros suficientes; los demás se recortan en el borde.
  const escala = Math.max(0.1, ...todos.filter((c: any) => c.n >= N_BAJO).map((c: any) => Math.abs(c.dif)))
  const sel = todos.find((c: any) => c.corredor === st.corredor) ?? [...todos].sort((a: any, b: any) => a.dif - b.dif)[0]
  const velGrav = velocidadGravedadPorCorredor(D, st)
  const elegir = (c: string) => set({ corredor: c, sitio: null })

  const z = gSel.zona
  const difGlobal = z.cambio != null && ctrl != null ? z.cambio - ctrl : null

  return (
    <section className="panel panorama-panel" id="panel-panorama">
      <div id="pan-gravedad-wrap" className="pan-head">
        <div>
          <h2 className="pan-title">
            Cambio por corredor
            <Ayuda>
              Cada barra es el cambio del promedio mensual de {nLabel(st)} a menos de {st.radio} m de las cámaras del corredor, de 2019 a 2021–22, menos el mismo cambio en las vías sin cámara de toda la ciudad ({fmt.pct(ctrl)}). A la izquierda, los siniestros del corredor bajaron más que en esas vías (o subieron menos); a la derecha, bajaron menos (o subieron más). La miniatura muestra la evolución mensual de 2019 a 2022.
            </Ayuda>
          </h2>
          <p className="sub desc">Cada corredor frente a las vías sin cámara, de 2019 a 2021–22. La zona con cámara en conjunto tiene una diferencia de {pp(difGlobal)}</p>
        </div>
      </div>

      <div className="pan-grid">
        <div id="pan-corredores-wrap">
          <div className="pan-tools">
            <div className="flex flex-wrap items-center gap-3">
              <Seg small label="Orden" prefix="Ordenar por" value={orden} onChange={setOrden}
                options={[['dif', 'Diferencia'], ['n', 'Siniestros'], ['nombre', 'Nombre']]} />
              <div className="flex items-center gap-2">
                <Checkbox id="chk-bajos" checked={ocultarBajos} onCheckedChange={(c) => setOcultarBajos(c === true)} />
                <Label htmlFor="chk-bajos" className="cursor-pointer text-small font-normal">Ocultar los de pocos siniestros</Label>
              </div>
            </div>
          </div>
          <p className="mb-2 flex items-center gap-2 text-small text-muted-foreground">
            <i className="inline-block h-3 w-4 rounded-[2px] bg-[#F2D98A]" aria-hidden="true" />
            La franja amarilla de cada miniatura indica cuándo se instalaron las cámaras.
          </p>
          <div className="pan-axis" aria-hidden="true">
            <span>Menos casos que sin cámara</span>
            <span>Más casos que sin cámara</span>
          </div>
          <ScrollArea className="max-h-[540px]">
          <ul className="pan-list" role="list">
            {lista.map((c: any) => {
              const bajo = c.n < N_BAJO
              const w = Math.min(50, (Math.abs(c.dif) / escala) * 50)
              return (
                <li key={c.corredor}>
                  <button
                    type="button"
                    className={`pan-row${c.corredor === sel?.corredor ? ' sel' : ''}${c.corredor === hover ? ' hov' : ''}${bajo ? ' low' : ''}`}
                    aria-pressed={c.corredor === sel?.corredor}
                    onClick={() => elegir(c.corredor)}
                    onMouseMove={(ev) => showTip(c.tip, ev.nativeEvent)}
                    onMouseEnter={() => setHover(c.corredor)}
                    onMouseLeave={() => { hideTip(); setHover(null) }}
                    onFocus={() => setHover(c.corredor)}
                    onBlur={() => setHover(null)}
                  >
                    <span className="pan-name">
                      {c.corredor}
                      <small>{bajo ? `${c.n} siniestros (pocos)` : `${c.n} siniestros`}</small>
                    </span>
                    <Mini meses={c.meses} />
                    <span className="pan-bar" aria-hidden="true">
                      <i style={c.dif < 0 ? { right: '50%', width: `${w}%` } : { left: '50%', width: `${w}%` }} />
                    </span>
                    <span className="pan-val">{pp(c.dif)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          </ScrollArea>
          {sinDato > 0 && <p className="note">{sinDato} corredor{sinDato > 1 ? 'es' : ''} sin siniestros en 2019, por lo que no tiene cambio calculable.</p>}
          {lista.length === 0 && <p className="note">Ningún corredor cumple el filtro.</p>}
        </div>

        {sel && <Detalle key={sel.corredor} sel={sel} ctrl={ctrl} />}
      </div>

      <Collapsible className="pan-more" id="pan-vel-wrap">
        <CollapsibleTrigger className="group flex w-full cursor-pointer items-center justify-between text-left text-[1rem] font-bold">
          Velocidad y gravedad por corredor
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <p className="note">
            Cada punto de la gráfica es un corredor.
            <Ayuda>El eje horizontal es la velocidad P85 de los tramos con cámara del corredor y el vertical, la proporción de siniestros con muertos a menos de {st.radio} m de las cámaras. No mide exposición: un corredor con más tráfico puede tener más siniestros.</Ayuda>
          </p>
          <Chart id="pan-vel" draw={(el) => speedSeverityScatter(el, velGrav, { selected: sel?.corredor, onSelect: elegir })} />
        </CollapsibleContent>
      </Collapsible>
    </section>
  )
}

/** Miniatura de la evolución mensual de un corredor (escala propia: muestra la forma, no el tamaño). */
function Mini({ meses }: { meses: ArrayLike<number> }) {
  const w = 176, h = 42, plot = 24
  const n = meses.length
  const mx = Math.max(1, ...Array.from(meses))
  const x = (i: number) => 1 + (i / (n - 1)) * (w - 2)
  const y = (v: number) => plot - 2 - (v / mx) * (plot - 4)
  const d = Array.from(meses).map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  return (
    <svg className="pan-mini" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <rect x={x(10.6)} width={x(14.9) - x(10.6)} y="0" height={plot} fill="#F2D98A" opacity="0.6" />
      <text x="1" y={h - 2} className="pan-mini-yr">2019</text>
      <text x={w - 1} y={h - 2} textAnchor="end" className="pan-mini-yr">2022</text>
      <path d={d} fill="none" stroke="#B5283A" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function Detalle({ sel, ctrl }: { sel: any; ctrl: number | null }) {
  const set = useStore((s) => s.set)
  const st = useStore((s) => s.st)
  const bajo = sel.n < N_BAJO
  const xs = [...Array(48).keys()]
  return (
    <Card className="pan-detail @container gap-3 px-4 py-4" id="pan-detalle" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div>
          <h3>{sel.corredor}</h3>
          <p className="muted">{sel.sitios} sitio{sel.sitios > 1 ? 's' : ''} de cámara, {fmt.int(sel.n)} siniestros en cuatro años</p>
        </div>
        <Button size="small" id="pan-ver" onClick={() => set({ tab: 'mapa', mapa: true, corredor: sel.corredor, sitio: null })}>
          <MapPin className="size-4" />
          Ver en el mapa
        </Button>
      </div>
      <div className="grid gap-x-6 gap-y-3 @2xl:grid-cols-[250px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <dl className="pan-nums !m-0">
            <div><dt>2019</dt><dd>{fmt.dec(sel.ma)}</dd><small>{nLabel(st)} por mes</small></div>
            <div><dt>2021–22</dt><dd>{fmt.dec(sel.md)}</dd><small>{nLabel(st)} por mes</small></div>
            <div><dt>Cambio</dt><dd>{fmt.pct(sel.cambio)}</dd><small>vías sin cámara: {fmt.pct(ctrl)}</small></div>
            <div><dt>Diferencia</dt><dd>{pp(sel.dif)}</dd><small>frente a vías sin cámara</small></div>
          </dl>
          {bajo && (
            <Alert className="border-border py-2">
              <TriangleAlert />
              <AlertDescription className="text-small">Hay pocos siniestros, así que un mes de más o de menos mueve mucho el promedio.</AlertDescription>
            </Alert>
          )}
        </div>
        <div>
          <p className="mb-1 text-small font-semibold">
            Siniestros por mes en el corredor
            <Ayuda>Evolución mensual del corredor de 2019 a 2022. La franja amarilla marca la instalación de las cámaras.</Ayuda>
          </p>
          <ChartLegend items={[{ label: 'Siniestros del corredor', color: C.cam }, { label: 'Instalación de las cámaras', color: '#FFD84D', area: true }]} />
          <Chart
            draw={(el) =>
              lineChart(el, {
                xs, series: [{ key: 'c', label: sel.corredor, color: C.cam, ys: [...sel.meses] }], xDomain: [0, 47],
                xTicks: xs.filter((m) => m % 12 === 0), xTickFormat: (m: number) => String(2019 + m / 12),
                bands: [{ x0: 10.6, x1: 14.9, cls: 'instalacion' }], sombra: true, height: 160, top: 14, left: 34, points: false,
                tooltip: (i: number) => `<b>${mesLabel(i)}</b><br>${sel.meses[i]} siniestros`,
              })
            }
          />
        </div>
      </div>
    </Card>
  )
}
void MESES_CORTOS
