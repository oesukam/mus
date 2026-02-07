import { ApiProperty } from '@nestjs/swagger';
import { Contact } from '../entities/contact.entity';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

export class ContactResponseDto {
  @ApiProperty({ type: Contact })
  contact: Contact;
}

export class ContactsResponseDto {
  @ApiProperty({ type: [Contact] })
  contacts: Contact[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination information' })
  pagination: PaginationMetaDto;
}

export class ContactWithMessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ type: Contact })
  contact: Contact;
}

export class ContactMessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}
