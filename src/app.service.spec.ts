import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  it('should return foundation health payload', () => {
    expect(service.getHealth()).toEqual({
      message: 'PSMS foundation ready',
      data: {
        status: 'ok',
        service: 'psms-api',
      },
    });
  });
});
