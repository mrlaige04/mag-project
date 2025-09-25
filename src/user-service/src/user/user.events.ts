import { Controller } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
} from '@nestjs/microservices';
import { UserService } from './user.service';
import { UserStatus } from '../../common/types/user-status';

@Controller()
export class UserEventsController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern({ cmd: 'create-user' })
  async createUser(@Payload() data: any) {
    return this.userService.create(data);
  }

  @MessagePattern({ cmd: 'find-user' })
  async findUser(@Payload() data: { id?: string, email?: string; phone?: string }) {
    if (data.id) {
      return this.userService.findById(data.id);
    }
    if (data.email) {
      return this.userService.findByEmail(data.email);
    }
    if (data.phone) {
      return this.userService.findByPhone(data.phone);
    }
    return null;
  }

  @MessagePattern({ cmd: 'update-user-password' })
  async updateUserPassword(
    @Payload() data: { userId: string; passwordHash: string },
  ) {
    return this.userService.updatePassword(data.userId, data.passwordHash);
  }

  @MessagePattern({ cmd: 'enable-2fa' })
  async enable2FA(@Payload() data: { userId: string }) {
    return this.userService.enable2FA(data.userId);
  }

  @MessagePattern({ cmd: 'disable-2fa' })
  async disable2FA(@Payload() data: { userId: string }) {
    return this.userService.disable2FA(data.userId);
  }

  @MessagePattern({ cmd: 'change-user-status' })
  async updateUserStatus(@Payload() data: { userId: string; status: string }) {
    return this.userService.updateUserStatus(data.userId, data.status as UserStatus);
  }
}
