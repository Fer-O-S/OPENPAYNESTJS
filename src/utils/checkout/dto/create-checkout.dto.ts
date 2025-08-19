import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @IsInt()
  @ApiProperty({ example: 1 })
  productId: number;

  @IsInt()
  @Min(1)
  @ApiProperty({ example: 1 })
  quantity?: number = 1;

  @IsInt()
  @ApiProperty({ example: 1 })
  userId: number;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  // Campos requeridos para Openpay
  @IsString()
  @ApiProperty({ example: 'tok_test_abcdef123456' })
  openpayTokenId: string;

  @IsString()
  @ApiProperty({ example: 'kjsdfhksjdhfksjdhfksjdhf' })
  deviceSessionId: string;

  // Si ya tienes el cliente creado en Openpay, puedes pasarlo
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'a1b2c3d4e5f6g7h8i9j0', required: false })
  openpayCustomerId?: string;
}
