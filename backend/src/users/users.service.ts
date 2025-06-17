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

  /**
   * Creates a new user.
   * @param email - User's email.
   * @param password - User's raw password.
   * @param name - User's name.
   * @returns The created User entity.
   * @throws ConflictException if email already exists.
   */
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

  private _getStartOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  /**
   * Finds a user by their email.
   * @param email - The email of the user to find.
   * @returns The User entity.
   * @throws NotFoundException if user with the email is not found.
   */
  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Finds a user by their ID.
   * @param id - The ID of the user to find.
   * @returns The User entity.
   * @throws NotFoundException if user with the ID is not found.
   */
  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  /**
   * Updates the daily streak for a user.
   * If the user made an entry the previous day, the streak is incremented.
   * If there's a gap of more than one day, the streak is reset to 1.
   * If it's the user's first entry, streak is set to 1.
   * The user's last entry date is updated to the current day.
   * @param userId - The ID of the user whose streak is to be updated.
   * @returns The updated User entity.
   */
  async updateStreak(userId: string): Promise<User> {
    const user = await this.findById(userId);
    const todayNormalized = this._getStartOfDay(new Date());

    if (!user.lastEntryDate) {
      // First entry
      user.streak = 1;
    } else {
      const lastEntryNormalized = this._getStartOfDay(new Date(user.lastEntryDate));
      const diffTime = todayNormalized.getTime() - lastEntryNormalized.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day entry
        user.streak += 1;
      } else if (diffDays > 1) {
        // Gap in entries, reset streak
        user.streak = 1;
      }
      // If diffDays is 0 (another entry on the same day), streak remains unchanged.
      // If diffDays is negative (last entry in future), streak also remains unchanged here.
    }

    user.lastEntryDate = todayNormalized; // Update last entry date to today (normalized)
    return this.usersRepository.save(user);
  }

  /**
   * Retrieves statistics for a user, including streak, total entries, and total words written.
   * @param userId - The ID of the user for whom to retrieve stats.
   * @returns An object containing streak, totalEntries, and totalWords.
   * @throws NotFoundException if the user is not found.
   */
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