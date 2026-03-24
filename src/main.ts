import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { setupApplication } from './common/setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await setupApplication(app);

  const configService = app.get(ConfigService);
  const port = Number(configService.getOrThrow<string>('PORT'));

  await app.listen(port);
}
bootstrap();
