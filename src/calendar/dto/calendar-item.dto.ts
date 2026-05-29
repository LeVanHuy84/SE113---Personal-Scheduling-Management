export enum CalendarItemType {
  PERSONAL = 'PERSONAL',
  TEAM = 'TEAM',
}

export class CalendarItemDto {
  id: string;
  type: CalendarItemType;
  title: string;
  startAt: Date;
  endAt: Date;
  teamId: string | null;
}

export class CalendarResponseDto {
  items: CalendarItemDto[];
}
