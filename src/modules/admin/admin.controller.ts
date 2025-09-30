import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PaymentsService } from '../payments/payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CancelDto, RefundDto } from '../payments/dto/payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getTransactions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('orderId') orderId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.adminService.getTransactions(page, limit, { orderId, status, type });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'Stats retrieved successfully' })
  async getStats() {
    return this.adminService.getDashboardStats();
  }

  @Post('refund')
  @ApiOperation({ summary: 'Manual refund (admin only)' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  async manualRefund(@Body() refundDto: RefundDto, @CurrentUser() user: any) {
    return this.paymentsService.refund(refundDto, user.id);
  }

  @Post('cancel')
  @ApiOperation({ summary: 'Manual cancel/void (admin only)' })
  @ApiResponse({ status: 200, description: 'Transaction cancelled successfully' })
  async manualCancel(@Body() cancelDto: CancelDto, @CurrentUser() user: any) {
    return this.paymentsService.cancel(cancelDto, user.id);
  }
}
