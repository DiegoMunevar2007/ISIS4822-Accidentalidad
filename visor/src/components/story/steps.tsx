import type { ReactNode } from 'react'
import { fmt } from '@/charts.js'
import type { State } from '@/store'

export const ACTS = [
  { name: 'Acto I', label: 'Contexto', steps: [0] },
  { name: 'Acto II', label: 'Evidencia', steps: [1, 2, 3, 4, 5, 6] },
  { name: 'Acto III', label: 'Lectura', steps: [7, 8] },
]

/** Claves del estado que la historia vigila para detectar que el usuario se salió del guion. */
export const KEYS: (keyof State)[] = ['tab', 'mapa', 'corredor', 'sitio', 'periodo', 'gravedad', 'radio', 'excluirCruce', 'serieModo', 'ctrlOn', 'rango', 'actor']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Metrics = { byGrav: any[] }

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
}

const fatal = (M: Metrics) => M.byGrav.find((x) => x.key === 'fatal') ?? M.byGrav[0]

export const STEPS: StepDef[] = [
  {
    act: 0, title: 'Dónde están las cámaras',
    body: () => <>Entre noviembre de 2019 y marzo de 2020 Bogotá instaló 92 cámaras en 40 sitios de 18 corredores. En el mapa, cada círculo es un sitio y su tamaño indica cuántas cámaras tiene. Las vías sin cámara, a más de 500 m de cualquier cámara, sirven de referencia.</>,
    hint: 'Con el cursor sobre un sitio se ven su corredor y sus cámaras.',
    patch: (f) => ({ ...f, tab: 'mapa', mapa: true, gravedad: 'fatal' }),
    focus: ['#panel-map', '#panel-ficha'], spot: '#map',
  },
  {
    act: 1, title: 'La caída de 2020',
    body: () => <>Los siniestros con muertos caen en 2020 y vuelven a subir después. La caída coincide con la pandemia y con el inicio de las multas, en mayo de 2020, así que la instalación sola no la explica.</>,
    hint: 'Arrastrar sobre la franja gris para acercar el periodo de instalación.',
    patch: (f) => ({ ...f, tab: 'serie', mapa: false, serieModo: 'linea', gravedad: 'fatal' }),
    focus: ['#panel-serie'], spot: '#s-context', allow: ['rango'],
  },
  {
    act: 1, title: 'Víctimas por condición',
    body: () => <>En el panel de la derecha, cada fila compara el promedio mensual de 2019 (gris) con el de 2021–22 (rojo). Entre peatones baja y entre motociclistas y ciclistas sube. Son promedios mensuales y en varias filas hay pocos siniestros.</>,
    hint: 'Con el cursor sobre una fila se ve el detalle.',
    patch: (f) => ({ ...f, tab: 'mapa', mapa: true, gravedad: 'fatal' }),
    focus: ['#panel-ficha'], spot: '#f-vict',
  },
  {
    act: 1, title: 'Con cámara y sin cámara',
    body: (M) => {
      const f = fatal(M)
      return <>Con muertos, la zona con cámara pasó de {fmt.dec(f.zona.ma)} a {fmt.dec(f.zona.md)} siniestros por mes ({fmt.pct(f.zona.cambio)}). Las vías sin cámara pasaron de {fmt.dec(f.control.ma)} a {fmt.dec(f.control.md)} ({fmt.pct(f.control.cambio)}). En conjunto, la zona con cámara no mejoró más que las vías sin cámara.</>
    },
    hint: 'La gravedad se cambia en los filtros para ver los otros dos niveles.',
    patch: (f) => ({ ...f, tab: 'panorama', gravedad: 'fatal' }),
    focus: ['#panel-panorama'], spot: '.f-grav', allow: ['gravedad'],
  },
  {
    act: 1, title: 'El mapa antes y después',
    body: () => <>Se cambia solo el periodo, de "Antes de la instalación" a "Después de la instalación", y se comparan los puntos. Los siniestros con muertos se concentran en los mismos corredores en ambos periodos.</>,
    hint: 'El selector de periodo cambia los puntos; el mapa no se mueve.',
    patch: (f) => ({ ...f, tab: 'mapa', mapa: true, gravedad: 'fatal', periodo: 'antes' }),
    focus: ['#panel-map'], spot: '#map', allow: ['periodo'],
  },
  {
    act: 1, title: 'Velocidad y gravedad',
    body: () => <>Cada punto es un corredor: a la derecha, más velocidad; arriba, mayor proporción de siniestros con muertos. Los corredores más rápidos no son necesariamente los más graves.</>,
    hint: 'Un clic en un punto muestra el corredor.',
    patch: (f) => ({ ...f, tab: 'panorama', gravedad: 'grave' }),
    focus: ['#panel-panorama'], spot: '#pan-vel-wrap', allow: ['corredor'],
  },
  {
    act: 1, title: 'Corredores con más y menos cambio',
    body: () => <>La lista ordena los corredores por su diferencia contra las vías sin cámara. Los de los extremos llaman la atención, pero varios tienen pocos siniestros y están marcados con trama: su promedio mensual es poco fiable.</>,
    hint: 'Un clic en un corredor muestra su detalle a la derecha.',
    patch: (f) => ({ ...f, tab: 'panorama', gravedad: 'grave' }),
    focus: ['#panel-panorama'], spot: '#pan-corredores-wrap', allow: ['corredor'],
  },
  {
    act: 2, title: 'Límites de la comparación',
    body: (M) => <>Los resultados describen lo ocurrido y no prueban que las cámaras lo causaran. En la zona con cámara hubo {fmt.int(fatal(M).n)} siniestros con muertos en cuatro años.</>,
        patch: (f) => ({ ...f, tab: 'mapa', mapa: false, gravedad: 'grave' }),
    focus: ['#panel-ficha'],
    cards: [
      { title: 'Regresión a la media', text: 'Los sitios se eligieron porque tenían muchos siniestros. Es esperable que bajen algo aunque la cámara no haga nada; por eso se compara con las vías sin cámara.' },
      { title: 'Pandemia', text: '2020 cambió la movilidad y la línea base. 2019 y 2021–22 no son periodos del todo comparables; la referencia sin cámara ayuda, pero no elimina el problema.' },
      { title: 'Pocos siniestros', text: 'Los siniestros fatales son raros por corredor. Un cambio de +25 % puede ser ruido; por eso se muestra el número de siniestros y se marcan los corredores con pocos.' },
    ],
  },
  {
    act: 2, title: 'Conclusión',
    body: () => <>En conjunto, la zona con cámara no mejoró más que las vías sin cámara. Algunos corredores sí mejoraron, pero este diseño no permite atribuirlo a las cámaras. Esto puede comprobarse en el visor.</>,
    hint: 'Al cerrar la historia, el visor queda libre para explorar.',
    patch: (f) => ({ ...f, tab: 'mapa', mapa: true, gravedad: 'fatal' }),
    focus: ['#panel-map', '#panel-ficha'], allowAll: true,
  },
]
