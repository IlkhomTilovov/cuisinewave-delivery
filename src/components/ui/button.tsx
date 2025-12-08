import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary to-primary-dark text-primary-foreground hover:opacity-90 shadow-md hover:shadow-glow",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-2 border-secondary/50 bg-transparent text-secondary hover:bg-secondary/10 hover:border-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-gold",
        ghost: "text-foreground hover:bg-muted hover:text-foreground",
        link: "text-secondary underline-offset-4 hover:underline",
        hero: "bg-gradient-to-br from-primary to-primary-dark text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-glow",
        gold: "bg-gradient-to-r from-gold to-gold-dark text-background font-bold hover:opacity-90 shadow-gold",
        cart: "bg-muted text-foreground hover:bg-muted/80 border border-border",
        glass: "backdrop-blur-xl border border-white/10 bg-white/10 text-foreground hover:bg-white/20",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-md",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-base",
        icon: "h-10 w-10 rounded-xl",
        iconSm: "h-8 w-8",
        iconLg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }