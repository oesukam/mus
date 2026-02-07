import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({
    example: 'Important Update',
    description: 'The subject of the email',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    example: 'We wanted to inform you about an important update to your account...',
    description: 'The message body of the email',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(10000)
  message: string;
}
