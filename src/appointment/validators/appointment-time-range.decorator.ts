import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'AppointmentTimeRange', async: false })
export class AppointmentTimeRangeValidator
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as { startAt?: Date; endAt?: Date };
    const { startAt, endAt } = dto;

    if (!(startAt instanceof Date) || isNaN(startAt.getTime())) {
      return false;
    }

    if (!(endAt instanceof Date) || isNaN(endAt.getTime())) {
      return false;
    }

    // BR-7: cannot be created in the past.
    if (startAt.getTime() < Date.now()) {
      return false;
    }

    // BR-6: startAt must be earlier than endAt.
    if (startAt.getTime() >= endAt.getTime()) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Invalid appointment time range';
  }
}

export function IsAppointmentTimeRange(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsAppointmentTimeRange',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: AppointmentTimeRangeValidator,
    });
  };
}

