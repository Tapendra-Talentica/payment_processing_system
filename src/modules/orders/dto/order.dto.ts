import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty, Min, IsObject } from 'class-validator';

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
  @ApiPropertyOptional({ example: 'PENDING' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: any;
}
