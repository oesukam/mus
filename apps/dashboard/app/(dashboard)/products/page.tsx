"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Package,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  DollarSign,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { productsApi, Product, CreateProductDto, UpdateProductDto } from "@/lib/products-api"
import { filesApi } from "@/lib/files-api"
import { useToast } from "@/hooks/use-toast"
import { formatPrice } from "@/lib/utils"
import {
  ProductCategory,
  ProductType,
  CATEGORY_TYPE_MAP,
  getTypesForCategory,
  Country,
  COUNTRY_NAMES
} from "@mus/types"
import { DataTable, ColumnDef, FilterDef } from "@/components/data-table"

export default function ProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState({
    category: "all",
    type: "all",
    country: "all",
    status: "all",
  })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Sorting state
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  // Image upload state
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null)
  const [coverImageTitle, setCoverImageTitle] = useState<string>("")
  const [coverImageDescription, setCoverImageDescription] = useState<string>("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editCoverImagePreview, setEditCoverImagePreview] = useState<string | null>(null)
  const [editSelectedCoverImage, setEditSelectedCoverImage] = useState<File | null>(null)
  const [editCoverImageTitle, setEditCoverImageTitle] = useState<string>("")
  const [editCoverImageDescription, setEditCoverImageDescription] = useState<string>("")

  // Multiple images state
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [imageMetadata, setImageMetadata] = useState<Array<{ title: string; description: string }>>([])
  const [editSelectedImages, setEditSelectedImages] = useState<File[]>([])
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([])
  const [editImageMetadata, setEditImageMetadata] = useState<Array<{ title: string; description: string }>>([])
  const [existingImages, setExistingImages] = useState<Array<{ id: number; url: string }>>([])

  const [newProduct, setNewProduct] = useState<CreateProductDto>({
    name: "",
    description: "",
    price: 0,
    vatPercentage: 0,
    shippingRatePerKm: 0,
    weightInKg: 0,
    currency: "USD",
    country: "UNITED_STATES",
    stock: 0,
    stockStatus: "IN_STOCK",
    category: "ELECTRONICS",
    type: "PHYSICAL",
    brand: "",
    sku: "",
    tags: [],
    isFeatured: false,
    isActive: true,
  })

  // Fetch products
  useEffect(() => {
    fetchProducts()
  }, [currentPage, filterValues.status, itemsPerPage, sortBy, sortOrder])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Set new column and default to descending
      setSortBy(column)
      setSortOrder("desc")
    }
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const handlePageSizeChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const isActive = filterValues.status === "all" ? undefined : filterValues.status === "active"
      const response = await productsApi.getProducts({
        page: currentPage,
        limit: itemsPerPage,
        isActive,
        sortBy,
        sortOrder,
      })
      setProducts(response.products)
      setTotalPages(response.pagination.totalPages)
      setTotalProducts(response.pagination.total)
    } catch (error) {
      console.error("Failed to fetch products:", error)
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchProducts()
      return
    }

    try {
      setLoading(true)
      const isActive = statusFilter === "all" ? undefined : statusFilter === "active"
      const response = await productsApi.searchProducts({
        query: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        isActive,
      })
      setProducts(response.products)
      setTotalPages(response.pagination.totalPages)
      setTotalProducts(response.pagination.total)
    } catch (error) {
      console.error("Search failed:", error)
      toast({
        title: "Error",
        description: "Search failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get available types based on selected category
  const availableTypes = useMemo(() => {
    if (filterValues.category === "all") {
      // Return all types from all categories
      return Object.values(ProductType)
    }
    return getTypesForCategory(filterValues.category as ProductCategory)
  }, [filterValues.category])

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => {
      const newValues = { ...prev, [key]: value }

      // If category changed and the current type filter is not valid for the new category, reset type
      if (key === "category" && value !== "all") {
        const validTypes = getTypesForCategory(value as ProductCategory)
        if (prev.type !== "all" && !validTypes.includes(prev.type as ProductType)) {
          newValues.type = "all"
        }
      }

      return newValues
    })
  }

  // Get available types for new product based on its category
  const availableNewTypes = useMemo(() => {
    if (!newProduct.category) {
      return Object.values(ProductType)
    }
    return getTypesForCategory(newProduct.category as ProductCategory)
  }, [newProduct.category])

  // Get available types for editing product based on its category
  const availableEditTypes = useMemo(() => {
    if (!editingProduct || !editingProduct.category) {
      return Object.values(ProductType)
    }
    return getTypesForCategory(editingProduct.category as ProductCategory)
  }, [editingProduct?.category])

  // Handle category change in add dialog
  const handleNewCategoryChange = (value: string) => {
    const validTypes = getTypesForCategory(value as ProductCategory)
    const updatedProduct = { ...newProduct, category: value }

    // Reset type if it's not valid for the new category
    if (!validTypes.includes(newProduct.type as ProductType)) {
      updatedProduct.type = validTypes[0] || ProductType.LAPTOP
    }

    setNewProduct(updatedProduct)
  }

  // Handle category change in edit dialog
  const handleEditCategoryChange = (value: string) => {
    if (!editingProduct) return

    const validTypes = getTypesForCategory(value as ProductCategory)
    const updatedProduct = { ...editingProduct, category: value }

    // Reset type if it's not valid for the new category
    if (!validTypes.includes(editingProduct.type as ProductType)) {
      updatedProduct.type = validTypes[0] || ProductType.LAPTOP
    }

    setEditingProduct(updatedProduct)
  }

  // Filter products locally (for category, type, country)
  const filteredProducts = products.filter((product) => {
    const matchesCategory = filterValues.category === "all" || product.category === filterValues.category
    const matchesType = filterValues.type === "all" || product.type === filterValues.type
    const matchesCountry = filterValues.country === "all" || product.country === filterValues.country
    return matchesCategory && matchesType && matchesCountry
  })

  // Column definitions for DataTable
  const columns: ColumnDef<Product>[] = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      cell: (product) => <span className="font-medium">{product.name}</span>,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      cell: (product) => product.category.replace(/_/g, ' '),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      cell: (product) => <Badge variant="outline">{product.type}</Badge>,
    },
    {
      key: "country",
      header: "Country",
      sortable: true,
      cell: (product) => product.country.replace(/_/g, ' '),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      cell: (product) => formatPrice(product.price, product.currency),
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      cell: (product) => (
        <span className={product.stockQuantity < 20 ? "text-destructive font-medium" : ""}>
          {product.stockQuantity}
        </span>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      cell: (product) => (
        <Badge variant={product.isActive ? "default" : "secondary"}>
          {product.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ]

  // Filter definitions for DataTable
  const filters: FilterDef[] = [
    {
      key: "category",
      label: "Category",
      placeholder: "All Categories",
      options: [
        { value: "all", label: "All Categories" },
        ...Object.values(ProductCategory).map((category) => ({
          value: category,
          label: category,
        })),
      ],
    },
    {
      key: "type",
      label: "Type",
      placeholder: "All Types",
      options: [
        { value: "all", label: "All Types" },
        ...availableTypes.map((type) => ({
          value: type,
          label: type,
        })),
      ],
    },
    {
      key: "country",
      label: "Country",
      placeholder: "All Countries",
      options: [
        { value: "all", label: "All Countries" },
        ...Object.entries(COUNTRY_NAMES).map(([code, name]) => ({
          value: code,
          label: name,
        })),
      ],
    },
    {
      key: "status",
      label: "Status",
      placeholder: "All Status",
      options: [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ]

  // Actions for each row
  const renderActions = (product: Product) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setEditingProduct(product)
            // Set existing image preview if product has cover image
            if (product.coverImage?.url) {
              setEditCoverImagePreview(product.coverImage.url)
            } else {
              setEditCoverImagePreview(null)
            }
            setEditSelectedCoverImage(null)

            // Load existing gallery images if available
            if (product.images && Array.isArray(product.images)) {
              // Assuming images is an array of URLs or objects with id and url
              const imageObjects = product.images.map((img: any, idx: number) => ({
                id: typeof img === 'string' ? idx : img.id,
                url: typeof img === 'string' ? img : img.url
              }))
              setExistingImages(imageObjects)
            } else {
              setExistingImages([])
            }

            setIsEditDialogOpen(true)
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleDeleteProduct(product.id)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Handle cover image selection for new product
  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedCoverImage(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle cover image selection for edit product
  const handleEditCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEditSelectedCoverImage(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditCoverImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle multiple images selection for new product
  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      // Limit to 10 images total
      const limitedFiles = files.slice(0, 10)
      setSelectedImages(limitedFiles)

      // Create preview URLs
      const previews = limitedFiles.map(file => {
        return URL.createObjectURL(file)
      })
      setImagePreviews(previews)

      // Initialize metadata for each image
      const metadata = limitedFiles.map(() => ({ title: "", description: "" }))
      setImageMetadata(metadata)
    }
  }

  // Handle multiple images selection for edit product
  const handleEditImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      // Limit to 10 images total (including existing)
      const remaining = 10 - existingImages.length
      const limitedFiles = files.slice(0, remaining)
      setEditSelectedImages(limitedFiles)

      // Create preview URLs
      const previews = limitedFiles.map(file => {
        return URL.createObjectURL(file)
      })
      setEditImagePreviews(previews)

      // Initialize metadata for each image
      const metadata = limitedFiles.map(() => ({ title: "", description: "" }))
      setEditImageMetadata(metadata)
    }
  }

  // Remove image from selection (for new product)
  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    const newMetadata = imageMetadata.filter((_, i) => i !== index)
    setSelectedImages(newImages)
    setImagePreviews(newPreviews)
    setImageMetadata(newMetadata)
  }

  // Remove image from selection (for edit product)
  const removeEditImage = (index: number) => {
    const newImages = editSelectedImages.filter((_, i) => i !== index)
    const newPreviews = editImagePreviews.filter((_, i) => i !== index)
    const newMetadata = editImageMetadata.filter((_, i) => i !== index)
    setEditSelectedImages(newImages)
    setEditImagePreviews(newPreviews)
    setEditImageMetadata(newMetadata)
  }

  // Upload image to server and return file ID
  const uploadCoverImage = async (
    file: File,
    title?: string,
    description?: string
  ): Promise<number | undefined> => {
    try {
      setUploadingImage(true)
      const response = await filesApi.uploadFile(file, "products/covers", title, description)
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      })
      return response.id
    } catch (error) {
      console.error("Failed to upload image:", error)
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
      return undefined
    } finally {
      setUploadingImage(false)
    }
  }

  // Upload multiple images and return their IDs
  const uploadMultipleImages = async (
    files: File[],
    metadata: Array<{ title: string; description: string }>
  ): Promise<number[]> => {
    try {
      setUploadingImage(true)
      const uploadPromises = files.map((file, index) => {
        const meta = metadata[index] || { title: "", description: "" }
        return filesApi.uploadFile(
          file,
          "products/images",
          meta.title || undefined,
          meta.description || undefined
        )
      })
      const responses = await Promise.all(uploadPromises)
      toast({
        title: "Success",
        description: `${files.length} images uploaded successfully`,
      })
      return responses.map(r => r.id)
    } catch (error) {
      console.error("Failed to upload images:", error)
      toast({
        title: "Error",
        description: "Failed to upload some images. Please try again.",
        variant: "destructive",
      })
      return []
    } finally {
      setUploadingImage(false)
    }
  }

  const handleAddProduct = async () => {
    try {
      setIsSubmitting(true)

      // Upload cover image first if selected
      let coverImageId: number | undefined
      if (selectedCoverImage) {
        coverImageId = await uploadCoverImage(
          selectedCoverImage,
          coverImageTitle || undefined,
          coverImageDescription || undefined
        )
        if (!coverImageId) {
          toast({
            title: "Error",
            description: "Failed to upload cover image. Product creation aborted.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Upload multiple images if selected
      let imageIds: number[] = []
      if (selectedImages.length > 0) {
        imageIds = await uploadMultipleImages(selectedImages, imageMetadata)
        if (imageIds.length !== selectedImages.length) {
          toast({
            title: "Warning",
            description: "Some images failed to upload. Continuing with product creation.",
            variant: "destructive",
          })
        }
      }

      // Create product with coverImageId
      const productData = { ...newProduct }
      if (coverImageId) {
        productData.coverImageId = coverImageId
      }

      const response = await productsApi.createProduct(productData)

      // Add images to the product if any were uploaded
      if (imageIds.length > 0 && response.product.id) {
        await productsApi.addProductImages(response.product.id, imageIds)
      }

      toast({
        title: "Success",
        description: "Product created successfully",
      })
      setIsAddDialogOpen(false)
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        vatPercentage: 0,
        shippingRatePerKm: 0,
        weightInKg: 0,
        currency: "USD",
        country: "UNITED_STATES",
        stock: 0,
        stockStatus: "IN_STOCK",
        category: "ELECTRONICS",
        type: "PHYSICAL",
        brand: "",
        sku: "",
        tags: [],
        isFeatured: false,
        isActive: true,
      })
      setSelectedCoverImage(null)
      setCoverImagePreview(null)
      setCoverImageTitle("")
      setCoverImageDescription("")
      setSelectedImages([])
      setImagePreviews([])
      setImageMetadata([])
      fetchProducts()
    } catch (error: any) {
      console.error("Failed to create product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct) return

    try {
      setIsSubmitting(true)

      // Upload new cover image if selected
      let coverImageId: number | undefined
      if (editSelectedCoverImage) {
        coverImageId = await uploadCoverImage(
          editSelectedCoverImage,
          editCoverImageTitle || undefined,
          editCoverImageDescription || undefined
        )
        if (!coverImageId) {
          toast({
            title: "Error",
            description: "Failed to upload cover image. Product update aborted.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      }

      // Upload new images if selected
      let newImageIds: number[] = []
      if (editSelectedImages.length > 0) {
        newImageIds = await uploadMultipleImages(editSelectedImages, editImageMetadata)
        if (newImageIds.length !== editSelectedImages.length) {
          toast({
            title: "Warning",
            description: "Some images failed to upload. Continuing with product update.",
            variant: "destructive",
          })
        }
      }

      const updateData: UpdateProductDto = {
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        vatPercentage: editingProduct.vatPercentage,
        shippingRatePerKm: editingProduct.shippingRatePerKm,
        weightInKg: editingProduct.weightInKg,
        currency: editingProduct.currency,
        country: editingProduct.country,
        stock: editingProduct.stockQuantity,
        category: editingProduct.category,
        type: editingProduct.type,
        isActive: editingProduct.isActive,
        isFeatured: editingProduct.isFeatured,
      }

      // Include coverImageId if a new image was uploaded
      if (coverImageId) {
        updateData.coverImageId = coverImageId
      }

      await productsApi.updateProduct(editingProduct.id, updateData)

      // Add new images to the product if any were uploaded
      if (newImageIds.length > 0) {
        await productsApi.addProductImages(editingProduct.id, newImageIds)
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      })
      setIsEditDialogOpen(false)
      setEditingProduct(null)
      setEditSelectedCoverImage(null)
      setEditCoverImagePreview(null)
      setEditCoverImageTitle("")
      setEditCoverImageDescription("")
      setEditSelectedImages([])
      setEditImagePreviews([])
      setEditImageMetadata([])
      setExistingImages([])
      fetchProducts()
    } catch (error: any) {
      console.error("Failed to update product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      await productsApi.deleteProduct(id)
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
      fetchProducts()
    } catch (error: any) {
      console.error("Failed to delete product:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      })
    }
  }

  const totalValue = products.reduce((sum, p) => sum + Number(p.price) * p.stockQuantity, 0)
  const lowStockCount = products.filter((p) => p.stockQuantity < 20).length

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Add a new product to your inventory</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cover-image">Cover Image/Video</Label>
                <Input
                  id="cover-image"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleCoverImageSelect}
                  disabled={uploadingImage}
                />
                {coverImagePreview && selectedCoverImage && (
                  <div className="mt-2 space-y-2">
                    {selectedCoverImage.type.startsWith("image/") ? (
                      <img
                        src={coverImagePreview}
                        alt="Cover preview"
                        className="h-32 w-32 object-cover rounded-md border"
                      />
                    ) : selectedCoverImage.type.startsWith("video/") ? (
                      <video
                        src={coverImagePreview}
                        controls
                        className="h-32 w-auto rounded-md border"
                      />
                    ) : null}
                    <div className="grid gap-2">
                      <Label htmlFor="cover-image-title" className="text-sm">Media Title (optional)</Label>
                      <Input
                        id="cover-image-title"
                        value={coverImageTitle}
                        onChange={(e) => setCoverImageTitle(e.target.value)}
                        placeholder="e.g., Product front view"
                        className="text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cover-image-description" className="text-sm">Media Description (optional)</Label>
                      <Textarea
                        id="cover-image-description"
                        value={coverImageDescription}
                        onChange={(e) => setCoverImageDescription(e.target.value)}
                        placeholder="Brief description of the image"
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
                {uploadingImage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading image...
                  </div>
                )}
              </div>

              {/* Product Gallery Images Section */}
              <div className="grid gap-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gallery-images" className="text-base font-semibold">
                    Product Gallery Images (Optional)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Max 10 images
                  </span>
                </div>
                <p className="text-sm text-muted-foreground -mt-1">
                  Add additional product images to showcase different angles and details
                </p>
                <Input
                  id="gallery-images"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleImagesSelect}
                  disabled={uploadingImage}
                />
                {imagePreviews.length > 0 && (
                  <div className="mt-2 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Selected: {imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''}
                    </p>
                    <div className="grid gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="flex gap-4 p-3 border rounded-lg">
                          <div className="relative group flex-shrink-0">
                            {selectedImages[index]?.type.startsWith("image/") ? (
                              <img
                                src={preview}
                                alt={`Gallery image ${index + 1}`}
                                className="h-24 w-24 object-cover rounded-md border"
                              />
                            ) : selectedImages[index]?.type.startsWith("video/") ? (
                              <video
                                src={preview}
                                controls
                                className="h-24 w-auto rounded-md border"
                              />
                            ) : null}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex-1 grid gap-2">
                            <div className="grid gap-1">
                              <Label htmlFor={`image-title-${index}`} className="text-xs">
                                Title (optional)
                              </Label>
                              <Input
                                id={`image-title-${index}`}
                                value={imageMetadata[index]?.title || ""}
                                onChange={(e) => {
                                  const newMetadata = [...imageMetadata]
                                  newMetadata[index] = {
                                    ...newMetadata[index],
                                    title: e.target.value
                                  }
                                  setImageMetadata(newMetadata)
                                }}
                                placeholder="e.g., Side view"
                                className="text-sm h-8"
                              />
                            </div>
                            <div className="grid gap-1">
                              <Label htmlFor={`image-description-${index}`} className="text-xs">
                                Description (optional)
                              </Label>
                              <Textarea
                                id={`image-description-${index}`}
                                value={imageMetadata[index]?.description || ""}
                                onChange={(e) => {
                                  const newMetadata = [...imageMetadata]
                                  newMetadata[index] = {
                                    ...newMetadata[index],
                                    description: e.target.value
                                  }
                                  setImageMetadata(newMetadata)
                                }}
                                placeholder="Brief description"
                                rows={2}
                                className="text-sm resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={handleNewCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ProductCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={newProduct.type}
                    onValueChange={(value) => setNewProduct({ ...newProduct, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableNewTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    placeholder="Enter brand name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="Enter SKU"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="country">Country *</Label>
                <Select
                  value={newProduct.country}
                  onValueChange={(value) => setNewProduct({ ...newProduct, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vat">VAT %</Label>
                  <Input
                    id="vat"
                    type="number"
                    step="0.01"
                    value={newProduct.vatPercentage}
                    onChange={(e) => setNewProduct({ ...newProduct, vatPercentage: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shippingRate">Shipping Rate (per Km)</Label>
                  <Input
                    id="shippingRate"
                    type="number"
                    step="0.01"
                    value={newProduct.shippingRatePerKm}
                    onChange={(e) => setNewProduct({ ...newProduct, shippingRatePerKm: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="weight">Weight (Kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.001"
                    value={newProduct.weightInKg}
                    onChange={(e) => setNewProduct({ ...newProduct, weightInKg: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={newProduct.currency}
                    onValueChange={(value) => setNewProduct({ ...newProduct, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stockQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="stockStatus">Stock Status</Label>
                  <Select
                    value={newProduct.stockQuantityStatus}
                    onValueChange={(value) => setNewProduct({ ...newProduct, stockStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_STOCK">In Stock</SelectItem>
                      <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                      <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                      <SelectItem value="PREORDER">Pre-order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={newProduct.isFeatured}
                    onChange={(e) => setNewProduct({ ...newProduct, isFeatured: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isFeatured" className="font-normal">Featured Product</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newProduct.isActive}
                    onChange={(e) => setNewProduct({ ...newProduct, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive" className="font-normal">Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddProduct} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalProducts)}</div>
            <p className="text-xs text-muted-foreground">Across all categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalValue, "RWF")}</div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(lowStockCount)}</div>
            <p className="text-xs text-muted-foreground">Products below 20 units</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>View and manage all products</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredProducts}
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
            showSearch={true}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search products..."
            filters={filters}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
            emptyMessage="No products found"
            loadingMessage="Loading products..."
            pageSizeOptions={[5, 10, 25, 50, 100]}
            actions={renderActions}
          />
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-cover-image">Cover Image</Label>
                {editCoverImagePreview && !editSelectedCoverImage && (
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground mb-2">Current media:</p>
                    {editingProduct?.coverImage?.mimeType?.startsWith("video/") ? (
                      <video
                        src={editCoverImagePreview}
                        controls
                        className="h-32 w-auto rounded-md border"
                      />
                    ) : (
                      <img
                        src={editCoverImagePreview}
                        alt="Current cover"
                        className="h-32 w-32 object-cover rounded-md border"
                      />
                    )}
                  </div>
                )}
                <Input
                  id="edit-cover-image"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleEditCoverImageSelect}
                  disabled={uploadingImage}
                />
                {editSelectedCoverImage && editCoverImagePreview && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">New media preview:</p>
                    {editSelectedCoverImage.type.startsWith("image/") ? (
                      <img
                        src={editCoverImagePreview}
                        alt="New cover preview"
                        className="h-32 w-32 object-cover rounded-md border"
                      />
                    ) : editSelectedCoverImage.type.startsWith("video/") ? (
                      <video
                        src={editCoverImagePreview}
                        controls
                        className="h-32 w-auto rounded-md border"
                      />
                    ) : null}
                    <div className="grid gap-2">
                      <Label htmlFor="edit-cover-image-title" className="text-sm">Image Title (optional)</Label>
                      <Input
                        id="edit-cover-image-title"
                        value={editCoverImageTitle}
                        onChange={(e) => setEditCoverImageTitle(e.target.value)}
                        placeholder="e.g., Product front view"
                        className="text-sm"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="edit-cover-image-description" className="text-sm">Image Description (optional)</Label>
                      <Textarea
                        id="edit-cover-image-description"
                        value={editCoverImageDescription}
                        onChange={(e) => setEditCoverImageDescription(e.target.value)}
                        placeholder="Brief description of the image"
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
                {uploadingImage && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading image...
                  </div>
                )}
              </div>

              {/* Product Gallery Images Section */}
              <div className="grid gap-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-gallery-images" className="text-base font-semibold">
                    Product Gallery Images (Optional)
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    Max 10 total images
                  </span>
                </div>
                <p className="text-sm text-muted-foreground -mt-1">
                  Add additional product images to showcase different angles and details
                </p>

                {/* Show existing images */}
                {existingImages.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Current images: {existingImages.length}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {existingImages.map((image, index) => (
                        <div key={image.id} className="relative">
                          <img
                            src={image.url}
                            alt={`Existing image ${index + 1}`}
                            className="h-24 w-24 object-cover rounded-md border"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add new images */}
                <Input
                  id="edit-gallery-images"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleEditImagesSelect}
                  disabled={uploadingImage || existingImages.length >= 10}
                />
                {existingImages.length >= 10 && (
                  <p className="text-xs text-muted-foreground">
                    Maximum number of images reached
                  </p>
                )}
                {editImagePreviews.length > 0 && (
                  <div className="mt-2 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      New images to add: {editImagePreviews.length}
                    </p>
                    <div className="grid gap-4">
                      {editImagePreviews.map((preview, index) => (
                        <div key={index} className="flex gap-4 p-3 border rounded-lg">
                          <div className="relative group flex-shrink-0">
                            {editSelectedImages[index]?.type.startsWith("image/") ? (
                              <img
                                src={preview}
                                alt={`New gallery image ${index + 1}`}
                                className="h-24 w-24 object-cover rounded-md border"
                              />
                            ) : editSelectedImages[index]?.type.startsWith("video/") ? (
                              <video
                                src={preview}
                                controls
                                className="h-24 w-auto rounded-md border"
                              />
                            ) : null}
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeEditImage(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex-1 grid gap-2">
                            <div className="grid gap-1">
                              <Label htmlFor={`edit-image-title-${index}`} className="text-xs">
                                Title (optional)
                              </Label>
                              <Input
                                id={`edit-image-title-${index}`}
                                value={editImageMetadata[index]?.title || ""}
                                onChange={(e) => {
                                  const newMetadata = [...editImageMetadata]
                                  newMetadata[index] = {
                                    ...newMetadata[index],
                                    title: e.target.value
                                  }
                                  setEditImageMetadata(newMetadata)
                                }}
                                placeholder="e.g., Side view"
                                className="text-sm h-8"
                              />
                            </div>
                            <div className="grid gap-1">
                              <Label htmlFor={`edit-image-description-${index}`} className="text-xs">
                                Description (optional)
                              </Label>
                              <Textarea
                                id={`edit-image-description-${index}`}
                                value={editImageMetadata[index]?.description || ""}
                                onChange={(e) => {
                                  const newMetadata = [...editImageMetadata]
                                  newMetadata[index] = {
                                    ...newMetadata[index],
                                    description: e.target.value
                                  }
                                  setEditImageMetadata(newMetadata)
                                }}
                                placeholder="Brief description"
                                rows={2}
                                className="text-sm resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={editingProduct.category}
                    onValueChange={handleEditCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ProductCategory).map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <Select
                    value={editingProduct.type}
                    onValueChange={(value) => setEditingProduct({ ...editingProduct, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEditTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Price</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-vat">VAT %</Label>
                  <Input
                    id="edit-vat"
                    type="number"
                    step="0.01"
                    value={editingProduct.vatPercentage}
                    onChange={(e) => setEditingProduct({ ...editingProduct, vatPercentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-shippingRate">Shipping Rate (per Km)</Label>
                  <Input
                    id="edit-shippingRate"
                    type="number"
                    step="0.01"
                    value={editingProduct.shippingRatePerKm || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shippingRatePerKm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-weight">Weight (Kg)</Label>
                  <Input
                    id="edit-weight"
                    type="number"
                    step="0.001"
                    value={editingProduct.weightInKg || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, weightInKg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stock</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stockQuantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isFeatured"
                    checked={editingProduct.isFeatured}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit-isFeatured" className="font-normal">Featured Product</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-isActive"
                    checked={editingProduct.isActive}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit-isActive" className="font-normal">Active</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingProduct(null)
                setEditSelectedCoverImage(null)
                setEditCoverImagePreview(null)
                setEditCoverImageTitle("")
                setEditCoverImageDescription("")
                setEditSelectedImages([])
                setEditImagePreviews([])
                setEditImageMetadata([])
                setExistingImages([])
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleEditProduct} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
