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
import { Exclude } from 'class-transformer';
import { UserStatus } from '../enums/user-status.enum';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @ApiProperty({ example: 1, description: 'The unique identifier of the user' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'john@example.com', description: 'The email of the user' })
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @Column()
  name: string;

  @ApiProperty({ description: 'The roles assigned to the user', type: () => [Role] })
  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'users_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  /**
   * Check if user has a specific role
   */
  hasRole(roleName: string): boolean {
    return this.roles?.some((role) => role.name === roleName) ?? false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roleNames: string[]): boolean {
    return this.roles?.some((role) => roleNames.includes(role.name)) ?? false;
  }

  /**
   * Get all role names
   */
  getRoleNames(): string[] {
    return this.roles?.map((role) => role.name) ?? [];
  }

  /**
   * Check if user has a specific permission (via their roles)
   */
  hasPermission(permissionName: string): boolean {
    return this.roles?.some((role) => role.hasPermission(permissionName)) ?? false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissionNames: string[]): boolean {
    return this.roles?.some((role) => role.hasAnyPermission(permissionNames)) ?? false;
  }

  /**
   * Get all permission names from all user roles
   */
  getPermissionNames(): string[] {
    const permissions = this.roles?.flatMap((role) => role.getPermissionNames()) ?? [];
    return [...new Set(permissions)]; // Remove duplicates
  }

  @ApiProperty({ example: 'local', description: 'The authentication provider' })
  @Column({ default: 'local' })
  provider: string;

  @Column({ nullable: true })
  googleId: string;

  @Column({ nullable: true })
  picture: string;

  @ApiProperty({
    example: UserStatus.ACTIVE,
    description: 'The status of the user',
    enum: UserStatus,
  })
  @Column({
    type: 'varchar',
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ nullable: true })
  @Exclude()
  resetPasswordToken: string;

  @Column({ nullable: true })
  @Exclude()
  resetPasswordExpires: Date;

  // Notification Settings
  @ApiProperty({ example: true, description: 'Receive order update notifications' })
  @Column({ default: true })
  notificationsOrderUpdates: boolean;

  @ApiProperty({ example: true, description: 'Receive promotional notifications' })
  @Column({ default: true })
  notificationsPromotions: boolean;

  @ApiProperty({ example: true, description: 'Receive wishlist alert notifications' })
  @Column({ default: true })
  notificationsWishlistAlerts: boolean;

  @ApiProperty({ example: false, description: 'Subscribe to newsletter' })
  @Column({ default: false })
  notificationsNewsletter: boolean;

  // Privacy Settings
  @ApiProperty({ example: true, description: 'Show profile publicly' })
  @Column({ default: true })
  privacyShowProfile: boolean;

  @ApiProperty({ example: false, description: 'Share analytics data' })
  @Column({ default: false })
  privacyShareData: boolean;

  // Preferences
  @ApiProperty({ example: 'USD', description: 'Preferred currency' })
  @Column({ default: 'USD', length: 10 })
  preferencesCurrency: string;

  @ApiProperty({ example: 'en', description: 'Preferred language' })
  @Column({ default: 'en', length: 10 })
  preferencesLanguage: string;

  @ApiProperty({ description: 'The creation date of the user' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'The last update date of the user' })
  @UpdateDateColumn()
  updatedAt: Date;
}
