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
    const dto = args.object as { startTime?: Date; endTime?: Date };
    const { startTime, endTime } = dto;

    if (!(startTime instanceof Date) || isNaN(startTime.getTime())) {
      return false;
    }

    if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
      return false;
    }

    // BR-7: cannot be created in the past.
    if (startTime.getTime() < Date.now()) {
      return false;
    }

    // BR-6: startTime must be earlier than endTime.
    if (startTime.getTime() >= endTime.getTime()) {
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

