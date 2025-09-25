import {
  Controller,
  Param,
  Post,
  Body,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto';
import { SessionGuard } from '../../common/guards';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(SessionGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @UseGuards(SessionGuard)
  @Patch(':id')
  async updateProfile(
    @Param('id') id: string,
    @Body() data: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(id, data);
  }
}
