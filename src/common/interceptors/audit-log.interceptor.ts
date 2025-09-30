import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const action = `${request.method} ${request.url}`;
    const ipAddress = request.ip;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user?.id,
              action,
              details: {
                method: request.method,
                url: request.url,
                body: request.body,
                response: data,
              },
              ipAddress,
              userAgent,
            },
          });
        } catch (error) {
          this.logger.error('Failed to create audit log', error);
        }
      }),
      catchError(async (error) => {
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: user?.id,
              action: `${action} [FAILED]`,
              details: {
                method: request.method,
                url: request.url,
                body: request.body,
                error: error.message,
              },
              ipAddress,
              userAgent,
            },
          });
        } catch (logError) {
          this.logger.error('Failed to create error audit log', logError);
        }
        throw error;
      }),
    );
  }
}
