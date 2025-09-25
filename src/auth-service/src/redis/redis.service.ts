import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Redis(this.configService.get<string>('REDIS_URL'));
    this.client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  private sessionKey(sessionId: string) {
    return `session:${sessionId}`;
  }

  private userKey(userId: string) {
    return `user-session:${userId}`;
  }

  async setSession(
    sessionId: string,
    data: any,
    ttlSeconds = 300,
  ): Promise<boolean> {
    const pipeline = this.client.pipeline();
    pipeline.set(
      this.sessionKey(sessionId),
      JSON.stringify(data),
      'EX',
      ttlSeconds,
    );
    pipeline.sadd(this.userKey(data.userId), sessionId);
    pipeline.expire(this.userKey(data.userId), ttlSeconds);
    await pipeline.exec();
    return true;
  }

  async getSession(sessionId: string): Promise<any | null> {
    const data = await this.client.get(this.sessionKey(sessionId));
    return data ? JSON.parse(data) : null;
  }

  async getSessionsByUserId(userId: string): Promise<string[]> {
    return this.client.smembers(this.userKey(userId));
  }

  async deleteSession(sessionId: string) {
    const sessionData = await this.client.get(this.sessionKey(sessionId));
    const pipeline = this.client.pipeline();

    if (sessionData) {
      const { userId } = JSON.parse(sessionData);
      pipeline.srem(this.userKey(userId), sessionId);
    }

    pipeline.del(this.sessionKey(sessionId));
    await pipeline.exec();
  }

  async deleteAllUserSessions(userId: string) {
    const sessions = await this.getSessionsByUserId(userId);
    const pipeline = this.client.pipeline();

    for (const sessionId of sessions) {
      pipeline.del(this.sessionKey(sessionId));
    }

    pipeline.del(this.userKey(userId));
    await pipeline.exec();
  }
}
