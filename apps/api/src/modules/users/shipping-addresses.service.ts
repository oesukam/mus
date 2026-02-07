import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingAddress } from './entities/shipping-address.entity';
import { CreateShippingAddressDto } from './dto/create-shipping-address.dto';
import { UpdateShippingAddressDto } from './dto/update-shipping-address.dto';

@Injectable()
export class ShippingAddressesService {
  constructor(
    @InjectRepository(ShippingAddress)
    private shippingAddressesRepository: Repository<ShippingAddress>,
  ) {}

  /**
   * Get all shipping addresses for a user
   */
  async findAllByUserId(userId: number): Promise<ShippingAddress[]> {
    return this.shippingAddressesRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Get default shipping address for a user
   */
  async findDefaultByUserId(userId: number): Promise<ShippingAddress | null> {
    return this.shippingAddressesRepository.findOne({
      where: { userId, isDefault: true },
    });
  }

  /**
   * Get a specific shipping address by ID
   */
  async findOne(id: number, userId: number): Promise<ShippingAddress> {
    const address = await this.shippingAddressesRepository.findOne({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException(`Shipping address with ID ${id} not found`);
    }

    return address;
  }

  /**
   * Create a new shipping address
   */
  async create(
    userId: number,
    createShippingAddressDto: CreateShippingAddressDto,
  ): Promise<ShippingAddress> {
    // If this is set as default, unset all other default addresses for this user
    if (createShippingAddressDto.isDefault) {
      await this.shippingAddressesRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    // If this is the user's first address, make it default automatically
    const existingAddresses = await this.shippingAddressesRepository.count({
      where: { userId },
    });

    const isDefault = createShippingAddressDto.isDefault ?? existingAddresses === 0;

    const address = this.shippingAddressesRepository.create({
      ...createShippingAddressDto,
      userId,
      isDefault,
    });

    return this.shippingAddressesRepository.save(address);
  }

  /**
   * Update a shipping address
   */
  async update(
    id: number,
    userId: number,
    updateShippingAddressDto: UpdateShippingAddressDto,
  ): Promise<ShippingAddress> {
    const address = await this.findOne(id, userId);

    // If setting as default, unset all other default addresses for this user
    if (updateShippingAddressDto.isDefault) {
      await this.shippingAddressesRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    Object.assign(address, updateShippingAddressDto);
    return this.shippingAddressesRepository.save(address);
  }

  /**
   * Set an address as default
   */
  async setAsDefault(id: number, userId: number): Promise<ShippingAddress> {
    const address = await this.findOne(id, userId);

    // Unset all other default addresses for this user
    await this.shippingAddressesRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );

    address.isDefault = true;
    return this.shippingAddressesRepository.save(address);
  }

  /**
   * Delete a shipping address
   */
  async remove(id: number, userId: number): Promise<void> {
    const address = await this.findOne(id, userId);

    // Check if this is the default address
    const wasDefault = address.isDefault;

    await this.shippingAddressesRepository.remove(address);

    // If the deleted address was default, make the most recently created address default
    if (wasDefault) {
      const remainingAddresses = await this.shippingAddressesRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (remainingAddresses.length > 0) {
        remainingAddresses[0].isDefault = true;
        await this.shippingAddressesRepository.save(remainingAddresses[0]);
      }
    }
  }
}
