"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Simple context-based tabs implementation
interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

function useTabsContext() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs component")
  }
  return context
}

interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

function Tabs({ defaultValue, value: controlledValue, onValueChange, children, className }: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const value = controlledValue ?? uncontrolledValue

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-14 sm:h-12 items-center justify-center rounded-lg bg-muted p-1 w-full",
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

function TabsTrigger({ value, children, className, disabled = false }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext()
  const isActive = value === selectedValue

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        // Base styles
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap",
        // Layout & sizing
        "h-full flex-1 px-3 py-2",
        // Typography
        "text-sm font-medium",
        // Default state colors
        "text-foreground/70 hover:text-foreground",
        // Border & background
        "rounded-md border border-transparent",
        // Transitions
        "transition-all duration-200",
        // Active state
        isActive && "bg-background text-foreground shadow-sm",
        // Dark mode active state
        "dark:isActive:bg-input/50 dark:isActive:text-foreground",
        // Focus states
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2",
        // Disabled states
        "disabled:opacity-50 disabled:pointer-events-none",
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
}

function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabsContext()
  const isActive = value === selectedValue

  if (!isActive) {
    return null
  }

  return (
    <div
      role="tabpanel"
      aria-hidden={!isActive}
      className={cn(
        "focus:outline-none",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className
      )}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, useTabsContext }
