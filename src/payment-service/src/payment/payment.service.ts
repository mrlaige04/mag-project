import { Inject, Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TransferDto } from './dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('CARD_SERVICE') private readonly cardClient: ClientProxy,
    @Inject('HISTORY_SERVICE') private readonly historyClient: ClientProxy,
  ) {}

  async transfer(dto: TransferDto, userId: string) {
    const senderCard = await firstValueFrom(
      this.cardClient.send({ cmd: 'get-card-by-number' }, dto.senderCardNumber)
    );
    
    const receiverCard = await firstValueFrom(
      this.cardClient.send({ cmd: 'get-card-by-number' }, dto.receiverCardNumber)
    );
  
    if (!senderCard || !receiverCard) {
      throw new BadRequestException('Card not found');
    }
    
    if (senderCard.userId !== userId) {
      throw new ForbiddenException('Not your card');
    }

    let transferResult;
    try {
      transferResult = await firstValueFrom(
        this.cardClient.send({ cmd: 'transfer' }, {
          senderCardId: senderCard.id,
          receiverCardId: receiverCard.id,
          amount: dto.amount,
          currency: dto.currency,
        }),
      );
    } catch (e) {
      await this.historyClient.send({ cmd: 'history.log' }, { userId, eventType: 'ADMIN_ACTION', meta: { action: 'payment.transfer.failed', error: e.message, dto } }).toPromise();
      throw e;
    }
    const transfer = await this.prisma.transfer.create({
      data: {
        senderCardId: senderCard.id,
        receiverCardId: receiverCard.id,
        amount: dto.amount,
        currency: dto.currency,
        status: transferResult.success ? 'completed' : 'failed',
        comment: transferResult.success ? null : (transferResult.error || 'Unknown error'),
        completedAt: transferResult.success ? new Date() : null,
      },
    });
    await this.historyClient.send({ cmd: 'history.log' }, { userId, eventType: 'TRANSFER', meta: { transferId: transfer.id, status: transfer.status } }).toPromise();
    return transfer;
  }

  async getHistory(userId: string) {
    const cards = await firstValueFrom(
      this.cardClient.send({ cmd: 'get-cards-by-user' }, userId)
    );
    if (!Array.isArray(cards) || cards.length === 0) {
      return [];
    }
    const cardIds = cards.map(card => card.id);

    const transfers = await this.prisma.transfer.findMany({
      where: {
        OR: [
          { senderCardId: { in: cardIds } },
          { receiverCardId: { in: cardIds } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.historyClient.send({ cmd: 'history.log' }, { userId, eventType: 'ADMIN_ACTION', meta: { action: 'payment.history' } }).toPromise();

    return transfers
      .map(tr => {
        let type: 'incoming' | 'outgoing';
        let cardId: string;
        if (cardIds.includes(tr.senderCardId)) {
          type = 'outgoing';
          cardId = tr.senderCardId;
        } else {
          type = 'incoming';
          cardId = tr.receiverCardId;
        }
        return {
          ...tr,
          type,
          cardId,
        };
      })
      .filter(tr =>
        (tr.type === 'outgoing' && cardIds.includes(tr.senderCardId)) ||
        (tr.type === 'incoming' && tr.status === 'completed' && cardIds.includes(tr.receiverCardId))
      );
  }

  async getById(id: string, userId: string) {
    const cards = await firstValueFrom(
      this.cardClient.send({ cmd: 'get-cards-by-user' }, userId)
    );
    const cardIds = cards.map(card => card.id);
    const transfer = await this.prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new BadRequestException('Transfer not found');

    let type: 'incoming' | 'outgoing' | null = null;
    let cardId: string | null = null;
    
    if (cardIds.includes(transfer.senderCardId)) {
      type = 'outgoing';
      cardId = transfer.senderCardId;
    } else if (cardIds.includes(transfer.receiverCardId)) {
      type = 'incoming';
      cardId = transfer.receiverCardId;
    } else {
      throw new ForbiddenException('Access denied');
    }

    await this.historyClient.send({ cmd: 'history.log' }, { userId, eventType: 'ADMIN_ACTION', meta: { action: 'payment.getById', transferId: id } }).toPromise();

    return {
      ...transfer,
      type,
      cardId,
    };
  }
}

