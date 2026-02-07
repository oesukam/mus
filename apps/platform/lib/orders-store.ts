import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Order, OrderStatus } from "./types"

interface OrdersStore {
  orders: Order[]
  addOrder: (order: Order) => void
  getOrderById: (orderId: string) => Order | undefined
  updateOrderStatus: (orderId: string, status: OrderStatus) => void
  getAllOrders: () => Order[]
}

const exampleOrders: Order[] = [
  {
    id: "ORD-1704123456-ABC123",
    items: [
      {
        id: "1",
        name: "Minimalist Watch",
        price: 299.99,
        quantity: 1,
        image: "/minimalist-watch.png",
      },
      {
        id: "3",
        name: "Leather Backpack",
        price: 189.99,
        quantity: 1,
        image: "/brown-leather-backpack.png",
      },
    ],
    total: 489.98,
    status: "delivered",
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    shippingAddress: {
      firstName: "John",
      lastName: "Doe",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      zipCode: "10001",
    },
    email: "john.doe@example.com",
    trackingNumber: "TRK1234567890",
  },
  {
    id: "ORD-1704567890-DEF456",
    items: [
      {
        id: "9",
        name: "The Art of Programming",
        price: 49.99,
        quantity: 2,
        image: "/programming-book.jpg",
      },
      {
        id: "11",
        name: "Cooking Masterclass",
        price: 39.99,
        quantity: 1,
        image: "/cooking-book.jpg",
      },
    ],
    total: 139.97,
    status: "shipped",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    shippingAddress: {
      firstName: "Sarah",
      lastName: "Smith",
      address: "456 Oak Avenue",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90001",
    },
    email: "sarah.smith@example.com",
    trackingNumber: "TRK0987654321",
  },
  {
    id: "ORD-1704890123-GHI789",
    items: [
      {
        id: "4",
        name: "Smart Fitness Tracker",
        price: 129.99,
        quantity: 1,
        image: "/fitness-tracker-lifestyle.png",
      },
    ],
    total: 129.99,
    status: "processing",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    shippingAddress: {
      firstName: "Michael",
      lastName: "Johnson",
      address: "789 Pine Road",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
    },
    email: "michael.j@example.com",
  },
  {
    id: "ORD-1704234567-JKL012",
    items: [
      {
        id: "13",
        name: "Building Blocks Set",
        price: 59.99,
        quantity: 1,
        image: "/building-blocks.jpg",
      },
      {
        id: "14",
        name: "Remote Control Car",
        price: 79.99,
        quantity: 1,
        image: "/rc-car.jpg",
      },
      {
        id: "16",
        name: "Plush Teddy Bear",
        price: 24.99,
        quantity: 2,
        image: "/teddy-bear.jpg",
      },
    ],
    total: 189.96,
    status: "pending",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    shippingAddress: {
      firstName: "Emily",
      lastName: "Brown",
      address: "321 Elm Street",
      city: "Houston",
      state: "TX",
      zipCode: "77001",
    },
    email: "emily.brown@example.com",
  },
]

export const useOrdersStore = create<OrdersStore>()(
  persist(
    (set, get) => ({
      orders: [],
      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders],
        })),
      getOrderById: (orderId) => {
        const { orders } = get()
        return orders.find((order) => order.id === orderId)
      },
      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((order) => (order.id === orderId ? { ...order, status } : order)),
        })),
      getAllOrders: () => {
        const { orders } = get()
        return orders.length > 0 ? orders : exampleOrders
      },
    }),
    {
      name: "orders-storage",
      onRehydrateStorage: () => (state) => {
        if (state && state.orders.length === 0) {
          state.orders = exampleOrders
        }
      },
    },
  ),
)
