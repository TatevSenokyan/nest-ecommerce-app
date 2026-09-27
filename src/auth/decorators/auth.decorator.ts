import { applyDecorators } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { Role } from '../enums/role.enum';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    Roles(...roles),
  );
}
