import * as React from 'react'
import { ScrollArea as S } from 'radix-ui'
import { cn } from '@/lib/utils'

export const ScrollArea = React.forwardRef<React.ElementRef<typeof S.Root>, React.ComponentPropsWithoutRef<typeof S.Root>>(
  ({ className, children, ...props }, ref) => (
    <S.Root ref={ref} className={cn('relative overflow-hidden', className)} {...props}>
      <S.Viewport className="size-full max-h-[inherit] rounded-[inherit]">{children}</S.Viewport>
      <S.Scrollbar orientation="vertical" className="flex w-2.5 touch-none select-none border-l border-l-transparent p-px transition-colors">
        <S.Thumb className="relative flex-1 rounded-full bg-border" />
      </S.Scrollbar>
    </S.Root>
  ),
)
ScrollArea.displayName = 'ScrollArea'
