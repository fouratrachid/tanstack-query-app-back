import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Post, Comment, Like])],
    controllers: [StatsController],
})
export class StatsModule { }
