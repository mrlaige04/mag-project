import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { CardService } from './card.service';
import { OpenCardDto } from './dto';
import {
  JwtGuard,
  AdminRoleGuard,
  VerificationGuard,
} from '@app/common';
import { CardOwnerGuard } from '../../common/guards';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('cards')
@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post('open')
  @UseGuards(JwtGuard, VerificationGuard)
  @HttpCode(200)
  @ApiBearerAuth()
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
  @UseGuards(JwtGuard, CardOwnerGuard, VerificationGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Block a card by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Card blocked' })
  async blockCard(@Param('id') cardId: string) {
    return this.cardService.blockCard(cardId);
  }

  @Post(':id/unblock')
  @UseGuards(JwtGuard, CardOwnerGuard, VerificationGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unblock a card by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Card unblocked' })
  async unblockCard(@Param('id') cardId: string) {
    return this.cardService.unblockCard(cardId);
  }

  @Post(':id/close')
  @UseGuards(JwtGuard, CardOwnerGuard, VerificationGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Close a card by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Card closed' })
  async closeCard(@Param('id') cardId: string) {
    return this.cardService.closeCard(cardId);
  }

  @Get()
  @UseGuards(JwtGuard, VerificationGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all cards for current user' })
  @ApiOkResponse({ description: 'Cards returned' })
  async getAllByUser(@Req() req) {
    return this.cardService.findAllByUser(req.user.userId);
  }

  @Get('applications')
  @UseGuards(JwtGuard, AdminRoleGuard, VerificationGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all card applications (admin)' })
  @ApiOkResponse({ description: 'Applications returned' })
  async getApplications() {
    return this.cardService.getAllApplications();
  }

  @Get(':id')
  @UseGuards(JwtGuard, CardOwnerGuard, VerificationGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get card by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Card returned' })
  async getOne(@Param('id') cardId: string) {
    return this.cardService.findOne(cardId);
  }

  @Post('applications/:id/approve')
  @UseGuards(JwtGuard, AdminRoleGuard, VerificationGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve card application (admin)' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Application approved' })
  async approveApplication(@Param('id') id: string) {
    return this.cardService.approveApplication(id);
  }
}
