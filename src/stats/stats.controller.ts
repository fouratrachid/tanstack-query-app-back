import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThan } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR)
export class StatsController {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Post)
        private postRepository: Repository<Post>,
        @InjectRepository(Comment)
        private commentRepository: Repository<Comment>,
        @InjectRepository(Like)
        private likeRepository: Repository<Like>,
    ) { }

    @Get('dashboard')
    async getDashboardStats() {
        // Get current counts
        const totalUsers = await this.userRepository.count();
        const totalPosts = await this.postRepository.count();
        const totalComments = await this.commentRepository.count();
        const totalLikes = await this.likeRepository.count();

        // Get counts from 30 days ago for growth calculation
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const usersThirtyDaysAgo = await this.userRepository.count({
            where: {
                createdAt: LessThan(thirtyDaysAgo),
            },
        });

        const postsThirtyDaysAgo = await this.postRepository.count({
            where: {
                createdAt: LessThan(thirtyDaysAgo),
            },
        });

        const commentsThirtyDaysAgo = await this.commentRepository.count({
            where: {
                createdAt: LessThan(thirtyDaysAgo),
            },
        });

        const likesThirtyDaysAgo = await this.likeRepository.count({
            where: {
                createdAt: LessThan(thirtyDaysAgo),
            },
        });

        // Calculate growth percentages
        const calculateGrowth = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Number((((current - previous) / previous) * 100).toFixed(1));
        };

        return {
            totalUsers,
            totalPosts,
            totalComments,
            totalLikes,
            usersGrowth: calculateGrowth(totalUsers, usersThirtyDaysAgo),
            postsGrowth: calculateGrowth(totalPosts, postsThirtyDaysAgo),
            commentsGrowth: calculateGrowth(totalComments, commentsThirtyDaysAgo),
            likesGrowth: calculateGrowth(totalLikes, likesThirtyDaysAgo),
        };
    }

    @Get('overview')
    async getOverview() {
        // Get counts by role
        const adminCount = await this.userRepository.count({
            where: { role: Role.ADMIN },
        });
        const moderatorCount = await this.userRepository.count({
            where: { role: Role.MODERATOR },
        });
        const userCount = await this.userRepository.count({
            where: { role: Role.USER },
        });

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentUsers = await this.userRepository.count({
            where: {
                createdAt: MoreThanOrEqual(sevenDaysAgo),
            },
        });

        const recentPosts = await this.postRepository.count({
            where: {
                createdAt: MoreThanOrEqual(sevenDaysAgo),
            },
        });

        const recentComments = await this.commentRepository.count({
            where: {
                createdAt: MoreThanOrEqual(sevenDaysAgo),
            },
        });

        // Get top contributors
        const topContributors = await this.postRepository
            .createQueryBuilder('post')
            .select('post.userId', 'userId')
            .addSelect('user.name', 'userName')
            .addSelect('COUNT(post.id)', 'postCount')
            .leftJoin('post.user', 'user')
            .groupBy('post.userId')
            .addGroupBy('user.name')
            .orderBy('COUNT(post.id)', 'DESC')
            .limit(5)
            .getRawMany();

        return {
            usersByRole: {
                admins: adminCount,
                moderators: moderatorCount,
                users: userCount,
            },
            recentActivity: {
                newUsers: recentUsers,
                newPosts: recentPosts,
                newComments: recentComments,
            },
            topContributors: topContributors.map((contributor) => ({
                userId: contributor.userId,
                userName: contributor.userName,
                postCount: parseInt(contributor.postCount),
            })),
        };
    }

    @Get('activity')
    async getActivityStats() {
        // Get activity for the last 7 days
        const activityData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const users = await this.userRepository.count({
                where: {
                    createdAt: MoreThanOrEqual(date) && LessThan(nextDate),
                },
            });

            const posts = await this.postRepository.count({
                where: {
                    createdAt: MoreThanOrEqual(date) && LessThan(nextDate),
                },
            });

            const comments = await this.commentRepository.count({
                where: {
                    createdAt: MoreThanOrEqual(date) && LessThan(nextDate),
                },
            });

            activityData.push({
                date: date.toISOString().split('T')[0],
                users,
                posts,
                comments,
            });
        }

        return activityData;
    }
}
