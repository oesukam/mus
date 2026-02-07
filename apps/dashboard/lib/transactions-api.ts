/**
 * Transactions API client
 * Handles financial transaction operations for admin dashboard
 */

import { apiClient } from "./api-client"

// Enums
export enum TransactionType {
  SALE = "SALE",
  EXPENSE = "EXPENSE",
}

export enum ExpenseCategory {
  INVENTORY = "INVENTORY",
  SHIPPING = "SHIPPING",
  MARKETING = "MARKETING",
  SALARIES = "SALARIES",
  RENT = "RENT",
  UTILITIES = "UTILITIES",
  EQUIPMENT = "EQUIPMENT",
  MAINTENANCE = "MAINTENANCE",
  SUPPLIES = "SUPPLIES",
  INSURANCE = "INSURANCE",
  TAXES = "TAXES",
  OTHER = "OTHER",
}

export enum PaymentMethod {
  CASH = "cash",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  MOBILE_MONEY = "mobile_money",
  BANK_TRANSFER = "bank_transfer",
  OTHER = "other",
}

export interface TransactionItem {
  productId: number
  productName: string
  quantity: number
  price: number
  vatPercentage: number
  vatAmount: number
}

export interface Transaction {
  id: number
  transactionNumber: string
  type: TransactionType
  country: string
  userId?: number
  user?: {
    id: number
    email: string
    firstName?: string
    lastName?: string
  }
  orderId?: number
  order?: any
  // Sale fields
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  items?: TransactionItem[]
  subtotal?: number
  vatAmount?: number
  // Expense fields
  category?: ExpenseCategory
  description?: string
  vendor?: string
  invoiceNumber?: string
  receiptUrl?: string
  paymentNotes?: string
  // Common fields
  amount: number
  currency: string
  paymentMethod?: PaymentMethod
  paymentReference?: string
  transactionDate: string
  notes?: string
  recordedBy: number
  recordedByUser?: {
    id: number
    email: string
    firstName?: string
    lastName?: string
  }
  createdAt: string
  updatedAt: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface TransactionsResponse {
  transactions: Transaction[]
  pagination: PaginationMeta
}

export interface FinancialSummary {
  totalSales: number
  totalExpenses: number
  netProfit: number
  salesCount: number
  expensesCount: number
  currency: string
}

export interface CreateSaleDto {
  userId?: number
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  country: string
  items: TransactionItem[]
  subtotal: number
  vatAmount: number
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  paymentReference?: string
  transactionDate?: string
  notes?: string
}

export interface CreateExpenseDto {
  category: ExpenseCategory
  description: string
  amount: number
  currency: string
  country: string
  transactionDate?: string
  vendor?: string
  invoiceNumber?: string
  receiptUrl?: string
  paymentNotes?: string
  notes?: string
}

export const transactionsApi = {
  /**
   * Get all transactions with pagination and filtering
   */
  async getTransactions(params?: {
    page?: number
    limit?: number
    type?: TransactionType
    country?: string
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: "asc" | "desc"
  }): Promise<TransactionsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append("page", params.page.toString())
    if (params?.limit) queryParams.append("limit", params.limit.toString())
    if (params?.type) queryParams.append("type", params.type)
    if (params?.country) queryParams.append("country", params.country)
    if (params?.startDate) queryParams.append("startDate", params.startDate)
    if (params?.endDate) queryParams.append("endDate", params.endDate)
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy)
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder)

    const url = `/api/v1/admin/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    return apiClient.get<TransactionsResponse>(url)
  },

  /**
   * Get financial summary
   */
  async getSummary(params?: {
    country?: string
    startDate?: string
    endDate?: string
  }): Promise<FinancialSummary> {
    const queryParams = new URLSearchParams()
    if (params?.country) queryParams.append("country", params.country)
    if (params?.startDate) queryParams.append("startDate", params.startDate)
    if (params?.endDate) queryParams.append("endDate", params.endDate)

    const url = `/api/v1/admin/transactions/summary${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    return apiClient.get<FinancialSummary>(url)
  },

  /**
   * Get a single transaction by ID
   */
  async getTransaction(id: number): Promise<{ transaction: Transaction }> {
    return apiClient.get<{ transaction: Transaction }>(`/api/v1/admin/transactions/${id}`)
  },

  /**
   * Get transaction by transaction number
   */
  async getTransactionByNumber(transactionNumber: string): Promise<{ transaction: Transaction }> {
    return apiClient.get<{ transaction: Transaction }>(
      `/api/v1/admin/transactions/number/${transactionNumber}`,
    )
  },

  /**
   * Create a manual sale transaction
   */
  async createSale(data: CreateSaleDto): Promise<{ transaction: Transaction }> {
    return apiClient.post<{ transaction: Transaction }>("/api/v1/admin/transactions/sales", data)
  },

  /**
   * Create an expense transaction
   */
  async createExpense(data: CreateExpenseDto): Promise<{ transaction: Transaction }> {
    return apiClient.post<{ transaction: Transaction }>("/api/v1/admin/transactions/expenses", data)
  },

  /**
   * Delete a transaction
   */
  async deleteTransaction(id: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/api/v1/admin/transactions/${id}`)
  },
}
