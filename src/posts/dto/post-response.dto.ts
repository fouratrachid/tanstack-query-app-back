import { Post } from '../../entities/post.entity';

export class PostAuthorDto {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

export class PostResponseDto {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    isPublished: boolean;
    author: PostAuthorDto;
    commentsCount: number;
    likesCount: number;
    isLikedByCurrentUser: boolean;
    createdAt: Date;
    updatedAt: Date;

    static fromEntity(post: Post, currentUserId?: string): PostResponseDto {
        return {
            id: post.id,
            title: post.title,
            content: post.content,
            imageUrl: post.imageUrl,
            isPublished: post.isPublished,
            author: {
                id: post.user.id,
                name: post.user.name,
                email: post.user.email,
                avatarUrl: post.user.avatarUrl,
            },
            commentsCount: post.commentsCount || 0,
            likesCount: post.likesCount || 0,
            isLikedByCurrentUser: post.isLikedByCurrentUser || false,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
        };
    }
}

export class PaginatedPostsResponseDto {
    data: PostResponseDto[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
