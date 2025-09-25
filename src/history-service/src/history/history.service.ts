import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LogEventDto } from './dto';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async logEvent(dto: LogEventDto) {
    return this.prisma.event.create({
      data: {
        userId: dto.userId,
        eventType: dto.eventType,
        meta: dto.meta,
      },
    });
  }

  async getUserEvents(userId: string) {
    return this.prisma.event.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getAllEvents() {
    return this.prisma.event.findMany({
      orderBy: { timestamp: 'desc' },
    });
  }
} 