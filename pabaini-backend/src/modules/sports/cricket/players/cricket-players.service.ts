import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CricketPlayerProfile } from '../entities/cricket-player-profile.entity';
import { CreateCricketPlayerProfileDto } from './dto/create-cricket-player-profile.dto';
import { UpdateCricketPlayerProfileDto } from './dto/update-cricket-player-profile.dto';
import { BowlingArm, BowlingType } from '../enums/cricket.enums';

@Injectable()
export class CricketPlayersService {
  constructor(
    @InjectRepository(CricketPlayerProfile)
    private readonly cricketPlayerProfileRepository: Repository<CricketPlayerProfile>,
  ) {}

  async createProfile(userId: number, dto: CreateCricketPlayerProfileDto): Promise<CricketPlayerProfile> {
    // Check if profile already exists for this user
    const existing = await this.cricketPlayerProfileRepository.findOne({
      where: { user_id: userId },
    });
    if (existing) {
      throw new ConflictException('Cricket player profile already exists');
    }

    // Validate: if bowling_arm is none, bowling_type must also be none
    if (dto.bowling_arm === BowlingArm.NONE && dto.bowling_type !== BowlingType.NONE) {
      throw new BadRequestException('If bowling arm is none, bowling type must also be none');
    }

    const profile = this.cricketPlayerProfileRepository.create({
      user_id: userId,
      ...dto,
    });

    await this.cricketPlayerProfileRepository.save(profile);

    return this.getMyProfile(userId);
  }

  async getMyProfile(userId: number): Promise<CricketPlayerProfile> {
    const profile = await this.cricketPlayerProfileRepository.findOne({
      where: { user_id: userId },
      relations: { user: true },
      select: {
        id: true,
        role: true,
        batting_hand: true,
        bowling_arm: true,
        bowling_type: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        user: {
          id: true,
          name: true,
          avatar_url: true,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Cricket player profile not found');
    }

    delete (profile as any).user_id;
    return profile;
  }

  async findByUserIdOrNull(userId: number): Promise<CricketPlayerProfile | null> {
    return this.cricketPlayerProfileRepository.findOne({
      where: { user_id: userId },
    });
  }

  async updateMyProfile(userId: number, dto: UpdateCricketPlayerProfileDto): Promise<CricketPlayerProfile> {
    const profile = await this.getMyProfile(userId);

    // Merge existing values with incoming update to validate consistency
    const mergedArm = dto.bowling_arm !== undefined ? dto.bowling_arm : profile.bowling_arm;
    const mergedType = dto.bowling_type !== undefined ? dto.bowling_type : profile.bowling_type;

    if (mergedArm === BowlingArm.NONE && mergedType !== BowlingType.NONE) {
      throw new BadRequestException('If bowling arm is none, bowling type must also be none');
    }

    await this.cricketPlayerProfileRepository.update(profile.id, dto);

    return this.getMyProfile(userId);
  }

  async getPlayerById(id: number): Promise<CricketPlayerProfile> {
    const profile = await this.cricketPlayerProfileRepository.findOne({
      where: { id },
      relations: { user: true },
      select: {
        id: true,
        role: true,
        batting_hand: true,
        bowling_arm: true,
        bowling_type: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        user: {
          id: true,
          name: true,
          avatar_url: true,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Cricket player profile not found');
    }

    delete (profile as any).user_id;
    return profile;
  }

  async getAllPlayers(page: number, limit: number): Promise<{ data: CricketPlayerProfile[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const skip = (page - 1) * limit;

    const [profiles, total] = await this.cricketPlayerProfileRepository.findAndCount({
      where: { is_active: true },
      relations: { user: true },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
      select: {
        id: true,
        role: true,
        batting_hand: true,
        bowling_arm: true,
        bowling_type: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        user: {
          id: true,
          name: true,
          avatar_url: true,
        },
      },
    });

    profiles.forEach(profile => {
      delete (profile as any).user_id;
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: profiles,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
