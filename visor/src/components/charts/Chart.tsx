import { useEffect, useRef, useState } from 'react'

interface Props {
  /** Dibuja el gráfico (d3) dentro del contenedor. Se vuelve a ejecutar en cada render y al cambiar el ancho. */
  draw: (el: HTMLDivElement) => void
  className?: string
  id?: string
}

/** Contenedor de un gráfico d3: mide el ancho con ResizeObserver y redibuja. */
export function Chart({ draw, className = 'chart', id }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setWidth((w) => (Math.abs(w - el.clientWidth) > 1 ? el.clientWidth : w)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Sin lista de dependencias: el gráfico refleja siempre el estado actual.
  useEffect(() => {
    if (ref.current) draw(ref.current)
  })
  void width

  return <div ref={ref} id={id} className={className} />
}
