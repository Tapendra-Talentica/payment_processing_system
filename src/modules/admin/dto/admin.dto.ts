import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TransactionStatus, TransactionType } from '@prisma/client';

export class TransactionFilterDto {
  @ApiPropertyOptional({ example: 'order-uuid' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;
}
