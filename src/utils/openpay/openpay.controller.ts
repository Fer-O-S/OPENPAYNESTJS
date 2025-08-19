import { Controller, Post, Body, Get } from '@nestjs/common';
import { OpenpayService } from './openpay.service';
import { ProductDto } from './dto/product.dto';

@Controller('openpay')
export class OpenpayController {
  constructor(private openpayService: OpenpayService) {}

  // Crear productos de compra única
  @Post('products')
  async createProduct(@Body() productDto: ProductDto) {
    return await this.openpayService.createProduct(productDto);
  }

  // Crear productos de suscripción
  @Post('subscriptions')
  async createSubscription(@Body() productDto: ProductDto) {
    return await this.openpayService.createSubscriptionProduct(productDto);
  }

  @Get('dbProducts')
  async getProductsDB() {
    return await this.openpayService.getProductsDB();
  }
}
