import { User } from '../../users/entities/user.entity';
import {
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
    JoinColumn
} from 'typeorm';

@Entity('profiles')
export class Profile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    bio: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({
        type: 'date',
        nullable: true,
    })
    birthday: Date;

    @OneToOne(() => User, (user) => user.profile)
    @JoinColumn()
    user: User;
}