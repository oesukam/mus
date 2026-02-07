import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { ContactService } from "./contact.service"
import { Contact } from "./entities/contact.entity"
import { ReplyContactDto } from "./dto/reply-contact.dto"
import {
  ContactResponseDto,
  ContactsResponseDto,
  ContactWithMessageResponseDto,
  ContactMessageResponseDto,
} from "./dto/contact-response.dto"
import { PaginationQueryDto } from "../../common/dto/pagination-query.dto"
import { RolesGuard } from "../auth/guards/roles.guard"
import { Roles } from "../auth/decorators/roles.decorator"

@ApiTags("admin / contact")
@Controller("admin/contact")
@UseGuards(RolesGuard)
@Roles("admin")
@ApiBearerAuth()
export class ContactAdminController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @ApiOperation({ summary: "Get all contact messages (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Contact messages retrieved successfully",
    type: ContactsResponseDto,
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    return await this.contactService.findAll(paginationQuery)
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a contact message by ID (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Contact message retrieved successfully",
    type: ContactResponseDto,
  })
  @ApiResponse({ status: 404, description: "Contact message not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async findOne(@Param("id") id: string): Promise<{ contact: Contact }> {
    const contact = await this.contactService.findOne(+id)
    return { contact }
  }

  @Post(":id/reply")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reply to a contact message (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Reply sent successfully",
    type: ContactWithMessageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Contact message not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async reply(
    @Param("id") id: string,
    @Body() replyContactDto: ReplyContactDto,
    @Request() req: any,
  ): Promise<{ message: string; contact: Contact }> {
    const contact = await this.contactService.reply(+id, replyContactDto, req.user.id)
    return {
      message: "Reply sent successfully",
      contact,
    }
  }

  @Patch(":id/close")
  @ApiOperation({ summary: "Close a contact message (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Contact message closed successfully",
    type: ContactWithMessageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Contact message not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async close(@Param("id") id: string): Promise<{ message: string; contact: Contact }> {
    const contact = await this.contactService.close(+id)
    return {
      message: "Contact message closed successfully",
      contact,
    }
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete a contact message (Admin only)" })
  @ApiResponse({
    status: 200,
    description: "Contact message deleted successfully",
    type: ContactMessageResponseDto,
  })
  @ApiResponse({ status: 404, description: "Contact message not found" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async remove(@Param("id") id: string): Promise<{ message: string }> {
    await this.contactService.delete(+id)
    return { message: "Contact message deleted successfully" }
  }
}
