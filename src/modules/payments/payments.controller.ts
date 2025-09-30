import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  PurchaseDto,
  AuthorizeDto,
  CaptureDto,
  CancelDto,
  RefundDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyInterceptor } from '../../common/interceptors/idempotency.interceptor';
import { AuditLogInterceptor } from '../../common/interceptors/audit-log.interceptor';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@UseInterceptors(IdempotencyInterceptor, AuditLogInterceptor)
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('purchase')
  @Public()
  @ApiOperation({ summary: 'Direct payment (charge immediately)' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment details' })
  async purchase(
    @Body() purchaseDto: PurchaseDto,
    @CurrentUser() user?: any,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.paymentsService.purchase(purchaseDto, user?.id, idempotencyKey);
  }

  @Post('authorize')
  @Public()
  @ApiOperation({ summary: 'Authorize payment (hold funds)' })
  @ApiHeader({ name: 'Idempotency-Key', required: false })
  @ApiResponse({ status: 201, description: 'Payment authorized successfully' })
  async authorize(
    @Body() authorizeDto: AuthorizeDto,
    @CurrentUser() user?: any,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.paymentsService.authorize(authorizeDto, user?.id, idempotencyKey);
  }

  @Post('capture')
  @ApiOperation({ summary: 'Capture authorized payment' })
  @ApiResponse({ status: 200, description: 'Payment captured successfully' })
  async capture(@Body() captureDto: CaptureDto, @CurrentUser() user?: any) {
    return this.paymentsService.capture(captureDto, user?.id);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Cancel/void authorized payment' })
  @ApiResponse({ status: 200, description: 'Payment cancelled successfully' })
  async cancel(@Body() cancelDto: CancelDto, @CurrentUser() user?: any) {
    return this.paymentsService.cancel(cancelDto, user?.id);
  }

  @Post('refund')
  @ApiOperation({ summary: 'Refund captured payment (full or partial)' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  async refund(@Body() refundDto: RefundDto, @CurrentUser() user?: any) {
    return this.paymentsService.refund(refundDto, user?.id);
  }
}
