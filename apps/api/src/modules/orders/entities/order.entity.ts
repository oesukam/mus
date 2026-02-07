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
import { User } from "../../users/entities/user.entity"
import { DeliveryStatus } from "../enums/delivery-status.enum"
import { PaymentStatus, PaymentMethod } from "../enums/payment-status.enum"
import { Country } from "../../products/enums/country.enum"

@Entity("orders")
export class Order {
  @ApiProperty({ example: 1, description: "The unique identifier of the order" })
  @PrimaryGeneratedColumn()
  id: number

  @ApiProperty({
    example: "US2501-0000001",
    description: "Unique order number in format COUNTRYYYMM-####### (e.g., US2501-0000001)",
  })
  @Column({ unique: true })
  orderNumber: string

  @ApiProperty({
    example: Country.UNITED_STATES,
    description: "Country where the order was placed",
    enum: Country,
  })
  @Column({
    type: "enum",
    enum: Country,
  })
  country: Country

  @ApiProperty({
    example: 1,
    description: "The ID of the user who placed the order (nullable for guest checkouts)",
    required: false,
  })
  @Column({ nullable: true })
  userId: number

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User

  @ApiProperty({ example: "John Doe", description: "Recipient full name", required: false })
  @Column({ nullable: true })
  recipientName: string

  @ApiProperty({ example: "john@example.com", description: "Recipient email address" })
  @Column()
  recipientEmail: string

  @ApiProperty({ example: "+1234567890", description: "Recipient phone number", required: false })
  @Column({ nullable: true })
  recipientPhone: string

  @ApiProperty({ example: "123 Main St, Apt 4B", description: "Shipping address" })
  @Column({ type: "text" })
  shippingAddress: string

  @ApiProperty({ example: "New York", description: "Shipping city" })
  @Column()
  shippingCity: string

  @ApiProperty({ example: "NY", description: "Shipping state/province", required: false })
  @Column({ nullable: true })
  shippingState: string

  @ApiProperty({ example: "10001", description: "Shipping ZIP/postal code", required: false })
  @Column({ nullable: true })
  shippingZipCode: string

  @ApiProperty({ example: "United States", description: "Shipping country name" })
  @Column()
  shippingCountry: string

  @ApiProperty({
    example: "PENDING",
    description: "The status of the order (deprecated - use deliveryStatus)",
  })
  @Column({ default: "PENDING" })
  status: string

  @ApiProperty({
    example: DeliveryStatus.PENDING,
    description: "The delivery status of the order",
    enum: DeliveryStatus,
  })
  @Column({
    type: "enum",
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  deliveryStatus: DeliveryStatus

  @ApiProperty({ example: 169.49, description: "Subtotal amount (excluding VAT)" })
  @Column("decimal", { precision: 10, scale: 2 })
  subtotal: number

  @ApiProperty({ example: 30.51, description: "Total VAT amount" })
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  vatAmount: number

  @ApiProperty({ example: 199.99, description: "The total amount of the order (including VAT)" })
  @Column("decimal", { precision: 10, scale: 2 })
  totalAmount: number

  @ApiProperty({ example: "RWF", description: "Currency code used for this order", required: false })
  @Column({ nullable: true, default: "RWF" })
  currencyCode: string

  @ApiProperty({
    example: [{ productId: 1, quantity: 2, price: 99.99, vatPercentage: 18, vatAmount: 17.998 }],
    description: "Order items with VAT details",
  })
  @Column("jsonb")
  items: Array<{
    productId: number
    quantity: number
    price: number
    vatPercentage: number
    vatAmount: number
  }>

  @ApiProperty({
    example: PaymentStatus.PENDING,
    description: "Payment status of the order",
    enum: PaymentStatus,
  })
  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus

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
    example: "2025-01-15T14:30:00Z",
    description: "Payment completion date",
    required: false,
  })
  @Column({ nullable: true })
  paidAt: Date

  @ApiProperty({
    example: "TXN123456789",
    description: "Payment transaction reference",
    required: false,
  })
  @Column({ nullable: true })
  paymentReference: string

  @ApiProperty({
    example: "Payment received via credit card",
    description: "Payment notes",
    required: false,
  })
  @Column({ type: "text", nullable: true })
  paymentNotes: string

  @ApiProperty({
    example: "TRK123456789",
    description: "Tracking number for the shipment",
    required: false,
  })
  @Column({ nullable: true })
  trackingNumber: string

  @ApiProperty({ example: "DHL", description: "Shipping carrier", required: false })
  @Column({ nullable: true })
  carrier: string

  @ApiProperty({
    example: "2024-01-15T10:00:00Z",
    description: "Estimated delivery date",
    required: false,
  })
  @Column({ nullable: true })
  estimatedDeliveryDate: Date

  @ApiProperty({
    example: "2024-01-14T15:30:00Z",
    description: "Actual delivery date",
    required: false,
  })
  @Column({ nullable: true })
  actualDeliveryDate: Date

  @ApiProperty({
    example: "<order-RW2501-0000001@muselemu.com>",
    description: "Email Message-ID for threading order emails",
    required: false,
  })
  @Column({ nullable: true })
  emailMessageId: string

  @ApiProperty({
    example: "Package delivered to front door",
    description: "Delivery notes",
    required: false,
  })
  @Column({ type: "text", nullable: true })
  deliveryNotes: string

  @ApiProperty({ description: "Status change history", required: false })
  @Column({ type: "jsonb", nullable: true })
  statusHistory: Array<{
    status: DeliveryStatus
    timestamp: Date | null
    updatedBy: number | null
    notes?: string | null
  }>

  @ApiProperty({ description: "The creation date of the order" })
  @CreateDateColumn()
  createdAt: Date

  @ApiProperty({ description: "The last update date of the order" })
  @UpdateDateColumn()
  updatedAt: Date
}
