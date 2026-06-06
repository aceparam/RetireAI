import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { FinancialProfile } from "../../profile/entities/profile.entity";
import { Scenario } from "../../scenarios/entities/scenario.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column()
  googleId: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @OneToOne(() => FinancialProfile, (p) => p.user)
  profile: FinancialProfile;

  @OneToMany(() => Scenario, (s) => s.user)
  scenarios: Scenario[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
