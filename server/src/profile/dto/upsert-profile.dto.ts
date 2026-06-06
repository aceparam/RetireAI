import { IsObject, IsOptional, IsInt, IsString, Min, Max } from "class-validator";

export class UpsertProfileDto {
  /** The complete ProfileInputs object from the planning client. */
  @IsObject()
  data: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  currentAge?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  retirementAge?: number;

  @IsOptional()
  @IsString()
  persona?: string;
}
