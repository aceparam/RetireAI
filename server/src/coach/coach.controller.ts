import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CoachService } from "./coach.service";
import { AskCoachDto } from "./dto/ask-coach.dto";

@Controller("coach")
@UseGuards(JwtAuthGuard)
export class CoachController {
  constructor(private readonly coach: CoachService) {}

  /** Whether the generative (Claude-powered) coach is available. */
  @Get("status")
  status() {
    return { available: this.coach.available };
  }

  /** Ask the AI coach a question, grounded in the user's plan figures. */
  @Post()
  ask(@Body() dto: AskCoachDto) {
    return this.coach.ask(dto);
  }
}
