import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { RefreshToken } from '../entities/refresh-token.entity';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(signupDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    // Create user
    const user = await this.userService.create({
      ...signupDto,
      password: hashedPassword,
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Revoke old refresh tokens and save new one
    await this.revokeUserRefreshTokens(userId);
    await this.saveRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Revoke specific refresh token
      await this.refreshTokenRepository.update(
        { token: refreshToken, userId },
        { isRevoked: true },
      );
    } else {
      // Revoke all refresh tokens for user
      await this.revokeUserRefreshTokens(userId);
    }
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token, userId, isRevoked: false },
    });

    if (!refreshToken) {
      return false;
    }

    // Check if token is expired
    if (new Date() > refreshToken.expiresAt) {
      await this.refreshTokenRepository.update(refreshToken.id, { isRevoked: true });
      return false;
    }

    return true;
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRATION'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
    });

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRATION');
    const expiresAt = new Date();

    // Parse expiration (e.g., "7d" -> 7 days)
    const match = expiresIn.match(/(\d+)([dhms])/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];

      switch (unit) {
        case 'd':
          expiresAt.setDate(expiresAt.getDate() + value);
          break;
        case 'h':
          expiresAt.setHours(expiresAt.getHours() + value);
          break;
        case 'm':
          expiresAt.setMinutes(expiresAt.getMinutes() + value);
          break;
        case 's':
          expiresAt.setSeconds(expiresAt.getSeconds() + value);
          break;
      }
    }

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
  }

  private async revokeUserRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update({ userId, isRevoked: false }, { isRevoked: true });
  }
}
