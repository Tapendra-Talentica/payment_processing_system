import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { getPaginationParams, createPaginationResult } from '../../common/utils/pagination.util';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: createCustomerDto,
    });
  }

  async findAll(page = 1, limit = 10) {
    const { skip, take } = getPaginationParams(page, limit);

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        skip,
        take,
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count(),
    ]);

    return createPaginationResult(customers, total, page, limit);
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            transactions: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);

    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.customer.findFirst({
      where: { email },
    });
  }
}
