import { Role } from '../../common/enums/role.enum';

export class AuthResponseDto {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}
