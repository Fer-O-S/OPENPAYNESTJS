import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { UserDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import * as Openpay from 'openpay';

@Injectable()
export class UserService {
  private openpay: Openpay;

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

  async createUser(data: UserDto) {
    // Hash the password before saving the user
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create the user in Openpay
    const openpayCustomer = await new Promise<Openpay.Customer>(
      (resolve, reject) => {
        this.openpay.customers.create(
          {
            name: data.name,
            email: data.email,
            requires_account: false, // Cambia según tus necesidades
          },
          (error, customer) => {
            if (error) {
              return reject(error);
            }
            resolve(customer);
          },
        );
      },
    );

    // Save the user in the database
    const user = await this.prisma.users.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        openpayCustomerId: openpayCustomer.id,
      },
    });

    return { message: 'User Created Successfully' };
  }

  async getUserById(user_id: number) {
    const foundUser = await this.prisma.users.findFirst({
      where: { id: user_id },
      // Seleccionar campos a devolver
      select: {
        id: true,
        email: true,
        name: true,
        openpayCustomerId: true, // Incluye el ID de Openpay
      },
    });

    console.log(foundUser);
    if (foundUser) {
      return foundUser;
    }

    return { message: 'User not found' };
  }
}
