import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOptionalGuard extends AuthGuard('jwt') {
    // Override handleRequest to not throw an error if no token is provided
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        // If there's an error or no user, just return null instead of throwing
        // This allows the endpoint to work without authentication, but still
        // extract the user if a valid token is provided
        return user || null;
    }
}
