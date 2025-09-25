import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma';

@Injectable()
export class CardOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const cardId = req.params.id;
    if (!cardId) throw new ForbiddenException('No card id provided');
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card || card.userId !== req.user.userId) {
      throw new ForbiddenException('Access denied: not your card');
    }
    return true;
  }
}