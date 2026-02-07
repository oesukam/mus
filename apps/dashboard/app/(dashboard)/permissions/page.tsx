"use client"

import { useState, useEffect } from "react"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Key,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Database,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { permissionsApi, type Permission } from "@/lib/roles-api"

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [resourceFilter, setResourceFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Form states
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [permissionName, setPermissionName] = useState("")
  const [permissionResource, setPermissionResource] = useState("")
  const [permissionAction, setPermissionAction] = useState("")
  const [permissionDescription, setPermissionDescription] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    fetchPermissions()
  }, [currentPage, itemsPerPage, searchQuery, resourceFilter])

  const fetchPermissions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await permissionsApi.getPermissions({
        page: currentPage,
        limit: itemsPerPage,
        q: searchQuery || undefined,
        resource: resourceFilter !== "all" ? resourceFilter : undefined,
      })
      setPermissions(response.permissions || [])
      setPagination(response.pagination)
    } catch (err: any) {
      setError(err.message || "Failed to fetch permissions")
      setPermissions([]) // Ensure we always have an array even on error
      toast({
        title: "Error",
        description: "Failed to fetch permissions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    try {
      setIsActionLoading(true)
      const response = await permissionsApi.seedDefaults()
      toast({
        title: "Success",
        description: response.message,
      })
      fetchPermissions()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to seed default permissions",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const resetForm = () => {
    setPermissionName("")
    setPermissionResource("")
    setPermissionAction("")
    setPermissionDescription("")
  }

  const handleOpenCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const handleOpenEditDialog = (permission: Permission) => {
    setSelectedPermission(permission)
    setPermissionName(permission.name)
    setPermissionResource(permission.resource)
    setPermissionAction(permission.action)
    setPermissionDescription(permission.description || "")
    setIsEditDialogOpen(true)
  }

  const handleOpenDeleteDialog = (permission: Permission) => {
    setSelectedPermission(permission)
    setIsDeleteDialogOpen(true)
  }

  const handleCreatePermission = async () => {
    if (
      !permissionName.trim() ||
      !permissionResource.trim() ||
      !permissionAction.trim()
    ) {
      toast({
        title: "Validation Error",
        description: "Please provide name, resource, and action",
        variant: "destructive",
      })
      return
    }

    try {
      setIsActionLoading(true)
      await permissionsApi.createPermission({
        name: permissionName,
        resource: permissionResource,
        action: permissionAction,
        description: permissionDescription || undefined,
      })
      toast({
        title: "Permission Created",
        description: `Permission "${permissionName}" has been created successfully`,
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchPermissions()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create permission",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUpdatePermission = async () => {
    if (!selectedPermission) return

    try {
      setIsActionLoading(true)
      await permissionsApi.updatePermission(selectedPermission.id, {
        name: permissionName,
        resource: permissionResource,
        action: permissionAction,
        description: permissionDescription || undefined,
      })
      toast({
        title: "Permission Updated",
        description: `Permission "${permissionName}" has been updated`,
      })
      setIsEditDialogOpen(false)
      fetchPermissions()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update permission",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeletePermission = async () => {
    if (!selectedPermission) return

    try {
      setIsActionLoading(true)
      await permissionsApi.deletePermission(selectedPermission.id)
      toast({
        title: "Permission Deleted",
        description: `Permission "${selectedPermission.name}" has been deleted`,
      })
      setIsDeleteDialogOpen(false)
      fetchPermissions()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete permission",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  // Get unique resources for filter
  const resources = Array.from(new Set(permissions?.map((p) => p.resource) || [])).sort()

  // Group permissions by resource for display
  const permissionsByResource = (permissions || []).reduce(
    (acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = []
      }
      acc[permission.resource].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>,
  )

  const totalPermissions = pagination.total
  const totalResources = resources.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Permissions</h1>
          <p className="text-muted-foreground">
            Manage system permissions and access controls
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPermissions()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleSeedDefaults} disabled={isActionLoading}>
            <Sparkles className="h-4 w-4 mr-2" />
            Seed Defaults
          </Button>
          <Button size="sm" onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Permission
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPermissions}</div>
            <p className="text-xs text-muted-foreground">All defined permissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResources}</div>
            <p className="text-xs text-muted-foreground">Protected resources</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permissions List</CardTitle>
          <CardDescription>View and manage all permissions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Select value={resourceFilter} onValueChange={setResourceFilter} disabled={isLoading}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {resources.map((resource) => (
                  <SelectItem key={resource} value={resource}>
                    {resource}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg text-destructive mb-4">{error}</p>
              <Button onClick={() => fetchPermissions()}>Try Again</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(permissionsByResource).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No permissions found
                </div>
              ) : (
                Object.keys(permissionsByResource)
                  .sort()
                  .map((resource) => (
                    <div key={resource} className="space-y-2">
                      <h3 className="text-sm font-semibold capitalize border-b pb-2">
                        {resource}
                      </h3>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Permission</TableHead>
                              <TableHead>Action</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {permissionsByResource[resource].map((permission) => (
                              <TableRow key={permission.id}>
                                <TableCell>
                                  <div className="font-medium">{permission.name}</div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{permission.action}</Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {permission.description || "—"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={isActionLoading}
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => handleOpenEditDialog(permission)}
                                      >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit Permission
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleOpenDeleteDialog(permission)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Permission
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))
              )}

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
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
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">per page</p>
                </div>
                {pagination.totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages} ({pagination.total} permissions)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p - 1)}
                        disabled={!pagination.hasPreviousPage || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={!pagination.hasNextPage || isLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Permission Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Permission</DialogTitle>
            <DialogDescription>Add a new permission to the system</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={permissionName}
                onChange={(e) => setPermissionName(e.target.value)}
                placeholder="e.g., users:read"
                disabled={isActionLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource">Resource</Label>
              <Input
                id="resource"
                value={permissionResource}
                onChange={(e) => setPermissionResource(e.target.value)}
                placeholder="e.g., users"
                disabled={isActionLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="action">Action</Label>
              <Input
                id="action"
                value={permissionAction}
                onChange={(e) => setPermissionAction(e.target.value)}
                placeholder="e.g., read, write, delete"
                disabled={isActionLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={permissionDescription}
                onChange={(e) => setPermissionDescription(e.target.value)}
                placeholder="Describe what this permission allows..."
                rows={3}
                disabled={isActionLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePermission} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Permission"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Permission Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permission</DialogTitle>
            <DialogDescription>Update permission details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={permissionName}
                onChange={(e) => setPermissionName(e.target.value)}
                disabled={isActionLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-resource">Resource</Label>
              <Input
                id="edit-resource"
                value={permissionResource}
                onChange={(e) => setPermissionResource(e.target.value)}
                disabled={isActionLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-action">Action</Label>
              <Input
                id="edit-action"
                value={permissionAction}
                onChange={(e) => setPermissionAction(e.target.value)}
                disabled={isActionLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={permissionDescription}
                onChange={(e) => setPermissionDescription(e.target.value)}
                rows={3}
                disabled={isActionLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdatePermission} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Permission Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Permission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the permission "{selectedPermission?.name}"? This
              action cannot be undone. Roles using this permission will lose this access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePermission} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Permission"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
