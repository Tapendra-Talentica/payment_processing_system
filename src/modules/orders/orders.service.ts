import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';
import { getPaginationParams, createPaginationResult } from '../../common/utils/pagination.util';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, userId?: string) {
    return this.prisma.order.create({
      data: {
        customerId: createOrderDto.customerId,
        userId,
        amount: createOrderDto.amount,
        currency: createOrderDto.currency || 'USD',
        metadata: createOrderDto.metadata,
      },
      include: {
        customer: true,
        transactions: true,
      },
    });
  }

  async findAll(page = 1, limit = 10, customerId?: string, status?: any) {
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      ...(customerId && { customerId }),
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        include: {
          customer: true,
          transactions: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return createPaginationResult(orders, total, page, limit);
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    await this.findOne(id);

    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
      include: {
        customer: true,
        transactions: true,
      },
    });
  }
}
