import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ example: 1, description: 'Permission ID' })
  id: number;

  @ApiProperty({ example: 'users:read', description: 'Permission name' })
  name: string;

  @ApiProperty({ example: 'users', description: 'Resource' })
  resource: string;

  @ApiProperty({ example: 'read', description: 'Action' })
  action: string;

  @ApiProperty({ example: 'View Users', description: 'Display name' })
  displayName: string;

  @ApiProperty({ example: 'Allows viewing user information', description: 'Description' })
  description: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updatedAt: Date;
}
