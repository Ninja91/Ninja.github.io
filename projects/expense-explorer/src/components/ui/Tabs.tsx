import * as React from "react"
import { cn } from "../../lib/utils"

interface TabsProps {
    value: string
    onValueChange: (value: string) => void
    children: React.ReactNode
    className?: string
}

const Tabs = ({ value, onValueChange, children, className }: TabsProps) => {
    return (
        <div className={cn("w-full", className)}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { value, onValueChange })
                }
                return child
            })}
        </div>
    )
}

interface TabsListProps {
    children: React.ReactNode
    className?: string
    value?: string
    onValueChange?: (value: string) => void
}

const TabsList = ({ children, className, value, onValueChange }: TabsListProps) => {
    return (
        <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500", className)}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { activeValue: value, onValueChange })
                }
                return child
            })}
        </div>
    )
}

interface TabsTriggerProps {
    value: string
    children: React.ReactNode
    className?: string
    activeValue?: string
    onValueChange?: (value: string) => void
}

const TabsTrigger = ({ value, children, className, activeValue, onValueChange }: TabsTriggerProps) => {
    const isActive = activeValue === value
    return (
        <button
            onClick={() => onValueChange?.(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive ? "bg-white text-slate-950 shadow-sm" : "hover:text-slate-900",
                className
            )}
        >
            {children}
        </button>
    )
}

interface TabsContentProps {
    value: string
    children: React.ReactNode
    className?: string
    activeValue?: string
}

const TabsContent = ({ value, children, className, activeValue }: TabsContentProps) => {
    if (value !== activeValue) return null
    return <div className={cn("mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2", className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
