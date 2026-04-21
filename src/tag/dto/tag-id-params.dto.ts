import { IsUUID } from 'class-validator';

export class TagIdParamsDto {
  @IsUUID('4')
  id: string;
}
