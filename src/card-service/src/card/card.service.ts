import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { OpenCardDto } from './dto';
import {
  generateCardNumber,
  generateCvv,
  generateExpirationDate,
} from '../utils';
import * as bcrypt from 'bcryptjs';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class CardService {
  constructor(private readonly prisma: PrismaService, @Inject('HISTORY_SERVICE') private readonly historyClient: ClientProxy) {}

  private async openCard(userId: string, dto: OpenCardDto) {
    const cardNumber = generateCardNumber(dto.provider);
    const cvv = generateCvv();
    const cvvHash = await bcrypt.hash(cvv, 10);
    const expirationDate = generateExpirationDate();

    const card = await this.prisma.card.create({
      data: {
        userId: userId,
        cardNumber,
        cardType: dto.cardType,
        provider: dto.provider,
        status: 'active',
        expirationDate,
        cvvHash,
      },
    });

    await this.historyClient.send({ cmd: 'history.log' }, { userId, eventType: 'ADMIN_ACTION', meta: { action: 'card.open', cardId: card.id, provider: dto.provider } }).toPromise();
    return { ...card, cvv };
  }

  async blockCard(cardId: string) {
    const card = await this.prisma.card.update({
      where: { id: cardId },
      data: { status: 'blocked' },
    });
    await this.historyClient.send({ cmd: 'history.log' }, { userId: card.userId, eventType: 'CARD_BLOCK', meta: { cardId } }).toPromise();
    return card;
  }

  async closeCard(cardId: string) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new Error('Card not found');
    if (Number(card.balance) !== 0)
      throw new Error('Cannot close card with non-zero balance');
    const closed = await this.prisma.card.update({
      where: { id: cardId },
      data: { status: 'closed' },
    });
    await this.historyClient.send({ cmd: 'history.log' }, { userId: card.userId, eventType: 'CARD_CLOSE', meta: { cardId } }).toPromise();
    return closed;
  }

  async unblockCard(cardId: string) {
    const card = await this.prisma.card.update({
      where: { id: cardId },
      data: { status: 'active' },
    });
    await this.historyClient.send({ cmd: 'history.log' }, { userId: card.userId, eventType: 'CARD_UNBLOCK', meta: { cardId } }).toPromise();
    return card;
  }

  async findAllByUser(userId: string) {
    return this.prisma.card.findMany({ where: { userId } });
  }

  async findOne(cardId: string) {
    return this.prisma.card.findUnique({ where: { id: cardId } });
  }

  async createCardApplication(userId: string, dto: OpenCardDto) {
    return this.openCard(userId, dto);
  }

  async getAllApplications() {
    return this.prisma.cardApplication.findMany();
  }

  async transfer(senderCardId: string, receiverCardId: string, amount: number, currency: string) {
    return this.prisma.$transaction(async (tx) => {
      const senderArr = await tx.$queryRawUnsafe(
        `SELECT "id", "userId", "balance", "currency" FROM "Card" WHERE id = $1 FOR UPDATE`,
        senderCardId
      ) as any[];
      
      const sender = senderArr[0];

      if (!sender) throw new Error('Card not found');
      if (Number(sender.balance) < amount) throw new Error('Insufficient funds');

      const receiverArr = await tx.$queryRawUnsafe(
        `SELECT "id", "userId", "balance", "currency" FROM "Card" WHERE id = $1 FOR UPDATE`,
        receiverCardId
      ) as any[];

      const receiver = receiverArr[0];

      if (!receiver) throw new Error('Card not found');
      if (sender.currency !== currency || receiver.currency !== currency) {
        throw new Error('Currency mismatch');
      }

      await tx.card.update({
        where: { id: senderCardId },
        data: { balance: { decrement: amount } },
      });

      await tx.card.update({
        where: { id: receiverCardId },
        data: { balance: { increment: amount } },
      });
      
      await this.historyClient.send({ cmd: 'history.log' }, { userId: sender.userId, eventType: 'TRANSFER', meta: { direction: 'out', senderCardId, receiverCardId, amount, currency } }).toPromise();
      await this.historyClient.send({ cmd: 'history.log' }, { userId: receiver.userId, eventType: 'TRANSFER', meta: { direction: 'in', senderCardId, receiverCardId, amount, currency } }).toPromise();
    });
  }

  async getCardByNumber(cardNumber: string) {
    return this.prisma.card.findUnique({ where: { cardNumber } });
  }
}
