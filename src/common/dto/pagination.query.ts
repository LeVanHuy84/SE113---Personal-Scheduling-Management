import { Transform } from "class-transformer";
import { IsOptional, IsInt, Min, Max } from "class-validator";

export class PaginationQuery {
    @IsOptional()
    @Transform(({ value }) =>
        !value ? 1 : Number(value),
    )
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Transform(({ value }) =>
        !value ? 10 : Number(value),
    )
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;
}