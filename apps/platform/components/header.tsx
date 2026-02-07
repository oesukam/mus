"use client"

import type React from "react"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Menu, Heart, Package, Search, Settings, User, LogOut, MapPin, MapPinned } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCartStore } from "@/lib/cart-store"
import { useWishlistStore } from "@/lib/wishlist-store"
import { useAuthStore } from "@/lib/auth-store"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { AuthModal } from "@/components/auth-modal"
import { CurrencySwitcher } from "@/components/currency-switcher"

export function Header() {
  const [mounted, setMounted] = useState(false)
  const totalItems = useCartStore((state) => state.getTotalItems())
  const wishlistItems = useWishlistStore((state) => state.getTotalItems())
  const { user, isAuthenticated, logout } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAuthModal, setShowAuthModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isInitialMount = useRef(true)

  // Initialize search query from URL on mount
  useEffect(() => {
    setMounted(true)
    const queryFromUrl = searchParams.get("q") || ""
    setSearchQuery(queryFromUrl)
    isInitialMount.current = false
  }, [searchParams])

  // Debounced search - trigger search 500ms after user stops typing
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      return
    }

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    const currentQuery = searchParams.get("q") || ""
    const trimmedQuery = searchQuery.trim()

    // Only trigger search if the query has actually changed from URL
    if (trimmedQuery !== currentQuery) {
      if (trimmedQuery.length >= 2) {
        debounceTimeoutRef.current = setTimeout(() => {
          router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`)
        }, 500) // 500ms debounce
      } else if (trimmedQuery.length === 0 && pathname === "/search" && currentQuery) {
        // If user clears search on search page, navigate to search page without query
        debounceTimeoutRef.current = setTimeout(() => {
          router.push("/search")
        }, 500)
      }
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [searchQuery, searchParams, router, pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Clear debounce timeout and immediately navigate
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      router.push("/search")
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const categories = [
    { name: "All", href: "/search" },
    { name: "Electronics", href: "/search?category=Electronics" },
    { name: "Books", href: "/search?category=Books" },
    { name: "Clothing", href: "/search?category=Clothing" },
    { name: "Toys", href: "/search?category=Toys" },
    { name: "Home", href: "/search?category=Home" },
    { name: "Bags", href: "/search?category=Bags" },
    { name: "Accessories", href: "/search?category=Accessories" },
    { name: "Sports", href: "/search?category=Sports" },
  ]

  return (
    <header className="border-b border-border bg-card sticky top-0 z-50">
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 h-16">
            {/* Logo - Fixed width column */}
            <Link href="/" className="flex items-center h-12">
              <Image
                src="/mus-logo.png"
                alt="MUS"
                width={90}
                height={30}
                className="object-contain h-full w-auto"
                priority
              />
            </Link>

            {/* Search Bar - Flexible center column */}
            <form onSubmit={handleSearch} className="flex justify-center">
              <div className="relative w-full max-w-2xl">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-0 top-0 h-full rounded-l-none"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Icons - Fixed width column */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <CurrencySwitcher />
              </div>
              <div className="hidden sm:block">
                <NotificationsDropdown />
              </div>
              <Link href="/track-order" className="hidden sm:block">
                <Button variant="ghost" size="icon">
                  <MapPinned className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/orders" className="hidden sm:block">
                <Button variant="ghost" size="icon">
                  <Package className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/wishlist" className="hidden sm:block">
                <Button variant="ghost" size="icon" className="relative">
                  <Heart className="h-5 w-5" />
                  {mounted && wishlistItems > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full">
                      {wishlistItems}
                    </span>
                  )}
                </Button>
              </Link>

              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="hidden sm:block">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex items-center justify-center p-0 h-10 w-10"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.picture || "/placeholder.svg"}
                          alt={user.name || "User"}
                        />
                        <AvatarFallback>
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/shipping-addresses" className="cursor-pointer">
                        <MapPin className="mr-2 h-4 w-4" />
                        Shipping Addresses
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowAuthModal(true)}
                  className="hidden sm:flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              )}

              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {mounted && totalItems > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>

              <Sheet>
                <SheetTrigger asChild className="sm:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <nav className="flex flex-col gap-4 mt-8">
                    {isAuthenticated && user ? (
                      <>
                        <div className="flex items-center gap-3 pb-4 border-b">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={user.picture || "/placeholder.svg"}
                              alt={user.name || "User"}
                            />
                            <AvatarFallback>
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <Button onClick={() => setShowAuthModal(true)} className="w-full">
                        Sign in
                      </Button>
                    )}
                    <Link href="/" className="text-lg font-medium text-foreground">
                      Home
                    </Link>
                    <Link href="/orders" className="text-lg font-medium text-foreground">
                      Orders
                    </Link>
                    <Link href="/track-order" className="text-lg font-medium text-foreground">
                      Track Order
                    </Link>
                    <Link href="/wishlist" className="text-lg font-medium text-foreground">
                      Wishlist
                    </Link>
                    {isAuthenticated && (
                      <Link href="/shipping-addresses" className="text-lg font-medium text-foreground">
                        Shipping Addresses
                      </Link>
                    )}
                    <Link href="/settings" className="text-lg font-medium text-foreground">
                      Settings
                    </Link>
                    {isAuthenticated && (
                      <Button variant="destructive" onClick={handleLogout} className="w-full mt-4">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-[auto_1fr_auto] gap-4">
            {/* Empty column to match logo width */}
            <div className="w-[44px]" />

            {/* Categories - Centered in middle column to align with search bar */}
            <nav className="flex items-center justify-center gap-4 sm:gap-6 h-10 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            {/* Empty column to match icons width */}
            <div className="w-[200px] hidden sm:block" />
          </div>
        </div>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </header>
  )
}
