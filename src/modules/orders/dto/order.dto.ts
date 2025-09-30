import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty, Min, IsObject } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ example: 'customer-uuid-here' })
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    example: { description: 'Order description', items: [] },
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({
    example: 'PENDING',
    enum: ['PENDING', 'AUTHORIZED', 'CAPTURED', 'CANCELLED', 'REFUNDED', 'FAILED'],
  })
  @IsString()
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: any;
}
