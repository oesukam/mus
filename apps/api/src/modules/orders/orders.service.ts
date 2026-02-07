import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ChangeDeliveryStatusDto } from './dto/change-delivery-status.dto';
import { MarkOrderAsPaidDto } from './dto/mark-order-as-paid.dto';
import { DeliveryStatus, isValidStatusTransition } from './enums/delivery-status.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { Country } from '../products/enums/country.enum';
import { Currency } from '../products/enums/currency.enum';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { Product } from '../products/entities/product.entity';
import { EmailService } from '../email/email.service';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectDataSource()
    private dataSource: DataSource,
    private emailService: EmailService,
  ) {}

  /**
   * Generate order number in format: COUNTRYYYMM-#######
   * Example: US2501-0000001, RW2501-0000042, KE2512-9999999
   *
   * Uses FOR UPDATE SKIP LOCKED to prevent race conditions in concurrent requests
   */
  private async generateOrderNumber(country: Country, queryRunner): Promise<string> {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${country}${year}${month}-`;

    // Find the latest order number for this country and month with row locking
    // FOR UPDATE locks the row to prevent concurrent access
    const latestOrder = await queryRunner.manager
      .createQueryBuilder(Order, 'order')
      .where('order.orderNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('order.orderNumber', 'DESC')
      .setLock('pessimistic_write') // Equivalent to FOR UPDATE
      .getOne();

    let increment = 1;

    if (latestOrder) {
      // Extract the increment part (last 7 digits) and increment it
      const lastIncrement = parseInt(latestOrder.orderNumber.slice(-7), 10);
      increment = lastIncrement + 1;
    }

    // Format increment with leading zeros (7 digits)
    const incrementStr = String(increment).padStart(7, '0');

    return `${prefix}${incrementStr}`;
  }

  async create(createOrderDto: CreateOrderDto, userId: number | null): Promise<Order> {
    this.logger.log(`Creating order for ${userId ? `user ${userId}` : 'guest user'}`);

    // Validate inventory before creating order
    const productIds = createOrderDto.items.map(item => item.productId);
    const products = await this.productsRepository.findByIds(productIds);

    // Check if all products exist
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(
        `The following products were not found: ${missingIds.join(', ')}`,
      );
    }

    // Create a map of product stock for quick lookup
    const productStockMap = new Map(products.map(p => [p.id, p.stockQuantity]));

    // Validate stock for each item
    const insufficientStockItems: string[] = [];
    for (const item of createOrderDto.items) {
      const availableStock = productStockMap.get(item.productId);
      const product = products.find(p => p.id === item.productId);

      if (availableStock === undefined || availableStock < item.quantity) {
        insufficientStockItems.push(
          `${product?.name || `Product ${item.productId}`} (requested: ${item.quantity}, available: ${availableStock || 0})`,
        );
      }
    }

    if (insufficientStockItems.length > 0) {
      throw new BadRequestException(
        `Insufficient stock for the following items: ${insufficientStockItems.join('; ')}`,
      );
    }

    // Use a transaction to prevent race conditions when generating order numbers
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate order number within transaction with row locking
      const orderNumber = await this.generateOrderNumber(createOrderDto.country, queryRunner);

      // Decrement stock for each product within the transaction
      for (const item of createOrderDto.items) {
        await queryRunner.manager.decrement(
          Product,
          { id: item.productId },
          'stockQuantity',
          item.quantity,
        );

        // Check if product stock is now 0 and update stockStatus
        const updatedProduct = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
        });

        if (updatedProduct && updatedProduct.stockQuantity === 0) {
          await queryRunner.manager.update(
            Product,
            { id: item.productId },
            { stockStatus: 'out_of_stock' as any },
          );
        }
      }

      // Initialize status history with all timeline statuses
      // Only PENDING has timestamp and updatedBy (as it's completed)
      // Others are placeholders for future status changes
      const statusHistory = [
        {
          status: DeliveryStatus.PENDING,
          timestamp: new Date(),
          updatedBy: userId,
          notes: 'Order placed',
        },
        {
          status: DeliveryStatus.PROCESSING,
          timestamp: null,
          updatedBy: null,
          notes: null,
        },
        {
          status: DeliveryStatus.SHIPPED,
          timestamp: null,
          updatedBy: null,
          notes: null,
        },
        {
          status: DeliveryStatus.DELIVERED,
          timestamp: null,
          updatedBy: null,
          notes: null,
        },
      ];

      // Create order
      const order = queryRunner.manager.create(Order, {
        orderNumber,
        country: createOrderDto.country,
        userId,
        items: createOrderDto.items,
        subtotal: createOrderDto.subtotal,
        vatAmount: createOrderDto.vatAmount,
        totalAmount: createOrderDto.totalAmount,
        deliveryStatus: DeliveryStatus.PENDING,
        status: 'pending',
        statusHistory,
        recipientName: createOrderDto.recipientName,
        recipientEmail: createOrderDto.recipientEmail,
        recipientPhone: createOrderDto.recipientPhone,
        shippingAddress: createOrderDto.shippingAddress,
        shippingCity: createOrderDto.shippingCity,
        shippingState: createOrderDto.shippingState,
        shippingZipCode: createOrderDto.shippingZipCode,
        shippingCountry: createOrderDto.shippingCountry,
      });

      // Save order within transaction
      const savedOrder = await queryRunner.manager.save(order);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Send order confirmation email (non-blocking)
      const userName = savedOrder.recipientName || 'Customer';
      if (savedOrder.recipientEmail) {
        this.logger.log(`Sending order confirmation email to ${savedOrder.recipientEmail} for order ${savedOrder.orderNumber}`);
        this.emailService.sendOrderConfirmation(
          savedOrder.recipientEmail,
          userName,
          savedOrder,
        ).then(result => {
          if (result.success && result.messageId) {
            // Save the Message-ID for email threading
            this.ordersRepository.update(savedOrder.id, {
              emailMessageId: result.messageId
            });
            this.logger.log(`✅ Order confirmation email sent and Message-ID saved for order ${savedOrder.orderNumber}`);
          } else if (result.success) {
            this.logger.log(`✅ Order confirmation email sent successfully to ${savedOrder.recipientEmail} for order ${savedOrder.orderNumber}`);
          } else {
            this.logger.warn(`⚠️ Order confirmation email failed to send to ${savedOrder.recipientEmail} for order ${savedOrder.orderNumber}`);
          }
        }).catch(error => {
          this.logger.error(`❌ Failed to send order confirmation email for order ${savedOrder.orderNumber}:`, error);
        });
      } else {
        this.logger.warn(`⚠️ No recipient email provided for order ${savedOrder.orderNumber}. Skipping order confirmation email.`);
      }

      return savedOrder;
    } catch (error) {
      // Rollback transaction on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }

  async findAll(paginationQuery: PaginationQueryDto): Promise<{ orders: Order[]; pagination: PaginationMetaDto }> {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [orders, total] = await this.ordersRepository.findAndCount({
      skip,
      take: limit,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const pagination = new PaginationMetaDto(total, page, limit);
    return { orders, pagination };
  }

  async findOne(id: number): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { orderNumber },
      relations: ['user'],
    });
    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }
    return order;
  }

  async findByUserId(userId: number, paginationQuery: PaginationQueryDto): Promise<{ orders: Order[]; pagination: PaginationMetaDto }> {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [orders, total] = await this.ordersRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const pagination = new PaginationMetaDto(total, page, limit);
    return { orders, pagination };
  }

  async changeDeliveryStatus(
    orderId: number,
    changeStatusDto: ChangeDeliveryStatusDto,
    updatedBy: number,
  ): Promise<Order> {
    const order = await this.findOne(orderId);

    // Store old status for email notification
    const oldStatus = order.deliveryStatus;

    // Validate status transition
    if (!isValidStatusTransition(order.deliveryStatus, changeStatusDto.deliveryStatus)) {
      throw new BadRequestException(
        `Cannot change status from ${order.deliveryStatus} to ${changeStatusDto.deliveryStatus}. Invalid status transition.`,
      );
    }

    // Update delivery status
    order.deliveryStatus = changeStatusDto.deliveryStatus;

    // Update tracking information if provided
    if (changeStatusDto.trackingNumber) {
      order.trackingNumber = changeStatusDto.trackingNumber;
    }

    if (changeStatusDto.carrier) {
      order.carrier = changeStatusDto.carrier;
    }

    if (changeStatusDto.estimatedDeliveryDate) {
      order.estimatedDeliveryDate = new Date(changeStatusDto.estimatedDeliveryDate);
    }

    // Set actual delivery date when status is DELIVERED
    if (changeStatusDto.deliveryStatus === DeliveryStatus.DELIVERED) {
      order.actualDeliveryDate = new Date();
    }

    // Initialize status history if it doesn't exist (shouldn't happen with new orders)
    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    // Update the existing status entry in history
    const statusIndex = order.statusHistory.findIndex(
      (h) => h.status === changeStatusDto.deliveryStatus,
    );

    if (statusIndex !== -1) {
      // Update existing entry
      order.statusHistory[statusIndex] = {
        status: changeStatusDto.deliveryStatus,
        timestamp: new Date(),
        updatedBy,
        notes: changeStatusDto.notes,
      };
    } else {
      // If status doesn't exist in history, add it (for backward compatibility)
      order.statusHistory.push({
        status: changeStatusDto.deliveryStatus,
        timestamp: new Date(),
        updatedBy,
        notes: changeStatusDto.notes,
      });
    }

    // Save and return updated order
    const updatedOrder = await this.ordersRepository.save(order);

    // Send order status update email (non-blocking)
    const userName = updatedOrder.recipientName || 'Customer';
    if (updatedOrder.recipientEmail) {
      this.logger.log(`Sending order status update email to ${updatedOrder.recipientEmail} for order ${updatedOrder.orderNumber}`);
      this.emailService.sendOrderStatusUpdate(
        updatedOrder.recipientEmail,
        userName,
        updatedOrder,
        oldStatus,
        changeStatusDto.deliveryStatus,
      ).then(success => {
        if (success) {
          this.logger.log(`✅ Order status update email sent successfully to ${updatedOrder.recipientEmail} for order ${updatedOrder.orderNumber}`);
        } else {
          this.logger.warn(`⚠️ Order status update email failed to send to ${updatedOrder.recipientEmail} for order ${updatedOrder.orderNumber}`);
        }
      }).catch(error => {
        this.logger.error(`❌ Failed to send order status update email for order ${updatedOrder.orderNumber}:`, error);
      });
    } else {
      this.logger.warn(`⚠️ No recipient email provided for order ${updatedOrder.orderNumber}. Skipping order status update email.`);
    }

    return updatedOrder;
  }

  async addDeliveryNotes(orderId: number, notes: string): Promise<Order> {
    const order = await this.findOne(orderId);
    order.deliveryNotes = notes;
    return this.ordersRepository.save(order);
  }

  async getOrdersByDeliveryStatus(status: DeliveryStatus, paginationQuery: PaginationQueryDto): Promise<{ orders: Order[]; pagination: PaginationMetaDto }> {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [orders, total] = await this.ordersRepository.findAndCount({
      where: { deliveryStatus: status },
      skip,
      take: limit,
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const pagination = new PaginationMetaDto(total, page, limit);
    return { orders, pagination };
  }

  async getOrderTimeline(orderId: number): Promise<{
    orderId: number;
    currentStatus: DeliveryStatus;
    timeline: Array<{
      id: number;
      order: number;
      status: DeliveryStatus;
      label: string;
      timestamp?: Date;
      isCompleted: boolean;
      isCurrent: boolean;
      notes?: string;
    }>;
  }> {
    const order = await this.findOne(orderId);

    // Define the standard timeline with explicit ordering
    const standardTimeline = [
      { order: 1, status: DeliveryStatus.PENDING, label: 'Order Placed' },
      { order: 2, status: DeliveryStatus.PROCESSING, label: 'Processing' },
      { order: 3, status: DeliveryStatus.SHIPPED, label: 'Shipped' },
      { order: 4, status: DeliveryStatus.DELIVERED, label: 'Delivered' },
    ];

    // Build timeline with completion status
    const timeline = standardTimeline.map((step, index) => {
      // Find if this status exists in history
      const historyEntry = order.statusHistory?.find((h) => h.status === step.status);

      return {
        id: index + 1,
        order: step.order,
        status: step.status,
        label: step.label,
        timestamp: historyEntry?.timestamp,
        // A status is completed if it has a timestamp (not null)
        isCompleted: !!historyEntry?.timestamp,
        isCurrent: order.deliveryStatus === step.status,
        notes: historyEntry?.notes,
      };
    });

    return {
      orderId: order.id,
      currentStatus: order.deliveryStatus,
      timeline,
    };
  }

  /**
   * Generate transaction number in format: TYPE-COUNTRYYYMM-#######
   * Example: SAL-US2501-0000001, EXP-RW2501-0000042
   */
  private async generateTransactionNumber(type: TransactionType, country: Country, queryRunner): Promise<string> {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const typePrefix = type === TransactionType.SALE ? 'SAL' : 'EXP';
    const prefix = `${typePrefix}-${country}${year}${month}-`;

    const latestTransaction = await queryRunner.manager
      .createQueryBuilder(Transaction, 'transaction')
      .where('transaction.transactionNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('transaction.transactionNumber', 'DESC')
      .setLock('pessimistic_write')
      .getOne();

    let increment = 1;
    if (latestTransaction) {
      const lastIncrement = parseInt(latestTransaction.transactionNumber.slice(-7), 10);
      increment = lastIncrement + 1;
    }

    const incrementStr = String(increment).padStart(7, '0');
    return `${prefix}${incrementStr}`;
  }

  async markAsPaid(
    orderId: number,
    markAsPaidDto: MarkOrderAsPaidDto,
    adminUserId: number,
  ): Promise<{ order: Order; transaction: Transaction }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find order with user details
      const order = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
        relations: ['user'],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${orderId} not found`);
      }

      if (order.paymentStatus === PaymentStatus.PAID) {
        throw new BadRequestException('Order is already marked as paid');
      }

      // Update order payment status
      order.paymentStatus = PaymentStatus.PAID;
      order.paymentMethod = markAsPaidDto.paymentMethod;
      order.paymentReference = markAsPaidDto.paymentReference;
      order.paymentNotes = markAsPaidDto.paymentNotes;
      order.paidAt = new Date();

      await queryRunner.manager.save(Order, order);

      // Create transaction (sale) record
      const transactionNumber = await this.generateTransactionNumber(
        TransactionType.SALE,
        order.country,
        queryRunner,
      );

      const transaction = queryRunner.manager.create(Transaction, {
        transactionNumber,
        type: TransactionType.SALE,
        orderId: order.id,
        userId: order.userId,
        customerEmail: order.user?.email,
        country: order.country,
        items: order.items,
        transactionDate: new Date(),
        subtotal: order.subtotal,
        vatAmount: order.vatAmount,
        amount: order.totalAmount,
        currency: this.getCurrencyForCountry(order.country),
        paymentMethod: markAsPaidDto.paymentMethod,
        paymentReference: markAsPaidDto.paymentReference,
        description: `Payment for order ${order.orderNumber}`,
        notes: markAsPaidDto.paymentNotes,
        recordedBy: adminUserId,
      });

      await queryRunner.manager.save(Transaction, transaction);

      // Commit transaction
      await queryRunner.commitTransaction();

      // Send payment confirmation email to user
      if (order.user?.email) {
        try {
          await this.emailService.sendPaymentConfirmation(
            order.user.email,
            order.user.name || 'Customer',
            order,
            transaction,
          );
        } catch (emailError) {
          console.error('Failed to send payment confirmation email:', emailError);
          // Don't fail the entire operation if email fails
        }
      }

      return { order, transaction };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private getCurrencyForCountry(country: Country): Currency {
    const currencyMap: Partial<Record<Country, Currency>> = {
      [Country.RWANDA]: Currency.RWF,
      [Country.DEMOCRATIC_REPUBLIC_OF_CONGO]: Currency.CDF,
      [Country.UNITED_STATES]: Currency.USD,
      [Country.CANADA]: Currency.CAD,
      [Country.UNITED_KINGDOM]: Currency.GBP,
      [Country.GERMANY]: Currency.EUR,
      [Country.FRANCE]: Currency.EUR,
    };
    return currencyMap[country] || Currency.USD;
  }

  /**
   * Track order by order number with email or phone verification
   * Public endpoint - no authentication required
   */
  async trackOrder(orderNumber: string, email?: string, phone?: string): Promise<{
    order: Order;
    timeline: Array<{
      id: number;
      order: number;
      status: DeliveryStatus;
      label: string;
      timestamp?: Date;
      isCompleted: boolean;
      isCurrent: boolean;
      notes?: string;
    }>;
  }> {
    // Validate that at least one verification method is provided
    if (!email && !phone) {
      throw new BadRequestException('Either email or phone number is required to track the order');
    }

    // Find order by order number
    const order = await this.ordersRepository.findOne({
      where: { orderNumber },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with number ${orderNumber} not found`);
    }

    // Verify email or phone matches the order
    const emailMatches = email && order.recipientEmail?.toLowerCase() === email.toLowerCase();
    const phoneMatches = phone && order.recipientPhone === phone;

    if (!emailMatches && !phoneMatches) {
      throw new BadRequestException('The provided email or phone number does not match our records for this order');
    }

    // Get order timeline
    const timelineData = await this.getOrderTimeline(order.id);

    return {
      order,
      timeline: timelineData.timeline,
    };
  }
}
