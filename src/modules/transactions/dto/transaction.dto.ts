import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { TransactionType, TransactionStatus } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ example: 'order-uuid-here' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
