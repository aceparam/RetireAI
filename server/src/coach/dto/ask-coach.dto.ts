import { IsArray, IsObject, IsOptional, IsString, MaxLength, ValidateNested, IsIn } from "class-validator";
import { Type } from "class-transformer";

export class CoachTurnDto {
  @IsIn(["user", "coach"])
  role: "user" | "coach";

  @IsString()
  @MaxLength(4000)
  text: string;
}

export class AskCoachDto {
  @IsString()
  @MaxLength(1000)
  question: string;

  /** Precomputed plan figures from the RetireAI engine — used as ground truth. */
  @IsObject()
  context: Record<string, unknown>;

  /** Prior conversation turns (most recent last). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoachTurnDto)
  history?: CoachTurnDto[];
}
