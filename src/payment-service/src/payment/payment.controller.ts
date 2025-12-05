import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseGuards,
    Req,
  } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtGuard, VerificationGuard } from '@app/common';
import { TransferDto } from './dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiOkResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('transfer')
  @UseGuards(JwtGuard, VerificationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transfer money between cards' })
  @ApiBody({
    description: 'Payload for card-to-card transfer',
    type: TransferDto,
    schema: {
      example: {
        senderCardNumber: '4111111111111111',
        receiverCardNumber: '4222222222222222',
        amount: 500,
        currency: 'UAH',
      },
    },
  })
  @ApiOkResponse({ description: 'Transfer completed' })
  async transfer(@Body() dto: TransferDto, @Req() req) {
    return this.paymentService.transfer(dto, req.user.userId);
  }

    @Get('history')
    @UseGuards(JwtGuard, VerificationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get payment history for current user' })
    @ApiOkResponse({ description: 'History returned' })
    async getHistory(@Req() req) {
        return this.paymentService.getHistory(req.user.userId);
    }

    @Get(':id')
    @UseGuards(JwtGuard, VerificationGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get payment by id' })
    @ApiParam({ name: 'id', type: String })
    @ApiOkResponse({ description: 'Payment returned' })
    async getById(@Param('id') id: string, @Req() req) {
        return this.paymentService.getById(id, req.user.userId);
    }
}  