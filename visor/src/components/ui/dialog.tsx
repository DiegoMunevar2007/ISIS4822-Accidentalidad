import * as React from 'react'
import { Dialog as D } from 'radix-ui'
import { cn } from '@/lib/utils'

export const Dialog = D.Root
export const DialogTitle = D.Title
export const DialogDescription = D.Description

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof D.Content>,
  React.ComponentPropsWithoutRef<typeof D.Content>
>(({ className, children, ...props }, ref) => (
  <D.Portal>
    <D.Overlay className="fixed inset-0 z-[5000] bg-[rgba(31,29,26,0.55)] backdrop-blur-[3px]" />
    <D.Content
      ref={ref}
      className={cn(
        'landing fixed left-1/2 top-1/2 z-[5001] max-h-[92vh] w-[calc(100vw-32px)] max-w-[680px] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl bg-surface px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.3)] sm:px-10 sm:py-9',
        className,
      )}
      {...props}
    >
      {children}
    </D.Content>
  </D.Portal>
))
DialogContent.displayName = 'DialogContent'
