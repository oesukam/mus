import { IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductImageDto {
  @ApiProperty({ example: 1, description: 'File ID' })
  @IsNumber()
  fileId: number;

  @ApiProperty({ example: 0, description: 'Display order of the image', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  order?: number;

  @ApiProperty({ example: false, description: 'Whether this is the primary image', required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}
