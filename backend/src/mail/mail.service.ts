import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
  }

  async sendEmailVerification(
    email: string,
    verificationUrl: string,
  ): Promise<void> {
    // Send the verification email through Resend
    const { error } = await this.resend.emails.send({
      from: this.configService.getOrThrow<string>('EMAIL_FROM'),
      to: email,
      subject: 'Verify your email',
      html: `
        <p>Welcome to Kia Blog.</p>
        <p>Please verify your email:</p>
        <p><a href="${verificationUrl}">Verify email</a></p>
      `,
    });

    if (error) {
      throw new InternalServerErrorException(
        'Failed to send verification email.',
      );
    }
  }
}