import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, password: string, name: string): Promise<User> {
    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateStreak(userId: string): Promise<User> {
    const user = await this.findById(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!user.lastEntryDate) {
      user.streak = 1;
    } else {
      const lastEntry = new Date(user.lastEntryDate);
      lastEntry.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((today.getTime() - lastEntry.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        user.streak += 1;
      } else if (diffDays > 1) {
        user.streak = 1;
      }
    }

    user.lastEntryDate = today;
    return this.usersRepository.save(user);
  }

  async getStats(userId: string): Promise<{ streak: number; totalEntries: number; totalWords: number }> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.entries', 'entries')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalWords = user.entries.reduce((sum, entry) => sum + entry.wordCount, 0);

    return {
      streak: user.streak,
      totalEntries: user.entries.length,
      totalWords,
    };
  }
} 