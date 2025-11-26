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
import { ApiTags, ApiOperation, ApiParam, ApiCookieAuth, ApiOkResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('cards')
@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post('open')
  @UseGuards(SessionGuard, VerificationGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Open a new card application' })
  @ApiBody({
    description: 'Payload for opening a new card application',
    type: OpenCardDto,
    schema: {
      example: {
        cardType: 'debit',
        provider: 'visa',
      },
    },
  })
  @ApiOkResponse({ description: 'Application created' })
  async openCard(@Body() dto: OpenCardDto, @Req() req) {
    const userId = req.user.userId;
    return this.cardService.createCardApplication(userId, dto);
  }

  @Post(':id/block')
  @UseGuards(SessionGuard, CardOwnerGuard, VerificationGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Block a card by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Card blocked' })
  async blockCard(@Param('id') cardId: string) {
    return this.cardService.blockCard(cardId);
  }

  @Post(':id/unblock')
  @UseGuards(SessionGuard, CardOwnerGuard, VerificationGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Unblock a card by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Card unblocked' })
  async unblockCard(@Param('id') cardId: string) {
    return this.cardService.unblockCard(cardId);
  }

  @Post(':id/close')
  @UseGuards(SessionGuard, CardOwnerGuard, VerificationGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Close a card by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Card closed' })
  async closeCard(@Param('id') cardId: string) {
    return this.cardService.closeCard(cardId);
  }

  @Get()
  @UseGuards(SessionGuard, VerificationGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Get all cards for current user' })
  @ApiOkResponse({ description: 'Cards returned' })
  async getAllByUser(@Req() req) {
    return this.cardService.findAllByUser(req.user.userId);
  }

  @Get('applications')
  @UseGuards(SessionGuard, AdminRoleGuard, VerificationGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Get all card applications (admin)' })
  @ApiOkResponse({ description: 'Applications returned' })
  async getApplications() {
    return this.cardService.getAllApplications();
  }

  @Get(':id')
  @UseGuards(SessionGuard, CardOwnerGuard, VerificationGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Get card by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Card returned' })
  async getOne(@Param('id') cardId: string) {
    return this.cardService.findOne(cardId);
  }

  @Post('applications/:id/approve')
  @UseGuards(SessionGuard, AdminRoleGuard, VerificationGuard)
  @ApiCookieAuth('sessionId')
  @ApiOperation({ summary: 'Approve card application (admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Application approved' })
  async approveApplication(@Param('id') id: string) {
    return this.cardService.approveApplication(id);
  }
}
