import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Profile } from '../profile/entities/profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createUserWithProfile(createUserDto: CreateUserDto): Promise<User> {
    return this.dataSource.transaction(async (manager) => {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = manager.create(User, {
        ...createUserDto,
        password: hashedPassword,
      });

      await manager.save(user);

      const profile = manager.create(Profile, {
        bio: '',
        avatar: '',
        user,
      });

      await manager.save(profile);

      return user;
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return this.userRepository.save(user);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async getUsers(paginationQueryDto: PaginationQueryDto): Promise<User[]> {
    const { page, limit, sortBy, order } = paginationQueryDto;
    const sortField = this.resolveUserSortField(sortBy);

    return this.userRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      order: { [sortField]: order },
    });
  }

  async findByFirstName(firstName: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.firstName = :firstName', {
        firstName,
      })
      .getMany();
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      if (this.isEmailAlreadyExistsError(error)) {
        throw new ConflictException('Email already exists');
      }

      throw error;
    }
  }

  private resolveUserSortField(sortBy: string): keyof User {
    const allowedSortFields: Array<keyof User> = [
      'id',
      'email',
      'firstName',
      'lastName',
    ];

    return allowedSortFields.includes(sortBy as keyof User)
      ? (sortBy as keyof User)
      : 'id';
  }

  private isEmailAlreadyExistsError(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError: unknown = error.driverError;

    if (typeof driverError !== 'object' || driverError === null) {
      return false;
    }

    if (!('code' in driverError)) {
      return false;
    }

    return driverError.code === '23505';
  }
}
