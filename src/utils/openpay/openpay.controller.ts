import { Controller, Post, Body, Get } from '@nestjs/common';
import { OpenpayService } from './openpay.service';
import { ProductDto } from './dto/product.dto';

@Controller('openpay')
export class OpenpayController {
  constructor(private openpayService: OpenpayService) {}

  // Crear productos de compra única

  @Post('products')
  async createProduct(@Body() productDto: ProductDto) {
    try {
      return await this.openpayService.createProduct(productDto);
    } catch (error) {
      console.error('Error en createProduct:', error);
      return {
        success: false,
        message: error.message || 'Error interno del servidor',
        error: error,
      };
    }
  }

  // Crear productos de suscripción

  @Post('subscriptions')
  async createSubscription(@Body() productDto: ProductDto) {
    try {
      return await this.openpayService.createSubscriptionProduct(productDto);
    } catch (error) {
      console.error('Error en createSubscription:', error);
      return {
        success: false,
        message: error.message || 'Error interno del servidor',
        error: error,
      };
    }
  }

  @Get('dbProducts')
  async getProductsDB() {
    return await this.openpayService.getProductsDB();
  }

  @Get('Psubscriptions')
  async getSubscriptions() {
    return await this.openpayService.getsuscription();
  }
}
