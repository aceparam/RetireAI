import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";
import { ProfileService } from "./profile.service";
import { UpsertProfileDto } from "./dto/upsert-profile.dto";

@Controller("profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  /** Returns the saved profile, or null if the user hasn't synced one yet. */
  @Get()
  async get(@CurrentUser() user: User) {
    const profile = await this.profile.get(user.id);
    return profile ?? null;
  }

  /** Create or replace the user's financial profile. */
  @Put()
  upsert(@CurrentUser() user: User, @Body() dto: UpsertProfileDto) {
    return this.profile.upsert(user.id, dto);
  }
}
