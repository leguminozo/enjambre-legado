"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon, SearchIcon } from "../icons";
import { cn } from "../lib/utils";
import { useState, useMemo } from "react";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  placeholder = "Seleccionar…",
  options,
  disabled = false,
  searchable = false,
  className,
}: SelectProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    );
  }, [options, searchQuery, searchable]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[&>span]:line-clamp-1",
          className,
        )}
      >
        <SelectPrimitive.Value asChild>
          <span className="text-left truncate">
            {value ? selectedLabel : <span className="text-muted-foreground">{placeholder}</span>}
          </span>
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="h-4 w-4 opacity-50 shrink-0" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-50 max-h-80 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg",
            "data-[state=open]:animate-fade-in data-[state=open]:animate-zoom-in",
            "data-[state=closed]:animate-fade-out data-[state=closed]:animate-zoom-out",
          )}
          position="popper"
          sideOffset={6}
        >
          {searchable && options.length > 8 && (
            <SelectSearchInput query={searchQuery} onChange={setSearchQuery} />
          )}
          <SelectPrimitive.Viewport className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                Sin resultados
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function SelectSearchInput({
  query,
  onChange,
}: {
  query: string;
  onChange: (q: string) => void;
}) {
  return (
    <div className="sticky top-0 z-10 bg-popover px-2 py-1.5 border-b border-border">
      <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-surface-sunken">
        <SearchIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar…"
          className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none border-none"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function SelectItem({
  value,
  children,
  disabled = false,
  className,
}: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      value={value}
      disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}