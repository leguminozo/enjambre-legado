"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../lib/utils";

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  children,
  className,
}: TabsProps) {
  return (
    <TabsPrimitive.Root
      value={activeTab}
      onValueChange={onTabChange}
      className={cn("w-full", className)}
    >
      <TabsPrimitive.List className="flex gap-1 p-1 bg-surface-sunken/40 backdrop-blur-md border border-border/50 rounded-xl">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.id}
            value={tab.id}
            className={cn(
              "flex items-center justify-center gap-2 flex-1 px-4 py-2 text-xs font-semibold rounded-lg relative transition-colors duration-200",
              "data-[state=inactive]:text-muted-foreground hover:text-foreground",
              "data-[state=active]:text-foreground data-[state=active]:bg-card/85 data-[state=active]:border data-[state=active]:border-border/40 data-[state=active]:shadow-sm",
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      <div className="mt-4">{children}</div>
    </TabsPrimitive.Root>
  );
}

interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ id, children, className }: TabPanelProps) {
  return (
    <TabsPrimitive.Content
      value={id}
      className={cn(
        "data-[state=inactive]:hidden",
        className,
      )}
    >
      {children}
    </TabsPrimitive.Content>
  );
}