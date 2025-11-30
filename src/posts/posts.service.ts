import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Like } from '../entities/like.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
    GetPostsQueryDto,
    PostSortBy,
} from './dto/get-posts-query.dto';
import {
    PostResponseDto,
    PaginatedPostsResponseDto,
} from './dto/post-response.dto';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,
    ) { }

    async create(userId: string, createPostDto: CreatePostDto): Promise<Post> {
        const post = this.postRepository.create({
            ...createPostDto,
            userId,
        });

        return await this.postRepository.save(post);
    }

    async findAll(
        query: GetPostsQueryDto,
        currentUserId?: string,
    ): Promise<PaginatedPostsResponseDto> {
        const { page = 1, limit = 10, sortBy, order, userId } = query;
        const skip = (page - 1) * limit;

        // Build query with relations
        const queryBuilder = this.postRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.user', 'user')
            .leftJoin('post.comments', 'comment')
            .leftJoin('post.likes', 'like')
            .addSelect('COUNT(DISTINCT comment.id)', 'commentsCount')
            .addSelect('COUNT(DISTINCT like.id)', 'likesCount')
            .where('post.isPublished = :isPublished', { isPublished: true })
            .groupBy('post.id')
            .addGroupBy('user.id');

        // Filter by user if specified
        if (userId) {
            queryBuilder.andWhere('post.userId = :userId', { userId });
        }

        // Add sorting
        if (sortBy === PostSortBy.LIKES) {
            queryBuilder.orderBy('likesCount', order);
        } else if (sortBy === PostSortBy.COMMENTS) {
            queryBuilder.orderBy('commentsCount', order);
        } else {
            queryBuilder.orderBy(`post.${sortBy}`, order);
        }

        // Get total count
        const total = await queryBuilder.getCount();

        // Apply pagination
        queryBuilder.skip(skip).take(limit);

        // Execute query
        const posts = await queryBuilder.getRawAndEntities();

        // Attach counts to entities
        const postsWithCounts = posts.entities.map((post, index) => {
            const raw = posts.raw[index];
            post.commentsCount = parseInt(raw.commentsCount) || 0;
            post.likesCount = parseInt(raw.likesCount) || 0;
            return post;
        });

        // Check if current user liked each post
        if (currentUserId) {
            const postIds = postsWithCounts.map((p) => p.id);
            const userLikes = await this.likeRepository.find({
                where: {
                    userId: currentUserId,
                    postId: postIds.length > 0 ? undefined : null,
                },
            });

            const likedPostIds = new Set(userLikes.map((l) => l.postId));
            postsWithCounts.forEach((post) => {
                post.isLikedByCurrentUser = likedPostIds.has(post.id);
            });
        }

        // Convert to DTOs
        const data = postsWithCounts.map((post) =>
            PostResponseDto.fromEntity(post, currentUserId),
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

    async findOne(id: string, currentUserId?: string): Promise<Post> {
        const queryBuilder = this.postRepository
            .createQueryBuilder('post')
            .leftJoinAndSelect('post.user', 'user')
            .leftJoin('post.comments', 'comment')
            .leftJoin('post.likes', 'like')
            .addSelect('COUNT(DISTINCT comment.id)', 'commentsCount')
            .addSelect('COUNT(DISTINCT like.id)', 'likesCount')
            .where('post.id = :id', { id })
            .groupBy('post.id')
            .addGroupBy('user.id');

        const result = await queryBuilder.getRawAndEntities();

        if (!result.entities.length) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }

        const post = result.entities[0];
        const raw = result.raw[0];

        post.commentsCount = parseInt(raw.commentsCount) || 0;
        post.likesCount = parseInt(raw.likesCount) || 0;

        // Check if current user liked the post
        if (currentUserId) {
            const like = await this.likeRepository.findOne({
                where: { userId: currentUserId, postId: id },
            });
            post.isLikedByCurrentUser = !!like;
        }

        return post;
    }

    async update(
        id: string,
        userId: string,
        updatePostDto: UpdatePostDto,
    ): Promise<Post> {
        const post = await this.postRepository.findOne({
            where: { id },
            relations: ['user'],
        });

        if (!post) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }

        if (post.userId !== userId) {
            throw new ForbiddenException('You can only update your own posts');
        }

        Object.assign(post, updatePostDto);
        return await this.postRepository.save(post);
    }

    async remove(id: string, userId: string): Promise<void> {
        const post = await this.postRepository.findOne({
            where: { id },
        });

        if (!post) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }

        if (post.userId !== userId) {
            throw new ForbiddenException('You can only delete your own posts');
        }

        await this.postRepository.remove(post);
    }

    async toggleLike(
        postId: string,
        userId: string,
    ): Promise<{ liked: boolean; likesCount: number }> {
        // Check if post exists
        const post = await this.postRepository.findOne({ where: { id: postId } });
        if (!post) {
            throw new NotFoundException(`Post with ID ${postId} not found`);
        }

        // Check if user already liked
        const existingLike = await this.likeRepository.findOne({
            where: { userId, postId },
        });

        if (existingLike) {
            // Unlike
            await this.likeRepository.remove(existingLike);
            const likesCount = await this.likeRepository.count({
                where: { postId },
            });
            return { liked: false, likesCount };
        } else {
            // Like
            const like = this.likeRepository.create({ userId, postId });
            await this.likeRepository.save(like);
            const likesCount = await this.likeRepository.count({
                where: { postId },
            });
            return { liked: true, likesCount };
        }
    }

    async getLikesCount(postId: string): Promise<number> {
        return await this.likeRepository.count({ where: { postId } });
    }

    async isLikedByUser(postId: string, userId: string): Promise<boolean> {
        const like = await this.likeRepository.findOne({
            where: { userId, postId },
        });
        return !!like;
    }
}
