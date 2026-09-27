import { Role } from '../enums/role.enum';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: Role;
}
