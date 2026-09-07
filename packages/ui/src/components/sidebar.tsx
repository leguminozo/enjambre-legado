'use client';

import React, { useEffect, useState } from 'react'

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

const srOnlyStyle: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

interface SidebarBadgeProps {
  badge: NonNullable<SidebarBadgeValue>
}

export function SidebarBadgeIndicator({ badge }: SidebarBadgeProps) {
  if (badge.type === 'dot') {
    const colorMap: Record<BadgeDotColor, string> = {
      green: 'hsl(var(--success))',
      orange: 'hsl(var(--warning))',
      red: 'hsl(var(--destructive))',
    }
    const labelMap: Record<BadgeDotColor, string> = {
      green: 'activo',
      orange: 'atención requerida',
      red: 'alerta de riesgo',
    }
    return (
      <span
        role="img"
        aria-label={`Indicador: ${labelMap[badge.color]}`}
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
        <span style={srOnlyStyle}>Pendientes: </span>
        {badge.value}
      </span>
    )
  }

  return null
}

interface SidebarNavItemProps {
  item: SidebarNavItemData
  active: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  // Polimorphic link: admite <a> nativo y next/link (cuyas LinkProps no son
  // contravariantes con AnchorHTMLAttributes). Patrón estándar de UI library.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkComponent?: React.ComponentType<any>
  /** Indentación visual para micro-herramientas bajo categoría */
  nested?: boolean
}

export function SidebarNavItem({ item, active, onClick, linkComponent, nested = false }: SidebarNavItemProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = (linkComponent || 'a') as React.ComponentType<any>

  return (
    <Component
      href={item.href}
      onClick={onClick}
      className={`nav-item ${active ? 'active' : ''}${nested ? ' nav-item--nested' : ''}`}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        minHeight: 44,
        padding: nested ? '0.5rem var(--space-md) 0.5rem 1.75rem' : '0.625rem var(--space-md)',
        borderRadius: 'var(--radius-sm)',
        fontSize: nested ? '0.8rem' : '0.85rem',
        fontWeight: active ? 500 : 400,
        color: active ? 'hsl(var(--sidebar-primary))' : 'hsl(var(--sidebar-foreground) / var(--nav-item-opacity, 0.7))',
        background: active ? 'hsl(var(--sidebar-accent))' : 'transparent',
        borderLeft: active ? '3px solid hsl(var(--sidebar-primary))' : '3px solid transparent',
        transition: 'all 150ms ease',
        textDecoration: 'none',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span className="nav-item-icon" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {item.icon}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
      {item.badge && <SidebarBadgeIndicator badge={item.badge} />}
    </Component>
  )
}

interface SidebarSectionProps {
  label: string
  items: SidebarNavItemData[]
  activeKey?: string
  onItemClick?: (item: SidebarNavItemData, e: React.MouseEvent<HTMLAnchorElement>) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linkComponent?: React.ComponentType<any>
  /**
   * Categoría desplegable (estándar industria). Si true, el label es un botón
   * que expande/colapsa las micro-herramientas. Se auto-abre si hay ítem activo.
   */
  collapsible?: boolean
  /** Estado abierto controlado (opcional). Si no se pasa, es interno. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Clave de grupo para aria */
  sectionKey?: string
}

export function SidebarSection({
  label,
  items,
  activeKey,
  onItemClick,
  linkComponent,
  collapsible = false,
  open: openControlled,
  onOpenChange,
  sectionKey,
}: SidebarSectionProps) {
  const hasActive = items.some((item) => item.key === activeKey)
  // Un solo ítem: no hace falta accordion (Inicio, Territorio, etc.)
  const useAccordion = collapsible && items.length > 1

  const [openInternal, setOpenInternal] = useState(hasActive)
  const isControlled = openControlled !== undefined
  const open = isControlled ? openControlled : openInternal

  // Auto-expandir cuando la ruta activa cae dentro de esta categoría
  useEffect(() => {
    if (items.length === 0 || !useAccordion) return
    if (hasActive) {
      if (isControlled) onOpenChange?.(true)
      else setOpenInternal(true)
    }
  }, [items.length, hasActive, useAccordion, isControlled, onOpenChange])

  if (items.length === 0) return null

  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next)
    else setOpenInternal(next)
  }

  const labelId = `sidebar-section-${sectionKey ?? label.toLowerCase().replace(/\s+/g, '-')}`

  if (!useAccordion) {
    return (
      <div role="group" aria-label={label}>
        <div
          className="nav-section-label"
          style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: 'hsl(var(--sidebar-foreground) / 0.4)',
            padding: 'var(--space-sm) var(--space-md)',
            marginTop: 'var(--space-lg)',
          }}
        >
          {label}
        </div>
        {items.map((item) => (
          <SidebarNavItem
            key={item.key}
            item={item}
            active={item.key === activeKey}
            onClick={(e) => onItemClick?.(item, e)}
            linkComponent={linkComponent}
          />
        ))}
      </div>
    )
  }

  return (
    <div role="group" aria-labelledby={labelId}>
      <button
        type="button"
        id={labelId}
        className="nav-section-toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minHeight: 44,
          marginTop: 'var(--space-lg)',
          padding: '0.5rem var(--space-md)',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          background: hasActive && !open ? 'hsl(var(--sidebar-accent) / 0.5)' : 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
            color: hasActive
              ? 'hsl(var(--sidebar-primary))'
              : 'hsl(var(--sidebar-foreground) / 0.45)',
          }}
        >
          {label}
        </span>
        <span
          aria-hidden
          style={{
            display: 'inline-flex',
            transition: 'transform 150ms ease',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            color: 'hsl(var(--sidebar-foreground) / 0.4)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      {open && (
        <div role="list" className="nav-section-items">
          {items.map((item) => (
            <SidebarNavItem
              key={item.key}
              item={item}
              active={item.key === activeKey}
              onClick={(e) => onItemClick?.(item, e)}
              linkComponent={linkComponent}
              nested
            />
          ))}
        </div>
      )}
    </div>
  )
}
