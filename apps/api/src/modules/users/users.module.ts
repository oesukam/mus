import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';
import { PermissionsService } from './permissions.service';
import { ShippingAddressesService } from './shipping-addresses.service';
import { MobilePaymentsService } from './mobile-payments.service';
import { UsersController } from './users.controller';
import { UsersAdminController } from './users-admin.controller';
import { RolesController } from './roles.controller';
import { PermissionsController } from './permissions.controller';
import { ShippingAddressesController } from './shipping-addresses.controller';
import { MobilePaymentsController } from './mobile-payments.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { ShippingAddress } from './entities/shipping-address.entity';
import { MobilePayment } from './entities/mobile-payment.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, ShippingAddress, MobilePayment]),
    EmailModule,
  ],
  controllers: [
    UsersController,
    UsersAdminController,
    RolesController,
    PermissionsController,
    ShippingAddressesController,
    MobilePaymentsController,
  ],
  providers: [UsersService, RolesService, PermissionsService, ShippingAddressesService, MobilePaymentsService],
  exports: [UsersService, RolesService, PermissionsService, ShippingAddressesService, MobilePaymentsService],
})
export class UsersModule {}
