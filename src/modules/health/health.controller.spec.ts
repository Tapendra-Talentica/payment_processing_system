import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../config/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            isHealthy: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health status when database is connected', async () => {
      jest.spyOn(prismaService, 'isHealthy').mockResolvedValue(true);

      const result = await controller.check();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('database', 'connected');
    });

    it('should return degraded status when database is disconnected', async () => {
      jest.spyOn(prismaService, 'isHealthy').mockResolvedValue(false);

      const result = await controller.check();

      expect(result).toHaveProperty('status', 'degraded');
      expect(result).toHaveProperty('database', 'disconnected');
    });
  });
});
