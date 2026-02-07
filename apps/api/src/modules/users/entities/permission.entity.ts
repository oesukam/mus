import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission {
  @ApiProperty({ example: 1, description: 'The unique identifier of the permission' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'users:read', description: 'The unique name of the permission (resource:action format)' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ example: 'users', description: 'The resource this permission applies to' })
  @Column()
  resource: string;

  @ApiProperty({ example: 'read', description: 'The action allowed on the resource' })
  @Column()
  action: string;

  @ApiProperty({ example: 'View Users', description: 'Display name of the permission' })
  @Column()
  displayName: string;

  @ApiProperty({ example: 'Allows viewing user information', description: 'Description of the permission' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Roles that have this permission' })
  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @ApiProperty({ description: 'The creation date of the permission' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'The last update date of the permission' })
  @UpdateDateColumn()
  updatedAt: Date;
}
