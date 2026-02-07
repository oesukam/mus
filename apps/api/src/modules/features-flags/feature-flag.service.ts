import { Injectable, NotFoundException, ConflictException, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { FeatureFlag, FeatureFlagScope } from "./entities/feature-flag.entity"
import { CreateFeatureFlagDto } from "./dto/create-feature-flag.dto"
import { UpdateFeatureFlagDto } from "./dto/update-feature-flag.dto"
import { User } from "../users/entities/user.entity"

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name)

  constructor(
    @InjectRepository(FeatureFlag)
    private readonly featureFlagsRepository: Repository<FeatureFlag>,
  ) {}

  /**
   * Create a new feature flag
   */
  async create(createFeatureFlagDto: CreateFeatureFlagDto): Promise<FeatureFlag> {
    const existingFlag = await this.featureFlagsRepository.findOne({
      where: { key: createFeatureFlagDto.key },
    })

    if (existingFlag) {
      throw new ConflictException(
        `Feature flag with key "${createFeatureFlagDto.key}" already exists`,
      )
    }

    const featureFlag = this.featureFlagsRepository.create(createFeatureFlagDto)
    const savedFlag = await this.featureFlagsRepository.save(featureFlag)

    this.logger.log(`Feature flag created: ${savedFlag.key} (enabled: ${savedFlag.isEnabled})`)
    return savedFlag
  }

  /**
   * Get all feature flags
   */
  async findAll(): Promise<FeatureFlag[]> {
    return await this.featureFlagsRepository.find({
      order: { createdAt: "DESC" },
    })
  }

  /**
   * Get a single feature flag by ID
   */
  async findOne(id: number): Promise<FeatureFlag> {
    const featureFlag = await this.featureFlagsRepository.findOne({ where: { id } })

    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`)
    }

    return featureFlag
  }

  /**
   * Get a single feature flag by key
   */
  async findByKey(key: string): Promise<FeatureFlag | null> {
    return await this.featureFlagsRepository.findOne({ where: { key } })
  }

  /**
   * Update a feature flag
   */
  async update(id: number, updateFeatureFlagDto: UpdateFeatureFlagDto): Promise<FeatureFlag> {
    const featureFlag = await this.findOne(id)

    // Check if updating key would cause conflict
    if (updateFeatureFlagDto.key && updateFeatureFlagDto.key !== featureFlag.key) {
      const existingFlag = await this.featureFlagsRepository.findOne({
        where: { key: updateFeatureFlagDto.key },
      })

      if (existingFlag) {
        throw new ConflictException(
          `Feature flag with key "${updateFeatureFlagDto.key}" already exists`,
        )
      }
    }

    Object.assign(featureFlag, updateFeatureFlagDto)
    const savedFlag = await this.featureFlagsRepository.save(featureFlag)

    this.logger.log(`Feature flag updated: ${savedFlag.key} (enabled: ${savedFlag.isEnabled})`)
    return savedFlag
  }

  /**
   * Toggle a feature flag on/off
   */
  async toggle(id: number, isEnabled: boolean): Promise<FeatureFlag> {
    const featureFlag = await this.findOne(id)
    featureFlag.isEnabled = isEnabled

    const savedFlag = await this.featureFlagsRepository.save(featureFlag)

    this.logger.log(
      `Feature flag toggled: ${savedFlag.key} -> ${isEnabled ? "enabled" : "disabled"}`,
    )

    return savedFlag
  }

  /**
   * Delete a feature flag
   */
  async remove(id: number): Promise<void> {
    const featureFlag = await this.findOne(id)

    await this.featureFlagsRepository.remove(featureFlag)

    this.logger.log(`Feature flag deleted: ${featureFlag.key}`)
  }

  /**
   * Check if a feature is enabled for a given user
   * This is the main method used by the guard
   */
  async isFeatureEnabled(key: string, user?: User): Promise<boolean> {
    const featureFlag = await this.findByKey(key)

    // If feature flag doesn't exist, default to disabled
    if (!featureFlag) {
      this.logger.warn(`Feature flag "${key}" not found, defaulting to disabled`)
      return false
    }

    // If not enabled globally, return false
    if (!featureFlag.isEnabled) {
      return false
    }

    // If scope is global, return the enabled state
    if (featureFlag.scope === FeatureFlagScope.GLOBAL) {
      return true
    }

    // If scope is not global but no user provided, we can't check
    if (!user) {
      this.logger.warn(`Feature flag "${key}" requires user context but none provided`)
      return false
    }

    // Check user-scoped rules
    if (featureFlag.scope === FeatureFlagScope.USER) {
      return this.checkUserRules(featureFlag, user)
    }

    // Check role-scoped rules
    if (featureFlag.scope === FeatureFlagScope.ROLE) {
      return this.checkRoleRules(featureFlag, user)
    }

    // Check percentage-based rollout
    if (featureFlag.scope === FeatureFlagScope.PERCENTAGE) {
      return this.checkPercentageRollout(featureFlag, user)
    }

    return false
  }

  /**
   * Check if user is in the allowed userIds list
   */
  private checkUserRules(featureFlag: FeatureFlag, user: User): boolean {
    if (!featureFlag.rules || !featureFlag.rules.userIds) {
      return false
    }

    const allowedUserIds = featureFlag.rules.userIds as number[]
    return allowedUserIds.includes(user.id)
  }

  /**
   * Check if user has any of the allowed roles
   */
  private checkRoleRules(featureFlag: FeatureFlag, user: User): boolean {
    if (!featureFlag.rules || !featureFlag.rules.roleNames) {
      return false
    }

    const allowedRoleNames = featureFlag.rules.roleNames as string[]
    const userRoleNames = user.roles?.map((role) => role.name) || []

    return allowedRoleNames.some((roleName) => userRoleNames.includes(roleName))
  }

  /**
   * Check if user falls within the percentage rollout
   * Uses a deterministic hash to ensure consistent rollout for each user
   */
  private checkPercentageRollout(featureFlag: FeatureFlag, user: User): boolean {
    if (!featureFlag.rolloutPercentage || featureFlag.rolloutPercentage <= 0) {
      return false
    }

    if (featureFlag.rolloutPercentage >= 100) {
      return true
    }

    // Create a deterministic hash from user ID and feature flag key
    // This ensures the same user always gets the same result for a flag
    const hashInput = `${user.id}:${featureFlag.key}`
    const hash = this.simpleHash(hashInput)

    // Convert hash to a percentage (0-99)
    const userPercentile = hash % 100

    // User is included if their percentile is less than the rollout percentage
    return userPercentile < featureFlag.rolloutPercentage
  }

  /**
   * Simple hash function for consistent percentage-based rollout
   * Not cryptographically secure, but sufficient for feature flags
   */
  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Get all enabled feature flags for a user
   */
  async getEnabledFeaturesForUser(user?: User): Promise<string[]> {
    const allFlags = await this.findAll()
    const enabledFlags: string[] = []

    for (const flag of allFlags) {
      const isEnabled = await this.isFeatureEnabled(flag.key, user)
      if (isEnabled) {
        enabledFlags.push(flag.key)
      }
    }

    return enabledFlags
  }

  /**
   * Batch check multiple feature flags at once
   * More efficient than individual checks
   */
  async batchCheckFeatures(keys: string[], user?: User): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    // Process all checks in parallel for better performance
    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.isFeatureEnabled(key, user)
      }),
    )

    return results
  }

  /**
   * Seed default feature flags (useful for development/testing)
   */
  async seedDefaultFeatureFlags(): Promise<void> {
    const defaultFlags = [
      {
        key: "new-checkout",
        displayName: "New Checkout Experience",
        description: "Enable the new checkout flow with improved UX",
        isEnabled: false,
        scope: FeatureFlagScope.GLOBAL,
      },
      {
        key: "advanced-analytics",
        displayName: "Advanced Analytics Dashboard",
        description: "Enable advanced analytics features for admin users",
        isEnabled: false,
        scope: FeatureFlagScope.ROLE,
        rules: { roleNames: ["admin"] },
      },
      {
        key: "beta-features",
        displayName: "Beta Features Access",
        description: "Enable access to beta features for selected users",
        isEnabled: false,
        scope: FeatureFlagScope.USER,
        rules: { userIds: [] },
      },
      {
        key: "gradual-rollout-feature",
        displayName: "Gradual Rollout Feature",
        description: "Feature enabled for a percentage of users for gradual rollout",
        isEnabled: false,
        scope: FeatureFlagScope.PERCENTAGE,
        rolloutPercentage: 50,
      },
    ]

    for (const flagData of defaultFlags) {
      const existingFlag = await this.findByKey(flagData.key)
      if (!existingFlag) {
        await this.create(flagData)
        this.logger.log(`Seeded default feature flag: ${flagData.key}`)
      }
    }
  }
}
