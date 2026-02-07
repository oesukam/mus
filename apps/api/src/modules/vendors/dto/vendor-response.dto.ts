import { ApiProperty } from '@nestjs/swagger';
import { Vendor } from '../entities/vendor.entity';

export class VendorResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Acme Supplies Inc.' })
  name: string;

  @ApiProperty({ example: 'supplies@acme.com', required: false })
  email?: string;

  @ApiProperty({ example: '+1-555-0123', required: false })
  phone?: string;

  @ApiProperty({ example: '123 Business St, City, State 12345', required: false })
  address?: string;

  @ApiProperty({ example: 'UNITED_STATES', required: false })
  country?: string;

  @ApiProperty({ example: 'Office supplies and equipment', required: false })
  description?: string;

  @ApiProperty({ example: 'John Smith', required: false })
  contactPerson?: string;

  @ApiProperty({ example: 'TAX123456', required: false })
  taxId?: string;

  @ApiProperty({ example: 'https://acme-supplies.com', required: false })
  website?: string;

  @ApiProperty({ example: 'Payment terms and special notes', required: false })
  notes?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(vendor: Vendor): VendorResponseDto {
    const dto = new VendorResponseDto();
    dto.id = vendor.id;
    dto.name = vendor.name;
    dto.email = vendor.email;
    dto.phone = vendor.phone;
    dto.address = vendor.address;
    dto.country = vendor.country;
    dto.description = vendor.description;
    dto.contactPerson = vendor.contactPerson;
    dto.taxId = vendor.taxId;
    dto.website = vendor.website;
    dto.notes = vendor.notes;
    dto.isActive = vendor.isActive;
    dto.createdAt = vendor.createdAt;
    dto.updatedAt = vendor.updatedAt;
    return dto;
  }
}

export class VendorsResponseDto {
  @ApiProperty({ type: [VendorResponseDto] })
  vendors: VendorResponseDto[];

  @ApiProperty({
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
      hasNextPage: true,
      hasPreviousPage: false,
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
