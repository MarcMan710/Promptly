import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Entry } from '../../entries/entities/entry.entity';

@Entity('prompts')
export class Prompt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'date', nullable: true })
  scheduledDate: Date;

  @Column({ default: false })
  isUsed: boolean;

  @OneToMany(() => Entry, entry => entry.prompt)
  entries: Entry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 