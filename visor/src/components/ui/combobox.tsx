import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Option } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

interface Props {
  value: string | null
  onChange: (v: string | null) => void
  options: Option[]
  placeholder?: string
  empty?: string
  className?: string
  id?: string
  'aria-label'?: string
}

/** Lista desplegable con búsqueda: para elegir entre muchas opciones (corredores, sitios). Mismo aspecto que Select. */
export function Combobox({ value, onChange, options, placeholder = 'Buscar', empty = 'Sin resultados', className, id, ...rest }: Props) {
  const [open, setOpen] = useState(false)
  const actual = options.find((o) => (o.value || null) === value) ?? options[0]
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label={rest['aria-label']}
          className={cn(
            'flex h-10 w-full min-w-[200px] cursor-pointer items-center justify-between gap-2.5 rounded-md border border-input bg-card px-3 text-left text-[0.9375rem] shadow-xs outline-none transition-[color,box-shadow] hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/30',
            className,
          )}
        >
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{actual?.label}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[1600] w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{empty}</CommandEmpty>
            {options.map((o) => (
              <CommandItem
                key={o.value || '__todos__'}
                value={`${o.label} ${o.value}`}
                onSelect={() => { onChange(o.value || null); setOpen(false) }}
                className="justify-between gap-2"
              >
                <span className={cn((o.value || null) === value && 'font-semibold')}>{o.label}</span>
                {(o.value || null) === value && <Check className="size-4 shrink-0 text-primary" />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
