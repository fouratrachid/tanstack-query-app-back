import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { Role } from '../common/enums/role.enum';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
    CommentResponseDto,
    PaginatedCommentsResponseDto,
} from './dto/comment-response.dto';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
    ) { }

    async create(
        postId: string,
        userId: string,
        createCommentDto: CreateCommentDto,
    ): Promise<Comment> {
        // Check if post exists
        const post = await this.postRepository.findOne({ where: { id: postId } });
        if (!post) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }

        const comment = this.commentRepository.create({
            ...createCommentDto,
            postId,
            userId,
        });

        return await this.commentRepository.save(comment);
    }

    async findAllByPost(
        postId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<PaginatedCommentsResponseDto> {
        const skip = (page - 1) * limit;

        const [comments, total] = await this.commentRepository.findAndCount({
            where: { postId },
            relations: ['user'],
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });

        const data = comments.map((comment) =>
            CommentResponseDto.fromEntity(comment),
        );

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPreviousPage: page > 1,
            },
        };
    }

    async findOne(id: string): Promise<Comment> {
        const comment = await this.commentRepository.findOne({
            where: { id },
            relations: ['user', 'post'],
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }

        return comment;
    }

    async update(
        id: string,
        user: User,
        updateCommentDto: UpdateCommentDto,
    ): Promise<Comment> {
        const comment = await this.commentRepository.findOne({
            where: { id },
            relations: ['user'],
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }

        // Allow update if user is the owner, admin, or moderator
        if (comment.userId !== user.id && user.role !== Role.ADMIN && user.role !== Role.MODERATOR) {
            throw new ForbiddenException('You can only update your own comments');
        }

        Object.assign(comment, updateCommentDto);
        return await this.commentRepository.save(comment);
    }

    async remove(id: string, user: User): Promise<void> {
        const comment = await this.commentRepository.findOne({
            where: { id },
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }

        // Allow deletion if user is the owner, admin, or moderator
        if (comment.userId !== user.id && user.role !== Role.ADMIN && user.role !== Role.MODERATOR) {
            throw new ForbiddenException('You can only delete your own comments');
        }

        await this.commentRepository.remove(comment);
    }

    async getCommentsCount(postId: string): Promise<number> {
        return await this.commentRepository.count({ where: { postId } });
    }
}
