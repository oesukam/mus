import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Res,
  HttpCode,
  HttpStatus,
  Req,
  Query,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from "@nestjs/swagger"
import { AuthService } from "./auth.service"
import { SignupDto } from "./dto/signup.dto"
import { LoginDto } from "./dto/login.dto"
import { ForgotPasswordDto } from "./dto/forgot-password.dto"
import { ResetPasswordDto } from "./dto/reset-password.dto"
import { AuthResponseDto } from "./dto/auth-response.dto"
import { ProfileResponseDto } from "./dto/profile-response.dto"
import { ForgotPasswordResponseDto } from "./dto/forgot-password-response.dto"
import { ResetPasswordResponseDto } from "./dto/reset-password-response.dto"
import { LocalAuthGuard } from "./guards/local-auth.guard"
import { GoogleAuthGuard } from "./guards/google-auth.guard"
import { CurrentUser } from "./decorators/current-user.decorator"
import { Public } from "./decorators/public.decorator"
import { StrictThrottle } from "../../common/decorators/api-throttle.decorator"
import { UserFromJwt, AuthResponse } from "./types/auth.types"
import { User } from "../users/entities/user.entity"
import { Response } from "express"
import { OrdersService } from "../orders/orders.service"
import { ShippingAddressesService } from "../users/shipping-addresses.service"
import { ShippingAddress } from "../users/entities/shipping-address.entity"
import { CreateShippingAddressDto } from "../users/dto/create-shipping-address.dto"
import { UpdateShippingAddressDto } from "../users/dto/update-shipping-address.dto"
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto"

@ApiTags("authentication")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly ordersService: OrdersService,
    private readonly shippingAddressesService: ShippingAddressesService,
  ) {}

  @Public()
  @StrictThrottle()
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User successfully registered", type: AuthResponseDto })
  @ApiResponse({ status: 409, description: "User already exists" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  @Post("signup")
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponse> {
    return await this.authService.signup(signupDto)
  }

  @Public()
  @StrictThrottle()
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({ status: 200, description: "Login successful", type: AuthResponseDto })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  @UseGuards(LocalAuthGuard)
  @Post("login")
  async login(@Body() _loginDto: LoginDto, @CurrentUser() user: User): Promise<AuthResponse> {
    return await this.authService.login(user)
  }

  @Public()
  @ApiOperation({ summary: "Initiate Google OAuth login" })
  @ApiResponse({ status: 302, description: "Redirect to Google OAuth" })
  @Get("google")
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void> {
    // Guard redirects to Google
  }

  @Public()
  @ApiOperation({ summary: "Google OAuth callback" })
  @ApiResponse({ status: 302, description: "Redirect to frontend with token" })
  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    const result = await this.authService.login(user)

    // Get the origin URL from state parameter (set during OAuth initiation)
    const originUrl =
      (user as any).oauthState || process.env.FRONTEND_URL || "http://localhost:3000"

    const redirectUrl = `${originUrl}/auth/callback?token=${result.accessToken}&user=${encodeURIComponent(JSON.stringify(result.user))}`

    res.redirect(redirectUrl)
  }

  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({
    status: 200,
    description: "Returns current user profile",
    type: ProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBearerAuth("JWT-auth")
  @Get("profile")
  async getProfile(@CurrentUser() user: UserFromJwt): Promise<{ user: UserFromJwt }> {
    return this.authService.getProfile(user.id)
  }

  @ApiOperation({ summary: "Get orders for the current authenticated user" })
  @ApiResponse({ status: 200, description: "Orders retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBearerAuth("JWT-auth")
  @Get("orders")
  async getMyOrders(@CurrentUser() user: UserFromJwt, @Query() paginationQuery: PaginationQueryDto) {
    return await this.ordersService.findByUserId(user.id, paginationQuery)
  }

  @Public()
  @StrictThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset" })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent if account exists",
    type: ForgotPasswordResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  @Post("forgot-password")
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string; resetToken?: string }> {
    return await this.authService.forgotPassword(forgotPasswordDto)
  }

  @Public()
  @StrictThrottle()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({
    status: 200,
    description: "Password reset successfully",
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  @Post("reset-password")
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return await this.authService.resetPassword(resetPasswordDto)
  }

  // ============================================================================
  // SHIPPING ADDRESSES ENDPOINTS
  // ============================================================================

  @ApiOperation({ summary: "Get all shipping addresses for current user" })
  @ApiResponse({
    status: 200,
    description: "Shipping addresses retrieved successfully",
    type: [ShippingAddress],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBearerAuth("JWT-auth")
  @Get("shipping-addresses")
  async getShippingAddresses(@CurrentUser() user: UserFromJwt): Promise<{ addresses: ShippingAddress[] }> {
    const addresses = await this.shippingAddressesService.findAllByUserId(user.id)
    return { addresses }
  }

  @ApiOperation({ summary: "Get default shipping address for current user" })
  @ApiResponse({
    status: 200,
    description: "Default shipping address retrieved successfully",
    type: ShippingAddress,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "No default address found" })
  @ApiBearerAuth("JWT-auth")
  @Get("shipping-addresses/default")
  async getDefaultShippingAddress(@CurrentUser() user: UserFromJwt): Promise<{ address: ShippingAddress | null }> {
    const address = await this.shippingAddressesService.findDefaultByUserId(user.id)
    return { address }
  }

  @ApiOperation({ summary: "Get a specific shipping address by ID" })
  @ApiParam({ name: "id", description: "Shipping address ID" })
  @ApiResponse({
    status: 200,
    description: "Shipping address retrieved successfully",
    type: ShippingAddress,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Shipping address not found" })
  @ApiBearerAuth("JWT-auth")
  @Get("shipping-addresses/:id")
  async getShippingAddress(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: UserFromJwt,
  ): Promise<{ address: ShippingAddress }> {
    const address = await this.shippingAddressesService.findOne(id, user.id)
    return { address }
  }

  @ApiOperation({ summary: "Create a new shipping address" })
  @ApiResponse({
    status: 201,
    description: "Shipping address created successfully",
    type: ShippingAddress,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBearerAuth("JWT-auth")
  @Post("shipping-addresses")
  async createShippingAddress(
    @CurrentUser() user: UserFromJwt,
    @Body() createShippingAddressDto: CreateShippingAddressDto,
  ): Promise<{ address: ShippingAddress; message: string }> {
    const address = await this.shippingAddressesService.create(user.id, createShippingAddressDto)
    return {
      address,
      message: "Shipping address created successfully",
    }
  }

  @ApiOperation({ summary: "Update a shipping address" })
  @ApiParam({ name: "id", description: "Shipping address ID" })
  @ApiResponse({
    status: 200,
    description: "Shipping address updated successfully",
    type: ShippingAddress,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Shipping address not found" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiBearerAuth("JWT-auth")
  @Patch("shipping-addresses/:id")
  async updateShippingAddress(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: UserFromJwt,
    @Body() updateShippingAddressDto: UpdateShippingAddressDto,
  ): Promise<{ address: ShippingAddress; message: string }> {
    const address = await this.shippingAddressesService.update(id, user.id, updateShippingAddressDto)
    return {
      address,
      message: "Shipping address updated successfully",
    }
  }

  @ApiOperation({ summary: "Set a shipping address as default" })
  @ApiParam({ name: "id", description: "Shipping address ID" })
  @ApiResponse({
    status: 200,
    description: "Shipping address set as default successfully",
    type: ShippingAddress,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Shipping address not found" })
  @ApiBearerAuth("JWT-auth")
  @Patch("shipping-addresses/:id/set-default")
  async setShippingAddressAsDefault(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: UserFromJwt,
  ): Promise<{ address: ShippingAddress; message: string }> {
    const address = await this.shippingAddressesService.setAsDefault(id, user.id)
    return {
      address,
      message: "Shipping address set as default successfully",
    }
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a shipping address" })
  @ApiParam({ name: "id", description: "Shipping address ID" })
  @ApiResponse({
    status: 200,
    description: "Shipping address deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Shipping address not found" })
  @ApiBearerAuth("JWT-auth")
  @Delete("shipping-addresses/:id")
  async deleteShippingAddress(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: UserFromJwt,
  ): Promise<{ message: string }> {
    await this.shippingAddressesService.remove(id, user.id)
    return {
      message: "Shipping address deleted successfully",
    }
  }
}
