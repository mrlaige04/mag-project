import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { JwtGuard, VerificationGuard, AdminRoleGuard } from '@app/common';

@ApiTags('history')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @UseGuards(JwtGuard, VerificationGuard, AdminRoleGuard)
  @Get('user/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get events for a specific user (admin)' })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({ description: 'User events returned' })
  async getUserEvents(@Param('userId') userId: string) {
    return this.historyService.getUserEvents(userId);
  }

  @UseGuards(JwtGuard, VerificationGuard, AdminRoleGuard)
  @Get('all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all events (admin)' })
  @ApiOkResponse({ description: 'All events returned' })
  async getAllEvents() {
    return this.historyService.getAllEvents();
  }
}