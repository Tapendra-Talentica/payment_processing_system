import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [TransactionsModule, PaymentsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
