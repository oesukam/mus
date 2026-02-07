# DataTable Migration Guide

Quick guide to migrate existing tables to use the new reusable DataTable component.

## Before & After Comparison

### BEFORE (Old Way - ~150 lines)

```tsx
// State management (spread across component)
const [sortBy, setSortBy] = useState("createdAt")
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

// Sort handlers (duplicate code)
const handleSort = (column: string) => {
  if (sortBy === column) {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  } else {
    setSortBy(column)
    setSortOrder("desc")
  }
}

const getSortIcon = (column: string) => {
  if (sortBy !== column) {
    return <ArrowUpDown className="ml-2 h-4 w-4" />
  }
  return sortOrder === "asc" ? (
    <ArrowUp className="ml-2 h-4 w-4" />
  ) : (
    <ArrowDown className="ml-2 h-4 w-4" />
  )
}

// Table rendering (lots of boilerplate)
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="p-0">
        <Button variant="ghost" onClick={() => handleSort("name")}>
          Name {getSortIcon("name")}
        </Button>
      </TableHead>
      <TableHead className="p-0">
        <Button variant="ghost" onClick={() => handleSort("email")}>
          Email {getSortIcon("email")}
        </Button>
      </TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>
          <Button variant="ghost" onClick={() => handleEdit(user)}>
            <Edit className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

// Pagination (more boilerplate)
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <Label>Items per page:</Label>
    <Select value={itemsPerPage.toString()} onValueChange={(v) => setItemsPerPage(parseInt(v))}>
      <SelectTrigger className="w-20">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="10">10</SelectItem>
        <SelectItem value="25">25</SelectItem>
        <SelectItem value="50">50</SelectItem>
        <SelectItem value="100">100</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div className="flex gap-2">
    <Button variant="outline" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
      Previous
    </Button>
    <Button variant="outline" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
      Next
    </Button>
  </div>
</div>
```

### AFTER (New Way - ~40 lines)

```tsx
import { DataTable, ColumnDef } from "@/components/data-table"

// Column definitions (clean & declarative)
const columns: ColumnDef<User>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email", sortable: true },
]

// Actions (separated & reusable)
const renderActions = (user: User) => (
  <Button variant="ghost" onClick={() => handleEdit(user)}>
    <Edit className="h-4 w-4" />
  </Button>
)

// One component, all features included
<DataTable
  data={users}
  columns={columns}
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
  actions={renderActions}
/>
```

## Migration Steps

### Step 1: Create Column Definitions

Extract your table columns into a `ColumnDef` array:

```tsx
// OLD
<TableHead>Name</TableHead>
<TableHead>Email</TableHead>
<TableHead>Status</TableHead>

// NEW
const columns: ColumnDef<User>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email", sortable: true },
  { key: "status", header: "Status", sortable: false },
]
```

### Step 2: Convert Custom Cells

Move custom rendering logic to the `cell` property:

```tsx
// OLD
<TableCell>
  <Badge className={user.isActive ? "bg-green-100" : "bg-red-100"}>
    {user.isActive ? "Active" : "Inactive"}
  </Badge>
</TableCell>

// NEW
{
  key: "isActive",
  header: "Status",
  cell: (user) => (
    <Badge className={user.isActive ? "bg-green-100" : "bg-red-100"}>
      {user.isActive ? "Active" : "Inactive"}
    </Badge>
  ),
}
```

### Step 3: Extract Actions

Create a render function for your action buttons:

```tsx
// OLD
<TableCell>
  <Button onClick={() => handleEdit(user)}>
    <Edit className="h-4 w-4" />
  </Button>
  <Button onClick={() => handleDelete(user.id)}>
    <Trash2 className="h-4 w-4" />
  </Button>
</TableCell>

// NEW
const renderActions = (user: User) => (
  <div className="flex gap-2">
    <Button onClick={() => handleEdit(user)}>
      <Edit className="h-4 w-4" />
    </Button>
    <Button onClick={() => handleDelete(user.id)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
)
```

### Step 4: Replace Table Component

Remove all the old `<Table>` boilerplate and replace with `<DataTable>`:

```tsx
// OLD (~100 lines of code)
<Table>
  <TableHeader>...</TableHeader>
  <TableBody>...</TableBody>
</Table>
<div className="pagination">...</div>

// NEW (1 line)
<DataTable data={data} columns={columns} {...props} />
```

### Step 5: Keep Your Sort Handler (Optional)

You can reuse your existing sort handler or use the simple default:

```tsx
// Simple (recommended for most cases)
const handleSort = (column: string) => {
  if (sortBy === column) {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  } else {
    setSortBy(column)
    setSortOrder("desc")
  }
}

// Or keep your custom logic if needed
```

## Real Example: Transactions Table

Here's how the actual transactions table would be migrated:

### Before (~200 lines)
```tsx
// Multiple sort handlers, icon functions, etc.
const handleSort = (column: string) => { ... }
const getSortIcon = (column: string) => { ... }

// Large table with repeated patterns
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="p-0">
        <Button onClick={() => handleSort("transactionNumber")}>
          Transaction # {getSortIcon("transactionNumber")}
        </Button>
      </TableHead>
      {/* ... many more columns ... */}
    </TableRow>
  </TableHeader>
  <TableBody>
    {transactions.map((t) => (
      <TableRow key={t.id}>
        <TableCell className="font-mono text-xs">
          {t.transactionNumber}
        </TableCell>
        {/* ... many more cells ... */}
      </TableRow>
    ))}
  </TableBody>
</Table>
{/* Pagination boilerplate */}
```

### After (~80 lines)
```tsx
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
  // ... other columns
]

<DataTable
  data={transactions}
  columns={columns}
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
  actions={(t) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="sm" onClick={() => viewTransaction(t)}>
        <Eye className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => deleteTransaction(t.id)}>
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  )}
/>
```

## Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Lines of Code** | ~200 | ~80 |
| **Boilerplate** | High (repeated patterns) | Minimal (declarative) |
| **Maintainability** | Hard (scattered logic) | Easy (centralized) |
| **Consistency** | Variable (manual styling) | Guaranteed (component handles it) |
| **Type Safety** | Partial | Full (TypeScript generics) |
| **Reusability** | None (copy-paste) | High (import & configure) |

## Common Patterns

### Pattern 1: Formatted Dates
```tsx
{
  key: "createdAt",
  header: "Created",
  sortable: true,
  cell: (item) => formatDate(item.createdAt),
}
```

### Pattern 2: Status Badges
```tsx
{
  key: "status",
  header: "Status",
  cell: (item) => (
    <Badge variant={item.status === "active" ? "success" : "secondary"}>
      {item.status}
    </Badge>
  ),
}
```

### Pattern 3: Formatted Currency
```tsx
{
  key: "amount",
  header: "Amount",
  sortable: true,
  cell: (item) => formatPrice(item.amount, item.currency),
  className: "text-right",
}
```

### Pattern 4: Conditional Styling
```tsx
{
  key: "stock",
  header: "Stock",
  sortable: true,
  cell: (item) => (
    <span className={item.stock < 10 ? "text-red-600 font-bold" : ""}>
      {item.stock}
    </span>
  ),
}
```

## Next Steps

1. ✅ Review the [full documentation](./DATA_TABLE_README.md)
2. ✅ Check the [working example](./data-table-example.tsx)
3. ✅ Migrate one table as a test (start with simplest)
4. ✅ Gradually migrate other tables
5. ✅ Remove old boilerplate code
6. ✅ Enjoy cleaner, more maintainable code!

## Need Help?

- See complete examples in `data-table-example.tsx`
- Check the README for all available props
- Look at existing tables for patterns
