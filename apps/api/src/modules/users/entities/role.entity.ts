import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { Permission } from './permission.entity';

@Entity('roles')
export class Role {
  @ApiProperty({ example: 1, description: 'The unique identifier of the role' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'admin', description: 'The unique name of the role' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ example: 'Administrator', description: 'Display name of the role' })
  @Column()
  displayName: string;

  @ApiProperty({ example: 'Full system access', description: 'Description of the role' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Users with this role' })
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  @ApiProperty({ description: 'Permissions assigned to this role', type: () => [Permission] })
  @ManyToMany(() => Permission, (permission) => permission.roles, { eager: true })
  @JoinTable({
    name: 'roles_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  /**
   * Check if role has a specific permission
   */
  hasPermission(permissionName: string): boolean {
    return this.permissions?.some((permission) => permission.name === permissionName) ?? false;
  }

  /**
   * Check if role has any of the specified permissions
   */
  hasAnyPermission(permissionNames: string[]): boolean {
    return this.permissions?.some((permission) => permissionNames.includes(permission.name)) ?? false;
  }

  /**
   * Get all permission names
   */
  getPermissionNames(): string[] {
    return this.permissions?.map((permission) => permission.name) ?? [];
  }

  @ApiProperty({ description: 'The creation date of the role' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'The last update date of the role' })
  @UpdateDateColumn()
  updatedAt: Date;
}
