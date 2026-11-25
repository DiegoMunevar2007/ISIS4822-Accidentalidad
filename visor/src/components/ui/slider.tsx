import * as React from 'react'
import { Slider as S } from 'radix-ui'
import { cn } from '@/lib/utils'

export const Slider = React.forwardRef<React.ElementRef<typeof S.Root>, React.ComponentPropsWithoutRef<typeof S.Root>>(
  ({ className, ...props }, ref) => (
    <S.Root ref={ref} className={cn('relative flex h-6 w-full touch-none select-none items-center', className)} {...props}>
      <S.Track className="relative h-1.5 grow rounded-full bg-muted">
        <S.Range className="absolute h-full rounded-full bg-primary" />
      </S.Track>
      <S.Thumb className="block size-5 rounded-full border-2 border-primary bg-card shadow-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30" />
    </S.Root>
  ),
)
Slider.displayName = 'Slider'
