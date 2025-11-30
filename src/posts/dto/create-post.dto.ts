import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsUrl } from 'class-validator';

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
    content: string;

    @IsOptional()
    @IsUrl()
    imageUrl?: string;
}
