import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum PostSortBy {
    CREATED_AT = 'createdAt',
    UPDATED_AT = 'updatedAt',
    LIKES = 'likes',
    COMMENTS = 'comments',
}

export enum SortOrder {
    ASC = 'ASC',
    DESC = 'DESC',
}

export class GetPostsQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    @IsEnum(PostSortBy)
    sortBy?: PostSortBy = PostSortBy.CREATED_AT;

    @IsOptional()
    @IsEnum(SortOrder)
    order?: SortOrder = SortOrder.DESC;

    @IsOptional()
    userId?: string;
}
