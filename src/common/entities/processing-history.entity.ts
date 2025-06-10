import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity()
export class ProcessingHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: 'conversion' | 'aggregation' | 'invoice';

  @Column()
  inputFile: string;

  @Column({ nullable: true })
  outputFile: string;

  @Column({ type: 'jsonb', nullable: true })
  details: any; // For storing additional data like commission, etc.

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  processedAt: Date;

  @ManyToOne(() => User, user => user.files)
  user: User;
}