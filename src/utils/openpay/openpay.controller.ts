import { Controller, Post, Body, Get } from '@nestjs/common';
import { OpenpayService } from './openpay.service';
import { ProductDto } from './dto/product.dto';

@Controller('openpay')
export class OpenpayController {
  constructor(private openpayService: OpenpayService) {}

  @Post('createProduct')
  async createProduct(@Body() productDto: ProductDto) {
    return await this.openpayService.createProduct(productDto);
  }

  @Get('text')
  async gettext(text: string) {
    return (text = 'Hello from Openpay Controller');
  }

  @Get('dbProducts')
  async getProductsDB() {
    return await this.openpayService.getProductsDB();
  }
}
