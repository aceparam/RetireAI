import { Controller, Get, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { GoogleAuthGuard } from "./guards/google-auth.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { GoogleUser } from "./strategies/google.strategy";
import { User } from "../users/entities/user.entity";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  /** Step 1 — kick off the Google OAuth consent flow. */
  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleAuth(): void {
    // Guard redirects to Google; nothing to do here.
  }

  /** Step 2 — Google redirects back here; issue a JWT and bounce to the SPA. */
  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: { user: GoogleUser }, @Res() res: Response): Promise<void> {
    const { token } = await this.auth.loginWithGoogle(req.user);
    const frontend = this.config.get<string>("FRONTEND_URL");
    res.redirect(`${frontend}/auth/callback?token=${encodeURIComponent(token)}`);
  }

  /** Returns the currently authenticated user. */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }
}
