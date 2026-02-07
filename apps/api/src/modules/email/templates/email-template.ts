export interface EmailTemplateOptions {
  title: string;
  preheader?: string;
  content: string;
  logoUrl?: string;
}

/**
 * Base email template with consistent header, footer, and branding
 */
export function getEmailTemplate(options: EmailTemplateOptions): string {
  const { title, preheader, content, logoUrl } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  ${preheader ? `<meta name="description" content="${preheader}">` : ''}
  <title>${title}</title>
  <style>
    /* Platform Color Palette */
    /* Primary: #1a1a1a (dark text) */
    /* Secondary: #737373 (muted text) */
    /* Background: #f5f5f5 (light gray) */
    /* Accent: #1a1a1a (dark) */
    /* Border: #e5e5e5 */

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background-color: #1a1a1a;
      padding: 30px 20px;
      text-align: center;
      border-bottom: 1px solid #e5e5e5;
    }
    .email-logo {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: 3px;
    }
    .email-logo-img {
      max-width: 180px;
      height: auto;
      display: block;
      margin: 0 auto;
    }
    .email-body {
      padding: 40px 30px;
    }
    .email-content h1 {
      color: #1a1a1a;
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 20px;
      font-weight: 700;
    }
    .email-content h2 {
      color: #1a1a1a;
      font-size: 20px;
      margin-top: 30px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    .email-content p {
      margin: 0 0 15px 0;
      color: #404040;
      font-size: 15px;
    }
    .email-button {
      display: inline-block;
      padding: 14px 32px;
      margin: 20px 0;
      background-color: #1a1a1a;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      transition: background-color 0.3s ease;
    }
    .email-button:hover {
      background-color: #404040;
    }
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid #1a1a1a;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      color: #404040;
    }
    .email-footer {
      background-color: #fafafa;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
    }
    .email-footer p {
      margin: 5px 0;
      color: #737373;
      font-size: 12px;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #1a1a1a;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    .social-links a:hover {
      color: #404040;
    }
    .divider {
      height: 1px;
      background-color: #e5e5e5;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 30px 20px;
      }
      .email-content h1 {
        font-size: 22px;
      }
      .email-button {
        padding: 12px 24px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0">
          <!-- Header -->
          <tr>
            <td class="email-header">
              ${logoUrl ? `
                <a href="/">
                  <img src="${logoUrl}" alt="MUS Store" class="email-logo-img" />
                </a>
              ` : `
                <a href="/" class="email-logo">MUS</a>
              `}
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px;">Your Premium Shopping Experience</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body">
              <div class="email-content">
                ${content}
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer">
              <div class="social-links">
                <a href="#">Facebook</a>
                <a href="#">Twitter</a>
                <a href="#">Instagram</a>
                <a href="#">LinkedIn</a>
              </div>
              <div class="divider"></div>
              <p><strong>MUS Store</strong></p>
              <p>123 Commerce Street, City, Country</p>
              <p>
                <a href="#" style="color: #1a1a1a; text-decoration: none;">Contact Us</a> |
                <a href="#" style="color: #1a1a1a; text-decoration: none;">Privacy Policy</a> |
                <a href="#" style="color: #1a1a1a; text-decoration: none;">Unsubscribe</a>
              </p>
              <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} MUS Store. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Helper to create a button for emails
 */
export function emailButton(text: string, url: string): string {
  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" class="email-button">${text}</a>
    </div>
    <p style="color: #737373; font-size: 12px; text-align: center;">
      Or copy and paste this link into your browser:<br>
      <span style="color: #1a1a1a; word-break: break-all;">${url}</span>
    </p>
  `;
}

/**
 * Helper to create an info box
 */
export function emailInfoBox(content: string): string {
  return `
    <div class="info-box">
      ${content}
    </div>
  `;
}
