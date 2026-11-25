import * as React from 'react'
import { Command as C } from 'cmdk'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Command = React.forwardRef<React.ElementRef<typeof C>, React.ComponentPropsWithoutRef<typeof C>>(
  ({ className, ...props }, ref) => (
    <C ref={ref} className={cn('flex w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground', className)} {...props} />
  ),
)
Command.displayName = 'Command'

export const CommandInput = React.forwardRef<React.ElementRef<typeof C.Input>, React.ComponentPropsWithoutRef<typeof C.Input>>(
  ({ className, ...props }, ref) => (
    <div className="flex items-center gap-2 border-b border-border px-3">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <C.Input
        ref={ref}
        className={cn('h-10 w-full bg-transparent text-[0.9375rem] outline-none placeholder:text-muted-foreground', className)}
        {...props}
      />
    </div>
  ),
)
CommandInput.displayName = 'CommandInput'

export const CommandList = React.forwardRef<React.ElementRef<typeof C.List>, React.ComponentPropsWithoutRef<typeof C.List>>(
  ({ className, ...props }, ref) => <C.List ref={ref} className={cn('max-h-72 overflow-y-auto overflow-x-hidden p-1', className)} {...props} />,
)
CommandList.displayName = 'CommandList'

export const CommandEmpty = React.forwardRef<React.ElementRef<typeof C.Empty>, React.ComponentPropsWithoutRef<typeof C.Empty>>(
  ({ className, ...props }, ref) => <C.Empty ref={ref} className={cn('px-3 py-6 text-center text-small text-muted-foreground', className)} {...props} />,
)
CommandEmpty.displayName = 'CommandEmpty'

export const CommandGroup = C.Group

export const CommandItem = React.forwardRef<React.ElementRef<typeof C.Item>, React.ComponentPropsWithoutRef<typeof C.Item>>(
  ({ className, ...props }, ref) => (
    <C.Item
      ref={ref}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-[0.9375rem] outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground',
        className,
      )}
      {...props}
    />
  ),
)
CommandItem.displayName = 'CommandItem'
