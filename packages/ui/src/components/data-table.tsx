"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  CheckIcon,
  MinusIcon,
} from "../icons";
import { cn } from "../lib/utils";
import { downloadCsv } from "../lib/csv";
import { Button } from "./button";

/* ── Column Definition ── */

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: number;
  render?: (row: T) => React.ReactNode;
  csvValue?: (row: T) => string;
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
  bulkActions,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState<T>>({ column: null, direction: "asc" });
  const [selection, setSelection] = useState<SelectionState>({
    selectedIds: new Set(),
    lastClicked: null,
  });

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

  return (
    <div className={cn("space-y-3", className)}>
      {/* Selection + Export toolbar */}
      {(selectable || exportable) && (
        <div className="flex items-center gap-2 flex-wrap">
          {selectable && selection.selectedIds.size > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selection.selectedIds.size} seleccionado{selection.selectedIds.size !== 1 ? "s" : ""}
              </span>
              {bulkActions?.(Array.from(selection.selectedIds), clearSelection)}
            </>
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

      {/* Table wrapper (horizontal scroll) */}
      <div className="enj-table-shell">
        {caption && <p className="enj-table-shell-caption">{caption}</p>}
        <div className="enj-table-shell-scroll">
          <table className="data-table">
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
                {columns.map((col) => {
                  const canSort = sortable && col.sortable !== false;
                  return (
                  <th
                    key={col.key}
                    style={{
                      width: col.width,
                      minWidth: col.width,
                      textAlign: col.align ?? "left",
                    }}
                    className={cn(
                      "px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border",
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
                    colSpan={columns.length + (selectable ? 1 : 0)}
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
                      {columns.map((col) => {
                        const value = col.render
                          ? col.render(row)
                          : (row as Record<string, unknown>)[col.key];
                        return (
                          <td
                            key={col.key}
                            style={{ textAlign: col.align ?? "left" }}
                            className="py-3 px-3 text-sm text-foreground"
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
          </table>
        </div>
      </div>

      {/* Pagination footer */}
      {pagination && (
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