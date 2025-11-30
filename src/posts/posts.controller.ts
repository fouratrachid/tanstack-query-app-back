import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CommentsService } from './comments.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('posts')
export class PostsController {
    constructor(
        private readonly postsService: PostsService,
        private readonly commentsService: CommentsService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    async create(
        @CurrentUser() user: User,
        @Body() createPostDto: CreatePostDto,
    ) {
        const post = await this.postsService.create(user.id, createPostDto);
        const fullPost = await this.postsService.findOne(post.id, user.id);
        return PostResponseDto.fromEntity(fullPost, user.id);
    }

    @Get()
    async findAll(
        @Query() query: GetPostsQueryDto,
        @CurrentUser() user?: User,
    ) {
        return await this.postsService.findAll(query, user?.id);
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @CurrentUser() user?: User) {
        const post = await this.postsService.findOne(id, user?.id);
        return PostResponseDto.fromEntity(post, user?.id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    async update(
        @Param('id') id: string,
        @CurrentUser() user: User,
        @Body() updatePostDto: UpdatePostDto,
    ) {
        const post = await this.postsService.update(id, user.id, updatePostDto);
        const fullPost = await this.postsService.findOne(post.id, user.id);
        return PostResponseDto.fromEntity(fullPost, user.id);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string, @CurrentUser() user: User) {
        await this.postsService.remove(id, user.id);
    }

    // Like/Unlike endpoints
    @Post(':id/like')
    @UseGuards(JwtAuthGuard)
    async toggleLike(@Param('id') id: string, @CurrentUser() user: User) {
        return await this.postsService.toggleLike(id, user.id);
    }

    @Get(':id/likes/count')
    async getLikesCount(@Param('id') id: string) {
        const count = await this.postsService.getLikesCount(id);
        return { count };
    }

    @Get(':id/likes/me')
    @UseGuards(JwtAuthGuard)
    async checkIfLiked(@Param('id') id: string, @CurrentUser() user: User) {
        const isLiked = await this.postsService.isLikedByUser(id, user.id);
        return { isLiked };
    }

    // Comments endpoints
    @Post(':id/comments')
    @UseGuards(JwtAuthGuard)
    async createComment(
        @Param('id') postId: string,
        @CurrentUser() user: User,
        @Body() createCommentDto: CreateCommentDto,
    ) {
        return await this.commentsService.create(
            postId,
            user.id,
            createCommentDto,
        );
    }

    @Get(':id/comments')
    async getComments(
        @Param('id') postId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return await this.commentsService.findAllByPost(postId, page, limit);
    }

    @Patch('comments/:commentId')
    @UseGuards(JwtAuthGuard)
    async updateComment(
        @Param('commentId') commentId: string,
        @CurrentUser() user: User,
        @Body() updateCommentDto: UpdateCommentDto,
    ) {
        return await this.commentsService.update(
            commentId,
            user.id,
            updateCommentDto,
        );
    }

    @Delete('comments/:commentId')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteComment(
        @Param('commentId') commentId: string,
        @CurrentUser() user: User,
    ) {
        await this.commentsService.remove(commentId, user.id);
    }

    @Get(':id/comments/count')
    async getCommentsCount(@Param('id') id: string) {
        const count = await this.commentsService.getCommentsCount(id);
        return { count };
    }
}
