import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    this.client = redisUrl
      ? new Redis(redisUrl)
      : (this.client = new Redis({
          host: this.configService.getOrThrow<string>('REDIS_HOST'),
          port: Number(this.configService.getOrThrow<string>('REDIS_PORT')),
          username: this.configService.get<string>('REDIS_USERNAME'),
          password:
            this.configService.get<string>('REDIS_PASSWORD') || undefined,
        }));
  }

  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set(key: string, value: unknown): Promise<'OK'> {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);
    return this.client.set(key, serialized);
  }

  async setex(key: string, ttlSeconds: number, value: unknown): Promise<'OK'> {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);
    return this.client.setex(key, ttlSeconds, serialized);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
