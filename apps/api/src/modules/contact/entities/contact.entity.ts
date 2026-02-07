import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('contacts')
export class Contact {
  @ApiProperty({ example: 1, description: 'The unique identifier of the contact' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'John Doe', description: 'Name of the person contacting' })
  @Column()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Email of the person contacting' })
  @Column()
  email: string;

  @ApiProperty({ example: 'General Inquiry', description: 'Subject of the message' })
  @Column()
  subject: string;

  @ApiProperty({ example: 'I have a question about...', description: 'The message content' })
  @Column('text')
  message: string;

  @ApiProperty({ example: 1, description: 'User ID if authenticated, null if guest', required: false })
  @Column({ nullable: true })
  userId: number;

  @ApiProperty({ example: 'pending', description: 'Status of the contact message' })
  @Column({ default: 'pending' })
  status: string; // pending, replied, closed

  @ApiProperty({ example: 'Thank you for reaching out...', description: 'Admin reply to the message', required: false })
  @Column('text', { nullable: true })
  reply: string;

  @ApiProperty({ description: 'When admin replied to the message', required: false })
  @Column({ nullable: true })
  repliedAt: Date;

  @ApiProperty({ example: 1, description: 'Admin user who replied', required: false })
  @Column({ nullable: true })
  repliedBy: number;

  @ApiProperty({ example: '<message-id@example.com>', description: 'Email message ID for threading', required: false })
  @Column({ nullable: true })
  emailMessageId: string;

  @ApiProperty({ example: '<reply-to-id@example.com>', description: 'In-Reply-To header for email threading', required: false })
  @Column({ nullable: true })
  inReplyTo: string;

  @ApiProperty({ example: '<thread-id@example.com>', description: 'Email thread ID to group related messages', required: false })
  @Column({ nullable: true })
  emailThreadId: string;

  @ApiProperty({ description: 'The creation date of the contact' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'The last update date of the contact' })
  @UpdateDateColumn()
  updatedAt: Date;
}
