import { useEffect } from 'react'
import { useStore } from '@/store'
import { useUi } from '@/ui-store'
import { ChevronLeft, ChevronRight, MousePointerClick, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Accordion, AccordionItem } from '@/components/ui/accordion'
import { ACTS, STEPS } from './steps'
import { applyStep, metrics, onStateChange, startStory, stopStory } from './controller'

export function Story() {
  const active = useUi((s) => s.story)
  const i = useUi((s) => s.storyStep)
  const offTrack = useUi((s) => s.offTrack)
  const loaded = useStore((s) => s.D != null)

  // Vigila los cambios de estado para detectar que el usuario se salió del paso
  useEffect(() => useStore.subscribe((s) => onStateChange(s.st)), [])

  // Atajos de teclado
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(t.tagName)) return
      const k = useUi.getState().storyStep
      if (e.key === 'ArrowRight') { e.preventDefault(); if (k < STEPS.length - 1) applyStep(k + 1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); if (k > 0) applyStep(k - 1) }
      if (e.key === 'Escape') stopStory()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active])

  // Enlace directo: ?historia=4
  useEffect(() => {
    if (!loaded) return
    const params = new URLSearchParams(location.search)
    if (params.has('historia')) {
      const k = Math.max(0, Math.min(STEPS.length - 1, (parseInt(params.get('historia') ?? '1', 10) || 1) - 1))
      setTimeout(() => startStory(k), 0)
    }
  }, [loaded])

  if (!active) return null
  const s = STEPS[i]
  const act = ACTS[s.act]
  const M = metrics()
  const last = i === STEPS.length - 1

  return (
    <aside id="story" className="story" aria-label="Historia guiada">
      <Card className="gap-4 border-0 bg-transparent px-0 py-0 shadow-none">
        <CardHeader className="gap-3 px-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2" id="story-kicker">
              <span className="text-small font-semibold text-primary">{act.label}</span>
              <span className="text-small text-muted-foreground">Paso {i + 1} de {STEPS.length}</span>
            </div>
            <Button size="icon-small" variant="ghost" id="story-close" title="Cerrar la historia" aria-label="Cerrar la historia" onClick={stopStory}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="story-progress flex gap-3" id="story-progress">
            {ACTS.map((a, ai) => (
              <div key={a.name} className="flex flex-col gap-1.5" style={{ flex: a.steps.length, minWidth: 68 }}>
                <div className="flex gap-1">
                  {a.steps.map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`h-1.5 flex-1 cursor-pointer rounded-[2px] ${k === i ? 'bg-primary' : k < i ? 'bg-primary/45' : 'bg-border'}`}
                      aria-label={`Paso ${k + 1}: ${STEPS[k].title}`}
                      aria-current={k === i ? 'step' : undefined}
                      title={STEPS[k].title}
                      onClick={() => applyStep(k)}
                    />
                  ))}
                </div>
                <span className={`text-micro ${ai === s.act ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{a.label}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent className="story-copy px-0" aria-live="polite">
          <h2 id="story-title">{s.title}</h2>
          <div id="story-body" className="story-body">
            {M && s.body(M)}
            {s.cards && (
              <Accordion type="multiple" className="story-cards">
                {s.cards.map((c) => (
                  <AccordionItem key={c.title} value={c.title} title={c.title}>{c.text}</AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </CardContent>
        {s.hint && (
          <Alert id="story-hint" className="border-accent bg-accent text-accent-foreground">
            <MousePointerClick />
            <AlertDescription className="text-body text-accent-foreground">{s.hint}</AlertDescription>
          </Alert>
        )}
        {offTrack && !s.allowAll && (
          <Alert id="story-warn">
            <TriangleAlert />
            <AlertDescription className="text-small">
              Exploración libre: el texto describe el paso {i + 1}.{' '}
              <button type="button" className="font-semibold text-primary underline underline-offset-2" onClick={() => applyStep(i)}>Volver al paso</button>
            </AlertDescription>
          </Alert>
        )}
        <CardFooter className="justify-between px-0">
          <Button size="small" variant="default" id="story-back" disabled={i === 0} onClick={() => applyStep(i - 1)}>
            <ChevronLeft className="size-4" /> Atrás
          </Button>
          <Button size="small" variant="primary" id="story-next" onClick={() => (last ? stopStory() : applyStep(i + 1))}>
            {last ? 'Explorar el visor' : 'Siguiente'} {!last && <ChevronRight className="size-4" />}
          </Button>
        </CardFooter>
      </Card>
    </aside>
  )
}
