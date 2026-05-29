import { TeamRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsUUID,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNotOwner', async: false })
class IsNotOwnerConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    return value !== TeamRole.OWNER;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'role OWNER is not allowed for invitation';
  }
}

export class CreateTeamInvitationRequestDto {
  @IsUUID('4')
  invitedUserId: string;

  @IsOptional()
  @IsEnum(TeamRole, { message: 'role must be one of: OWNER, ADMIN, MEMBER' })
  @Validate(IsNotOwnerConstraint)
  role?: TeamRole;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return value;
  })
  @IsDate()
  expiresAt?: Date;
}
