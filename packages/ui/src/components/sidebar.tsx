import React from 'react'

export type BadgeDotColor = 'green' | 'orange' | 'red'

export type SidebarBadgeValue =
  | { type: 'dot'; color: BadgeDotColor }
  | { type: 'count'; value: number }
  | null

export interface SidebarNavItemData {
  key: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: SidebarBadgeValue
}

export function registerSidebarIcons(_map: Record<string, React.ComponentType<{ size?: number }>>) {}

interface SidebarBadgeProps {
  badge: NonNullable<SidebarBadgeValue>
}

export function SidebarBadgeIndicator({ badge }: SidebarBadgeProps) {
  if (badge.type === 'dot') {
    const colorMap: Record<BadgeDotColor, string> = {
      green: 'hsl(145 63% 42%)',
      orange: 'hsl(38 92% 50%)',
      red: 'hsl(0 72% 51%)',
    }
    return (
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: colorMap[badge.color],
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
    )
  }

  if (badge.type === 'count' && badge.value > 0) {
    return (
      <span
        style={{
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          fontSize: '0.65rem',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 5px',
          background: 'hsl(var(--destructive) / 0.1)',
          color: 'hsl(var(--destructive))',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {badge.value}
      </span>
    )
  }

  return null
}

interface SidebarNavItemProps {
  item: SidebarNavItemData
  active: boolean
  onClick?: () => void
}

export function SidebarNavItem({ item, active, onClick }: SidebarNavItemProps) {
  return (
    <a
      href={item.href}
      onClick={onClick}
      className={`nav-item ${active ? 'active' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: 'var(--space-xs) var(--space-md)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.85rem',
        fontWeight: active ? 500 : 400,
        color: active ? 'hsl(var(--sidebar-primary))' : 'hsl(var(--sidebar-foreground) / 0.7)',
        background: active ? 'hsl(var(--sidebar-accent))' : 'transparent',
        borderLeft: active ? '3px solid hsl(var(--sidebar-primary))' : '3px solid transparent',
        transition: 'all 150ms ease',
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      <span className="nav-item-icon" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {item.icon}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
      {item.badge && <SidebarBadgeIndicator badge={item.badge} />}
    </a>
  )
}

interface SidebarSectionProps {
  label: string
  items: SidebarNavItemData[]
  activeKey?: string
  onItemClick?: (item: SidebarNavItemData) => void
}

export function SidebarSection({ label, items, activeKey, onItemClick }: SidebarSectionProps) {
  if (items.length === 0) return null
  return (
    <div>
      <div
        className="nav-section-label"
        style={{
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: 'hsl(var(--sidebar-foreground) / 0.4)',
          padding: 'var(--space-sm) var(--space-md)',
          marginTop: 'var(--space-sm)',
        }}
      >
        {label}
      </div>
      {items.map(item => (
        <SidebarNavItem
          key={item.key}
          item={item}
          active={item.key === activeKey}
          onClick={() => onItemClick?.(item)}
        />
      ))}
    </div>
  )
}
