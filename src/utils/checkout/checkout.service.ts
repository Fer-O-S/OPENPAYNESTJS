import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import {
  Prisma,
  OrderStatus,
  ProductType,
  SubscriptionStatus,
} from '@prisma/client';
// Cambia esta línea:
// import Openpay from 'openpay';
const Openpay = require('openpay');

@Injectable()
export class CheckoutService {
  private openpay: any; // Cambia el tipo aquí

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const openpayMerchantId = this.configService.get<string>(
      'OPENPAY_MERCHANT_ID',
    );
    const openpayApiKey = this.configService.get<string>('OPENPAY_API_KEY');

    if (!openpayMerchantId || !openpayApiKey) {
      throw new Error('No se encontraron las credenciales de Openpay en .env');
    }

    this.openpay = new Openpay(openpayMerchantId, openpayApiKey, false); // El último parámetro indica si es modo sandbox
  }

  async createDynamicCheckoutSession(createCheckoutDto: CreateCheckoutDto) {
    // 1. Validar producto
    const product = await this.prisma.products.findUnique({
      where: { id: createCheckoutDto.productId },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');

    // 2. Validar usuario
    const user = await this.prisma.users.findUnique({
      where: { id: createCheckoutDto.userId },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // 3. Crear orden en la DB (estado PENDING)
    const totalAmount = product.price * (createCheckoutDto.quantity || 1);
    const order = await this.prisma.orders.create({
      data: {
        userId: createCheckoutDto.userId,
        productId: createCheckoutDto.productId,
        quantity: createCheckoutDto.quantity || 1,
        totalAmount: new Prisma.Decimal(totalAmount),
        currency: product.currency,
        status: OrderStatus.PENDING,
      },
    });

    let openpayResponse: any;
    let newStatus: OrderStatus = OrderStatus.PENDING;

    if (product.type === ProductType.SUBSCRIPTION) {
      // Crear suscripción en Openpay
      const subscriptionData = {
        plan_id: product.openpayPlanId, // Debes tener este campo en tu producto
        source_id: createCheckoutDto.openpayTokenId,
        customer_id: createCheckoutDto.openpayCustomerId,
        trial_end_date: undefined, // Opcional, si tienes periodo de prueba
      };

      openpayResponse = await new Promise((resolve, reject) => {
        this.openpay.customers.subscriptions.create(
          createCheckoutDto.openpayCustomerId,
          subscriptionData,
          (error: any, subscription: any) => {
            if (error) return reject(error);
            resolve(subscription);
          },
        );
      });

      newStatus =
        openpayResponse.status === 'active'
          ? OrderStatus.PAID
          : OrderStatus.PENDING;

      await this.prisma.subscriptions.create({
        data: {
          userId: user.id,
          productId: product.id,
          orderId: order.id,
          openpaySubscriptionId: openpayResponse.id,
          status:
            openpayResponse.status === 'active'
              ? SubscriptionStatus.ACTIVE
              : SubscriptionStatus.PAST_DUE,
          currentPeriodEnd: openpayResponse.period_end_date
            ? new Date(openpayResponse.period_end_date)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    } else {
      // Crear cargo en Openpay
      const chargeData = {
        method: 'card',
        source_id: createCheckoutDto.openpayTokenId,
        amount: totalAmount,
        currency: product.currency.toUpperCase(),
        description: product.name,
        order_id: order.id.toString(),
        device_session_id: createCheckoutDto.deviceSessionId,
        customer: {
          name: user.name,
          email: user.email,
          // Puedes agregar más campos si los tienes
        },
      };

      openpayResponse = await new Promise((resolve, reject) => {
        this.openpay.charges.create(chargeData, (error: any, charge: any) => {
          if (error) return reject(error);
          resolve(charge);
        });
      });

      newStatus =
        openpayResponse.status === 'completed'
          ? OrderStatus.PAID
          : OrderStatus.PENDING;
    }

    // 5. Actualizar orden con la info de Openpay y el nuevo estado
    await this.prisma.orders.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        openpayTransactionId: openpayResponse.id,
        paidAt: newStatus === OrderStatus.PAID ? new Date() : null,
      },
    });

    // 6. Mostrar resultado según estado
    if (newStatus === OrderStatus.PAID) {
      return {
        message:
          product.type === ProductType.SUBSCRIPTION
            ? 'Suscripción realizada con éxito'
            : 'Pago realizado con éxito',
        orderId: order.id,
        openpayId: openpayResponse.id,
        status: newStatus,
      };
    } else {
      return {
        message: 'El pago no se completó o fue cancelado',
        orderId: order.id,
        openpayId: openpayResponse.id,
        status: newStatus,
      };
    }
  }
}
