import * as React from 'react'
import { Dialog as D } from 'radix-ui'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Sheet = D.Root
export const SheetTrigger = D.Trigger
export const SheetClose = D.Close
export const SheetTitle = D.Title
export const SheetDescription = D.Description

/** Panel que entra por un borde de la pantalla; sirve para los filtros en pantallas angostas. */
export const SheetContent = React.forwardRef<React.ElementRef<typeof D.Content>, React.ComponentPropsWithoutRef<typeof D.Content>>(
  ({ className, children, ...props }, ref) => (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-[5000] bg-[rgba(31,29,26,0.45)]" />
      <D.Content
        ref={ref}
        className={cn('fixed inset-x-0 bottom-0 z-[5001] flex max-h-[88vh] flex-col gap-4 overflow-y-auto rounded-t-xl bg-surface px-5 pb-6 pt-5 shadow-[0_-12px_40px_rgba(0,0,0,0.25)]', className)}
        {...props}
      >
        {children}
        <D.Close aria-label="Cerrar" className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/50">
          <X className="size-4" />
        </D.Close>
      </D.Content>
    </D.Portal>
  ),
)
SheetContent.displayName = 'SheetContent'
