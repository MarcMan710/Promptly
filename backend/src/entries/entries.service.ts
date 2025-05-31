import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entry } from './entities/entry.entity';
import { UsersService } from '../users/users.service';
import { PromptsService } from '../prompts/prompts.service';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(Entry)
    private entriesRepository: Repository<Entry>,
    private usersService: UsersService,
    private promptsService: PromptsService,
  ) {}

  async create(userId: string, content: string, promptId: string, mood?: string): Promise<Entry> {
    const user = await this.usersService.findById(userId);
    const prompt = await this.promptsService.markAsUsed(promptId);

    const wordCount = content.trim().split(/\s+/).length;
    const entry = this.entriesRepository.create({
      content,
      date: new Date(),
      wordCount,
      mood,
      user,
      prompt,
    });

    const savedEntry = await this.entriesRepository.save(entry);
    await this.usersService.updateStreak(userId);

    return savedEntry;
  }

  async findByUser(userId: string, date?: Date): Promise<Entry[]> {
    const query = this.entriesRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.prompt', 'prompt')
      .where('entry.user.id = :userId', { userId });

    if (date) {
      query.andWhere('entry.date = :date', { date });
    }

    return query.orderBy('entry.date', 'DESC').getMany();
  }

  async findById(id: string): Promise<Entry> {
    const entry = await this.entriesRepository.findOne({
      where: { id },
      relations: ['prompt', 'user'],
    });

    if (!entry) {
      throw new NotFoundException('Entry not found');
    }

    return entry;
  }

  async update(id: string, content: string, mood?: string): Promise<Entry> {
    const entry = await this.findById(id);
    const wordCount = content.trim().split(/\s+/).length;

    entry.content = content;
    entry.wordCount = wordCount;
    if (mood) {
      entry.mood = mood;
    }

    return this.entriesRepository.save(entry);
  }

  async delete(id: string): Promise<void> {
    const entry = await this.findById(id);
    await this.entriesRepository.remove(entry);
  }

  async getStats(userId: string): Promise<{
    totalEntries: number;
    totalWords: number;
    averageWordsPerEntry: number;
    entriesByMood: Record<string, number>;
  }> {
    const entries = await this.findByUser(userId);
    
    const totalWords = entries.reduce((sum, entry) => sum + entry.wordCount, 0);
    const entriesByMood = entries.reduce((acc, entry) => {
      const mood = entry.mood || 'unknown';
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEntries: entries.length,
      totalWords,
      averageWordsPerEntry: entries.length ? totalWords / entries.length : 0,
      entriesByMood,
    };
  }
} 