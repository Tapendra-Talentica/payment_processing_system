import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../../config/prisma.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let prismaService: PrismaService;

  const mockCustomer = {
    id: 'customer-123',
    email: 'test@example.com',
    name: 'Test Customer',
    billingAddress: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: {
            customer: {
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

    service = module.get<CustomersService>(CustomersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createCustomerDto = {
      email: 'test@example.com',
      name: 'Test Customer',
    };

    it('should successfully create a customer', async () => {
      jest.spyOn(prismaService.customer, 'create').mockResolvedValue(mockCustomer as any);

      const result = await service.create(createCustomerDto);

      expect(prismaService.customer.create).toHaveBeenCalledWith({
        data: createCustomerDto,
      });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const customers = [mockCustomer];
      jest.spyOn(prismaService.customer, 'findMany').mockResolvedValue(customers as any);
      jest.spyOn(prismaService.customer, 'count').mockResolvedValue(1);

      const result = await service.findAll();

      expect(result.data).toEqual(customers);
      expect(result.meta.total).toBe(1);
      expect(prismaService.customer.findMany).toHaveBeenCalled();
    });

    it('should apply pagination', async () => {
      jest.spyOn(prismaService.customer, 'findMany').mockResolvedValue([mockCustomer] as any);
      jest.spyOn(prismaService.customer, 'count').mockResolvedValue(1);

      await service.findAll(2, 10);

      expect(prismaService.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      jest.spyOn(prismaService.customer, 'findUnique').mockResolvedValue(mockCustomer as any);

      const result = await service.findOne('customer-123');

      expect(prismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException if customer not found', async () => {
      jest.spyOn(prismaService.customer, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateCustomerDto = {
      name: 'Updated Name',
    };

    it('should update a customer', async () => {
      const updatedCustomer = { ...mockCustomer, ...updateCustomerDto };
      jest.spyOn(prismaService.customer, 'findUnique').mockResolvedValue(mockCustomer as any);
      jest.spyOn(prismaService.customer, 'update').mockResolvedValue(updatedCustomer as any);

      const result = await service.update('customer-123', updateCustomerDto);

      expect(prismaService.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-123' },
        data: updateCustomerDto,
      });
      expect(result).toEqual(updatedCustomer);
    });
  });
});
