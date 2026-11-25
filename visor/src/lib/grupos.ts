import { mesLabel } from '@/data.js'

type Grupo = 'A' | 'B'

const orden = (xs: Iterable<number>) => [...new Set(xs)].sort((x, y) => x - y)

/**
 * Asigna meses al grupo activo y los quita del otro (un mes no puede estar en A y B a la vez).
 * `alternar`: si el único mes ya estaba en el grupo, lo quita; `agregar`: los suma todos.
 */
export function asignar(a: number[], b: number[], quien: Grupo, meses: number[], modo: 'agregar' | 'alternar'): [number[], number[]] {
  const propio = new Set(quien === 'A' ? a : b)
  const otro = new Set(quien === 'A' ? b : a)
  if (modo === 'alternar' && meses.length === 1 && propio.has(meses[0])) {
    propio.delete(meses[0])
  } else {
    for (const m of meses) {
      propio.add(m)
      otro.delete(m)
    }
  }
  const [pa, pb] = [orden(propio), orden(otro)]
  return quien === 'A' ? [pa, pb] : [pb, pa]
}

export const rango = (x: number, y: number) => Array.from({ length: Math.abs(y - x) + 1 }, (_, k) => Math.min(x, y) + k)

/** «ene 2019 a dic 2019», un mes suelto o «5 meses sueltos». */
export function etiquetaMeses(ms: number[]): string {
  if (ms.length === 0) return 'sin meses'
  const contiguo = ms[ms.length - 1] - ms[0] === ms.length - 1
  if (ms.length === 1) return mesLabel(ms[0])
  if (contiguo) return `${mesLabel(ms[0])} a ${mesLabel(ms[ms.length - 1])}`
  return `${ms.length} meses sueltos`
}

export const cuantosMeses = (ms: number[]) => `${ms.length} ${ms.length === 1 ? 'mes' : 'meses'}`

export const promedio = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null)
