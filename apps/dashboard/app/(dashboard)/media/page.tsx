"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Image as ImageIcon,
  Upload,
  Loader2,
  MoreHorizontal,
  Trash2,
  Eye,
  Download,
  Copy,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  HardDrive,
  FolderOpen,
  Search,
  Video,
} from "lucide-react"
import { filesApi, FileEntity } from "@/lib/files-api"
import { useToast } from "@/hooks/use-toast"

type ViewMode = "grid" | "list"

export default function MediaPage() {
  const { toast } = useToast()
  const [files, setFiles] = useState<FileEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [folderFilter, setFolderFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileEntity | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalFiles, setTotalFiles] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(24)

  // Upload form state
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadFolder, setUploadFolder] = useState("uploads")
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadDescription, setUploadDescription] = useState("")

  // Fetch files
  useEffect(() => {
    fetchFiles()
  }, [currentPage, folderFilter, itemsPerPage])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      }

      if (folderFilter !== "all") {
        params.folder = folderFilter
      }

      const response = await filesApi.getFiles(params)
      setFiles(response.files)
      setTotalPages(response.pagination.totalPages)
      setTotalFiles(response.pagination.total)
    } catch (error) {
      console.error("Failed to fetch files:", error)
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePageSizeChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedUploadFile(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadFile = async () => {
    if (!selectedUploadFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploadingFile(true)
      await filesApi.uploadFile(
        selectedUploadFile,
        uploadFolder,
        uploadTitle || undefined,
        uploadDescription || undefined
      )
      toast({
        title: "Success",
        description: "File uploaded successfully",
      })
      setIsUploadDialogOpen(false)
      resetUploadForm()
      fetchFiles()
    } catch (error: any) {
      console.error("Failed to upload file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteFile = async (file: FileEntity) => {
    if (!confirm(`Are you sure you want to delete "${file.originalName}"?`)) return

    try {
      await filesApi.deleteFile(file.url)
      toast({
        title: "Success",
        description: "File deleted successfully",
      })
      fetchFiles()
    } catch (error: any) {
      console.error("Failed to delete file:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "Success",
      description: "URL copied to clipboard",
    })
  }

  const handleDownload = (file: FileEntity) => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetUploadForm = () => {
    setSelectedUploadFile(null)
    setUploadPreview(null)
    setUploadFolder("uploads")
    setUploadTitle("")
    setUploadDescription("")
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isImage = (mimeType: string): boolean => {
    return mimeType.startsWith("image/")
  }

  const isVideo = (mimeType: string): boolean => {
    return mimeType.startsWith("video/")
  }

  // Filter files by search query
  const filteredFiles = files.filter((file) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      file.originalName.toLowerCase().includes(query) ||
      file.title?.toLowerCase().includes(query) ||
      file.description?.toLowerCase().includes(query) ||
      file.folder.toLowerCase().includes(query)
    )
  })

  // Get unique folders from files
  const folders = Array.from(new Set(files.map((f) => f.folder)))

  // Calculate total storage used
  const totalStorage = files.reduce((sum, file) => sum + file.size, 0)

  if (loading && files.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">Manage your files and media assets</p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload File</DialogTitle>
              <DialogDescription>Upload a new file to your media library</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  disabled={uploadingFile}
                />
                {uploadPreview && selectedUploadFile && (
                  <div className="mt-2">
                    {isImage(selectedUploadFile.type) ? (
                      <img
                        src={uploadPreview}
                        alt="Preview"
                        className="h-48 w-auto object-contain rounded-md border"
                      />
                    ) : isVideo(selectedUploadFile.type) ? (
                      <video
                        src={uploadPreview}
                        controls
                        className="h-48 w-auto rounded-md border"
                      />
                    ) : null}
                  </div>
                )}
                {selectedUploadFile && (
                  <p className="text-sm text-muted-foreground">
                    {selectedUploadFile.name} - {formatFileSize(selectedUploadFile.size)}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="folder">Folder</Label>
                <Select value={uploadFolder} onValueChange={setUploadFolder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uploads">Uploads</SelectItem>
                    <SelectItem value="products">Products</SelectItem>
                    <SelectItem value="products/covers">Products/Covers</SelectItem>
                    <SelectItem value="products/images">Products/Images</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">Title (optional)</Label>
                <Input
                  id="title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g., Product banner image"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Brief description of the file"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false)
                  resetUploadForm()
                }}
                disabled={uploadingFile}
              >
                Cancel
              </Button>
              <Button onClick={handleUploadFile} disabled={uploadingFile || !selectedUploadFile}>
                {uploadingFile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
            <p className="text-xs text-muted-foreground">Across all folders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalStorage)}</div>
            <p className="text-xs text-muted-foreground">Total storage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folders</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{folders.length}</div>
            <p className="text-xs text-muted-foreground">Unique folders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Files</CardTitle>
              <CardDescription>Browse and manage your media files</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files by name, title, description, or folder..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                <SelectItem value="uploads">Uploads</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="products/covers">Products/Covers</SelectItem>
                <SelectItem value="products/images">Products/Images</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No files found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery ? "Try a different search term" : "Upload your first file to get started"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              )}
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="group relative rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="aspect-square bg-muted flex items-center justify-center relative">
                        {isImage(file.mimeType) ? (
                          <img
                            src={file.urlThumbnail || file.url}
                            alt={file.title || file.originalName}
                            className="w-full h-full object-cover"
                          />
                        ) : isVideo(file.mimeType) ? (
                          <>
                            <video
                              src={file.url}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Video className="h-12 w-12 text-white" />
                            </div>
                          </>
                        ) : (
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFile(file)
                                setIsViewDialogOpen(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyUrl(file.url)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteFile(file)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0 relative">
                        {isImage(file.mimeType) ? (
                          <img
                            src={file.urlThumbnail || file.url}
                            alt={file.title || file.originalName}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : isVideo(file.mimeType) ? (
                          <>
                            <video
                              src={file.url}
                              className="w-full h-full object-cover rounded"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                              <Video className="h-6 w-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.originalName}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{formatDate(file.createdAt)}</span>
                          <span>•</span>
                          <Badge variant="outline">{file.folder}</Badge>
                        </div>
                      </div>
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
                              setSelectedFile(file)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyUrl(file.url)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteFile(file)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({totalFiles} total files)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Show</span>
                    <Select value={itemsPerPage.toString()} onValueChange={handlePageSizeChange}>
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12</SelectItem>
                        <SelectItem value="24">24</SelectItem>
                        <SelectItem value="48">48</SelectItem>
                        <SelectItem value="96">96</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">per page</span>
                  </div>
                </div>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View File Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="grid gap-4">
              <div className="flex justify-center bg-muted rounded-lg p-4">
                {isImage(selectedFile.mimeType) ? (
                  <img
                    src={selectedFile.urlLarge || selectedFile.url}
                    alt={selectedFile.title || selectedFile.originalName}
                    className="max-h-96 object-contain rounded"
                  />
                ) : isVideo(selectedFile.mimeType) ? (
                  <video
                    src={selectedFile.url}
                    controls
                    className="max-h-96 w-full rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <ImageIcon className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">File Name</p>
                    <p className="text-muted-foreground">{selectedFile.originalName}</p>
                  </div>
                  <div>
                    <p className="font-medium">Size</p>
                    <p className="text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Type</p>
                    <p className="text-muted-foreground">{selectedFile.mimeType}</p>
                  </div>
                  <div>
                    <p className="font-medium">Folder</p>
                    <p className="text-muted-foreground">{selectedFile.folder}</p>
                  </div>
                  <div>
                    <p className="font-medium">Uploaded</p>
                    <p className="text-muted-foreground">{formatDate(selectedFile.createdAt)}</p>
                  </div>
                  <div>
                    <p className="font-medium">ID</p>
                    <p className="text-muted-foreground">{selectedFile.id}</p>
                  </div>
                </div>
                {selectedFile.title && (
                  <div>
                    <p className="font-medium text-sm">Title</p>
                    <p className="text-sm text-muted-foreground">{selectedFile.title}</p>
                  </div>
                )}
                {selectedFile.description && (
                  <div>
                    <p className="font-medium text-sm">Description</p>
                    <p className="text-sm text-muted-foreground">{selectedFile.description}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm mb-1">URL</p>
                  <div className="flex gap-2">
                    <Input value={selectedFile.url} readOnly className="font-mono text-xs" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyUrl(selectedFile.url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {isImage(selectedFile.mimeType) && (
                  <>
                    {selectedFile.urlThumbnail && (
                      <div>
                        <p className="font-medium text-sm mb-1">Thumbnail URL</p>
                        <div className="flex gap-2">
                          <Input
                            value={selectedFile.urlThumbnail}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyUrl(selectedFile.urlThumbnail!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedFile.urlMedium && (
                      <div>
                        <p className="font-medium text-sm mb-1">Medium URL</p>
                        <div className="flex gap-2">
                          <Input
                            value={selectedFile.urlMedium}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyUrl(selectedFile.urlMedium!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedFile.urlLarge && (
                      <div>
                        <p className="font-medium text-sm mb-1">Large URL</p>
                        <div className="flex gap-2">
                          <Input
                            value={selectedFile.urlLarge}
                            readOnly
                            className="font-mono text-xs"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyUrl(selectedFile.urlLarge!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => selectedFile && handleDownload(selectedFile)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
