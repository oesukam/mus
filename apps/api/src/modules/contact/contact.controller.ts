import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { ContactService } from "./contact.service"
import { CreateContactDto } from "./dto/create-contact.dto"
import { Contact } from "./entities/contact.entity"
import { ContactWithMessageResponseDto } from "./dto/contact-response.dto"
import { Public } from "../auth/decorators/public.decorator"
import { RolesGuard } from "../auth/guards/roles.guard"
import { StrictThrottle } from "../../common/decorators/api-throttle.decorator"

@ApiTags("contact")
@Controller("contact")
@UseGuards(RolesGuard)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @StrictThrottle()
  @Post()
  @ApiOperation({ summary: "Submit a contact message (Public - Users and Guests)" })
  @ApiResponse({
    status: 201,
    description: "Contact message submitted successfully",
    type: ContactWithMessageResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  async create(
    @Body() createContactDto: CreateContactDto,
    @Request() req: any,
  ): Promise<{ message: string; contact: Contact }> {
    // Get userId from authenticated user if available, otherwise null for guest
    const userId = req.user?.id || null
    const contact = await this.contactService.create(createContactDto, userId)
    return {
      message: "Contact message submitted successfully. We will get back to you soon.",
      contact,
    }
  }

}
