import { ApiProperty } from '@nestjs/swagger';
import { Transaction } from '../entities/transaction.entity';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

export class TransactionResponseDto {
  @ApiProperty({ type: Transaction })
  transaction: Transaction;
}

export class TransactionsResponseDto {
  @ApiProperty({ type: [Transaction] })
  transactions: Transaction[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination information' })
  pagination: PaginationMetaDto;
}

export class FinancialSummaryResponseDto {
  @ApiProperty({ example: 10000.00, description: 'Total sales amount' })
  totalSales: number;

  @ApiProperty({ example: 3000.00, description: 'Total expenses amount' })
  totalExpenses: number;

  @ApiProperty({ example: 7000.00, description: 'Net profit' })
  netProfit: number;

  @ApiProperty({ example: 25, description: 'Number of sales transactions' })
  salesCount: number;

  @ApiProperty({ example: 8, description: 'Number of expense transactions' })
  expensesCount: number;
}
