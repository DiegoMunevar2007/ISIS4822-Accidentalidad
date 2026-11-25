import * as React from 'react'
import { Select as S } from 'radix-ui'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Radix no admite value="" en los ítems: usamos un centinela para "sin valor". */
export const NONE = '__none__'

export interface Option {
  value: string
  label: string
}

interface Props {
  value: string | null
  onChange: (v: string | null) => void
  options: Option[]
  className?: string
  id?: string
  'aria-label'?: string
}

export function Select({ value, onChange, options, className, id, ...rest }: Props) {
  return (
    <S.Root value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <S.Trigger
        id={id}
        aria-label={rest['aria-label']}
        className={cn(
          'flex h-10 w-full min-w-[200px] cursor-pointer items-center justify-between gap-2.5 rounded-md border border-input bg-card px-3 text-left text-[0.9375rem] shadow-xs outline-none transition-[color,box-shadow] hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/30',
          className,
        )}
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          <S.Value />
        </span>
        <S.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content
          position="popper"
          sideOffset={4}
          className="z-[1600] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md"
        >
          <S.Viewport className="p-1">
            {options.map((o) => (
              <S.Item
                key={o.value}
                value={o.value === '' ? NONE : o.value}
                className="relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-3 pr-8 text-[0.9375rem] outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=checked]:font-semibold"
              >
                <S.ItemText>{o.label}</S.ItemText>
                <S.ItemIndicator className="absolute right-2">
                  <Check className="size-4 text-primary" />
                </S.ItemIndicator>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  )
}
