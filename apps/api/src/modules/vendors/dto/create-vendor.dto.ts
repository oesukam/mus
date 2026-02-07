import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsEmail,
  IsBoolean,
  IsUrl,
} from 'class-validator';

export class CreateVendorDto {
  @ApiProperty({
    example: 'Acme Supplies Inc.',
    description: 'Vendor company name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'supplies@acme.com',
    description: 'Vendor contact email',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '+1-555-0123',
    description: 'Vendor contact phone',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({
    example: '123 Business St, City, State 12345',
    description: 'Vendor physical address',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 'UNITED_STATES',
    description: 'Vendor country code',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    example: 'Office supplies and equipment',
    description: 'Description of products/services provided',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'John Smith',
    description: 'Primary contact person name',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  contactPerson?: string;

  @ApiProperty({
    example: 'TAX123456',
    description: 'Tax ID or VAT number',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  taxId?: string;

  @ApiProperty({
    example: 'https://acme-supplies.com',
    description: 'Vendor website URL',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiProperty({
    example: 'Payment terms and special notes',
    description: 'Additional notes about the vendor',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the vendor is active',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
