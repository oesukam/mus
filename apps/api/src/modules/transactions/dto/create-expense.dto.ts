import { IsString, IsNumber, IsOptional, IsEnum, Min, IsDateString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Country } from '../../products/enums/country.enum';
import { Currency } from '../../products/enums/currency.enum';
import { ExpenseCategory } from '../entities/transaction.entity';

export class CreateExpenseDto {
  @ApiProperty({
    example: ExpenseCategory.INVENTORY,
    description: 'Category of the expense',
    enum: ExpenseCategory,
  })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ example: 'Purchase of laptop inventory from Supplier XYZ', description: 'Description of the expense' })
  @IsString()
  description: string;

  @ApiProperty({ example: 5000.00, description: 'Amount of the expense' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    example: Currency.USD,
    description: 'Currency of the expense',
    enum: Currency,
    required: false,
    default: Currency.USD,
  })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiProperty({
    example: Country.UNITED_STATES,
    description: 'Country where the expense was incurred',
    enum: Country,
  })
  @IsEnum(Country)
  country: Country;

  @ApiProperty({ example: '2025-01-15', description: 'Date when the expense was incurred (defaults to today)', required: false })
  @IsDateString()
  @IsOptional()
  transactionDate?: string;

  @ApiProperty({ example: 'Supplier XYZ', description: 'Vendor or supplier name', required: false })
  @IsString()
  @IsOptional()
  vendor?: string;

  @ApiProperty({ example: 'INV-12345', description: 'Invoice or receipt number', required: false })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @ApiProperty({ example: 'https://example.com/receipt.pdf', description: 'Receipt or invoice file URL', required: false })
  @IsUrl()
  @IsOptional()
  receiptUrl?: string;

  @ApiProperty({ example: 'Paid via bank transfer', description: 'Payment method or notes', required: false })
  @IsString()
  @IsOptional()
  paymentNotes?: string;

  @ApiProperty({ example: 'Additional notes about the expense', description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
