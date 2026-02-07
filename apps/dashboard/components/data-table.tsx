"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Download } from "lucide-react"

export interface ColumnDef<T> {
  key: string
  header: string
  sortable?: boolean
  sortKey?: string
  cell?: (item: T) => ReactNode
  className?: string
}

export interface FilterOption {
  value: string
  label: string
}

export interface FilterDef {
  key: string
  label: string
  options: FilterOption[]
  placeholder?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  sortBy?: string
  sortOrder?: "asc" | "desc"
  onSort?: (column: string) => void
  currentPage?: number
  totalPages?: number
  itemsPerPage?: number
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
  filters?: FilterDef[]
  filterValues?: Record<string, string>
  onFilterChange?: (key: string, value: string) => void
  emptyMessage?: string
  loadingMessage?: string
  pageSizeOptions?: number[]
  actions?: (item: T) => ReactNode
  hideExport?: boolean
  exportFileName?: string
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  loading = false,
  sortBy,
  sortOrder = "desc",
  onSort,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 25,
  onPageChange,
  onItemsPerPageChange,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = false,
  filters = [],
  filterValues = {},
  onFilterChange,
  emptyMessage = "No data found",
  loadingMessage = "Loading...",
  pageSizeOptions = [25, 50, 100, 200],
  actions,
  hideExport = false,
  exportFileName = "export",
}: DataTableProps<T>) {
  const getSortIcon = (column: ColumnDef<T>) => {
    if (!column.sortable || !onSort) return null

    const columnKey = column.sortKey || column.key
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  const handleSort = (column: ColumnDef<T>) => {
    if (!column.sortable || !onSort) return
    const columnKey = column.sortKey || column.key
    onSort(columnKey)
  }

  const handleExport = () => {
    if (data.length === 0) return

    // Get headers from columns (exclude actions)
    const headers = columns.map((col) => col.header)

    // Convert data to CSV
    const csvRows = []

    // Add header row
    csvRows.push(headers.join(","))

    // Add data rows
    data.forEach((item) => {
      const values = columns.map((col) => {
        // Get value from item
        const value = (item as any)[col.key]

        // Handle different value types
        if (value === null || value === undefined) {
          return ""
        }

        // Convert to string and escape quotes
        const stringValue = String(value).replace(/"/g, '""')

        // Wrap in quotes if contains comma, newline, or quote
        if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
          return `"${stringValue}"`
        }

        return stringValue
      })

      csvRows.push(values.join(","))
    })

    // Create CSV string
    const csvString = csvRows.join("\n")

    // Create blob and download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `${exportFileName}-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      {(showSearch || filters.length > 0 || !hideExport) && (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-1">
              {/* Search Input */}
              {showSearch && onSearchChange && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-8"
                  />
                </div>
              )}

              {/* Filters */}
              {filters.length > 0 && onFilterChange && (
                <>
                  {filters.map((filter) => (
                    <Select
                      key={filter.key}
                      value={filterValues[filter.key] || "all"}
                      onValueChange={(value) => onFilterChange(filter.key, value)}
                    >
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder={filter.placeholder || filter.label} />
                      </SelectTrigger>
                      <SelectContent>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ))}
                </>
              )}
            </div>

            {/* Export Button */}
            {!hideExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={data.length === 0 || loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
          {/* Separator */}
          <div className="border-t" />
        </>
      )}

      {/* Pagination - Always visible */}
      {(onPageChange || onItemsPerPageChange) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onPageChange && (
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            )}
            {onItemsPerPageChange && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
            )}
          </div>
          {onPageChange && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-8">{loadingMessage}</div>
      ) : data.length === 0 && searchValue ? (
        /* Empty state for search with no results */
        <div className="text-center py-8 text-muted-foreground">
          No results found for "{searchValue}"
        </div>
      ) : data.length === 0 ? (
        /* Empty state */
        <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>
      ) : (
        /* Table */
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.sortable ? "p-0" : column.className}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column)}
                      className="h-full w-full justify-start px-4 hover:bg-accent font-medium"
                    >
                      {column.header}
                      {getSortIcon(column)}
                    </Button>
                  ) : (
                    <span className="px-4">{column.header}</span>
                  )}
                </TableHead>
              ))}
              {actions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell ? column.cell(item) : (item as any)[column.key]}
                  </TableCell>
                ))}
                {actions && <TableCell>{actions(item)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination - Bottom (only with data) */}
      {data.length > 0 && (onPageChange || onItemsPerPageChange) && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            {onPageChange && (
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            )}
            {onItemsPerPageChange && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">per page</span>
              </div>
            )}
          </div>
          {onPageChange && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
