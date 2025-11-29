import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signupDto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refresh(req.user.userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: User, @Body() body?: { refreshToken?: string }): Promise<void> {
    await this.authService.logout(user.id, body?.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
