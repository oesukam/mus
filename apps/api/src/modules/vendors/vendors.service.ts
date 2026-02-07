import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsQueryDto } from './dto/vendors-query.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private vendorsRepository: Repository<Vendor>,
  ) {}

  async create(createVendorDto: CreateVendorDto): Promise<Vendor> {
    const { name, email } = createVendorDto;

    // Check if vendor with this name already exists
    const existingVendor = await this.vendorsRepository.findOne({ where: { name } });
    if (existingVendor) {
      throw new ConflictException(`Vendor with name '${name}' already exists`);
    }

    // Check if vendor with this email already exists (if email is provided)
    if (email) {
      const vendorWithEmail = await this.vendorsRepository.findOne({ where: { email } });
      if (vendorWithEmail) {
        throw new ConflictException(`Vendor with email '${email}' already exists`);
      }
    }

    const vendor = this.vendorsRepository.create(createVendorDto);
    return await this.vendorsRepository.save(vendor);
  }

  async findAll(queryDto?: VendorsQueryDto): Promise<{
    vendors: Vendor[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const page = queryDto?.page || 1;
    const limit = queryDto?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.vendorsRepository.createQueryBuilder('vendor');

    // Apply search filter
    if (queryDto?.search) {
      queryBuilder.andWhere(
        '(vendor.name ILIKE :query OR vendor.email ILIKE :query OR vendor.contactPerson ILIKE :query OR vendor.description ILIKE :query)',
        { query: `%${queryDto.search}%` },
      );
    }

    // Filter by country
    if (queryDto?.country) {
      queryBuilder.andWhere('vendor.country = :country', { country: queryDto.country });
    }

    // Filter by active status
    if (queryDto?.isActive !== undefined) {
      queryBuilder.andWhere('vendor.isActive = :isActive', { isActive: queryDto.isActive });
    }

    // Apply sorting - most recent first
    queryBuilder.orderBy('vendor.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const vendors = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      vendors,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: number): Promise<Vendor> {
    const vendor = await this.vendorsRepository.findOne({ where: { id } });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  async findByName(name: string): Promise<Vendor | null> {
    return await this.vendorsRepository.findOne({ where: { name } });
  }

  async update(id: number, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findOne(id);

    // Check if email is being changed and if it's already in use
    if (updateVendorDto.email && updateVendorDto.email !== vendor.email) {
      const vendorWithEmail = await this.vendorsRepository.findOne({
        where: { email: updateVendorDto.email },
      });
      if (vendorWithEmail && vendorWithEmail.id !== id) {
        throw new ConflictException(`Vendor with email '${updateVendorDto.email}' already exists`);
      }
    }

    // Check if name is being changed and if it's already in use
    if (updateVendorDto.name && updateVendorDto.name !== vendor.name) {
      const vendorWithName = await this.vendorsRepository.findOne({
        where: { name: updateVendorDto.name },
      });
      if (vendorWithName && vendorWithName.id !== id) {
        throw new ConflictException(`Vendor with name '${updateVendorDto.name}' already exists`);
      }
    }

    Object.assign(vendor, updateVendorDto);
    return await this.vendorsRepository.save(vendor);
  }

  async remove(id: number): Promise<void> {
    const vendor = await this.findOne(id);
    await this.vendorsRepository.remove(vendor);
  }

  async toggleActiveStatus(id: number): Promise<Vendor> {
    const vendor = await this.findOne(id);
    vendor.isActive = !vendor.isActive;
    return await this.vendorsRepository.save(vendor);
  }

  async getActiveVendors(): Promise<Vendor[]> {
    return await this.vendorsRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getVendorsByCountry(country: string): Promise<Vendor[]> {
    return await this.vendorsRepository.find({
      where: { country, isActive: true },
      order: { name: 'ASC' },
    });
  }
}
