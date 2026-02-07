"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  Shield,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Key,
  Loader2,
  RefreshCw,
  Lock,
} from "lucide-react"
import { rolesApi, permissionsApi, type Role, type Permission } from "@/lib/roles-api"
import { DataTable, ColumnDef } from "@/components/data-table"

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
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
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)

  // Form states
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [roleName, setRoleName] = useState("")
  const [roleDisplayName, setRoleDisplayName] = useState("")
  const [roleDescription, setRoleDescription] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])

  const { toast } = useToast()

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [currentPage, itemsPerPage, searchQuery, sortBy, sortOrder])

  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await rolesApi.getRoles({
        page: currentPage,
        limit: itemsPerPage,
        q: searchQuery || undefined,
        sortBy: sortBy,
        sortOrder: sortOrder,
      })
      setRoles(response.roles || [])
      setPagination(response.pagination)
    } catch (err: any) {
      setError(err.message || "Failed to fetch roles")
      setRoles([]) // Ensure we always have an array even on error
      toast({
        title: "Error",
        description: "Failed to fetch roles. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await permissionsApi.getPermissions({ limit: 100 })
      setPermissions(response.permissions || [])
    } catch (err: any) {
      console.error("Failed to fetch permissions:", err)
      setPermissions([]) // Ensure we always have an array even on error
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Set new column and default to ascending
      setSortBy(column)
      setSortOrder("desc")
    }
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  const resetForm = () => {
    setRoleName("")
    setRoleDisplayName("")
    setRoleDescription("")
    setSelectedPermissions([])
  }

  const handleOpenCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const handleOpenEditDialog = (role: Role) => {
    setSelectedRole(role)
    setRoleName(role.name)
    setRoleDisplayName(role.displayName)
    setRoleDescription(role.description || "")
    setIsEditDialogOpen(true)
  }

  const handleOpenPermissionsDialog = (role: Role) => {
    setSelectedRole(role)
    setSelectedPermissions(role.permissions.map((p) => p.id))
    setIsPermissionsDialogOpen(true)
  }

  const handleOpenDeleteDialog = (role: Role) => {
    setSelectedRole(role)
    setIsDeleteDialogOpen(true)
  }

  const handleCreateRole = async () => {
    if (!roleName.trim() || !roleDisplayName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both name and display name",
        variant: "destructive",
      })
      return
    }

    try {
      setIsActionLoading(true)
      await rolesApi.createRole({
        name: roleName,
        displayName: roleDisplayName,
        description: roleDescription || undefined,
      })
      toast({
        title: "Role Created",
        description: `Role "${roleDisplayName}" has been created successfully`,
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchRoles()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create role",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return

    try {
      setIsActionLoading(true)
      await rolesApi.updateRole(selectedRole.id, {
        name: roleName,
        displayName: roleDisplayName,
        description: roleDescription || undefined,
      })
      toast({
        title: "Role Updated",
        description: `Role "${roleDisplayName}" has been updated`,
      })
      setIsEditDialogOpen(false)
      fetchRoles()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update role",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteRole = async () => {
    if (!selectedRole) return

    try {
      setIsActionLoading(true)
      await rolesApi.deleteRole(selectedRole.id)
      toast({
        title: "Role Deleted",
        description: `Role "${selectedRole.displayName}" has been deleted`,
      })
      setIsDeleteDialogOpen(false)
      fetchRoles()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete role",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleAssignPermissions = async () => {
    if (!selectedRole) return

    try {
      setIsActionLoading(true)
      await rolesApi.assignPermissions(selectedRole.id, selectedPermissions)
      toast({
        title: "Permissions Updated",
        description: `Permissions for "${selectedRole.displayName}" have been updated`,
      })
      setIsPermissionsDialogOpen(false)
      fetchRoles()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update permissions",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  // Group permissions by resource
  const permissionsByResource = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = []
      }
      acc[permission.resource].push(permission)
      return acc
    },
    {} as Record<string, Permission[]>,
  )

  const totalRoles = pagination?.total || 0
  const systemRoles = roles.filter((r) => r.isSystem).length
  const customRoles = roles.filter((r) => !r.isSystem).length

  // Column definitions for DataTable
  const columns: ColumnDef<Role>[] = [
    {
      key: "displayName",
      header: "Role",
      sortable: true,
      cell: (role) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {role.displayName}
            {role.isSystem && (
              <Badge variant="secondary" className="text-xs">
                System
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{role.name}</div>
          {role.description && (
            <div className="text-xs text-muted-foreground mt-1">{role.description}</div>
          )}
        </div>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      sortable: false,
      cell: (role) => (
        <div className="flex flex-wrap gap-1">
          {role.permissions.length === 0 ? (
            <span className="text-sm text-muted-foreground">No permissions</span>
          ) : (
            <>
              {role.permissions.slice(0, 3).map((permission) => (
                <Badge key={permission.id} variant="outline" className="text-xs">
                  {permission.name}
                </Badge>
              ))}
              {role.permissions.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{role.permissions.length - 3} more
                </Badge>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      key: "isSystem",
      header: "Type",
      sortable: true,
      cell: (role) => (
        <Badge variant={role.isSystem ? "secondary" : "default"}>
          {role.isSystem ? "System" : "Custom"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (role) => new Date(role.createdAt).toLocaleDateString(),
    },
  ]

  // Actions for each row
  const renderActions = (role: Role) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isActionLoading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleOpenPermissionsDialog(role)}>
          <Key className="mr-2 h-4 w-4" />
          Manage Permissions
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleOpenEditDialog(role)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Role
        </DropdownMenuItem>
        {!role.isSystem && (
          <DropdownMenuItem onClick={() => handleOpenDeleteDialog(role)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Role
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage user roles and their permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchRoles()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Role
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRoles}</div>
            <p className="text-xs text-muted-foreground">All defined roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Roles</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemRoles}</div>
            <p className="text-xs text-muted-foreground">Protected system roles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Roles</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customRoles}</div>
            <p className="text-xs text-muted-foreground">User-defined roles</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles List</CardTitle>
          <CardDescription>View and manage all roles in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={roles}
            columns={columns}
            loading={isLoading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            currentPage={currentPage}
            totalPages={pagination?.totalPages || 1}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size)
              setCurrentPage(1)
            }}
            showSearch={true}
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value)
              setCurrentPage(1)
            }}
            searchPlaceholder="Search roles..."
            emptyMessage="No roles found"
            loadingMessage="Loading roles..."
            actions={renderActions}
          />
        </CardContent>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>Add a new role to the system</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name (lowercase, no spaces)</Label>
              <Input
                id="name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value.toLowerCase().replace(/\s/g, "-"))}
                placeholder="e.g., moderator"
                disabled={isActionLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={roleDisplayName}
                onChange={(e) => setRoleDisplayName(e.target.value)}
                placeholder="e.g., Moderator"
                disabled={isActionLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Describe what this role does..."
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
            <Button onClick={handleCreateRole} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                disabled={isActionLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-displayName">Display Name</Label>
              <Input
                id="edit-displayName"
                value={roleDisplayName}
                onChange={(e) => setRoleDisplayName(e.target.value)}
                disabled={isActionLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
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
            <Button onClick={handleUpdateRole} disabled={isActionLoading}>
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

      {/* Delete Role Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{selectedRole?.displayName}"? This action
              cannot be undone. Users assigned to this role will lose these permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Role"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>Assign permissions to {selectedRole?.displayName}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {Object.keys(permissionsByResource)
              .sort()
              .map((resource) => (
                <div key={resource} className="space-y-3">
                  <h3 className="text-sm font-semibold capitalize border-b pb-2">{resource}</h3>
                  <div className="grid gap-2 pl-2">
                    {permissionsByResource[resource].map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={`perm-${permission.id}`}
                          checked={selectedPermissions.includes(permission.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPermissions([...selectedPermissions, permission.id])
                            } else {
                              setSelectedPermissions(
                                selectedPermissions.filter((id) => id !== permission.id),
                              )
                            }
                          }}
                          disabled={isActionLoading}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor={`perm-${permission.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {permission.name}
                          </Label>
                          {permission.description && (
                            <p className="text-sm text-muted-foreground">
                              {permission.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPermissionsDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignPermissions} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Permissions"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
