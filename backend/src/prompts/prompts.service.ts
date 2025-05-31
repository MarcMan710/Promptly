import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt } from './entities/prompt.entity';

@Injectable()
export class PromptsService {
  constructor(
    @InjectRepository(Prompt)
    private promptsRepository: Repository<Prompt>,
  ) {}

  async create(text: string, category?: string, scheduledDate?: Date): Promise<Prompt> {
    const prompt = this.promptsRepository.create({
      text,
      category,
      scheduledDate,
    });
    return this.promptsRepository.save(prompt);
  }

  async getTodayPrompt(): Promise<Prompt> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prompt = await this.promptsRepository
      .createQueryBuilder('prompt')
      .where('prompt.scheduledDate = :today', { today })
      .andWhere('prompt.isUsed = false')
      .getOne();

    if (!prompt) {
      // If no prompt is scheduled for today, get a random unused prompt
      return this.getRandomPrompt();
    }

    return prompt;
  }

  async getRandomPrompt(): Promise<Prompt> {
    const prompt = await this.promptsRepository
      .createQueryBuilder('prompt')
      .where('prompt.isUsed = false')
      .orderBy('RANDOM()')
      .getOne();

    if (!prompt) {
      throw new NotFoundException('No available prompts found');
    }

    return prompt;
  }

  async markAsUsed(id: string): Promise<Prompt> {
    const prompt = await this.promptsRepository.findOne({ where: { id } });
    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    prompt.isUsed = true;
    return this.promptsRepository.save(prompt);
  }

  async getPromptHistory(limit: number = 10): Promise<Prompt[]> {
    return this.promptsRepository.find({
      where: { isUsed: true },
      order: { scheduledDate: 'DESC' },
      take: limit,
    });
  }
} 