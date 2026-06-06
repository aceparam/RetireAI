import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FinancialProfile } from "./entities/profile.entity";
import { UpsertProfileDto } from "./dto/upsert-profile.dto";

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(FinancialProfile)
    private readonly repo: Repository<FinancialProfile>,
  ) {}

  get(userId: string): Promise<FinancialProfile | null> {
    return this.repo.findOne({ where: { userId } });
  }

  async upsert(userId: string, dto: UpsertProfileDto): Promise<FinancialProfile> {
    const data = dto.data as Record<string, any>;
    const existing = await this.repo.findOne({ where: { userId } });
    const patch = {
      userId,
      data,
      currentAge: dto.currentAge ?? data?.currentAge ?? null,
      retirementAge: dto.retirementAge ?? data?.retirementAge ?? null,
      persona: dto.persona ?? data?.persona ?? null,
    };
    if (existing) {
      await this.repo.update({ id: existing.id }, patch);
      return this.repo.findOneOrFail({ where: { id: existing.id } });
    }
    return this.repo.save(this.repo.create(patch));
  }
}
