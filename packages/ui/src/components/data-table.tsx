"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  CheckIcon,
  MinusIcon,
  Columns3Icon,
  Maximize2Icon,
  XIcon,
} from "../icons";
import { cn } from "../lib/utils";
import { downloadCsv } from "../lib/csv";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "./dropdown-menu";
import { useElementWidth } from "../hooks/use-element-width";
import { OverlayFullscreen } from "./overlay-fullscreen";

/* ── Column Definition ── */

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: number;
  /** Ancho mínimo (px) del contenedor para mostrar la columna: bajo ese umbral
   *  la columna se oculta sola (adaptativa al espacio disponible). */
  hideBelow?: number;
  render?: (row: T) => React.ReactNode;
  csvValue?: (row: T) => string;
}

/**
 * Selección de columnas visibles: las forzadas-ocultas por el usuario ganan
 * siempre; luego se aplican los umbrales adaptativos (hideBelow) según el ancho
 * medido del contenedor. Función pura — testeada.
 */
export function selectVisibleColumns<T>(
  columns: ColumnDef<T>[],
  width: number,
  forcedHidden: ReadonlySet<string>,
): ColumnDef<T>[] {
  return columns.filter((col) => {
    if (forcedHidden.has(col.key)) return false;
    if (col.hideBelow != null && width > 0 && width < col.hideBelow) return false;
    return true;
  });
}

const COLUMNS_STORAGE_PREFIX = "enjambre:table-cols:";

function loadForcedHidden(storageKey?: string): Set<string> {
  if (!storageKey || typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(COLUMNS_STORAGE_PREFIX + storageKey);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((k): k is string => typeof k === "string"));
  } catch {
    return new Set();
  }
}

/* ── Pagination ── */

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

/* ── Sort ── */

interface SortState<T> {
  column: string | null;
  direction: "asc" | "desc";
}

function sortData<T>(data: T[], sort: SortState<T>, columns: ColumnDef<T>[]): T[] {
  if (!sort.column) return data;

  const col = columns.find((c) => c.key === sort.column);
  if (!col) return data;

  return [...data].sort((a, b) => {
    const aRaw = (a as Record<string, unknown>)[col.key];
    const bRaw = (b as Record<string, unknown>)[col.key];

    const aVal =
      col.render
        ? col.csvValue?.(a) ?? String(aRaw ?? "")
        : String(aRaw ?? "");
    const bVal =
      col.render
        ? col.csvValue?.(b) ?? String(bRaw ?? "")
        : String(bRaw ?? "");

    const aNum = Number(aVal);
    const bNum = Number(bVal);

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sort.direction === "asc" ? aNum - bNum : bNum - aNum;
    }

    const cmp = aVal.localeCompare(bVal, "es", { sensitivity: "base" });
    return sort.direction === "asc" ? cmp : -cmp;
  });
}

/* ── Selection ── */

interface SelectionState {
  selectedIds: Set<string>;
  lastClicked: string | null;
}

function toggleSelection(
  state: SelectionState,
  id: string,
  shiftKey: boolean,
  orderedIds: string[],
): SelectionState {
  const newSelected = new Set(state.selectedIds);

  if (shiftKey && state.lastClicked) {
    const startIdx = orderedIds.indexOf(state.lastClicked);
    const endIdx = orderedIds.indexOf(id);
    if (startIdx !== -1 && endIdx !== -1) {
      const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      for (let i = from; i <= to; i++) {
        const rangeId = orderedIds[i];
        if (rangeId) newSelected.add(rangeId);
      }
      return { selectedIds: newSelected, lastClicked: id };
    }
  }

  if (newSelected.has(id)) {
    newSelected.delete(id);
  } else {
    newSelected.add(id);
  }

  return { selectedIds: newSelected, lastClicked: id };
}

function toggleAll(currentPageIds: string[], selectedIds: Set<string>): Set<string> {
  const allSelected = currentPageIds.every((id) => selectedIds.has(id));
  const newSelected = new Set(selectedIds);

  if (allSelected) {
    currentPageIds.forEach((id) => newSelected.delete(id));
  } else {
    currentPageIds.forEach((id) => newSelected.add(id));
  }

  return newSelected;
}

/* ── Props ── */

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  getId: (row: T) => string;
  /** Enables multi-select + bulk actions */
  selectable?: boolean;
  /** Enables column sort via header click */
  sortable?: boolean;
  /** Enables pagination. If omitted, shows all rows. */
  pagination?: {
    pageSize: number;
    currentPage: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  /** Renders when rows.length === 0 */
  emptyState?: React.ReactNode;
  /** Renders as caption above scroll wrapper */
  caption?: string;
  /** Enables CSV export of all rows (not just current page) */
  exportable?: boolean;
  /** Filename for CSV export (default "export") */
  exportFilename?: string;
  /** Enables the "Columnas" picker (show/hide columns, persisted per storageKey) */
  columnsControl?: boolean;
  /** Storage key for the picker persistence (required for meaningful persistence) */
  storageKey?: string;
  /** Enables fullscreen mode (OverlayFullscreen): la tabla se expande a pantalla completa */
  fullscreen?: boolean;
  /** Title shown in the fullscreen header (default: caption or "Tabla") */
  fullscreenLabel?: string;
  /** Bulk action buttons rendered in selection toolbar */
  bulkActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;
  className?: string;
}

/* ── Component ── */

export function DataTable<T>({
  columns,
  rows,
  getId,
  selectable = false,
  sortable = false,
  pagination,
  emptyState,
  caption,
  exportable = false,
  exportFilename = "export",
  columnsControl = false,
  storageKey,
  fullscreen = false,
  fullscreenLabel,
  bulkActions,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState<T>>({ column: null, direction: "asc" });
  const [selection, setSelection] = useState<SelectionState>({
    selectedIds: new Set(),
    lastClicked: null,
  });

  /* ── Columnas adaptativas: ancho medido del contenedor + picker persistido ── */
  const { ref: measureRef, width } = useElementWidth<HTMLDivElement>();
  const [forcedHidden, setForcedHidden] = useState<Set<string>>(() =>
    loadForcedHidden(storageKey),
  );
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    window.localStorage.setItem(
      COLUMNS_STORAGE_PREFIX + storageKey,
      JSON.stringify(Array.from(forcedHidden)),
    );
  }, [forcedHidden, storageKey]);

  const visibleColumns = useMemo(
    () => selectVisibleColumns(columns, width, forcedHidden),
    [columns, width, forcedHidden],
  );

  const toggleColumn = useCallback((key: string) => {
    setForcedHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  /* ── Sorting ── */
  const handleSort = useCallback(
    (colKey: string) => {
      if (!sortable) return;
      setSort((prev) => {
        if (prev.column === colKey) {
          const newDir = prev.direction === "asc" ? "desc" : "asc";
          return { column: colKey, direction: newDir };
        }
        return { column: colKey, direction: "asc" };
      });
    },
    [sortable],
  );

  const sortedRows = useMemo(() => {
    if (!sort.column) return rows;
    return sortable ? sortData(rows, sort, columns) : rows;
  }, [rows, sort, sortable, columns]);

  /* ── Pagination ── */
  const currentPageRows = useMemo(() => {
    if (!pagination) return sortedRows;
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedRows.slice(start, end);
  }, [sortedRows, pagination]);

  const currentPageIds = useMemo(
    () => currentPageRows.map((r) => getId(r)),
    [currentPageRows, getId],
  );

  /* ── Selection ── */
  const handleRowClick = useCallback(
    (id: string, event: React.MouseEvent) => {
      const allIds = pagination ? sortedRows.map((r) => getId(r)) : currentPageIds;
      setSelection((prev) =>
        toggleSelection(prev, id, event.shiftKey, allIds),
      );
    },
    [pagination, sortedRows, getId, currentPageIds],
  );

  const handleSelectAll = useCallback(() => {
    setSelection((prev) => ({
      ...prev,
      selectedIds: toggleAll(currentPageIds, prev.selectedIds),
    }));
  }, [currentPageIds]);

  const clearSelection = useCallback(() => {
    setSelection({ selectedIds: new Set(), lastClicked: null });
  }, []);

  /* ── Export ── */
  const handleExport = useCallback(() => {
    const csvColumns = columns.map((c) => c.key);
    const csvRows = sortedRows.map((row) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col) => {
        obj[col.key] =
          col.csvValue
            ? col.csvValue(row)
            : (row as Record<string, unknown>)[col.key] ?? "";
      });
      return obj;
    });
    downloadCsv(exportFilename, csvColumns, csvRows);
  }, [columns, sortedRows, exportFilename]);

  const isAllSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selection.selectedIds.has(id));

  const isSomeSelected = currentPageIds.some((id) => selection.selectedIds.has(id));

  /* ── Modo fullscreen (rescata OverlayFullscreen: foco profundo por tabla) ── */
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const fullscreenTitle = fullscreenLabel ?? caption ?? "Tabla";

  /* Cuerpo de la tabla (thead + tbody): un solo montaje a la vez — en línea o en
     fullscreen. useElementWidth sigue al nodo: al remontar, las columnas
     adaptativas reaccionan al ancho de pantalla completa. */
  const tableBody = (
    <>
      <thead>
        <tr>
          {/* Select-all checkbox column */}
          {selectable && (
            <th style={{ width: 48 }} className="px-1">
              <button
                type="button"
                onClick={handleSelectAll}
                className={cn(
                  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors",
                )}
                aria-label={isAllSelected ? "Deseleccionar todo" : "Seleccionar todo"}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                    isAllSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : isSomeSelected
                        ? "bg-primary/50 border-primary text-primary-foreground"
                        : "border-border hover:border-foreground/40",
                  )}
                >
                  {isAllSelected ? (
                    <CheckIcon className="h-3 w-3" />
                  ) : isSomeSelected ? (
                    <MinusIcon className="h-3 w-3" />
                  ) : null}
                </span>
              </button>
            </th>
          )}

          {/* Column headers */}
          {visibleColumns.map((col) => {
            const canSort = sortable && col.sortable !== false;
            return (
              <th
                key={col.key}
                style={{
                  width: col.width,
                  minWidth: col.width,
                  textAlign: col.align ?? "left",
                  // Densidad: la shell (data-density) ajusta el padding de celdas
                  paddingInline: "var(--density-cell-pad, 12px)",
                }}
                className={cn(
                  "text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border",
                  canSort && "cursor-pointer select-none hover:text-foreground transition-colors",
                )}
                onClick={() => {
                  if (canSort) handleSort(col.key);
                }}
                aria-sort={
                  canSort && sort.column === col.key
                    ? sort.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                <span className="inline-flex min-h-11 items-center gap-1 py-2">
                  {col.header}
                  {canSort && sort.column === col.key && (
                    <span className="text-accent" aria-hidden>
                      {sort.direction === "asc" ? (
                        <ChevronUpIcon className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDownIcon className="h-3.5 w-3.5" />
                      )}
                    </span>
                  )}
                </span>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {currentPageRows.length === 0 ? (
          <tr>
            <td
              colSpan={visibleColumns.length + (selectable ? 1 : 0)}
              className="py-10 text-center text-muted-foreground"
            >
              {emptyState ?? "Sin datos"}
            </td>
          </tr>
        ) : (
          currentPageRows.map((row) => {
            const id = getId(row);
            const isSelected = selection.selectedIds.has(id);
            return (
              <tr
                key={id}
                className={cn(
                  "border-b border-border/50 transition-colors",
                  isSelected
                    ? "bg-accent/10"
                    : "hover:bg-surface-raised/30",
                )}
              >
                {selectable && (
                  <td
                    className="px-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRowClick(id, e);
                    }}
                  >
                    <button
                      type="button"
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md"
                      aria-label={isSelected ? "Deseleccionar" : "Seleccionar"}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border hover:border-foreground/40",
                        )}
                      >
                        {isSelected && <CheckIcon className="h-3 w-3" />}
                      </span>
                    </button>
                  </td>
                )}
                {visibleColumns.map((col) => {
                  const value = col.render
                    ? col.render(row)
                    : (row as Record<string, unknown>)[col.key];
                  return (
                    <td
                      key={col.key}
                      style={{
                        textAlign: col.align ?? "left",
                        padding: "var(--density-cell-pad, 12px)",
                      }}
                      className="text-sm text-foreground"
                    >
                      {value as React.ReactNode}
                    </td>
                  );
                })}
              </tr>
            );
          })
        )}
      </tbody>
    </>
  );

  const paginationFooter = pagination ? (
    <div className="flex items-center justify-between pt-2">
      <span className="text-xs text-muted-foreground">
        Página {pagination.currentPage} de{" "}
        {Math.ceil(pagination.total / pagination.pageSize)} —{" "}
        {pagination.total} resultados
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={pagination.currentPage <= 1}
          onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
          className="min-w-11"
          aria-label="Página anterior"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="sr-only">Anterior</span>
        </Button>
        {renderPageNumbers(pagination.currentPage, Math.ceil(pagination.total / pagination.pageSize))
          .filter((p): p is number => typeof p === "number")
          .map((p) => (
            <Button
              key={p}
              variant={p === pagination.currentPage ? "primary" : "ghost"}
              size="sm"
              onClick={() => pagination.onPageChange(p)}
              className="min-w-11"
            >
              {p}
            </Button>
          ))}
        <Button
          variant="ghost"
          size="sm"
          disabled={
            pagination.currentPage >=
            Math.ceil(pagination.total / pagination.pageSize)
          }
          onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
          className="min-w-11"
          aria-label="Página siguiente"
        >
          <ChevronRightIcon className="h-4 w-4" />
          <span className="sr-only">Siguiente</span>
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selection + Export + Column picker + Fullscreen toolbar */}
      {(selectable || exportable || columnsControl || fullscreen) && (
        <div className="flex items-center gap-2 flex-wrap">
          {selectable && selection.selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selection.selectedIds.size} seleccionado{selection.selectedIds.size !== 1 ? "s" : ""}
              </span>
              {bulkActions?.(Array.from(selection.selectedIds), clearSelection)}
            </>
          )}
          {columnsControl && columns.length > 1 && (
            <DropdownMenu
              align="start"
              sideOffset={6}
              trigger={
                <Button variant="ghost" size="sm">
                  <Columns3Icon className="h-4 w-4 mr-1.5" />
                  Columnas
                </Button>
              }
            >
              {columns.map((col) => {
                const hidden = forcedHidden.has(col.key);
                return (
                  <DropdownMenuItem
                    key={col.key}
                    onSelect={(e) => {
                      e.preventDefault(); // picker multi-select: no cerrar el menú
                      toggleColumn(col.key);
                    }}
                  >
                    <span
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        hidden ? "border-border" : "bg-primary border-primary text-primary-foreground",
                      )}
                    >
                      {!hidden && <CheckIcon className="h-3 w-3" />}
                    </span>
                    <span className={cn(hidden && "text-muted-foreground line-through")}>
                      {col.header}
                    </span>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setForcedHidden(new Set());
                }}
              >
                <span className="text-muted-foreground">Restaurar todas</span>
              </DropdownMenuItem>
            </DropdownMenu>
          )}
          {fullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreenOpen(true)}
              aria-label={`${fullscreenTitle} en pantalla completa`}
              title="Pantalla completa"
            >
              <Maximize2Icon className="h-4 w-4 mr-1.5" />
              Pantalla completa
            </Button>
          )}
          {exportable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="ml-auto"
            >
              <DownloadIcon className="h-4 w-4 mr-1.5" />
              Exportar CSV
            </Button>
          )}
        </div>
      )}

      {fullscreenOpen ? (
        <OverlayFullscreen
          open={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
          ariaLabel={`${fullscreenTitle} en pantalla completa`}
          closeOnBackdropClick
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 shrink-0">
            <span className="text-sm font-semibold text-foreground truncate">
              {fullscreenTitle}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setFullscreenOpen(false)}>
              <XIcon className="h-4 w-4 mr-1.5" />
              Cerrar
            </Button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {/* Tabla + paginación: se monta aquí (la medición re-observa el nodo
                y las columnas adaptativas reaccionan al ancho de pantalla completa) */}
            <div className="enj-table-shell" ref={measureRef}>
              {caption && <p className="enj-table-shell-caption">{caption}</p>}
              <div className="enj-table-shell-scroll">
                <table className="data-table">
              {tableBody}
            </table>
        </div>
      </div>

      {paginationFooter}
        </div>
      </OverlayFullscreen>
      ) : (
        <>
          <div className="enj-table-shell" ref={measureRef}>
            {caption && <p className="enj-table-shell-caption">{caption}</p>}
            <div className="enj-table-shell-scroll">
              <table className="data-table">
                {tableBody}
              </table>
            </div>
          </div>
          {paginationFooter}
        </>
      )}
    </div>
  );
}

/** Generates a compact page number list: [1, '…', 4, 5, 6, '…', 10] */
function renderPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("…");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push("…");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("…");
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push("…");
    pages.push(total);
  }
  return pages;
}