import { createDataSource } from './create-data-source';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profile/entities/profile.entity';

export default createDataSource(
  'DB_DATABASE_API',
  [User, Profile],
  ['migrations/api/*.ts'],
);
