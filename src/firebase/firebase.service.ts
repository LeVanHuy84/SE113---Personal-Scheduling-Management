import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { Message, getMessaging } from 'firebase-admin/messaging';

type SendTopicNotificationInput = {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
};

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: App | null = null;

  constructor(private readonly configService: ConfigService) { }

  isEnabled(): boolean {
    const rawValue = this.configService.get<string>('FIREBASE_ENABLED') ?? 'false';
    return rawValue.toLowerCase() === 'true';
  }

  private getApp(): App | null {
    if (!this.isEnabled()) {
      return null;
    }

    if (!this.firebaseApp) {
      this.firebaseApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    return this.firebaseApp;
  }

  async sendToDevices(
    input: SendTopicNotificationInput,
  ): Promise<void> {
    const app = this.getApp();
    if (!app) {
      return;
    }

    await getMessaging(app).sendEachForMulticast({
      tokens: input.tokens,
      notification: {
        title: input.title,
        body: input.body,
      },
      data: input.data,
    });
  }
}
