import { useRef, useState, type ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/**
 * Ayuda para leer una gráfica: un icono discreto junto al título con la explicación.
 * Se abre con el cursor, con el foco y también con un toque o clic (en pantallas táctiles no hay cursor).
 */
export function Ayuda({ children, label = 'Cómo leer esta gráfica' }: { children: ReactNode; label?: string }) {
  const [abierto, setAbierto] = useState(false)
  const fijo = useRef(false)
  return (
    <Popover
      open={abierto}
      onOpenChange={(o) => {
        // Radix avisa de cierres por Esc o clic fuera; las aperturas las manejan el cursor y el clic.
        if (!o) { fijo.current = false; setAbierto(false) }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(e) => {
            e.preventDefault()
            fijo.current = !fijo.current
            setAbierto(fijo.current)
          }}
          onMouseEnter={() => setAbierto(true)}
          onMouseLeave={() => { if (!fijo.current) setAbierto(false) }}
          className="ml-1.5 inline-flex size-6 translate-y-[3px] cursor-help items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          <CircleHelp className="size-[18px]" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-auto max-w-[360px] border-0 bg-foreground p-3 text-[0.875rem] font-normal leading-snug text-background"
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}
