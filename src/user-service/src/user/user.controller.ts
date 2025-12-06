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
  ForbiddenException,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto';
import { JwtGuard, AdminRoleGuard } from '@app/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard, AdminRoleGuard)
  @Get()
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiOkResponse({ description: 'All users returned' })
  async getAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtGuard)
  @Get(':id')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by id (self or admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'User returned' })
  async getOne(@Param('id') id: string, @Req() req) {
    const currentUser = req.user;
    const currentUserId = currentUser?.userId || currentUser?.id;
    const currentRole = currentUser?.role;

    if (!currentUserId) {
      throw new UnauthorizedException('No authenticated user');
    }

    if (currentRole !== 'admin' && currentUserId !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }

    return this.userService.findById(id);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'User deleted' })
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  @HttpCode(200)
  @ApiBearerAuth()
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

  @UseGuards(JwtGuard)
  @Get('me')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiOkResponse({ description: 'Current user' })
  async getUser(@Req() req) {
    const userId = req.user.userId;

    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.userService.findById(userId);
  }
}
