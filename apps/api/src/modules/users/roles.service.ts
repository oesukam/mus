import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const { name, displayName, description, permissionIds } = createRoleDto;

    // Check if role with this name already exists
    const existingRole = await this.rolesRepository.findOne({ where: { name } });
    if (existingRole) {
      throw new ConflictException(`Role with name '${name}' already exists`);
    }

    // Create role
    const role = this.rolesRepository.create({
      name,
      displayName,
      description,
    });

    // Assign permissions if provided
    if (permissionIds && permissionIds.length > 0) {
      const permissions = await this.permissionsRepository.find({
        where: { id: In(permissionIds) },
      });

      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('One or more permissions not found');
      }

      role.permissions = permissions;
    }

    return await this.rolesRepository.save(role);
  }

  async findAll(queryDto?: {
    page?: number;
    limit?: number;
    q?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    roles: Role[];
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
    const sortBy = queryDto?.sortBy || 'createdAt';
    const sortOrder = queryDto?.sortOrder?.toUpperCase() as 'ASC' | 'DESC' || 'DESC';

    const queryBuilder = this.rolesRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions');

    // Apply search filter
    if (queryDto?.q) {
      queryBuilder.andWhere(
        '(role.name ILIKE :query OR role.displayName ILIKE :query OR role.description ILIKE :query)',
        { query: `%${queryDto.q}%` },
      );
    }

    // Apply sorting
    // Map frontend field names to database column names
    const sortFieldMap: Record<string, string> = {
      name: 'role.name',
      displayName: 'role.displayName',
      createdAt: 'role.createdAt',
      updatedAt: 'role.updatedAt',
      isSystem: 'role.isSystem',
    };

    const sortField = sortFieldMap[sortBy] || 'role.createdAt';
    queryBuilder.orderBy(sortField, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const roles = await queryBuilder.getMany();

    const totalPages = Math.ceil(total / limit);

    return {
      roles,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return await this.rolesRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);

    const { displayName, description, permissionIds } = updateRoleDto;

    if (displayName !== undefined) {
      role.displayName = displayName;
    }

    if (description !== undefined) {
      role.description = description;
    }

    // Update permissions if provided
    if (permissionIds !== undefined) {
      if (permissionIds.length > 0) {
        const permissions = await this.permissionsRepository.find({
          where: { id: In(permissionIds) },
        });

        if (permissions.length !== permissionIds.length) {
          throw new NotFoundException('One or more permissions not found');
        }

        role.permissions = permissions;
      } else {
        role.permissions = [];
      }
    }

    return await this.rolesRepository.save(role);
  }

  async assignPermissions(id: number, assignPermissionsDto: AssignPermissionsDto): Promise<Role> {
    const role = await this.findOne(id);

    const permissions = await this.permissionsRepository.find({
      where: { id: In(assignPermissionsDto.permissionIds) },
    });

    if (permissions.length !== assignPermissionsDto.permissionIds.length) {
      throw new NotFoundException('One or more permissions not found');
    }

    role.permissions = permissions;
    return await this.rolesRepository.save(role);
  }

  async removePermissions(id: number, permissionIds: number[]): Promise<Role> {
    const role = await this.findOne(id);

    role.permissions = role.permissions.filter(
      (permission) => !permissionIds.includes(permission.id),
    );

    return await this.rolesRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);

    // Prevent deletion of system roles
    if (['admin', 'seller', 'customer'].includes(role.name)) {
      throw new ConflictException('System roles cannot be deleted');
    }

    await this.rolesRepository.remove(role);
  }
}
