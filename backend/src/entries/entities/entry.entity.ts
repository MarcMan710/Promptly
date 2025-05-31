import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ default: 0 })
  wordCount: number;

  @Column({ nullable: true })
  mood: string;

  @ManyToOne(() => User, user => user.entries)
  user: User;

  @ManyToOne(() => Prompt, prompt => prompt.entries)
  prompt: Prompt;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 