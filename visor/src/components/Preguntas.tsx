import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useStore, type State } from '@/store'
import { useUi } from '@/ui-store'

interface Pregunta {
  texto: string
  accion: string
  objetivo: string
  patch: Partial<State>
  destino: string
}

// Las preguntas se citan textuales.
const PRINCIPALES: Pregunta[] = [
  { texto: '¿Cambiaron las víctimas (peatón, moto, ciclista) antes y después de la instalación de las cámaras?', accion: 'Comparar', objetivo: 'Distribución', patch: { tab: 'mapa', mapa: true, periodo: 'todo' }, destino: '#f-vict' },
  { texto: '¿Bajó más la accidentalidad donde hay cámara que donde no?', accion: 'Comparar', objetivo: 'Distribución', patch: { tab: 'mapa', mapa: true, periodo: 'todo' }, destino: '#f-ad' },
  { texto: '¿En qué momento cambia la tendencia de choques fatales respecto de la instalación de las cámaras?', accion: 'Descubrir', objetivo: 'Tendencias', patch: { tab: 'serie', serieModo: 'linea', gravedad: 'fatal', periodo: 'todo' }, destino: '#panel-serie' },
]
const SECUNDARIAS: Pregunta[] = [
  { texto: '¿En qué lugar ocurren los choques fatales antes y después de la instalación?', accion: 'Comparar', objetivo: 'Forma', patch: { tab: 'mapa', mapa: true, gravedad: 'fatal', periodo: 'antes' }, destino: '#panel-map' },
  { texto: '¿Cuál es el corredor que más mejora o empeora después de la instalación de las cámaras?', accion: 'Identificar', objetivo: 'Extremos', patch: { tab: 'panorama', gravedad: 'todos' }, destino: '#panel-panorama' },
  { texto: '¿Los tramos más rápidos son también aquellos con accidentes más graves?', accion: 'Descubrir', objetivo: 'Correlación', patch: { tab: 'panorama' }, destino: '#pan-vel-wrap' },
]

function Grupo({ titulo, filas, ir }: { titulo: string; filas: Pregunta[]; ir: (p: Pregunta) => void }) {
  return (
    <>
      <TableRow className="bg-soft hover:bg-soft">
        <TableCell colSpan={4} className="py-2 text-small font-bold text-foreground">{titulo}</TableCell>
      </TableRow>
      {filas.map((p) => (
        <TableRow key={p.texto}>
          <TableCell className="whitespace-normal py-3 text-body">{p.texto}</TableCell>
          <TableCell className="py-3 text-small text-muted-foreground">{p.accion}</TableCell>
          <TableCell className="py-3 text-small text-muted-foreground">{p.objetivo}</TableCell>
          <TableCell className="py-3 text-right">
            <Button size="small" onClick={() => ir(p)}>Ver en el dashboard</Button>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function Preguntas() {
  const set = useStore((s) => s.set)
  const open = useUi((s) => s.preguntas)
  const close = useUi((s) => s.closePreguntas)
  const ir = (p: Pregunta) => {
    close()
    set(p.patch)
    setTimeout(() => {
      const el = document.querySelector(p.destino)
      if (el?.getAttribute('data-state') === 'closed') el.querySelector('button')?.click()
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent id="preguntas" aria-describedby="preguntas-desc" className="max-w-[920px]">
        <DialogTitle asChild>
          <h2 className="m-0 text-[1.5rem] font-extrabold tracking-tight">Preguntas que responde el dashboard (Why)</h2>
        </DialogTitle>
        <DialogDescription asChild>
          <p className="sub mb-4" id="preguntas-desc">Cada pregunta indica qué se hace con los datos (comparar, descubrir, identificar) y sobre qué (distribución, tendencias, forma, extremos, correlación).</p>
        </DialogDescription>
        <div className="overflow-x-auto">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="border-b-2 border-ink hover:bg-transparent">
                <TableHead className="w-[56%] font-bold text-foreground">Pregunta</TableHead>
                <TableHead className="font-bold text-foreground">Acción</TableHead>
                <TableHead className="font-bold text-foreground">Objetivo</TableHead>
                <TableHead><span className="sr-only">Ir a la vista</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Grupo titulo="Principales" filas={PRINCIPALES} ir={ir} />
              <Grupo titulo="Secundarias" filas={SECUNDARIAS} ir={ir} />
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
