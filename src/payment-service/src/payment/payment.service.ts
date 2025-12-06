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
        this.cardClient.send(
          { cmd: 'transfer' },
          {
            senderCardId: senderCard.id,
            receiverCardId: receiverCard.id,
            amount: dto.amount,
            currency: dto.currency,
          },
        ),
      );
    } catch (e) {
      await this.historyClient.send({ cmd: 'history.log' }, { userId, eventType: 'ADMIN_ACTION', meta: { action: 'payment.transfer.failed', error: e.message, dto } }).toPromise();
      throw e;
    }
    const transfer = await this.prisma.transfer.create({
      data: {
        senderCardNumber: senderCard.cardNumber,
        receiverCardNumber: receiverCard.cardNumber,
        amount: dto.amount,
        currency: dto.currency,
        status: transferResult.success ? 'completed' : 'failed',
        comment: transferResult.success
          ? null
          : transferResult.error || 'Unknown error',
        completedAt: transferResult.success ? new Date() : null,
      },
    });
    await this.historyClient.send({ cmd: 'history.log' }, { userId, eventType: 'TRANSFER', meta: { transferId: transfer.id, status: transfer.status } }).toPromise();
    return transfer;
  }

  async getHistory(userId: string) {
    const cards = await firstValueFrom(
      this.cardClient.send({ cmd: 'get-cards-by-user' }, userId),
    );
    if (!Array.isArray(cards) || cards.length === 0) {
      return [];
    }
    const cardNumbers = cards.map((card) => card.cardNumber);

    const transfers = await this.prisma.transfer.findMany({
      where: {
        OR: [
          { senderCardNumber: { in: cardNumbers } },
          { receiverCardNumber: { in: cardNumbers } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.historyClient
      .send(
        { cmd: 'history.log' },
        { userId, eventType: 'ADMIN_ACTION', meta: { action: 'payment.history' } },
      )
      .toPromise();

    return transfers
      .map((tr) => {
        let type: 'incoming' | 'outgoing';
        let cardNumber: string;
        if (cardNumbers.includes(tr.senderCardNumber)) {
          type = 'outgoing';
          cardNumber = tr.senderCardNumber;
        } else {
          type = 'incoming';
          cardNumber = tr.receiverCardNumber;
        }
        return {
          ...tr,
          type,
          cardNumber,
        };
      })
      .filter(
        (tr) =>
          (tr.type === 'outgoing' &&
            cardNumbers.includes(tr.senderCardNumber)) ||
          (tr.type === 'incoming' &&
            tr.status === 'completed' &&
            cardNumbers.includes(tr.receiverCardNumber)),
      );
  }

  async getById(id: string, userId: string) {
    const cards = await firstValueFrom(
      this.cardClient.send({ cmd: 'get-cards-by-user' }, userId),
    );
    const cardNumbers = cards.map((card) => card.cardNumber);
    const transfer = await this.prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new BadRequestException('Transfer not found');

    let type: 'incoming' | 'outgoing' | null = null;
    let cardNumber: string | null = null;
    
    if (cardNumbers.includes(transfer.senderCardNumber)) {
      type = 'outgoing';
      cardNumber = transfer.senderCardNumber;
    } else if (cardNumbers.includes(transfer.receiverCardNumber)) {
      type = 'incoming';
      cardNumber = transfer.receiverCardNumber;
    } else {
      throw new ForbiddenException('Access denied');
    }

    await this.historyClient
      .send(
        { cmd: 'history.log' },
        {
          userId,
          eventType: 'ADMIN_ACTION',
          meta: { action: 'payment.getById', transferId: id },
        },
      )
      .toPromise();

    return {
      ...transfer,
      type,
      cardNumber,
    };
  }

  async getHistoryByCard(cardNumber: string, userId: string) {
    const card = await firstValueFrom(
      this.cardClient.send({ cmd: 'get-card-by-number' }, cardNumber),
    );

    if (!card) {
      throw new BadRequestException('Card not found');
    }

    if (card.userId !== userId) {
      throw new ForbiddenException('Not your card');
    }

    const transfers = await this.prisma.transfer.findMany({
      where: {
        OR: [
          { senderCardNumber: cardNumber },
          { receiverCardNumber: cardNumber },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return transfers.map((tr) => ({
      ...tr,
      type: tr.senderCardNumber === cardNumber ? 'outgoing' : 'incoming',
      cardNumber,
    }));
  }
}

