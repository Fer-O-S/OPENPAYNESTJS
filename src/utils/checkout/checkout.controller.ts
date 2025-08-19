import { Controller, Post, Body } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('/openpay')
  async createOpenpaySession(@Body() createCheckoutDto: CreateCheckoutDto) {
    try {
      const result =
        await this.checkoutService.createDynamicCheckoutSession(
          createCheckoutDto,
        );

      return {
        success: true,
        data: result,
        message: result.message,
      };
    } catch (error) {
      console.error(error); // <-- esto te mostrará el error en la terminal
      return {
        success: false,
        error: error?.message || JSON.stringify(error), // <-- muestra el mensaje o el objeto completo
        message: 'Error al procesar el pago o suscripción con Openpay',
      };
    }
  }
}
