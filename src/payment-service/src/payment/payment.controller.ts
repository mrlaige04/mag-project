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
  import {
    SessionGuard,
    VerificationGuard,
  } from '../../common/guards';
  import { TransferDto } from './dto';
  import { ApiTags, ApiOperation, ApiCookieAuth, ApiParam, ApiOkResponse } from '@nestjs/swagger';
  
  @ApiTags('payment')
  @Controller('payment')
  export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post('transfer')
    @UseGuards(SessionGuard, VerificationGuard)
    @ApiCookieAuth('sessionId')
    @ApiOperation({ summary: 'Transfer money between cards' })
    @ApiBody({ type: TransferDto })
    @ApiOkResponse({ description: 'Transfer completed' })
    async transfer(@Body() dto: TransferDto, @Req() req) {
        return this.paymentService.transfer(dto, req.user.userId);
    }

    @Get('history')
    @UseGuards(SessionGuard, VerificationGuard)
    @ApiCookieAuth('sessionId')
    @ApiOperation({ summary: 'Get payment history for current user' })
    @ApiOkResponse({ description: 'History returned' })
    async getHistory(@Req() req) {
        return this.paymentService.getHistory(req.user.userId);
    }

    @Get(':id')
    @UseGuards(SessionGuard, VerificationGuard)
    @ApiCookieAuth('sessionId')
    @ApiOperation({ summary: 'Get payment by id' })
    @ApiParam({ name: 'id', type: String })
    @ApiOkResponse({ description: 'Payment returned' })
    async getById(@Param('id') id: string, @Req() req) {
        return this.paymentService.getById(id, req.user.userId);
    }
}  