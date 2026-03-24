import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new user with email and password hash
   */
  async createUser(data: {
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<any> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
        isVerified: false,
      },
    });
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Update user verification status
   */
  async markUserAsVerified(userId: string): Promise<any> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt(data: {
    email: string;
    userId?: string;
    result: 'SUCCESS' | 'FAILURE';
    reason: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): Promise<any> {
    return this.prisma.authAttempt.create({
      data: {
        email: data.email,
        userId: data.userId,
        result: data.result,
        reason: data.reason,
        ip: data.ip,
        userAgent: data.userAgent,
      },
    });
  }
}
