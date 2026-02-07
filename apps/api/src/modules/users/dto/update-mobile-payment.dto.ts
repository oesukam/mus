import { PartialType } from '@nestjs/swagger';
import { CreateMobilePaymentDto } from './create-mobile-payment.dto';

export class UpdateMobilePaymentDto extends PartialType(CreateMobilePaymentDto) {}
