// src/tenants/dto/filter-tenants.dto.ts
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterTenantsDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    //@Transform(({ value }) => parseInt(value))
    @Transform(({ value }) => Math.min(parseInt(value), 100)) // máximo 100
    @IsNumber()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    slug?: string;

    @IsOptional()
    @IsString()
    status?: string;
}
