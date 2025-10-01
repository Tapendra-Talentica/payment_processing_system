import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../config/prisma.service';
import { AuthorizeNetService } from './authorizenet.service';
import { TransactionsService } from '../transactions/transactions.service';
import { OrdersService } from '../orders/orders.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: PrismaService;
  let authorizeNetService: AuthorizeNetService;
  let ordersService: OrdersService;

  const mockOrder = {
    id: 'order-123',
    customerId: 'customer-123',
    amount: 100.0,
    currency: 'USD',
    status: 'PENDING',
    metadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockGatewayResponse = {
    success: true,
    transactionId: 'txn-123',
    responseCode: '1',
    messageCode: '1',
    description: 'This transaction has been approved.',
    authCode: 'ABC123',
  };

  const mockTransaction = {
    id: 'transaction-123',
    orderId: 'order-123',
    type: 'PURCHASE',
    status: 'CAPTURED',
    amount: 100.0,
    currency: 'USD',
    transactionId: 'txn-123',
    maskedCardNumber: '1111',
    cardType: 'VISA',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            transaction: {
              create: jest.fn(),
              findUnique: jest.fn(),
              aggregate: jest.fn(),
            },
          },
        },
        {
          provide: AuthorizeNetService,
          useValue: {
            chargeCreditCard: jest.fn(),
            authorizeCreditCard: jest.fn(),
            capturePreviousTransaction: jest.fn(),
            voidTransaction: jest.fn(),
            refundTransaction: jest.fn(),
          },
        },
        {
          provide: TransactionsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: OrdersService,
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    authorizeNetService = module.get<AuthorizeNetService>(AuthorizeNetService);
    ordersService = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('purchase', () => {
    const purchaseDto = {
      orderId: 'order-123',
      cardNumber: '4111111111111111',
      expirationDate: '12/25',
      cvv: '123',
    };

    it('should successfully process a purchase', async () => {
      jest.spyOn(ordersService, 'findOne').mockResolvedValue(mockOrder as any);
      jest.spyOn(authorizeNetService, 'chargeCreditCard').mockResolvedValue(mockGatewayResponse);
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue({
        ...mockTransaction,
        order: { ...mockOrder, customer: { id: 'customer-123', name: 'Test Customer' } },
      } as any);
      jest.spyOn(ordersService, 'update').mockResolvedValue(mockOrder as any);

      const result = await service.purchase(purchaseDto);

      expect(ordersService.findOne).toHaveBeenCalledWith('order-123');
      expect(authorizeNetService.chargeCreditCard).toHaveBeenCalledWith(
        100.0,
        '4111111111111111',
        '12/25',
        '123',
        undefined,
      );
      expect(prismaService.transaction.create).toHaveBeenCalled();
      expect(ordersService.update).toHaveBeenCalledWith('order-123', { status: 'CAPTURED' });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if order not found', async () => {
      jest.spyOn(ordersService, 'findOne').mockResolvedValue(null as any);

      await expect(service.purchase(purchaseDto)).rejects.toThrow(NotFoundException);
    });

    it('should create failed transaction on gateway error', async () => {
      jest.spyOn(ordersService, 'findOne').mockResolvedValue(mockOrder as any);
      jest
        .spyOn(authorizeNetService, 'chargeCreditCard')
        .mockRejectedValue(new Error('Gateway error'));
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue(mockTransaction as any);

      await expect(service.purchase(purchaseDto)).rejects.toThrow('Gateway error');
      expect(prismaService.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
          }),
        }),
      );
    });
  });

  describe('authorize', () => {
    const authorizeDto = {
      orderId: 'order-123',
      cardNumber: '4111111111111111',
      expirationDate: '12/25',
      cvv: '123',
    };

    it('should successfully authorize a payment', async () => {
      jest.spyOn(ordersService, 'findOne').mockResolvedValue(mockOrder as any);
      jest
        .spyOn(authorizeNetService, 'authorizeCreditCard')
        .mockResolvedValue(mockGatewayResponse);
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue({
        ...mockTransaction,
        status: 'AUTHORIZED',
        order: { ...mockOrder, customer: { id: 'customer-123', name: 'Test Customer' } },
      } as any);
      jest.spyOn(ordersService, 'update').mockResolvedValue(mockOrder as any);

      const result = await service.authorize(authorizeDto);

      expect(authorizeNetService.authorizeCreditCard).toHaveBeenCalled();
      expect(ordersService.update).toHaveBeenCalledWith('order-123', { status: 'AUTHORIZED' });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if order not found', async () => {
      jest.spyOn(ordersService, 'findOne').mockResolvedValue(null as any);

      await expect(service.authorize(authorizeDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('capture', () => {
    const captureDto = {
      transactionId: 'transaction-123',
      amount: 50.0,
    };

    const mockParentTransaction = {
      id: 'transaction-123',
      orderId: 'order-123',
      status: 'AUTHORIZED',
      amount: 100.0,
      currency: 'USD',
      transactionId: 'txn-123',
      maskedCardNumber: '1111',
      cardType: 'VISA',
      order: mockOrder,
    };

    it('should successfully capture an authorized payment', async () => {
      jest
        .spyOn(prismaService.transaction, 'findUnique')
        .mockResolvedValue(mockParentTransaction as any);
      jest
        .spyOn(authorizeNetService, 'capturePreviousTransaction')
        .mockResolvedValue(mockGatewayResponse);
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue({
        ...mockTransaction,
        type: 'CAPTURE',
        parentTransaction: mockParentTransaction,
      } as any);
      jest.spyOn(prismaService.transaction, 'aggregate').mockResolvedValue({
        _sum: { amount: 50.0 },
      } as any);
      jest.spyOn(ordersService, 'update').mockResolvedValue(mockOrder as any);

      const result = await service.capture(captureDto);

      expect(authorizeNetService.capturePreviousTransaction).toHaveBeenCalledWith('txn-123', 50.0);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      jest.spyOn(prismaService.transaction, 'findUnique').mockResolvedValue(null);

      await expect(service.capture(captureDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if transaction not authorized', async () => {
      jest
        .spyOn(prismaService.transaction, 'findUnique')
        .mockResolvedValue({ ...mockParentTransaction, status: 'CAPTURED' } as any);

      await expect(service.capture(captureDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if capture amount exceeds authorized amount', async () => {
      const largeCaptureDto = {
        transactionId: 'transaction-123',
        amount: 150.0,
      };

      jest
        .spyOn(prismaService.transaction, 'findUnique')
        .mockResolvedValue(mockParentTransaction as any);

      await expect(service.capture(largeCaptureDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    const cancelDto = {
      transactionId: 'transaction-123',
    };

    const mockParentTransaction = {
      id: 'transaction-123',
      orderId: 'order-123',
      status: 'AUTHORIZED',
      amount: 100.0,
      currency: 'USD',
      transactionId: 'txn-123',
      maskedCardNumber: '1111',
      cardType: 'VISA',
      order: mockOrder,
    };

    it('should successfully cancel an authorized payment', async () => {
      jest
        .spyOn(prismaService.transaction, 'findUnique')
        .mockResolvedValue(mockParentTransaction as any);
      jest.spyOn(authorizeNetService, 'voidTransaction').mockResolvedValue(mockGatewayResponse);
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue({
        ...mockTransaction,
        type: 'CANCEL',
        status: 'CANCELLED',
      } as any);
      jest.spyOn(ordersService, 'update').mockResolvedValue(mockOrder as any);

      const result = await service.cancel(cancelDto);

      expect(authorizeNetService.voidTransaction).toHaveBeenCalledWith('txn-123');
      expect(ordersService.update).toHaveBeenCalledWith('order-123', { status: 'CANCELLED' });
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if transaction not authorized', async () => {
      jest
        .spyOn(prismaService.transaction, 'findUnique')
        .mockResolvedValue({ ...mockParentTransaction, status: 'CAPTURED' } as any);

      await expect(service.cancel(cancelDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('refund', () => {
    const refundDto = {
      transactionId: 'transaction-123',
      amount: 50.0,
      reason: 'Customer request',
    };

    const mockParentTransaction = {
      id: 'transaction-123',
      orderId: 'order-123',
      status: 'CAPTURED',
      amount: 100.0,
      currency: 'USD',
      transactionId: 'txn-123',
      maskedCardNumber: '1111',
      cardType: 'VISA',
      order: mockOrder,
    };

    it('should successfully refund a captured payment', async () => {
      jest
        .spyOn(prismaService.transaction, 'findUnique')
        .mockResolvedValue(mockParentTransaction as any);
      jest.spyOn(prismaService.transaction, 'aggregate').mockResolvedValue({
        _sum: { amount: 0 },
      } as any);
      jest.spyOn(authorizeNetService, 'refundTransaction').mockResolvedValue(mockGatewayResponse);
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue({
        ...mockTransaction,
        type: 'REFUND',
        status: 'REFUNDED',
      } as any);
      jest.spyOn(ordersService, 'update').mockResolvedValue(mockOrder as any);

      const result = await service.refund(refundDto);

      expect(authorizeNetService.refundTransaction).toHaveBeenCalledWith('txn-123', 50.0, '1111');
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if transaction not captured', async () => {
      jest
        .spyOn(prismaService.transaction, 'findUnique')
        .mockResolvedValue({ ...mockParentTransaction, status: 'AUTHORIZED' } as any);

      await expect(service.refund(refundDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if refund amount exceeds available amount', async () => {
      const largeRefundDto = {
        transactionId: 'transaction-123',
        amount: 150.0,
      };

      jest
        .spyOn(prismaService.transaction, 'findUnique')
        .mockResolvedValue(mockParentTransaction as any);
      jest.spyOn(prismaService.transaction, 'aggregate').mockResolvedValue({
        _sum: { amount: 0 },
      } as any);

      await expect(service.refund(largeRefundDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('detectCardType', () => {
    it('should detect VISA card', () => {
      const cardType = service['detectCardType']('4111111111111111');
      expect(cardType).toBe('VISA');
    });

    it('should detect MASTERCARD', () => {
      const cardType = service['detectCardType']('5555555555554444');
      expect(cardType).toBe('MASTERCARD');
    });

    it('should detect AMEX', () => {
      const cardType = service['detectCardType']('378282246310005');
      expect(cardType).toBe('AMEX');
    });

    it('should detect DISCOVER', () => {
      const cardType = service['detectCardType']('6011111111111117');
      expect(cardType).toBe('DISCOVER');
    });

    it('should return UNKNOWN for unrecognized cards', () => {
      const cardType = service['detectCardType']('9999999999999999');
      expect(cardType).toBe('UNKNOWN');
    });
  });
});

