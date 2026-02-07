# DataTable Component

A reusable, feature-rich table component for the dashboard with built-in sorting, pagination, and customization options.

## Features

- ✅ **Sortable Columns** - Click column headers to sort
- ✅ **Search** - Built-in search input with customizable placeholder
- ✅ **Filters** - Built-in select filters for easy data filtering
- ✅ **Pagination** - Built-in page navigation with customizable page sizes
- ✅ **Loading States** - Automatic loading and empty state handling
- ✅ **Custom Cell Rendering** - Full control over cell content
- ✅ **Actions Column** - Easy action buttons for each row
- ✅ **TypeScript Support** - Fully typed with generics
- ✅ **Consistent Styling** - Uses shadcn/ui components

## Installation

The component is already installed at `/components/data-table.tsx`.

## Basic Usage

```tsx
import { DataTable, ColumnDef } from "@/components/data-table"

interface User {
  id: number
  name: string
  email: string
  role: string
}

function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const columns: ColumnDef<User>[] = [
    { key: "name", header: "Name", sortable: true },
    { key: "email", header: "Email", sortable: true },
    { key: "role", header: "Role", sortable: false },
  ]

  return (
    <DataTable
      data={users}
      columns={columns}
      loading={loading}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | **required** | Array of data items to display |
| `columns` | `ColumnDef<T>[]` | **required** | Column definitions |
| `loading` | `boolean` | `false` | Show loading state |
| `sortBy` | `string` | - | Current sort column key |
| `sortOrder` | `"asc" \| "desc"` | `"desc"` | Current sort order |
| `onSort` | `(column: string) => void` | - | Sort handler |
| `currentPage` | `number` | `1` | Current page number |
| `totalPages` | `number` | `1` | Total number of pages |
| `itemsPerPage` | `number` | `10` | Items per page |
| `onPageChange` | `(page: number) => void` | - | Page change handler |
| `onItemsPerPageChange` | `(size: number) => void` | - | Page size change handler |
| `searchValue` | `string` | `""` | Current search value |
| `onSearchChange` | `(value: string) => void` | - | Search change handler |
| `searchPlaceholder` | `string` | `"Search..."` | Search input placeholder |
| `showSearch` | `boolean` | `false` | Show search input |
| `filters` | `FilterDef[]` | `[]` | Array of filter definitions |
| `filterValues` | `Record<string, string>` | `{}` | Current filter values (key-value pairs) |
| `onFilterChange` | `(key: string, value: string) => void` | - | Filter change handler |
| `emptyMessage` | `string` | `"No data found"` | Message when data is empty |
| `loadingMessage` | `string` | `"Loading..."` | Message during loading |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | Available page sizes |
| `actions` | `(item: T) => ReactNode` | - | Render function for actions column |

## Type Definitions

### Column Definition

```typescript
interface ColumnDef<T> {
  key: string              // Data key or unique identifier
  header: string           // Column header text
  sortable?: boolean       // Enable sorting for this column
  sortKey?: string         // Custom sort key (if different from key)
  cell?: (item: T) => ReactNode  // Custom cell renderer
  className?: string       // CSS classes for cells
}
```

### Filter Definition

```typescript
interface FilterOption {
  value: string            // Filter option value
  label: string            // Display label for the option
}

interface FilterDef {
  key: string              // Filter key (should match your state)
  label: string            // Filter label
  options: FilterOption[]  // Array of filter options
  placeholder?: string     // Optional placeholder text
}
```

## Advanced Examples

### 1. Custom Cell Rendering

```tsx
const columns: ColumnDef<Transaction>[] = [
  {
    key: "amount",
    header: "Amount",
    sortable: true,
    cell: (transaction) => (
      <span className={transaction.type === "SALE" ? "text-green-600" : "text-red-600"}>
        {formatPrice(transaction.amount, transaction.currency)}
      </span>
    ),
  },
]
```

### 2. Sortable Columns with Backend

```tsx
const [sortBy, setSortBy] = useState("createdAt")
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

const handleSort = (column: string) => {
  if (sortBy === column) {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  } else {
    setSortBy(column)
    setSortOrder("desc")
  }
}

// In useEffect, refetch data when sortBy or sortOrder changes
useEffect(() => {
  fetchData({ sortBy, sortOrder })
}, [sortBy, sortOrder])

<DataTable
  data={data}
  columns={columns}
  sortBy={sortBy}
  sortOrder={sortOrder}
  onSort={handleSort}
/>
```

### 3. Actions Column

```tsx
const renderActions = (user: User) => (
  <div className="flex gap-2">
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleEdit(user.id)}
    >
      <Edit className="h-4 w-4" />
    </Button>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleDelete(user.id)}
    >
      <Trash2 className="h-4 w-4 text-red-600" />
    </Button>
  </div>
)

<DataTable
  data={users}
  columns={columns}
  actions={renderActions}
/>
```

### 4. Filters

```tsx
const [filterValues, setFilterValues] = useState({
  category: "all",
  status: "all",
  country: "all",
})

const filters: FilterDef[] = [
  {
    key: "category",
    label: "Category",
    placeholder: "All Categories",
    options: [
      { value: "all", label: "All Categories" },
      { value: "ELECTRONICS", label: "Electronics" },
      { value: "CLOTHING", label: "Clothing" },
      { value: "FOOD", label: "Food" },
    ],
  },
  {
    key: "status",
    label: "Status",
    options: [
      { value: "all", label: "All Status" },
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
]

const handleFilterChange = (key: string, value: string) => {
  setFilterValues((prev) => ({ ...prev, [key]: value }))
}

// Apply filters to data
const filteredData = data.filter((item) => {
  const matchesCategory = filterValues.category === "all" || item.category === filterValues.category
  const matchesStatus = filterValues.status === "all" || item.status === filterValues.status
  return matchesCategory && matchesStatus
})

<DataTable
  data={filteredData}
  columns={columns}
  filters={filters}
  filterValues={filterValues}
  onFilterChange={handleFilterChange}
/>
```

### 5. Search Functionality

```tsx
const [searchQuery, setSearchQuery] = useState("")

// Filter data based on search query
const filteredData = useMemo(() => {
  if (!searchQuery) return data

  return data.filter((item) =>
    Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  )
}, [data, searchQuery])

<DataTable
  data={filteredData}
  columns={columns}
  searchValue={searchQuery}
  onSearchChange={setSearchQuery}
  searchPlaceholder="Search transactions..."
  showSearch={true}
/>
```

### 6. Pagination with Backend

```tsx
const [currentPage, setCurrentPage] = useState(1)
const [totalPages, setTotalPages] = useState(1)
const [itemsPerPage, setItemsPerPage] = useState(10)

const handlePageChange = (page: number) => {
  setCurrentPage(page)
}

const handleItemsPerPageChange = (size: number) => {
  setItemsPerPage(size)
  setCurrentPage(1) // Reset to first page
}

// In useEffect, refetch when page or size changes
useEffect(() => {
  fetchData({ page: currentPage, limit: itemsPerPage })
}, [currentPage, itemsPerPage])

<DataTable
  data={data}
  columns={columns}
  currentPage={currentPage}
  totalPages={totalPages}
  itemsPerPage={itemsPerPage}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
/>
```

### 7. Complete Example (Transactions Table)

```tsx
import { DataTable, ColumnDef } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Trash2 } from "lucide-react"
import { formatPrice, formatDate } from "@/lib/utils"

function TransactionsTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState("transactionDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const columns: ColumnDef<Transaction>[] = [
    {
      key: "transactionNumber",
      header: "Transaction #",
      sortable: true,
      cell: (t) => <span className="font-mono text-xs">{t.transactionNumber}</span>,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      cell: (t) => (
        <Badge className={t.type === "SALE" ? "bg-green-100" : "bg-red-100"}>
          {t.type}
        </Badge>
      ),
    },
    {
      key: "transactionDate",
      header: "Date",
      sortable: true,
      cell: (t) => formatDate(t.transactionDate),
    },
    { key: "description", header: "Description" },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      cell: (t) => (
        <span className={t.type === "SALE" ? "text-green-600" : "text-red-600"}>
          {formatPrice(t.amount, t.currency)}
        </span>
      ),
    },
    { key: "country", header: "Country", sortable: true },
  ]

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const renderActions = (transaction: Transaction) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => viewTransaction(transaction)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => deleteTransaction(transaction.id)}>
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  )

  useEffect(() => {
    fetchTransactions({ page: currentPage, limit: itemsPerPage, sortBy, sortOrder })
  }, [currentPage, itemsPerPage, sortBy, sortOrder])

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
      onPageChange={setCurrentPage}
      onItemsPerPageChange={(size) => {
        setItemsPerPage(size)
        setCurrentPage(1)
      }}
      emptyMessage="No transactions found"
      actions={renderActions}
    />
  )
}
```

## Styling

The component uses shadcn/ui components and Tailwind CSS. All styles are consistent with the dashboard theme.

To customize specific cells, use the `className` prop in column definitions:

```tsx
{
  key: "amount",
  header: "Amount",
  className: "text-right font-mono"
}
```

## TypeScript

The component is fully typed with TypeScript generics. The only requirement is that your data type must have an `id` property:

```typescript
interface MyData {
  id: number  // or string
  // ... other properties
}
```

## Best Practices

1. **Always memoize columns** to prevent unnecessary re-renders:
   ```tsx
   const columns = useMemo(() => [...], [dependencies])
   ```

2. **Keep cell renderers simple** - extract complex logic to separate functions

3. **Handle loading states** - Always set `loading={true}` when fetching data

4. **Provide meaningful empty messages** - Help users understand why the table is empty

5. **Reset page when changing filters** - Always reset to page 1 when filters change

## Migration from Old Tables

To migrate existing tables:

1. Extract column definitions to a `ColumnDef` array
2. Move custom cell rendering to the `cell` property
3. Replace pagination logic with props
4. Move action buttons to the `actions` prop
5. Replace the entire `<Table>` component with `<DataTable>`

See `/components/data-table-example.tsx` for a complete working example.
