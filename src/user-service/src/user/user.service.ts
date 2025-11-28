import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto';
import { ClientProxy } from '@nestjs/microservices';
import { UserStatus } from '../../common/types/user-status';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('HISTORY_SERVICE') private readonly historyClient: ClientProxy,
  ) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        twoFactorEnabled: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async create(data: any) {
    const exists = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (exists)
      throw new RpcException({
        status: 409,
        message: 'User with this email or phone already exists',
      });

    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);

    return this.prisma.user.create({ data });
  }

  async delete(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async updateProfile(id: string, data: UpdateProfileDto) {
    const updateData: any = {};
    const changedFields: string[] = [];
    if (data.email) { updateData.email = data.email; changedFields.push('email'); }
    if (data.phone) {
      const existingUser = await this.prisma.user.findUnique({ where: { phone: data.phone } });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this phone already exists');
      }
      updateData.phone = data.phone;
      changedFields.push('phone');
    }
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      changedFields.push('password');
    }
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('No data to update');
    }

    try {
      const user = await this.prisma.user.update({ where: { id }, data: updateData });
      await this.historyClient.send({ cmd: 'history.log' }, { userId: id, eventType: 'PROFILE_UPDATE', meta: { changedFields } }).toPromise();
      return user;
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async enable2FA(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  async disable2FA(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false },
    });
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<any> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }
}
