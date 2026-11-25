import * as React from 'react'
import { Checkbox as C } from 'radix-ui'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Checkbox = React.forwardRef<React.ElementRef<typeof C.Root>, React.ComponentPropsWithoutRef<typeof C.Root>>(
  ({ className, ...props }, ref) => (
    <C.Root
      ref={ref}
      className={cn(
        'flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-input bg-card shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        className,
      )}
      {...props}
    >
      <C.Indicator>
        <Check className="size-3.5" />
      </C.Indicator>
    </C.Root>
  ),
)
Checkbox.displayName = 'Checkbox'
