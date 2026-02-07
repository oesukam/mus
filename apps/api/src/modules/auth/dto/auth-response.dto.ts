import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1, description: 'User ID' })
  id: number;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'User name' })
  name: string;

  @ApiProperty({ example: ['customer'], description: 'User roles', type: [String] })
  roles: string[];

  @ApiProperty({ example: 'local', description: 'Authentication provider' })
  provider: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'User profile picture', required: false })
  picture?: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto, description: 'User information' })
  user: UserResponseDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  accessToken: string;
}
