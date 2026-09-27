import {
    Body, Controller, Post, Get, Param, Patch, Delete,
    ParseIntPipe, HttpCode, HttpStatus, Query
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import {UpdateUserDto} from "./dto/update-user.dto";
import {PaginationQueryDto} from "../common/dto/pagination-query.dto";
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search/:firstName')
  findByFirstName(@Param('firstName') firstName: string) {
    return this.usersService.findByFirstName(firstName);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  getAdminData() {
    return {
      message: 'Welcome Admin!',
    };
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.usersService.findOne(id);
  }

  @Get()
  findAll(@Query() paginationQueryDto: PaginationQueryDto) {
    return this.usersService.getUsers(paginationQueryDto);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUserWithProfile(createUserDto);
  }
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.usersService.remove(id);
  }
}
