import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsNotEmpty, IsObject } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
  })
  @IsObject()
  @IsOptional()
  billingAddress?: any;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'John Updated' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  billingAddress?: any;
}
