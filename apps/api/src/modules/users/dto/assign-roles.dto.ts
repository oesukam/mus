import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    example: [1, 2],
    description: 'Array of role IDs to assign to the user',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  roleIds: number[];
}
