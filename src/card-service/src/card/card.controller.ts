import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CardService } from './card.service';
import { OpenCardDto } from './dto';
import {
  SessionGuard,
  CardOwnerGuard,
  AdminRoleGuard,
  VerificationGuard,
} from '../../common/guards';

@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post('open')
  @UseGuards(SessionGuard, VerificationGuard)
  async openCard(@Body() dto: OpenCardDto, @Req() req) {
    const userId = req.user.userId;
    return this.cardService.createCardApplication(userId, dto);
  }

  @Post(':id/block')
  @UseGuards(SessionGuard, CardOwnerGuard, VerificationGuard)
  async blockCard(@Param('id') cardId: string) {
    return this.cardService.blockCard(cardId);
  }

  @Post(':id/unblock')
  @UseGuards(SessionGuard, CardOwnerGuard, VerificationGuard)
  async unblockCard(@Param('id') cardId: string) {
    return this.cardService.unblockCard(cardId);
  }

  @Post(':id/close')
  @UseGuards(SessionGuard, CardOwnerGuard, VerificationGuard)
  async closeCard(@Param('id') cardId: string) {
    return this.cardService.closeCard(cardId);
  }

  @Get()
  @UseGuards(SessionGuard, VerificationGuard)
  async getAllByUser(@Req() req) {
    return this.cardService.findAllByUser(req.user.userId);
  }

  @Get('applications')
  @UseGuards(SessionGuard, AdminRoleGuard, VerificationGuard)
  async getApplications() {
    return this.cardService.getAllApplications();
  }

  @Get(':id')
  @UseGuards(SessionGuard, CardOwnerGuard, VerificationGuard)
  async getOne(@Param('id') cardId: string) {
    return this.cardService.findOne(cardId);
  }

  @Post('applications/:id/approve')
  @UseGuards(SessionGuard, AdminRoleGuard, VerificationGuard)
  async approveApplication(@Param('id') id: string) {
    return this.cardService.approveApplication(id);
  }
}
