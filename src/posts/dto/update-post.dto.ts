import { IsString, IsOptional, MinLength, MaxLength, IsUrl, IsBoolean } from 'class-validator';

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(200)
    title?: string;

    @IsOptional()
    @IsString()
    @MinLength(10)
    @MaxLength(10000)
    content?: string;

    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;
}
