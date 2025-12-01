export class UserResponseDto {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
}
