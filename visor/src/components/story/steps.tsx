import type { ReactNode } from 'react'
import { fmt } from '@/charts.js'
import { setState, type State } from '@/store'
import { useUi } from '@/ui-store'

export const ACTS = [
  { name: 'Acto I', label: 'Inicio', steps: [0, 1] },
  { name: 'Acto II', label: 'Datos', steps: [2, 3, 4, 5, 6] },
  { name: 'Acto III', label: 'Conclusiones', steps: [7, 8] },
  // La copa del martini: después del recorrido guiado, el dashboard queda abierto.
  { name: 'Exploración', label: 'Explorar', steps: [9] },
]

/** Claves del estado que la historia vigila para detectar que el usuario se salió del guion. */
export const KEYS: (keyof State)[] = ['tab', 'mapa', 'corredor', 'sitio', 'periodo', 'gravedad', 'radio', 'excluirCruce', 'serieModo', 'ctrlOn', 'rango', 'actor']

/** Cifras que citan los textos; se calculan con los datos cargados. */
export type Metrics = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  byGrav: any[]
  anual: number[]
  vict: { condicion: string; cambio: number | null }[]
  top: { antes: string[]; despues: string[] }
  extremos: { ctrl: number; mejor: { corredor: string; dif: number }; peor: { corredor: string; dif: number } } | null
  r: number | null
  nCorredores: number
}

export interface StepDef {
  act: number
  title: string
  body: (M: Metrics) => ReactNode
  hint?: string
  patch: (fresh: State) => State
  focus?: string[]
  spot?: string
  allow?: (keyof State)[]
  allowAll?: boolean
  cards?: { title: string; text: string }[]
  acciones?: { label: string; run: () => void }[]
}

const fatal = (M: Metrics) => M.byGrav.find((x) => x.key === 'fatal') ?? M.byGrav[0]
const pct = (v: number | null | undefined) =>
  v == null || !isFinite(v) ? 'sin dato' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmt.dec(Math.abs(v) * 100)}%`
const lista = (a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} y ${a[a.length - 1]}`)
const veredicto = (M: Metrics) => {
  const f = fatal(M)
  const d = f.zona.cambio - f.control.cambio
  if (Math.abs(d) < 0.02) return 'Los dos cambios son parecidos.'
  return d < 0 ? 'La zona con cámara mejoró más que las vías sin cámara.' : 'En conjunto, la zona con cámara no mejoró más que las vías sin cámara.'
}

export const STEPS: StepDef[] = [
  {
    act: 0, title: 'Dónde están las cámaras',
    body: () => <>Entre noviembre de 2019 y marzo de 2020 Bogotá instaló 92 cámaras en 40 sitios de 18 corredores. En el mapa, cada círculo es un sitio y su tamaño indica cuántas cámaras tiene. Las vías sin cámara, a más de 500 m de cualquier cámara, sirven de referencia.</>,
    hint: 'Al señalar un sitio del mapa aparecen su corredor y sus cámaras.',
    patch: (f) => ({ ...f, tab: 'mapa', mapa: true, gravedad: 'fatal' }),
    focus: ['#panel-map', '#panel-ficha'], spot: '#map',
  },
  {
    act: 0, title: 'Un quiebre en 2020',
    body: (M) => <>Los siniestros con muertos en Bogotá fueron {fmt.int(M.anual[0])} en 2019, {fmt.int(M.anual[1])} en 2020, {fmt.int(M.anual[2])} en 2021 y {fmt.int(M.anual[3])} en 2022. El punto más bajo coincide con la pandemia y con el inicio de las multas, en mayo de 2020, así que la instalación por sí sola no explica el cambio.</>,
    hint: 'Arrastrar sobre la franja inferior sirve para acercar un periodo.',
    patch: (f) => ({ ...f, tab: 'serie', mapa: false, serieModo: 'linea', gravedad: 'fatal' }),
    focus: ['#panel-serie'], spot: '#s-context', allow: ['rango'],
  },
  {
    act: 1, title: 'Cerca y lejos de las cámaras',
    body: (M) => {
      const f = fatal(M)
      return <>Con muertos, la zona con cámara pasó de {fmt.dec(f.zona.ma)} a {fmt.dec(f.zona.md)} siniestros por mes ({pct(f.zona.cambio)}). Las vías sin cámara pasaron de {fmt.dec(f.control.ma)} a {fmt.dec(f.control.md)} ({pct(f.control.cambio)}). {veredicto(M)}</>
    },
    hint: 'La gravedad se cambia en los filtros para ver los otros niveles.',
    patch: (f) => ({ ...f, tab: 'mapa', mapa: true, gravedad: 'fatal' }),
    focus: ['#panel-ficha'], spot: '#f-ad', allow: ['gravedad'],
  },
  {
    act: 1, title: 'Peatones, motociclistas y ciclistas',
    body: (M) => {
      const por = (re: RegExp) => M.vict.find((v) => re.test(v.condicion.toLowerCase()))
      const p = por(/^peat/), m = por(/^moto/), c = por(/^cicl/)
      return <>Con muertos, el promedio mensual de víctimas en la zona con cámara cambió {pct(p?.cambio)} entre peatones, {pct(m?.cambio)} entre motociclistas y {pct(c?.cambio)} entre ciclistas, de 2019 a 2021–22. Son promedios mensuales y en varias filas hay pocos siniestros.</>
    },
    hint: 'Al señalar una fila aparece su detalle.',
    patch: (f) => ({ ...f, tab: 'mapa', mapa: true, gravedad: 'fatal' }),
    focus: ['#panel-ficha'], spot: '#f-vict',
  },
  {
    act: 1, title: 'Antes y después en el mapa',
    body: (M) => {
      const { antes, despues } = M.top
      const quedan = antes.filter((c) => despues.includes(c))
      const salen = antes.filter((c) => !despues.includes(c))
      const entran = despues.filter((c) => !antes.includes(c))
      const cambio = !entran.length && !salen.length
        ? 'Son los mismos en los dos periodos.'
        : !quedan.length
          ? 'Ninguno se repite entre los dos periodos.'
          : `${lista(quedan)} ${quedan.length > 1 ? 'se mantienen' : 'se mantiene'}, y ${lista(entran)} ${entran.length > 1 ? 'reemplazan' : 'reemplaza'} a ${lista(salen)}.`
      return <>Estos son los corredores con más siniestros con muertos cerca de las cámaras.<br />En 2019 fueron {lista(antes)}.<br />En 2021–22 fueron {lista(despues)}.<br />{cambio}</>
    },
    hint: 'El selector de periodo cambia los puntos y el mapa no se mueve.',
    patch: (f) => ({ ...f, tab: 'mapa', mapa: true, gravedad: 'fatal', periodo: 'antes' }),
    focus: ['#panel-map'], spot: '#map', allow: ['periodo'],
  },
  {
    act: 1, title: 'Corredores que se separan',
    body: (M) => {
      const e = M.extremos
      return e
        ? <>Frente al cambio de las vías sin cámara ({pct(e.ctrl)}), el corredor que más baja respecto de ellas es {e.mejor.corredor} ({pct(e.mejor.dif)}) y el que menos baja o más sube es {e.peor.corredor} ({pct(e.peor.dif)}). Varios corredores tienen pocos siniestros y se marcan con trama, porque su promedio mensual es poco fiable.</>
        : <>La lista ordena los corredores por su diferencia frente a las vías sin cámara.</>
    },
    hint: 'Un clic en un corredor muestra su detalle a la derecha.',
    patch: (f) => ({ ...f, tab: 'panorama', gravedad: 'grave' }),
    focus: ['#panel-panorama'], spot: '#pan-corredores-wrap', allow: ['corredor'],
  },
  {
    act: 1, title: 'Velocidad y gravedad',
    body: (M) => {
      const r = M.r
      if (r == null) return <>Cada punto es un corredor, con su velocidad a la derecha y su proporción de siniestros con muertos arriba.</>
      const fuerza = Math.abs(r) < 0.3 ? 'débil' : Math.abs(r) < 0.6 ? 'moderada' : 'fuerte'
      const cierre = Math.abs(r) < 0.3
        ? 'Los corredores más rápidos no son necesariamente los más graves.'
        : `Los corredores más rápidos tienden a ser ${r > 0 ? 'más' : 'menos'} graves, aunque con tan pocos corredores no basta para afirmarlo.`
      return <>Cada punto es un corredor. La correlación entre su velocidad y la proporción de siniestros con muertos es de {r < 0 ? '−' : ''}{Math.abs(r).toFixed(2).replace('.', ',')}, una relación {fuerza} {r > 0 ? 'positiva' : 'negativa'} entre {M.nCorredores} corredores. {cierre}</>
    },
    hint: 'Un clic en un punto muestra el corredor.',
    patch: (f) => ({ ...f, tab: 'panorama', gravedad: 'grave' }),
    focus: ['#panel-panorama'], spot: '#pan-vel-wrap', allow: ['corredor'],
  },
  {
    act: 2, title: 'Lo que los datos no dicen',
    body: (M) => <>Con estas cifras no podemos saber si los cambios se deben a las cámaras. En la zona con cámara hubo {fmt.int(fatal(M).n)} siniestros con muertos en cuatro años.</>,
    patch: (f) => ({ ...f, tab: 'mapa', mapa: false, gravedad: 'grave' }),
    focus: ['#panel-ficha'],
    cards: [
      { title: 'Regresión a la media', text: 'Los sitios se eligieron porque tenían muchos siniestros. Es esperable que bajen algo aunque la cámara no haga nada, por eso se compara con las vías sin cámara.' },
      { title: 'Pandemia', text: '2020 cambió la movilidad y la línea base. 2019 y 2021–22 no son periodos del todo comparables y la referencia sin cámara ayuda, pero no elimina el problema.' },
      { title: 'Pocos siniestros', text: 'Los siniestros con muertos son raros por corredor. Un cambio de +25 % puede ser ruido, por eso se muestra el número de siniestros y se marcan los corredores con pocos.' },
    ],
  },
  {
    act: 2, title: 'Lo que sí se puede decir',
    body: (M) => <>{veredicto(M)} Algunos corredores sí se separan de las vías sin cámara, pero este diseño no permite atribuirlo a las cámaras.</>,
    patch: (f) => ({ ...f, tab: 'mapa', mapa: true, gravedad: 'fatal' }),
    focus: ['#panel-map', '#panel-ficha'],
  },
  {
    act: 3, title: 'Ahora, a explorar',
    body: () => <>Hasta aquí fue un recorrido guiado. Desde este punto el dashboard queda abierto y cada filtro, vista y mapa responde a lo que se elija.</>,
    patch: (f) => ({ ...f, tab: 'mapa', mapa: true }),
    focus: ['#panel-map', '#panel-ficha', '#panel-serie', '#panel-panorama', '#panel-ab'], allowAll: true,
    acciones: [
      { label: 'Ver los corredores', run: () => setState({ tab: 'panorama' }) },
      { label: 'Comparar otros meses', run: () => setState({ tab: 'ab' }) },
      { label: 'Ver las preguntas que responde el dashboard', run: () => useUi.getState().openPreguntas() },
    ],
  },
]
