import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { getPaginationParams, createPaginationResult } from '../../common/utils/pagination.util';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    page = 1,
    limit = 10,
    orderId?: string,
    status?: TransactionStatus,
    type?: TransactionType,
  ) {
    const { skip, take } = getPaginationParams(page, limit);

    const where = {
      ...(orderId && { orderId }),
      ...(status && { status }),
      ...(type && { type }),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take,
        include: {
          order: {
            include: {
              customer: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return createPaginationResult(transactions, total, page, limit);
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        parentTransaction: true,
        childTransactions: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async findByOrderId(orderId: string) {
    return this.prisma.transaction.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}
