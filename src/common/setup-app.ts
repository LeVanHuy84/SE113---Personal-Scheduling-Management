import { INestApplication } from '@nestjs/common';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { PrismaService } from '../prisma/prisma.service';

type SetupApplicationOptions = {
  connectDatabase?: boolean;
};

export async function setupApplication(
  app: INestApplication,
  options: SetupApplicationOptions = {},
): Promise<void> {
  const { connectDatabase = true } = options;

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  if (connectDatabase) {
    const prismaService = app.get(PrismaService);
    await prismaService.$connect();
    await prismaService.enableShutdownHooks(app);
  }
}
