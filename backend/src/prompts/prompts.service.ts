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

  /**
   * Creates a new prompt.
   * @param text - The text of the prompt.
   * @param category - Optional category for the prompt.
   * @param scheduledDate - Optional date for which the prompt is scheduled.
   * @returns The created Prompt entity.
   */
  async create(text: string, category?: string, scheduledDate?: Date): Promise<Prompt> {
    const prompt = this.promptsRepository.create({
      text,
      category,
      scheduledDate,
    });
    return this.promptsRepository.save(prompt);
  }

  /**
   * Retrieves the prompt scheduled for the current day (if unused),
   * otherwise falls back to a random unused prompt.
   * @returns A Promise resolving to the Prompt entity.
   * @throws NotFoundException if no prompts are available.
   */
  async getTodayPrompt(): Promise<Prompt> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const specificPrompt = await this.promptsRepository
      .createQueryBuilder('prompt')
      .where('prompt.scheduledDate = :date', { date: startOfToday })
      .andWhere('prompt.isUsed = false')
      .getOne();

    if (!specificPrompt) {
      // If no prompt is scheduled for today, get a random unused prompt
      return this.getRandomPrompt();
    }

    return specificPrompt;
  }

  /**
   * Retrieves a random unused prompt from the repository.
   * @returns A Promise resolving to a random Prompt entity.
   * @throws NotFoundException if no unused prompts are available.
   */
  async getRandomPrompt(): Promise<Prompt> {
    const prompt = await this.promptsRepository
      .createQueryBuilder('prompt')
      .where('prompt.isUsed = false')
      .orderBy('RANDOM()') // Note: RANDOM() might be database-specific (e.g., SQLite, PostgreSQL). For other DBs, use appropriate random ordering function.
      .getOne();

    if (!prompt) {
      throw new NotFoundException('No available prompts found');
    }

    return prompt;
  }

  /**
   * Marks a specific prompt as used.
   * @param id - The ID of the prompt to mark as used.
   * @returns The updated Prompt entity.
   * @throws NotFoundException if the prompt with the given ID is not found.
   */
  async markAsUsed(id: string): Promise<Prompt> {
    const prompt = await this.promptsRepository.findOne({ where: { id } });
    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    prompt.isUsed = true;
    return this.promptsRepository.save(prompt);
  }

  /**
   * Retrieves a history of recently used prompts.
   * @param limit - The maximum number of prompts to retrieve (defaults to 10).
   * @returns A Promise resolving to an array of used Prompt entities.
   */
  async getPromptHistory(limit: number = 10): Promise<Prompt[]> {
    return this.promptsRepository.find({
      where: { isUsed: true },
      order: { scheduledDate: 'DESC' },
      take: limit,
    });
  }
} 