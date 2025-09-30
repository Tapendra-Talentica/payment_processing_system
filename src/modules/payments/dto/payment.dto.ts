import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  Min,
  Max,
  Length,
  Matches,
  IsOptional,
} from 'class-validator';

export class PurchaseDto {
  @ApiProperty({ example: 'order-uuid-here' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: '4111111111111111' })
  @IsString()
  @IsNotEmpty()
  @Length(13, 19)
  cardNumber: string;

  @ApiProperty({ example: '12/25', description: 'MM/YY format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}\/\d{2}$/, { message: 'Expiration date must be in MM/YY format' })
  expirationDate: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 4)
  cvv: string;
}

export class AuthorizeDto {
  @ApiProperty({ example: 'order-uuid-here' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ example: '4111111111111111' })
  @IsString()
  @IsNotEmpty()
  @Length(13, 19)
  cardNumber: string;

  @ApiProperty({ example: '12/25' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}\/\d{2}$/)
  expirationDate: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  @Length(3, 4)
  cvv: string;
}

export class CaptureDto {
  @ApiProperty({ example: 'transaction-uuid-here' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiPropertyOptional({ example: 99.99, description: 'Amount to capture (partial capture)' })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;
}

export class CancelDto {
  @ApiProperty({ example: 'transaction-uuid-here' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;
}

export class RefundDto {
  @ApiProperty({ example: 'transaction-uuid-here' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiPropertyOptional({ example: 49.99, description: 'Amount to refund (partial refund)' })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;
}
