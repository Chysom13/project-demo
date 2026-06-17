import * as React from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function NavigationMenu({
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root>) {
  return <NavigationMenuPrimitive.Root data-slot="navigation-menu" {...props} />
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "group/nav-list flex items-center gap-1",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuItem({
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" {...props} />
}

function NavigationMenuTrigger({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(
        "group/trigger flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all data-[state=open]:bg-white/5",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "absolute top-full left-0 z-50 w-auto min-w-[220px] origin-top-left rounded-xl border border-white/10 bg-slate-900 p-2 shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "block",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuIndicator({
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className="data-[state=visible]:animate-in data-[state=visible]:fade-in-0 data-[state=visible]:slide-in-from-top-1 data-[state=hidden]:animate-out data-[state=hidden]:fade-out-0 data-[state=hidden]:slide-out-to-top-1 top-full z-50 flex justify-center"
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <NavigationMenuPrimitive.Viewport
      data-slot="navigation-menu-viewport"
      className={cn(
        "relative mt-1.5",
        className
      )}
      {...props}
    />
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
