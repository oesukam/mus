import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { UserStatus } from './enums/user-status.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private emailService: EmailService,
  ) {}

  async findAll(paginationQuery: PaginationQueryDto): Promise<{ users: User[]; pagination: PaginationMetaDto }> {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const pagination = new PaginationMetaDto(total, page, limit);
    return { users, pagination };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.findOne(userId);

    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateProfileDto.email);
      if (existingUser) {
        throw new ConflictException('Email is already in use by another account');
      }
    }

    // Update only provided fields
    if (updateProfileDto.name !== undefined) {
      user.name = updateProfileDto.name;
    }
    if (updateProfileDto.email !== undefined) {
      user.email = updateProfileDto.email;
    }
    if (updateProfileDto.picture !== undefined) {
      user.picture = updateProfileDto.picture;
    }

    return this.usersRepository.save(user);
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.findOne(userId);

    // Check if user has a password (local provider)
    if (!user.password) {
      throw new BadRequestException('Cannot change password for OAuth users');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    user.password = hashedPassword;

    await this.usersRepository.save(user);
  }

  async suspendUser(userId: number): Promise<User> {
    const user = await this.findOne(userId);

    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException('User is already suspended');
    }

    user.status = UserStatus.SUSPENDED;
    return this.usersRepository.save(user);
  }

  async reactivateUser(userId: number): Promise<User> {
    const user = await this.findOne(userId);

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User is already active');
    }

    user.status = UserStatus.ACTIVE;
    return this.usersRepository.save(user);
  }

  async getSettings(userId: number): Promise<any> {
    const user = await this.findOne(userId);

    return {
      notifications: {
        orderUpdates: user.notificationsOrderUpdates,
        promotions: user.notificationsPromotions,
        wishlistAlerts: user.notificationsWishlistAlerts,
        newsletter: user.notificationsNewsletter,
      },
      privacy: {
        showProfile: user.privacyShowProfile,
        shareData: user.privacyShareData,
      },
      preferences: {
        currency: user.preferencesCurrency,
        language: user.preferencesLanguage,
      },
    };
  }

  async updateSettings(userId: number, updateSettingsDto: UpdateSettingsDto): Promise<any> {
    const user = await this.findOne(userId);

    // Update notification settings
    if (updateSettingsDto.notifications) {
      if (updateSettingsDto.notifications.orderUpdates !== undefined) {
        user.notificationsOrderUpdates = updateSettingsDto.notifications.orderUpdates;
      }
      if (updateSettingsDto.notifications.promotions !== undefined) {
        user.notificationsPromotions = updateSettingsDto.notifications.promotions;
      }
      if (updateSettingsDto.notifications.wishlistAlerts !== undefined) {
        user.notificationsWishlistAlerts = updateSettingsDto.notifications.wishlistAlerts;
      }
      if (updateSettingsDto.notifications.newsletter !== undefined) {
        user.notificationsNewsletter = updateSettingsDto.notifications.newsletter;
      }
    }

    // Update privacy settings
    if (updateSettingsDto.privacy) {
      if (updateSettingsDto.privacy.showProfile !== undefined) {
        user.privacyShowProfile = updateSettingsDto.privacy.showProfile;
      }
      if (updateSettingsDto.privacy.shareData !== undefined) {
        user.privacyShareData = updateSettingsDto.privacy.shareData;
      }
    }

    // Update preferences
    if (updateSettingsDto.preferences) {
      if (updateSettingsDto.preferences.currency !== undefined) {
        user.preferencesCurrency = updateSettingsDto.preferences.currency;
      }
      if (updateSettingsDto.preferences.language !== undefined) {
        user.preferencesLanguage = updateSettingsDto.preferences.language;
      }
    }

    await this.usersRepository.save(user);

    return {
      notifications: {
        orderUpdates: user.notificationsOrderUpdates,
        promotions: user.notificationsPromotions,
        wishlistAlerts: user.notificationsWishlistAlerts,
        newsletter: user.notificationsNewsletter,
      },
      privacy: {
        showProfile: user.privacyShowProfile,
        shareData: user.privacyShareData,
      },
      preferences: {
        currency: user.preferencesCurrency,
        language: user.preferencesLanguage,
      },
    };
  }

  async assignRoles(userId: number, assignRolesDto: AssignRolesDto): Promise<User> {
    const user = await this.findOne(userId);

    const roles = await this.rolesRepository.find({
      where: { id: In(assignRolesDto.roleIds) },
    });

    if (roles.length !== assignRolesDto.roleIds.length) {
      throw new NotFoundException('One or more roles not found');
    }

    user.roles = roles;
    return await this.usersRepository.save(user);
  }

  async removeRoles(userId: number, roleIds: number[]): Promise<User> {
    const user = await this.findOne(userId);

    user.roles = user.roles.filter((role) => !roleIds.includes(role.id));

    return await this.usersRepository.save(user);
  }

  async sendEmailToUser(userId: number, sendEmailDto: SendEmailDto): Promise<boolean> {
    const user = await this.findOne(userId);

    const emailSent = await this.emailService.sendAdminMessageToUser(
      user.email,
      user.name,
      sendEmailDto.subject,
      sendEmailDto.message,
    );

    if (!emailSent) {
      throw new BadRequestException('Failed to send email. Please check email service configuration.');
    }

    return emailSent;
  }
}
