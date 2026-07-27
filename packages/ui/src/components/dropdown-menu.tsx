"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../lib/utils";

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
}

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  sideOffset = 8,
  className,
}: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-50 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg",
            "data-[state=open]:animate-fade-in data-[state=open]:animate-zoom-in",
            "data-[state=closed]:animate-fade-out data-[state=closed]:animate-zoom-out",
            className,
          )}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onSelect?: (event: Event) => void;
  disabled?: boolean;
  className?: string;
  destructive?: boolean;
}

export function DropdownMenuItem({
  children,
  onSelect,
  disabled = false,
  destructive = false,
  className,
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        "relative flex min-h-11 cursor-default select-none items-center rounded-md px-3 py-2.5 text-sm outline-none transition-colors",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        destructive && "focus:bg-destructive/10 text-destructive",
        className,
      )}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return (
    <DropdownMenuPrimitive.Separator
      className={cn("-mx-1 my-1 h-px bg-border", className)}
    />
  );
}