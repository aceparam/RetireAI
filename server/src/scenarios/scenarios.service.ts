import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Scenario } from "./entities/scenario.entity";
import { CreateScenarioDto } from "./dto/create-scenario.dto";

@Injectable()
export class ScenariosService {
  constructor(
    @InjectRepository(Scenario)
    private readonly repo: Repository<Scenario>,
  ) {}

  list(userId: string): Promise<Scenario[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: "DESC" } });
  }

  create(userId: string, dto: CreateScenarioDto): Promise<Scenario> {
    return this.repo.save(this.repo.create({ userId, name: dto.name, profile: dto.profile }));
  }

  async remove(userId: string, id: string): Promise<{ deleted: true }> {
    const result = await this.repo.delete({ id, userId });
    if (!result.affected) throw new NotFoundException("Scenario not found");
    return { deleted: true };
  }
}
