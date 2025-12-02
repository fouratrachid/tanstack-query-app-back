import { IsString, IsNotEmpty, IsOptional, IsBoolean, MinLength, MaxLength, IsUrl } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(200)
    title: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(10000)
    @Sanitize()
    content: string;

    @IsString()
    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @IsBoolean()
    @IsOptional()
    isPublished?: boolean;
}
