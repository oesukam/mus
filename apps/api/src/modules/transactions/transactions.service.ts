import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { TransactionsQueryDto } from './dto/transactions-query.dto';
import { Country } from '../products/enums/country.enum';
import { Currency } from '../products/enums/currency.enum';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  /**
   * Generate transaction number in format: TYPE-COUNTRYYYMM-#######
   * Example: SAL-US2501-0000001, EXP-RW2501-0000042
   */
  private async generateTransactionNumber(
    type: TransactionType,
    country: Country,
    queryRunner,
  ): Promise<string> {
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

  async createSale(createSaleDto: CreateSaleDto, adminUserId: number): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transactionNumber = await this.generateTransactionNumber(
        TransactionType.SALE,
        createSaleDto.country,
        queryRunner,
      );

      const transaction = queryRunner.manager.create(Transaction, {
        transactionNumber,
        type: TransactionType.SALE,
        orderId: null, // Manual sale, no order
        userId: createSaleDto.userId,
        customerName: createSaleDto.customerName,
        customerEmail: createSaleDto.customerEmail,
        customerPhone: createSaleDto.customerPhone,
        country: createSaleDto.country,
        items: createSaleDto.items,
        transactionDate: createSaleDto.transactionDate
          ? new Date(createSaleDto.transactionDate)
          : new Date(),
        subtotal: createSaleDto.subtotal,
        vatAmount: createSaleDto.vatAmount,
        amount: createSaleDto.amount,
        currency: createSaleDto.currency || Currency.USD,
        paymentMethod: createSaleDto.paymentMethod,
        paymentReference: createSaleDto.paymentReference,
        description: `Manual sale - ${createSaleDto.items.length} item(s)`,
        notes: createSaleDto.notes,
        recordedBy: adminUserId,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createExpense(createExpenseDto: CreateExpenseDto, adminUserId: number): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transactionNumber = await this.generateTransactionNumber(
        TransactionType.EXPENSE,
        createExpenseDto.country,
        queryRunner,
      );

      const transaction = queryRunner.manager.create(Transaction, {
        transactionNumber,
        type: TransactionType.EXPENSE,
        orderId: null,
        userId: null,
        customerName: null,
        customerEmail: null,
        customerPhone: null,
        country: createExpenseDto.country,
        items: null, // Expenses don't have items
        expenseCategory: createExpenseDto.category,
        transactionDate: createExpenseDto.transactionDate
          ? new Date(createExpenseDto.transactionDate)
          : new Date(),
        subtotal: null,
        vatAmount: 0,
        amount: createExpenseDto.amount,
        currency: createExpenseDto.currency || Currency.USD,
        paymentMethod: null,
        paymentReference: null,
        description: createExpenseDto.description,
        vendor: createExpenseDto.vendor,
        invoiceNumber: createExpenseDto.invoiceNumber,
        receiptUrl: createExpenseDto.receiptUrl,
        notes: createExpenseDto.notes,
        recordedBy: adminUserId,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return savedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(queryDto: TransactionsQueryDto): Promise<{ transactions: Transaction[]; pagination: PaginationMetaDto }> {
    const {
      page = 1,
      limit = 10,
      type,
      country,
      startDate,
      endDate,
      sortBy = 'transactionDate',
      sortOrder = 'desc'
    } = queryDto;

    const skip = (page - 1) * limit;

    const query = this.transactionsRepository.createQueryBuilder('transaction');

    // Type filter
    if (type) {
      query.andWhere('transaction.type = :type', { type });
    }

    // Country filter
    if (country) {
      query.andWhere('transaction.country = :country', { country });
    }

    // Date range filter
    if (startDate) {
      query.andWhere('transaction.transactionDate >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('transaction.transactionDate <= :endDate', { endDate });
    }

    // Dynamic sorting
    const allowedSortFields = [
      'transactionDate',
      'amount',
      'type',
      'country',
      'createdAt',
      'transactionNumber'
    ];

    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'transactionDate';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query.orderBy(`transaction.${sortField}`, order);

    // Secondary sort by createdAt for consistency
    if (sortField !== 'createdAt') {
      query.addOrderBy('transaction.createdAt', 'DESC');
    }

    query.skip(skip);
    query.take(limit);

    const [transactions, total] = await query.getManyAndCount();

    const pagination = new PaginationMetaDto(total, page, limit);
    return { transactions, pagination };
  }

  async findOne(id: number): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['user', 'order', 'recordedByUser'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async findByTransactionNumber(transactionNumber: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { transactionNumber },
      relations: ['user', 'order', 'recordedByUser'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionNumber} not found`);
    }

    return transaction;
  }

  async getSummary(
    country?: Country,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalSales: number;
    totalExpenses: number;
    netProfit: number;
    salesCount: number;
    expensesCount: number;
  }> {
    const query = this.transactionsRepository.createQueryBuilder('transaction');

    if (country) {
      query.andWhere('transaction.country = :country', { country });
    }

    if (startDate && endDate) {
      query.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const transactions = await query.getMany();

    const sales = transactions.filter((t) => t.type === TransactionType.SALE);
    const expenses = transactions.filter((t) => t.type === TransactionType.EXPENSE);

    const totalSales = sales.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    return {
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      salesCount: sales.length,
      expensesCount: expenses.length,
    };
  }

  async delete(id: number): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionsRepository.remove(transaction);
  }
}
