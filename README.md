# Digital Backend API

A production-ready NestJS authentication API with PostgreSQL, TypeORM, JWT tokens, and refresh token functionality.

## 🚀 Features

- ✅ **User Authentication** - Signup, Login, Logout
- ✅ **JWT Tokens** - Access tokens with expiration
- ✅ **Refresh Tokens** - Secure token refresh flow
- ✅ **Password Hashing** - bcrypt for secure password storage
- ✅ **TypeORM** - Database migrations and entities
- ✅ **PostgreSQL** - Production-ready database
- ✅ **Validation** - class-validator for DTO validation
- ✅ **Guards** - JWT and Refresh token guards
- ✅ **CORS** - Configurable CORS for mobile apps
- ✅ **TypeScript** - Full type safety
 
## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=digital_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGINS=http://localhost:8081,exp://localhost:8081
```

### 3. Setup PostgreSQL Database

Create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE digital_db;

# Exit psql
\q
```

### 4. Run Migrations (Optional)

If you want to use migrations instead of synchronize:

```bash
# Generate migration
npm run migration:generate -- src/migrations/InitialMigration

# Run migrations
npm run migration:run
```

### 5. Start the Server

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3000/api`

## 📚 API Endpoints

### Authentication

#### 1. Signup (Create Account)

```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**

```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 2. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 3. Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### 4. Get Current User

```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

**Response (200):**

```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 5. Logout

```http
POST /api/auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..." // Optional
}
```

**Response (204):** No Content

## 🗄️ Database Schema

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Security Features

### Password Hashing

Passwords are hashed using bcrypt with salt rounds of 10:

```typescript
const hashedPassword = await bcrypt.hash(password, 10);
```

### JWT Tokens

- **Access Token**: Short-lived (15 minutes by default)
- **Refresh Token**: Long-lived (7 days by default)
- Both use separate secrets for added security

### Token Refresh Flow

1. Client sends expired access token request → 401
2. Client uses refresh token to get new access token
3. Server validates refresh token and issues new tokens
4. Old refresh tokens are revoked

### Protection

- All routes except signup/login require JWT authentication
- Refresh tokens are stored in database and can be revoked
- Passwords are never returned in responses

## 📁 Project Structure

```
digital-back/
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── dto/
│   │   │   ├── auth-response.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   └── signup.dto.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── jwt-refresh.guard.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-refresh.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── common/
│   │   └── filters/
│   │       └── http-exception.filter.ts
│   ├── config/
│   │   └── typeorm.config.ts
│   ├── entities/
│   │   ├── refresh-token.entity.ts
│   │   └── user.entity.ts
│   ├── user/
│   │   ├── user.module.ts
│   │   └── user.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .env.example
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── nest-cli.json
├── package.json
├── README.md
└── tsconfig.json
```

## 🧪 Testing

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Test with cURL

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# Get Profile (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## 🔧 Development

### Useful Commands

```bash
# Format code
npm run format

# Lint code
npm run lint

# Build
npm run build

# Start in watch mode
npm run start:dev

# Generate migration
npm run migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

## 🚀 Deployment

### Production Checklist

- [ ] Change JWT secrets to strong random strings
- [ ] Set `NODE_ENV=production`
- [ ] Use secure PostgreSQL credentials
- [ ] Enable SSL for database connection
- [ ] Set appropriate CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Set up logging (Winston, etc.)
- [ ] Configure reverse proxy (nginx)
- [ ] Set up SSL/TLS certificates
- [ ] Enable database backups

### Docker Deployment (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: digital_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data

  api:
    build: .
    ports:
      - '3000:3000'
    environment:
      - DB_HOST=postgres
    depends_on:
      - postgres

volumes:
  postgres-data:
```

Run:

```bash
docker-compose up
```

## 🔍 Error Handling

All errors return a standard format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": {
    "email": ["email must be an email"],
    "password": ["password must be longer than or equal to 8 characters"]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Common status codes:

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials or token)
- `409` - Conflict (user already exists)
- `500` - Internal Server Error

## 🤝 Integration with Frontend

Your React Native app (`digital`) should:

1. Update API URL in `src/api/client.ts`:

   ```typescript
   const API_URL = 'http://localhost:3000/api';
   ```

2. For physical devices, use your computer's IP:

   ```typescript
   const API_URL = 'http://192.168.1.X:3000/api';
   ```

3. For production:
   ```typescript
   const API_URL = 'https://your-api.com/api';
   ```

## 📝 License

MIT

## 👨‍💻 Author

Fourat Rachid

## 🙏 Acknowledgments

- NestJS Framework
- TypeORM
- PostgreSQL
- Passport.js

---

**Need Help?** Check the [NestJS Documentation](https://docs.nestjs.com/)
