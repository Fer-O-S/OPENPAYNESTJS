import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { ProductDto } from './dto/product.dto';
import { ProductType } from '@prisma/client';

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
        mode: productDto.mode || 'default',
        active: productDto.active ?? true,

        // NUEVOS CAMPOS para suscripciones
        type: productDto.type || ProductType.ONE_TIME,
        interval: productDto.interval || null, // solo para suscripciones
      },
    });

    return product;
  } //createProduct

  // NUEVO: Método específico para crear productos de suscripción
  async createSubscriptionProduct(productDto: ProductDto) {
    // Validar que sea una suscripción y tenga interval
    if (!productDto.interval) {
      throw new Error(
        'Subscription products must have an interval (month, year)',
      );
    }

    const subscriptionProduct = await this.prisma.products.create({
      data: {
        name: productDto.name,
        description: productDto.description || null,
        price: productDto.price,
        currency: productDto.currency,
        stock: null, // Las suscripciones no manejan stock
        imageUrl: productDto.imageUrl || null,
        mode: productDto.mode || 'subscription',
        active: productDto.active ?? true,

        type: ProductType.SUBSCRIPTION,
        interval: productDto.interval, // "month" o "year"
      },
    });

    return subscriptionProduct;
  } //createSubscriptionProduct

  async getProductsDB() {
    const productsDB = await this.prisma.products.findMany();
    return productsDB;
  } //getProductsDB
}
