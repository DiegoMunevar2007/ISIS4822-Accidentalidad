import type { ReactNode } from 'react'
import { ANIOS, MESES_CORTOS, N_MESES, PERIODOS, mesLabel, sumRange, velocidadDelAmbito } from '@/data.js'
import { C, contextBrush, diffChart, fmt, lineChart } from '@/charts.js'
import { useStore } from '@/store'
import {
  INSTALACION, OPERACION, dayDate, fmtDia, gravLabel, nLabel, monthStartDay, nombreAmbito, nombreZona, ySiniestros, type Computed,
} from '@/lib/derived'
import { Chart } from '@/components/charts/Chart'
import { Ayuda } from '@/components/charts/Ayuda'
import { ChartLegend, type LegendItem } from '@/components/charts/bits'
import { Seg } from '@/components/ui/seg'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const granularidad = (span: number) => (span <= 100 ? 'dia' : span <= 400 ? 'semana' : 'mes')

function tickDays([a, b]: number[], gran: string) {
  const out: number[] = []
  if (gran === 'mes') {
    const span = b - a
    const step = span > 900 ? 6 : span > 500 ? 3 : 1
    for (let m = 0; m <= N_MESES; m += step) if (monthStartDay[m] >= a && monthStartDay[m] <= b) out.push(monthStartDay[m])
  } else if (gran === 'semana') {
    for (let m = 0; m <= N_MESES; m++) if (monthStartDay[m] >= a && monthStartDay[m] <= b) out.push(monthStartDay[m])
  } else {
    const step = b - a > 50 ? 7 : b - a > 20 ? 3 : 1
    for (let d = a; d <= b; d += step) out.push(d)
  }
  return out
}
function tickFmt(d: number, gran: string) {
  const dt = dayDate(d)
  if (gran === 'dia') return `${dt.getDate()} ${MESES_CORTOS[dt.getMonth()]}`
  return dt.getMonth() === 0 ? String(dt.getFullYear()) : MESES_CORTOS[dt.getMonth()]
}
const legendDot = (c: string) => `<i class="dot" style="background:${c}"></i>`
const monthTick = (m: number) => (m % 12 === 0 ? String(2019 + m / 12) : MESES_CORTOS[m % 12])
// Mismos colores que en "Siniestros por año": 2019 gris, 2020 gris claro y 2021 y 2022 rojo.
const COL_ANIO: Record<number, string> = { 2019: C.antes, 2020: C.neutral, 2021: C.despues, 2022: C.despues }

interface Block {
  title: string
  sub: string
  desc: string
  help: string
  legend: ReactNode
  note: ReactNode
  main?: (el: HTMLDivElement) => void
  /** Reemplaza al gráfico principal (por ejemplo, varios recuadros). */
  custom?: ReactNode
  context?: (el: HTMLDivElement) => void
}

export function SeriePanel({ K, visible }: { K: Computed; visible: boolean }) {
  const D = useStore((s) => s.D)!
  const st = useStore((s) => s.st)
  const set = useStore((s) => s.set)
  if (!visible) return <section className="panel serie-panel" id="panel-serie" hidden />

  const P = PERIODOS[st.periodo as keyof typeof PERIODOS]
  const modos: ['linea' | 'anios' | 'control', string][] = [['linea', 'Línea de tiempo'], ['anios', 'Años superpuestos'], ['control', 'Con y sin cámara']]

  const buildLinea = (): Block => {
    const r = st.rango ?? [monthStartDay[P.m0], monthStartDay[P.m1 + 1] - 1]
    const gran = granularidad(r[1] - r[0])
    const xs: number[] = [], ys: number[] = [], lab: string[] = []
    if (gran === 'mes') {
      for (let m = 0; m < N_MESES; m++) { xs.push(monthStartDay[m] + 14); ys.push(K.mScope[m]); lab.push(mesLabel(m)) }
    } else if (gran === 'semana') {
      // semanas que empiezan en lunes (1-ene-2019 fue martes)
      for (let w0 = -1; w0 < 1461; w0 += 7) {
        let s = 0
        for (let d = Math.max(0, w0); d < Math.min(1461, w0 + 7); d++) s += K.dScope[d]
        xs.push(w0 + 3); ys.push(s); lab.push(`Semana del ${fmtDia(Math.max(0, w0))}`)
      }
    } else {
      for (let d = 0; d < 1461; d++) {
        xs.push(d); ys.push(K.dScope[d])
        lab.push(`${['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][dayDate(d).getDay()]} ${fmtDia(d)}`)
      }
    }
    // Referencia para leer el cambio: el promedio de 2019 en la misma unidad (mes, semana o día).
    const dias2019 = Array.from(K.dScope.slice(0, 365)).reduce((a, v) => a + v, 0) / 365
    const base2019 = gran === 'mes' ? sumRange(K.mScope, 0, 11) / 12 : gran === 'semana' ? dias2019 * 7 : dias2019
    const yMax = Math.max(1, ...ys)
    const inR = xs.map((x) => x >= r[0] - 16 && x <= r[1] + 16)
    const gl = { mes: 'meses', semana: 'semanas', dia: 'días' }[gran]
    const bandas = [
      { x0: monthStartDay[12], x1: monthStartDay[24], label: 'Pandemia 2020', cls: 'pandemia', row: 0, align: 'end' },
      { x0: INSTALACION[0], x1: INSTALACION[1], label: 'Instalación de las cámaras', cls: 'instalacion', row: 1 },
    ]
    const xsIn = xs.filter((_, i) => inR[i])
    return {
      title: `Siniestros por ${{ mes: 'mes', semana: 'semana', dia: 'día' }[gran]}`,
      sub: `${fmtDia(r[0])} a ${fmtDia(r[1])}`,
      desc: 'Evolución de los siniestros en el tiempo.',
      help: 'Cada punto es un mes (o una semana o un día, al acercar). La línea gris es el promedio de 2019. Bajo el gráfico, la cinta marca la instalación de las cámaras y la pandemia. La franja inferior sirve para acercar un periodo: arrastrar sobre ella; un clic fuera de la selección vuelve a mostrar todo.',
      legend: null,
      main: (el) => lineChart(el, {
        xs: xsIn,
        series: [{ key: 'z', label: nombreAmbito(D, st), color: C.cam, ys: ys.filter((_, i) => inR[i]) }],
        xDomain: r, yMax,
        xTicks: tickDays(r, gran), xTickFormat: (d: number) => tickFmt(d, gran),
        yLabel: ySiniestros(st),
        bands: bandas, carriles: true,
        vlines: [{ x: OPERACION, label: 'Multas desde may-2020', color: C.ink2 }],
        refLines: base2019 > 0 ? [{ y: base2019, label: 'Promedio de 2019', solid: true }] : [],
        tooltip: (i: number) => {
          const k = xs.findIndex((x) => x === xsIn[i])
          const dif = base2019 > 0 ? (ys[k] - base2019) / base2019 : null
          return `<b>${lab[k]}</b><br>${fmt.int(ys[k])} ${nLabel(st)}${dif == null ? '' : `<br><span class="muted">${fmt.pct(dif)} frente al promedio de 2019</span>`}`
        },
        height: 260,
      }),
      context: (el) => contextBrush(el, {
        monthly: [...K.mScope], monthStartDay, range: st.rango, domain: [monthStartDay[P.m0], monthStartDay[P.m1 + 1]], onBrush: (rg: [number, number] | null) => set({ rango: rg }),
      }),
      // La franja es una interacción sin pista visual: una línea corta, pegada a ella.
      note: <>{st.rango ? 'Clic fuera de la selección para ver todo el periodo.' : 'Arrastrar sobre esta franja sirve para acercar un periodo.'}</>,
    }
  }

  const buildAnios = (): Block => {
    const years = ANIOS.filter((_: number, i: number) => i * 12 >= P.m0 && i * 12 <= P.m1)
    const mesesDe = (y: number) => Array.from({ length: 12 }, (_, k) => K.mScope[(y - 2019) * 12 + k])
    const yMax = Math.max(1, ...years.flatMap((y: number) => mesesDe(y)), ...mesesDe(2019))
    const etiqueta = (y: number) => `${y} (${y === 2019 ? 'antes' : y === 2020 ? 'transición' : 'después'})`
    const items: LegendItem[] = [
      ...(years.includes(2019) ? [{ label: '2019 (antes)', color: C.antes }] : []),
      ...(years.includes(2020) ? [{ label: '2020 (transición)', color: C.neutral }] : []),
      ...(years.some((y: number) => y >= 2021) ? [{ label: '2021 y 2022 (después)', color: C.despues }] : []),
    ]
    // El primer recuadro lleva el eje Y; los demás lo comparten. Se compensa el ancho para que todos tengan el mismo área de trazado.
    const n = years.length
    const cols = n === 1 ? '1fr' : `calc((100% - 54px - ${(n - 1) * 12}px) / ${n} + 54px) repeat(${n - 1}, calc((100% - 54px - ${(n - 1) * 12}px) / ${n}))`
    const custom = (
      <div className="facets" id="s-main" style={{ gridTemplateColumns: cols }}>
        {years.map((y: number, idx: number) => {
          const ys = mesesDe(y)
          const total = ys.reduce((a: number, b: number) => a + b, 0)
          const ghost = y !== 2019 ? mesesDe(2019) : null
          return (
            <div key={y} className="facet">
              <h3>{etiqueta(y)}</h3>
              <p className="muted">{fmt.int(total)} en el año</p>
              <Chart
                draw={(el) => lineChart(el, {
                  xs: [...Array(12).keys()], xDomain: [0, 11], yMax, height: 230, points: false, hideYAxis: idx > 0,
                  left: idx === 0 ? 78 : 24, right: 16, yLabel: idx === 0 ? ySiniestros(st) : undefined,
                  xTicks: [0, 3, 6, 9], xTickFormat: (k: number) => MESES_CORTOS[k],
                  series: [
                    ...(ghost ? [{ key: 'g', label: '2019', color: C.antes, width: 1.5, ys: ghost }] : []),
                    { key: 'y', label: String(y), color: COL_ANIO[y], width: 2.5, ys },
                  ],
                  tooltip: (i: number) =>
                    `<b>${MESES_CORTOS[i]}</b><br>${legendDot(COL_ANIO[y])} ${y} <b>${fmt.int(ys[i])}</b>${ghost ? `<br>${legendDot(C.antes)} 2019 <b>${fmt.int(ghost[i])}</b>` : ''}`,
                })}
              />
            </div>
          )
        })}
      </div>
    )
    return {
      title: 'Un año frente a otro',
      sub: 'Un recuadro por año, de enero a diciembre y con la misma escala',
      desc: 'Cada año se compara con 2019, mes a mes.',
      help: 'Un recuadro por año, de enero a diciembre y con la misma escala vertical. Los colores son los de todo el dashboard, con gris para 2019, gris claro para 2020 y rojo para 2021 y 2022. En cada recuadro, la línea gris fina es 2019, de referencia.',
      legend: <ChartLegend items={items} />,
      custom,
      note: null,
    }
  }

  const buildControl = (): Block => {
    const base = (arr: ArrayLike<number>) => sumRange(arr, 0, 11) / 12 || 1
    const roll = (arr: ArrayLike<number>) => Array.from(arr as ArrayLike<number>, (_, i) => {
      const a = Math.max(0, i - 1), b = Math.min(N_MESES - 1, i + 1)
      return sumRange(arr, a, b) / (b - a + 1)
    })
    const bz = base(K.mZona), bc = base(K.mCtrl)
    const zi = roll(K.mZona).map((v) => (100 * v) / bz)
    const ci = roll(K.mCtrl).map((v) => (100 * v) / bc)
    const xs = [...Array(N_MESES).keys()]
    const series: any[] = [{ key: 'z', label: 'Con cámara', color: C.cam, ys: zi }]
    if (st.ctrlOn) series.push({ key: 'c', label: 'Sin cámara', color: C.ctrl, dash: true, ys: ci })
    const bandas = [
      { x0: 12, x1: 24, label: 'Pandemia 2020', cls: 'pandemia', row: 0, align: 'end' },
      { x0: 10.6, x1: 14.9, label: 'Instalación de las cámaras', cls: 'instalacion', row: 1 },
    ]
    const di = zi.map((v: number, i: number) => v - ci[i])
    const items: LegendItem[] = [
      { label: nombreZona(D, st), color: C.cam },
      ...(st.ctrlOn ? [{ label: `Vías sin cámara (a más de ${st.radio} m)`, color: C.ctrl, dash: true }] : []),
    ]
    return {
      title: 'Con cámara y sin cámara en el tiempo',
      sub: 'Porcentaje del nivel de 2019',
      desc: 'Siniestros cerca de las cámaras frente a las vías sin cámara.',
      help: 'Cada línea es el promedio mensual de siniestros como porcentaje del de 2019 (100 % = nivel de 2019), con media móvil de 3 meses. Abajo, la diferencia entre las dos líneas: sobre cero, el valor es más alto con cámara; bajo cero, más alto sin cámara.',
      legend: (
        <ChartLegend items={items}>
          <div className="legend-toggle">
            <Checkbox id="chk-ctrl" checked={st.ctrlOn} onCheckedChange={(c) => set({ ctrlOn: c === true })} />
            <Label htmlFor="chk-ctrl" className="cursor-pointer text-small font-normal">Mostrar vías sin cámara</Label>
          </div>
        </ChartLegend>
      ),
      main: (el) => lineChart(el, {
        xs, series, xDomain: [P.m0, P.m1],
        yMax: Math.max(140, ...zi.slice(P.m0, P.m1 + 1), ...(st.ctrlOn ? ci.slice(P.m0, P.m1 + 1) : [0])),
        xTicks: xs.filter((m) => m % (P.m1 - P.m0 > 24 ? 6 : 2) === 0), xTickFormat: monthTick,
        yLabel: '% del nivel de 2019', yFormat: (v: number) => `${v}%`,
        refLines: [{ y: 100, label: 'nivel de 2019' }], bands: bandas, carriles: true,
        vlines: [{ x: 16, label: 'Multas desde may-2020', color: C.ink2 }],
        height: 260,
        tooltip: (i: number) =>
          `<b>${mesLabel(i)}</b><br>${legendDot(C.cam)} Con cámara <b>${fmt.int(zi[i])}%</b> del nivel de 2019 (${fmt.int(K.mZona[i])} siniestros)${
            st.ctrlOn ? `<br>${legendDot(C.ctrl)} Sin cámara <b>${fmt.int(ci[i])}%</b> del nivel de 2019 (${fmt.int(K.mCtrl[i])} siniestros)` : ''}`,
      }),
      context: st.ctrlOn ? (el) => diffChart(el, {
        xs, ds: di, xDomain: [P.m0, P.m1], height: 200,
        xTicks: xs.filter((m) => m % (P.m1 - P.m0 > 24 ? 6 : 2) === 0), xTickFormat: monthTick,
        yLabel: 'Diferencia (%)',
        labels: ['Más alto con cámara', 'Más alto sin cámara'],
        tooltip: (i: number) => `<b>${mesLabel(i)}</b><br>Con cámara ${fmt.int(zi[i])}%, sin cámara ${fmt.int(ci[i])}%<br>Diferencia de <b>${di[i] > 0 ? '+' : ''}${fmt.int(di[i])}</b> %`,
      }) : undefined,
      note: null,
    }
  }

  const blk = st.serieModo === 'linea' ? buildLinea() : st.serieModo === 'anios' ? buildAnios() : buildControl()

  return (
    <section className="panel serie-panel" id="panel-serie">
      <header className="panel-head">
        <div><h2>{blk.title}<Ayuda>{blk.help}</Ayuda></h2><p className="sub" id="s-sub">{blk.sub}</p></div>
        <div className="head-segs">
          <Seg small id="seg-modo" value={st.serieModo} onChange={(serieModo) => set({ serieModo })} options={modos} />
        </div>
      </header>
      <p className="sub desc mb-2">{blk.desc}</p>
      <div id="s-legend">{blk.legend}</div>
      {blk.custom ?? <Chart id="s-main" draw={blk.main!} />}
      {blk.context ? <Chart id="s-context" draw={blk.context} /> : <div id="s-context" className="chart" />}
      <p className="note" id="s-note">{blk.note}</p>
      <Velocidad K={K} />
    </section>
  )
}

function Velocidad({ K: _K }: { K: Computed }) {
  const D = useStore((s) => s.D)!
  const st = useStore((s) => s.st)
  const set = useStore((s) => s.set)
  const P = PERIODOS[st.periodo as keyof typeof PERIODOS]
  const v = velocidadDelAmbito(D, st)
  const xs = [...Array(N_MESES).keys()]

  const desc = <p className="sub desc">Velocidad del tráfico en los tramos con cámara y sin ella.</p>
  const heading = () => (
    <h3 className="sec">
      Velocidad del tráfico
      <Ayuda>El P85, o percentil 85, indica que el 85 % de los vehículos va a esa velocidad o más despacio. Se calcula cada mes con los tramos medidos por Bitcarrier. La línea horizontal es el límite de velocidad. La línea vertical marca el inicio de las multas.</Ayuda>
    </h3>
  )

  if (!v || (v.cam.n === 0 && v.sin.n === 0)) {
    return <>{heading()}{desc}<div id="v-chart" className="chart"><p className="muted">No existe información de velocidad para este corredor.</p></div></>
  }
  const sitio = v.fuente === 'sitio'
  const nomCam = sitio ? nombreAmbito(D, st) : 'Con cámara'
  const nomSin = sitio ? 'Resto de la vía, sin cámara' : 'Sin cámara'
  const series: any[] = []
  if (v.cam.n) series.push({ key: 'c', label: nomCam, color: C.cam, ys: v.cam.p85 })
  if (v.sin.n) series.push({ key: 's', label: nomSin, color: C.ctrl, dash: true, ys: v.sin.p85 })
  if (!series.length) {
    return <>{heading()}{desc}<div id="v-chart" className="chart"><p className="muted">No hay tramos con ese filtro en este corredor.</p></div></>
  }
  const vals = series.flatMap((s) => s.ys.filter((x: number | null) => x != null)) as number[]
  // Cada serie menos su propio promedio de 2019 (media móvil de 3 meses); la diferencia es con menos sin cámara.
  const media = (a: (number | null)[]) => {
    const f = a.filter((x): x is number => x != null)
    return f.length ? f.reduce((s, x) => s + x, 0) / f.length : null
  }
  const cambio = (a: (number | null)[]) => {
    const base = media(a.slice(0, 12))
    return base == null ? null : a.map((_, i) => {
      const m = media(a.slice(Math.max(0, i - 1), Math.min(a.length, i + 2)))
      return m == null ? null : m - base
    })
  }
  const cCam = v.cam.n ? cambio(Array.from(v.cam.p85)) : null
  const cSin = v.sin.n ? cambio(Array.from(v.sin.p85)) : null
  const dif = cCam && cSin ? cCam.map((x, i) => (x == null || cSin[i] == null ? null : x - cSin[i]!)) : null
  const conSigno = (x: number | null) => (x == null ? 'sin dato' : `${x > 0 ? '+' : x < 0 ? '−' : ''}${fmt.dec(Math.abs(x))}`)
  const ticks = xs.filter((m) => m % (P.m1 - P.m0 > 24 ? 6 : 2) === 0)
  const items: LegendItem[] = [
    ...(v.cam.n ? [{ label: sitio ? `${nomCam} (${v.cam.n} ${v.cam.n > 1 ? 'tramos' : 'tramo'})` : `Tramos con cámara (${v.cam.n})`, color: C.cam }] : []),
    ...(v.sin.n ? [{ label: sitio ? `${nomSin} (${v.sin.n} tramos)` : `Tramos sin cámara (${v.sin.n})`, color: C.ctrl, dash: true }] : []),
  ]
  return (
    <>
      {heading()}
      {desc}
      <div className="serie-subhead">
        <div id="v-legend" className="flex-1"><ChartLegend items={items} /></div>
      </div>
      <Chart
        id="v-chart"
        draw={(el) => lineChart(el, {
          xs, series, xDomain: [P.m0, P.m1],
          yMin: Math.floor((Math.min(...vals, v.limite ?? 99) - 5) / 5) * 5,
          yMax: Math.ceil((Math.max(...vals, v.limite ?? 0) + 3) / 5) * 5,
          xTicks: xs.filter((m) => m % (P.m1 - P.m0 > 24 ? 6 : 2) === 0), xTickFormat: monthTick,
          yLabel: 'Velocidad P85 (km/h)',
          refLines: v.limite ? [{ y: v.limite, label: `límite ${v.limite} km/h` }] : [],
          vlines: [{ x: 16, label: 'Multas desde may-2020', color: C.ink2 }],
          height: 220, yFormat: (d: number) => d,
          tooltip: (i: number) =>
            `<b>${mesLabel(i)}</b><br>${series.map((s) => `${legendDot(s.color)} ${s.label} <b>${s.ys[i] == null ? 'sin dato' : `${fmt.dec(s.ys[i])} km/h`}</b>`).join('<br>')}`,
        })}
      />
      {dif ? (
        <>
          <p className="mb-1 mt-5 text-small font-semibold">
            Diferencia entre con y sin cámara
            <Ayuda>Cada serie se compara con su propio promedio de 2019 (media móvil de 3 meses) y se resta el cambio de los tramos sin cámara al de los tramos con cámara. Sobre cero, la velocidad de los tramos con cámara quedó más alta, respecto de su nivel de 2019, que la de los tramos sin cámara; bajo cero, quedó más baja.</Ayuda>
          </p>
          <Chart
            id="v-dif"
            draw={(el) => diffChart(el, {
              xs, ds: dif, xDomain: [P.m0, P.m1], height: 170, minLim: 3, xTicks: ticks, xTickFormat: monthTick,
              yLabel: 'Diferencia (km/h)', labels: ['Velocidad más alta con cámara', 'Velocidad más baja con cámara'],
              tooltip: (i: number) => {
                const d = dif[i]
                if (d == null) return `<b>${mesLabel(i)}</b><br>sin dato`
                const lectura = Math.abs(d) < 0.05 ? 'sin diferencia' : d > 0 ? 'velocidad más alta con cámara' : 'velocidad más baja con cámara'
                return `<b>${mesLabel(i)}</b><br>${legendDot(C.cam)} ${nomCam} <b>${conSigno(cCam![i])} km/h</b><br>${legendDot(C.ctrl)} ${nomSin} <b>${conSigno(cSin![i])} km/h</b><br>Diferencia de <b>${conSigno(d)} km/h</b>, ${lectura}<br><span class="muted">cambio frente al promedio de 2019</span>`
              },
            })}
          />
        </>
      ) : (
        <p className="note">Para ver el cambio frente a 2019 hacen falta tramos con y sin cámara con datos de velocidad en 2019.</p>
      )}
      <p className="caveat" id="v-note">El P85, o percentil 85, indica que el 85 % de los vehículos va a esa velocidad o más despacio. Mide la velocidad alta habitual, no el promedio: 15 de cada 100 vehículos van más rápido.</p>
    </>
  )
}
