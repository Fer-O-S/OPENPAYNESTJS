import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ProductDto } from './dto/product.dto';

@Injectable()
export class OpenpayService {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async createProduct(productDto: ProductDto) {
    // Guardar el producto directamente en la base de datos
    const product = await this.prisma.products.create({
      data: {
        name: productDto.name,
        description: productDto.description || null,
        price: productDto.price,
        currency: productDto.currency,
        stock: productDto.stock ?? 0,
        imageUrl: productDto.imageUrl || null,
        mode: productDto.mode || 'default', // Modo del producto (puedes ajustar según tus necesidades)
        active: productDto.active ?? true,
        // openpayPlanId: null, // Se puede usar para almacenar el ID del plan de Openpay si es necesario
      },
    });

    return product;
  } //createProduct

  async getProductsDB() {
    const productsDB = await this.prisma.products.findMany();
    return productsDB;
  } //getProductsDB
} //class
