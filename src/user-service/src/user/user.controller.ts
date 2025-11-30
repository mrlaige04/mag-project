import {
  Controller,
  Param,
  Post,
  Body,
  Delete,
  Patch,
  Get,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto';
import { SessionGuard, AdminRoleGuard } from '@app/common';
import { ApiTags, ApiOperation, ApiParam, ApiCookieAuth, ApiOkResponse, ApiBody, OmitType } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(SessionGuard, AdminRoleGuard)
  @Get()
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiOkResponse({ description: 'All users returned' })
  async getAll() {
    return this.userService.findAll();
  }

  @UseGuards(SessionGuard, AdminRoleGuard)
  @Get(':id')
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Get user by id (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'User returned' })
  async getOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @UseGuards(SessionGuard)
  @Delete(':id')
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Delete user by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'User deleted' })
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @UseGuards(SessionGuard)
  @Patch(':id')
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Update profile for user id' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateProfileDto })
  @ApiOkResponse({ description: 'Profile updated' })
  async updateProfile(
    @Param('id') id: string,
    @Body() data: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(id, data);
  }

  @UseGuards(SessionGuard)
  @Get('')
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Get current user' })
  @ApiOkResponse({ description: "Current user" })
  async getUser(@Req() req) {
    const userId = req.user.userId;

    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.userService.findById(userId);
  }
}
