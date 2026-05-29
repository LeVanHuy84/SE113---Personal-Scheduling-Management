import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import type { CurrentUserPrincipal } from 'src/auth/interfaces/current-user.interface';
import { NotificationService } from 'src/notification/notification.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserDeviceRequestDto } from '../device/dto/user-device-request.dto';
import { UpdateProfileRequestDto } from './dto/update-profile-request.dto';
import { UserService } from './user.service';
import { UserDeviceService } from 'src/device/user-device.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly userDeviceService: UserDeviceService,
  ) { }

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

  @Get('me/notifications')
  async getMyNotifications(@CurrentUser() user: CurrentUserPrincipal) {
    return this.notificationService.getMyNotifications(user.userId)
  }

  @Patch('me/notifications/all')
  async markAllAsRead(@CurrentUser() user: CurrentUserPrincipal
  ) {
    return this.notificationService.markAllAsRead(user.userId)
  }

  @Patch('me/notifications/:id')
  async markAsRead(@CurrentUser() user: CurrentUserPrincipal, @Param('id') id: string,
  ) {
    return this.notificationService.markAsRead(id, user.userId)
  }

  @Post('devices')
  async registerDevice(@Body() dto: UserDeviceRequestDto, @CurrentUser() user: CurrentUserPrincipal) {
    return this.userDeviceService.registerDevice(user.userId, dto);
  }

  @Get('devices')
  async getDevices(@CurrentUser() user: CurrentUserPrincipal) {
    return this.userDeviceService.getUserDevices(user.userId);
  }

  @Delete('devices')
  async deleteDevices(@Body() dto: { fcmToken: string }) {
    return this.userDeviceService.removeDevice(dto.fcmToken);
  }




}
