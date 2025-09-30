import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { AuthorizeNetService } from './authorizenet.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [TransactionsModule, OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, AuthorizeNetService],
  exports: [PaymentsService, AuthorizeNetService],
})
export class PaymentsModule {}
