"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/40 duration-300 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

interface SheetContentProps extends DialogPrimitive.Popup.Props {
  side?: "top" | "bottom" | "left" | "right"
  showCloseButton?: boolean
}

function SheetContent({
  className,
  children,
  side = "bottom",
  showCloseButton = true,
  ...props
}: SheetContentProps) {
  const sideClasses = {
    top: "inset-x-0 top-0 rounded-b-xl data-[state=open]:slide-in-from-top-4 data-[state=closed]:slide-out-to-top-4",
    bottom: "inset-x-0 bottom-0 rounded-t-xl data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4",
    left: "inset-y-0 left-0 w-full max-w-sm rounded-r-xl data-[state=open]:slide-in-from-left-4 data-[state=closed]:slide-out-to-left-4",
    right: "inset-y-0 right-0 w-full max-w-sm rounded-l-xl data-[state=open]:slide-in-from-right-4 data-[state=closed]:slide-out-to-right-4",
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 text-sm shadow-lg ring-1 ring-foreground/10 duration-300 outline-none",
          "data-open:animate-in data-open:fade-in-0",
          "data-closed:animate-out data-closed:fade-out-0",
          sideClasses[side],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4 rounded-full p-1 h-8 w-8"
                size="icon-xs"
              />
            }
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function SheetFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "-mx-6 -mb-6 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-6 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
