import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpException,
  Headers,
  Req,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { Request } from 'express';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('openpay')
  async handleOpenpayWebhook(@Body() event: any) {
    try {
      await this.webhookService.processOpenpayWebhook(event);
      return { received: true };
    } catch (error) {
      throw new HttpException(
        'Error procesando el webhook de Openpay',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
