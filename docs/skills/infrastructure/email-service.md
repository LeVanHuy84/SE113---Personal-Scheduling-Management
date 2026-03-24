# Skill: Email Service (SMTP - NestJS)

## Purpose

Provide a simple email sending service using Nodemailer for transactional emails.

---

## Tech Stack

- Nodemailer
- SMTP

---

## Setup

Install:

npm install nodemailer

---

## Email Service Example

```ts
@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get('EMAIL_HOST'),
      port: Number(configService.get('EMAIL_PORT')),
      auth: {
        user: configService.get('EMAIL_USER'),
        pass: configService.get('EMAIL_PASS'),
      },
    });
  }

  async sendVerificationEmail(input: {
    to: string;
    token: string;
    displayName: string;
  }) {
    const verifyUrl = `${this.configService.get(
      'APP_BASE_URL',
    )}/verify-email?token=${input.token}`;

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: input.to,
      subject: 'Verify your email',
      html: `
        <h3>Hello ${input.displayName}</h3>
        <p>Please verify your email:</p>
        <a href="${verifyUrl}">Verify Email</a>
      `,
    });
  }
}
```

---

## Rules

- MUST NOT contain business logic
- MUST be reusable
- MUST use environment variables
- MUST handle async errors properly

---

## Notes

- Suitable for MVP
- For production, integrate with queue system (future phase)
