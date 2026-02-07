import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReplyContactDto {
  @ApiProperty({ example: 'Thank you for reaching out...', description: 'Reply message from admin' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  reply: string;
}
