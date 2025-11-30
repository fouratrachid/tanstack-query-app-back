import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';

@Entity('posts')
export class Post {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text')
    content: string;

    @Column({ nullable: true })
    imageUrl?: string;

    @Column({ default: true })
    isPublished: boolean;

    @Column('uuid')
    userId: string;

    @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @OneToMany(() => Comment, (comment) => comment.post, { cascade: true })
    comments: Comment[];

    @OneToMany(() => Like, (like) => like.post, { cascade: true })
    likes: Like[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Virtual fields (not stored in DB, calculated on demand)
    commentsCount?: number;
    likesCount?: number;
    isLikedByCurrentUser?: boolean;
}
