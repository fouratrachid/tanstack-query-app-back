import {
    Controller,
    Get,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
    NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(private userService: UserService) { }

    @Get()
    @Roles(Role.ADMIN, Role.MODERATOR)
    async findAll(
        @Query('page', ParseIntPipe) page: number = 1,
        @Query('limit', ParseIntPipe) limit: number = 10,
    ) {
        const { users, total } = await this.userService.findAll(page, limit);

        // Remove passwords from response
        const sanitizedUsers = users.map(({ password: _pwd, ...user }) => user); return {
            data: sanitizedUsers,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.MODERATOR)
    async findOne(@Param('id') id: string) {
        const user = await this.userService.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password: _pwd, ...sanitizedUser } = user;
        return sanitizedUser;
    }
    @Put(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        const user = await this.userService.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const updatedUser = await this.userService.update(id, updateUserDto);
        const { password: _pwd, ...sanitizedUser } = updatedUser;
        return sanitizedUser;
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        const user = await this.userService.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.userService.delete(id);
    }
}
