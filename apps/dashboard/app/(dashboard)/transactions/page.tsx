"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  Eye,
  Trash2,
  Filter,
  Check,
  ChevronsUpDown,
  X,
  Search,
} from "lucide-react"
import {
  transactionsApi,
  Transaction,
  TransactionType,
  ExpenseCategory,
  PaymentMethod,
  CreateSaleDto,
  CreateExpenseDto,
  FinancialSummary,
  TransactionItem,
} from "@/lib/transactions-api"
import { vendorsApi, Vendor } from "@/lib/vendors-api"
import { productsApi, Product, ProductBasic } from "@/lib/products-api"
import { formatPrice, formatDate, cn } from "@/lib/utils"
import { DataTable, ColumnDef } from "@/components/data-table"

export default function TransactionsPage() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<ProductBasic[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [searchNumber, setSearchNumber] = useState("")
  const [filterType, setFilterType] = useState<TransactionType | "ALL">("ALL")
  const [filterCountry, setFilterCountry] = useState<string>("ALL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sortBy, setSortBy] = useState<string>("transactionDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Dialog states
  const [showCreateSale, setShowCreateSale] = useState(false)
  const [showCreateExpense, setShowCreateExpense] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null)

  // Form states for creating sale
  const [saleData, setSaleData] = useState<Partial<CreateSaleDto>>({
    country: "RW",
    currency: "RWF",
    paymentMethod: PaymentMethod.CASH,
    items: [],
    subtotal: 0,
    vatAmount: 0,
    amount: 0,
  })
  const [vatPercentage, setVatPercentage] = useState<number>(0)
  const [selectedItems, setSelectedItems] = useState<
    Map<number, { product: ProductBasic; quantity: number }>
  >(new Map())
  const [isManualAmount, setIsManualAmount] = useState(false)

  // Form states for creating expense
  const [expenseData, setExpenseData] = useState<Partial<CreateExpenseDto>>({
    country: "RW",
    currency: "RWF",
    category: ExpenseCategory.OTHER,
  })

  const [newVendorName, setNewVendorName] = useState("")
  const [showNewVendorInput, setShowNewVendorInput] = useState(false)
  const [vendorComboboxOpen, setVendorComboboxOpen] = useState(false)
  const [productPopoverOpen, setProductPopoverOpen] = useState(false)

  // Form validation states
  const [saleValidationErrors, setSaleValidationErrors] = useState<Record<string, boolean>>({})
  const [expenseValidationErrors, setExpenseValidationErrors] = useState<Record<string, boolean>>(
    {},
  )

  useEffect(() => {
    fetchTransactions()
    fetchSummary()
  }, [currentPage, itemsPerPage, filterType, filterCountry, startDate, endDate, sortBy, sortOrder])

  useEffect(() => {
    fetchVendors()
    fetchProducts()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      }
      if (filterType !== "ALL") params.type = filterType
      if (filterCountry !== "ALL") params.country = filterCountry
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (sortBy) params.sortBy = sortBy
      if (sortOrder) params.sortOrder = sortOrder

      console.log("Fetching transactions with params:", params)
      const response = await transactionsApi.getTransactions(params)
      console.log("Transactions response:", response)
      console.log("Transactions count:", response.transactions?.length)
      setTransactions(response.transactions || [])
      setTotalPages(response.pagination?.totalPages || 1)
    } catch (error: any) {
      console.error("Failed to fetch transactions:", error)
      setTransactions([])
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch transactions. You may not have permission.",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const params: any = {}
      if (filterCountry !== "ALL") params.country = filterCountry
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate

      const response = await transactionsApi.getSummary(params)
      setSummary(response)
    } catch (error: any) {
      console.error("Failed to fetch summary:", error)
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await vendorsApi.getActiveVendors()
      setVendors(response.vendors)
      console.log("Loaded vendors:", response.vendors.length)
    } catch (error: any) {
      console.error("Failed to fetch vendors:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load vendors. You may not have permission.",
      })
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await productsApi.searchProducts({ isActive: true, limit: 500 })
      setProducts(response.products)
      console.log("Loaded products:", response.products.length)
    } catch (error: any) {
      console.error("Failed to fetch products:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load products",
      })
    }
  }

  const handleAddProduct = (product: ProductBasic) => {
    const newItems = new Map(selectedItems)
    newItems.set(product.id, { product, quantity: 1 })
    setSelectedItems(newItems)
    calculateTotals(newItems)
    setProductPopoverOpen(false)
  }

  const handleRemoveProduct = (productId: number) => {
    const newItems = new Map(selectedItems)
    newItems.delete(productId)
    setSelectedItems(newItems)
    calculateTotals(newItems)
  }

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity < 1) return
    const newItems = new Map(selectedItems)
    const item = newItems.get(productId)
    if (item) {
      newItems.set(productId, { ...item, quantity })
      setSelectedItems(newItems)
      calculateTotals(newItems)
    }
  }

  const calculateTotals = (items: Map<number, { product: ProductBasic; quantity: number }>) => {
    let subtotal = 0
    const transactionItems: TransactionItem[] = []

    items.forEach(({ product, quantity }) => {
      const itemSubtotal = product.price * quantity
      subtotal += itemSubtotal

      const vatAmount = (itemSubtotal * product.vatPercentage) / 100

      transactionItems.push({
        productId: product.id,
        productName: product.name,
        quantity,
        price: product.price,
        vatPercentage: product.vatPercentage,
        vatAmount,
      })
    })

    // Calculate weighted average VAT percentage
    const totalVatAmount = transactionItems.reduce((sum, item) => sum + item.vatAmount, 0)
    const avgVatPercentage = subtotal > 0 ? (totalVatAmount / subtotal) * 100 : 0
    const totalAmount = subtotal + totalVatAmount

    // Always update items and amounts (even in manual mode)
    // Manual mode just makes the fields editable, but we still calculate default values
    setSaleData({
      ...saleData,
      items: transactionItems,
      subtotal,
      vatAmount: totalVatAmount,
      amount: totalAmount,
    })
    setVatPercentage(avgVatPercentage)
  }

  const handleToggleManualAmount = (checked: boolean) => {
    setIsManualAmount(checked)
    // Note: Amounts are always calculated from products when they change
    // This toggle just controls whether the amount fields are editable or locked
  }

  const handleManualSubtotalChange = (value: number) => {
    const newSubtotal = value || 0
    const newVatAmount = (newSubtotal * vatPercentage) / 100
    const newTotal = newSubtotal + newVatAmount
    setSaleData({
      ...saleData,
      subtotal: newSubtotal,
      vatAmount: newVatAmount,
      amount: newTotal,
    })
  }

  const handleManualVatPercentageChange = (value: number) => {
    const newVatPercentage = value || 0
    setVatPercentage(newVatPercentage)
    const newVatAmount = (saleData.subtotal || 0) * (newVatPercentage / 100)
    const newTotal = (saleData.subtotal || 0) + newVatAmount
    setSaleData({
      ...saleData,
      vatAmount: newVatAmount,
      amount: newTotal,
    })
  }

  const handleSearchByNumber = async () => {
    if (!searchNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a transaction number",
      })
      return
    }

    try {
      const response = await transactionsApi.getTransactionByNumber(searchNumber)
      setTransactions([response.transaction])
      setCurrentPage(1)
      setTotalPages(1)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Transaction not found",
      })
    }
  }

  const handleCreateSale = async () => {
    try {
      // Validate required fields
      const errors: Record<string, boolean> = {
        items: !saleData.items || saleData.items.length === 0,
        subtotal: !saleData.subtotal || saleData.subtotal <= 0,
        amount: !saleData.amount || saleData.amount <= 0,
        country: !saleData.country,
        currency: !saleData.currency,
      }

      setSaleValidationErrors(errors)

      // Check if any errors
      if (Object.values(errors).some((error) => error)) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: errors.items
            ? "Please add at least one product to the sale"
            : "Please fill in all required fields correctly",
        })
        return
      }

      const response = await transactionsApi.createSale(saleData as CreateSaleDto)

      // Add the new transaction to the beginning of the list
      setTransactions([response.transaction, ...transactions])

      toast({
        title: "Success",
        description: "Sale transaction created successfully",
      })
      setShowCreateSale(false)
      setSaleData({
        country: "RW",
        currency: "RWF",
        paymentMethod: PaymentMethod.CASH,
        items: [],
        subtotal: 0,
        vatAmount: 0,
        amount: 0,
      })
      setVatPercentage(0)
      setSelectedItems(new Map())
      setIsManualAmount(false)
      setSaleValidationErrors({})

      // Update summary to reflect the new sale
      fetchSummary()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create sale",
      })
    }
  }

  const handleCreateExpense = async () => {
    try {
      // Validate required fields
      const errors: Record<string, boolean> = {
        category: !expenseData.category,
        description: !expenseData.description || expenseData.description.trim() === "",
        amount: !expenseData.amount || expenseData.amount <= 0,
        currency: !expenseData.currency,
        country: !expenseData.country,
      }

      setExpenseValidationErrors(errors)

      // Check if any errors
      if (Object.values(errors).some((error) => error)) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please fill in all required fields correctly",
        })
        return
      }

      // If creating new vendor
      if (showNewVendorInput && newVendorName.trim()) {
        const newVendor = await vendorsApi.createVendor({
          name: newVendorName,
          isActive: true,
        })
        expenseData.vendor = newVendor.vendor.name
        await fetchVendors()
      }

      const response = await transactionsApi.createExpense(expenseData as CreateExpenseDto)

      // Add the new transaction to the beginning of the list
      setTransactions([response.transaction, ...transactions])

      toast({
        title: "Success",
        description: "Expense transaction created successfully",
      })
      setShowCreateExpense(false)
      setExpenseData({
        country: "RW",
        currency: "RWF",
        category: ExpenseCategory.OTHER,
      })
      setNewVendorName("")
      setShowNewVendorInput(false)
      setExpenseValidationErrors({})

      // Update summary to reflect the new expense
      fetchSummary()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create expense",
      })
    }
  }

  const handleDelete = async () => {
    if (!transactionToDelete) return

    try {
      await transactionsApi.deleteTransaction(transactionToDelete)

      // Remove the deleted transaction from the list
      setTransactions(transactions.filter((t) => t.id !== transactionToDelete))

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      })
      setShowDeleteConfirm(false)
      setTransactionToDelete(null)

      // Update summary to reflect the deletion
      fetchSummary()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete transaction",
      })
    }
  }

  const clearFilters = () => {
    setFilterType("ALL")
    setFilterCountry("ALL")
    setStartDate("")
    setEndDate("")
    setSearchNumber("")
    setSortBy("transactionDate")
    setSortOrder("desc")
    setCurrentPage(1)
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Set new column and default to descending
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const getTransactionTypeBadge = (type: TransactionType) => {
    return type === TransactionType.SALE ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Sale</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Expense</Badge>
    )
  }

  // Column definitions for DataTable
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
      cell: (transaction) => getTransactionTypeBadge(transaction.type),
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
      cell: (transaction) =>
        transaction.type === TransactionType.SALE
          ? transaction.customerName || "Walk-in Customer"
          : transaction.description,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      cell: (transaction) => (
        <span
          className={
            transaction.type === TransactionType.SALE
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
      cell: (transaction) => transaction.country,
    },
  ]

  // Actions for each row
  const renderActions = (transaction: Transaction) => (
    <div className="flex gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectedTransaction(transaction)
          setShowDetails(true)
        }}
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setTransactionToDelete(transaction.id)
          setShowDeleteConfirm(true)
        }}
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Manage sales and expense transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateSale(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
          <Button onClick={() => setShowCreateExpense(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(summary.totalSales, summary.currency)}
              </div>
              <p className="text-xs text-muted-foreground">{summary.salesCount} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatPrice(summary.totalExpenses, summary.currency)}
              </div>
              <p className="text-xs text-muted-foreground">{summary.expensesCount} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${summary.netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}
              >
                {formatPrice(summary.netProfit, summary.currency)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.salesCount + summary.expensesCount} total transactions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
              <Receipt className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {summary.totalSales > 0
                  ? `${((summary.netProfit / summary.totalSales) * 100).toFixed(1)}%`
                  : "0%"}
              </div>
              <p className="text-xs text-muted-foreground">Based on total sales</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="search-number">Transaction Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="search-number"
                    placeholder="SALE-RW2025..."
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchByNumber()}
                  />
                  <Button size="icon" onClick={handleSearchByNumber}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={filterType}
                  onValueChange={(value) => setFilterType(value as TransactionType | "ALL")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value={TransactionType.SALE}>Sales</SelectItem>
                    <SelectItem value={TransactionType.EXPENSE}>Expenses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={filterCountry} onValueChange={setFilterCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Countries</SelectItem>
                    <SelectItem value="RWANDA">Rwanda</SelectItem>
                    <SelectItem value="UGANDA">Uganda</SelectItem>
                    <SelectItem value="KENYA">Kenya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Showing {transactions.length} transactions (Page {currentPage} of {totalPages})
          </CardDescription>
        </CardHeader>
        <CardContent>
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
            loadingMessage="Loading transactions..."
            actions={renderActions}
          />
        </CardContent>
      </Card>

      {/* Create Sale Dialog */}
      <Dialog open={showCreateSale} onOpenChange={setShowCreateSale}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Sale Transaction</DialogTitle>
            <DialogDescription>Record a new sale transaction</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Product Selection Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className={cn(saleValidationErrors.items && "text-destructive")}>
                  Select Products *
                </Label>
                <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="end">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                      <span className="text-sm font-medium">Select Product</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setProductPopoverOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Command shouldFilter={true}>
                      <CommandInput placeholder="Search products by name, category or type..." />
                      <CommandList>
                        <CommandEmpty>
                          {products.length === 0 ? "Loading products..." : "No product found."}
                        </CommandEmpty>
                        <CommandGroup>
                          {products
                            .filter((p) => !selectedItems.has(p.id))
                            .map((product) => {
                              const searchValue = [product.name, product.category, product.type]
                                .filter(Boolean)
                                .join(" ")

                              return (
                                <CommandItem
                                  key={product.id}
                                  value={searchValue}
                                  keywords={
                                    [product.name, product.category, product.type].filter(
                                      Boolean,
                                    ) as string[]
                                  }
                                  onSelect={() => handleAddProduct(product)}
                                >
                                  <div className="flex justify-between items-center w-full gap-4">
                                    <div className="flex flex-col min-w-0">
                                      <span className="font-medium">{product.name}</span>
                                      <div className="flex gap-2 text-xs text-muted-foreground">
                                        <span>{product.category}</span>
                                        <span>•</span>
                                        <span>{product.type}</span>
                                      </div>
                                    </div>
                                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                                      {formatPrice(product.price, product.currency)}
                                    </span>
                                  </div>
                                </CommandItem>
                              )
                            })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selected Products List */}
              {selectedItems.size > 0 && (
                <div className="border rounded-lg p-4 space-y-3">
                  {Array.from(selectedItems.values()).map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-4 pb-3 border-b last:border-0 last:pb-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(product.price, product.currency)} × {quantity} ={" "}
                          {formatPrice(product.price * quantity, product.currency)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(product.id, quantity - 1)}
                            disabled={quantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) =>
                              handleQuantityChange(product.id, parseInt(e.target.value) || 1)
                            }
                            className="w-16 text-center"
                            min="1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(product.id, quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {saleValidationErrors.items && (
                <p className="text-xs text-destructive">At least one product is required</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sale-customer-name">Customer Name (Optional)</Label>
                <Input
                  id="sale-customer-name"
                  value={saleData.customerName || ""}
                  onChange={(e) => setSaleData({ ...saleData, customerName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-customer-email">Customer Email (Optional)</Label>
                <Input
                  id="sale-customer-email"
                  type="email"
                  value={saleData.customerEmail || ""}
                  onChange={(e) => setSaleData({ ...saleData, customerEmail: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sale-country">Country *</Label>
                <Select
                  value={saleData.country}
                  onValueChange={(value) => setSaleData({ ...saleData, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RW">Rwanda</SelectItem>
                    <SelectItem value="UG">Uganda</SelectItem>
                    <SelectItem value="KE">Kenya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-currency">Currency *</Label>
                <Select
                  value={saleData.currency}
                  onValueChange={(value) => setSaleData({ ...saleData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RWF">RWF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="UGX">UGX</SelectItem>
                    <SelectItem value="KES">KES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="manual-amount-mode"
                    checked={isManualAmount}
                    onCheckedChange={handleToggleManualAmount}
                  />
                  <Label htmlFor="manual-amount-mode" className="cursor-pointer">
                    Override Calculated Amounts
                  </Label>
                </div>
                <span className="text-xs text-muted-foreground">
                  {isManualAmount
                    ? "You can edit the calculated amounts"
                    : "Amounts auto-update when products change"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sale-subtotal">
                    Subtotal
                    {!isManualAmount && (
                      <span className="text-xs text-muted-foreground font-normal ml-2">
                        (Auto-calculated)
                      </span>
                    )}
                  </Label>
                  {isManualAmount ? (
                    <Input
                      id="sale-subtotal"
                      type="number"
                      step="0.01"
                      value={saleData.subtotal || ""}
                      onChange={(e) => handleManualSubtotalChange(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  ) : (
                    <Input
                      id="sale-subtotal"
                      type="text"
                      value={formatPrice(saleData.subtotal || 0, saleData.currency || "RWF")}
                      readOnly
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-vat-percentage">
                    VAT %
                    {!isManualAmount && (
                      <span className="text-xs text-muted-foreground font-normal ml-2">
                        (Auto-calculated)
                      </span>
                    )}
                  </Label>
                  {isManualAmount ? (
                    <Input
                      id="sale-vat-percentage"
                      type="number"
                      step="0.01"
                      value={vatPercentage || ""}
                      onChange={(e) =>
                        handleManualVatPercentageChange(parseFloat(e.target.value) || 0)
                      }
                      placeholder="0.00"
                    />
                  ) : (
                    <Input
                      id="sale-vat-percentage"
                      type="text"
                      value={`${vatPercentage.toFixed(2)}%`}
                      readOnly
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale-vat-amount">
                    VAT Amount
                    <span className="text-xs text-muted-foreground font-normal ml-2">
                      (Auto-calculated)
                    </span>
                  </Label>
                  <Input
                    id="sale-vat-amount"
                    type="text"
                    value={formatPrice(saleData.vatAmount || 0, saleData.currency || "RWF")}
                    readOnly
                    className="bg-muted/50 cursor-not-allowed"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-amount" className="flex items-center gap-2">
                  Total Amount
                  <span className="text-xs text-muted-foreground font-normal">
                    (Auto-calculated)
                  </span>
                </Label>
                <Input
                  id="sale-amount"
                  type="text"
                  value={formatPrice(saleData.amount || 0, saleData.currency || "RWF")}
                  readOnly
                  className="bg-muted/50 cursor-not-allowed font-semibold text-lg"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Values are automatically calculated from selected products and their VAT rates
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sale-payment-method">Payment Method *</Label>
                <Select
                  value={saleData.paymentMethod}
                  onValueChange={(value) =>
                    setSaleData({ ...saleData, paymentMethod: value as PaymentMethod })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                    <SelectItem value={PaymentMethod.CREDIT_CARD}>Credit Card</SelectItem>
                    <SelectItem value={PaymentMethod.DEBIT_CARD}>Debit Card</SelectItem>
                    <SelectItem value={PaymentMethod.MOBILE_MONEY}>Mobile Money</SelectItem>
                    <SelectItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</SelectItem>
                    <SelectItem value={PaymentMethod.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale-reference">Payment Reference (Optional)</Label>
                <Input
                  id="sale-reference"
                  value={saleData.paymentReference || ""}
                  onChange={(e) => setSaleData({ ...saleData, paymentReference: e.target.value })}
                  placeholder="TXN123456"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale-notes">Notes (Optional)</Label>
              <Textarea
                id="sale-notes"
                value={saleData.notes || ""}
                onChange={(e) => setSaleData({ ...saleData, notes: e.target.value })}
                placeholder="Additional notes about this sale..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSale(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSale}>Create Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Expense Dialog */}
      <Dialog open={showCreateExpense} onOpenChange={setShowCreateExpense}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Expense Transaction</DialogTitle>
            <DialogDescription>Record a new expense transaction</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-category">Category *</Label>
                <Select
                  value={expenseData.category}
                  onValueChange={(value) =>
                    setExpenseData({ ...expenseData, category: value as ExpenseCategory })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ExpenseCategory.INVENTORY}>Inventory</SelectItem>
                    <SelectItem value={ExpenseCategory.SHIPPING}>Shipping</SelectItem>
                    <SelectItem value={ExpenseCategory.MARKETING}>Marketing</SelectItem>
                    <SelectItem value={ExpenseCategory.SALARIES}>Salaries</SelectItem>
                    <SelectItem value={ExpenseCategory.RENT}>Rent</SelectItem>
                    <SelectItem value={ExpenseCategory.UTILITIES}>Utilities</SelectItem>
                    <SelectItem value={ExpenseCategory.EQUIPMENT}>Equipment</SelectItem>
                    <SelectItem value={ExpenseCategory.MAINTENANCE}>Maintenance</SelectItem>
                    <SelectItem value={ExpenseCategory.SUPPLIES}>Supplies</SelectItem>
                    <SelectItem value={ExpenseCategory.INSURANCE}>Insurance</SelectItem>
                    <SelectItem value={ExpenseCategory.TAXES}>Taxes</SelectItem>
                    <SelectItem value={ExpenseCategory.OTHER}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendor (Optional)</Label>
                {!showNewVendorInput ? (
                  <div className="flex gap-2">
                    <Popover open={vendorComboboxOpen} onOpenChange={setVendorComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={vendorComboboxOpen}
                          className="w-full justify-between font-normal"
                        >
                          {expenseData.vendor || "Select vendor..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command shouldFilter={true}>
                          <CommandInput placeholder="Search vendors..." />
                          <CommandList>
                            <CommandEmpty>
                              {vendors.length === 0 ? "Loading vendors..." : "No vendor found."}
                            </CommandEmpty>
                            <CommandGroup>
                              {vendors.map((vendor) => (
                                <CommandItem
                                  key={vendor.id}
                                  value={vendor.name}
                                  keywords={[vendor.name]}
                                  onSelect={(currentValue) => {
                                    setExpenseData({
                                      ...expenseData,
                                      vendor:
                                        currentValue === expenseData.vendor ? "" : currentValue,
                                    })
                                    setVendorComboboxOpen(false)
                                  }}
                                >
                                  <Check
                                    className={
                                      expenseData.vendor === vendor.name
                                        ? "mr-2 h-4 w-4 opacity-100"
                                        : "mr-2 h-4 w-4 opacity-0"
                                    }
                                  />
                                  {vendor.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewVendorInput(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="New vendor name"
                      value={newVendorName}
                      onChange={(e) => setNewVendorName(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewVendorInput(false)
                        setNewVendorName("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="expense-description"
                className={cn(expenseValidationErrors.description && "text-destructive")}
              >
                Description *
              </Label>
              <Input
                id="expense-description"
                value={expenseData.description || ""}
                onChange={(e) => {
                  setExpenseData({ ...expenseData, description: e.target.value })
                  // Clear error when user types
                  if (expenseValidationErrors.description) {
                    setExpenseValidationErrors({ ...expenseValidationErrors, description: false })
                  }
                }}
                className={cn(
                  expenseValidationErrors.description &&
                    "border-destructive focus-visible:ring-destructive",
                )}
                placeholder="Brief description of the expense"
              />
              {expenseValidationErrors.description && (
                <p className="text-xs text-destructive">Description is required</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="expense-amount"
                  className={cn(expenseValidationErrors.amount && "text-destructive")}
                >
                  Amount *
                </Label>
                <Input
                  id="expense-amount"
                  type="number"
                  step="0.01"
                  value={expenseData.amount || ""}
                  onChange={(e) => {
                    setExpenseData({ ...expenseData, amount: parseFloat(e.target.value) })
                    // Clear error when user types
                    if (expenseValidationErrors.amount) {
                      setExpenseValidationErrors({ ...expenseValidationErrors, amount: false })
                    }
                  }}
                  className={cn(
                    expenseValidationErrors.amount &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                  placeholder="0.00"
                />
                {expenseValidationErrors.amount && (
                  <p className="text-xs text-destructive">
                    Amount is required and must be greater than 0
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-currency">Currency *</Label>
                <Select
                  value={expenseData.currency}
                  onValueChange={(value) => setExpenseData({ ...expenseData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RWF">RWF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="UGX">UGX</SelectItem>
                    <SelectItem value="KES">KES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-country">Country *</Label>
                <Select
                  value={expenseData.country}
                  onValueChange={(value) => setExpenseData({ ...expenseData, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RW">Rwanda</SelectItem>
                    <SelectItem value="UG">Uganda</SelectItem>
                    <SelectItem value="KE">Kenya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-invoice">Invoice Number (Optional)</Label>
                <Input
                  id="expense-invoice"
                  value={expenseData.invoiceNumber || ""}
                  onChange={(e) =>
                    setExpenseData({ ...expenseData, invoiceNumber: e.target.value })
                  }
                  placeholder="INV-12345"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-notes">Notes (Optional)</Label>
              <Textarea
                id="expense-notes"
                value={expenseData.notes || ""}
                onChange={(e) => setExpenseData({ ...expenseData, notes: e.target.value })}
                placeholder="Additional notes about this expense..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateExpense(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateExpense}>Create Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Transaction Number</Label>
                  <p className="font-mono text-sm">{selectedTransaction.transactionNumber}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Type</Label>
                  <p>{getTransactionTypeBadge(selectedTransaction.type)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Amount</Label>
                  <p className="text-lg font-semibold">
                    {formatPrice(selectedTransaction.amount, selectedTransaction.currency)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Date</Label>
                  <p>{formatDate(selectedTransaction.transactionDate)}</p>
                </div>
              </div>
              {selectedTransaction.type === TransactionType.SALE ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Customer</Label>
                      <p>{selectedTransaction.customerName || "Walk-in Customer"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Payment Method</Label>
                      <p>{selectedTransaction.paymentMethod}</p>
                    </div>
                  </div>
                  {selectedTransaction.paymentReference && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Payment Reference</Label>
                      <p className="font-mono text-sm">{selectedTransaction.paymentReference}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Category</Label>
                      <p>{selectedTransaction.category}</p>
                    </div>
                    {selectedTransaction.vendor && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Vendor</Label>
                        <p>{selectedTransaction.vendor}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Description</Label>
                    <p>{selectedTransaction.description}</p>
                  </div>
                </>
              )}
              {selectedTransaction.notes && (
                <div>
                  <Label className="text-sm text-muted-foreground">Notes</Label>
                  <p>{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetails(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
