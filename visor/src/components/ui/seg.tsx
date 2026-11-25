import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface Props<T extends string> {
  value: T
  onChange: (v: T) => void
  options: [T, string][]
  small?: boolean
  label?: string
  /** Texto previo, a la izquierda del grupo. */
  prefix?: string
  id?: string
}

/** Control segmentado sobre el ToggleGroup de shadcn: un valor activo a la vez (no se puede deseleccionar). */
export function Seg<T extends string>({ value, onChange, options, small, label, prefix, id }: Props<T>) {
  return (
    <div className="inline-flex items-center gap-2">
      {prefix && <span className="text-small text-muted-foreground">{prefix}</span>}
      <ToggleGroup
        type="single"
        variant="outline"
        size={small ? 'sm' : 'default'}
        value={value}
        onValueChange={(v) => v && onChange(v as T)}
        aria-label={label ?? prefix}
        id={id}
        className="bg-card"
      >
        {options.map(([v, l]) => (
          <ToggleGroupItem
            key={v}
            value={v}
            data-v={v}
            className={cn(
              'cursor-pointer text-[0.9375rem] font-medium',
              small && 'text-small',
              'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary',
            )}
          >
            {l}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
