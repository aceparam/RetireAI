import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FinancialProfile } from "./entities/profile.entity";
import { ProfileService } from "./profile.service";
import { ProfileController } from "./profile.controller";

@Module({
  imports: [TypeOrmModule.forFeature([FinancialProfile])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
