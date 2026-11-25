import { useRef } from 'react'
import { MESES_CORTOS, camarasActivas, mesLabel, sitiosDelAmbito, velocidadDelAmbito } from '@/data.js'
import { fmt, monthBars } from '@/charts.js'
import { RotateCcw, X } from 'lucide-react'
import { MESES_A_DEF, MESES_B_DEF, useStore } from '@/store'
import { gravLabel, nLabel, nombreZona, ySiniestros, type Computed } from '@/lib/derived'
import { Chart } from '@/components/charts/Chart'
import { Button } from '@/components/ui/button'
import { Seg } from '@/components/ui/seg'
import { asignar, cuantosMeses, etiquetaMeses, promedio, rango } from '@/lib/grupos'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function ABPanel({ K, visible }: { K: Computed; visible: boolean }) {
  const ultimo = useRef<number | null>(null)
  const D = useStore((s) => s.D)!
  const st = useStore((s) => s.st)
  const set = useStore((s) => s.set)
  if (!visible) return <section className="panel ab-panel" id="panel-ab" hidden />

  const sitios = sitiosDelAmbito(D, st)
  const v = velocidadDelAmbito(D, st)
  const { mesesA, mesesB } = st
  const totalCam = sitios.reduce((s: number, x: { n_camaras: number }) => s + x.n_camaras, 0)
  const zona = nombreZona(D, st)
  const sin = st.gravedad === 'todos' ? 'Siniestros' : nLabel(st).replace(/^./, (c: string) => c.toUpperCase())

  // Cada medida se resume como promedio mensual de los meses del grupo; así A y B pueden tener tamaños distintos.
  const prom = (serie: ArrayLike<number>, ms: number[]) => promedio(ms.map((i) => serie[i]))
  const velProm = (ms: number[]) => promedio(ms.map((i) => (v?.cam.n ? v.cam.p85[i] : null)).filter((x): x is number => x != null))
  const ultimaCam = (ms: number[]) => (ms.length ? camarasActivas(D, sitios, ms[ms.length - 1]) : null)
  const pct = (x: number | null, y: number | null) => (x != null && y != null && x > 0 ? fmt.pct((y - x) / x) : '—')
  const signo = (d: number) => (d > 0 ? '+' : d < 0 ? '−' : '')
  const dec = (x: number | null) => (x == null ? '—' : fmt.dec(x))
  const cambio = (x: number | null, y: number | null, unidad = '') =>
    x == null || y == null ? '—' : `${signo(y - x)}${fmt.dec(Math.abs(y - x))}${unidad} (${pct(x, y)})`

  const medidas: { medida: string; serie: ArrayLike<number> }[] = [
    { medida: `${sin} en Bogotá, por mes`, serie: K.mBogota },
    { medida: `${sin} en ${zona.charAt(0).toLowerCase()}${zona.slice(1)}, por mes`, serie: K.mZona },
    { medida: 'Víctimas fatales en la zona, por mes', serie: K.victMes },
  ]
  const filas: { medida: string; x: string; y: string; cambio: string }[] = [
    ...medidas.map(({ medida, serie }) => {
      const [x, y] = [prom(serie, mesesA), prom(serie, mesesB)]
      return { medida, x: dec(x), y: dec(y), cambio: cambio(x, y) }
    }),
    {
      medida: 'Cámaras instaladas al final del grupo',
      x: ultimaCam(mesesA) == null ? '—' : `${ultimaCam(mesesA)} de ${totalCam}`,
      y: ultimaCam(mesesB) == null ? '—' : `${ultimaCam(mesesB)} de ${totalCam}`,
      cambio: ultimaCam(mesesA) == null || ultimaCam(mesesB) == null ? '—' : ultimaCam(mesesA) === ultimaCam(mesesB) ? 'sin cambio' : `${signo((ultimaCam(mesesB) as number) - (ultimaCam(mesesA) as number))}${Math.abs((ultimaCam(mesesB) as number) - (ultimaCam(mesesA) as number))}`,
    },
    {
      medida: 'Velocidad P85, tramos con cámara',
      x: velProm(mesesA) == null ? '—' : `${dec(velProm(mesesA))} km/h`,
      y: velProm(mesesB) == null ? '—' : `${dec(velProm(mesesB))} km/h`,
      cambio: cambio(velProm(mesesA), velProm(mesesB), ' km/h'),
    },
  ]
  const vacio = mesesA.length === 0 || mesesB.length === 0
  // Las bandas solo representan tramos continuos: al volver a ellas cada grupo se reduce a su rango, y si chocan se restablece.
  const cambiarModo = (abModo: 'bandas' | 'meses') => {
    if (abModo === 'meses') return set({ abModo })
    const a = mesesA.length ? rango(mesesA[0], mesesA[mesesA.length - 1]) : MESES_A_DEF
    const b = mesesB.length ? rango(mesesB[0], mesesB[mesesB.length - 1]) : MESES_B_DEF
    const choca = a.some((m) => b.includes(m))
    set(choca ? { abModo, mesesA: MESES_A_DEF, mesesB: MESES_B_DEF } : { abModo, mesesA: a, mesesB: b })
  }
  const igual = (x: number[], y: number[]) => x.length === y.length && x.every((m, i) => m === y[i])
  const restablecido = igual(mesesA, MESES_A_DEF) && igual(mesesB, MESES_B_DEF)

  return (
    <section className="panel ab-panel" id="panel-ab">
      <header className="panel-head">
        <div>
          <h2>Comparar meses</h2>
          <p className="sub">
            {st.abModo === 'bandas'
              ? 'Arrastrar las bandas A y B sobre el gráfico, o sus bordes, para elegir los meses de cada una.'
              : `Clic o arrastre sobre las barras para elegir los meses del grupo ${st.abClick}. Shift + clic extiende desde el último mes.`}
          </p>
        </div>
        <div className="head-segs">
          <Seg small id="seg-ab-modo" label="Cómo elegir los meses" prefix="Selección" value={st.abModo} onChange={cambiarModo}
            options={[['bandas', 'Bandas'], ['meses', 'Meses sueltos']]} />
          <Button size="small" title="Volver a 2019 frente a 2021–22" disabled={restablecido} onClick={() => set({ mesesA: MESES_A_DEF, mesesB: MESES_B_DEF })}>
            <RotateCcw className="size-4" /> Restablecer meses
          </Button>
        </div>
      </header>
      {st.abModo === 'meses' && (
        <div className="mb-2 flex flex-wrap items-center gap-3" id="ab-meses-sueltos">
          <Seg small id="seg-click" prefix="Elegir para" value={st.abClick} onChange={(abClick) => set({ abClick })} options={[['A', 'Grupo A'], ['B', 'Grupo B']]} />
          <Button size="small" variant="ghost" onClick={() => set(st.abClick === 'A' ? { mesesA: [] } : { mesesB: [] })} disabled={(st.abClick === 'A' ? mesesA : mesesB).length === 0}>
            <X className="size-4" /> Vaciar el grupo {st.abClick}
          </Button>
        </div>
      )}
      <Chart
        id="ab-serie"
        draw={(el) => monthBars(el, {
          values: [...K.mZona], grupoA: mesesA, grupoB: mesesB, modo: st.abModo, activo: st.abClick, yLabel: ySiniestros(st), height: 280,
          xTickFormat: (m: number) => (m % 12 === 0 ? String(2019 + m / 12) : MESES_CORTOS[m % 12]),
          bands: [
            { x0: 12, x1: 23, label: 'Pandemia 2020', cls: 'pandemia', align: 'end' },
            { x0: 10, x1: 14, label: 'Instalación', cls: 'instalacion' },
          ],
          tooltip: (i: number) => {
            const g = mesesA.includes(i) ? 'A' : mesesB.includes(i) ? 'B' : null
            return `<b>${mesLabel(i)}</b>${g ? `, grupo ${g}` : ''}<br>${fmt.int(K.mZona[i])} ${nLabel(st)}`
          },
          resumen: (letra: 'A' | 'B', ancho: number) => {
            const p = prom(K.mZona, letra === 'A' ? mesesA : mesesB)
            return ancho > 120 ? `${letra} ${dec(p)} por mes` : `${letra} ${dec(p)}`
          },
          onRange: (letra: 'A' | 'B', d: number, h: number) => set(letra === 'A' ? { mesesA: rango(d, h) } : { mesesB: rango(d, h) }),
          onPick: (idx: number[], info: { shift: boolean; arrastre: boolean }) => {
            const aplicar = (ms: number[], modo: 'agregar' | 'alternar') => {
              const [na, nb] = asignar(mesesA, mesesB, st.abClick, ms, modo)
              set({ mesesA: na, mesesB: nb })
            }
            if (info.arrastre) return aplicar(idx, 'agregar')
            if (info.shift && ultimo.current != null) return aplicar(rango(ultimo.current, idx[0]), 'agregar')
            ultimo.current = idx[0]
            aplicar(idx, 'alternar')
          },
        })}
      />
      <Table className="ab-table text-body" id="ab-tabla">
        <TableHeader>
          <TableRow className="border-b-2 border-ink hover:bg-transparent">
            <TableHead className="w-[40%]"><span className="sr-only">Medida</span></TableHead>
            <TableHead className="text-right font-bold text-foreground">
              <span className="tag a mr-2 align-middle">A</span>{etiquetaMeses(mesesA)}
              <span className="block text-small font-normal text-muted-foreground">{mesesA.length ? cuantosMeses(mesesA) : 'Elegir meses'}</span>
            </TableHead>
            <TableHead className="text-right font-bold text-foreground">
              <span className="tag b mr-2 align-middle">B</span>{etiquetaMeses(mesesB)}
              <span className="block text-small font-normal text-muted-foreground">{mesesB.length ? cuantosMeses(mesesB) : 'Elegir meses'}</span>
            </TableHead>
            <TableHead className="text-right font-bold text-foreground">Cambio de A a B</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((f) => (
            <TableRow key={f.medida}>
              <TableCell className="py-3 font-medium">{f.medida}</TableCell>
              <TableCell className="py-3 text-right tabular-nums">{f.x}</TableCell>
              <TableCell className="py-3 text-right tabular-nums">{f.y}</TableCell>
              <TableCell className="py-3 text-right font-bold tabular-nums">{f.cambio}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {vacio && <p className="note">Cada grupo necesita al menos un mes para calcular el cambio.</p>}
    </section>
  )
}
