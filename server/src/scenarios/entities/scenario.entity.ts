import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

/** A saved snapshot of a `ProfileInputs` the user wants to compare later. */
@Entity("scenarios")
export class Scenario {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column("uuid")
  userId: string;

  @ManyToOne(() => User, (u) => u.scenarios, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  name: string;

  /** The ProfileInputs snapshot. */
  @Column({ type: "jsonb" })
  profile: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}
