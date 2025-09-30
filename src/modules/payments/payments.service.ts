import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuthorizeNetService } from './authorizenet.service';
import { TransactionsService } from '../transactions/transactions.service';
import { OrdersService } from '../orders/orders.service';
import { PurchaseDto, AuthorizeDto, CaptureDto, CancelDto, RefundDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizeNet: AuthorizeNetService,
    private readonly transactionsService: TransactionsService,
    private readonly ordersService: OrdersService,
  ) {}

  private detectCardType(cardNumber: string): string {
    const firstDigit = cardNumber.charAt(0);
    if (firstDigit === '4') return 'VISA';
    if (firstDigit === '5') return 'MASTERCARD';
    if (firstDigit === '3') return 'AMEX';
    if (firstDigit === '6') return 'DISCOVER';
    return 'UNKNOWN';
  }

  async purchase(purchaseDto: PurchaseDto, userId?: string, idempotencyKey?: string) {
    this.logger.log(`Processing purchase for order: ${purchaseDto.orderId}`);

    const order = await this.ordersService.findOne(purchaseDto.orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${purchaseDto.orderId} not found`);
    }

    try {
      const gatewayResponse = await this.authorizeNet.chargeCreditCard(
        Number(order.amount),
        purchaseDto.cardNumber,
        purchaseDto.expirationDate,
        purchaseDto.cvv,
        purchaseDto.billingAddress,
      );

      const transaction = await this.prisma.transaction.create({
        data: {
          orderId: order.id,
          type: 'PURCHASE',
          status: 'CAPTURED',
          amount: Number(order.amount),
          currency: order.currency,
          transactionId: gatewayResponse.transactionId,
          gatewayResponseCode: gatewayResponse.responseCode,
          authorizationCode: gatewayResponse.authCode,
          metadata: gatewayResponse,
          maskedCardNumber: purchaseDto.cardNumber.slice(-4),
          cardType: this.detectCardType(purchaseDto.cardNumber),
          idempotencyKey,
          userId,
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
        },
      });

      await this.ordersService.update(order.id, { status: 'CAPTURED' });

      this.logger.log(`Purchase completed: Transaction ${transaction.id}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Purchase failed: ${error.message}`);

      await this.prisma.transaction.create({
        data: {
          orderId: order.id,
          type: 'PURCHASE',
          status: 'FAILED',
          amount: Number(order.amount),
          currency: order.currency,
          maskedCardNumber: purchaseDto.cardNumber.slice(-4),
          cardType: this.detectCardType(purchaseDto.cardNumber),
          gatewayResponseReason: error.message,
          idempotencyKey,
          userId,
        },
      });

      throw error;
    }
  }

  async authorize(authorizeDto: AuthorizeDto, userId?: string, idempotencyKey?: string) {
    this.logger.log(`Processing authorization for order: ${authorizeDto.orderId}`);

    const order = await this.ordersService.findOne(authorizeDto.orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${authorizeDto.orderId} not found`);
    }

    try {
      const gatewayResponse = await this.authorizeNet.authorizeCreditCard(
        Number(order.amount),
        authorizeDto.cardNumber,
        authorizeDto.expirationDate,
        authorizeDto.cvv,
        authorizeDto.billingAddress,
      );

      const transaction = await this.prisma.transaction.create({
        data: {
          orderId: order.id,
          type: 'AUTHORIZE',
          status: 'AUTHORIZED',
          amount: Number(order.amount),
          currency: order.currency,
          transactionId: gatewayResponse.transactionId,
          gatewayResponseCode: gatewayResponse.responseCode,
          authorizationCode: gatewayResponse.authCode,
          metadata: gatewayResponse,
          maskedCardNumber: authorizeDto.cardNumber.slice(-4),
          cardType: this.detectCardType(authorizeDto.cardNumber),
          idempotencyKey,
          userId,
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
        },
      });

      await this.ordersService.update(order.id, { status: 'AUTHORIZED' });

      this.logger.log(`Authorization completed: Transaction ${transaction.id}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Authorization failed: ${error.message}`);

      await this.prisma.transaction.create({
        data: {
          orderId: order.id,
          type: 'AUTHORIZE',
          status: 'FAILED',
          amount: Number(order.amount),
          currency: order.currency,
          maskedCardNumber: authorizeDto.cardNumber.slice(-4),
          cardType: this.detectCardType(authorizeDto.cardNumber),
          gatewayResponseReason: error.message,
          idempotencyKey,
          userId,
        },
      });

      throw error;
    }
  }

  async capture(captureDto: CaptureDto, userId?: string) {
    this.logger.log(`Processing capture for transaction: ${captureDto.transactionId}`);

    const parentTransaction = await this.prisma.transaction.findUnique({
      where: { id: captureDto.transactionId },
      include: { order: true },
    });

    if (!parentTransaction) {
      throw new NotFoundException(`Transaction with ID ${captureDto.transactionId} not found`);
    }

    if (parentTransaction.status !== 'AUTHORIZED') {
      throw new BadRequestException(
        `Transaction must be in AUTHORIZED status to capture. Current status: ${parentTransaction.status}`,
      );
    }

    const captureAmount = captureDto.amount || Number(parentTransaction.amount);

    if (captureAmount > Number(parentTransaction.amount)) {
      throw new BadRequestException(
        `Capture amount cannot exceed authorized amount of ${parentTransaction.amount}`,
      );
    }

    try {
      const gatewayResponse = await this.authorizeNet.capturePreviousTransaction(
        parentTransaction.transactionId!,
        captureAmount,
      );

      const transaction = await this.prisma.transaction.create({
        data: {
          orderId: parentTransaction.orderId,
          parentTransactionId: parentTransaction.id,
          type: 'CAPTURE',
          status: 'CAPTURED',
          amount: captureAmount,
          currency: parentTransaction.currency,
          transactionId: gatewayResponse.transactionId,
          gatewayResponseCode: gatewayResponse.responseCode,
          metadata: gatewayResponse,
          maskedCardNumber: parentTransaction.maskedCardNumber,
          cardType: parentTransaction.cardType,
          userId,
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
          parentTransaction: true,
        },
      });

      const capturedAmount = await this.prisma.transaction.aggregate({
        where: {
          parentTransactionId: parentTransaction.id,
          type: 'CAPTURE',
          status: 'CAPTURED',
        },
        _sum: { amount: true },
      });

      const totalCaptured =
        Number(capturedAmount._sum.amount || 0) + captureAmount;

      if (totalCaptured >= Number(parentTransaction.amount)) {
        await this.ordersService.update(parentTransaction.orderId, { status: 'CAPTURED' });
      }

      this.logger.log(`Capture completed: Transaction ${transaction.id}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Capture failed: ${error.message}`);

      await this.prisma.transaction.create({
        data: {
          orderId: parentTransaction.orderId,
          parentTransactionId: parentTransaction.id,
          type: 'CAPTURE',
          status: 'FAILED',
          amount: captureAmount,
          currency: parentTransaction.currency,
          maskedCardNumber: parentTransaction.maskedCardNumber,
          cardType: parentTransaction.cardType,
          gatewayResponseReason: error.message,
          userId,
        },
      });

      throw error;
    }
  }

  async cancel(cancelDto: CancelDto, userId?: string) {
    this.logger.log(`Processing cancellation for transaction: ${cancelDto.transactionId}`);

    const parentTransaction = await this.prisma.transaction.findUnique({
      where: { id: cancelDto.transactionId },
      include: { order: true },
    });

    if (!parentTransaction) {
      throw new NotFoundException(`Transaction with ID ${cancelDto.transactionId} not found`);
    }

    if (parentTransaction.status !== 'AUTHORIZED') {
      throw new BadRequestException(
        `Only AUTHORIZED transactions can be cancelled. Current status: ${parentTransaction.status}`,
      );
    }

    try {
      const gatewayResponse = await this.authorizeNet.voidTransaction(
        parentTransaction.transactionId!,
      );

      const transaction = await this.prisma.transaction.create({
        data: {
          orderId: parentTransaction.orderId,
          parentTransactionId: parentTransaction.id,
          type: 'CANCEL',
          status: 'CANCELLED',
          amount: 0,
          currency: parentTransaction.currency,
          transactionId: gatewayResponse.transactionId,
          gatewayResponseCode: gatewayResponse.responseCode,
          metadata: gatewayResponse,
          maskedCardNumber: parentTransaction.maskedCardNumber,
          cardType: parentTransaction.cardType,
          userId,
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
          parentTransaction: true,
        },
      });

      await this.ordersService.update(parentTransaction.orderId, { status: 'CANCELLED' });

      this.logger.log(`Cancellation completed: Transaction ${transaction.id}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Cancellation failed: ${error.message}`);

      await this.prisma.transaction.create({
        data: {
          orderId: parentTransaction.orderId,
          parentTransactionId: parentTransaction.id,
          type: 'CANCEL',
          status: 'FAILED',
          amount: 0,
          currency: parentTransaction.currency,
          maskedCardNumber: parentTransaction.maskedCardNumber,
          cardType: parentTransaction.cardType,
          gatewayResponseReason: error.message,
          userId,
        },
      });

      throw error;
    }
  }

  async refund(refundDto: RefundDto, userId?: string) {
    this.logger.log(`Processing refund for transaction: ${refundDto.transactionId}`);

    const parentTransaction = await this.prisma.transaction.findUnique({
      where: { id: refundDto.transactionId },
      include: { order: true },
    });

    if (!parentTransaction) {
      throw new NotFoundException(`Transaction with ID ${refundDto.transactionId} not found`);
    }

    if (parentTransaction.status !== 'CAPTURED') {
      throw new BadRequestException(
        `Only CAPTURED transactions can be refunded. Current status: ${parentTransaction.status}`,
      );
    }

    const refundedAmount = await this.prisma.transaction.aggregate({
      where: {
        parentTransactionId: refundDto.transactionId,
        type: 'REFUND',
        status: 'REFUNDED',
      },
      _sum: { amount: true },
    });

    const totalRefunded = Number(refundedAmount._sum.amount || 0);
    const availableToRefund = Number(parentTransaction.amount) - totalRefunded;
    const refundAmount = refundDto.amount || availableToRefund;

    if (refundAmount > availableToRefund) {
      throw new BadRequestException(
        `Refund amount ${refundAmount} exceeds available amount ${availableToRefund}`,
      );
    }

    try {
      const gatewayResponse = await this.authorizeNet.refundTransaction(
        parentTransaction.transactionId!,
        refundAmount,
        parentTransaction.maskedCardNumber!,
      );

      const transaction = await this.prisma.transaction.create({
        data: {
          orderId: parentTransaction.orderId,
          parentTransactionId: parentTransaction.id,
          type: 'REFUND',
          status: 'REFUNDED',
          amount: refundAmount,
          currency: parentTransaction.currency,
          transactionId: gatewayResponse.transactionId,
          gatewayResponseCode: gatewayResponse.responseCode,
          metadata: refundDto.reason ? { ...gatewayResponse, reason: refundDto.reason } : gatewayResponse,
          maskedCardNumber: parentTransaction.maskedCardNumber,
          cardType: parentTransaction.cardType,
          userId,
        },
        include: {
          order: {
            include: {
              customer: true,
            },
          },
          parentTransaction: true,
        },
      });

      const newTotalRefunded = totalRefunded + refundAmount;
      if (newTotalRefunded >= Number(parentTransaction.amount)) {
        await this.ordersService.update(parentTransaction.orderId, { status: 'REFUNDED' });
      }

      this.logger.log(`Refund completed: Transaction ${transaction.id}`);
      return transaction;
    } catch (error) {
      this.logger.error(`Refund failed: ${error.message}`);

      await this.prisma.transaction.create({
        data: {
          orderId: parentTransaction.orderId,
          parentTransactionId: parentTransaction.id,
          type: 'REFUND',
          status: 'FAILED',
          amount: refundAmount,
          currency: parentTransaction.currency,
          maskedCardNumber: parentTransaction.maskedCardNumber,
          cardType: parentTransaction.cardType,
          gatewayResponseReason: error.message,
          metadata: refundDto.reason ? { reason: refundDto.reason } : undefined,
          userId,
        },
      });

      throw error;
    }
  }
}