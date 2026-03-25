import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileRequestDto } from './dto/update-profile-request.dto';
import { UserService } from './user.service';
import type { CurrentUserPrincipal } from 'src/auth/interfaces/current-user.interface';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getProfile(@CurrentUser() user: CurrentUserPrincipal) {
    return this.userService.getProfile(user.userId);
  }

  @Put()
  async updateProfile(
    @CurrentUser() user: CurrentUserPrincipal,
    @Body() dto: UpdateProfileRequestDto,
  ) {
    return this.userService.updateProfile(user.userId, dto);
  }
}
