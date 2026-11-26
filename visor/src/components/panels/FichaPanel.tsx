import { ANIOS, PERIODOS, antesDespues, sumRange } from '@/data.js'
import { C, annualBars, fmt } from '@/charts.js'
import { useStore } from '@/store'
import { gravLabel, nLabel, nombreZona, ySiniestros, type Computed } from '@/lib/derived'
import { Cctv, Info, VideoOff } from 'lucide-react'
import { Chart } from '@/components/charts/Chart'
import { Ayuda } from '@/components/charts/Ayuda'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChangeBars, PairedBars } from '@/components/charts/bits'


export function FichaPanel({ K, visible }: { K: Computed; visible: boolean }) {
  const D = useStore((s) => s.D)!
  const st = useStore((s) => s.st)
  if (!visible) return <section className="panel ficha-panel" id="panel-ficha" hidden />

  const P = PERIODOS[st.periodo as keyof typeof PERIODOS]
  const years = ANIOS.filter((_: number, i: number) => i * 12 >= P.m0 && i * 12 <= P.m1)
  const N = sumRange(K.mScope, P.m0, P.m1)
  // La comparación toma 2019 como base y el periodo elegido como "después"; sin periodo posterior no hay comparación.
  const sinCambio = st.periodo === 'antes'
  const [d0, d1] = st.periodo === 'transicion' ? [12, 23] : [24, 47]
  const dLab = st.periodo === 'transicion' ? '2020' : '2021–22'
  const zonaAD = antesDespues(K.mZona, d0, d1)
  const ctrlAD = antesDespues(K.mCtrl, d0, d1)
  const diff = zonaAD.cambio != null && ctrlAD.cambio != null ? zonaAD.cambio - ctrlAD.cambio : null
  const aviso =
    sinCambio ? null : diff == null ? 'No hay suficientes datos en este ámbito para comparar.'
      : zonaAD.antes + zonaAD.despues < 30 ? `Pocos siniestros (${fmt.int(zonaAD.antes + zonaAD.despues)}): interpretar con cautela.` : null
  const zona = nombreZona(D, st)
  const victRows = K.vict.filter((v: { antes: number; despues: number }) => v.antes + v.despues > 0)

  return (
    <section className="panel ficha-panel" id="panel-ficha">
      <header className="panel-head">
        <div><h2>Cambio frente a 2019</h2></div>
      </header>
      <div id="f-ad">
        <h3 className="sec first">
          Con cámara y sin cámara
          <Ayuda>
            Cada barra es el cambio del promedio mensual de {nLabel(st)} frente a 2019. La zona con cámara son los siniestros a menos de {st.radio} m de una cámara; las vías sin cámara son el resto de la ciudad y sirven de referencia.
          </Ayuda>
        </h3>
        {!sinCambio && <p className="sub desc">Cambio del promedio mensual entre 2019 y {dLab}.</p>}
        {sinCambio ? (
          <Alert className="mt-2 border-border">
            <Info />
            <AlertDescription className="text-small">Este periodo es anterior a la instalación y no tiene con qué compararse. Con "Todo 2019–2022", "Instalación y pandemia (2020)" o "Después de la instalación (2021–2022)" aparece el cambio frente a 2019.</AlertDescription>
          </Alert>
        ) : (<>
        <ChangeBars
          rows={[
            {
              icon: Cctv, label: zona, cambio: zonaAD.cambio, color: C.despues, bajo: zonaAD.antes + zonaAD.despues < 30, detail: `de ${fmt.dec(zonaAD.ma)} a ${fmt.dec(zonaAD.md)} ${nLabel(st)} por mes`,
              tip: `<b>${zona}</b><br>En 2019, ${fmt.int(zonaAD.antes)} ${nLabel(st)} (${fmt.dec(zonaAD.ma)} por mes)<br>En ${dLab}, ${fmt.int(zonaAD.despues)} ${nLabel(st)} (${fmt.dec(zonaAD.md)} por mes)`,
            },
            {
              icon: VideoOff, label: `Vías sin cámara (a más de ${st.radio} m)`, cambio: ctrlAD.cambio, color: C.ctrl, detail: `de ${fmt.dec(ctrlAD.ma)} a ${fmt.dec(ctrlAD.md)} ${nLabel(st)} por mes`,
              tip: `<b>Vías sin cámara</b> (tramos de toda la ciudad sin cámara cerca)<br>En 2019, ${fmt.int(ctrlAD.antes)} ${nLabel(st)} (${fmt.dec(ctrlAD.ma)} por mes)<br>En ${dLab}, ${fmt.int(ctrlAD.despues)} ${nLabel(st)} (${fmt.dec(ctrlAD.md)} por mes)`,
            },
          ]}
        />
        </>)}
        {aviso && (
          <Alert className="mt-2 border-border">
            <Info />
            <AlertDescription className="text-small">{aviso}</AlertDescription>
          </Alert>
        )}
      </div>
      <h3 className="sec">
        Siniestros por año <span>N = {fmt.int(N)} en {years.length} año{years.length > 1 ? 's' : ''}</span>
        <Ayuda>Cada barra es el total de {nLabel(st)} de un año. 2020 va aparte, en gris claro, por la pandemia y la instalación de las cámaras.</Ayuda>
      </h3>
      {years.length === 1 ? (
        <p className="m-0 mt-1" id="f-anual">
          <b className="text-kpi">{fmt.int(N)}</b> {nLabel(st)} en {years[0]}, es decir, {fmt.dec(N / 12)} por mes.
        </p>
      ) : (<>
      <p className="sub desc">Total de {nLabel(st)} por año.</p>
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
      </>)}
      <h3 className="sec">
        Víctimas por condición
        <Ayuda>Cada tipo de usuario tiene dos barras: el promedio mensual de víctimas en 2019 y en {dLab}. El porcentaje de la derecha es el cambio entre ambas.</Ayuda>
      </h3>
      {!sinCambio && (<>
      <p className="sub desc">Promedio mensual de víctimas por tipo de usuario.</p>
      <div className="legend-inline">
        <span><i style={{ background: C.antes }} />2019</span>
        <span><i style={{ background: C.despues }} />{dLab}</span>
      </div>
      </>)}
      <div id="f-vict">
        {sinCambio ? (
          <p className="muted">Este periodo es anterior a la instalación, así que no hay víctimas posteriores con qué comparar.</p>
        ) : victRows.length ? (
          <PairedBars
            rows={victRows.map((v: any) => ({
              label: v.condicion, a: v.ma, b: v.md, delta: v.ma > 0 ? (v.md - v.ma) / v.ma : null,
              tip: `<b>${v.condicion}</b><br>En 2019, ${fmt.int(v.antes)} víctimas (${fmt.dec(v.ma)} por mes)<br>En ${dLab}, ${fmt.int(v.despues)} víctimas (${fmt.dec(v.md)} por mes)`,
            }))}
          />
        ) : (
          <p className="muted">Sin víctimas registradas con estos filtros.</p>
        )}
      </div>
    </section>
  )
}
