import { Comment } from '../../entities/comment.entity';

export class CommentAuthorDto {
    id: string;
    name: string;
    avatarUrl?: string;
}

export class CommentResponseDto {
    id: string;
    content: string;
    postId: string;
    author: CommentAuthorDto;
    createdAt: Date;
    updatedAt: Date;

    static fromEntity(comment: Comment): CommentResponseDto {
        return {
            id: comment.id,
            content: comment.content,
            postId: comment.postId,
            author: {
                id: comment.user.id,
                name: comment.user.name,
                avatarUrl: comment.user.avatarUrl,
            },
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
        };
    }
}

export class PaginatedCommentsResponseDto {
    data: CommentResponseDto[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
