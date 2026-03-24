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
import { CreateVerifyEmailRequestDto } from './dto/create-verify-email-request.dto';
import { AuthService } from './auth.service';

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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: CreateAuthLoginRequestDto, @Req() req: Request) {
    return this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? null,
    });
  }
}
