import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserPrincipal } from '../interfaces/current-user.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPrincipal => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: CurrentUserPrincipal }>();
    return request.user;
  },
);
