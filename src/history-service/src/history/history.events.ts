import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { HistoryService } from './history.service';
import { LogEventDto } from './dto';

@Controller()
export class HistoryEventsController {
  constructor(private readonly historyService: HistoryService) {}

  @MessagePattern({ cmd: 'history.log' })
  async logEvent(@Payload() dto: LogEventDto) {
    return this.historyService.logEvent(dto);
  }
} 