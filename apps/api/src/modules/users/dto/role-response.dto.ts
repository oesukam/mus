import { ApiProperty } from '@nestjs/swagger';
import { PermissionResponseDto } from './permission-response.dto';

export class RoleResponseDto {
  @ApiProperty({ example: 1, description: 'Role ID' })
  id: number;

  @ApiProperty({ example: 'admin', description: 'Role name' })
  name: string;

  @ApiProperty({ example: 'Administrator', description: 'Display name' })
  displayName: string;

  @ApiProperty({ example: 'Full system access', description: 'Description' })
  description: string;

  @ApiProperty({ type: [PermissionResponseDto], description: 'Permissions assigned to this role' })
  permissions: PermissionResponseDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update date' })
  updatedAt: Date;
}
