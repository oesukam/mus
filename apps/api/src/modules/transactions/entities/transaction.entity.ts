import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import { ApiProperty } from "@nestjs/swagger"
import { Order } from "../../orders/entities/order.entity"
import { User } from "../../users/entities/user.entity"
import { PaymentMethod } from "../../orders/enums/payment-status.enum"
import { Country } from "../../products/enums/country.enum"
import { Currency } from "../../products/enums/currency.enum"

export enum TransactionType {
  SALE = "sale",
  EXPENSE = "expense",
}

export enum ExpenseCategory {
  INVENTORY = "inventory",
  SHIPPING = "shipping",
  MARKETING = "marketing",
  SALARIES = "salaries",
  RENT = "rent",
  UTILITIES = "utilities",
  EQUIPMENT = "equipment",
  MAINTENANCE = "maintenance",
  SUPPLIES = "supplies",
  INSURANCE = "insurance",
  TAXES = "taxes",
  OTHER = "other",
}

@Entity("transactions")
export class Transaction {
  @ApiProperty({ example: 1, description: "The unique identifier of the transaction" })
  @PrimaryGeneratedColumn()
  id: number

  @ApiProperty({ example: "SAL2501-0000001", description: "Unique transaction reference number" })
  @Column({ unique: true })
  transactionNumber: string

  @ApiProperty({
    example: TransactionType.SALE,
    description: "Type of transaction (sale or expense)",
    enum: TransactionType,
  })
  @Column({
    type: "enum",
    enum: TransactionType,
  })
  type: TransactionType

  @ApiProperty({
    example: 1,
    description: "Order ID if transaction is from an order",
    required: false,
  })
  @Column({ nullable: true })
  orderId: number

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: "orderId" })
  order: Order

  @ApiProperty({
    example: 1,
    description: "User ID (customer for sales, null for expenses)",
    required: false,
  })
  @Column({ nullable: true })
  userId: number

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "userId" })
  user: User

  @ApiProperty({
    example: "John Doe",
    description: "Customer name (for sales without user account)",
    required: false,
  })
  @Column({ nullable: true })
  customerName: string

  @ApiProperty({ example: "john@example.com", description: "Customer email", required: false })
  @Column({ nullable: true })
  customerEmail: string

  @ApiProperty({ example: "+1234567890", description: "Customer phone", required: false })
  @Column({ nullable: true })
  customerPhone: string

  @ApiProperty({
    example: Country.UNITED_STATES,
    description: "Country where the transaction was made",
    enum: Country,
  })
  @Column({
    type: "enum",
    enum: Country,
  })
  country: Country

  // For Sales
  @ApiProperty({
    example: [
      {
        productId: 1,
        productName: "Laptop",
        quantity: 2,
        price: 99.99,
        vatPercentage: 18,
        vatAmount: 17.998,
      },
    ],
    description: "Sale items (only for sales)",
    required: false,
  })
  @Column("jsonb", { nullable: true })
  items: Array<{
    productId?: number
    productName: string
    quantity: number
    price: number
    vatPercentage: number
    vatAmount: number
  }>

  // For Expenses
  @ApiProperty({
    example: ExpenseCategory.INVENTORY,
    description: "Category of expense (only for expenses)",
    enum: ExpenseCategory,
    required: false,
  })
  @Column({
    type: "enum",
    enum: ExpenseCategory,
    nullable: true,
  })
  expenseCategory: ExpenseCategory

  @ApiProperty({
    example: "Purchase of laptop inventory",
    description: "Description (mainly for expenses)",
  })
  @Column("text")
  description: string

  @ApiProperty({ example: "2025-01-15", description: "Date when the transaction occurred" })
  @Column({ type: "date" })
  transactionDate: Date

  @ApiProperty({
    example: 199.98,
    description: "Subtotal amount (excluding VAT, for sales)",
    required: false,
  })
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  subtotal: number

  @ApiProperty({ example: 35.996, description: "Total VAT amount (for sales)", required: false })
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  vatAmount: number

  @ApiProperty({
    example: 235.976,
    description: "Total transaction amount (income for sales, expense for expenses)",
  })
  @Column("decimal", { precision: 10, scale: 2 })
  amount: number

  @ApiProperty({
    example: Currency.USD,
    description: "Currency of the transaction",
    enum: Currency,
  })
  @Column({
    type: "enum",
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency

  @ApiProperty({
    example: PaymentMethod.CREDIT_CARD,
    description: "Payment method used",
    enum: PaymentMethod,
    required: false,
  })
  @Column({
    type: "enum",
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod

  @ApiProperty({
    example: "TXN123456789",
    description: "Payment transaction reference",
    required: false,
  })
  @Column({ nullable: true })
  paymentReference: string

  // For Expenses
  @ApiProperty({
    example: "Supplier XYZ",
    description: "Vendor or supplier name (for expenses)",
    required: false,
  })
  @Column({ nullable: true })
  vendor: string

  @ApiProperty({ example: "INV-12345", description: "Invoice or receipt number", required: false })
  @Column({ nullable: true })
  invoiceNumber: string

  @ApiProperty({
    example: "https://example.com/receipt.pdf",
    description: "Receipt or invoice file URL",
    required: false,
  })
  @Column({ nullable: true })
  receiptUrl: string

  @ApiProperty({ example: "Additional notes", description: "Transaction notes", required: false })
  @Column({ type: "text", nullable: true })
  notes: string

  @ApiProperty({ example: 1, description: "ID of admin who recorded the transaction" })
  @Column({ nullable: true })
  recordedBy: number

  @ManyToOne(() => User)
  @JoinColumn({ name: "recordedBy" })
  recordedByUser: User

  @ApiProperty({ description: "The date and time the transaction was recorded" })
  @CreateDateColumn()
  createdAt: Date

  @ApiProperty({ description: "The last update date of the transaction" })
  @UpdateDateColumn()
  updatedAt: Date
}
