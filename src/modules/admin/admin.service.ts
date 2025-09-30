import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getTransactions(page: number, limit: number, filters?: any) {
    return this.transactionsService.findAll(
      page,
      limit,
      filters?.orderId,
      filters?.status,
      filters?.type,
    );
  }

  async getDashboardStats() {
    const [totalOrders, totalTransactions, pendingOrders, capturedTransactions] = await Promise.all(
      [
        this.prisma.order.count(),
        this.prisma.transaction.count(),
        this.prisma.order.count({ where: { status: 'PENDING' } }),
        this.prisma.transaction.count({ where: { status: 'CAPTURED' } }),
      ],
    );

    return {
      totalOrders,
      totalTransactions,
      pendingOrders,
      capturedTransactions,
    };
  }
}
