import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MobilePayment } from './entities/mobile-payment.entity';
import { CreateMobilePaymentDto } from './dto/create-mobile-payment.dto';
import { UpdateMobilePaymentDto } from './dto/update-mobile-payment.dto';

@Injectable()
export class MobilePaymentsService {
  constructor(
    @InjectRepository(MobilePayment)
    private mobilePaymentsRepository: Repository<MobilePayment>,
  ) {}

  async create(userId: number, createDto: CreateMobilePaymentDto): Promise<MobilePayment> {
    // If this is set as default, unset all other defaults for this user
    if (createDto.isDefault) {
      await this.mobilePaymentsRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    const mobilePayment = this.mobilePaymentsRepository.create({
      ...createDto,
      userId,
    });

    return this.mobilePaymentsRepository.save(mobilePayment);
  }

  async findAll(userId: number): Promise<MobilePayment[]> {
    return this.mobilePaymentsRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<MobilePayment> {
    const mobilePayment = await this.mobilePaymentsRepository.findOne({
      where: { id, userId },
    });

    if (!mobilePayment) {
      throw new NotFoundException(`Mobile payment with ID ${id} not found`);
    }

    return mobilePayment;
  }

  async update(
    id: number,
    userId: number,
    updateDto: UpdateMobilePaymentDto,
  ): Promise<MobilePayment> {
    const mobilePayment = await this.findOne(id, userId);

    // If setting this as default, unset all other defaults for this user
    if (updateDto.isDefault) {
      await this.mobilePaymentsRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(mobilePayment, updateDto);
    return this.mobilePaymentsRepository.save(mobilePayment);
  }

  async remove(id: number, userId: number): Promise<void> {
    const mobilePayment = await this.findOne(id, userId);
    await this.mobilePaymentsRepository.remove(mobilePayment);
  }

  async setDefault(id: number, userId: number): Promise<MobilePayment> {
    const mobilePayment = await this.findOne(id, userId);

    // Unset all other defaults for this user
    await this.mobilePaymentsRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );

    // Set this one as default
    mobilePayment.isDefault = true;
    return this.mobilePaymentsRepository.save(mobilePayment);
  }

  async getDefault(userId: number): Promise<MobilePayment | null> {
    return this.mobilePaymentsRepository.findOne({
      where: { userId, isDefault: true },
    });
  }
}
