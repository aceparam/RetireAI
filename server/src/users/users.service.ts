import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { GoogleUser } from "../auth/strategies/google.strategy";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findOrCreateFromGoogle(g: GoogleUser): Promise<User> {
    let user = await this.repo.findOne({ where: { googleId: g.googleId } });
    if (user) {
      // Keep profile photo / name fresh on each login.
      user.name = g.name || user.name;
      user.avatarUrl = g.avatarUrl || user.avatarUrl;
      return this.repo.save(user);
    }
    // Link by email if the account pre-exists from another flow.
    user = await this.repo.findOne({ where: { email: g.email } });
    if (user) {
      user.googleId = g.googleId;
      user.name = user.name || g.name;
      user.avatarUrl = user.avatarUrl || g.avatarUrl;
      return this.repo.save(user);
    }
    return this.repo.save(
      this.repo.create({
        googleId: g.googleId,
        email: g.email,
        name: g.name,
        avatarUrl: g.avatarUrl,
      }),
    );
  }
}
