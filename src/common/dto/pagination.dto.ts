export class PaginationResponseDto<T> {
    page: number;
    limit: number;
    items: T;
    total: number;
}