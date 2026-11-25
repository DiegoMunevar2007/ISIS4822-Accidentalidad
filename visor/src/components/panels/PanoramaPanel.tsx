import { useState } from 'react'
import { MESES_CORTOS, cambioPorCorredor, cambioPorGravedad, velocidadGravedadPorCorredor, mesLabel } from '@/data.js'
import { C, fmt, hideTip, lineChart, showTip, speedSeverityScatter } from '@/charts.js'
import { useStore } from '@/store'
import { gravLabel } from '@/lib/derived'
import { Chart } from '@/components/charts/Chart'
import { Button } from '@/components/ui/button'
import { Seg } from '@/components/ui/seg'
import { TriangleAlert } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useUi } from '@/ui-store'

/** Por debajo de este N (siniestros en 4 años) el promedio mensual es poco fiable. */
const N_BAJO = 10

type Orden = 'dif' | 'n' | 'nombre'
const pp = (v: number | null) => (v == null ? '—' : `${v > 0 ? '+' : ''}${fmt.dec(v * 100)} p.p.`)

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
  // La escala la fijan los corredores con casos suficientes; los demás se recortan en el borde.
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
          <h2 className="pan-title">Cambio por corredor</h2>
          <p className="sub desc">
            Muestra en qué corredores el cambio de {gravLabel(st)} entre 2019 y 2021–22 fue mayor o menor que en las vías sin cámara (el control), a menos de {st.radio} m de las cámaras. Cada barra es el cambio del corredor menos el de esas vías.
            Un clic en un corredor muestra su detalle y lo ubica en el mapa. Diferencia de toda la zona con cámara: {pp(difGlobal)}
          </p>
        </div>
      </div>

      <div className="pan-grid">
        <div id="pan-corredores-wrap">
          <div className="pan-tools">
            <div className="flex flex-wrap items-center gap-3">
              <Seg small label="Orden" prefix="Ordenar por" value={orden} onChange={setOrden}
                options={[['dif', 'Diferencia'], ['n', 'Casos'], ['nombre', 'Nombre']]} />
              <div className="flex items-center gap-2">
                <Checkbox id="chk-bajos" checked={ocultarBajos} onCheckedChange={(c) => setOcultarBajos(c === true)} />
                <Label htmlFor="chk-bajos" className="cursor-pointer text-small font-normal">Ocultar los de pocos casos</Label>
              </div>
            </div>
          </div>
          <div className="pan-axis" aria-hidden="true">
            <span>Menos casos que sin cámara</span>
            <span>Más casos que sin cámara</span>
          </div>
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
                      <small>{bajo ? `${c.n} casos (pocos)` : `${c.n} casos`}</small>
                    </span>
                    <span className="pan-bar" aria-hidden="true">
                      <i style={c.dif < 0 ? { right: '50%', width: `${w}%` } : { left: '50%', width: `${w}%` }} />
                    </span>
                    <span className="pan-val">{pp(c.dif)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {sinDato > 0 && <p className="note">{sinDato} corredor{sinDato > 1 ? 'es' : ''} sin casos en 2019: no tiene cambio calculable.</p>}
          {lista.length === 0 && <p className="note">Ningún corredor cumple el filtro.</p>}
        </div>

        {sel && <Detalle key={sel.corredor} sel={sel} ctrl={ctrl} />}
      </div>

      <details className="pan-more" id="pan-vel-wrap">
        <summary>Velocidad y gravedad por corredor</summary>
        <p className="note">
          Cada punto es un corredor. La velocidad es la P85 de los tramos con cámara y la gravedad, la proporción de siniestros con muertos a menos de {st.radio} m.
          No mide exposición: un corredor con más tráfico puede tener más casos.
        </p>
        <Chart id="pan-vel" draw={(el) => speedSeverityScatter(el, velGrav, { selected: sel?.corredor, onSelect: elegir })} />
      </details>
    </section>
  )
}

function Detalle({ sel, ctrl }: { sel: any; ctrl: number | null }) {
  const set = useStore((s) => s.set)
  const bajo = sel.n < N_BAJO
  const xs = [...Array(48).keys()]
  return (
    <Card className="pan-detail @container gap-3 px-4 py-4" id="pan-detalle" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div>
          <h3>{sel.corredor}</h3>
          <p className="muted">{sel.sitios} sitio{sel.sitios > 1 ? 's' : ''} de cámara, {fmt.int(sel.n)} casos en cuatro años</p>
        </div>
        <Button size="small" id="pan-ver" onClick={() => set({ tab: 'mapa', mapa: true, corredor: sel.corredor, sitio: null })}>
          Ver en el mapa
        </Button>
      </div>
      <div className="grid gap-x-6 gap-y-3 @2xl:grid-cols-[minmax(260px,0.9fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col gap-3">
          <dl className="pan-nums !m-0">
            <div><dt>2019, por mes</dt><dd>{fmt.dec(sel.ma)}</dd></div>
            <div><dt>2021–22, por mes</dt><dd>{fmt.dec(sel.md)}</dd></div>
            <div><dt>Cambio</dt><dd>{fmt.pct(sel.cambio)}</dd><small>sin cámara {fmt.pct(ctrl)}</small></div>
            <div><dt>Diferencia</dt><dd>{pp(sel.dif)}</dd></div>
          </dl>
          {bajo && (
            <Alert className="border-border py-2">
              <TriangleAlert />
              <AlertDescription className="text-small">Pocos casos: un mes de más o de menos mueve mucho el promedio.</AlertDescription>
            </Alert>
          )}
        </div>
        <div>
          <p className="mb-1 text-small font-semibold">Siniestros por mes en el corredor</p>
          <Chart
            draw={(el) =>
              lineChart(el, {
                xs, series: [{ key: 'c', label: sel.corredor, color: C.cam, ys: [...sel.meses] }], xDomain: [0, 47],
                xTicks: xs.filter((m) => m % 12 === 0), xTickFormat: (m: number) => String(2019 + m / 12),
                bands: [{ x0: 10.6, x1: 14.9, label: 'Instalación' }], height: 150, top: 14, left: 34, points: false,
                tooltip: (i: number) => `<b>${mesLabel(i)}</b><br>${sel.meses[i]} casos`,
              })
            }
          />
        </div>
      </div>
    </Card>
  )
}
void MESES_CORTOS
