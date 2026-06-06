import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

/**
 * A user's complete financial profile. The full `ProfileInputs` shape from the
 * frontend is stored as JSONB so the planning engine can evolve without
 * migrations, while a few hot fields are denormalized for querying/analytics.
 */
@Entity("financial_profiles")
export class FinancialProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid", { unique: true })
  userId: string;

  @OneToOne(() => User, (u) => u.profile, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  /** The entire ProfileInputs object from the client. */
  @Column({ type: "jsonb" })
  data: Record<string, unknown>;

  // Denormalized hot fields (kept in sync on upsert) for queries & dashboards.
  @Column({ type: "int", nullable: true })
  currentAge: number;

  @Column({ type: "int", nullable: true })
  retirementAge: number;

  @Column({ type: "varchar", nullable: true })
  persona: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
