import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray, IsNumber } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    example: 'seller',
    description: 'Unique role name (lowercase, no spaces)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: 'Seller',
    description: 'Human-readable display name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName: string;

  @ApiProperty({
    example: 'Can manage products and view orders',
    description: 'Description of the role',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of permission IDs to assign to this role',
    required: false,
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  permissionIds?: number[];
}
