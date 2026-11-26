import { useEffect, useRef } from 'react'
import { GRAVEDAD, PERIODOS, TRAMO_BUFFER_M, sitiosDelAmbito } from '@/data.js'
import { C, fmt } from '@/charts.js'
import { createMap } from '@/map.js'
import { useStore } from '@/store'
import { useUi } from '@/ui-store'
import { gravLabel, monthStartDay, nombreAmbito, type Computed } from '@/lib/derived'
import { PanelLeftClose, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export function MapPanel({ K, visible }: { K: Computed; visible: boolean }) {
  const D = useStore((s) => s.D)!
  const st = useStore((s) => s.st)
  const set = useStore((s) => s.set)
  const elRef = useRef<HTMLDivElement>(null)
  const ctl = useRef<ReturnType<typeof createMap> | null>(null)

  // El mapa se monta una sola vez y sobrevive al ocultar el panel.
  useEffect(() => {
    if (!elRef.current) return
    const stNow = () => useStore.getState().st
    ctl.current = createMap(elRef.current, D, {
      onSelectSitio: (id: string) => {
        if (stNow().sitio === id) return set({ sitio: null })
        const s = D.geo.sitios.find((x: { id: string }) => x.id === id)
        set({ sitio: id, corredor: s.corredor })
      },
      onSelectCorredor: (c: string) => set({ corredor: c, sitio: null }),
      onHoverCorredor: (c: string | null) => useUi.getState().setHover(c),
    })
    return () => {
      ctl.current?.map.remove()
    }
  }, [D, set])

  // Resalte compartido con la lista del Panorama: solo se restilan los tramos.
  const hover = useUi((s) => s.hoverCorredor)
  useEffect(() => { ctl.current?.setHover(hover) }, [hover])

  const P = PERIODOS[st.periodo as keyof typeof PERIODOS]
  const gravs = GRAVEDAD[st.gravedad].min

  // Puntos visibles según filtros y periodo
  useEffect(() => {
    if (!visible || !ctl.current) return
    const { rows } = D
    const d0 = monthStartDay[P.m0]
    const d1 = monthStartDay[P.m1 + 1] - 1
    const lat: number[] = [], lon: number[] = [], g: number[] = []
    for (let i = 0; i < rows.n; i++) {
      if (!K.mask[i] || rows.d[i] < d0 || rows.d[i] > d1 || !K.scope(i)) continue
      lat.push(rows.lat[i]); lon.push(rows.lon[i]); g.push(rows.g[i])
    }
    ctl.current.update(st, {
      pts: { lat, lon, g, n: lat.length },
      sitiosAmbito: sitiosDelAmbito(D, st),
      conteoSitio: K.conteoSitio,
      gravLabel: GRAVEDAD[st.gravedad].short === 'todos' ? 'siniestros' : `siniestros ${GRAVEDAD[st.gravedad].short}`,
    })
  })

  // Al volver a mostrar el mapa o cambiar de pestaña, Leaflet recalcula su tamaño.
  useEffect(() => {
    if (visible) setTimeout(() => ctl.current?.invalidate(), 30)
  }, [visible, st.tab])

  // Conteo para el subtítulo: se calcula igual que el filtrado del mapa
  let n = 0
  if (visible) {
    const { rows } = D
    const d0 = monthStartDay[P.m0]
    const d1 = monthStartDay[P.m1 + 1] - 1
    for (let i = 0; i < rows.n; i++) {
      if (K.mask[i] && rows.d[i] >= d0 && rows.d[i] <= d1 && K.scope(i)) n++
    }
  }

  return (
    <section className="panel map-panel" id="panel-map" hidden={!visible}>
      <header className="panel-head">
        <div>
          <h2 id="map-title">Mapa de siniestros</h2>
          <p className="sub" id="map-sub">{fmt.int(n)} {st.gravedad === 'todos' ? 'siniestros' : gravLabel(st)}, {P.label.toLowerCase()}</p>
        </div>
        <Button size="small" id="btn-hide-map" title="Ocultar el mapa para ver más gráficas" onClick={() => set({ mapa: false })}>
          <PanelLeftClose className="size-4" />
          Ocultar mapa
        </Button>
      </header>
      <div className="map-frame relative">
        <div id="map" ref={elRef} />
        {(st.corredor || st.sitio) && (
          <div className="absolute bottom-8 right-3 z-[1000] flex flex-col-reverse items-end gap-2">
            <Button size="small" onClick={() => set({ corredor: null, sitio: null })}>
              <X className="size-4" /> Quitar selección
            </Button>
            {st.corredor && !st.sitio && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 shadow-sm" title={`Siniestros a menos de ${TRAMO_BUFFER_M} m del tramo, con o sin cámara cerca`}>
                <Checkbox id="chk-todo-corredor" className="size-4" checked={st.todoCorredor} onCheckedChange={(c) => set({ todoCorredor: c === true })} />
                <Label htmlFor="chk-todo-corredor" className="cursor-pointer text-small font-normal">Visualizar accidentes en corredor</Label>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="legend" id="map-legend">
        <div>
          <h3>En el mapa</h3>
          <ul>
            <li><i className="lg-sitio" />Sitio de cámara (el tamaño indica cuántas cámaras tiene)</li>
            <li><i className="lg-line" style={{ background: C.despues }} />Corredor seleccionado</li>
            <li><i className="lg-line" style={{ background: '#8a9096' }} />Tramo con cámara</li>
            <li><i className="lg-line" style={{ background: '#c9ccd0' }} />Tramo sin cámara</li>
          </ul>
        </div>
        <div>
          <h3>Siniestros</h3>
          <ul>
            <li><i className="lg-ramp" />Densidad, con poco zoom (más oscuro, más siniestros)</li>
            <li><i className="lg-dot" style={{ background: '#B5283A' }} />Con muertos</li>
            {gravs <= 1 && <li><i className="lg-dot" style={{ background: '#E8A100' }} />Con heridos</li>}
            {gravs === 0 && <li><i className="lg-dot" style={{ background: '#a9aeb3' }} />Solo daños</li>}
          </ul>
        </div>
      </div>
    </section>
  )
}
