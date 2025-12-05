import {
  Controller,
  Param,
  Post,
  Body,
  Delete,
  Patch,
  Get,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto';
import { JwtGuard, AdminRoleGuard } from '@app/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiOkResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard, AdminRoleGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiOkResponse({ description: 'All users returned' })
  async getAll() {
    return this.userService.findAll();
  }

  @UseGuards(JwtGuard, AdminRoleGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by id (admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'User returned' })
  async getOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @UseGuards(JwtGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'User deleted' })
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
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
}
