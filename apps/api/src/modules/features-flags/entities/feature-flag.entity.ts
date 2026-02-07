import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum FeatureFlagScope {
  GLOBAL = 'global',
  USER = 'user',
  ROLE = 'role',
  PERCENTAGE = 'percentage',
}

@Entity('features_flags')
export class FeatureFlag {
  @ApiProperty({ example: 1, description: 'The unique identifier of the feature flag' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'new-checkout', description: 'The unique key of the feature flag' })
  @Column({ unique: true })
  key: string;

  @ApiProperty({ example: 'New Checkout Experience', description: 'Display name of the feature flag' })
  @Column()
  displayName: string;

  @ApiProperty({ example: 'Enable the new checkout flow with improved UX', description: 'Description of the feature flag' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: true, description: 'Whether the feature is enabled' })
  @Column({ default: false })
  isEnabled: boolean;

  @ApiProperty({
    example: FeatureFlagScope.GLOBAL,
    description: 'The scope of the feature flag (global, user, role)',
    enum: FeatureFlagScope,
  })
  @Column({
    type: 'enum',
    enum: FeatureFlagScope,
    default: FeatureFlagScope.GLOBAL,
  })
  scope: FeatureFlagScope;

  @ApiProperty({
    example: { userIds: [1, 2, 3], roleNames: ['admin'] },
    description: 'Rules for scoped feature flags (JSON object)',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  rules: Record<string, any>;

  @ApiProperty({
    example: 50,
    description: 'Percentage of users to enable this feature for (0-100). Only used when scope is PERCENTAGE',
    required: false,
  })
  @Column({ type: 'int', nullable: true })
  rolloutPercentage?: number;

  @ApiProperty({ description: 'The creation date of the feature flag' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'The last update date of the feature flag' })
  @UpdateDateColumn()
  updatedAt: Date;
}
