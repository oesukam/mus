/**
 * DataTable Component Usage Example
 *
 * This file demonstrates how to use the reusable DataTable component
 * in your dashboard pages.
 */

import { DataTable, ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Trash2 } from "lucide-react"
import { formatPrice, formatDate } from "@/lib/utils"

// Example: Transactions Table
interface Transaction {
  id: number
  transactionNumber: string
  type: "SALE" | "EXPENSE"
  transactionDate: string
  description: string
  amount: number
  currency: string
  country: string
}

export function TransactionsTableExample() {
  // Your state management
  const transactions: Transaction[] = [] // from useState or API
  const loading = false
  const sortBy = "transactionDate"
  const sortOrder: "asc" | "desc" = "desc"
  const currentPage = 1
  const totalPages = 10
  const itemsPerPage = 10
  const searchQuery = ""

  // Define columns
  const columns: ColumnDef<Transaction>[] = [
    {
      key: "transactionNumber",
      header: "Transaction #",
      sortable: true,
      cell: (transaction) => (
        <span className="font-mono text-xs">{transaction.transactionNumber}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      cell: (transaction) => (
        <Badge
          className={
            transaction.type === "SALE"
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : "bg-red-100 text-red-800 hover:bg-red-100"
          }
        >
          {transaction.type}
        </Badge>
      ),
    },
    {
      key: "transactionDate",
      header: "Date",
      sortable: true,
      cell: (transaction) => formatDate(transaction.transactionDate),
    },
    {
      key: "description",
      header: "Description",
      sortable: false,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      cell: (transaction) => (
        <span
          className={
            transaction.type === "SALE"
              ? "text-green-600 font-semibold"
              : "text-red-600 font-semibold"
          }
        >
          {formatPrice(transaction.amount, transaction.currency)}
        </span>
      ),
    },
    {
      key: "country",
      header: "Country",
      sortable: true,
    },
  ]

  // Handlers
  const handleSort = (column: string) => {
    // Implement your sort logic
    console.log("Sorting by:", column)
  }

  const handlePageChange = (page: number) => {
    // Implement your page change logic
    console.log("Changing to page:", page)
  }

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    // Implement your items per page change logic
    console.log("Items per page:", itemsPerPage)
  }

  const handleSearchChange = (value: string) => {
    // Implement your search logic
    console.log("Search query:", value)
  }

  // Actions column
  const renderActions = (transaction: Transaction) => (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => console.log("View", transaction.id)}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => console.log("Delete", transaction.id)}
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  )

  return (
    <DataTable
      data={transactions}
      columns={columns}
      loading={loading}
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={handleSort}
      currentPage={currentPage}
      totalPages={totalPages}
      itemsPerPage={itemsPerPage}
      onPageChange={handlePageChange}
      onItemsPerPageChange={handleItemsPerPageChange}
      showSearch={true}
      searchValue={searchQuery}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Search transactions..."
      emptyMessage="No transactions found"
      loadingMessage="Loading transactions..."
      actions={renderActions}
    />
  )
}

/**
 * Key Features:
 *
 * 1. SEARCH FUNCTIONALITY
 *    - Set `showSearch={true}` to enable search input
 *    - Provide `searchValue` and `onSearchChange` handler
 *    - Customize placeholder with `searchPlaceholder`
 *    - Shows "No results found" message when empty
 *
 * 2. SORTABLE COLUMNS
 *    - Set `sortable: true` on any column
 *    - Displays sort icons (up, down, or neutral)
 *    - Calls `onSort(columnKey)` when clicked
 *
 * 3. CUSTOM CELL RENDERING
 *    - Use the `cell` function to customize display
 *    - Access the full item data
 *    - Return any React node (badges, formatted text, etc.)
 *
 * 4. ACTIONS COLUMN
 *    - Pass `actions` prop with a render function
 *    - Receives the item as parameter
 *    - Automatically adds "Actions" header
 *
 * 5. PAGINATION
 *    - Pass `currentPage`, `totalPages`, `itemsPerPage`
 *    - Implement `onPageChange` and `onItemsPerPageChange`
 *    - Customize page size options with `pageSizeOptions`
 *
 * 6. LOADING & EMPTY STATES
 *    - Set `loading={true}` to show loading message
 *    - Customize messages with `loadingMessage` and `emptyMessage`
 *
 * 7. RESPONSIVE & STYLED
 *    - Uses shadcn/ui Table components
 *    - Consistent styling across tables
 *    - Hover effects and visual feedback
 */
