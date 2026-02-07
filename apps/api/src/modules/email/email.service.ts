import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { getEmailTemplate, emailButton, emailInfoBox } from './templates/email-template';

// Currency mapping for email formatting
const CURRENCY_CONFIG = {
  'RWF': { symbol: 'FRw', decimals: 0 },
  'USD': { symbol: '$', decimals: 2 },
  'EUR': { symbol: '€', decimals: 2 },
  'GBP': { symbol: '£', decimals: 2 },
  'KES': { symbol: 'KSh', decimals: 0 },
  'UGX': { symbol: 'USh', decimals: 0 },
  'TZS': { symbol: 'TSh', decimals: 0 },
};

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  // Email threading headers
  messageId?: string;
  inReplyTo?: string;
  references?: string;
}

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;

  constructor(private configService: ConfigService) {
    const resendApiKey = this.configService.get<string>('RESEND_API_KEY');

    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'onboarding@resend.dev');
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME', 'MUS Store');

    if (!resendApiKey) {
      this.logger.warn(
        'Resend API key not configured. Email sending will be disabled. ' +
        'Set RESEND_API_KEY environment variable.',
      );
      return;
    }

    this.resend = new Resend(resendApiKey);
    this.logger.log('Resend email service initialized successfully');
  }

  /**
   * Format money amount with appropriate currency symbol and decimals
   * Examples: formatMoney(1500, 'RWF') -> FRw1,500, formatMoney(99.99, 'USD') -> $99.99
   */
  private formatMoney(amount: number | string, currencyCode: string = 'RWF'): string {
    const num = Number(amount);
    if (isNaN(num)) return `${CURRENCY_CONFIG[currencyCode]?.symbol || 'FRw'}0`;

    const config = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG['RWF'];
    const formatted = num.toFixed(config.decimals);

    // Format with thousands separator
    const parts = formatted.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formattedNumber = parts.join('.');

    return `${config.symbol}${formattedNumber}`;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.resend) {
      this.logger.warn('Resend client not configured. Email not sent.');
      return false;
    }

    try {
      const emailPayload: any = {
        from: options.from || `${this.fromName} <${this.fromEmail}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html || options.text,
      };

      // Add optional fields if provided
      if (options.text) {
        emailPayload.text = options.text;
      }
      if (options.replyTo) {
        emailPayload.reply_to = options.replyTo;
      }

      // Add email threading headers if provided
      const headers: Record<string, string> = {};
      if (options.messageId) {
        headers['Message-ID'] = options.messageId;
      }
      if (options.inReplyTo) {
        headers['In-Reply-To'] = options.inReplyTo;
      }
      if (options.references) {
        headers['References'] = options.references;
      }
      if (Object.keys(headers).length > 0) {
        emailPayload.headers = headers;
      }

      const { data, error } = await this.resend.emails.send(emailPayload);

      if (error) {
        this.logger.error(`Failed to send email to ${options.to}:`, error);
        return false;
      }

      this.logger.log(`Email sent successfully to ${options.to}: ${data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetToken: string, userName: string): Promise<boolean> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token=${resetToken}`;

    const content = `
      <h1>Password Reset Request</h1>
      <p>Hi ${userName},</p>
      <p>You requested to reset your password. Click the button below to create a new password:</p>
      ${emailButton('Reset Password', resetUrl)}
      ${emailInfoBox('<p><strong>⏰ This link will expire in 1 hour.</strong></p><p>If you didn\'t request this password reset, please ignore this email and your password will remain unchanged.</p>')}
    `;

    const html = getEmailTemplate({
      title: 'Password Reset Request',
      preheader: 'Reset your password',
      content,
      logoUrl: this.getLogoUrl(),
    });

    return this.sendEmail({
      to,
      subject: 'Password Reset Request',
      html,
      text: `Reset your password: ${resetUrl}`,
    });
  }

  /**
   * Send contact form notification to admin
   */
  async sendContactNotification(
    contactId: number,
    name: string,
    email: string,
    subject: string,
    message: string,
    messageId?: string,
  ): Promise<boolean> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'admin@example.com');
    const dashboardUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/admin/contacts/${contactId}`;

    const content = `
      <h1>New Contact Message</h1>
      <p><strong>From:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Subject:</strong> ${subject}</p>
      <h2>Message:</h2>
      ${emailInfoBox(`<p>${message.replace(/\n/g, '<br>')}</p>`)}
      ${emailButton('View in Dashboard', dashboardUrl)}
    `;

    const html = getEmailTemplate({
      title: 'New Contact Message',
      preheader: `New message from ${name}`,
      content,
      logoUrl: this.getLogoUrl(),
    });

    return this.sendEmail({
      to: adminEmail,
      subject: `New Contact: ${subject}`,
      html,
      text: `New contact message from ${name} (${email}): ${message}`,
      replyTo: email,
      messageId,
    });
  }

  /**
   * Send contact reply to user
   */
  async sendContactReply(
    to: string,
    userName: string,
    subject: string,
    reply: string,
    replyMessageId: string,
    inReplyTo: string,
    threadId: string,
  ): Promise<boolean> {
    const content = `
      <h1>Response to Your Inquiry</h1>
      <p>Hi ${userName},</p>
      <p>Thank you for contacting us. Here's our response to your inquiry about <strong>"${subject}"</strong>:</p>
      ${emailInfoBox(`<p>${reply.replace(/\n/g, '<br>')}</p>`)}
      <p style="color: #999999; font-size: 14px; margin-top: 30px;">
        If you have any further questions, please reply to this email and we'll be happy to help.
      </p>
    `;

    const html = getEmailTemplate({
      title: 'Response to Your Inquiry',
      preheader: 'We have responded to your inquiry',
      content,
      logoUrl: this.getLogoUrl(),
    });

    return this.sendEmail({
      to,
      subject: `Re: ${subject}`,
      html,
      text: reply,
      messageId: replyMessageId,
      inReplyTo,
      references: threadId,
    });
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const content = `
      <h1>Welcome to MUS Store!</h1>
      <p>Hi ${userName},</p>
      <p>Thank you for joining MUS Store. We're excited to have you on board! 🎉</p>
      <p>As a member, you can now:</p>
      <ul style="color: #666666; line-height: 2;">
        <li>Browse our extensive product catalog</li>
        <li>Leave reviews and ratings on products</li>
        <li>Enjoy a personalized shopping experience</li>
        <li>Track your orders and manage your profile</li>
      </ul>
      ${emailButton('Start Shopping', frontendUrl)}
      ${emailInfoBox('<p><strong>Need Help?</strong></p><p>Our customer support team is here to help you 24/7. Feel free to contact us anytime!</p>')}
      <p>Happy shopping!</p>
    `;

    const html = getEmailTemplate({
      title: 'Welcome to MUS Store',
      preheader: 'Thank you for joining us!',
      content,
      logoUrl: this.getLogoUrl(),
    });

    return this.sendEmail({
      to,
      subject: 'Welcome to MUS Store! 🎉',
      html,
      text: `Welcome to MUS Store, ${userName}! Start shopping at ${frontendUrl}`,
    });
  }

  /**
   * Send custom admin message to user
   */
  async sendAdminMessageToUser(
    to: string,
    userName: string,
    subject: string,
    message: string,
  ): Promise<boolean> {
    const content = `
      <h1>${subject}</h1>
      <p>Hi ${userName},</p>
      ${emailInfoBox(`<p>${message.replace(/\n/g, '<br>')}</p>`)}
      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
        This is an administrative message from MUS Store. If you have any questions, please contact our support team.
      </p>
    `;

    const html = getEmailTemplate({
      title: subject,
      preheader: subject,
      content,
      logoUrl: this.getLogoUrl(),
    });

    return this.sendEmail({
      to,
      subject,
      html,
      text: message,
    });
  }

  /**
   * Get logo URL for email template
   */
  private getLogoUrl(): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return `${frontendUrl}/placeholder-logo.svg`;
  }

  /**
   * Generate order summary table HTML
   * Reusable method for creating order item tables in emails
   */
  private generateOrderSummaryTable(order: any, currencyCode: string, showTotalLabel: string = 'Total'): string {
    // Format items list
    const itemsList = order.items
      .map((item) => {
        const itemSubtotal = item.price * item.quantity;
        const itemVat = item.vatAmount ? item.vatAmount * item.quantity : 0;
        const itemTotal = itemSubtotal + itemVat;

        // Format product info - show name, fallback to ID if name unavailable
        const productInfo = item.productName || `Product #${item.productId}`;

        return `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${productInfo}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${this.formatMoney(item.price, currencyCode)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${this.formatMoney(itemTotal, currencyCode)}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <table style="width: 100%; margin: 20px 0; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Quantity</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
          <tr style="font-weight: bold;">
            <td colspan="3" style="padding: 10px; text-align: right;">Subtotal:</td>
            <td style="padding: 10px; text-align: right;">${this.formatMoney(order.subtotal, currencyCode)}</td>
          </tr>
          <tr>
            <td colspan="3" style="padding: 10px; text-align: right;">VAT:</td>
            <td style="padding: 10px; text-align: right;">${this.formatMoney(order.vatAmount, currencyCode)}</td>
          </tr>
          <tr style="font-weight: bold; font-size: 16px; background-color: #f5f5f5;">
            <td colspan="3" style="padding: 15px; text-align: right;">${showTotalLabel}:</td>
            <td style="padding: 15px; text-align: right; color: #3498db;">${this.formatMoney(order.totalAmount, currencyCode)}</td>
          </tr>
        </tbody>
      </table>
    `;
  }

  /**
   * Send order confirmation email when order is placed
   */
  async sendOrderConfirmation(
    to: string,
    userName: string,
    order: any,
  ): Promise<{ success: boolean; messageId?: string }> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const trackingUrl = `${frontendUrl}/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(to)}`;

    // Generate Message-ID for email threading
    const messageId = `<order-${order.orderNumber}@${this.fromEmail.split('@')[1] || 'muselemu.com'}>`;

    // Get currency code from order (default to RWF)
    const currencyCode = order.currencyCode || 'RWF';

    // Generate order summary table using reusable method
    const orderSummary = this.generateOrderSummaryTable(order, currencyCode);

    const shippingInfo = `
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Shipping Address</h3>
        <p style="margin: 5px 0;"><strong>${order.recipientName}</strong></p>
        <p style="margin: 5px 0;">${order.shippingAddress}</p>
        <p style="margin: 5px 0;">${order.shippingCity}${order.shippingState ? `, ${order.shippingState}` : ''} ${order.shippingZipCode || ''}</p>
        <p style="margin: 5px 0;">${order.shippingCountry}</p>
        ${order.recipientPhone ? `<p style="margin: 5px 0;">Phone: ${order.recipientPhone}</p>` : ''}
      </div>
    `;

    const content = `
      <h1>Order Confirmed! 🎉</h1>
      <p>Hi ${userName},</p>
      <p>Thank you for your order! We've received your order and it's being processed.</p>

      ${emailInfoBox(`
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
      `)}

      <h2>Order Summary</h2>
      ${orderSummary}

      <h2>Shipping Information</h2>
      ${shippingInfo}

      <p>We'll send you another email when your order ships. You can track your order status anytime using the button below.</p>

      ${emailButton('Track Your Order', trackingUrl)}

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
        Thank you for shopping with MUS Store! If you have any questions about your order, please don't hesitate to contact us.
      </p>
    `;

    const html = getEmailTemplate({
      title: 'Order Confirmed',
      preheader: `Your order ${order.orderNumber} has been confirmed`,
      content,
      logoUrl: this.getLogoUrl(),
    });

    const success = await this.sendEmail({
      to,
      subject: `Order #${order.orderNumber} - Confirmed`,
      html,
      text: `Your order ${order.orderNumber} has been confirmed. Total: ${this.formatMoney(order.totalAmount, currencyCode)}. Track your order: ${trackingUrl}`,
      messageId,
    });

    return { success, messageId: success ? messageId : undefined };
  }

  /**
   * Send order status update email
   */
  async sendOrderStatusUpdate(
    to: string,
    userName: string,
    order: any,
    oldStatus: string,
    newStatus: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const trackingUrl = `${frontendUrl}/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&email=${encodeURIComponent(to)}`;

    // Get status display text
    const statusInfo = this.getStatusDisplayInfo(newStatus);

    const content = `
      <h1>${statusInfo.icon} ${statusInfo.title}</h1>
      <p>Hi ${userName},</p>
      <p>${statusInfo.message}</p>

      ${emailInfoBox(`
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Previous Status:</strong> ${this.formatStatus(oldStatus)}</p>
        <p><strong>Current Status:</strong> ${this.formatStatus(newStatus)}</p>
        ${order.trackingNumber ? `<p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>` : ''}
        ${order.carrier ? `<p><strong>Carrier:</strong> ${order.carrier}</p>` : ''}
      `)}

      ${newStatus === 'DELIVERED' && order.actualDeliveryDate ? `
        <p style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; border-left: 4px solid #22c55e;">
          <strong>✅ Delivered on:</strong> ${new Date(order.actualDeliveryDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      ` : ''}

      ${newStatus === 'SHIPPED' && order.estimatedDeliveryDate ? `
        <p style="background-color: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b;">
          <strong>📅 Estimated Delivery:</strong> ${new Date(order.estimatedDeliveryDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      ` : ''}

      ${emailButton('Track Your Order', trackingUrl)}

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
        Thank you for shopping with MUS Store! If you have any questions about your order, please don't hesitate to contact us.
      </p>
    `;

    const html = getEmailTemplate({
      title: statusInfo.title,
      preheader: `Order ${order.orderNumber}: ${statusInfo.title}`,
      content,
      logoUrl: this.getLogoUrl(),
    });

    return this.sendEmail({
      to,
      subject: `Order #${order.orderNumber} - ${statusInfo.title}`,
      html,
      text: `Your order ${order.orderNumber} status has been updated from ${oldStatus} to ${newStatus}. ${order.trackingNumber ? `Tracking: ${order.trackingNumber}. ` : ''}Track your order: ${trackingUrl}`,
    });
  }

  /**
   * Get display information for order status
   */
  private getStatusDisplayInfo(status: string): { icon: string; title: string; message: string } {
    const statusMap = {
      PENDING: {
        icon: '⏳',
        title: 'Order Received',
        message: 'We have received your order and it is being prepared for processing.',
      },
      PROCESSING: {
        icon: '🔄',
        title: 'Order Processing',
        message: 'Great news! Your order is now being processed and prepared for shipment.',
      },
      SHIPPED: {
        icon: '📦',
        title: 'Order Shipped',
        message: 'Your order has been shipped and is on its way to you!',
      },
      IN_TRANSIT: {
        icon: '🚚',
        title: 'In Transit',
        message: 'Your order is in transit and on its way to you!',
      },
      OUT_FOR_DELIVERY: {
        icon: '🚚',
        title: 'Out for Delivery',
        message: 'Your order is out for delivery and should arrive soon!',
      },
      DELIVERED: {
        icon: '✅',
        title: 'Order Delivered',
        message: 'Your order has been successfully delivered! We hope you enjoy your purchase.',
      },
      FAILED_DELIVERY: {
        icon: '⚠️',
        title: 'Delivery Failed',
        message: 'We were unable to deliver your order. Please contact us for assistance.',
      },
      CANCELLED: {
        icon: '❌',
        title: 'Order Cancelled',
        message: 'Your order has been cancelled as requested.',
      },
      RETURNED: {
        icon: '↩️',
        title: 'Order Returned',
        message: 'Your order has been marked as returned.',
      },
    };

    return statusMap[status] || {
      icon: '📋',
      title: 'Order Status Update',
      message: `Your order status has been updated to: ${status}`,
    };
  }

  /**
   * Format status for display
   */
  private formatStatus(status: string): string {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    to: string,
    userName: string,
    order: any,
    transaction: any,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const orderUrl = `${frontendUrl}/orders/${order.orderNumber}`;

    // Get currency code from order (default to RWF)
    const currencyCode = order.currencyCode || 'RWF';

    // Generate order summary table using reusable method
    const orderSummary = this.generateOrderSummaryTable(order, currencyCode, 'Total Paid');

    const content = `
      <h1>Payment Confirmed! 🎉</h1>
      <p>Hi ${userName},</p>
      <p>Great news! We've received your payment for order <strong>${order.orderNumber}</strong>.</p>

      ${emailInfoBox(`
        <p><strong>Transaction Reference:</strong> ${transaction.transactionNumber}</p>
        ${order.paymentReference ? `<p><strong>Payment Reference:</strong> ${order.paymentReference}</p>` : ''}
        <p><strong>Payment Date:</strong> ${new Date(order.paidAt).toLocaleDateString()}</p>
      `)}

      <h2>Order Summary</h2>
      ${orderSummary}

      <p>Your order is now being processed and will be shipped soon. You'll receive another email when your order ships.</p>

      ${emailButton('Track Your Order', orderUrl)}

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
        Thank you for shopping with MUS Store! If you have any questions about your order, please don't hesitate to contact us.
      </p>
    `;

    const html = getEmailTemplate({
      title: 'Payment Confirmed',
      preheader: `Your payment for order ${order.orderNumber} has been confirmed`,
      content,
      logoUrl: this.getLogoUrl(),
    });

    return this.sendEmail({
      to,
      subject: `Order #${order.orderNumber} - Payment Confirmed`,
      html,
      text: `Your payment for order ${order.orderNumber} has been confirmed. Transaction: ${transaction.transactionNumber}. Total: ${this.formatMoney(order.totalAmount, currencyCode)}`,
    });
  }
}
