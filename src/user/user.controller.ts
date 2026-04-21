import { Body, Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileRequestDto } from './dto/update-profile-request.dto';
import { UserService } from './user.service';
import type { CurrentUserPrincipal } from 'src/auth/interfaces/current-user.interface';
import { UserDeviceRequestDto } from './dto/user-device-request.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('me')
  async getProfile(@CurrentUser() user: CurrentUserPrincipal) {
    return this.userService.getProfile(user.userId);
  }

  @Put('me')
  async updateProfile(
    @CurrentUser() user: CurrentUserPrincipal,
    @Body() dto: UpdateProfileRequestDto,
  ) {
    return this.userService.updateProfile(user.userId, dto);
  }

  @Post('devices')
  async registerDevice(@Body() dto: UserDeviceRequestDto, @CurrentUser() user: CurrentUserPrincipal) {
    return this.userService.registerDevice(user.userId, dto);
  }

  @Get('devices')
  async getDevices(@CurrentUser() user: CurrentUserPrincipal) {
    return this.userService.getUserDevices(user.userId);
  }

  @Delete('devices')
  async deleteDevices(@Body() dto: { fcmToken: string }) {
    return this.userService.removeDevice(dto.fcmToken);
  }
}
