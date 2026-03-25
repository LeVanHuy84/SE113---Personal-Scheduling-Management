# Skill: Implement User Profile Management (Phase 1.3)

## Purpose

Provide guidelines for implementing user profile operations in NestJS with clean architecture, strict ownership, and consistent JWT context usage.

---

## Tech Stack

- NestJS
- Prisma ORM
- JWT (authentication)

---

## Core Concepts

### 1. Profile Access

- JWT required for all profile operations
- Users can only access/modify their own profile
- User identity is derived from JWT payload

---

### 2. Current User Context

After JWT validation:

```
interface CurrentUserPrincipal {
  userId: string;
  email: string;
}
```

Rules:

- `userId` is mapped from JWT payload `sub`
- MUST use `userId` for all operations
- MUST NOT read userId from request params or body
- MUST NOT pass JWT payload deeper than controller

---

## Implementation Steps

### 1. DTOs

```
// dto/update-profile.dto.ts
export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @Length(1, 100)
  displayName?: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @Length(1, 64)
  @Matches(/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+$/)
  timezone?: string;
}

// dto/profile-response.dto.ts
export class ProfileResponseDto {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: Date;
  updatedAt?: Date;
}
```

---

### 2. Repository Layer

```
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateProfile(userId: string, data: { displayName?: string; timezone?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        displayName: true,
        timezone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
```

---

### 3. Service Layer

```
@Injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepo.findById(userId);

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileResponseDto> {
    if (dto.displayName === undefined && dto.timezone === undefined) {
      return this.getProfile(userId);
    }

    const user = await this.userRepo.updateProfile(userId, {
      displayName: dto.displayName,
      timezone: dto.timezone,
    });

    return user;
  }
}
```

---

### 4. Controller Layer

```
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getProfile(@CurrentUser() user: { userId: string }) {
    return this.userService.getProfile(user.userId);
  }

  @Put()
  async updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.userId, dto);
  }
}
```

---

### 5. Module

```
@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
```

---

## Business Rules

- JWT required for all endpoints
- Users can only access/modify their own profile
- Email cannot be updated via profile
- displayName must:
  - be trimmed
  - not be empty or whitespace-only
  - be 1–100 characters after trimming
- timezone must:
  - be trimmed
  - follow IANA timezone format (e.g. Asia/Ho_Chi_Minh)
  - be 1–64 characters after trimming

---

## Behavior Rules

- GET /profile:
  - Returns current user profile

- PUT /profile:
  - If body is empty → return current profile
  - If valid fields provided → update and return updated profile

---

## Error Handling

- 400 Bad Request: invalid displayName or timezone
- 401 Unauthorized: missing or invalid JWT
- 404 Not Found: user not found

---

## Security Best Practices

- Always use JwtAuthGuard
- Never trust client-provided userId
- Always derive identity from JWT
- Do not expose sensitive fields

---

## Common Pitfalls

- Using user.id instead of user.userId
- Accessing Prisma directly in service
- Skipping DTO validation
- Not handling empty update
- Not trimming input

---

## References

- docs/api-contract/user.api.md
- docs/phases/phase-1.3-user-profile.md
