export class UserProfileResponseDto {
  id!: string;
  email!: string;
  displayName!: string | null;
  timezone!: string;
  createdAt!: Date;
  updatedAt?: Date;
}
