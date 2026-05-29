import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): { message: string; data: { status: string; service: string } } {
    return {
      message: 'PSMS foundation ready',
      data: {
        status: 'ok',
        service: 'psms-api',
      },
    };
  }
}
