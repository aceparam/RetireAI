import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "../users/entities/user.entity";
import { ScenariosService } from "./scenarios.service";
import { CreateScenarioDto } from "./dto/create-scenario.dto";

@Controller("scenarios")
@UseGuards(JwtAuthGuard)
export class ScenariosController {
  constructor(private readonly scenarios: ScenariosService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.scenarios.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateScenarioDto) {
    return this.scenarios.create(user.id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: User, @Param("id") id: string) {
    return this.scenarios.remove(user.id, id);
  }
}
