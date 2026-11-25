import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border text-[0.9375rem] font-medium whitespace-nowrap shadow-xs outline-none transition-[color,background-color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40',
  {
    variants: {
      variant: {
        default: 'border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground',
        primary: 'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'border-transparent bg-accent text-accent-foreground shadow-none hover:bg-accent/70',
        ghost: 'border-transparent bg-transparent shadow-none hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4',
        small: 'h-8 px-3 text-small',
        icon: 'size-10 font-bold',
        'icon-small': 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
)
Button.displayName = 'Button'
