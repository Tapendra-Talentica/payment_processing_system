import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../config/prisma.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prismaService: PrismaService;

  const mockTransaction = {
    id: 'transaction-123',
    orderId: 'order-123',
    userId: 'user-123',
    transactionId: 'txn-123',
    type: 'PURCHASE',
    status: 'CAPTURED',
    amount: 100.0,
    currency: 'USD',
    maskedCardNumber: '1111',
    cardType: 'VISA',
    authorizationCode: 'ABC123',
    gatewayResponseCode: '1',
    gatewayResponseReason: 'Approved',
    idempotencyKey: 'idempotency-key-123',
    parentTransactionId: null,
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: {
            transaction: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated transactions', async () => {
      const transactions = [mockTransaction];
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue(transactions as any);
      jest.spyOn(prismaService.transaction, 'count').mockResolvedValue(1);

      const result = await service.findAll();

      expect(result.data).toEqual(transactions);
      expect(result.meta.total).toBe(1);
      expect(prismaService.transaction.findMany).toHaveBeenCalled();
    });

    it('should apply pagination', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([mockTransaction] as any);
      jest.spyOn(prismaService.transaction, 'count').mockResolvedValue(1);

      await service.findAll(2, 10);

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should filter by status', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([mockTransaction] as any);
      jest.spyOn(prismaService.transaction, 'count').mockResolvedValue(1);

      await service.findAll(1, 10, undefined, 'CAPTURED');

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'CAPTURED',
          }),
        }),
      );
    });

    it('should filter by type', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([mockTransaction] as any);
      jest.spyOn(prismaService.transaction, 'count').mockResolvedValue(1);

      await service.findAll(1, 10, undefined, undefined, 'PURCHASE');

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'PURCHASE',
          }),
        }),
      );
    });

    it('should filter by orderId', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([mockTransaction] as any);
      jest.spyOn(prismaService.transaction, 'count').mockResolvedValue(1);

      await service.findAll(1, 10, 'order-123');

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderId: 'order-123',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      jest.spyOn(prismaService.transaction, 'findUnique').mockResolvedValue(mockTransaction as any);

      const result = await service.findOne('transaction-123');

      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 'transaction-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException if transaction not found', async () => {
      jest.spyOn(prismaService.transaction, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByOrderId', () => {
    it('should return transactions for a specific order', async () => {
      const transactions = [mockTransaction];
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue(transactions as any);

      const result = await service.findByOrderId('order-123');

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { orderId: 'order-123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(transactions);
    });
  });
});
