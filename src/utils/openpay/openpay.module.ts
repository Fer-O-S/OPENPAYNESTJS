import { Module } from '@nestjs/common';
import { OpenpayController } from './openpay.controller';
import { OpenpayService } from './openpay.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/config/prisma/prisma.module';

@Module({
  controllers: [OpenpayController],
  providers: [OpenpayService],
  imports: [ConfigModule, PrismaModule],
})
export class OpenpayModule {}
