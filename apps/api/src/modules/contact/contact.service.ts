import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { ReplyContactDto } from './dto/reply-contact.dto';
import { EmailService } from '../email/email.service';
import { randomBytes } from 'crypto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    private emailService: EmailService,
  ) {}

  /**
   * Generates a unique email message ID for threading
   * Format: <timestamp.random@domain>
   */
  private generateMessageId(domain = 'contact.app'): string {
    const timestamp = Date.now();
    const random = randomBytes(8).toString('hex');
    return `<${timestamp}.${random}@${domain}>`;
  }

  async create(createContactDto: CreateContactDto, userId?: number): Promise<Contact> {
    // Generate a unique message ID for this contact
    const messageId = this.generateMessageId();

    const contact = this.contactRepository.create({
      ...createContactDto,
      userId,
      status: 'pending',
      emailMessageId: messageId,
      emailThreadId: messageId, // Initial message starts the thread
    });

    const savedContact = await this.contactRepository.save(contact);

    // Send email notification to admin about new contact message
    await this.emailService.sendContactNotification(
      savedContact.id,
      savedContact.name,
      savedContact.email,
      savedContact.subject,
      savedContact.message,
      savedContact.emailMessageId,
    );

    return savedContact;
  }

  async findAll(paginationQuery: PaginationQueryDto): Promise<{ contacts: Contact[]; pagination: PaginationMetaDto }> {
    const { page = 1, limit = 10 } = paginationQuery;
    const skip = (page - 1) * limit;

    const [contacts, total] = await this.contactRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const pagination = new PaginationMetaDto(total, page, limit);
    return { contacts, pagination };
  }

  async findOne(id: number): Promise<Contact> {
    const contact = await this.contactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }
    return contact;
  }

  async reply(id: number, replyContactDto: ReplyContactDto, adminId: number): Promise<Contact> {
    const contact = await this.findOne(id);

    // Generate a new message ID for the reply
    const replyMessageId = this.generateMessageId();

    contact.reply = replyContactDto.reply;
    contact.status = 'replied';
    contact.repliedAt = new Date();
    contact.repliedBy = adminId;
    contact.inReplyTo = contact.emailMessageId; // Reply to original message

    const updatedContact = await this.contactRepository.save(contact);

    // Send email to user with admin reply
    await this.emailService.sendContactReply(
      updatedContact.email,
      updatedContact.name,
      updatedContact.subject,
      updatedContact.reply,
      replyMessageId,
      updatedContact.inReplyTo,
      updatedContact.emailThreadId,
    );

    return updatedContact;
  }

  async close(id: number): Promise<Contact> {
    const contact = await this.findOne(id);
    contact.status = 'closed';
    return this.contactRepository.save(contact);
  }

  async delete(id: number): Promise<void> {
    const contact = await this.findOne(id);
    await this.contactRepository.remove(contact);
  }
}
