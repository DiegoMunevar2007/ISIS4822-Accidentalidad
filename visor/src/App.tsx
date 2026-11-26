import { useEffect } from 'react'
import { useStore } from '@/store'
import { compute } from '@/lib/derived'
import { Skeleton } from '@/components/ui/skeleton'
import { Filters } from '@/components/Filters'
import { ScopeLine, Tabs, TopBar } from '@/components/Shell'
import { Landing } from '@/components/Landing'
import { Preguntas } from '@/components/Preguntas'
import { Tour } from '@/components/Tour'
import { Story } from '@/components/story/Story'
import { MapPanel } from '@/components/panels/MapPanel'
import { FichaPanel } from '@/components/panels/FichaPanel'
import { SeriePanel } from '@/components/panels/SeriePanel'
import { PanoramaPanel } from '@/components/panels/PanoramaPanel'
import { ABPanel } from '@/components/panels/ABPanel'

export function App() {
  const D = useStore((s) => s.D)
  const st = useStore((s) => s.st)
  const set = useStore((s) => s.set)
  const load = useStore((s) => s.load)

  useEffect(() => { void load() }, [load])

  if (!D) {
    return (
      <div className="loading" role="status" aria-live="polite">
        <div className="flex w-[min(420px,80vw)] flex-col gap-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-40 w-full" />
          <p className="m-0 font-sans text-small text-muted-foreground">Cargando los siniestros…</p>
        </div>
      </div>
    )
  }

  const K = compute(D, st)
  const { tab, mapa } = st
  const showMap = (tab === 'mapa' || tab === 'serie' || tab === 'panorama') && mapa
  const showRail = (tab === 'mapa' || tab === 'serie' || tab === 'panorama') && !mapa
  const showSerie = tab === 'serie' || (tab === 'mapa' && !mapa)

  return (
    <>
      <div className="flag-bar" aria-hidden="true" />
      <div id="app" className="app">
        <TopBar />
        <Tabs />
        <Filters />
        <ScopeLine K={K} />
        <main className={`stage tab-${tab} ${mapa ? 'map-on' : 'map-off'}`} id="stage">
          <MapPanel K={K} visible={showMap} />
          <button className="map-rail" id="map-rail" title="Mostrar mapa" hidden={!showRail} onClick={() => set({ mapa: true })}>
            <span>Mostrar mapa</span>
          </button>
          <FichaPanel K={K} visible={tab === 'mapa'} />
          <SeriePanel K={K} visible={showSerie} />
          <PanoramaPanel visible={tab === 'panorama'} />
          <ABPanel K={K} visible={tab === 'ab'} />
        </main>
      </div>
      <div id="tooltip" className="tooltip" hidden />
      <Landing />
      <Preguntas />
      <Story />
      <Tour />
    </>
  )
}
