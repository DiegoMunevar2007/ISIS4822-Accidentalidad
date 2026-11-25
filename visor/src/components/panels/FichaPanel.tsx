import { ANIOS, PERIODOS, antesDespues, sitiosDelAmbito, sumRange } from '@/data.js'
import { C, annualBars, fmt } from '@/charts.js'
import { useStore } from '@/store'
import { gravLabel, nLabel, nombreZona, ySiniestros, type Computed } from '@/lib/derived'
import { Info } from 'lucide-react'
import { Chart } from '@/components/charts/Chart'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChangeBars, PairedBars } from '@/components/charts/bits'

const minStr = (a: string[]) => a.reduce((x, y) => (y < x ? y : x))
const maxStr = (a: string[]) => a.reduce((x, y) => (y > x ? y : x))

export function FichaPanel({ K, visible }: { K: Computed; visible: boolean }) {
  const D = useStore((s) => s.D)!
  const st = useStore((s) => s.st)
  if (!visible) return <section className="panel ficha-panel" id="panel-ficha" hidden />

  const P = PERIODOS[st.periodo as keyof typeof PERIODOS]
  const years = ANIOS.filter((_: number, i: number) => i * 12 >= P.m0 && i * 12 <= P.m1)
  const N = sumRange(K.mScope, P.m0, P.m1)
  const zonaAD = antesDespues(K.mZona)
  const ctrlAD = antesDespues(K.mCtrl)
  const sitios = sitiosDelAmbito(D, st)
  const nCam = sitios.reduce((a: number, s: { n_camaras: number }) => a + s.n_camaras, 0)
  const diff = zonaAD.cambio != null && ctrlAD.cambio != null ? zonaAD.cambio - ctrlAD.cambio : null
  const pp = diff == null ? '—' : `${diff > 0 ? '+' : ''}${fmt.dec(diff * 100)} p.p`
  const aviso =
    diff == null ? 'No hay suficientes datos en este ámbito para comparar.'
      : zonaAD.antes + zonaAD.despues < 30 ? `Pocos casos (${fmt.int(zonaAD.antes + zonaAD.despues)}): interpretar con cautela.` : null
  const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? 's' : ''}`
  const zona = nombreZona(D, st)
  const victRows = K.vict.filter((v: { antes: number; despues: number }) => v.antes + v.despues > 0)

  return (
    <section className="panel ficha-panel" id="panel-ficha">
      <header className="panel-head">
        <div><h2>Antes y después</h2></div>
      </header>
      <div id="f-ad">
        <h3 className="sec first">Con cámara y sin cámara</h3>
        <p className="sub desc">
          Compara el cambio del promedio mensual de {gravLabel(st)} entre 2019 y 2021–22 a menos de {st.radio} m de una cámara y en las vías de la ciudad que quedan a más de esa distancia. Estas últimas son la referencia (el control): muestran cómo cambió el resto de la ciudad.
        </p>
        <ChangeBars
          rows={[
            {
              label: zona, cambio: zonaAD.cambio, color: C.despues, detail: `de ${fmt.dec(zonaAD.ma)} a ${fmt.dec(zonaAD.md)} ${nLabel(st)} por mes`,
              tip: `<b>${zona}</b><br>2019: ${fmt.int(zonaAD.antes)} ${nLabel(st)} (${fmt.dec(zonaAD.ma)} por mes)<br>2021–22: ${fmt.int(zonaAD.despues)} ${nLabel(st)} (${fmt.dec(zonaAD.md)} por mes)`,
            },
            {
              label: `Vías sin cámara (a más de ${st.radio} m)`, cambio: ctrlAD.cambio, color: C.ctrl, detail: `de ${fmt.dec(ctrlAD.ma)} a ${fmt.dec(ctrlAD.md)} ${nLabel(st)} por mes`,
              tip: `<b>Vías sin cámara</b> (control: tramos Bitcarrier de toda la ciudad sin cámara cerca)<br>2019: ${fmt.int(ctrlAD.antes)} ${nLabel(st)} (${fmt.dec(ctrlAD.ma)} por mes)<br>2021–22: ${fmt.int(ctrlAD.despues)} ${nLabel(st)} (${fmt.dec(ctrlAD.md)} por mes)`,
            },
          ]}
        />
        <p className="diff-line">Diferencia entre ambas: <b>{pp}</b></p>
        {aviso && (
          <Alert className="mt-2 border-border">
            <Info />
            <AlertDescription className="text-small">{aviso}</AlertDescription>
          </Alert>
        )}
      </div>
      <h3 className="sec">
        Siniestros por año <span>N = {fmt.int(N)} en {years.length} año{years.length > 1 ? 's' : ''}</span>
      </h3>
      <p className="sub desc">Total de {gravLabel(st)} cada año en el ámbito. 2020 queda aparte por la pandemia y la instalación.</p>
      <Chart
        id="f-anual"
        draw={(el) =>
          annualBars(el, years.map((y: number) => ({ year: y, n: sumRange(K.mScope, (y - 2019) * 12, (y - 2019) * 12 + 11) })), {
            yMax: Math.max(...ANIOS.map((_: number, i: number) => sumRange(K.mScope, i * 12, i * 12 + 11))),
            yLabel: ySiniestros(st),
            onHover: (d: { year: number; n: number }) =>
              `<b>${d.year}</b>${d.year === 2020 ? ', año de transición (pandemia e instalación)' : ''}<br>${fmt.int(d.n)} ${nLabel(st)}<br>${fmt.dec(d.n / 12)} siniestros por mes`,
          })
        }
      />
      <h3 className="sec">
        Víctimas por condición
      </h3>
      <p className="sub desc">Promedio mensual de víctimas por tipo de usuario, antes y después de la instalación.</p>
      <div className="legend-inline">
        <span><i style={{ background: C.antes }} />2019</span>
        <span><i style={{ background: C.despues }} />2021–22</span>
      </div>
      <div id="f-vict">
        {victRows.length ? (
          <PairedBars
            rows={victRows.map((v: any) => ({
              label: v.condicion, a: v.ma, b: v.md, delta: v.ma > 0 ? (v.md - v.ma) / v.ma : null,
              tip: `<b>${v.condicion}</b><br>2019: ${fmt.int(v.antes)} víctimas (${fmt.dec(v.ma)} por mes)<br>2021–22: ${fmt.int(v.despues)} víctimas (${fmt.dec(v.md)} por mes)`,
            }))}
          />
        ) : (
          <p className="muted">Sin víctimas registradas con estos filtros.</p>
        )}
      </div>
      <h3 className="sec">Cámaras</h3>
      <p className="cams">
        {plural(sitios.length, 'sitio')} con {nCam} cámaras ({[...new Set<string>(sitios.map((s: any) => s.tipo))].join(' y ')}), límite{' '}
        {[...new Set<string>(sitios.map((s: any) => s.limite))].sort().join('/')} km/h, resoluciones del {minStr(sitios.map((s: any) => s.fecha))} al{' '}
        {maxStr(sitios.map((s: any) => s.fecha))}
      </p>
    </section>
  )
}
