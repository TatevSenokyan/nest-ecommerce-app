import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_CONFIG } from './common/constants/app.constants';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: APP_CONFIG,
          useValue: { environment: 'test', port: 3000 },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello!"', () => {
      expect(appController.getHello()).toBe('Hello!');
    });
  });
});
