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
import { ApiTags, ApiOperation, ApiParam, ApiCookieAuth, ApiOkResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
}
