import { Injectable, NotFoundException } from '@nestjs/common';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { UpdateProfileRequestDto } from './dto/update-profile-request.dto';
import { UserRepository } from './user.repository';

type PrismaLikeError = {
  code?: string;
};

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  private isPrismaLikeError(error: unknown): error is PrismaLikeError {
    return typeof error === 'object' && error !== null;
  }

  async getProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.userRepository.findProfileById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileRequestDto,
  ): Promise<UserProfileResponseDto> {
    if (dto.displayName === undefined && dto.timezone === undefined) {
      return this.getProfile(userId);
    }

    try {
      const updatedUser = await this.userRepository.updateProfile(userId, {
        displayName: dto.displayName,
        timezone: dto.timezone,
      });

      return updatedUser;
    } catch (error) {
      if (this.isPrismaLikeError(error) && error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }

      throw error;
    }
  }
}
