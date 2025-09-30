import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'];

    if (!idempotencyKey) {
      return next.handle();
    }

    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingTransaction) {
      this.logger.warn(`Duplicate request detected for idempotency key: ${idempotencyKey}`);
      throw new ConflictException(
        'A transaction with this idempotency key already exists',
        JSON.stringify({
          transactionId: existingTransaction.id,
          status: existingTransaction.status,
        }),
      );
    }

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`Transaction processed with idempotency key: ${idempotencyKey}`);
      }),
    );
  }
}
