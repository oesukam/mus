import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';
import { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';

export class UserResponseDto {
  @ApiProperty({ type: User })
  user: User;
}

export class UsersResponseDto {
  @ApiProperty({ type: [User] })
  users: User[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination information' })
  pagination: PaginationMetaDto;
}

export class UserWithMessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiProperty({ type: User })
  user: User;
}

export class UserMessageResponseDto {
  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;
}
