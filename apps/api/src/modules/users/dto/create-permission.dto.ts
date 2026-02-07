import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    example: 'users:read',
    description: 'Unique permission name in resource:action format',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'users',
    description: 'Resource this permission applies to',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  resource: string;

  @ApiProperty({
    example: 'read',
    description: 'Action allowed on the resource (read, write, delete, etc.)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  action: string;

  @ApiProperty({
    example: 'View Users',
    description: 'Human-readable display name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName: string;

  @ApiProperty({
    example: 'Allows viewing user information',
    description: 'Description of what this permission allows',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
