import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { GoogleUser } from "./strategies/google.strategy";
import { User } from "../users/entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  /** Find-or-create the user behind a Google identity, then mint a JWT. */
  async loginWithGoogle(googleUser: GoogleUser): Promise<{ token: string; user: User }> {
    const user = await this.users.findOrCreateFromGoogle(googleUser);
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return { token, user };
  }
}
