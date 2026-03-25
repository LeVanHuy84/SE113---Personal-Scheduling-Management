import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateAuthLoginRequestDto } from './dto/create-auth-login-request.dto';
import { CreateAuthRegisterRequestDto } from './dto/create-auth-register-request.dto';
import { CreateForgotPasswordRequestDto } from './dto/create-forgot-password-request.dto';
import { CreateResetPasswordRequestDto } from './dto/create-reset-password-request.dto';
import { CreateVerifyEmailRequestDto } from './dto/create-verify-email-request.dto';
import { AuthService } from './auth.service';
import { CreateResendVerificationEmailRequestDto } from './dto/create-resend-verification-email-request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateAuthRegisterRequestDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: CreateVerifyEmailRequestDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification-email')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(
    @Body() dto: CreateResendVerificationEmailRequestDto,
  ) {
    return this.authService.resendVerificationEmail(dto.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: CreateForgotPasswordRequestDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: CreateResetPasswordRequestDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: CreateAuthLoginRequestDto, @Req() req: Request) {
    return this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? null,
    });
  }
}
