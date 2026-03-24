# Skill: Implement User Profile Management (Phase 1.3)

## Purpose

Provide guidelines for implementing user profile CRUD operations in NestJS.

---

## Tech Stack

- NestJS
- Prisma ORM
- JWT (for authentication)

---

## Core Concepts

### 1. Profile Access

- Users can only access/modify their own profile
- JWT required for all profile operations
- Ownership validation

---

## Implementation Steps

### 1. Profile DTOs

```typescript
// dto/get-profile.dto.ts (not needed, JWT only)

// dto/update-profile.dto.ts
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  displayName?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(1024)
  avatarUrl?: string;
}

// dto/profile-response.dto.ts
export class ProfileResponseDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt?: Date;
}
```

### 2. Profile Service

```typescript
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const updateData: any = {};
    if (dto.displayName !== undefined) updateData.displayName = dto.displayName;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
```

### 3. Profile Controller

```typescript
@Controller('profile')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getProfile(@CurrentUser() user: { id: string }) {
    return this.userService.getProfile(user.id);
  }

  @Put()
  async updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.id, dto);
  }
}
```

### 4. User Module

```typescript
@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

#### Security Best Practices

- JWT guard on all endpoints
- Ownership validation (user can only access self)
- Input validation with DTOs
- No sensitive data exposure

#### Common Pitfalls

- No ownership check ❌
- Missing JWT guard ❌
- Exposing sensitive fields ❌
- No input validation ❌

#### References

- docs/api-contract/user.api.md
- docs/phases/phase-1.3-user-profile.md
