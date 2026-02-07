"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Search, MoreHorizontal, Eye, Mail, Trash2, CheckCircle2, Clock } from "lucide-react"

type Message = {
  id: number
  name: string
  email: string
  subject: string
  message: string
  status: "new" | "read" | "replied"
  userType: "guest" | "user"
  date: string
}

const initialMessages: Message[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    subject: "Product Inquiry",
    message: "I have a question about the wireless headphones...",
    status: "new",
    userType: "user",
    date: "2024-01-15",
  },
  {
    id: 2,
    name: "Mike Chen",
    email: "mike@example.com",
    subject: "Order Issue",
    message: "My order hasn't arrived yet...",
    status: "read",
    userType: "user",
    date: "2024-01-15",
  },
  {
    id: 3,
    name: "Guest User",
    email: "guest@example.com",
    subject: "General Question",
    message: "Do you ship internationally?",
    status: "replied",
    userType: "guest",
    date: "2024-01-14",
  },
  {
    id: 4,
    name: "Emma Davis",
    email: "emma@example.com",
    subject: "Return Request",
    message: "I would like to return my purchase...",
    status: "new",
    userType: "user",
    date: "2024-01-14",
  },
]

export default function ContactPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [userTypeFilter, setUserTypeFilter] = useState("all")
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState("")

  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || message.status === statusFilter
    const matchesUserType = userTypeFilter === "all" || message.userType === userTypeFilter
    return matchesSearch && matchesStatus && matchesUserType
  })

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message)
    setIsDetailsOpen(true)
    if (message.status === "new") {
      setMessages(messages.map((m) => (m.id === message.id ? { ...m, status: "read" as const } : m)))
    }
  }

  const handleReply = () => {
    if (selectedMessage) {
      setMessages(messages.map((m) => (m.id === selectedMessage.id ? { ...m, status: "replied" as const } : m)))
      setIsReplyOpen(false)
      setReplyText("")
    }
  }

  const handleDelete = (id: number) => {
    setMessages(messages.filter((m) => m.id !== id))
  }

  const newMessages = messages.filter((m) => m.status === "new").length
  const readMessages = messages.filter((m) => m.status === "read").length
  const repliedMessages = messages.filter((m) => m.status === "replied").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-balance">Contact Messages</h1>
        <p className="text-muted-foreground">Manage messages from customers and guests</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
            <p className="text-xs text-muted-foreground">All messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newMessages}</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readMessages}</div>
            <p className="text-xs text-muted-foreground">Read but not replied</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Replied</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repliedMessages}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>View and respond to customer messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
              </SelectContent>
            </Select>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="user">Registered Users</SelectItem>
                <SelectItem value="guest">Guests</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{message.name}</div>
                        <div className="text-sm text-muted-foreground">{message.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{message.subject}</TableCell>
                    <TableCell>
                      <Badge variant={message.userType === "user" ? "default" : "secondary"}>{message.userType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          message.status === "new"
                            ? "destructive"
                            : message.status === "replied"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {message.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{message.date}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewMessage(message)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Message
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMessage(message)
                              setIsReplyOpen(true)
                            }}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Reply
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(message.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
            <DialogDescription>From {selectedMessage?.name}</DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Name:</span> {selectedMessage.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span> {selectedMessage.email}
                  </p>
                  <p>
                    <span className="text-muted-foreground">User Type:</span>{" "}
                    <Badge variant="secondary">{selectedMessage.userType}</Badge>
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Message</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Subject:</span> {selectedMessage.subject}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Date:</span> {selectedMessage.date}
                  </p>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p>{selectedMessage.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setIsDetailsOpen(false)
                setIsReplyOpen(true)
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
            <DialogDescription>Send a reply to {selectedMessage?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reply">Your Reply</Label>
              <Textarea
                id="reply"
                placeholder="Type your reply here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReply}>Send Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
