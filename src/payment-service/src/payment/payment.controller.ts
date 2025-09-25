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
  
  @Controller('payment')
  export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    @Post('transfer')
    @UseGuards(SessionGuard, VerificationGuard)
    async transfer(@Body() dto: TransferDto, @Req() req) {
        return this.paymentService.transfer(dto, req.user.userId);
    }

    @Get('history')
    @UseGuards(SessionGuard, VerificationGuard)
    async getHistory(@Req() req) {
        return this.paymentService.getHistory(req.user.userId);
    }

    @Get(':id')
    @UseGuards(SessionGuard, VerificationGuard)
    async getById(@Param('id') id: string, @Req() req) {
        return this.paymentService.getById(id, req.user.userId);
    }
}  