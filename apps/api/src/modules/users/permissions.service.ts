import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const { name, resource, action, displayName, description } = createPermissionDto;

    // Check if permission with this name already exists
    const existingPermission = await this.permissionsRepository.findOne({ where: { name } });
    if (existingPermission) {
      throw new ConflictException(`Permission with name '${name}' already exists`);
    }

    const permission = this.permissionsRepository.create({
      name,
      resource,
      action,
      displayName,
      description,
    });

    return await this.permissionsRepository.save(permission);
  }

  async findAll(queryDto?: {
    page?: number;
    limit?: number;
    resource?: string;
    q?: string;
  }): Promise<{
    permissions: Permission[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    const page = queryDto?.page || 1;
    const limit = queryDto?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.permissionsRepository
      .createQueryBuilder('permission')
      .orderBy('permission.resource', 'ASC')
      .addOrderBy('permission.action', 'ASC');

    // Apply filters
    if (queryDto?.resource) {
      queryBuilder.andWhere('permission.resource = :resource', {
        resource: queryDto.resource,
      });
    }

    if (queryDto?.q) {
      queryBuilder.andWhere(
        '(permission.name ILIKE :query OR permission.resource ILIKE :query OR permission.action ILIKE :query OR permission.description ILIKE :query)',
        { query: `%${queryDto.q}%` },
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const permissions = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      permissions,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionsRepository.findOne({ where: { id } });

    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }

    return permission;
  }

  async findByResource(resource: string): Promise<Permission[]> {
    return await this.permissionsRepository.find({
      where: { resource },
      order: { action: 'ASC' },
    });
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);

    const { name, resource, action, displayName, description } = updatePermissionDto;

    // If updating name, check for conflicts
    if (name !== undefined && name !== permission.name) {
      const existingPermission = await this.permissionsRepository.findOne({ where: { name } });
      if (existingPermission) {
        throw new ConflictException(`Permission with name '${name}' already exists`);
      }
      permission.name = name;
    }

    if (resource !== undefined) permission.resource = resource;
    if (action !== undefined) permission.action = action;
    if (displayName !== undefined) permission.displayName = displayName;
    if (description !== undefined) permission.description = description;

    return await this.permissionsRepository.save(permission);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionsRepository.remove(permission);
  }

  async seedDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
      // User permissions
      { name: 'users:read', resource: 'users', action: 'read', displayName: 'View Users', description: 'View user information' },
      { name: 'users:write', resource: 'users', action: 'write', displayName: 'Manage Users', description: 'Create and update users' },
      { name: 'users:delete', resource: 'users', action: 'delete', displayName: 'Delete Users', description: 'Delete users' },

      // Product permissions
      { name: 'products:read', resource: 'products', action: 'read', displayName: 'View Products', description: 'View product information' },
      { name: 'products:write', resource: 'products', action: 'write', displayName: 'Manage Products', description: 'Create and update products' },
      { name: 'products:delete', resource: 'products', action: 'delete', displayName: 'Delete Products', description: 'Delete products' },

      // Order permissions
      { name: 'orders:read', resource: 'orders', action: 'read', displayName: 'View Orders', description: 'View order information' },
      { name: 'orders:write', resource: 'orders', action: 'write', displayName: 'Manage Orders', description: 'Create and update orders' },
      { name: 'orders:delete', resource: 'orders', action: 'delete', displayName: 'Delete Orders', description: 'Delete orders' },

      // Role permissions
      { name: 'roles:read', resource: 'roles', action: 'read', displayName: 'View Roles', description: 'View role information' },
      { name: 'roles:write', resource: 'roles', action: 'write', displayName: 'Manage Roles', description: 'Create and update roles' },
      { name: 'roles:delete', resource: 'roles', action: 'delete', displayName: 'Delete Roles', description: 'Delete roles' },

      // Permission permissions
      { name: 'permissions:read', resource: 'permissions', action: 'read', displayName: 'View Permissions', description: 'View permission information' },
      { name: 'permissions:write', resource: 'permissions', action: 'write', displayName: 'Manage Permissions', description: 'Create and update permissions' },
      { name: 'permissions:delete', resource: 'permissions', action: 'delete', displayName: 'Delete Permissions', description: 'Delete permissions' },
    ];

    for (const permData of defaultPermissions) {
      const existing = await this.permissionsRepository.findOne({ where: { name: permData.name } });
      if (!existing) {
        const permission = this.permissionsRepository.create(permData);
        await this.permissionsRepository.save(permission);
      }
    }
  }
}
