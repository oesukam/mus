"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Star,
  Plus,
  Package,
  DollarSign,
  Loader2,
  RefreshCw,
  Search,
  StarOff,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { productsApi, type Product } from "@/lib/products-api"
import { useToast } from "@/hooks/use-toast"

export default function FeaturedPage() {
  const { toast } = useToast()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 25,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  useEffect(() => {
    if (isAddDialogOpen) {
      fetchAvailableProducts()
    }
  }, [isAddDialogOpen, currentPage, itemsPerPage, searchQuery])

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true)
      const response = await productsApi.getProducts({
        featured: true,
        limit: 100,
      })
      setFeaturedProducts(response.products || [])
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to fetch featured products",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableProducts = async () => {
    try {
      const response = await productsApi.getProducts({
        page: currentPage,
        limit: itemsPerPage,
        featured: false,
        q: searchQuery || undefined,
      })
      setAvailableProducts(response.products || [])
      setPagination(response.pagination)
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to fetch available products",
        variant: "destructive",
      })
    }
  }

  const handleToggleFeatured = async (product: Product, isFeatured: boolean) => {
    try {
      setIsActionLoading(true)
      await productsApi.toggleFeatured(product.id, isFeatured)
      toast({
        title: "Success",
        description: `${product.name} ${isFeatured ? "added to" : "removed from"} featured products`,
      })
      await fetchFeaturedProducts()
      if (isAddDialogOpen) {
        await fetchAvailableProducts()
      }
      if (isFeatured) {
        setIsAddDialogOpen(false)
        setSearchQuery("")
        setCurrentPage(1)
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update featured status",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleBatchRemove = async () => {
    if (selectedProducts.length === 0) return

    try {
      setIsActionLoading(true)

      // Remove all selected products
      await Promise.all(
        selectedProducts.map((productId) => productsApi.toggleFeatured(productId, false)),
      )

      toast({
        title: "Success",
        description: `Removed ${selectedProducts.length} product${selectedProducts.length > 1 ? "s" : ""} from featured`,
      })

      setSelectedProducts([])
      await fetchFeaturedProducts()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to remove products",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(featuredProducts.map((p) => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: number, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId])
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId))
    }
  }

  const totalValue = featuredProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0)
  const allSelected =
    featuredProducts.length > 0 && selectedProducts.length === featuredProducts.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Featured Products</h1>
          <p className="text-muted-foreground">
            {selectedProducts.length > 0
              ? `${selectedProducts.length} product${selectedProducts.length > 1 ? "s" : ""} selected`
              : "Manage products displayed on homepage"}
          </p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchRemove}
              disabled={isActionLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Selected ({selectedProducts.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFeaturedProducts()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Featured
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Products</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featuredProducts.length}</div>
            <p className="text-xs text-muted-foreground">Currently featured</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total || 0}</div>
            <p className="text-xs text-muted-foreground">Can be featured</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(totalValue).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Featured products value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Featured Products List</CardTitle>
          <CardDescription>Manage products displayed on the homepage</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        disabled={isActionLoading || featuredProducts.length === 0}
                      />
                    </TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featuredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No featured products. Add some to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    featuredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) =>
                              handleSelectProduct(product.id, checked as boolean)
                            }
                            disabled={isActionLoading}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.slug}</div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.type}</TableCell>
                        <TableCell>
                          {product.currency} {Number(product.price).toFixed(2)}
                          {product.discountPercentage > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              -{product.discountPercentage}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={product.stockQuantity > 0 ? "default" : "destructive"}>
                            {product.stockQuantity} units
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFeatured(product, false)}
                            disabled={isActionLoading}
                          >
                            <StarOff className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Featured Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Featured Product</DialogTitle>
            <DialogDescription>
              Select products to feature on the homepage. Click the star icon to add a product.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No products found
                      </TableCell>
                    </TableRow>
                  ) : (
                    availableProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.slug}</div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          {product.currency} {Number(product.price).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => handleToggleFeatured(product, true)}
                            disabled={isActionLoading}
                          >
                            <Star className="h-4 w-4 mr-2" />
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">Show</p>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">per page</p>
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={!pagination.hasPreviousPage}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                setSearchQuery("")
                setCurrentPage(1)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
