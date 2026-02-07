"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  UsersIcon,
  MoreHorizontal,
  Mail,
  UserX,
  UserCheck,
  Shield,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { usersApi, type User, type Role, UserStatus } from "@/lib/users-api"
import { DataTable, ColumnDef, FilterDef } from "@/components/data-table"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValues, setFilterValues] = useState({
    role: "all",
    status: "all",
  })
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<number[]>([])
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
  const { toast } = useToast()

  // Fetch users on mount and when filters change
  useEffect(() => {
    fetchUsers()
  }, [currentPage, itemsPerPage, filterValues.role, filterValues.status, searchQuery])

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await usersApi.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        status: filterValues.status !== "all" ? (filterValues.status as UserStatus) : undefined,
        role: filterValues.role !== "all" ? filterValues.role : undefined,
        search: searchQuery.trim() || undefined,
      })
      setUsers(response.users)
      setPagination(response.pagination)
    } catch (err: any) {
      setError(err.message || "Failed to fetch users")
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await usersApi.getRoles()
      setRoles(response.roles || [])
    } catch (err: any) {
      console.error("Failed to fetch roles:", err)
      setRoles([]) // Ensure we always have an array even on error
    }
  }

  const handleSendEmail = async () => {
    if (!selectedUser || !emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both subject and message",
        variant: "destructive",
      })
      return
    }

    try {
      setIsActionLoading(true)
      await usersApi.sendEmail(selectedUser.id, {
        subject: emailSubject,
        message: emailMessage,
      })
      toast({
        title: "Email Sent",
        description: `Email sent successfully to ${selectedUser.name}`,
      })
      setIsEmailDialogOpen(false)
      setEmailSubject("")
      setEmailMessage("")
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send email",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSuspendUser = async () => {
    if (!selectedUser) return

    try {
      setIsActionLoading(true)
      await usersApi.suspendUser(selectedUser.id)
      toast({
        title: "User Suspended",
        description: `${selectedUser.name} has been suspended`,
      })
      setIsSuspendDialogOpen(false)
      fetchUsers() // Refresh the list
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to suspend user",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReactivateUser = async (user: User) => {
    try {
      setIsActionLoading(true)
      await usersApi.reactivateUser(user.id)
      toast({
        title: "User Reactivated",
        description: `${user.name} has been reactivated`,
      })
      fetchUsers() // Refresh the list
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to reactivate user",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleOpenRolesDialog = (user: User) => {
    setSelectedUser(user)
    setSelectedRoles(user.roles.map((r) => r.id))
    setIsRolesDialogOpen(true)
  }

  const handleAssignRoles = async () => {
    if (!selectedUser) return

    try {
      setIsActionLoading(true)
      await usersApi.assignRoles(selectedUser.id, selectedRoles)
      toast({
        title: "Roles Updated",
        description: `Roles have been updated for ${selectedUser.name}`,
      })
      setIsRolesDialogOpen(false)
      fetchUsers() // Refresh the list
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update roles",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const totalUsers = pagination.total
  const activeUsers = users.filter((u) => u.status === UserStatus.ACTIVE).length
  const suspendedUsers = users.filter((u) => u.status === UserStatus.SUSPENDED).length
  const adminUsers = users.filter((u) => u.roles.some((r) => r.name === "admin")).length

  // Column definitions for DataTable
  const columns: ColumnDef<User>[] = [
    {
      key: "name",
      header: "User",
      sortable: false,
      cell: (user) => (
        <div className="flex items-center gap-3">
          {user.picture && (
            <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full" />
          )}
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "roles",
      header: "Roles",
      sortable: false,
      cell: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.roles.map((role) => (
            <Badge key={role.id} variant={role.name === "admin" ? "default" : "secondary"}>
              {role.displayName}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      cell: (user) => (
        <Badge
          variant={
            user.status === UserStatus.ACTIVE
              ? "default"
              : user.status === UserStatus.SUSPENDED
                ? "destructive"
                : "outline"
          }
        >
          {user.status}
        </Badge>
      ),
    },
    {
      key: "provider",
      header: "Provider",
      sortable: false,
      cell: (user) => <span className="capitalize">{user.provider}</span>,
    },
    {
      key: "createdAt",
      header: "Join Date",
      sortable: false,
      cell: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
  ]

  // Filter definitions for DataTable
  const filters: FilterDef[] = [
    {
      key: "role",
      label: "Role",
      placeholder: "All Roles",
      options: [
        { value: "all", label: "All Roles" },
        ...roles.map((role) => ({
          value: role.name,
          label: role.displayName,
        })),
      ],
    },
    {
      key: "status",
      label: "Status",
      placeholder: "All Status",
      options: [
        { value: "all", label: "All Status" },
        { value: UserStatus.ACTIVE, label: "Active" },
        { value: UserStatus.SUSPENDED, label: "Suspended" },
        { value: UserStatus.PENDING, label: "Pending" },
      ],
    },
  ]

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filter changes
  }

  // Actions for each row
  const renderActions = (user: User) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isActionLoading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleOpenRolesDialog(user)}>
          <Shield className="mr-2 h-4 w-4" />
          Manage Roles
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setSelectedUser(user)
            setIsEmailDialogOpen(true)
          }}
        >
          <Mail className="mr-2 h-4 w-4" />
          Send Email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.status === UserStatus.ACTIVE ? (
          <DropdownMenuItem
            onClick={() => {
              setSelectedUser(user)
              setIsSuspendDialogOpen(true)
            }}
          >
            <UserX className="mr-2 h-4 w-4" />
            Suspend User
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleReactivateUser(user)}>
            <UserCheck className="mr-2 h-4 w-4" />
            Reactivate User
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchUsers()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspendedUsers}</div>
            <p className="text-xs text-muted-foreground">Suspended accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers}</div>
            <p className="text-xs text-muted-foreground">Admin users</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>View and manage all user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg text-destructive mb-4">{error}</p>
              <Button onClick={() => fetchUsers()}>Try Again</Button>
            </div>
          ) : (
            <DataTable
              data={users}
              columns={columns}
              loading={isLoading}
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
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search users..."
              filters={filters}
              filterValues={filterValues}
              onFilterChange={handleFilterChange}
              emptyMessage="No users found"
              loadingMessage="Loading users..."
              actions={renderActions}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
            <DialogDescription>
              Send an email to {selectedUser?.name} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Email subject"
                disabled={isActionLoading}
                maxLength={200}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={6}
                disabled={isActionLoading}
                maxLength={10000}
              />
              <p className="text-xs text-muted-foreground">
                {emailMessage.length} / 10,000 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEmailDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isActionLoading || !emailSubject.trim() || !emailMessage.trim()}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Email"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isSuspendDialogOpen} onOpenChange={setIsSuspendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend {selectedUser?.name}? They will not be able to access
              their account until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspendUser} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suspending...
                </>
              ) : (
                "Suspend User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isRolesDialogOpen} onOpenChange={setIsRolesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Assign roles to {selectedUser?.name}. Users can have multiple roles.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {roles?.map((role) => (
              <div key={role.id} className="flex items-start space-x-3">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={selectedRoles.includes(role.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedRoles([...selectedRoles, role.id])
                    } else {
                      setSelectedRoles(selectedRoles.filter((id) => id !== role.id))
                    }
                  }}
                  disabled={isActionLoading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor={`role-${role.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {role.displayName}
                  </Label>
                  {role.description && (
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRolesDialogOpen(false)}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignRoles} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
