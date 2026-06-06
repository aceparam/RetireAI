import { IsObject, IsString, MaxLength, MinLength } from "class-validator";

export class CreateScenarioDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  /** The ProfileInputs snapshot to persist. */
  @IsObject()
  profile: Record<string, unknown>;
}
