import { Injectable, ConflictException, BadRequestException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import * as bcrypt from "bcryptjs"
import * as crypto from "crypto"
import { User } from "../users/entities/user.entity"
import { SignupDto } from "./dto/signup.dto"
import { ForgotPasswordDto } from "./dto/forgot-password.dto"
import { ResetPasswordDto } from "./dto/reset-password.dto"
import { JwtPayload, GoogleProfile, AuthResponse, UserResponse } from "./types/auth.types"
import { UserStatus } from "../users/enums/user-status.enum"
import { EmailService } from "../email/email.service"
import { ProfileResponseDto } from "./dto/profile-response.dto"

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponse> {
    const { email, password, name } = signupDto

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({ where: { email } })
    if (existingUser) {
      throw new ConflictException("User with this email already exists")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
      provider: "local",
    })

    const savedUser = await this.usersRepository.save(user)

    // Send welcome email
    await this.emailService.sendWelcomeEmail(savedUser.email, savedUser.name)

    // Generate JWT token
    const token = this.generateToken(savedUser)

    return {
      user: this.toUserResponse(savedUser),
      accessToken: token,
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { email, provider: "local" },
      relations: ["roles", "roles.permissions"],
    })

    if (!user || !user.password) {
      return null
    }

    // Check if user is suspended
    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException("Your account has been suspended. Please contact support.")
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return null
    }

    return user
  }

  async login(user: User): Promise<AuthResponse> {
    // Check if user is suspended
    if (user.status === UserStatus.SUSPENDED) {
      throw new BadRequestException("Your account has been suspended. Please contact support.")
    }

    const token = this.generateToken(user)

    return {
      user: this.toUserResponse(user),
      accessToken: token,
    }
  }

  async validateGoogleUser(profile: GoogleProfile): Promise<User> {
    let user = await this.usersRepository.findOne({
      where: { googleId: profile.googleId },
      relations: ["roles", "roles.permissions"],
    })

    if (!user) {
      // Check if user with this email exists (different provider)
      const existingUser = await this.usersRepository.findOne({
        where: { email: profile.email },
        relations: ["roles", "roles.permissions"],
      })

      if (existingUser) {
        // Check if existing user is suspended
        if (existingUser.status === UserStatus.SUSPENDED) {
          throw new BadRequestException("Your account has been suspended. Please contact support.")
        }

        // Update existing user with Google info
        existingUser.googleId = profile.googleId
        existingUser.provider = "google"
        existingUser.picture = profile.picture
        user = await this.usersRepository.save(existingUser)
      } else {
        // Create new user
        const newUser = this.usersRepository.create({
          googleId: profile.googleId,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          provider: "google",
          status: UserStatus.ACTIVE,
        })
        user = await this.usersRepository.save(newUser)
      }

      // Reload user with relations after save
      user = await this.usersRepository.findOne({
        where: { id: user.id },
        relations: ["roles", "roles.permissions"],
      })
    } else {
      // Check if user is suspended
      if (user.status === UserStatus.SUSPENDED) {
        throw new BadRequestException("Your account has been suspended. Please contact support.")
      }
    }

    return user
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.getRoleNames(),
      picture: user.picture,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
    return this.jwtService.sign(payload)
  }

  private toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.getRoleNames(),
      provider: user.provider,
      picture: user.picture,
    }
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken?: string }> {
    const { email } = forgotPasswordDto

    const user = await this.usersRepository.findOne({ where: { email } })
    if (!user) {
      // Don't reveal that user doesn't exist for security reasons
      return {
        message: "If an account with that email exists, a password reset link has been sent",
      }
    }

    // Only allow password reset for local users
    if (user.provider !== "local") {
      throw new BadRequestException("Password reset is only available for local accounts")
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    // Set token expiration (1 hour from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    user.resetPasswordToken = hashedToken
    user.resetPasswordExpires = expiresAt

    await this.usersRepository.save(user)

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.name)

    return {
      message: "If an account with that email exists, a password reset link has been sent",
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex")

    const user = await this.usersRepository.findOne({
      where: {
        resetPasswordToken: hashedToken,
      },
    })

    if (!user) {
      throw new BadRequestException("Invalid or expired password reset token")
    }

    // Check if token has expired
    if (user.resetPasswordExpires < new Date()) {
      throw new BadRequestException("Password reset token has expired")
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword

    // Clear reset token fields
    user.resetPasswordToken = null
    user.resetPasswordExpires = null

    await this.usersRepository.save(user)

    return {
      message: "Password has been reset successfully",
    }
  }

  async getProfile(userId: number): Promise<ProfileResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ["roles", "roles.permissions"],
    })
    console.log(user)
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.getRoleNames(),
        picture: user.picture,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  }
}
