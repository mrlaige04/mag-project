import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CardService } from './card.service';

@Controller()
export class CardEventsController {
  constructor(private readonly cardService: CardService) {}

  @MessagePattern({ cmd: 'transfer' })
  async transfer({ senderCardId, receiverCardId, amount, currency }: { senderCardId: string; receiverCardId: string; amount: number; currency: string }) {
    try {
      await this.cardService.transfer(senderCardId, receiverCardId, amount, currency);
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: e.message };
    }
  }

  @MessagePattern({ cmd: 'get-card-by-number' })
  async getCardByNumber(cardNumber: string) {
    return this.cardService.getCardByNumber(cardNumber);
  }

  @MessagePattern({ cmd: 'get-cards-by-user' })
  async getCardsByUser(userId: string) {
    return this.cardService.findAllByUser(userId);
  }
} 