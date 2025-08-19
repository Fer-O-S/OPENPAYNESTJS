import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { OrderStatus, PaymentStatus, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class WebhookService {
  constructor(private prisma: PrismaService) {}

  async processOpenpayWebhook(event: any) {
    switch (event.type) {
      case 'charge.succeeded':
        await this.handleChargeSucceeded(event.data);
        break;
      case 'charge.failed':
        await this.handleChargeFailed(event.data);
        break;
      case 'subscription.charge.succeeded':
        await this.handleSubscriptionChargeSucceeded(event.data);
        break;
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(event.data);
        break;
    }
  }

  private async handleChargeSucceeded(data: any) {
    const order = await this.prisma.orders.findFirst({
      where: { openpayTransactionId: data.id },
    });
    if (!order) return;

    await this.prisma.orders.update({
      where: { id: order.id },
      data: { status: OrderStatus.PAID, paidAt: new Date() },
    });

    const existingPayment = await this.prisma.payments.findFirst({
      where: { orderId: order.id, openpayChargeId: data.id },
    });

    if (!existingPayment) {
      await this.prisma.payments.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount: order.totalAmount,
          currency: order.currency,
          status: PaymentStatus.SUCCEEDED,
          openpayChargeId: data.id,
        },
      });
    }
  }

  private async handleChargeFailed(data: any) {
    const order = await this.prisma.orders.findFirst({
      where: { openpayTransactionId: data.id },
    });
    if (!order) return;

    await this.prisma.orders.update({
      where: { id: order.id },
      data: { status: OrderStatus.CANCELED },
    });

    await this.prisma.payments.updateMany({
      where: { orderId: order.id },
      data: { status: PaymentStatus.FAILED },
    });
  }

  private async handleSubscriptionChargeSucceeded(data: any) {
    const subscription = await this.prisma.subscriptions.findFirst({
      where: { openpaySubscriptionId: data.subscription_id },
    });
    if (!subscription) return;

    await this.prisma.subscriptions.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.ACTIVE },
    });

    // Registrar el pago de la suscripción
    await this.prisma.payments.create({
      data: {
        subscriptionId: subscription.id,
        orderId: subscription.orderId,
        userId: subscription.userId,
        amount: data.amount || 0, // Ajusta según el payload de Openpay
        currency: data.currency || 'MXN',
        status: PaymentStatus.SUCCEEDED,
        openpayChargeId: data.id,
      },
    });
  }

  private async handleSubscriptionCancelled(data: any) {
    const subscription = await this.prisma.subscriptions.findFirst({
      where: { openpaySubscriptionId: data.id },
    });
    if (!subscription) return;

    await this.prisma.subscriptions.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.CANCELED },
    });
  }
}
