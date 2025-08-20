import axios from 'axios';
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
    // Validación según el tipo de producto
    const type = productDto.type || ProductType.ONE_TIME;

    if (type === ProductType.ONE_TIME) {
      if (
        productDto.stock === undefined ||
        productDto.stock === null ||
        isNaN(Number(productDto.stock))
      ) {
        throw new Error(
          'El campo stock es obligatorio para productos de pago único (ONE_TIME) y debe ser un número.',
        );
      }
    }

    if (type === ProductType.SUBSCRIPTION) {
      // Permitir suscripciones limitadas (stock presente y válido) o ilimitadas (stock undefined/null)
      if (
        productDto.stock !== undefined &&
        productDto.stock !== null &&
        isNaN(Number(productDto.stock))
      ) {
        throw new Error(
          'El campo stock debe ser un número válido si se especifica para suscripciones limitadas.',
        );
      }
    }

    const product = await this.prisma.products.create({
      data: {
        name: productDto.name,
        description: productDto.description || null,
        price: productDto.price,
        currency: (productDto.currency || 'MXN').toUpperCase(),
        stock:
          type === ProductType.ONE_TIME
            ? productDto.stock
            : productDto.stock !== undefined && productDto.stock !== null
              ? productDto.stock
              : null,
        imageUrl: productDto.imageUrl || null,
        mode: productDto.mode || 'default',
        active: productDto.active ?? true,
        type,
        interval: productDto.interval || null,
      },
    });

    return product;
  } //createProduct

  // Método específico para crear productos de suscripción
  async createSubscriptionProduct(productDto: ProductDto) {
    // Validar que sea una suscripción y tenga interval
    if (!productDto.interval) {
      throw new Error(
        'Subscription products must have an interval (month, year)',
      );
    }

    // 1. Crear el plan en Openpay
    const openpayApiKey = this.configService.get<string>('OPENPAY_API_KEY');
    if (!openpayApiKey)
      throw new Error(
        'OPENPAY_API_KEY no está definida en las variables de entorno',
      );
    const openpayMerchantId = this.configService.get<string>(
      'OPENPAY_MERCHANT_ID',
    );
    if (!openpayMerchantId)
      throw new Error(
        'OPENPAY_MERCHANT_ID no está definida en las variables de entorno',
      );
    const isProduction =
      this.configService.get<string>('OPENPAY_PRODUCTION') === 'true';
    const openpayBaseUrl = isProduction
      ? `https://api.openpay.mx/v1/${openpayMerchantId}`
      : `https://sandbox-api.openpay.mx/v1/${openpayMerchantId}`;

    const planPayload = {
      name: productDto.name,
      amount: productDto.price,
      repeat_every: 1,
      repeat_unit: productDto.interval, // 'month' o 'year'
      trial_days: 0,
      status: 'active',
      status_after_retry: 'active', // requerido por Openpay
      currency: (productDto.currency || 'MXN').toUpperCase(),
    };

    let planId: string;
    try {
      const planRes = await axios.post(`${openpayBaseUrl}/plans`, planPayload, {
        auth: {
          username: openpayApiKey,
          password: '',
        },
      });
      planId = planRes.data.id;
    } catch (err) {
      throw new Error(
        'No se pudo crear el plan en Openpay: ' +
          (err.response?.data?.description || err.message),
      );
    }

    // 2. Guardar el producto y el openpayPlanId en la base de datos
    const subscriptionProduct = await this.prisma.products.create({
      data: {
        name: productDto.name,
        description: productDto.description || null,
        price: productDto.price,
        currency: (productDto.currency || 'MXN').toUpperCase(),
        stock: null, // Las suscripciones no manejan stock
        imageUrl: productDto.imageUrl || null,
        mode: productDto.mode || 'subscription',
        active: productDto.active ?? true,
        type: ProductType.SUBSCRIPTION,
        interval: productDto.interval, // "month" o "year"
        openpayPlanId: planId, // Usar el nombre correcto del campo
      },
    });

    return subscriptionProduct;
  } //createSubscriptionProduct

  async getProductsDB() {
    const productsDB = await this.prisma.products.findMany();
    return productsDB;
  } //getProductsDB

  async getsuscription() {
    const subscriptions = await this.prisma.products.findMany({
      where: { type: ProductType.SUBSCRIPTION },
    });
    return subscriptions;
  }
}
