import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { HistoryService } from './history.service';
import { SessionGuard, VerificationGuard, AdminRoleGuard } from '../../common/guards';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @UseGuards(SessionGuard, VerificationGuard, AdminRoleGuard)
  @Get('user/:userId')
  async getUserEvents(@Param('userId') userId: string) {
    return this.historyService.getUserEvents(userId);
  }

  @UseGuards(SessionGuard, VerificationGuard, AdminRoleGuard)
  @Get('all')
  async getAllEvents() {
    return this.historyService.getAllEvents();
  }
}