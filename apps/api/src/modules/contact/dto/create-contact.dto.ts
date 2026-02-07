import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'John Doe', description: 'Name of the person contacting' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email of the person contacting' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'General Inquiry', description: 'Subject of the message' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @ApiProperty({ example: 'I have a question about your products...', description: 'The message content' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}
