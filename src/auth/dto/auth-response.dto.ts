export class AuthResponseDto {
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}
