import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback, Profile } from "passport-google-oauth20";

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>("GOOGLE_CLIENT_ID"),
      clientSecret: config.get<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: `${config.get<string>("API_URL")}/auth/google/callback`,
      scope: ["email", "profile"],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const { id, name, emails, photos } = profile;
    const user: GoogleUser = {
      googleId: id,
      email: emails?.[0]?.value ?? "",
      name: [name?.givenName, name?.familyName].filter(Boolean).join(" ").trim(),
      avatarUrl: photos?.[0]?.value ?? "",
    };
    done(null, user);
  }
}
