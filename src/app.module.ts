import { Module } from '@nestjs/common';
import { LoginModule } from './apps/login/login.module';
import { RegisterModule } from './apps/users/users.module';
import { AuthModule } from './middlewares/auth/auth.module';
import { FormModule } from './apps/form/form.module';
import { OpenpayModule } from './utils/openpay/openpay.module';

@Module({
  imports: [
    LoginModule,
    RegisterModule,
    AuthModule,
    FormModule,
    OpenpayModule,
    // CheckoutModule,
    // WebhookModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
