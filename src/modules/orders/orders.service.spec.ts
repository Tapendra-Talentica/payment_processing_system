import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../config/prisma.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;

  const mockOrder = {
    id: 'order-123',
    customerId: 'customer-123',
    userId: 'user-123',
    amount: 100.0,
    currency: 'USD',
    status: 'PENDING',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOrderDto = {
      customerId: 'customer-123',
      amount: 100.0,
      currency: 'USD',
    };

    it('should successfully create an order', async () => {
      jest.spyOn(prismaService.order, 'create').mockResolvedValue(mockOrder as any);

      const result = await service.create(createOrderDto);

      expect(prismaService.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: 'customer-123',
          amount: 100.0,
          currency: 'USD',
        }),
        include: {
          customer: true,
          transactions: true,
        },
      });
      expect(result).toEqual(mockOrder);
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const orders = [mockOrder];
      jest.spyOn(prismaService.order, 'findMany').mockResolvedValue(orders as any);
      jest.spyOn(prismaService.order, 'count').mockResolvedValue(1);

      const result = await service.findAll();

      expect(result.data).toEqual(orders);
      expect(result.meta.total).toBe(1);
      expect(prismaService.order.findMany).toHaveBeenCalled();
    });

    it('should apply pagination', async () => {
      jest.spyOn(prismaService.order, 'findMany').mockResolvedValue([mockOrder] as any);
      jest.spyOn(prismaService.order, 'count').mockResolvedValue(1);

      await service.findAll(2, 10);

      expect(prismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);

      const result = await service.findOne('order-123');

      expect(prismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateOrderDto = {
      status: 'CAPTURED' as any,
    };

    it('should update an order', async () => {
      const updatedOrder = { ...mockOrder, ...updateOrderDto };
      jest.spyOn(prismaService.order, 'findUnique').mockResolvedValue(mockOrder as any);
      jest.spyOn(prismaService.order, 'update').mockResolvedValue(updatedOrder as any);

      const result = await service.update('order-123', updateOrderDto);

      expect(prismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        data: updateOrderDto,
        include: expect.any(Object),
      });
      expect(result).toEqual(updatedOrder);
    });
  });
});
