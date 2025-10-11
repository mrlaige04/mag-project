import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiCookieAuth, ApiOkResponse } from '@nestjs/swagger';
import { HistoryService } from './history.service';
import { SessionGuard, VerificationGuard, AdminRoleGuard } from '../../common/guards';

@ApiTags('history')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @UseGuards(SessionGuard, VerificationGuard, AdminRoleGuard)
  @Get('user/:userId')
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Get events for a specific user (admin)' })
  @ApiParam({ name: 'userId', type: String })
  @ApiOkResponse({ description: 'User events returned' })
  async getUserEvents(@Param('userId') userId: string) {
    return this.historyService.getUserEvents(userId);
  }

  @UseGuards(SessionGuard, VerificationGuard, AdminRoleGuard)
  @Get('all')
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Get all events (admin)' })
  @ApiOkResponse({ description: 'All events returned' })
  async getAllEvents() {
    return this.historyService.getAllEvents();
  }
}